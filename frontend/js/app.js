/* ===== EMAII :: App (bootstrap + roteamento) ===== */
async function enviarMensagemParaSuporte(mensagens, perfil = null) {
  try {
    const data = await Store.request('chat', { method: 'POST', body: { mensagens, perfil } })
    return data.resposta
  } catch (error) { console.error('[EMAII] Erro ao conectar com o suporte:', error); return 'Não foi possível conectar ao suporte Emaii no momento. Tente novamente em instantes.' }
}

const VIEWS_BY_ROLE = { diretor: DiretorView, coordenador: CoordenadorView, professor: ProfessorView, aluno: AlunoView, responsavel: ResponsavelView }
const ESTADOS_INICIAIS = new Map([LoginView, DiretorView, CoordenadorView, ProfessorView, AlunoView, ResponsavelView].map((view) => [view, JSON.parse(JSON.stringify(view.state))]))
function resetarEstados() { ESTADOS_INICIAIS.forEach((estadoInicial, view) => { view.state = JSON.parse(JSON.stringify(estadoInicial)) }) }

const App = {
  goToPainel() { const session = Store.session; if (!session) { LoginView.render(); return } const view = VIEWS_BY_ROLE[session.role]; if (view) view.render(); else LoginView.render() },
  async logout() { try { await Store.logout() } catch (error) { console.error(error) } resetarEstados(); SuporteChat.reset(); ConfiguracoesPage.state = { modalReset: false, aviso: '' }; LoginView.render() },
  async init() {
    try {
      await Store.init()
      Preferencias.carregar()
      if (Store.session) this.goToPainel()
      else if (window.location.hash === '#login') LoginView.render()
      else LandingView.render()
    } catch (error) {
      console.error('[EMAII] Não foi possível iniciar:', error)
      LandingView.render()
    }
  },
}

window.addEventListener('hashchange', () => {
  if (!Store.session && window.location.hash === '#login') LoginView.render()
  if (!Store.session && (window.location.hash === '' || window.location.hash === '#inicio')) LandingView.render()
})
document.addEventListener('DOMContentLoaded', () => App.init())
