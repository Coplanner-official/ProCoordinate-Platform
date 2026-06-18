import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ projects: 0, rfis: 0, logs: 0, drawings: 0 })
  const [recentProjects, setRecentProjects] = useState([])
  const [recentRfis, setRecentRfis] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ count: pCount }, { count: rCount }, { count: lCount }, { count: dCount }] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
        supabase.from('rfis').select('*', { count: 'exact', head: true }),
        supabase.from('daily_logs').select('*', { count: 'exact', head: true }),
        supabase.from('drawings').select('*', { count: 'exact', head: true }),
      ])
      setStats({ projects: pCount || 0, rfis: rCount || 0, logs: lCount || 0, drawings: dCount || 0 })

      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentProjects(projects || [])

      const { data: rfis } = await supabase
        .from('rfis')
        .select('*, projects(name)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentRfis(rfis || [])

      setLoading(false)
    }
    load()
  }, [user.id])

  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  const statCards = [
    { label: 'Projects', value: stats.projects, color: 'text-accent' },
    { label: 'Drawings', value: stats.drawings, color: 'text-blue-400' },
    { label: 'Open RFIs', value: stats.rfis, color: 'text-yellow-400' },
    { label: 'Site Logs', value: stats.logs, color: 'text-green-400' },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Good to see you, {name}.</h1>
        <p className="text-muted mt-1 text-sm">Here's what's happening across your projects.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="label mb-2">{label}</p>
            <p className={`text-3xl font-mono font-medium ${color}`}>{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-white">Recent Projects</h2>
            <Link to="/projects" className="text-xs text-accent hover:text-orange-400 transition-colors">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-5 py-4 text-sm text-muted">Loading…</div>
            ) : recentProjects.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-muted mb-3">No projects yet</p>
                <Link to="/projects" className="btn-primary">Create first project</Link>
              </div>
            ) : recentProjects.map(p => (
              <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-border/30 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'active' ? 'bg-green-400' : p.status === 'on_hold' ? 'bg-yellow-400' : 'bg-muted'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted truncate">{p.address || 'No address'}</p>
                </div>
                <span className="text-xs text-muted capitalize">{p.status?.replace('_', ' ')}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Open RFIs */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-white">Open RFIs</h2>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-5 py-4 text-sm text-muted">Loading…</div>
            ) : recentRfis.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-muted">No open RFIs</p>
              </div>
            ) : recentRfis.map(r => (
              <Link key={r.id} to={`/projects/${r.project_id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-border/30 transition-colors">
                <span className="font-mono text-xs text-muted flex-shrink-0">RFI-{String(r.rfi_number).padStart(3, '0')}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{r.subject}</p>
                  <p className="text-xs text-muted">{r.projects?.name}</p>
                </div>
                <span className={`badge-${r.priority}`}>{r.priority}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
