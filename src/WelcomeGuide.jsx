import { useEffect, useState } from 'react'
import { ArrowRight, Leaf, Sparkles, Timer } from 'lucide-react'
import { supabase } from './lib/supabase'

const paths = [
  { key: 'flow', icon: '🌿', title: 'Daha dengeli bir gün', text: 'Enerjime ve dinlenmeme yer açmak istiyorum.', intention: 'Bugün kendime iyi gelen ritmi dinleyeceğim.' },
  { key: 'focus', icon: '🎯', title: 'Odağımı toplamak', text: 'İşlerimi sadeleştirip net ilerlemek istiyorum.', intention: 'Bugün en önemli adıma odaklanacağım.' },
  { key: 'habit', icon: '🔥', title: 'Rutin kurmak', text: 'Küçük alışkanlıkları sürdürülebilir hâle getirmek istiyorum.', intention: 'Bugün küçük bir rutini devam ettireceğim.' },
]

function WelcomeGuide({ user, onNavigate }) {
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const check = async () => {
      if (!user) return
      const { data, error } = await supabase.from('user_preferences').select('onboarding_completed').eq('user_id', user.id).maybeSingle()
      if (!error && !data?.onboarding_completed) setVisible(true)
      setReady(true)
    }
    check()
  }, [user])

  const finish = async (path) => {
    if (!user || saving) return
    setSaving(true)
    await supabase.from('user_preferences').upsert({ user_id: user.id, onboarding_completed: true, daily_intention: path?.intention || '' }, { onConflict: 'user_id' })
    setVisible(false)
    setSaving(false)
    if (path) onNavigate(path.key === 'focus' ? 'life' : path.key === 'habit' ? 'habits' : 'life')
  }

  if (!ready || !visible) return null
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'orada'
  return <div className="welcome-overlay"><div className="welcome-guide"><div className="welcome-orbit orbit-one" /><div className="welcome-orbit orbit-two" /><div className="welcome-title"><span><Sparkles size={13} /> MOVA’YA HOŞ GELDİN</span><h2>Merhaba {name},<br /><em>bugün neye yaklaşmak</em> istiyorsun?</h2><p>Bir yön seç; Mova’yı ilk adımına göre sana hazırlayalım. Sonradan her şeyi değiştirebilirsin.</p></div><div className="welcome-paths">{paths.map((path) => <button key={path.key} onClick={() => finish(path)} disabled={saving}><i>{path.icon}</i><span><strong>{path.title}</strong><small>{path.text}</small></span><ArrowRight size={17} /></button>)}</div><button className="welcome-later" onClick={() => finish(null)} disabled={saving}><Timer size={14} /> Şimdilik keşfetmeye devam et</button><div className="welcome-foot"><Leaf size={13} /> Küçük bir başlangıç, büyük bir ritim yaratır.</div><WelcomeStyles /></div></div>
}

function WelcomeStyles() { return <style>{`
  .welcome-overlay{position:fixed;inset:0;z-index:500;display:grid;place-items:center;padding:22px;background:rgba(5,18,14,.68);backdrop-filter:blur(12px)}.welcome-guide{position:relative;width:min(100%,680px);overflow:hidden;border:1px solid rgba(170,219,145,.28);border-radius:27px;padding:43px;background:linear-gradient(145deg,#173c34,#112820 65%);box-shadow:0 28px 90px rgba(0,0,0,.44);color:#eaf4ec}.welcome-guide>*:not(.welcome-orbit){position:relative;z-index:1}.welcome-orbit{position:absolute;border:1px solid rgba(225,247,193,.13);border-radius:50%;animation:welcomeRotate 16s linear infinite}.orbit-one{width:360px;height:360px;top:-205px;right:-145px;box-shadow:0 0 0 42px rgba(225,247,193,.035),0 0 0 84px rgba(225,247,193,.017)}.orbit-two{width:160px;height:160px;bottom:-105px;left:-70px;background:rgba(126,187,114,.12)}@keyframes welcomeRotate{to{transform:rotate(360deg)}}.welcome-title span{display:flex;align-items:center;gap:6px;color:#cce9a9;font-size:9px;font-weight:800;letter-spacing:1.5px}.welcome-title h2{margin:11px 0;color:#f0f8f1;font-size:30px;line-height:1.13;letter-spacing:-1.3px}.welcome-title h2 em{color:#d9f1aa;font-style:normal}.welcome-title p{max-width:500px;margin:0;color:#bdd3c5;font-size:12px;line-height:1.65}.welcome-paths{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:25px}.welcome-paths button{display:grid;justify-items:start;gap:12px;min-height:160px;border:1px solid #345b4d;border-radius:15px;padding:14px;background:rgba(34,75,61,.52);color:#eaf4ec;text-align:left;transition:transform .22s ease,border-color .22s ease,background .22s ease}.welcome-paths button:hover{transform:translateY(-5px);border-color:#b5e28e;background:#285342}.welcome-paths i{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#e7f0c9;font-size:17px;font-style:normal}.welcome-paths span{min-height:61px}.welcome-paths strong,.welcome-paths small{display:block}.welcome-paths strong{font-size:12px;line-height:1.35}.welcome-paths small{margin-top:6px;color:#adc6b6;font-size:9px;line-height:1.45}.welcome-paths svg{justify-self:end;color:#cceaa1}.welcome-later{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:13px;border:0;background:transparent;color:#a8c6b1;font-size:10px}.welcome-foot{display:flex;justify-content:center;align-items:center;gap:6px;margin-top:22px;color:#86aa94;font-size:9px}.welcome-foot svg{color:#b8e191}@media(max-width:600px){.welcome-guide{padding:30px 23px}.welcome-title h2{font-size:26px}.welcome-paths{grid-template-columns:1fr}.welcome-paths button{grid-template-columns:auto 1fr auto;align-items:center;min-height:auto}.welcome-paths i{grid-row:span 2}.welcome-paths span{min-height:auto}.welcome-paths svg{grid-column:3;grid-row:1 / 3}.welcome-paths small{font-size:9px}}
`}</style> }

export default WelcomeGuide
