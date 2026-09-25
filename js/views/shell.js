/* ===== EMAII :: Shell (layout comum dos painéis) ===== */
const LOGO_URL = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-V6g9L6VXkcMumOTVLmk1BNlwcszPOO.png'

const ROLE_LABEL = {
  diretor: 'Diretor',
  coordenador: 'Coordenador(a)',
  professor: 'Professor(a)',
  aluno: 'Aluno',
  responsavel: 'Responsável',
}

/**
 * Constrói o HTML da casca (sidebar + topbar) em torno do conteúdo da página.
 * view precisa expor: navItems, state.active, state.mobileOpen, state.menuOpen
 */
/* Páginas que existem em TODOS os perfis e ficam fora do menu (abertas pela barra lateral). */
function paginaEspecial(chave) {
  if (chave === 'configuracoes') return ConfiguracoesPage
  if (chave === 'suporte') return SuportePage
  return null
}

function renderShell(view, breadcrumb, contentHtml) {
  const session = Store.session
  const especial = paginaEspecial(view.state.active)
  if (especial) {
    breadcrumb = especial.titulo
    contentHtml = especial.html()
  }
  const navHtml = view.navItems.map((item) => {
    const isActive = view.state.active === item.key
    return `
      <button class="nav-item ${isActive ? 'active' : ''}" data-nav="${item.key}">
        ${icon(item.icon)}<span>${item.label}</span>${isActive ? icon('ChevronRight', 'class="nav-chevron"') : ''}
      </button>`
  }).join('')

  return `
    <div class="app-shell">
      <aside class="sidebar ${view.state.mobileOpen ? 'sidebar-open' : ''}">
        <div class="brand-lockup">
          <img src="${LOGO_URL}" alt="EMAII" class="brand-logo" />
          <button class="close-mobile" aria-label="Fechar menu" data-action="close-mobile">${icon('X')}</button>
        </div>
        <div class="workspace-label">${session ? ROLE_LABEL[session.role] : ''}</div>
        <nav class="main-nav" aria-label="Navegação principal">${navHtml}</nav>
        <div class="sidebar-divider"></div>
        <button class="nav-item ${view.state.active === 'configuracoes' ? 'active' : ''}" data-nav="configuracoes">${icon('Settings')}<span>Configurações</span>${view.state.active === 'configuracoes' ? icon('ChevronRight', 'class="nav-chevron"') : ''}</button>
        <div class="sidebar-bottom">
          <button class="support-card ${view.state.active === 'suporte' ? 'active' : ''}" data-nav="suporte">${icon('Sparkles')}<div><strong>Precisa de ajuda?</strong><span>Fale com o suporte EMAII</span></div>${icon('ChevronRight')}</button>
          <button class="profile-card" data-action="toggle-menu">
            <div class="avatar avatar-${session?.avatarCor ?? 'red'}">${session?.iniciais ?? '--'}</div>
            <div class="profile-copy"><strong>${escapeHtml(session?.nome ?? 'Visitante')}</strong><span>${session ? ROLE_LABEL[session.role] : ''}</span></div>
          </button>
          ${view.state.menuOpen ? `<button class="outline-button" data-action="sair">${icon('LogOut', 'style="width:14px"')} Sair da conta</button>` : ''}
        </div>
      </aside>
      ${view.state.mobileOpen ? `<button class="mobile-scrim" aria-label="Fechar menu" data-action="close-mobile"></button>` : ''}
      <main class="main-content">
        <header class="topbar">
          <button class="mobile-menu" aria-label="Abrir menu" data-action="open-mobile">${icon('Menu')}</button>
          <div class="breadcrumb"><span>EMAII</span>${icon('ChevronRight')}<strong>${breadcrumb}</strong></div>
          <div class="topbar-actions">
            <button class="role-button" data-action="sair">${icon('LogOut', 'style="width:16px"')}<span>Sair</span></button>
          </div>
        </header>
        <div class="page-wrap">${contentHtml}</div>
      </main>
    </div>`
}

/** Liga os eventos comuns da casca (navegação, menu mobile, menu de perfil, logout). */
function bindShellEvents(root, view) {
  root.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      view.state.active = btn.getAttribute('data-nav')
      view.state.mobileOpen = false
      view.render()
    })
  })
  root.querySelectorAll('[data-action="open-mobile"]').forEach((btn) => btn.addEventListener('click', () => { view.state.mobileOpen = true; view.render() }))
  root.querySelectorAll('[data-action="close-mobile"]').forEach((btn) => btn.addEventListener('click', () => { view.state.mobileOpen = false; view.render() }))
  root.querySelectorAll('[data-action="toggle-menu"]').forEach((btn) => btn.addEventListener('click', () => { view.state.menuOpen = !view.state.menuOpen; view.render() }))
  root.querySelectorAll('[data-action="sair"]').forEach((btn) => btn.addEventListener('click', () => { App.logout() }))

  const especial = paginaEspecial(view.state.active)
  if (especial) especial.bind(root, view)
}
