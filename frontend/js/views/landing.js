/* ===== EMAII :: Landing pública ===== */
const LandingView = {
  render() {
    document.getElementById('app-root').innerHTML = `
      <div class="landing-page">
        <header class="landing-header">
          <a class="landing-brand" href="#inicio" aria-label="EMAII - início"><img src="assets/emaii-logo.png" alt="EMAII" /></a>
          <button class="landing-menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false">☰</button>
          <nav class="landing-nav" aria-label="Navegação principal">
            <a href="#inicio">Início</a>
            <a href="#sobre">Sobre a EMAII</a>
            <a href="#localizacao">Localização</a>
            <a class="landing-nav-cta" href="#login">Entrar</a>
          </nav>
        </header>

        <main>
          <section class="landing-hero" id="inicio">
            <video class="landing-hero-video" autoplay muted loop playsinline aria-hidden="true" poster="assets/hero-fallback.svg">
              <source src="assets/videos/hero.mp4" type="video/mp4" />
            </video>
            <div class="landing-hero-overlay"></div>
            <div class="landing-container landing-hero-content">
              <p class="landing-kicker">EMAII <span></span> Educação em movimento</p>
              <h1>Conectando educação, tecnologia e comunidade.</h1>
              <p class="landing-hero-copy">Uma plataforma para organizar a rotina escolar, aproximar pessoas e acompanhar cada etapa da jornada de aprendizagem.</p>
              <div class="landing-actions">
                <a class="landing-button landing-button-primary" href="#login">Entrar no sistema <span aria-hidden="true">↗</span></a>
                <a class="landing-button landing-button-light" href="#sobre">Conheça a EMAII <span aria-hidden="true">↓</span></a>
              </div>
            </div>
            <div class="landing-hero-note">Uma escola mais conectada começa com informação acessível.</div>
          </section>

          <section class="landing-section landing-about" id="sobre">
            <div class="landing-container">
              <div class="landing-section-intro">
                <p class="landing-label">Sobre a EMAII</p>
                <h2>Clareza para acompanhar o que realmente importa.</h2>
                <p>A EMAII é uma plataforma voltada ao acompanhamento e gerenciamento da rotina escolar. Ela reúne informações e experiências em um só lugar para fortalecer a organização, a comunicação e a integração entre escola e família.</p>
              </div>
              <div class="landing-feature-grid">
                <article class="landing-feature"><span>01</span><h3>Organização</h3><p>Uma visão mais simples das atividades e informações do dia a dia.</p></article>
                <article class="landing-feature"><span>02</span><h3>Comunicação</h3><p>Conexões mais claras entre os diferentes perfis da comunidade escolar.</p></article>
                <article class="landing-feature"><span>03</span><h3>Acompanhamento</h3><p>Dados que ajudam a acompanhar a evolução e as necessidades de cada aluno.</p></article>
              </div>
            </div>
          </section>

          <section class="landing-location" id="localizacao">
            <div class="landing-container landing-location-layout">
              <div>
                <p class="landing-label landing-label-light">Onde estamos</p>
                <h2>Presença perto da comunidade.</h2>
                <p class="landing-location-copy">Santo Amaro<br /><strong>Rua Belterra, 291</strong><br />São Paulo - SP</p>
              </div>
              <a class="landing-map-placeholder" href="https://www.google.com/maps/search/?api=1&query=Rua+Belterra%2C+291%2C+Santo+Amaro%2C+S%C3%A3o+Paulo+-+SP" target="_blank" rel="noopener noreferrer" aria-label="Abrir Rua Belterra, 291, Santo Amaro, São Paulo no Google Maps">
                <div class="landing-map-grid"></div>
                <div class="landing-map-pin">+</div>
                <span>Santo Amaro, São Paulo</span>
              </a>
            </div>
          </section>
        </main>

        <footer class="landing-footer">
          <div class="landing-container landing-footer-layout">
            <div><a class="landing-brand landing-brand-footer" href="#inicio" aria-label="EMAII - início"><img src="assets/emaii-logo.png" alt="EMAII" /></a><p>Educação, tecnologia e comunidade em conexão.</p></div>
            <nav aria-label="Navegação do rodapé"><a href="#inicio">Início</a><a href="#sobre">Sobre</a><a href="#localizacao">Localização</a><a href="#login">Entrar</a></nav>
            <small>© 2026 EMAII. Todos os direitos reservados.</small>
          </div>
        </footer>
      </div>`

    this.bindEvents()
  },

  bindEvents() {
    const root = document.getElementById('app-root')
    const menuButton = root.querySelector('.landing-menu-toggle')
    const nav = root.querySelector('.landing-nav')

    menuButton.addEventListener('click', () => {
      const aberto = nav.classList.toggle('landing-nav-open')
      menuButton.setAttribute('aria-expanded', String(aberto))
    })

    root.querySelectorAll('a[href="#login"]').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('landing-nav-open')
        menuButton.setAttribute('aria-expanded', 'false')
        LoginView.render()
      })
    })

    const video = root.querySelector('.landing-hero-video')
    video.addEventListener('error', () => video.classList.add('landing-hero-video-failed'))
  },
}