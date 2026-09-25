/* ===== EMAII :: Login real via PHP ===== */
const PERFIS = [
  { role: 'diretor', label: 'Diretor', descricao: 'Visão geral da instituição', icon: 'ShieldCheck' },
  { role: 'coordenador', label: 'Coordenador', descricao: 'Alunos, turmas e professores', icon: 'UserCog' },
  { role: 'professor', label: 'Professor', descricao: 'Diário de classe', icon: 'BookUser' },
  { role: 'aluno', label: 'Aluno', descricao: 'Minhas informações', icon: 'GraduationCap' },
  { role: 'responsavel', label: 'Pai / Responsável', descricao: 'Acompanhar meu filho', icon: 'Users' },
]

const LoginView = {
  state: { role: null, email: '', senha: '', erro: '', enviando: false },

  escolherRole(r) { this.state.role = r; this.state.erro = ''; this.render() },

  async entrar() {
    const { email, senha, role } = this.state
    if (!role) { this.state.erro = 'Selecione seu perfil para continuar.'; this.render(); return }
    if (!email.trim() || !senha) { this.state.erro = 'Informe seu e-mail e sua senha.'; this.render(); return }
    this.state.enviando = true; this.state.erro = ''; this.render()
    try { await Store.login(email.trim(), senha, role); App.goToPainel() }
    catch (error) { this.state.erro = error.message; this.state.enviando = false; this.render() }
  },

  render() {
    const perfilAtivo = PERFIS.find((p) => p.role === this.state.role)
    const roleGridHtml = PERFIS.map((perfil) => `
      <button class="role-card ${this.state.role === perfil.role ? 'role-card-active' : ''}" data-role="${perfil.role}">
        <span class="role-card-icon">${icon(perfil.icon)}</span><span class="role-card-copy"><strong>${perfil.label}</strong><small>${perfil.descricao}</small></span>
      </button>`).join('')
    const formHtml = this.state.role ? `
      <div class="login-user-select">
        <label for="login-email">E-mail</label>
        <input id="login-email" type="email" autocomplete="username" placeholder="seu@email.com" value="${escapeHtml(this.state.email)}" />
        <label for="login-senha">Senha</label>
        <input id="login-senha" type="password" autocomplete="current-password" placeholder="Sua senha" value="${escapeHtml(this.state.senha)}" />
        ${this.state.erro ? `<p class="login-erro">${escapeHtml(this.state.erro)}</p>` : ''}
        <button class="login-button" data-action="entrar" ${this.state.enviando ? 'disabled' : ''}>${icon('LogIn')} ${this.state.enviando ? 'Entrando...' : `Entrar como ${perfilAtivo?.label ?? ''}`}</button>
      </div>` : ''

    document.getElementById('app-root').innerHTML = `
      <div class="login-shell screen"><section class="login-hero"><div class="login-hero-inner">
        <img src="assets/logo.png" alt="EMAII" class="login-logo" />
        <h1>Gestão escolar inteligente, em um só lugar.</h1>
        <p>Alunos, professores, coordenação, direção e famílias conectados para acompanhar o dia a dia da escola.</p>
        <ul class="login-hero-list"><li>${icon('Sparkles')} Frequência e notas em tempo real</li><li>${icon('Sparkles')} Ocorrências e comunicados centralizados</li><li>${icon('Sparkles')} Um painel para cada perfil da comunidade escolar</li></ul>
      </div></section><section class="login-panel"><div class="login-panel-inner">
        <p class="login-eyebrow">ACESSO AO SISTEMA</p><h2>Entrar no EMAII</h2><p class="login-subtitle">Selecione seu perfil e informe suas credenciais.</p>
        <div class="role-grid">${roleGridHtml}</div>${formHtml}
        <p class="login-footnote">Acesso protegido por sessão PHP. Em ambiente de teste, use os usuários documentados.</p>
      </div></section></div>`
    this.bindEvents()
  },

  bindEvents() {
    const root = document.getElementById('app-root')
    root.querySelectorAll('[data-role]').forEach((btn) => btn.addEventListener('click', () => this.escolherRole(btn.getAttribute('data-role'))))
    const email = document.getElementById('login-email'); if (email) email.addEventListener('input', (e) => { this.state.email = e.target.value })
    const senha = document.getElementById('login-senha'); if (senha) senha.addEventListener('input', (e) => { this.state.senha = e.target.value })
    const entrar = root.querySelector('[data-action="entrar"]'); if (entrar) entrar.addEventListener('click', () => this.entrar())
  },
}
