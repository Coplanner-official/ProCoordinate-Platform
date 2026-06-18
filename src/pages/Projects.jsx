import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STATUS_OPTIONS = ['active', 'on_hold', 'completed']

export default function Projects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', description: '', status: 'active' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase.from('projects').insert({
      ...form,
      owner_id: user.id,
    })
    if (error) { setError(error.message); setSaving(false); return }
    setForm({ name: '', address: '', description: '', status: 'active' })
    setShowForm(false)
    load()
    setSaving(false)
  }

  const statusColor = (s) => s === 'active' ? 'bg-green-400' : s === 'on_hold' ? 'bg-yellow-400' : 'bg-muted'

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="text-muted text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + New Project
        </button>
      </div>

      {showForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-medium text-white mb-4">New Project</h2>
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label block mb-1.5">Project Name *</label>
                <input className="input" placeholder="Harrow Extension" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="label block mb-1.5">Address</label>
                <input className="input" placeholder="14 Station Rd, Harrow HA1" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label block mb-1.5">Description</label>
              <textarea className="input resize-none" rows={2} placeholder="Brief project description…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="label block mb-1.5">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create Project'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-muted text-sm">Loading…</div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-muted mb-4">No projects yet. Create your first one.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ New Project</button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card flex items-center gap-4 px-5 py-4 hover:border-accent/30 transition-colors block">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColor(p.status)}`} />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">{p.name}</p>
                {p.address && <p className="text-sm text-muted mt-0.5">{p.address}</p>}
                {p.description && <p className="text-sm text-muted mt-0.5 truncate">{p.description}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs text-muted capitalize">{p.status?.replace('_', ' ')}</span>
                <p className="text-xs text-muted mt-0.5">{new Date(p.created_at).toLocaleDateString('en-GB')}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted flex-shrink-0">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
