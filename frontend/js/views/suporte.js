/* ===== EMAII :: Suporte (chat com IA) =====
 * Esta tela NÃO fala com o Gemini diretamente. Ela chama a ação chat da API PHP,
 * que guarda a GEMINI_API_KEY em segredo. Nenhuma chave existe neste arquivo.
 * É exibida dentro do layout normal (barra lateral + topo) de qualquer perfil.
 */
const SUPORTE_MAX_CHARS = 1000
const SUPORTE_TIMEOUT_MS = 40000

const SUPORTE_SUGESTOES = {
  diretor: ['O que posso ver na Visão geral?', 'Onde vejo os comunicados?', 'Como funciona o Configurações?'],
  coordenador: ['Como cadastro um aluno?', 'Como publico um comunicado?', 'Como vejo os alunos com muitas faltas?'],
  professor: ['Como registro a presença dos alunos?', 'Como lanço as notas?', 'Como registro uma ocorrência?'],
  aluno: ['Onde vejo minhas notas?', 'Como consulto minha frequência?', 'Onde vejo as atividades da turma?'],
  responsavel: ['Como acompanho meu filho?', 'Onde vejo as ocorrências?', 'Como troco de filho na tela?'],
}

/** Converte a resposta da IA em HTML seguro (escapa tudo antes; só aceita negrito e listas simples). */
function formatarRespostaSuporte(texto) {
  const negrito = (t) => t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  let html = ''
  let lista = null // 'ul' | 'ol' | null
  const fecharLista = () => {
    if (lista) { html += `</${lista}>`; lista = null }
  }
  const abrirLista = (tipo) => {
    if (lista !== tipo) { fecharLista(); html += `<${tipo}>`; lista = tipo }
  }

  escapeHtml(texto).split(/\r?\n/).forEach((bruta) => {
    const linha = bruta.trim().replace(/^#{1,6}\s+/, '')
    let m
    if (linha === '') {
      fecharLista()
    } else if ((m = linha.match(/^[-*•]\s+(.*)$/))) {
      abrirLista('ul')
      html += `<li>${negrito(m[1])}</li>`
    } else if ((m = linha.match(/^\d+[.)]\s+(.*)$/))) {
      abrirLista('ol')
      html += `<li>${negrito(m[1])}</li>`
    } else {
      fecharLista()
      html += `<p>${negrito(linha)}</p>`
    }
  })
  fecharLista()
  return html
}

