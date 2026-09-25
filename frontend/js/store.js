/* ===== EMAII :: Store (API PHP + estado em memória) ===== */
const API_BASE = window.EMAII_CONFIG?.API_URL || '../backend/api/index.php'
const CORES = ['red', 'rose', 'amber', 'blue', 'violet']

function uid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}` }
function iniciaisDe(nome) { const partes = nome.trim().split(/\s+/); return (partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '') }
function hoje() { return new Date().toISOString().slice(0, 10) }

const Store = {
  db: null,
  session: null,
  loading: false,

  async request(action, options = {}) {
    const response = await fetch(`${API_BASE}?action=${encodeURIComponent(action)}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
      body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      if (response.status === 401) { this.session = null; this.db = null }
      throw new Error(data.erro || 'Não foi possível concluir a operação.')
    }
    return data
  },

  async init() {
    this.loading = true
    try {
      const session = await this.request('session')
      if (session.autenticado) await this.reload()
    } finally { this.loading = false }
  },

  async reload() {
    const data = await this.request('bootstrap')
    this.session = data.usuario
    this.db = data.db
    return data
  },

  async login(email, senha, role) {
    const data = await this.request('login', { method: 'POST', body: { email, senha, role } })
    this.session = data.usuario
    await this.reload()
  },

  async logout() {
    try { await this.request('logout', { method: 'POST', body: {} }) } finally { this.session = null; this.db = null }
  },

  async mutate(action, payload) {
    const result = await this.request(action, { method: 'POST', body: payload })
    await this.reload()
    return result
  },

  usuariosPorRole(role) { return (this.db?.usuarios ?? []).filter((usuario) => !role || usuario.role === role) },
  async addUsuario(usuario) { return this.mutate('add_user', usuario) },
  async addAluno(aluno) { return this.mutate('add_student', aluno) },
  async updateAluno(id, patch) { return this.mutate('update_student', { id, ...patch }) },
  async addNota(nota) { return this.mutate('add_grade', nota) },
  async addFrequencia(freq) { return this.mutate('add_attendance', freq) },
  async addOcorrencia(oc) { return this.mutate('add_occurrence', oc) },
  async addAtividade(at) { return this.mutate('add_activity', at) },
  async addComunicado(c) { return this.mutate('add_announcement', c) },
  async addObservacao(o) { return this.mutate('add_observation', o) },
}
