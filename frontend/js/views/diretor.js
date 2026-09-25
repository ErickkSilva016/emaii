/* ===== EMAII :: Painel do Diretor ===== */
const DiretorView = {
  navItems: [
    { key: 'visao-geral', label: 'Visão geral', icon: 'LayoutDashboard' },
    { key: 'turmas', label: 'Turmas', icon: 'GraduationCap' },
    { key: 'comunicados', label: 'Comunicados', icon: 'Bell' },
  ],
  state: { active: 'visao-geral', mobileOpen: false, menuOpen: false },

  contentVisaoGeral(db, session) {
    const totalAlunos = db.alunos.length
    const totalProfessores = db.professores.length
    const totalTurmas = db.turmas.length
    const totalFaltas = db.frequencias.filter((f) => f.status === 'falta').length
    const totalOcorrencias = db.ocorrencias.length
    const frequenciaMedia = totalAlunos
      ? Math.round(db.alunos.reduce((acc, a) => acc + calcularFrequenciaAluno(db, a.id), 0) / totalAlunos)
      : 100

    return `
      ${sectionHeading({ title: `Bem-vindo, ${escapeHtml(session?.nome?.split(' ')[0] ?? '')}`, subtitle: 'Resumo geral da instituição hoje.' })}
      <section class="stat-grid" aria-label="Indicadores da escola">
        ${statCard({ icon: 'Users', label: 'Alunos matriculados', value: String(totalAlunos), detail: 'alunos' })}
        ${statCard({ icon: 'GraduationCap', label: 'Professores', value: String(totalProfessores), detail: 'professores' })}
        ${statCard({ icon: 'LayoutDashboard', label: 'Turmas ativas', value: String(totalTurmas), detail: 'turmas' })}
        ${statCard({ icon: 'CalendarCheck2', label: 'Frequência geral', value: `${frequenciaMedia}%`, detail: 'da escola' })}
      </section>
      <section class="stat-grid" aria-label="Indicadores adicionais">
        ${statCard({ icon: 'AlertTriangle', label: 'Faltas registradas', value: String(totalFaltas), detail: 'no período' })}
        ${statCard({ icon: 'AlertTriangle', label: 'Ocorrências', value: String(totalOcorrencias), detail: 'registradas' })}
        ${statCard({ icon: 'Bell', label: 'Comunicados', value: String(db.comunicados.length), detail: 'publicados' })}
        ${statCard({ icon: 'Users', label: 'Responsáveis', value: String(db.responsaveis.length), detail: 'cadastrados' })}
      </section>

      <section class="content-grid">
        <article class="panel students-panel">
          <div class="panel-heading"><div><h2>Turmas da escola</h2><p>Informações gerais de cada turma</p></div></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Turma</th><th>Série</th><th>Turno</th><th>Alunos</th><th>Professores</th></tr></thead>
              <tbody>
                ${db.turmas.map((t) => `<tr><td><strong>${t.nome}</strong></td><td>${t.serie}</td><td>${t.turno}</td><td>${t.alunoIds.length}</td><td>${t.professorIds.length}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </article>
        <article class="panel alerts-panel">
          <div class="panel-heading"><div><h2>Pontos de atenção</h2><p>Requerem acompanhamento</p></div></div>
          <div class="attention-list">
            <div class="attention-item"><div class="attention-icon amber-icon">${icon('AlertTriangle')}</div><div><strong>Alunos com baixa frequência</strong><span>${db.alunos.filter((a) => calcularFrequenciaAluno(db, a.id) < 75).length} alunos abaixo de 75%</span></div></div>
            <div class="attention-item"><div class="attention-icon red-icon">${icon('AlertTriangle')}</div><div><strong>Situação "Em risco"</strong><span>${db.alunos.filter((a) => a.situacao === 'Em risco').length} alunos</span></div></div>
            <div class="attention-item"><div class="attention-icon blue-icon">${icon('Bell')}</div><div><strong>Comunicados recentes</strong><span>${db.comunicados.length} publicados</span></div></div>
          </div>
        </article>
      </section>`
  },

  contentTurmas(db) {
    return `
      ${sectionHeading({ title: 'Turmas', subtitle: 'Visão geral das turmas da instituição.' })}
      <div class="info-card-grid">
        ${db.turmas.map((t) => `
          <div class="info-block">
            <h3>${t.nome} — ${t.serie}</h3>
            <div class="info-line"><span>Turno</span><strong>${t.turno}</strong></div>
            <div class="info-line"><span>Alunos</span><strong>${t.alunoIds.length}</strong></div>
            <div class="info-line"><span>Professores</span><strong>${t.professorIds.length}</strong></div>
            <div class="info-line"><span>Disciplinas</span><strong>${t.disciplinaIds.length}</strong></div>
          </div>`).join('')}
      </div>`
  },

  contentComunicados(db) {
    return `
      ${sectionHeading({ title: 'Comunicados', subtitle: 'Últimos comunicados publicados pela coordenação.' })}
      ${db.comunicados.map((c) => `
        <div class="comunicado-card">
          <div class="comunicado-head"><strong>${escapeHtml(c.titulo)}</strong><span>${c.data}</span></div>
          <p>${escapeHtml(c.mensagem)}</p>
          <div class="comunicado-autor">Publicado por ${escapeHtml(c.autorNome)}</div>
        </div>`).join('')}`
  },

  render() {
    const db = Store.db
    const session = Store.session
    const label = this.navItems.find((n) => n.key === this.state.active)?.label ?? ''

    let content = ''
    if (this.state.active === 'visao-geral') content = this.contentVisaoGeral(db, session)
    else if (this.state.active === 'turmas') content = this.contentTurmas(db)
    else if (this.state.active === 'comunicados') content = this.contentComunicados(db)

    document.getElementById('app-root').innerHTML = renderShell(this, label, content)
    bindShellEvents(document.getElementById('app-root'), this)
  },
}
