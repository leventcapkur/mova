import { useCallback, useEffect, useMemo, useState } from 'react'
import { BadgeCheck, Ban, CheckCircle2, KeyRound, Loader2, Save, ShieldCheck, UserCog, UserRoundCheck } from 'lucide-react'
import { supabase } from './lib/supabase'

const dateTime = (value) => value ? new Date(value).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Henüz giriş yapmadı'

const call = async (action, targetUserId, payload = {}) => {
  const { data, error: invokeError } = await supabase.functions.invoke('admin-user-manager', { body: { action, targetUserId, payload } })
  if (invokeError || data?.error) throw new Error(data?.error || invokeError.message || 'Yönetim işlemi tamamlanamadı.')
  return data
}

function AdminUserManager({ currentUserId }) {
  const [users, setUsers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [form, setForm] = useState({ fullName: '', email: '' })
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await call('list')
      const nextUsers = data.users || []
      setUsers(nextUsers)
      setSelectedId((current) => current && nextUsers.some((item) => item.id === current) ? current : nextUsers[0]?.id || '')
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUsers() }, [loadUsers])

  const selected = useMemo(() => users.find((item) => item.id === selectedId), [selectedId, users])
  useEffect(() => { if (selected) setForm({ fullName: selected.fullName || '', email: selected.email || '' }) }, [selected])

  const run = async (action, payload, confirmText) => {
    if (!selected || working) return
    if (confirmText && !window.confirm(confirmText)) return
    setWorking(action)
    setMessage('')
    setError('')
    try {
      const result = await call(action, selected.id, payload)
      setMessage(result.message)
      await loadUsers()
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setWorking('')
    }
  }

  return <article className="admin-card admin-manager"><div className="admin-card-head"><div><span>KULLANICI YÖNETİMİ</span><h2>Hesaplar ve yetkiler</h2></div><UserCog size={19} /></div><p className="admin-manager-lead">Profil bilgisini güncelle, erişimi yönet veya güvenli şifre sıfırlama bağlantısı gönder.</p>{error && <div className="admin-manager-error">{error.includes('FunctionsHttpError') || error.includes('not found') ? <>Yönetim fonksiyonu henüz yayında değil. <code>supabase functions deploy admin-user-manager</code> komutunu çalıştır.</> : error}</div>}{message && <div className="admin-manager-success"><CheckCircle2 size={14} /> {message}</div>}<div className="admin-manager-layout"><div className="managed-user-list">{loading ? <div className="managed-user-loading"><Loader2 className="spinner" size={19} /> Kullanıcılar yükleniyor…</div> : users.map((account) => <button className={account.id === selectedId ? 'managed-user active' : 'managed-user'} key={account.id} onClick={() => setSelectedId(account.id)}><i>{(account.fullName || account.email || 'L').charAt(0).toUpperCase()}</i><span><strong>{account.fullName || 'İsimsiz kullanıcı'}</strong><small>{account.email}</small></span>{account.isAdmin && <ShieldCheck size={14} />}{account.isSuspended && <Ban size={14} />}</button>)}</div>{selected && <div className="managed-user-detail"><div className="managed-user-profile"><div><i>{(selected.fullName || selected.email).charAt(0).toUpperCase()}</i><span><strong>{selected.fullName || 'İsimsiz kullanıcı'}</strong><small>{selected.isSuspended ? 'Erişimi kapalı' : selected.isAdmin ? 'Yönetici hesabı' : 'Standart kullanıcı'}</small></span></div><small>Son giriş: {dateTime(selected.lastSignInAt)}</small></div><div className="managed-fields"><label>Ad soyad<input value={form.fullName} onChange={(event) => setForm((value) => ({ ...value, fullName: event.target.value }))} /></label><label>E-posta<input type="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} /></label></div><button className="managed-primary" disabled={Boolean(working)} onClick={() => run('update_profile', form)}><Save size={15} /> {working === 'update_profile' ? 'Kaydediliyor…' : 'Bilgileri kaydet'}</button><div className="managed-action-grid"><button disabled={Boolean(working)} onClick={() => run('send_password_reset', {}, `${selected.email} adresine şifre sıfırlama bağlantısı gönderilsin mi?`)}><KeyRound size={15} /> Şifre sıfırlama e-postası</button><button className={selected.isAdmin ? 'admin-role enabled' : 'admin-role'} disabled={Boolean(working) || (selected.id === currentUserId && users.filter((account) => account.isAdmin).length === 1)} onClick={() => run('set_admin', { isAdmin: !selected.isAdmin }, selected.isAdmin ? 'Bu kullanıcının yönetici yetkisi kaldırılsın mı?' : 'Bu kullanıcıya yönetici yetkisi verilsin mi?')}><BadgeCheck size={15} /> {selected.isAdmin ? 'Yöneticiliği kaldır' : 'Yönetici yap'}</button><button className={selected.isSuspended ? 'suspend active' : 'suspend'} disabled={Boolean(working) || selected.id === currentUserId} onClick={() => run('set_suspension', { suspended: !selected.isSuspended }, selected.isSuspended ? 'Kullanıcının erişimi yeniden açılsın mı?' : 'Bu kullanıcının erişimi kapatılsın mı?')}><Ban size={15} /> {selected.isSuspended ? 'Erişimi aç' : 'Erişimi kapat'}</button></div><p className="managed-note"><UserRoundCheck size={13} /> Şifre asla görüntülenmez; kullanıcıya yalnızca güvenli sıfırlama bağlantısı gönderilir.</p></div>}</div></article>
}

export default AdminUserManager
