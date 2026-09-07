import { useEffect, useRef, useState } from 'react'
import { BellRing, Check, Download, KeyRound, Leaf, Mail, Save, Sparkles, UserRound } from 'lucide-react'
import { supabase } from './lib/supabase'

const defaultPreferences = {
  daily_intention: '',
  reminders_enabled: false,
  reminder_time: '09:00',
  weekly_review_enabled: true,
  onboarding_completed: false,
}

function PersonalSettings({ user, onUserUpdated }) {
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [databaseReady, setDatabaseReady] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const lastReminder = useRef('')

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return
      setLoading(true)
      const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle()
      if (error) setDatabaseReady(false)
      else if (data) setPreferences((current) => ({ ...current, ...data }))
      setLoading(false)
    }
    loadPreferences()
  }, [user])

  useEffect(() => {
    if (!preferences.reminders_enabled || !preferences.reminder_time || !('Notification' in window)) return undefined
    const notify = () => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const key = `${now.toLocaleDateString('en-CA')}-${currentTime}`
      if (currentTime === preferences.reminder_time && lastReminder.current !== key && Notification.permission === 'granted') {
        lastReminder.current = key
        new Notification('Mova · Kendine dön', { body: preferences.daily_intention || 'Küçük bir adım için güzel bir an.' })
      }
    }
    notify()
    const id = window.setInterval(notify, 30000)
    return () => window.clearInterval(id)
  }, [preferences.daily_intention, preferences.reminder_time, preferences.reminders_enabled])

  const showMessage = (text) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2800)
  }

  const saveSettings = async () => {
    if (!user) return
    setSaving(true)
    try {
      if (preferences.reminders_enabled && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission()
      const [preferenceResult, profileResult, publicProfileResult] = await Promise.all([
        supabase.from('user_preferences').upsert({ user_id: user.id, ...preferences, onboarding_completed: true }, { onConflict: 'user_id' }),
        supabase.auth.updateUser({ data: { full_name: fullName.trim() } }),
        supabase.from('profiles').upsert({ id: user.id, full_name: fullName.trim(), email: user.email }, { onConflict: 'id' }),
      ])
      if (preferenceResult.error || profileResult.error || publicProfileResult.error) throw preferenceResult.error || profileResult.error || publicProfileResult.error
      setPreferences((current) => ({ ...current, onboarding_completed: true }))
      onUserUpdated?.(profileResult.data.user)
      showMessage('Kişisel alanın güncellendi.')
    } catch (error) {
      console.error('Ayarlar kaydedilemedi:', error)
      showMessage('Ayarlar kaydedilemedi. Önce SQL kurulumunu tamamla.')
    } finally {
      setSaving(false)
    }
  }

  const exportPersonalData = async () => {
    if (!user || exporting) return
    setExporting(true)

    const sources = [
      ['profil', supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()],
      ['tercihler', supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle()],
      ['gorevler', supabase.from('tasks').select('*').eq('user_id', user.id)],
      ['hedefler', supabase.from('goals').select('*').eq('user_id', user.id)],
      ['aliskanliklar', supabase.from('habits').select('*').eq('user_id', user.id)],
      ['aliskanlik_tamamlamalari', supabase.from('habit_completions').select('*').eq('user_id', user.id)],
      ['su_hedefi', supabase.from('water_settings').select('*').eq('user_id', user.id).maybeSingle()],
      ['su_kayitlari', supabase.from('water_entries').select('*').eq('user_id', user.id)],
      ['uyku_kayitlari', supabase.from('sleep_entries').select('*').eq('user_id', user.id)],
      ['gunluk_checkin', supabase.from('mood_checkins').select('*').eq('user_id', user.id)],
      ['gunluk_notlari', supabase.from('journal_entries').select('*').eq('user_id', user.id)],
      ['denge_puanlari', supabase.from('life_balance_scores').select('*').eq('user_id', user.id)],
      ['haftalik_degerlendirmeler', supabase.from('weekly_reviews').select('*').eq('user_id', user.id)],
      ['odak_seanslari', supabase.from('focus_sessions').select('*').eq('user_id', user.id)],
      ['meydan_okumalar', supabase.from('user_challenges').select('*').eq('user_id', user.id)],
    ]

    try {
      const results = await Promise.all(sources.map(async ([name, request]) => [name, await request]))
      const data = {}
      const unavailable = []

      results.forEach(([name, result]) => {
        if (result.error) unavailable.push(name)
        else data[name] = result.data
      })

      const exportFile = {
        app: 'Mova',
        exported_at: new Date().toISOString(),
        account: { id: user.id, email: user.email, full_name: fullName.trim() || user.user_metadata?.full_name || '' },
        data,
        ...(unavailable.length ? { unavailable_sections: unavailable } : {}),
      }
      const blob = new Blob([JSON.stringify(exportFile, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mova-verilerim-${new Date().toLocaleDateString('en-CA')}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      showMessage(unavailable.length ? 'Verilerin indirildi. Bazı henüz kurulmamış alanlar atlandı.' : 'Verilerin indirilmeye hazır.')
    } catch (error) {
      console.error('Veri dışa aktarma hatası:', error)
      showMessage('Verilerin hazırlanırken bir sorun oluştu.')
    } finally {
      setExporting(false)
    }
  }

  const requestPasswordReset = async () => {
    if (!user?.email || resettingPassword) return
    setResettingPassword(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin })
      if (error) throw error
      showMessage('Şifre yenileme bağlantısı e-posta adresine gönderildi.')
    } catch (error) {
      console.error('Şifre yenileme e-postası gönderilemedi:', error)
      showMessage('Şifre yenileme e-postası gönderilemedi. Daha sonra tekrar dene.')
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <section className="settings-page">
      <div className="settings-hero"><div className="settings-wave wave-a" /><div className="settings-wave wave-b" /><div><span><Sparkles size={13} /> KİŞİSEL ALANIN</span><h1>Hayatın sana göre<br /><em>şekillensin.</em></h1><p>Mova’nın ritmini, niyetini ve hatırlatmalarını kendi gününe göre ayarla.</p></div><Leaf className="settings-leaf" size={70} /></div>
      {!databaseReady && <div className="settings-setup"><Sparkles size={18} /><div><strong>Ayarlar için kısa kurulum gerekli.</strong><span><code>supabase/experience_step_7.sql</code> dosyasını Supabase SQL Editor’da bir kez çalıştır.</span></div></div>}
      <div className="settings-grid">
        <article className="settings-card identity-card"><div className="settings-card-head"><div><span>PROFİLİN</span><h2>Seni nasıl karşılayalım?</h2></div><UserRound size={20} /></div><label>Adın<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Adın" /></label><label>E-posta<input value={user?.email || ''} disabled /><small><Mail size={12} /> E-posta hesabınla bağlı</small></label></article>
        <article className="settings-card intention-card"><div className="settings-card-head"><div><span>GÜNLÜK NİYET</span><h2>Bugün neye alan açıyorsun?</h2></div><Sparkles size={20} /></div><textarea value={preferences.daily_intention} onChange={(event) => setPreferences((value) => ({ ...value, daily_intention: event.target.value }))} placeholder="Örn. Gün içinde kendime daha sakin alan açacağım." /><p>Bu cümle, günün hatırlatmasında sana eşlik eder.</p></article>
        <article className="settings-card reminder-card"><div className="settings-card-head"><div><span>NAZİK HATIRLATMA</span><h2>Ritimden kopma</h2></div><BellRing size={20} /></div><div className="reminder-toggle"><div><strong>Günlük hatırlatma</strong><small>Tarayıcı açıkken seçtiğin saatte gelir.</small></div><button className={preferences.reminders_enabled ? 'toggle active' : 'toggle'} onClick={() => setPreferences((value) => ({ ...value, reminders_enabled: !value.reminders_enabled }))} aria-label="Günlük hatırlatmayı aç veya kapat"><i /></button></div><label className="reminder-time">Hatırlatma saati<input type="time" value={preferences.reminder_time} onChange={(event) => setPreferences((value) => ({ ...value, reminder_time: event.target.value }))} disabled={!preferences.reminders_enabled} /></label><div className="weekly-toggle"><button className={preferences.weekly_review_enabled ? 'weekly-check checked' : 'weekly-check'} onClick={() => setPreferences((value) => ({ ...value, weekly_review_enabled: !value.weekly_review_enabled }))}>{preferences.weekly_review_enabled && <Check size={14} />}</button><span>Haftalık değerlendirme zamanı geldiğinde bana hatırlat.</span></div></article>
      </div>
      <article className="settings-data"><div className="settings-data-icon"><Download size={19} /></div><div><span>VERİLERİN</span><h2>Kişisel verilerini yanında taşı</h2><p>Görevlerin, hedeflerin, ritmin ve kayıtların tek bir JSON dosyasında hazırlanır.</p></div><button onClick={exportPersonalData} disabled={exporting}><Download size={16} /> {exporting ? 'Hazırlanıyor…' : 'Verilerimi indir'}</button></article>
      <article className="settings-security"><div className="settings-security-icon"><KeyRound size={19} /></div><div><span>HESAP GÜVENLİĞİ</span><h2>Şifreni güvenle yenile</h2><p>Yeni şifre belirlemen için e-posta adresine tek kullanımlık bir bağlantı göndeririz.</p></div><button onClick={requestPasswordReset} disabled={resettingPassword}><Mail size={16} /> {resettingPassword ? 'Gönderiliyor…' : 'Şifre yenileme e-postası'}</button></article>
      <div className="settings-save"><div>{loading ? 'Ayarların hazırlanıyor…' : <><strong>Kendi ritmini kur.</strong><span>Küçük tercihler, sürdürülebilir bir günün temelidir.</span></>}</div><button onClick={saveSettings} disabled={saving}><Save size={16} /> {saving ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}</button></div>
      {message && <div className="settings-toast">{message}</div>}
      <SettingsStyles />
    </section>
  )
}

function SettingsStyles() {
  return <style>{`
    .settings-page{max-width:1184px;margin:0 auto;padding:38px 28px 70px;color:#e8f4ec}.settings-hero{position:relative;display:flex;justify-content:space-between;align-items:center;min-height:216px;overflow:hidden;padding:35px 48px;border-radius:25px;background:linear-gradient(132deg,#174239,#46866c 58%,#d9d59b)}.settings-hero>div:not(.settings-wave),.settings-leaf{position:relative;z-index:1}.settings-hero span{display:flex;align-items:center;gap:6px;color:#e6f2b4;font-size:9px;font-weight:800;letter-spacing:1.5px}.settings-hero h1{margin:11px 0;font-size:37px;line-height:1.09;letter-spacing:-1.8px}.settings-hero h1 em{color:#f5f8cd;font-style:normal}.settings-hero p{max-width:460px;margin:0;color:#e0ecde;font-size:12px;line-height:1.65}.settings-leaf{right:65px;color:#e8f5b7;opacity:.88;transform:rotate(-22deg);filter:drop-shadow(0 10px 14px rgba(22,64,46,.25));animation:leafSway 5s ease-in-out infinite}@keyframes leafSway{50%{transform:rotate(-8deg) translateY(-7px)}}.settings-wave{position:absolute;border-radius:50%;border:1px solid rgba(255,255,255,.16);animation:waveSpin 18s linear infinite}.wave-a{width:390px;height:390px;right:-120px;bottom:-270px;box-shadow:0 0 0 48px rgba(255,255,255,.05),0 0 0 96px rgba(255,255,255,.025)}.wave-b{width:230px;height:230px;left:-70px;top:-155px;background:rgba(229,244,172,.09)}@keyframes waveSpin{to{transform:rotate(360deg)}}.settings-setup{display:flex;gap:11px;align-items:flex-start;margin-top:18px;padding:14px 16px;border:1px solid #d7c978;border-radius:13px;background:#fffbe6;color:#755f18;font-size:11px}.settings-setup strong,.settings-setup span{display:block}.settings-setup span{margin-top:3px;color:#8b7c43}.settings-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:18px}.settings-card{padding:21px;border:1px solid #2d4d43;border-radius:19px;background:#10251f}.settings-card-head{display:flex;justify-content:space-between;align-items:flex-start;color:#98d0a4}.settings-card-head span{display:block;color:#a1caab;font-size:9px;font-weight:800;letter-spacing:1.3px}.settings-card-head h2{margin:7px 0 0;color:#eff9ef;font-size:16px;letter-spacing:-.4px}.settings-card label{display:block;margin-top:19px;color:#b8d0bf;font-size:10px}.settings-card input,.settings-card textarea{box-sizing:border-box;width:100%;margin-top:7px;border:1px solid #345348;border-radius:10px;padding:11px;background:#0d1d1a;color:#e5f2e7;outline:0;font-size:11px}.settings-card input:focus,.settings-card textarea:focus{border-color:#93ca7c;box-shadow:0 0 0 3px rgba(145,201,120,.12)}.settings-card input:disabled{color:#8ca397;cursor:not-allowed}.settings-card label small{display:flex;gap:5px;align-items:center;margin-top:7px;color:#87a799;font-size:9px}.intention-card{background:linear-gradient(155deg,#1d4b3d,#14322b)}.intention-card textarea{height:112px;resize:none;line-height:1.55}.intention-card p{margin:10px 0 0;color:#a8c1af;font-size:10px;line-height:1.45}.reminder-card{background:#122720}.reminder-toggle{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:23px}.reminder-toggle strong,.reminder-toggle small{display:block}.reminder-toggle strong{font-size:11px}.reminder-toggle small{margin-top:4px;color:#9bb7a7;font-size:9px;line-height:1.4}.toggle{position:relative;flex:0 0 auto;width:40px;height:23px;border:0;border-radius:16px;background:#38564b}.toggle i{position:absolute;top:4px;left:4px;width:15px;height:15px;border-radius:50%;background:#bed3c5;transition:all .25s}.toggle.active{background:#7cb870}.toggle.active i{left:21px;background:#f3fed3}.reminder-time{display:flex!important;align-items:center;justify-content:space-between;margin-top:22px!important}.reminder-time input{width:94px!important;margin-top:0!important;padding:8px!important}.weekly-toggle{display:flex;gap:8px;align-items:flex-start;margin-top:16px;color:#abc3b2;font-size:9px;line-height:1.45}.weekly-check{display:grid;place-items:center;flex:0 0 auto;width:18px;height:18px;border:1px solid #54766a;border-radius:6px;background:transparent;color:#153d31}.weekly-check.checked{border-color:#bfe496;background:#cce7a3}.settings-save{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:17px;padding:19px 22px;border:1px solid #375a4c;border-radius:17px;background:#17372e}.settings-save strong,.settings-save span{display:block}.settings-save strong{font-size:13px}.settings-save span{margin-top:4px;color:#a9c0b0;font-size:10px}.settings-save button{display:flex;align-items:center;gap:7px;flex:0 0 auto;border:0;border-radius:10px;padding:12px 15px;background:#cfe99b;color:#29543c;font-size:10px;font-weight:800}.settings-save button:disabled{opacity:.65}.settings-toast{position:fixed;right:24px;bottom:24px;z-index:300;padding:12px 14px;border:1px solid rgba(151,211,135,.3);border-radius:11px;background:#1d4938;color:#e5f8d0;box-shadow:0 15px 35px rgba(0,0,0,.25);font-size:11px}@media(max-width:900px){.settings-grid{grid-template-columns:1fr 1fr}.reminder-card{grid-column:span 2}}@media(max-width:620px){.settings-page{padding:24px 18px 54px}.settings-hero{min-height:240px;padding:30px 25px}.settings-hero h1{font-size:30px}.settings-leaf{position:absolute;right:19px;bottom:25px;width:50px}.settings-grid{grid-template-columns:1fr}.reminder-card{grid-column:auto}.settings-save{align-items:flex-start;flex-direction:column}.settings-save button{width:100%;justify-content:center}.settings-toast{right:16px;bottom:16px}}
    .settings-data{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:17px;margin-top:16px;padding:19px 21px;border:1px solid rgba(167,211,145,.34);border-radius:18px;background:linear-gradient(105deg,#183d31,#204c3b);box-shadow:0 14px 30px rgba(3,24,16,.12)}.settings-data-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#d7efa8;color:#2c684e}.settings-data span{display:block;color:#c9e9a7;font-size:9px;font-weight:800;letter-spacing:1.25px}.settings-data h2{margin:5px 0 0;color:#eff9eb;font-size:15px;letter-spacing:-.35px}.settings-data p{margin:5px 0 0;color:#acc6b3;font-size:10px;line-height:1.5}.settings-data button{display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid rgba(241,255,219,.55);border-radius:10px;padding:11px 13px;background:#eff8d8;color:#326447;font-size:10px;font-weight:800}.settings-data button:hover:not(:disabled){background:#fff}.settings-data button:disabled{opacity:.65;cursor:wait}@media(max-width:620px){.settings-data{grid-template-columns:auto 1fr;gap:12px;padding:17px}.settings-data button{grid-column:1 / -1;width:100%;margin-top:2px}}
    .settings-security{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:17px;margin-top:12px;padding:19px 21px;border:1px solid rgba(129,187,166,.32);border-radius:18px;background:linear-gradient(105deg,#123b35,#19483d);box-shadow:0 14px 30px rgba(3,24,16,.12)}.settings-security-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:13px;background:#b9ead1;color:#236851}.settings-security span{display:block;color:#bde5c5;font-size:9px;font-weight:800;letter-spacing:1.25px}.settings-security h2{margin:5px 0 0;color:#eff9eb;font-size:15px;letter-spacing:-.35px}.settings-security p{margin:5px 0 0;color:#abc6b4;font-size:10px;line-height:1.5}.settings-security button{display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid rgba(190,233,211,.4);border-radius:10px;padding:11px 13px;background:rgba(236,250,227,.11);color:#e9f9e8;font-size:10px;font-weight:800}.settings-security button:hover:not(:disabled){border-color:#dff8da;background:rgba(236,250,227,.19)}.settings-security button:disabled{opacity:.65;cursor:wait}@media(max-width:620px){.settings-security{grid-template-columns:auto 1fr;gap:12px;padding:17px}.settings-security button{grid-column:1 / -1;width:100%;margin-top:2px}}
  `}</style>
}

export default PersonalSettings
