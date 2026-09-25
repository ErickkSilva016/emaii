/* ===== EMAII :: Painel do Responsável ===== */
const ResponsavelView = {
  navItems: [
    { key: 'painel', label: 'Painel do filho', icon: 'LayoutDashboard' },
    { key: 'notas', label: 'Notas', icon: 'ClipboardList' },
    { key: 'frequencia', label: 'Frequência', icon: 'CalendarCheck2' },
    { key: 'atividades', label: 'Atividades', icon: 'BookOpen' },
    { key: 'comunicados', label: 'Comunicados', icon: 'Bell' },
    { key: 'ocorrencias', label: 'Ocorrências', icon: 'AlertTriangle' },
  ],
  state: { active: 'painel', mobileOpen: false, menuOpen: false, filhoId: null },

  contentPainel(db, aluno, turma, minhasAtividades) {
    return `
      ${sectionHeading({ title: escapeHtml(aluno.nome), subtitle: `Turma ${turma?.nome ?? '—'} · Matrícula ${aluno.matricula}` })}
      <section class="stat-grid">
        ${statCard({ icon: 'CalendarCheck2', label: 'Frequência', value: `${calcularFrequenciaAluno(db, aluno.id)}%`, detail: 'no período' })}
        ${statCard({ icon: 'ClipboardList', label: 'Média geral', value: calcularMediaAluno(db, aluno.id)?.toFixed(1) ?? '—', detail: 'notas lançadas' })}
        ${statCard({ icon: 'AlertTriangle', label: 'Faltas', value: String(contarFaltas(db, aluno.id)), detail: 'registradas' })}
        ${statCard({ icon: 'BookOpen', label: 'Atividades', value: String(minhasAtividades.length), detail: 'da turma' })}
      </section>
      <div class="info-block" style="margin-top:4px">
        <h3>Situação acadêmica</h3>
        <div class="info-line"><span>Nome</span><strong>${escapeHtml(aluno.nome)}</strong></div>
        <div class="info-line"><span>Turma</span><strong>${turma?.nome ?? ''} — ${turma?.serie ?? ''}</strong></div>
        <div class="info-line"><span>Situação</span>${situacaoPill(aluno.situacao)}</div>
      </div>`
  },

  contentNotas(db, minhasNotas, aluno) {
    return `
      ${sectionHeading({ title: 'Notas', subtitle: `Notas de ${escapeHtml(aluno.nome)}.` })}
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

  contentFrequencia(db, minhaFrequencia, aluno) {
    return `
      ${sectionHeading({ title: 'Frequência', subtitle: `Histórico de presença de ${escapeHtml(aluno.nome)}.` })}
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

  contentAtividades(db, minhasAtividades, aluno) {
    return `
      ${sectionHeading({ title: 'Atividades', subtitle: `Atividades da turma de ${escapeHtml(aluno.nome)}.` })}
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

  contentOcorrencias(minhasOcorrencias, aluno) {
    return `
      ${sectionHeading({ title: 'Ocorrências', subtitle: `Ocorrências registradas para ${escapeHtml(aluno.nome)}.` })}
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

    const filhos = db.alunos.filter((a) => session?.alunoIds?.includes(a.id))
    if (this.state.filhoId === null) this.state.filhoId = filhos[0]?.id ?? ''
    const aluno = filhos.find((a) => a.id === this.state.filhoId) ?? filhos[0]

    if (!aluno) {
      document.getElementById('app-root').innerHTML = renderShell(this, label, emptyState('Nenhum aluno vinculado a este responsável.'))
      bindShellEvents(document.getElementById('app-root'), this)
      return
    }

    const turma = getTurma(db, aluno.turmaId)
    const minhasNotas = db.notas.filter((n) => n.alunoId === aluno.id)
    const minhaFrequencia = db.frequencias.filter((f) => f.alunoId === aluno.id)
    const minhasAtividades = turma ? db.atividades.filter((a) => a.turmaId === turma.id) : []
    const minhasOcorrencias = db.ocorrencias.filter((o) => o.alunoId === aluno.id)

    let content = ''
    if (filhos.length > 1) {
      content += `<div class="selector-pills">${filhos.map((f) => `<button class="selector-pill ${this.state.filhoId === f.id ? 'active' : ''}" data-filho-pill="${f.id}">${escapeHtml(f.nome)}</button>`).join('')}</div>`
    }

    if (this.state.active === 'painel') content += this.contentPainel(db, aluno, turma, minhasAtividades)
    else if (this.state.active === 'notas') content += this.contentNotas(db, minhasNotas, aluno)
    else if (this.state.active === 'frequencia') content += this.contentFrequencia(db, minhaFrequencia, aluno)
    else if (this.state.active === 'atividades') content += this.contentAtividades(db, minhasAtividades, aluno)
    else if (this.state.active === 'comunicados') content += this.contentComunicados(db)
    else if (this.state.active === 'ocorrencias') content += this.contentOcorrencias(minhasOcorrencias, aluno)

    document.getElementById('app-root').innerHTML = renderShell(this, label, content)
    bindShellEvents(document.getElementById('app-root'), this)

    document.getElementById('app-root').querySelectorAll('[data-filho-pill]').forEach((btn) => {
      btn.addEventListener('click', () => { this.state.filhoId = btn.getAttribute('data-filho-pill'); this.render() })
    })
  },
}
