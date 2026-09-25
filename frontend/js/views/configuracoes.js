/* ===== EMAII :: Configurações =====
 * Tela aberta pelo botão "Configurações" da barra lateral (disponível em todos os perfis).
 * Somente preferências visuais ficam no localStorage deste navegador; os dados acadêmicos ficam no MySQL.
 */
const PREFS_KEY = 'emaii-prefs-v1'

const Preferencias = {
  valores: { tamanhoTexto: 'normal' }, // 'normal' | 'grande'

  carregar() {
    try {
      const salvo = JSON.parse(window.localStorage.getItem(PREFS_KEY) || '{}')
      if (salvo.tamanhoTexto === 'grande') this.valores.tamanhoTexto = 'grande'
    } catch {
      /* preferências corrompidas: usa o padrão */
    }
    this.aplicar()
  },

  definir(chave, valor) {
    this.valores[chave] = valor
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(this.valores))
    } catch {
      /* sem armazenamento disponível: vale só nesta sessão */
    }
    this.aplicar()
  },

  aplicar() {
    document.documentElement.setAttribute('data-tamanho-texto', this.valores.tamanhoTexto)
  },
}

const ConfiguracoesPage = {
  titulo: 'Configurações',
  state: { modalReset: false, aviso: '' },

  modalResetHtml() {
    if (!this.state.modalReset) return ''
    const corpo = `
      <p class="config-texto">A restauração completa dos dados de demonstração é uma operação administrativa do banco MySQL.</p>
      <p class="config-texto"><strong>Use o SQL documentado no README e faça um backup antes.</strong></p>
      <div class="form-actions">
        <button class="btn-secondary" data-action="fechar-modal-config">Cancelar</button>
        <button class="primary-button" data-action="confirmar-reset">Restaurar dados</button>
      </div>`
    return modalWrap({ title: 'Restaurar dados de demonstração', bodyHtml: corpo, closeAction: 'fechar-modal-config' })
  },

  html() {
    const session = Store.session
    const tamanho = Preferencias.valores.tamanhoTexto
    const aviso = this.state.aviso
    this.state.aviso = '' // o aviso aparece uma única vez

    return `
      ${sectionHeading({ title: 'Configurações', subtitle: 'Gerencie sua conta e as preferências deste navegador.' })}
      ${aviso ? `<div class="config-aviso" role="status">${escapeHtml(aviso)}</div>` : ''}
      <div class="info-card-grid config-grid">
        <div class="info-block">
          <h3>Minha conta</h3>
          <div class="info-line"><span>Nome</span><strong>${escapeHtml(session?.nome ?? '—')}</strong></div>
          <div class="info-line"><span>E-mail</span><strong>${escapeHtml(session?.email ?? '—')}</strong></div>
          <div class="info-line"><span>Perfil</span><strong>${session ? ROLE_LABEL[session.role] : '—'}</strong></div>
          <div class="config-acoes"><button class="outline-button" data-action="sair">${icon('LogOut', 'style="width:14px"')} Sair da conta</button></div>
        </div>

        <div class="info-block">
          <h3>Aparência</h3>
          <p class="config-texto">Tamanho do texto</p>
          <div class="selector-pills config-pills">
            <button class="selector-pill ${tamanho === 'normal' ? 'active' : ''}" data-tamanho="normal" aria-pressed="${tamanho === 'normal'}">Normal</button>
            <button class="selector-pill ${tamanho === 'grande' ? 'active' : ''}" data-tamanho="grande" aria-pressed="${tamanho === 'grande'}">Grande</button>
          </div>
          <p class="config-nota">Aumenta o conteúdo das telas. A escolha fica salva neste navegador.</p>
        </div>

        <div class="info-block">
          <h3>Ajuda</h3>
          <p class="config-texto">Ficou com alguma dúvida sobre como usar o EMAII? Converse com o suporte.</p>
          <div class="config-acoes"><button class="primary-button" data-nav="suporte">${icon('Sparkles')} Falar com o suporte</button></div>
        </div>

        <div class="info-block">
          <h3>Dados de demonstração</h3>
          <p class="config-texto">Os dados do sistema ficam salvos no banco MySQL. Consulte o README para restaurar o ambiente com segurança.</p>
          <div class="config-acoes"><button class="btn-secondary btn-perigo" data-action="abrir-reset">Restaurar dados de demonstração</button></div>
        </div>
      </div>
      ${this.modalResetHtml()}`
  },

  bind(root, view) {
    root.querySelectorAll('[data-tamanho]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Preferencias.definir('tamanhoTexto', btn.getAttribute('data-tamanho'))
        view.render()
      })
    })

    root.querySelectorAll('[data-action="abrir-reset"]').forEach((btn) => {
      btn.addEventListener('click', () => { this.state.modalReset = true; view.render() })
    })
    root.querySelectorAll('[data-action="fechar-modal-config"]').forEach((el) => {
      el.addEventListener('click', () => { this.state.modalReset = false; view.render() })
    })
    root.querySelectorAll('[data-action="confirmar-reset"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.state.modalReset = false
        this.state.aviso = 'A restauração dos dados deve ser feita pelo SQL de implantação no phpMyAdmin. Nenhum dado foi apagado pelo navegador.'
        view.render()
      })
    })
  },
}
