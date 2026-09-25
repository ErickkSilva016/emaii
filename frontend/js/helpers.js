/* ===== EMAII :: Helpers (equivalente a components/painel/common.tsx) ===== */

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function statCard({ icon: iconName, label, value, detail, trend }) {
  return `
    <article class="stat-card">
      <div class="stat-topline">
        <div class="stat-icon">${icon(iconName)}</div>
        <span class="stat-trend">${trend ?? 'Atualizado hoje'}</span>
      </div>
      <p class="stat-label">${escapeHtml(label)}</p>
      <div class="stat-value-row"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(detail)}</span></div>
    </article>`
}

function sectionHeading({ title, subtitle, actionHtml }) {
  return `
    <section class="page-heading">
      <div>
        <h1>${title}</h1>
        ${subtitle ? `<p class="heading-copy">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      ${actionHtml ?? ''}
    </section>`
}

function emptyState(text) {
  return `<div class="empty-state">${escapeHtml(text)}</div>`
}

function situacaoPill(situacao) {
  const classe = situacao === 'Regular' ? 'status-ok' : situacao === 'Em risco' ? 'status-risk' : 'status-warning'
  return `<span class="status-pill ${classe}"><i></i>${escapeHtml(situacao)}</span>`
}

function frequenciaLabel(status) {
  if (status === 'presente') return 'Presente'
  if (status === 'falta') return 'Falta'
  return 'Falta justificada'
}

function frequenciaPill(status) {
  const classe = status === 'presente' ? 'status-ok' : status === 'falta' ? 'status-risk' : 'status-warning'
  return `<span class="status-pill ${classe}"><i></i>${frequenciaLabel(status)}</span>`
}

function tipoOcorrenciaPill(tipo) {
  const classe = tipo === 'Elogio' ? 'status-ok' : (tipo === 'Advertência' || tipo === 'Suspensão') ? 'status-risk' : 'status-warning'
  return `<span class="status-pill ${classe}"><i></i>${escapeHtml(tipo)}</span>`
}

function getAluno(db, id) { return db.alunos.find((a) => a.id === id) }
function getTurma(db, id) { return db.turmas.find((t) => t.id === id) }
function getDisciplina(db, id) { return db.disciplinas.find((d) => d.id === id) }
function getProfessor(db, id) { return db.professores.find((p) => p.id === id) }

function calcularFrequenciaAluno(db, alunoId) {
  const registros = db.frequencias.filter((f) => f.alunoId === alunoId)
  if (registros.length === 0) return 100
  const presentes = registros.filter((r) => r.status !== 'falta').length
  return Math.round((presentes / registros.length) * 100)
}

function calcularMediaAluno(db, alunoId) {
  const notas = db.notas.filter((n) => n.alunoId === alunoId)
  if (notas.length === 0) return null
  const soma = notas.reduce((acc, n) => acc + n.valor, 0)
  return Math.round((soma / notas.length) * 10) / 10
}

function contarFaltas(db, alunoId) {
  return db.frequencias.filter((f) => f.alunoId === alunoId && f.status === 'falta').length
}

/** Executa fn() (normalmente um re-render) preservando foco e posição do cursor no input ativo. */
function withFocusPreserved(fn) {
  const active = document.activeElement
  const id = active && active.id
  const hasSelection = active && 'selectionStart' in active
  const selStart = hasSelection ? active.selectionStart : null
  const selEnd = hasSelection ? active.selectionEnd : null
  fn()
  if (id) {
    const el = document.getElementById(id)
    if (el) {
      el.focus()
      if (selStart != null && el.setSelectionRange) {
        try { el.setSelectionRange(selStart, selEnd) } catch {}
      }
    }
  }
}

/* Modal genérico. onCloseAttr é o atributo data-* usado para fechar via delegação de eventos. */
function modalWrap({ title, bodyHtml, wide, closeAction }) {
  return `
    <div class="modal-scrim" data-action="${closeAction}">
      <div class="modal-box ${wide ? 'modal-wide' : ''}" onclick="event.stopPropagation()">
        <div class="modal-head">
          <strong>${escapeHtml(title)}</strong>
          <button class="modal-close" data-action="${closeAction}" aria-label="Fechar">${icon('X')}</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
      </div>
    </div>`
}