const SuporteChat = {
  mensagens: [], // { tipo: 'user' | 'assistant' | 'erro', texto }
  rascunho: '',
  enviando: false,
  conversaId: 0, // muda ao limpar/sair, para descartar respostas que chegam atrasadas

  reset() {
    this.mensagens = []
    this.rascunho = ''
    this.enviando = false
    this.conversaId += 1
  },

  /** Mensagens (sem erros) no formato que o backend espera. */
  historico() {
    return this.mensagens
      .filter((m) => m.tipo === 'user' || m.tipo === 'assistant')
      .map((m) => ({ papel: m.tipo, texto: m.texto }))
  },

  async pedirResposta() {
    if (window.location.protocol === 'file:') {
      throw new Error('O suporte precisa que o frontend seja aberto por HTTP, por exemplo, http://localhost/emaii/frontend/.')
    }

    const controlador = new AbortController()
    const timer = setTimeout(() => controlador.abort(), SUPORTE_TIMEOUT_MS)
    try {
      const dados = await Store.request('chat', {
        method: 'POST',
        body: JSON.stringify({ perfil: Store.session?.role ?? null, mensagens: this.historico() }),
        signal: controlador.signal,
      })
      if (!dados.resposta) throw new Error('O suporte não retornou uma resposta. Tente novamente.')
      return dados.resposta
    } catch (erro) {
      if (erro.name === 'AbortError') throw new Error('O suporte demorou demais para responder. Tente novamente.')
      if (erro instanceof TypeError) throw new Error('Não foi possível conectar ao servidor do suporte. Verifique sua conexão e se o servidor do EMAII está em execução.')
      throw erro
    } finally {
      clearTimeout(timer)
    }
  },

  async enviar(textoBruto) {
    const texto = String(textoBruto ?? '').trim().slice(0, SUPORTE_MAX_CHARS)
    if (!texto || this.enviando) return

    const conversa = this.conversaId
    this.mensagens.push({ tipo: 'user', texto })
    this.rascunho = ''
    this.enviando = true
    this.atualizarDom()

    try {
      const resposta = await this.pedirResposta()
      if (conversa !== this.conversaId) return
      this.mensagens.push({ tipo: 'assistant', texto: resposta })
    } catch (erro) {
      if (conversa !== this.conversaId) return
      this.mensagens.push({ tipo: 'erro', texto: erro.message })
    } finally {
      if (conversa === this.conversaId) {
        this.enviando = false
        this.atualizarDom()
        const input = document.getElementById('chat-input')
        if (input) input.focus()
      }
    }
  },

  // ----- Renderização -----
  balaoBot(conteudoHtml, extraClasse = '') {
    return `<div class="chat-msg chat-msg-bot"><div class="chat-avatar">${icon('Sparkles')}</div><div class="chat-bubble ${extraClasse}">${conteudoHtml}</div></div>`
  },

  mensagensHtml() {
    const role = Store.session?.role
    let html = ''

    if (this.mensagens.length === 0) {
      html += this.balaoBot('<p>Olá! Sou o suporte do EMAII. Posso te ajudar a entender as telas e a usar o sistema. Sobre o que você quer saber?</p>')
      const sugestoes = SUPORTE_SUGESTOES[role] ?? []
      if (sugestoes.length) {
        html += `<div class="chat-sugestoes">${sugestoes.map((s) => `<button type="button" class="chat-chip" data-sugestao="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}</div>`
      }
    }

    this.mensagens.forEach((m) => {
      if (m.tipo === 'user') {
        html += `<div class="chat-msg chat-msg-user"><div class="chat-bubble">${escapeHtml(m.texto).replace(/\n/g, '<br>')}</div></div>`
      } else if (m.tipo === 'erro') {
        html += this.balaoBot(`<p>${escapeHtml(m.texto)}</p>`, 'chat-bubble-erro')
      } else {
        html += this.balaoBot(formatarRespostaSuporte(m.texto))
      }
    })

    if (this.enviando) {
      html += this.balaoBot('<span class="chat-digitando" aria-label="O suporte está digitando"><i></i><i></i><i></i></span>')
    }
    return html
  },

  /** Atualiza só a lista de mensagens (mantém o foco e o que a pessoa está digitando). */
  atualizarDom() {
    const lista = document.getElementById('chat-messages')
    if (!lista) return
    lista.innerHTML = this.mensagensHtml()
    lista.scrollTop = lista.scrollHeight
    const botao = document.getElementById('chat-send')
    if (botao) botao.disabled = this.enviando
  },

  enviarDoInput() {
    const input = document.getElementById('chat-input')
    if (!input || this.enviando || !input.value.trim()) return
    const texto = input.value
    input.value = ''
    input.style.height = ''
    this.enviar(texto)
  },
}

const SuportePage = {
  titulo: 'Suporte EMAII',

  html() {
    const novaConversa = SuporteChat.mensagens.length > 0
      ? `<button class="btn-secondary" data-action="nova-conversa">Nova conversa</button>`
      : ''

    return `
      ${sectionHeading({
        title: 'Suporte EMAII',
        subtitle: 'Tire dúvidas sobre como usar o sistema. O assistente responde apenas sobre o EMAII.',
        actionHtml: novaConversa,
      })}
      <article class="panel chat-panel">
        <div class="chat-messages" id="chat-messages" role="log" aria-live="polite">${SuporteChat.mensagensHtml()}</div>
        <div class="chat-composer">
          <textarea id="chat-input" rows="1" maxlength="${SUPORTE_MAX_CHARS}" placeholder="Digite sua dúvida sobre o EMAII..." aria-label="Mensagem para o suporte">${escapeHtml(SuporteChat.rascunho)}</textarea>
          <button type="button" class="primary-button chat-send" id="chat-send" ${SuporteChat.enviando ? 'disabled' : ''}>${icon('Send')} Enviar</button>
        </div>
        <p class="chat-disclaimer">O assistente usa inteligência artificial e pode cometer erros. Ele não tem acesso aos seus dados nem altera nada no sistema.</p>
      </article>`
  },

  bind(root, view) {
    const lista = root.querySelector('#chat-messages')
    const input = root.querySelector('#chat-input')
    const botao = root.querySelector('#chat-send')
    if (!lista || !input || !botao) return

    lista.scrollTop = lista.scrollHeight

    lista.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-sugestao]')
      if (chip) SuporteChat.enviar(chip.getAttribute('data-sugestao'))
    })

    const ajustarAltura = () => {
      input.style.height = 'auto'
      input.style.height = `${Math.min(input.scrollHeight, 120)}px`
    }
    input.addEventListener('input', () => {
      SuporteChat.rascunho = input.value
      ajustarAltura()
    })
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault()
        SuporteChat.enviarDoInput()
      }
    })
    botao.addEventListener('click', () => SuporteChat.enviarDoInput())
    if (SuporteChat.rascunho) ajustarAltura()

    const nova = root.querySelector('[data-action="nova-conversa"]')
    if (nova) nova.addEventListener('click', () => { SuporteChat.reset(); view.render() })
  },
}
