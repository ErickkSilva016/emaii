/* ===== EMAII :: Painel do Coordenador ===== */
const situacaoVaziaAluno = () => ({ nome: '', matricula: '', turmaId: '', dataNascimento: '', situacao: 'Regular' })

const CoordenadorView = {
  navItems: [
    { key: 'visao-geral', label: 'Visão geral', icon: 'LayoutDashboard' },
    { key: 'alunos', label: 'Alunos', icon: 'Users' },
    { key: 'turmas', label: 'Turmas', icon: 'GraduationCap' },
    { key: 'professores', label: 'Professores', icon: 'Users' },
    { key: 'usuarios', label: 'Usuários', icon: 'Users' },
    { key: 'notas', label: 'Notas', icon: 'ClipboardList' },
    { key: 'frequencia', label: 'Frequência', icon: 'CalendarCheck2' },
    { key: 'ocorrencias', label: 'Ocorrências', icon: 'AlertTriangle' },
    { key: 'acompanhamento', label: 'Acompanhamento', icon: 'TrendingDown' },
    { key: 'comunicados', label: 'Comunicados', icon: 'Bell' },
  ],
  state: {
    active: 'visao-geral', mobileOpen: false, menuOpen: false,
    query: '',
    modalAluno: null, // null | 'novo' | <id>
    form: situacaoVaziaAluno(),
    erro: '',
    modalComunicado: false,
    formComunicado: { titulo: '', mensagem: '' },
    modalUsuario: false,
    formUsuario: { nome: '', email: '', senha: '', role: 'aluno', matricula: '', turmaId: '', dataNascimento: '', situacao: 'Regular', turmaIds: [], disciplinaIds: [], alunoIds: [], avatarCor: 'blue' },
  },

  abrirNovoAluno() {
    this.state.form = situacaoVaziaAluno()
    this.state.erro = ''
    this.state.modalAluno = 'novo'
    this.render()
  },

  abrirEdicaoAluno(a) {
    this.state.form = { nome: a.nome, matricula: a.matricula, turmaId: a.turmaId, dataNascimento: a.dataNascimento, situacao: a.situacao }
    this.state.erro = ''
    this.state.modalAluno = a.id
    this.render()
  },

  async salvarAluno() {
    const f = this.state.form
    if (!f.nome.trim() || !f.matricula.trim() || !f.turmaId) {
      this.state.erro = 'Preencha nome, matrícula e turma.'
      this.render()
      return
    }
    try {
      if (this.state.modalAluno === 'novo') await Store.addAluno(f)
      else if (this.state.modalAluno) await Store.updateAluno(this.state.modalAluno, f)
      this.state.modalAluno = null
      this.render()
    } catch (error) { this.state.erro = error.message; this.render() }
  },

  async salvarComunicado() {
    const f = this.state.formComunicado
    if (!f.titulo.trim() || !f.mensagem.trim()) return
    const session = Store.session
    try {
      await Store.addComunicado({ ...f, autorId: session.id, autorNome: session.nome, destinatarios: 'todos' })
      this.state.formComunicado = { titulo: '', mensagem: '' }
      this.state.modalComunicado = false
      this.render()
    } catch (error) { this.state.erro = error.message; this.render() }
  },

  abrirNovoUsuario() {
    this.state.formUsuario = { nome: '', email: '', senha: '', role: 'aluno', matricula: '', turmaId: '', dataNascimento: '', situacao: 'Regular', turmaIds: [], disciplinaIds: [], alunoIds: [], avatarCor: 'blue' }
    this.state.erro = ''
    this.state.modalUsuario = true
    this.render()
  },

  async salvarUsuario() {
    const f = this.state.formUsuario
    if (!f.nome.trim() || !f.email.trim() || !f.senha || !f.role) { this.state.erro = 'Preencha nome, e-mail, senha e perfil.'; this.render(); return }
    if (f.role === 'aluno' && (!f.matricula.trim() || !f.turmaId)) { this.state.erro = 'Para aluno, informe matrícula e turma.'; this.render(); return }
    if (f.role === 'professor' && !f.turmaIds.length) { this.state.erro = 'Para professor, selecione pelo menos uma turma.'; this.render(); return }
    if (f.role === 'responsavel' && !f.alunoIds.length) { this.state.erro = 'Para responsável, selecione pelo menos um aluno.'; this.render(); return }
    try { await Store.addUsuario(f); this.state.modalUsuario = false; this.state.erro = ''; this.render() } catch (error) { this.state.erro = error.message; this.render() }
  },

  contentVisaoGeral(db, session, alunosMuitasFaltas, alunosBaixoDesempenho) {
    const totalAlunos = db.alunos.length
    const frequenciaMedia = totalAlunos ? Math.round(db.alunos.reduce((acc, a) => acc + calcularFrequenciaAluno(db, a.id), 0) / totalAlunos) : 100
    return `
      ${sectionHeading({ title: `Olá, ${escapeHtml(session?.nome?.split(' ')[0] ?? '')}`, subtitle: 'Aqui está o resumo da coordenação hoje.' })}
      <section class="stat-grid">
        ${statCard({ icon: 'Users', label: 'Alunos matriculados', value: String(totalAlunos), detail: 'alunos' })}
        ${statCard({ icon: 'GraduationCap', label: 'Turmas ativas', value: String(db.turmas.length), detail: 'turmas' })}
        ${statCard({ icon: 'CalendarCheck2', label: 'Frequência média', value: `${frequenciaMedia}%`, detail: 'da escola' })}
        ${statCard({ icon: 'AlertTriangle', label: 'Ocorrências', value: String(db.ocorrencias.length), detail: 'registradas' })}
      </section>
      <section class="content-grid">
        <article class="panel alerts-panel">
          <div class="panel-heading"><div><h2>Alunos com muitas faltas</h2><p>Frequência abaixo de 80%</p></div><span class="count-badge">${alunosMuitasFaltas.length}</span></div>
          <div class="attention-list">
            ${alunosMuitasFaltas.slice(0, 5).map((a) => `<div class="attention-item"><div class="avatar avatar-${a.avatarCor}">${a.iniciais}</div><div><strong>${escapeHtml(a.nome)}</strong><span>${calcularFrequenciaAluno(db, a.id)}% de frequência</span></div></div>`).join('')}
            ${alunosMuitasFaltas.length === 0 ? emptyState('Nenhum aluno com frequência crítica.') : ''}
          </div>
        </article>
        <article class="panel alerts-panel">
          <div class="panel-heading"><div><h2>Baixo desempenho</h2><p>Média abaixo de 6,0</p></div><span class="count-badge">${alunosBaixoDesempenho.length}</span></div>
          <div class="attention-list">
            ${alunosBaixoDesempenho.slice(0, 5).map((a) => `<div class="attention-item"><div class="avatar avatar-${a.avatarCor}">${a.iniciais}</div><div><strong>${escapeHtml(a.nome)}</strong><span>Média ${calcularMediaAluno(db, a.id)}</span></div></div>`).join('')}
            ${alunosBaixoDesempenho.length === 0 ? emptyState('Nenhum aluno com baixo desempenho.') : ''}
          </div>
        </article>
      </section>`
  },

  contentAlunos(db, alunosFiltrados) {
    return `
      ${sectionHeading({ title: 'Alunos', subtitle: 'Cadastre, edite e consulte os alunos da escola.', actionHtml: `<button class="primary-button" data-action="novo-aluno">${icon('Plus')} Cadastrar aluno</button>` })}
      <div class="table-toolbar">
        <div class="search-box">${icon('Search')}<input id="busca-aluno" placeholder="Pesquisar por nome ou matrícula..." value="${escapeHtml(this.state.query)}" /></div>
      </div>
      <article class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Aluno</th><th>Matrícula</th><th>Turma</th><th>Frequência</th><th>Situação</th><th></th></tr></thead>
            <tbody>
              ${alunosFiltrados.map((a) => `
                <tr>
                  <td><div class="student-cell"><div class="avatar avatar-${a.avatarCor}">${a.iniciais}</div><strong>${escapeHtml(a.nome)}</strong></div></td>
                  <td>${a.matricula}</td>
                  <td>${getTurma(db, a.turmaId)?.nome ?? '—'}</td>
                  <td>${calcularFrequenciaAluno(db, a.id)}%</td>
                  <td>${situacaoPill(a.situacao)}</td>
                  <td><div class="row-actions"><button class="icon-btn-sm" data-editar-aluno="${a.id}" aria-label="Editar">${icon('Edit2')}</button></div></td>
                </tr>`).join('')}
              ${alunosFiltrados.length === 0 ? `<tr><td colspan="6">${emptyState('Nenhum aluno encontrado.')}</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </article>`
  },

  contentTurmas(db) {
    return `
      ${sectionHeading({ title: 'Turmas', subtitle: 'Consulte as turmas cadastradas.' })}
      <div class="info-card-grid">
        ${db.turmas.map((t) => `
          <div class="info-block">
            <h3>${t.nome} — ${t.serie}</h3>
            <div class="info-line"><span>Turno</span><strong>${t.turno}</strong></div>
            <div class="info-line"><span>Alunos</span><strong>${t.alunoIds.length}</strong></div>
            <div class="info-line"><span>Professores</span><strong>${t.professorIds.length}</strong></div>
          </div>`).join('')}
      </div>`
  },

  contentProfessores(db) {
    return `
      ${sectionHeading({ title: 'Professores', subtitle: 'Consulte os professores da escola.' })}
      <article class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Professor</th><th>E-mail</th><th>Turmas</th><th>Disciplinas</th></tr></thead>
            <tbody>
              ${db.professores.map((p) => `<tr><td><div class="student-cell"><div class="avatar avatar-blue">${p.iniciais}</div><strong>${escapeHtml(p.nome)}</strong></div></td><td>${p.email}</td><td>${p.turmaIds.map((id) => getTurma(db, id)?.nome).join(', ')}</td><td>${p.disciplinaIds.map((id) => db.disciplinas.find((d) => d.id === id)?.nome).join(', ')}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </article>`
  },

  contentUsuarios(db) {
    const nomes = { diretor: 'Diretor', coordenador: 'Coordenador', professor: 'Professor', aluno: 'Aluno', responsavel: 'Pai / Responsável' }
    return `${sectionHeading({ title: 'Usuários', subtitle: 'Crie novos acessos e defina a permissão de cada pessoa.', actionHtml: `<button class="primary-button" data-action="novo-usuario">${icon('Plus')} Cadastrar usuário</button>` })}
      <article class="panel"><div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th></tr></thead><tbody>
      ${(db.usuarios || []).map((u) => `<tr><td><div class="student-cell"><div class="avatar avatar-${u.avatarCor || 'blue'}">${escapeHtml(u.iniciais || '')}</div><strong>${escapeHtml(u.nome)}</strong></div></td><td>${escapeHtml(u.email)}</td><td>${nomes[u.role] || u.role}</td></tr>`).join('')}
      </tbody></table></div></article>`
  },

  contentNotas(db) {
    return `
      ${sectionHeading({ title: 'Notas', subtitle: 'Consulte as notas lançadas pelos professores.' })}
      <article class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Aluno</th><th>Disciplina</th><th>Bimestre</th><th>Nota</th><th>Data</th></tr></thead>
            <tbody>
              ${db.notas.map((n) => {
                const aluno = db.alunos.find((a) => a.id === n.alunoId)
                const disciplina = db.disciplinas.find((d) => d.id === n.disciplinaId)
                return `<tr><td>${aluno?.nome ?? ''}</td><td>${disciplina?.nome ?? ''}</td><td>${n.bimestre}º</td><td><strong>${Number(n.valor).toFixed(1)}</strong></td><td>${n.data}</td></tr>`
              }).join('')}
              ${db.notas.length === 0 ? `<tr><td colspan="5">${emptyState('Nenhuma nota lançada.')}</td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </article>`
  },

  contentFrequencia(db) {
    return `
      ${sectionHeading({ title: 'Frequência', subtitle: 'Consulte os registros de frequência das turmas.' })}
      <article class="panel">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Aluno</th><th>Turma</th><th>Data</th><th>Situação</th></tr></thead>
            <tbody>
              ${db.frequencias.map((f) => {
                const aluno = db.alunos.find((a) => a.id === f.alunoId)
                return `<tr><td>${aluno?.nome ?? ''}</td><td>${getTurma(db, f.turmaId)?.nome ?? ''}</td><td>${f.data}</td><td>${frequenciaPill(f.status)}</td></tr>`
              }).join('')}
            </tbody>
          </table>
        </div>
      </article>`
  },

  contentOcorrencias(db) {
    return `
      ${sectionHeading({ title: 'Ocorrências', subtitle: 'Consulte as ocorrências registradas pelos professores.' })}
      ${db.ocorrencias.map((o) => {
        const aluno = db.alunos.find((a) => a.id === o.alunoId)
        return `<div class="comunicado-card"><div class="comunicado-head"><strong>${escapeHtml(aluno?.nome ?? '')} — ${escapeHtml(o.tipo)}</strong><span>${o.data}</span></div><p>${escapeHtml(o.descricao)}</p><div class="comunicado-autor">Registrado por ${escapeHtml(o.autorNome)}</div></div>`
      }).join('')}
      ${db.ocorrencias.length === 0 ? emptyState('Nenhuma ocorrência registrada.') : ''}`
  },

  contentAcompanhamento(db, alunosMuitasFaltas, alunosBaixoDesempenho) {
    return `
      ${sectionHeading({ title: 'Acompanhamento', subtitle: 'Alunos que precisam de atenção especial.' })}
      <div class="content-grid">
        <article class="panel">
          <div class="panel-heading"><div><h2>Muitas faltas</h2><p>Frequência abaixo de 80%</p></div></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Aluno</th><th>Turma</th><th>Frequência</th></tr></thead>
              <tbody>
                ${alunosMuitasFaltas.map((a) => `<tr><td>${escapeHtml(a.nome)}</td><td>${getTurma(db, a.turmaId)?.nome ?? ''}</td><td>${calcularFrequenciaAluno(db, a.id)}%</td></tr>`).join('')}
                ${alunosMuitasFaltas.length === 0 ? `<tr><td colspan="3">${emptyState('Nenhum aluno nessa condição.')}</td></tr>` : ''}
              </tbody>
            </table>
          </div>
        </article>
        <article class="panel">
          <div class="panel-heading"><div><h2>Baixo desempenho</h2><p>Média abaixo de 6,0</p></div></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Aluno</th><th>Turma</th><th>Média</th></tr></thead>
              <tbody>
                ${alunosBaixoDesempenho.map((a) => `<tr><td>${escapeHtml(a.nome)}</td><td>${getTurma(db, a.turmaId)?.nome ?? ''}</td><td>${calcularMediaAluno(db, a.id)}</td></tr>`).join('')}
                ${alunosBaixoDesempenho.length === 0 ? `<tr><td colspan="3">${emptyState('Nenhum aluno nessa condição.')}</td></tr>` : ''}
              </tbody>
            </table>
          </div>
        </article>
      </div>`
  },

  contentComunicados(db) {
    return `
      ${sectionHeading({ title: 'Comunicados', subtitle: 'Crie e acompanhe comunicados enviados à comunidade escolar.', actionHtml: `<button class="primary-button" data-action="novo-comunicado">${icon('Plus')} Novo comunicado</button>` })}
      ${db.comunicados.map((c) => `
        <div class="comunicado-card">
          <div class="comunicado-head"><strong>${escapeHtml(c.titulo)}</strong><span>${c.data}</span></div>
          <p>${escapeHtml(c.mensagem)}</p>
          <div class="comunicado-autor">Publicado por ${escapeHtml(c.autorNome)}</div>
        </div>`).join('')}`
  },

  modalAlunoHtml() {
    if (!this.state.modalAluno) return ''
    const db = Store.db
    const f = this.state.form
    const body = `
      <div class="field"><label>Nome completo</label><input id="f-nome" value="${escapeHtml(f.nome)}" placeholder="Nome do aluno" /></div>
      <div class="field-row">
        <div class="field"><label>Matrícula</label><input id="f-matricula" value="${escapeHtml(f.matricula)}" placeholder="Nº de matrícula" /></div>
        <div class="field"><label>Data de nascimento</label><input id="f-nascimento" type="date" value="${f.dataNascimento}" /></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Turma</label>
          <select id="f-turma">
            <option value="">Selecione</option>
            ${db.turmas.map((t) => `<option value="${t.id}" ${f.turmaId === t.id ? 'selected' : ''}>${t.nome}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Situação</label>
          <select id="f-situacao">
            <option value="Regular" ${f.situacao === 'Regular' ? 'selected' : ''}>Regular</option>
            <option value="Atenção" ${f.situacao === 'Atenção' ? 'selected' : ''}>Atenção</option>
            <option value="Em risco" ${f.situacao === 'Em risco' ? 'selected' : ''}>Em risco</option>
          </select>
        </div>
      </div>
      ${this.state.erro ? `<p class="form-error">${escapeHtml(this.state.erro)}</p>` : ''}
      <div class="form-actions"><button class="btn-secondary" data-action="fechar-modal-aluno">Cancelar</button><button class="primary-button" data-action="salvar-aluno">Salvar</button></div>`
    return modalWrap({ title: this.state.modalAluno === 'novo' ? 'Cadastrar aluno' : 'Editar aluno', bodyHtml: body, closeAction: 'fechar-modal-aluno' })
  },

  modalComunicadoHtml() {
    if (!this.state.modalComunicado) return ''
    const f = this.state.formComunicado
    const body = `
      <div class="field"><label>Título</label><input id="fc-titulo" value="${escapeHtml(f.titulo)}" placeholder="Título do comunicado" /></div>
      <div class="field"><label>Mensagem</label><textarea id="fc-mensagem" placeholder="Escreva a mensagem...">${escapeHtml(f.mensagem)}</textarea></div>
      <div class="form-actions"><button class="btn-secondary" data-action="fechar-modal-comunicado">Cancelar</button><button class="primary-button" data-action="publicar-comunicado">Publicar</button></div>`
    return modalWrap({ title: 'Novo comunicado', bodyHtml: body, closeAction: 'fechar-modal-comunicado' })
  },

  modalUsuarioHtml() {
    if (!this.state.modalUsuario) return ''
    const db = Store.db; const f = this.state.formUsuario; const role = f.role
    const turmaOptions = db.turmas.map((t) => `<option value="${t.id}" ${f.turmaId === t.id ? 'selected' : ''}>${escapeHtml(t.nome)}</option>`).join('')
    const disciplinaOptions = db.disciplinas.map((d) => `<option value="${d.id}" ${f.disciplinaIds.includes(d.id) ? 'selected' : ''}>${escapeHtml(d.nome)}</option>`).join('')
    const alunoOptions = db.alunos.map((a) => `<option value="${a.id}" ${f.alunoIds.includes(a.id) ? 'selected' : ''}>${escapeHtml(a.nome)} — ${escapeHtml(a.matricula)}</option>`).join('')
    const body = `<div class="field"><label>Nome completo</label><input id="fu-nome" value="${escapeHtml(f.nome)}" placeholder="Nome completo" /></div>
      <div class="field-row"><div class="field"><label>E-mail de acesso</label><input id="fu-email" type="email" value="${escapeHtml(f.email)}" placeholder="pessoa@email.com" /></div><div class="field"><label>Senha inicial</label><input id="fu-senha" type="password" value="${escapeHtml(f.senha)}" placeholder="Mínimo de 6 caracteres" /></div></div>
      <div class="field"><label>Perfil de acesso</label><select id="fu-role"><option value="diretor" ${role === 'diretor' ? 'selected' : ''}>Diretor</option><option value="coordenador" ${role === 'coordenador' ? 'selected' : ''}>Coordenador</option><option value="professor" ${role === 'professor' ? 'selected' : ''}>Professor</option><option value="aluno" ${role === 'aluno' ? 'selected' : ''}>Aluno</option><option value="responsavel" ${role === 'responsavel' ? 'selected' : ''}>Pai / Responsável</option></select></div>
      ${role === 'aluno' ? `<div class="field-row"><div class="field"><label>Matrícula</label><input id="fu-matricula" value="${escapeHtml(f.matricula)}" placeholder="Número da matrícula" /></div><div class="field"><label>Turma</label><select id="fu-turma"><option value="">Selecione</option>${turmaOptions}</select></div></div><div class="field"><label>Data de nascimento</label><input id="fu-nascimento" type="date" value="${escapeHtml(f.dataNascimento)}" /></div>` : ''}
      ${role === 'professor' ? `<div class="field"><label>Turmas do professor</label><select id="fu-turmas" multiple size="3">${db.turmas.map((t) => `<option value="${t.id}" ${f.turmaIds.includes(t.id) ? 'selected' : ''}>${escapeHtml(t.nome)}</option>`).join('')}</select></div><div class="field"><label>Disciplinas</label><select id="fu-disciplinas" multiple size="4">${disciplinaOptions}</select></div>` : ''}
      ${role === 'responsavel' ? `<div class="field"><label>Alunos vinculados</label><select id="fu-alunos" multiple size="5">${alunoOptions}</select></div>` : ''}
      ${this.state.erro ? `<p class="form-error">${escapeHtml(this.state.erro)}</p>` : ''}<div class="form-actions"><button class="btn-secondary" data-action="fechar-modal-usuario">Cancelar</button><button class="primary-button" data-action="salvar-usuario">Criar usuário</button></div>`
    return modalWrap({ title: 'Cadastrar usuário', bodyHtml: body, closeAction: 'fechar-modal-usuario' })
  },

  render() {
    const db = Store.db
    const session = Store.session
    const totalAlunos = db.alunos.length
    const alunosFiltrados = db.alunos.filter((a) => `${a.nome} ${a.matricula}`.toLowerCase().includes(this.state.query.toLowerCase()))
    const alunosMuitasFaltas = db.alunos.filter((a) => calcularFrequenciaAluno(db, a.id) < 80)
    const alunosBaixoDesempenho = db.alunos.filter((a) => { const m = calcularMediaAluno(db, a.id); return m !== null && m < 6 })
    const label = this.navItems.find((n) => n.key === this.state.active)?.label ?? ''

    let content = ''
    if (this.state.active === 'visao-geral') content = this.contentVisaoGeral(db, session, alunosMuitasFaltas, alunosBaixoDesempenho)
    else if (this.state.active === 'alunos') content = this.contentAlunos(db, alunosFiltrados)
    else if (this.state.active === 'turmas') content = this.contentTurmas(db)
    else if (this.state.active === 'professores') content = this.contentProfessores(db)
    else if (this.state.active === 'usuarios') content = this.contentUsuarios(db)
    else if (this.state.active === 'notas') content = this.contentNotas(db)
    else if (this.state.active === 'frequencia') content = this.contentFrequencia(db)
    else if (this.state.active === 'ocorrencias') content = this.contentOcorrencias(db)
    else if (this.state.active === 'acompanhamento') content = this.contentAcompanhamento(db, alunosMuitasFaltas, alunosBaixoDesempenho)
    else if (this.state.active === 'comunicados') content = this.contentComunicados(db)

    content += this.modalAlunoHtml() + this.modalComunicadoHtml() + this.modalUsuarioHtml()

    document.getElementById('app-root').innerHTML = renderShell(this, label, content)
    bindShellEvents(document.getElementById('app-root'), this)
    this.bindContentEvents()
  },

  bindContentEvents() {
    const root = document.getElementById('app-root')

    const busca = document.getElementById('busca-aluno')
    if (busca) busca.addEventListener('input', (e) => { this.state.query = e.target.value; withFocusPreserved(() => this.render()) })

    const novoAlunoBtn = root.querySelector('[data-action="novo-aluno"]')
    if (novoAlunoBtn) novoAlunoBtn.addEventListener('click', () => this.abrirNovoAluno())

    root.querySelectorAll('[data-editar-aluno]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const aluno = Store.db.alunos.find((a) => a.id === btn.getAttribute('data-editar-aluno'))
        if (aluno) this.abrirEdicaoAluno(aluno)
      })
    })

    const novoComunicadoBtn = root.querySelector('[data-action="novo-comunicado"]')
    if (novoComunicadoBtn) novoComunicadoBtn.addEventListener('click', () => { this.state.modalComunicado = true; this.render() })

    const novoUsuarioBtn = root.querySelector('[data-action="novo-usuario"]')
    if (novoUsuarioBtn) novoUsuarioBtn.addEventListener('click', () => this.abrirNovoUsuario())

    const fu = (id, key, event = 'input') => { const el = document.getElementById(id); if (el) el.addEventListener(event, (e) => { this.state.formUsuario[key] = e.target.value }) }
    fu('fu-nome', 'nome'); fu('fu-email', 'email'); fu('fu-senha', 'senha'); fu('fu-matricula', 'matricula'); fu('fu-nascimento', 'dataNascimento'); fu('fu-turma', 'turmaId', 'change')
    const fuRole = document.getElementById('fu-role')
    if (fuRole) fuRole.addEventListener('change', (e) => { this.state.formUsuario.role = e.target.value; this.state.erro = ''; this.render() })
    const selected = (id) => Array.from(document.getElementById(id)?.selectedOptions || []).map((option) => option.value)
    const fuTurmas = document.getElementById('fu-turmas'); if (fuTurmas) fuTurmas.addEventListener('change', () => { this.state.formUsuario.turmaIds = selected('fu-turmas') })
    const fuDisciplinas = document.getElementById('fu-disciplinas'); if (fuDisciplinas) fuDisciplinas.addEventListener('change', () => { this.state.formUsuario.disciplinaIds = selected('fu-disciplinas') })
    const fuAlunos = document.getElementById('fu-alunos'); if (fuAlunos) fuAlunos.addEventListener('change', () => { this.state.formUsuario.alunoIds = selected('fu-alunos') })
    root.querySelectorAll('[data-action="fechar-modal-usuario"]').forEach((el) => el.addEventListener('click', () => { this.state.modalUsuario = false; this.state.erro = ''; this.render() }))
    const salvarUsuarioBtn = root.querySelector('[data-action="salvar-usuario"]')
    if (salvarUsuarioBtn) salvarUsuarioBtn.addEventListener('click', () => this.salvarUsuario())

    // Modal aluno
    ;['f-nome', 'f-matricula', 'f-nascimento'].forEach((id) => {
      const el = document.getElementById(id)
      if (el) el.addEventListener('input', (e) => {
        const map = { 'f-nome': 'nome', 'f-matricula': 'matricula', 'f-nascimento': 'dataNascimento' }
        this.state.form[map[id]] = e.target.value
      })
    })
    const fTurma = document.getElementById('f-turma')
    if (fTurma) fTurma.addEventListener('change', (e) => { this.state.form.turmaId = e.target.value })
    const fSituacao = document.getElementById('f-situacao')
    if (fSituacao) fSituacao.addEventListener('change', (e) => { this.state.form.situacao = e.target.value })
    root.querySelectorAll('[data-action="fechar-modal-aluno"]').forEach((el) => el.addEventListener('click', () => { this.state.modalAluno = null; this.render() }))
    const salvarAlunoBtn = root.querySelector('[data-action="salvar-aluno"]')
    if (salvarAlunoBtn) salvarAlunoBtn.addEventListener('click', () => this.salvarAluno())

    // Modal comunicado
    const fcTitulo = document.getElementById('fc-titulo')
    if (fcTitulo) fcTitulo.addEventListener('input', (e) => { this.state.formComunicado.titulo = e.target.value })
    const fcMensagem = document.getElementById('fc-mensagem')
    if (fcMensagem) fcMensagem.addEventListener('input', (e) => { this.state.formComunicado.mensagem = e.target.value })
    root.querySelectorAll('[data-action="fechar-modal-comunicado"]').forEach((el) => el.addEventListener('click', () => { this.state.modalComunicado = false; this.render() }))
    const publicarBtn = root.querySelector('[data-action="publicar-comunicado"]')
    if (publicarBtn) publicarBtn.addEventListener('click', () => this.salvarComunicado())
  },
}
