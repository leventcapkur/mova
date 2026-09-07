import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, Database, RefreshCw, Sparkles } from 'lucide-react'
import { supabase } from './lib/supabase'

const checks = [
  { key: 'tasks', label: 'Görevler ve hedefler', table: 'tasks', sql: null },
  { key: 'habits', label: 'Alışkanlıklar', table: 'habits', sql: 'habits_step_2.sql' },
  { key: 'water', label: 'Su takibi', table: 'water_entries', sql: 'water_step_3.sql' },
  { key: 'sleep', label: 'Uyku takibi', table: 'sleep_entries', sql: 'sleep_step_4.sql' },
  { key: 'life', label: 'Ritim merkezi', table: 'mood_checkins', sql: 'life_center_step_6.sql' },
  { key: 'settings', label: 'Alanım ve yönetim', table: 'user_preferences', sql: 'experience_step_7.sql' },
]

function SetupStatus({ user }) {
  const [status, setStatus] = useState([])
  const [loading, setLoading] = useState(true)

  const inspect = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const values = await Promise.all(checks.map(async (item) => {
      const { error } = await supabase.from(item.table).select('*').limit(1)
      return { ...item, ready: !error }
    }))
    setStatus(values)
    setLoading(false)
  }, [user])

  useEffect(() => { inspect() }, [inspect])

  if (loading || status.every((item) => item.ready)) return null
  const missing = status.filter((item) => !item.ready)
  const sqlFiles = [...new Set(missing.map((item) => item.sql).filter(Boolean))]

  return <section className="setup-status"><div className="setup-status-icon"><Database size={18} /></div><div className="setup-status-content"><span><Sparkles size={12} /> KURULUM KONTROLÜ</span><h2>Mova’nın birkaç alanı henüz hazır değil.</h2><p>Eksik olan Supabase tabloları, ilgili SQL dosyası bir kez çalıştırılınca otomatik etkinleşir.</p><div className="setup-status-items">{status.map((item) => <div className={item.ready ? 'ready' : 'missing'} key={item.key}>{item.ready ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}<strong>{item.label}</strong>{!item.ready && item.sql && <code>{item.sql}</code>}</div>)}</div>{sqlFiles.length > 0 && <p className="setup-status-help">Supabase → <b>SQL Editor</b> alanında şu dosyaları sırayla çalıştır: {sqlFiles.join(', ')}</p>}</div><button className="setup-status-refresh" onClick={inspect} title="Kontrolü yenile"><RefreshCw size={16} /></button></section>
}

export default SetupStatus
