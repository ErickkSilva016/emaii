/* ===== EMAII :: Painel do Professor ===== */
const ProfessorView = {
  navItems: [
    { key: 'turmas', label: 'Minhas turmas', icon: 'GraduationCap' },
    { key: 'diario', label: 'Diário de classe', icon: 'CalendarCheck2' },
    { key: 'notas', label: 'Notas', icon: 'ClipboardList' },
    { key: 'atividades', label: 'Atividades', icon: 'BookOpen' },
    { key: 'ocorrencias', label: 'Ocorrências e observações', icon: 'AlertTriangle' },
  ],
  state: {
    active: 'turmas', mobileOpen: false, menuOpen: false,
    turmaSelecionada: null,
    dataChamada: new Date().toISOString().slice(0, 10),
    bimestre: 1,
    notasRascunho: {},
    modalAtividade: false,
    formAtividade: { titulo: '', descricao: '', dataEntrega: '' },
    subTabOcorrencia: 'ocorrencia',
    modalOcorrencia: false,
    formOcorrencia: { alunoId: '', tipo: 'Observação', descricao: '' },
    modalObservacao: false,
    formObservacao: { alunoId: '', texto: '' },
  },

  async registrarPresenca(alunoId, status, turmaSelecionada, minhaDisciplinaId) {
    const session = Store.session
    try { await Store.addFrequencia({ alunoId, turmaId: turmaSelecionada, disciplinaId: minhaDisciplinaId, data: this.state.dataChamada, status, professorId: session.id }); this.render() }
    catch (error) { alert(error.message) }
  },

  statusDoDia(db, alunoId, turmaSelecionada) {
    const registro = db.frequencias.find((f) => f.alunoId === alunoId && f.turmaId === turmaSelecionada && f.data === this.state.dataChamada)
    return registro?.status ?? null
  },

  async salvarNotas(minhaDisciplinaId, alunosDaTurma) {
    const session = Store.session
    for (const [alunoId, valor] of Object.entries(this.state.notasRascunho)) {
      const num = Number(String(valor).replace(',', '.'))
      if (!Number.isNaN(num) && valor !== '') {
        await Store.addNota({ alunoId, turmaId: this.state.turmaSelecionada, disciplinaId: minhaDisciplinaId, bimestre: this.state.bimestre, valor: num, professorId: session.id, data: new Date().toISOString().slice(0, 10) })
      }
    }
    this.state.notasRascunho = {}
    this.render()
  },

  async salvarAtividade() {
    const f = this.state.formAtividade
    if (!f.titulo.trim() || !this.state.turmaSelecionada) return
    const session = Store.session
    const minhaDisciplinaId = session.disciplinas?.[0] ?? Store.db.disciplinas[0]?.id ?? ''
    try { await Store.addAtividade({ turmaId: this.state.turmaSelecionada, disciplinaId: minhaDisciplinaId, professorId: session.id, ...f }); this.state.formAtividade = { titulo: '', descricao: '', dataEntrega: '' }; this.state.modalAtividade = false; this.render() }
    catch (error) { alert(error.message) }
  },

  async salvarOcorrencia() {
    const f = this.state.formOcorrencia
    if (!f.alunoId || !f.descricao.trim()) return
    const db = Store.db
    const session = Store.session
    const aluno = db.alunos.find((a) => a.id === f.alunoId)
    try { await Store.addOcorrencia({ ...f, turmaId: aluno?.turmaId ?? this.state.turmaSelecionada, data: new Date().toISOString().slice(0, 10), autorId: session.id, autorNome: session.nome }); this.state.formOcorrencia = { alunoId: '', tipo: 'Observação', descricao: '' }; this.state.modalOcorrencia = false; this.render() }
    catch (error) { alert(error.message) }
  },

  async salvarObservacao() {
    const f = this.state.formObservacao
    if (!f.alunoId || !f.texto.trim()) return
    const db = Store.db
    const session = Store.session
    const aluno = db.alunos.find((a) => a.id === f.alunoId)
    try { await Store.addObservacao({ ...f, turmaId: aluno?.turmaId ?? this.state.turmaSelecionada, professorId: session.id, professorNome: session.nome }); this.state.formObservacao = { alunoId: '', texto: '' }; this.state.modalObservacao = false; this.render() }
    catch (error) { alert(error.message) }
  },

  selectorPillsHtml(minhasTurmas) {
    if (minhasTurmas.length === 0) return ''
    return `<div class="selector-pills">${minhasTurmas.map((t) => `<button class="selector-pill ${this.state.turmaSelecionada === t.id ? 'active' : ''}" data-turma-pill="${t.id}">${t.nome}</button>`).join('')}</div>`
  },

  contentTurmas(db, minhasTurmas, minhaDisciplinaId, session) {
    return `
      ${sectionHeading({ title: `Olá, ${escapeHtml(session?.nome?.split(' ')[0] ?? '')}`, subtitle: 'Suas turmas neste período letivo.' })}
      <div class="info-card-grid">
        ${minhasTurmas.map((t) => `
          <div class="info-block">
            <h3>${t.nome} — ${t.serie}</h3>
            <div class="info-line"><span>Turno</span><strong>${t.turno}</strong></div>
            <div class="info-line"><span>Alunos</span><strong>${t.alunoIds.length}</strong></div>
            <div class="info-line"><span>Disciplina</span><strong>${getDisciplina(db, minhaDisciplinaId)?.nome ?? ''}</strong></div>
          </div>`).join('')}
        ${minhasTurmas.length === 0 ? emptyState('Você ainda não possui turmas atribuídas.') : ''}
      </div>`
  },

  contentDiario(db, alunosDaTurma, turmaSelecionada, minhaDisciplinaId) {
    return `
      ${sectionHeading({
        title: 'Diário de classe', subtitle: 'Registre presença, falta ou falta justificada dos alunos.',
        actionHtml: `<input id="data-chamada" type="date" value="${this.state.dataChamada}" style="height:38px;border:1px solid #e6e1e3;border-radius:6px;padding:0 10px;font-size:12px;" />`,
      })}
      <article class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Aluno</th><th>Situação hoje</th><th>Registrar</th></tr></thead>
            <tbody>
              ${alunosDaTurma.map((a) => {
                const status = this.statusDoDia(db, a.id, turmaSelecionada)
                return `
                  <tr>
                    <td><div class="student-cell"><div class="avatar avatar-${a.avatarCor}">${a.iniciais}</div><strong>${escapeHtml(a.nome)}</strong></div></td>
                    <td>${status ? frequenciaPill(status) : '<span class="status-pill">Não registrado</span>'}</td>
                    <td>
                      <div class="row-actions">
                        <button class="btn-secondary" data-presenca="${a.id}|presente">Presente</button>
                        <button class="btn-secondary" data-presenca="${a.id}|falta">Falta</button>
                        <button class="btn-secondary" data-presenca="${a.id}|falta_justificada">Justificada</button>
                      </div>
                    </td>
                  </tr>`
              }).join('')}
              ${alunosDaTurma.length === 0 ? `<tr><td colspan="3">${emptyState('Selecione uma turma.')}</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </article>`
  },

  contentNotas(db, alunosDaTurma, minhaDisciplinaId) {
    return `
      ${sectionHeading({
        title: 'Lançar notas', subtitle: `Disciplina: ${getDisciplina(db, minhaDisciplinaId)?.nome ?? ''}`,
        actionHtml: `
          <select id="select-bimestre" style="height:38px;border:1px solid #e6e1e3;border-radius:6px;padding:0 10px;font-size:12px;">
            <option value="1" ${this.state.bimestre === 1 ? 'selected' : ''}>1º bimestre</option>
            <option value="2" ${this.state.bimestre === 2 ? 'selected' : ''}>2º bimestre</option>
            <option value="3" ${this.state.bimestre === 3 ? 'selected' : ''}>3º bimestre</option>
            <option value="4" ${this.state.bimestre === 4 ? 'selected' : ''}>4º bimestre</option>
          </select>`,
      })}
      <article class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Aluno</th><th>Nota (${this.state.bimestre}º bim.)</th></tr></thead>
            <tbody>
              ${alunosDaTurma.map((a) => `
                <tr>
                  <td><div class="student-cell"><div class="avatar avatar-${a.avatarCor}">${a.iniciais}</div><strong>${escapeHtml(a.nome)}</strong></div></td>
                  <td><input id="nota-input-${a.id}" data-nota-aluno="${a.id}" style="width:90px;height:34px;border:1px solid #e6e1e3;border-radius:6px;padding:0 8px;font-size:12px;" placeholder="0,0 a 10,0" value="${escapeHtml(this.state.notasRascunho[a.id] ?? '')}" /></td>
                </tr>`).join('')}
              ${alunosDaTurma.length === 0 ? `<tr><td colspan="2">${emptyState('Selecione uma turma.')}</td></tr>` : ''}
            </tbody>
          </table>
        </div>
        ${alunosDaTurma.length > 0 ? `<div class="form-actions"><button class="primary-button" data-action="salvar-notas">Salvar notas</button></div>` : ''}
      </article>`
  },

  contentAtividades(db, meusAtividades) {
    return `
      ${sectionHeading({ title: 'Atividades', subtitle: 'Crie atividades para a turma selecionada.', actionHtml: `<button class="primary-button" data-action="nova-atividade">${icon('Plus')} Nova atividade</button>` })}
      ${meusAtividades.map((at) => `
        <div class="comunicado-card">
          <div class="comunicado-head"><strong>${escapeHtml(at.titulo)}</strong><span>Entrega: ${at.dataEntrega}</span></div>
          <p>${escapeHtml(at.descricao)}</p>
          <div class="comunicado-autor">Turma ${db.turmas.find((t) => t.id === at.turmaId)?.nome ?? ''}</div>
        </div>`).join('')}
      ${meusAtividades.length === 0 ? emptyState('Nenhuma atividade criada ainda.') : ''}`
  },

  contentOcorrencias(db, minhasOcorrencias, minhasObservacoes) {
    return `
      ${sectionHeading({
        title: 'Ocorrências e observações', subtitle: 'Registre ocorrências disciplinares ou observações sobre os alunos.',
        actionHtml: `<button class="primary-button" data-action="nova-ocorrencia-ou-observacao">${icon('Plus')} ${this.state.subTabOcorrencia === 'ocorrencia' ? 'Nova ocorrência' : 'Nova observação'}</button>`,
      })}
      <div class="tabs-row">
        <button class="tab-btn ${this.state.subTabOcorrencia === 'ocorrencia' ? 'active' : ''}" data-subtab="ocorrencia">Ocorrências</button>
        <button class="tab-btn ${this.state.subTabOcorrencia === 'observacao' ? 'active' : ''}" data-subtab="observacao">Observações</button>
      </div>
      ${this.state.subTabOcorrencia === 'ocorrencia' ? `
        ${minhasOcorrencias.map((o) => `
          <div class="comunicado-card">
            <div class="comunicado-head"><strong>${escapeHtml(db.alunos.find((a) => a.id === o.alunoId)?.nome ?? '')}</strong><span>${o.data}</span></div>
            <p>${escapeHtml(o.descricao)}</p>
            <div class="comunicado-autor">${tipoOcorrenciaPill(o.tipo)}</div>
          </div>`).join('')}
        ${minhasOcorrencias.length === 0 ? emptyState('Nenhuma ocorrência registrada por você ainda.') : ''}
      ` : `
        ${minhasObservacoes.map((o) => `
          <div class="comunicado-card">
            <div class="comunicado-head"><strong>${escapeHtml(db.alunos.find((a) => a.id === o.alunoId)?.nome ?? '')}</strong><span>${o.data}</span></div>
            <p>${escapeHtml(o.texto)}</p>
          </div>`).join('')}
        ${minhasObservacoes.length === 0 ? emptyState('Nenhuma observação registrada por você ainda.') : ''}
      `}`
  },

  modalAtividadeHtml() {
    if (!this.state.modalAtividade) return ''
    const f = this.state.formAtividade
    const body = `
      <div class="field"><label>Título</label><input id="fa-titulo" value="${escapeHtml(f.titulo)}" /></div>
      <div class="field"><label>Descrição</label><textarea id="fa-descricao">${escapeHtml(f.descricao)}</textarea></div>
      <div class="field"><label>Data de entrega</label><input id="fa-entrega" type="date" value="${f.dataEntrega}" /></div>
      <div class="form-actions"><button class="btn-secondary" data-action="fechar-modal-atividade">Cancelar</button><button class="primary-button" data-action="salvar-atividade">Criar atividade</button></div>`
    return modalWrap({ title: 'Nova atividade', bodyHtml: body, closeAction: 'fechar-modal-atividade' })
  },

  modalOcorrenciaHtml(alunosDaTurma) {
    if (!this.state.modalOcorrencia) return ''
    const f = this.state.formOcorrencia
    const body = `
      <div class="field"><label>Aluno</label>
        <select id="fo-aluno"><option value="">Selecione</option>${alunosDaTurma.map((a) => `<option value="${a.id}" ${f.alunoId === a.id ? 'selected' : ''}>${escapeHtml(a.nome)}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Tipo</label>
        <select id="fo-tipo">${['Elogio', 'Advertência', 'Observação', 'Suspensão', 'Outro'].map((t) => `<option ${f.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Descrição</label><textarea id="fo-descricao">${escapeHtml(f.descricao)}</textarea></div>
      <div class="form-actions"><button class="btn-secondary" data-action="fechar-modal-ocorrencia">Cancelar</button><button class="primary-button" data-action="salvar-ocorrencia">Registrar</button></div>`
    return modalWrap({ title: 'Registrar ocorrência', bodyHtml: body, closeAction: 'fechar-modal-ocorrencia' })
  },

  modalObservacaoHtml(alunosDaTurma) {
    if (!this.state.modalObservacao) return ''
    const f = this.state.formObservacao
    const body = `
      <div class="field"><label>Aluno</label>
        <select id="fb-aluno"><option value="">Selecione</option>${alunosDaTurma.map((a) => `<option value="${a.id}" ${f.alunoId === a.id ? 'selected' : ''}>${escapeHtml(a.nome)}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Observação</label><textarea id="fb-texto">${escapeHtml(f.texto)}</textarea></div>
      <div class="form-actions"><button class="btn-secondary" data-action="fechar-modal-observacao">Cancelar</button><button class="primary-button" data-action="salvar-observacao">Salvar</button></div>`
    return modalWrap({ title: 'Nova observação', bodyHtml: body, closeAction: 'fechar-modal-observacao' })
  },

  render() {
    const db = Store.db
    const session = Store.session
    const minhasTurmas = db.turmas.filter((t) => session?.turmaIds?.includes(t.id))
    const minhaDisciplinaId = session?.disciplinas?.[0] ?? db.disciplinas[0]?.id ?? ''

    if (this.state.turmaSelecionada === null) this.state.turmaSelecionada = minhasTurmas[0]?.id ?? ''
    const turmaSelecionada = this.state.turmaSelecionada

    const t = db.turmas.find((tt) => tt.id === turmaSelecionada)
    const alunosDaTurma = t ? db.alunos.filter((a) => t.alunoIds.includes(a.id)) : []

    const meusAtividades = db.atividades.filter((a) => a.professorId === session?.id)
    const minhasOcorrencias = db.ocorrencias.filter((o) => o.autorId === session?.id)
    const minhasObservacoes = db.observacoes.filter((o) => o.professorId === session?.id)

    const label = this.navItems.find((n) => n.key === this.state.active)?.label ?? ''

    let content = ''
    const precisaSeletorTurma = ['diario', 'notas', 'atividades', 'ocorrencias'].includes(this.state.active) && minhasTurmas.length > 0
    if (precisaSeletorTurma) content += this.selectorPillsHtml(minhasTurmas)

    if (this.state.active === 'turmas') content += this.contentTurmas(db, minhasTurmas, minhaDisciplinaId, session)
    else if (this.state.active === 'diario') content += this.contentDiario(db, alunosDaTurma, turmaSelecionada, minhaDisciplinaId)
    else if (this.state.active === 'notas') content += this.contentNotas(db, alunosDaTurma, minhaDisciplinaId)
    else if (this.state.active === 'atividades') content += this.contentAtividades(db, meusAtividades)
    else if (this.state.active === 'ocorrencias') content += this.contentOcorrencias(db, minhasOcorrencias, minhasObservacoes)

    content += this.modalAtividadeHtml() + this.modalOcorrenciaHtml(alunosDaTurma) + this.modalObservacaoHtml(alunosDaTurma)

    document.getElementById('app-root').innerHTML = renderShell(this, label, content)
    bindShellEvents(document.getElementById('app-root'), this)
    this.bindContentEvents(db, alunosDaTurma, turmaSelecionada, minhaDisciplinaId)
  },

  bindContentEvents(db, alunosDaTurma, turmaSelecionada, minhaDisciplinaId) {
    const root = document.getElementById('app-root')

    root.querySelectorAll('[data-turma-pill]').forEach((btn) => btn.addEventListener('click', () => { this.state.turmaSelecionada = btn.getAttribute('data-turma-pill'); this.render() }))

    const dataChamada = document.getElementById('data-chamada')
    if (dataChamada) dataChamada.addEventListener('change', (e) => { this.state.dataChamada = e.target.value; this.render() })

    root.querySelectorAll('[data-presenca]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const [alunoId, status] = btn.getAttribute('data-presenca').split('|')
        this.registrarPresenca(alunoId, status, turmaSelecionada, minhaDisciplinaId)
      })
    })

    const selectBimestre = document.getElementById('select-bimestre')
    if (selectBimestre) selectBimestre.addEventListener('change', (e) => { this.state.bimestre = Number(e.target.value); this.render() })

    root.querySelectorAll('[data-nota-aluno]').forEach((input) => {
      input.addEventListener('input', (e) => { this.state.notasRascunho[input.getAttribute('data-nota-aluno')] = e.target.value; withFocusPreserved(() => this.render()) })
    })
    const salvarNotasBtn = root.querySelector('[data-action="salvar-notas"]')
    if (salvarNotasBtn) salvarNotasBtn.addEventListener('click', () => this.salvarNotas(minhaDisciplinaId, alunosDaTurma))

    const novaAtividadeBtn = root.querySelector('[data-action="nova-atividade"]')
    if (novaAtividadeBtn) novaAtividadeBtn.addEventListener('click', () => { this.state.modalAtividade = true; this.render() })

    root.querySelectorAll('[data-subtab]').forEach((btn) => btn.addEventListener('click', () => { this.state.subTabOcorrencia = btn.getAttribute('data-subtab'); this.render() }))

    const novaOcOuObsBtn = root.querySelector('[data-action="nova-ocorrencia-ou-observacao"]')
    if (novaOcOuObsBtn) novaOcOuObsBtn.addEventListener('click', () => {
      if (this.state.subTabOcorrencia === 'ocorrencia') this.state.modalOcorrencia = true
      else this.state.modalObservacao = true
      this.render()
    })

    // Modal atividade
    const faTitulo = document.getElementById('fa-titulo')
    if (faTitulo) faTitulo.addEventListener('input', (e) => { this.state.formAtividade.titulo = e.target.value })
    const faDescricao = document.getElementById('fa-descricao')
    if (faDescricao) faDescricao.addEventListener('input', (e) => { this.state.formAtividade.descricao = e.target.value })
    const faEntrega = document.getElementById('fa-entrega')
    if (faEntrega) faEntrega.addEventListener('input', (e) => { this.state.formAtividade.dataEntrega = e.target.value })
    root.querySelectorAll('[data-action="fechar-modal-atividade"]').forEach((el) => el.addEventListener('click', () => { this.state.modalAtividade = false; this.render() }))
    const salvarAtividadeBtn = root.querySelector('[data-action="salvar-atividade"]')
    if (salvarAtividadeBtn) salvarAtividadeBtn.addEventListener('click', () => this.salvarAtividade())

    // Modal ocorrência
    const foAluno = document.getElementById('fo-aluno')
    if (foAluno) foAluno.addEventListener('change', (e) => { this.state.formOcorrencia.alunoId = e.target.value })
    const foTipo = document.getElementById('fo-tipo')
    if (foTipo) foTipo.addEventListener('change', (e) => { this.state.formOcorrencia.tipo = e.target.value })
    const foDescricao = document.getElementById('fo-descricao')
    if (foDescricao) foDescricao.addEventListener('input', (e) => { this.state.formOcorrencia.descricao = e.target.value })
    root.querySelectorAll('[data-action="fechar-modal-ocorrencia"]').forEach((el) => el.addEventListener('click', () => { this.state.modalOcorrencia = false; this.render() }))
    const salvarOcorrenciaBtn = root.querySelector('[data-action="salvar-ocorrencia"]')
    if (salvarOcorrenciaBtn) salvarOcorrenciaBtn.addEventListener('click', () => this.salvarOcorrencia())

    // Modal observação
    const fbAluno = document.getElementById('fb-aluno')
    if (fbAluno) fbAluno.addEventListener('change', (e) => { this.state.formObservacao.alunoId = e.target.value })
    const fbTexto = document.getElementById('fb-texto')
    if (fbTexto) fbTexto.addEventListener('input', (e) => { this.state.formObservacao.texto = e.target.value })
    root.querySelectorAll('[data-action="fechar-modal-observacao"]').forEach((el) => el.addEventListener('click', () => { this.state.modalObservacao = false; this.render() }))
    const salvarObservacaoBtn = root.querySelector('[data-action="salvar-observacao"]')
    if (salvarObservacaoBtn) salvarObservacaoBtn.addEventListener('click', () => this.salvarObservacao())
  },
}
