/* ===== EMAII :: Painel do Aluno ===== */
const AlunoView = {
  navItems: [
    { key: 'painel', label: 'Meu painel', icon: 'LayoutDashboard' },
    { key: 'notas', label: 'Notas', icon: 'ClipboardList' },
    { key: 'frequencia', label: 'Frequência', icon: 'CalendarCheck2' },
    { key: 'atividades', label: 'Atividades', icon: 'BookOpen' },
    { key: 'comunicados', label: 'Comunicados', icon: 'Bell' },
    { key: 'ocorrencias', label: 'Ocorrências', icon: 'AlertTriangle' },
  ],
  state: { active: 'painel', mobileOpen: false, menuOpen: false },

  contentPainel(db, aluno, turma, professores, minhasAtividades) {
    return `
      ${sectionHeading({ title: `Olá, ${escapeHtml(aluno.nome.split(' ')[0])}`, subtitle: 'Aqui está o resumo da sua vida escolar.' })}
      <section class="stat-grid">
        ${statCard({ icon: 'CalendarCheck2', label: 'Frequência', value: `${calcularFrequenciaAluno(db, aluno.id)}%`, detail: 'no período' })}
        ${statCard({ icon: 'ClipboardList', label: 'Média geral', value: calcularMediaAluno(db, aluno.id)?.toFixed(1) ?? '—', detail: 'notas lançadas' })}
        ${statCard({ icon: 'AlertTriangle', label: 'Faltas', value: String(contarFaltas(db, aluno.id)), detail: 'registradas' })}
        ${statCard({ icon: 'BookOpen', label: 'Atividades', value: String(minhasAtividades.length), detail: 'da turma' })}
      </section>
      <div class="info-card-grid">
        <div class="info-block">
          <h3>Dados pessoais</h3>
          <div class="info-line"><span>Nome</span><strong>${escapeHtml(aluno.nome)}</strong></div>
          <div class="info-line"><span>Matrícula</span><strong>${aluno.matricula}</strong></div>
          <div class="info-line"><span>Nascimento</span><strong>${aluno.dataNascimento}</strong></div>
          <div class="info-line"><span>Situação acadêmica</span>${situacaoPill(aluno.situacao)}</div>
        </div>
        <div class="info-block">
          <h3>Turma e professores</h3>
          <div class="info-line"><span>Turma</span><strong>${turma?.nome ?? ''} — ${turma?.serie ?? ''}</strong></div>
          <div class="info-line"><span>Turno</span><strong>${turma?.turno ?? ''}</strong></div>
          ${professores.map((p) => `<div class="info-line"><span>${p.disciplinaIds.map((id) => getDisciplina(db, id)?.nome).join(', ')}</span><strong>${escapeHtml(p.nome)}</strong></div>`).join('')}
        </div>
      </div>`
  },

  contentNotas(db, minhasNotas) {
    return `
      ${sectionHeading({ title: 'Minhas notas', subtitle: 'Consulte suas notas por disciplina e bimestre.' })}
      <article class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Disciplina</th><th>Bimestre</th><th>Nota</th><th>Data</th></tr></thead>
            <tbody>
              ${minhasNotas.map((n) => `<tr><td>${getDisciplina(db, n.disciplinaId)?.nome ?? ''}</td><td>${n.bimestre}º</td><td><strong>${Number(n.valor).toFixed(1)}</strong></td><td>${n.data}</td></tr>`).join('')}
              ${minhasNotas.length === 0 ? `<tr><td colspan="4">${emptyState('Nenhuma nota lançada ainda.')}</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </article>`
  },

  contentFrequencia(db, minhaFrequencia) {
    return `
      ${sectionHeading({ title: 'Minha frequência', subtitle: 'Consulte seu histórico de presença.' })}
      <article class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Data</th><th>Disciplina</th><th>Situação</th></tr></thead>
            <tbody>
              ${minhaFrequencia.map((f) => `<tr><td>${f.data}</td><td>${getDisciplina(db, f.disciplinaId)?.nome ?? ''}</td><td>${frequenciaPill(f.status)}</td></tr>`).join('')}
              ${minhaFrequencia.length === 0 ? `<tr><td colspan="3">${emptyState('Nenhum registro de frequência ainda.')}</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </article>`
  },

  contentAtividades(db, minhasAtividades) {
    return `
      ${sectionHeading({ title: 'Atividades', subtitle: 'Atividades da sua turma.' })}
      ${minhasAtividades.map((at) => `
        <div class="comunicado-card">
          <div class="comunicado-head"><strong>${escapeHtml(at.titulo)}</strong><span>Entrega: ${at.dataEntrega}</span></div>
          <p>${escapeHtml(at.descricao)}</p>
          <div class="comunicado-autor">${getDisciplina(db, at.disciplinaId)?.nome ?? ''}</div>
        </div>`).join('')}
      ${minhasAtividades.length === 0 ? emptyState('Nenhuma atividade disponível.') : ''}`
  },

  contentComunicados(db) {
    return `
      ${sectionHeading({ title: 'Comunicados', subtitle: 'Comunicados da escola.' })}
      ${db.comunicados.map((c) => `
        <div class="comunicado-card">
          <div class="comunicado-head"><strong>${escapeHtml(c.titulo)}</strong><span>${c.data}</span></div>
          <p>${escapeHtml(c.mensagem)}</p>
          <div class="comunicado-autor">Publicado por ${escapeHtml(c.autorNome)}</div>
        </div>`).join('')}`
  },

  contentOcorrencias(minhasOcorrencias) {
    return `
      ${sectionHeading({ title: 'Minhas ocorrências', subtitle: 'Ocorrências registradas sobre você.' })}
      ${minhasOcorrencias.map((o) => `
        <div class="comunicado-card">
          <div class="comunicado-head"><strong>${escapeHtml(o.tipo)}</strong><span>${o.data}</span></div>
          <p>${escapeHtml(o.descricao)}</p>
          <div class="comunicado-autor">${tipoOcorrenciaPill(o.tipo)}</div>
        </div>`).join('')}
      ${minhasOcorrencias.length === 0 ? emptyState('Nenhuma ocorrência registrada.') : ''}`
  },

  render() {
    const db = Store.db
    const session = Store.session
    const label = this.navItems.find((n) => n.key === this.state.active)?.label ?? ''

    const aluno = db.alunos.find((a) => a.turmaId === session?.turmaId && a.nome === session?.nome) ?? db.alunos.find((a) => a.turmaId === session?.turmaId)

    if (!aluno) {
      document.getElementById('app-root').innerHTML = renderShell(this, label, emptyState('Não encontramos seus dados de matrícula.'))
      bindShellEvents(document.getElementById('app-root'), this)
      return
    }

    const turma = getTurma(db, aluno.turmaId)
    const professores = turma ? db.professores.filter((p) => turma.professorIds.includes(p.id)) : []
    const minhasNotas = db.notas.filter((n) => n.alunoId === aluno.id)
    const minhaFrequencia = db.frequencias.filter((f) => f.alunoId === aluno.id)
    const minhasAtividades = turma ? db.atividades.filter((a) => a.turmaId === turma.id) : []
    const minhasOcorrencias = db.ocorrencias.filter((o) => o.alunoId === aluno.id)

    let content = ''
    if (this.state.active === 'painel') content = this.contentPainel(db, aluno, turma, professores, minhasAtividades)
    else if (this.state.active === 'notas') content = this.contentNotas(db, minhasNotas)
    else if (this.state.active === 'frequencia') content = this.contentFrequencia(db, minhaFrequencia)
    else if (this.state.active === 'atividades') content = this.contentAtividades(db, minhasAtividades)
    else if (this.state.active === 'comunicados') content = this.contentComunicados(db)
    else if (this.state.active === 'ocorrencias') content = this.contentOcorrencias(minhasOcorrencias)

    document.getElementById('app-root').innerHTML = renderShell(this, label, content)
    bindShellEvents(document.getElementById('app-root'), this)
  },
}
