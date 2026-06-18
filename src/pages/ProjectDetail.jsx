import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Drawings Tab ───────────────────────────────────────────────────────────

function DrawingsTab({ projectId }) {
  const { user } = useAuth()
  const [drawings, setDrawings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', drawing_number: '', discipline: 'Architectural', current_revision: 'A', file_url: '' })
  const [saving, setSaving] = useState(false)
  const [revisionForm, setRevisionForm] = useState(null) // drawing id if open
  const [revForm, setRevForm] = useState({ revision: '', file_url: '', notes: '' })

  const DISCIPLINES = ['Architectural', 'Structural', 'MEP', 'Civil', 'Landscape', 'Other']

  const load = async () => {
    const { data } = await supabase
      .from('drawings')
      .select('*, drawing_revisions(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setDrawings(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [projectId])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('drawings').insert({ ...form, project_id: projectId, uploaded_by: user.id })
    setForm({ title: '', drawing_number: '', discipline: 'Architectural', current_revision: 'A', file_url: '' })
    setShowForm(false)
    load()
    setSaving(false)
  }

  const handleRevision = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('drawing_revisions').insert({ ...revForm, drawing_id: revisionForm, uploaded_by: user.id })
    await supabase.from('drawings').update({ current_revision: revForm.revision }).eq('id', revisionForm)
    setRevisionForm(null)
    setRevForm({ revision: '', file_url: '', notes: '' })
    load()
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted">{drawings.length} drawing{drawings.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Drawing</button>
      </div>

      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="text-sm font-medium text-white mb-4">New Drawing</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label block mb-1.5">Title *</label>
                <input className="input" placeholder="Ground Floor Plan" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label block mb-1.5">Drawing No.</label>
                <input className="input" placeholder="DWG-001" value={form.drawing_number} onChange={e => setForm(f => ({ ...f, drawing_number: e.target.value }))} />
              </div>
              <div>
                <label className="label block mb-1.5">Discipline</label>
                <select className="input" value={form.discipline} onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))}>
                  {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label block mb-1.5">Revision</label>
                <input className="input" placeholder="A" value={form.current_revision} onChange={e => setForm(f => ({ ...f, current_revision: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label block mb-1.5">File URL (Dropbox, Drive, etc.)</label>
              <input className="input" placeholder="https://…" value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Drawing'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {revisionForm && (
        <div className="card p-5 mb-5 border-accent/30">
          <h3 className="text-sm font-medium text-white mb-4">Upload New Revision</h3>
          <form onSubmit={handleRevision} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label block mb-1.5">Revision *</label>
                <input className="input" placeholder="B" required value={revForm.revision} onChange={e => setRevForm(f => ({ ...f, revision: e.target.value }))} />
              </div>
              <div>
                <label className="label block mb-1.5">File URL</label>
                <input className="input" placeholder="https://…" value={revForm.file_url} onChange={e => setRevForm(f => ({ ...f, file_url: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label block mb-1.5">Notes</label>
              <input className="input" placeholder="What changed in this revision…" value={revForm.notes} onChange={e => setRevForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Upload Revision'}</button>
              <button type="button" className="btn-secondary" onClick={() => setRevisionForm(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-muted text-sm">Loading…</p> : drawings.length === 0 ? (
        <div className="card p-10 text-center text-muted text-sm">No drawings yet.</div>
      ) : (
        <div className="space-y-2">
          {drawings.map(d => (
            <div key={d.id} className="card px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">{d.drawing_number || '—'}</span>
                    <span className="text-white font-medium text-sm">{d.title}</span>
                    <span className="text-xs text-muted bg-surface border border-border px-1.5 py-0.5 rounded font-mono">Rev {d.current_revision}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{d.discipline} · {(d.drawing_revisions?.length || 0)} revision{d.drawing_revisions?.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {d.file_url && (
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-orange-400 transition-colors">Open ↗</a>
                  )}
                  <button
                    onClick={() => { setRevisionForm(d.id); setRevForm({ revision: '', file_url: '', notes: '' }) }}
                    className="btn-secondary text-xs py-1 px-3"
                  >
                    + Rev
                  </button>
                </div>
              </div>
              {d.drawing_revisions?.length > 0 && (
                <div className="mt-3 pl-4 border-l border-border space-y-1">
                  {d.drawing_revisions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(r => (
                    <div key={r.id} className="flex items-center gap-3 text-xs text-muted">
                      <span className="font-mono">Rev {r.revision}</span>
                      <span>{new Date(r.created_at).toLocaleDateString('en-GB')}</span>
                      {r.notes && <span className="truncate">— {r.notes}</span>}
                      {r.file_url && <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-orange-400 ml-auto">Open ↗</a>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── RFIs Tab ───────────────────────────────────────────────────────────────

function RFIsTab({ projectId }) {
  const { user } = useAuth()
  const [rfis, setRfis] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject: '', description: '', priority: 'medium', assigned_to: '', due_date: '' })
  const [saving, setSaving] = useState(false)
  const [answerRfi, setAnswerRfi] = useState(null)
  const [answerText, setAnswerText] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('rfis')
      .select('*')
      .eq('project_id', projectId)
      .order('rfi_number', { ascending: false })
    setRfis(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [projectId])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    const nextNum = (rfis[0]?.rfi_number || 0) + 1
    await supabase.from('rfis').insert({ ...form, project_id: projectId, rfi_number: nextNum, created_by: user.id, status: 'open' })
    setForm({ subject: '', description: '', priority: 'medium', assigned_to: '', due_date: '' })
    setShowForm(false)
    load()
    setSaving(false)
  }

  const handleAnswer = async (id) => {
    await supabase.from('rfis').update({ answer: answerText, status: 'answered', answered_at: new Date().toISOString() }).eq('id', id)
    setAnswerRfi(null)
    setAnswerText('')
    load()
  }

  const handleClose = async (id) => {
    await supabase.from('rfis').update({ status: 'closed' }).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted">{rfis.length} RFI{rfis.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ New RFI</button>
      </div>

      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="text-sm font-medium text-white mb-4">New RFI</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="label block mb-1.5">Subject *</label>
              <input className="input" placeholder="Clarification needed on foundation depth" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <div>
              <label className="label block mb-1.5">Description</label>
              <textarea className="input resize-none" rows={3} placeholder="Full details of the query…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="label block mb-1.5">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="label block mb-1.5">Assigned To</label>
                <input className="input" placeholder="Mara Bravo" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} />
              </div>
              <div>
                <label className="label block mb-1.5">Due Date</label>
                <input type="date" className="input" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create RFI'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-muted text-sm">Loading…</p> : rfis.length === 0 ? (
        <div className="card p-10 text-center text-muted text-sm">No RFIs yet.</div>
      ) : (
        <div className="space-y-2">
          {rfis.map(r => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start gap-4">
                <span className="font-mono text-xs text-muted mt-0.5 flex-shrink-0">RFI-{String(r.rfi_number).padStart(3, '0')}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm">{r.subject}</span>
                    <span className={`badge-${r.status}`}>{r.status}</span>
                    <span className={`badge-${r.priority}`}>{r.priority}</span>
                  </div>
                  {r.description && <p className="text-xs text-muted mt-1">{r.description}</p>}
                  {r.assigned_to && <p className="text-xs text-muted mt-1">→ {r.assigned_to}{r.due_date ? ` · Due ${new Date(r.due_date).toLocaleDateString('en-GB')}` : ''}</p>}
                  {r.answer && (
                    <div className="mt-3 bg-green-500/5 border border-green-500/10 rounded p-3">
                      <p className="text-xs text-green-400 font-medium mb-1">Answer</p>
                      <p className="text-xs text-white">{r.answer}</p>
                    </div>
                  )}
                  {answerRfi === r.id && (
                    <div className="mt-3 space-y-2">
                      <textarea className="input resize-none" rows={3} placeholder="Type the answer…" value={answerText} onChange={e => setAnswerText(e.target.value)} />
                      <div className="flex gap-2">
                        <button onClick={() => handleAnswer(r.id)} className="btn-primary text-xs py-1">Submit Answer</button>
                        <button onClick={() => setAnswerRfi(null)} className="btn-secondary text-xs py-1">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {r.status === 'open' && (
                    <button onClick={() => setAnswerRfi(r.id)} className="btn-secondary text-xs py-1 px-3">Answer</button>
                  )}
                  {r.status === 'answered' && (
                    <button onClick={() => handleClose(r.id)} className="btn-secondary text-xs py-1 px-3">Close</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Daily Logs Tab ──────────────────────────────────────────────────────────

function LogsTab({ projectId }) {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    weather: '', workers_on_site: '', work_completed: '', issues: '', materials_delivered: ''
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('project_id', projectId)
      .order('log_date', { ascending: false })
    setLogs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [projectId])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('daily_logs').insert({ ...form, workers_on_site: parseInt(form.workers_on_site) || 0, project_id: projectId, created_by: user.id })
    setForm({ log_date: new Date().toISOString().split('T')[0], weather: '', workers_on_site: '', work_completed: '', issues: '', materials_delivered: '' })
    setShowForm(false)
    load()
    setSaving(false)
  }

  const WEATHER = ['Clear', 'Cloudy', 'Rain', 'Heavy Rain', 'Wind', 'Snow', 'Hot', 'Cold']

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted">{logs.length} log{logs.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ New Log</button>
      </div>

      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="text-sm font-medium text-white mb-4">Daily Site Log</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="label block mb-1.5">Date *</label>
                <input type="date" className="input" required value={form.log_date} onChange={e => setForm(f => ({ ...f, log_date: e.target.value }))} />
              </div>
              <div>
                <label className="label block mb-1.5">Weather</label>
                <select className="input" value={form.weather} onChange={e => setForm(f => ({ ...f, weather: e.target.value }))}>
                  <option value="">Select…</option>
                  {WEATHER.map(w => <option key={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="label block mb-1.5">Workers on Site</label>
                <input type="number" className="input" placeholder="3" min="0" value={form.workers_on_site} onChange={e => setForm(f => ({ ...f, workers_on_site: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label block mb-1.5">Work Completed</label>
              <textarea className="input resize-none" rows={3} placeholder="What was done today…" value={form.work_completed} onChange={e => setForm(f => ({ ...f, work_completed: e.target.value }))} />
            </div>
            <div>
              <label className="label block mb-1.5">Issues / Delays</label>
              <textarea className="input resize-none" rows={2} placeholder="Any problems or blockers…" value={form.issues} onChange={e => setForm(f => ({ ...f, issues: e.target.value }))} />
            </div>
            <div>
              <label className="label block mb-1.5">Materials Delivered</label>
              <input className="input" placeholder="Blocks, sand, cement…" value={form.materials_delivered} onChange={e => setForm(f => ({ ...f, materials_delivered: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Log'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-muted text-sm">Loading…</p> : logs.length === 0 ? (
        <div className="card p-10 text-center text-muted text-sm">No logs yet.</div>
      ) : (
        <div className="space-y-3">
          {logs.map(l => (
            <div key={l.id} className="card p-5">
              <div className="flex items-center gap-4 mb-3">
                <span className="font-mono text-sm text-accent">{new Date(l.log_date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <div className="flex items-center gap-3 text-xs text-muted">
                  {l.weather && <span>☁ {l.weather}</span>}
                  {l.workers_on_site > 0 && <span>👷 {l.workers_on_site} worker{l.workers_on_site !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <div className="space-y-2">
                {l.work_completed && (
                  <div>
                    <p className="label mb-0.5">Work Completed</p>
                    <p className="text-sm text-white">{l.work_completed}</p>
                  </div>
                )}
                {l.issues && (
                  <div>
                    <p className="label mb-0.5 text-yellow-400">Issues</p>
                    <p className="text-sm text-white">{l.issues}</p>
                  </div>
                )}
                {l.materials_delivered && (
                  <div>
                    <p className="label mb-0.5">Materials Delivered</p>
                    <p className="text-sm text-white">{l.materials_delivered}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Team Tab ────────────────────────────────────────────────────────────────

function TeamTab({ projectId }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setMembers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [projectId])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('team_members').insert({ ...form, project_id: projectId })
    setForm({ name: '', email: '', role: 'viewer' })
    setShowForm(false)
    load()
    setSaving(false)
  }

  const handleRemove = async (id) => {
    if (!confirm('Remove this team member?')) return
    await supabase.from('team_members').delete().eq('id', id)
    load()
  }

  const roleColor = (r) => r === 'admin' ? 'text-accent' : r === 'owner' ? 'text-yellow-400' : 'text-muted'

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-muted">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Member</button>
      </div>

      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="text-sm font-medium text-white mb-4">Add Team Member</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="label block mb-1.5">Name *</label>
                <input className="input" placeholder="Mara Bravo" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label block mb-1.5">Email</label>
                <input type="email" className="input" placeholder="mara@indomo.co.uk" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="label block mb-1.5">Role</label>
                <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add Member'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-muted text-sm">Loading…</p> : members.length === 0 ? (
        <div className="card p-10 text-center text-muted text-sm">No team members added yet.</div>
      ) : (
        <div className="card divide-y divide-border">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 rounded-full bg-surface border border-border text-xs font-mono font-medium text-muted flex items-center justify-center flex-shrink-0">
                {initials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{m.name}</p>
                {m.email && <p className="text-xs text-muted">{m.email}</p>}
              </div>
              <span className={`text-xs font-mono capitalize ${roleColor(m.role)}`}>{m.role}</span>
              <button onClick={() => handleRemove(m.id)} className="text-xs text-muted hover:text-red-400 transition-colors ml-2">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Project Detail (parent) ─────────────────────────────────────────────────

const TABS = [
  { key: 'drawings', label: 'Drawings' },
  { key: 'rfis', label: 'RFIs' },
  { key: 'logs', label: 'Site Logs' },
  { key: 'team', label: 'Team' },
]

export default function ProjectDetail() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [tab, setTab] = useState('drawings')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('projects').select('*').eq('id', id).single().then(({ data }) => {
      setProject(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div className="p-8 text-muted text-sm">Loading…</div>
  if (!project) return <div className="p-8 text-muted text-sm">Project not found.</div>

  const statusColor = project.status === 'active' ? 'bg-green-400' : project.status === 'on_hold' ? 'bg-yellow-400' : 'bg-muted'

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-7">
        <Link to="/projects" className="text-xs text-muted hover:text-white transition-colors mb-3 block">← Projects</Link>
        <div className="flex items-start gap-3">
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${statusColor}`} />
          <div>
            <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
            {project.address && <p className="text-muted text-sm mt-0.5">{project.address}</p>}
            {project.description && <p className="text-muted text-sm mt-0.5">{project.description}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'text-white border-accent'
                : 'text-muted border-transparent hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'drawings' && <DrawingsTab projectId={id} />}
      {tab === 'rfis' && <RFIsTab projectId={id} />}
      {tab === 'logs' && <LogsTab projectId={id} />}
      {tab === 'team' && <TeamTab projectId={id} />}
    </div>
  )
}
