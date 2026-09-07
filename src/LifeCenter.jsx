import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BatteryMedium,
  BookOpen,
  Check,
  Compass,
  Heart,
  Leaf,
  Pause,
  Play,
  Save,
  Sparkles,
  Timer,
  Trophy,
} from 'lucide-react'
import { supabase } from './lib/supabase'

const moods = [
  { value: 1, emoji: '😞', label: 'Zor' },
  { value: 2, emoji: '😕', label: 'Düşük' },
  { value: 3, emoji: '🙂', label: 'Dengeli' },
  { value: 4, emoji: '😄', label: 'İyi' },
  { value: 5, emoji: '✨', label: 'Harika' },
]

const challengeOptions = [
  { key: 'walk-7', title: '7 gün hareket', description: 'Her gün kendin için kısa bir hareket alanı aç.', icon: '🚶' },
  { key: 'water-7', title: '7 gün su hedefi', description: 'Günlük su hedefini bir hafta boyunca koru.', icon: '💧' },
  { key: 'journal-7', title: '7 gün mini günlük', description: 'Her gün kendine birkaç satır ayır.', icon: '✍️' },
]

const today = () => new Date().toLocaleDateString('en-CA')

const weekStart = () => {
  const date = new Date()
  const offset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - offset)
  return date.toLocaleDateString('en-CA')
}

function LifeCenter({ user }) {
  const [loading, setLoading] = useState(true)
  const [databaseReady, setDatabaseReady] = useState(true)
  const [checkin, setCheckin] = useState({ mood: 3, energy: 3, note: '' })
  const [journal, setJournal] = useState([])
  const [journalDraft, setJournalDraft] = useState('')
  const [balance, setBalance] = useState({ health: 5, movement: 5, focus: 5, social: 5, rest: 5 })
  const [review, setReview] = useState({ win: '', improve: '', intention: '' })
  const [challenges, setChallenges] = useState([])
  const [focusSessions, setFocusSessions] = useState([])
  const [focusRemaining, setFocusRemaining] = useState(25 * 60)
  const [focusActive, setFocusActive] = useState(false)
  const [message, setMessage] = useState('')

  const notify = useCallback((text) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2800)
  }, [])

  const saveFocus = useCallback(async (minutes) => {
    const { data, error } = await supabase.from('focus_sessions').insert({ user_id: user.id, duration_minutes: minutes }).select().single()
    if (!error && data) setFocusSessions((sessions) => [data, ...sessions])
    if (!error) notify(`${minutes} dakikalık odak seansı tamamlandı.`)
  }, [notify, user])

  const loadCenter = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [moodResult, journalResult, balanceResult, reviewResult, challengeResult, focusResult] = await Promise.all([
        supabase.from('mood_checkins').select('*').eq('user_id', user.id).eq('checked_on', today()).maybeSingle(),
        supabase.from('journal_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('life_balance_scores').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('weekly_reviews').select('*').eq('user_id', user.id).eq('week_start', weekStart()).maybeSingle(),
        supabase.from('user_challenges').select('*').eq('user_id', user.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      ])

      const results = [moodResult, journalResult, balanceResult, reviewResult, challengeResult, focusResult]
      if (results.some((result) => result.error)) {
        console.error('Yaşam merkezi verisi alınamadı:', results.find((result) => result.error)?.error)
        setDatabaseReady(false)
        return
      }

      if (moodResult.data) setCheckin({ mood: moodResult.data.mood, energy: moodResult.data.energy, note: moodResult.data.note || '' })
      if (journalResult.data) setJournal(journalResult.data)
      if (balanceResult.data) setBalance((current) => ({ ...current, ...balanceResult.data }))
      if (reviewResult.data) setReview({ win: reviewResult.data.win || '', improve: reviewResult.data.improve || '', intention: reviewResult.data.intention || '' })
      setChallenges(challengeResult.data || [])
      setFocusSessions(focusResult.data || [])
      setDatabaseReady(true)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadCenter() }, [loadCenter])

  useEffect(() => {
    if (!focusActive) return undefined
    const timer = window.setInterval(() => {
      setFocusRemaining((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer)
          setFocusActive(false)
          saveFocus(25)
          return 25 * 60
        }
        return seconds - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [focusActive, saveFocus])

  const saveCheckin = async () => {
    const { error } = await supabase.from('mood_checkins').upsert({
      user_id: user.id,
      checked_on: today(),
      mood: checkin.mood,
      energy: checkin.energy,
      note: checkin.note.trim(),
    }, { onConflict: 'user_id,checked_on' })
    if (error) return notify('Kontrol kaydedilemedi.')
    notify('Bugünkü hislerin kaydedildi.')
  }

  const saveJournal = async () => {
    if (!journalDraft.trim()) return
    const { data, error } = await supabase.from('journal_entries').insert({ user_id: user.id, body: journalDraft.trim() }).select().single()
    if (error) return notify('Not eklenemedi.')
    setJournal((entries) => [data, ...entries].slice(0, 3))
    setJournalDraft('')
    notify('Günlüğüne eklendi.')
  }

  const saveBalance = async () => {
    const { error } = await supabase.from('life_balance_scores').upsert({ user_id: user.id, ...balance }, { onConflict: 'user_id' })
    notify(error ? 'Denge puanları kaydedilemedi.' : 'Yaşam dengesi güncellendi.')
  }

  const saveReview = async () => {
    const { error } = await supabase.from('weekly_reviews').upsert({ user_id: user.id, week_start: weekStart(), ...review }, { onConflict: 'user_id,week_start' })
    notify(error ? 'Haftalık değerlendirme kaydedilemedi.' : 'Haftalık değerlendirme kaydedildi.')
  }

  const toggleChallenge = async (challengeKey) => {
    const current = challenges.find((challenge) => challenge.challenge_key === challengeKey)
    if (current) {
      const { error } = await supabase.from('user_challenges').delete().eq('id', current.id).eq('user_id', user.id)
      if (!error) setChallenges((items) => items.filter((item) => item.id !== current.id))
      return
    }
    const { data, error } = await supabase.from('user_challenges').insert({ user_id: user.id, challenge_key: challengeKey }).select().single()
    if (!error) setChallenges((items) => [data, ...items])
  }

  const focusMinutes = useMemo(() => focusSessions.reduce((total, session) => total + Number(session.duration_minutes || 0), 0), [focusSessions])
  const balanceAverage = Math.round(Object.values(balance).reduce((total, score) => total + Number(score), 0) / 5)
  const focusText = `${String(Math.floor(focusRemaining / 60)).padStart(2, '0')}:${String(focusRemaining % 60).padStart(2, '0')}`
  const focusProgress = ((25 * 60 - focusRemaining) / (25 * 60)) * 100
  const rewards = [
    { icon: '✍️', title: 'Kendine kulak verdin', detail: 'İlk mini günlük notun', unlocked: journal.length > 0 },
    { icon: '⚡', title: 'Odak kıvılcımı', detail: '3 odak seansı', unlocked: focusSessions.length >= 3 },
    { icon: '🌱', title: 'Ritme başladın', detail: 'Bir meydan okumaya katıldın', unlocked: challenges.length > 0 },
  ]

  return (
    <section className="life-center">
      <div className="life-center-hero">
        <div><span className="life-eyebrow"><Sparkles size={13} /> YAŞAM MERKEZİN</span><h1>Bugün kendine<br /><em>nasıl alan açtın?</em></h1><p>Enerjini, odağını ve küçük iyi alışkanlıklarını birlikte takip et.</p></div>
        <div className="life-orb"><div><strong>{balanceAverage}</strong><span>/10</span><small>Denge puanın</small></div></div>
      </div>

      {!databaseReady && <div className="life-setup"><Sparkles size={18} /><div><strong>Yaşam Merkezi için kısa bir kurulum gerekiyor.</strong><span><code>supabase/life_center_step_6.sql</code> dosyasını Supabase SQL Editor’da bir kez çalıştır.</span></div></div>}

      <div className="life-grid life-grid-top">
        <article className="life-card mood-card"><div className="life-card-head"><div><span>GÜNLÜK CHECK-IN</span><h2>Bugün nasılsın?</h2></div><Heart size={20} /></div>
          <p className="life-label">Ruh hâlin</p><div className="mood-options">{moods.map((item) => <button key={item.value} className={checkin.mood === item.value ? 'selected' : ''} onClick={() => setCheckin((value) => ({ ...value, mood: item.value }))}><b>{item.emoji}</b><small>{item.label}</small></button>)}</div>
          <p className="life-label">Enerjin <strong>{checkin.energy}/5</strong></p><input className="energy-range" type="range" min="1" max="5" value={checkin.energy} onChange={(event) => setCheckin((value) => ({ ...value, energy: Number(event.target.value) }))} />
          <input className="life-inline-input" placeholder="Bugün kendine notun ne?" value={checkin.note} onChange={(event) => setCheckin((value) => ({ ...value, note: event.target.value }))} />
          <button className="life-action" onClick={saveCheckin}><Save size={15} /> Kaydet</button>
        </article>

        <article className="life-card focus-card"><div className="life-card-head"><div><span>ODAK MODU</span><h2>Kendine zaman ayır</h2></div><Timer size={20} /></div>
          <div className="focus-clock" style={{ '--focus-progress': `${focusProgress * 3.6}deg` }}><div><strong>{focusText}</strong><span>odak seansı</span></div></div>
          <div className="focus-actions"><button className="focus-play" onClick={() => setFocusActive((active) => !active)}>{focusActive ? <Pause size={17} /> : <Play size={17} />}{focusActive ? 'Duraklat' : 'Başla'}</button><button className="focus-reset" onClick={() => { setFocusActive(false); setFocusRemaining(25 * 60) }}>Sıfırla</button></div>
          <p className="focus-total"><BatteryMedium size={14} /> Toplam odak: <strong>{focusMinutes} dk</strong></p>
        </article>

        <article className="life-card journal-card"><div className="life-card-head"><div><span>MİNİ GÜNLÜK</span><h2>Aklından geçenler</h2></div><BookOpen size={20} /></div>
          <textarea placeholder="Bugün neler oldu, kendin için ne fark ettin?" value={journalDraft} onChange={(event) => setJournalDraft(event.target.value)} />
          <button className="life-action" onClick={saveJournal}><BookOpen size={15} /> Notu ekle</button>
          {journal[0] && <p className="journal-last">“{journal[0].body}”</p>}
        </article>
      </div>

      <div className="life-grid life-grid-bottom">
        <article className="life-card balance-card"><div className="life-card-head"><div><span>YAŞAM DENGESİ</span><h2>Hangi alanın ilgi istiyor?</h2></div><Compass size={20} /></div>
          <div className="balance-list">{[{ key: 'health', label: 'Sağlık' }, { key: 'movement', label: 'Hareket' }, { key: 'focus', label: 'Odak' }, { key: 'social', label: 'Sosyal hayat' }, { key: 'rest', label: 'Dinlenme' }].map((item) => <label key={item.key}><span>{item.label}</span><input type="range" min="1" max="10" value={balance[item.key]} onChange={(event) => setBalance((scores) => ({ ...scores, [item.key]: Number(event.target.value) }))} /><b>{balance[item.key]}</b></label>)}</div>
          <button className="life-action" onClick={saveBalance}><Save size={15} /> Dengeyi kaydet</button>
        </article>

        <article className="life-card challenge-card"><div className="life-card-head"><div><span>KÜÇÜK MEYDAN OKUMALAR</span><h2>Ritmini güçlendir</h2></div><Trophy size={20} /></div>
          <div className="challenge-list">{challengeOptions.map((option) => { const joined = challenges.some((item) => item.challenge_key === option.key); return <button key={option.key} className={joined ? 'challenge joined' : 'challenge'} onClick={() => toggleChallenge(option.key)}><i>{option.icon}</i><span><strong>{option.title}</strong><small>{option.description}</small></span><b>{joined ? <Check size={15} /> : '+'}</b></button> })}</div>
        </article>

        <article className="life-card review-card"><div className="life-card-head"><div><span>HAFTALIK DEĞERLENDİRME</span><h2>Haftana kısa bir bakış</h2></div><Leaf size={20} /></div>
          <input placeholder="Bu hafta iyi giden şey..." value={review.win} onChange={(event) => setReview((value) => ({ ...value, win: event.target.value }))} />
          <input placeholder="Gelecek hafta iyileştireceğin şey..." value={review.improve} onChange={(event) => setReview((value) => ({ ...value, improve: event.target.value }))} />
          <input placeholder="Yeni haftanın niyeti..." value={review.intention} onChange={(event) => setReview((value) => ({ ...value, intention: event.target.value }))} />
          <button className="life-action" onClick={saveReview}><Save size={15} /> Değerlendirmeyi kaydet</button>
        </article>
      </div>

      <article className="life-rewards"><div><span><Trophy size={14} /> KÜÇÜK KAZANIMLAR</span><h2>Her adımın görünmeye değer.</h2><p>Mova, düzenini kurarken biriktirdiğin küçük başarıları burada hatırlatır.</p></div><div className="reward-list">{rewards.map((reward) => <div className={reward.unlocked ? 'reward unlocked' : 'reward'} key={reward.title}><i>{reward.icon}</i><span><strong>{reward.title}</strong><small>{reward.detail}</small></span>{reward.unlocked && <Check size={14} />}</div>)}</div></article>

      {loading && <div className="life-loading">Yaşam merkezin hazırlanıyor…</div>}
      {message && <div className="life-toast">{message}</div>}
      <LifeCenterStyles />
    </section>
  )
}

function LifeCenterStyles() {
  return <style>{`
    .life-center{max-width:1184px;margin:0 auto;padding:38px 28px 70px;color:#e8f4ec}.life-center-hero{position:relative;display:flex;justify-content:space-between;align-items:center;min-height:226px;padding:38px 48px;overflow:hidden;border-radius:25px;background:radial-gradient(circle at 83% 25%,rgba(237,235,153,.28),transparent 15%),linear-gradient(132deg,#173d36,#2d7764 64%,#78a86c)}.life-center-hero:after{content:'';position:absolute;width:390px;height:390px;right:-155px;bottom:-240px;border:1px solid rgba(255,255,255,.18);border-radius:50%;box-shadow:0 0 0 48px rgba(255,255,255,.05),0 0 0 96px rgba(255,255,255,.025)}.life-center-hero>div{position:relative;z-index:1}.life-eyebrow{display:flex;align-items:center;gap:6px;color:#d9f0c1;font-size:10px;font-weight:750;letter-spacing:1.5px}.life-center-hero h1{margin:10px 0 10px;font-size:37px;line-height:1.1;letter-spacing:-1.8px}.life-center-hero h1 em{color:#e4f4aa;font-style:normal}.life-center-hero p{max-width:470px;margin:0;color:#d2e7d9;font-size:13px;line-height:1.65}.life-orb{width:132px;height:132px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.25);border-radius:50%;background:rgba(11,48,39,.22);box-shadow:0 0 0 15px rgba(255,255,255,.06),0 0 0 30px rgba(255,255,255,.03);text-align:center}.life-orb strong{font-size:36px}.life-orb span{font-size:12px;color:#cfe6d5}.life-orb small{display:block;margin-top:3px;color:#d1e7cd;font-size:9px}.life-setup{display:flex;gap:11px;align-items:flex-start;margin-top:18px;padding:14px 16px;border:1px solid #d7c978;border-radius:13px;background:#fffbe6;color:#755f18;font-size:11px}.life-setup strong,.life-setup span{display:block}.life-setup span{margin-top:3px;color:#8b7c43}.life-grid{display:grid;gap:16px;margin-top:18px}.life-grid-top{grid-template-columns:1.15fr .9fr 1fr}.life-grid-bottom{grid-template-columns:1.12fr 1.12fr .95fr}.life-card{padding:21px;border:1px solid #29433d;border-radius:19px;background:#10231f}.life-card-head{display:flex;justify-content:space-between;align-items:flex-start;color:#94d2a6}.life-card-head span{display:block;color:#9fc9aa;font-size:9px;font-weight:750;letter-spacing:1.3px}.life-card-head h2{margin:7px 0 0;color:#ecf7ed;font-size:16px;letter-spacing:-.4px}.life-label{display:flex;justify-content:space-between;margin:21px 0 9px;color:#b8d0bf;font-size:11px}.life-label strong{color:#e7f4a9}.mood-options{display:flex;justify-content:space-between;gap:5px}.mood-options button{width:100%;border:1px solid transparent;border-radius:11px;padding:8px 2px;background:#17342e;color:#b4c9ba}.mood-options button.selected{border-color:#a2dd8c;background:#2a5848;color:#efffd7}.mood-options b,.mood-options small{display:block}.mood-options b{font-size:20px}.mood-options small{margin-top:4px;font-size:8px}.energy-range,.balance-list input{width:100%;accent-color:#9bd17e}.life-inline-input,.review-card input,.journal-card textarea{width:100%;border:1px solid #314e46;border-radius:10px;background:#0d1d1a;color:#e5f3e7;outline:0;font-size:11px}.life-inline-input{margin-top:16px;padding:11px}.life-inline-input:focus,.review-card input:focus,.journal-card textarea:focus{border-color:#91c978;box-shadow:0 0 0 3px rgba(145,201,120,.12)}.life-action{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;margin-top:10px;padding:10px;border:0;border-radius:10px;background:#4c936c;color:#fff;font-size:11px;font-weight:700}.life-action:hover{background:#5eab7d}.focus-card{background:linear-gradient(150deg,#133b34,#205b4c)}.focus-clock{width:142px;height:142px;display:grid;place-items:center;margin:18px auto;background:conic-gradient(#b5e38c var(--focus-progress),rgba(255,255,255,.11) 0);border-radius:50%}.focus-clock>div{display:grid;place-items:center;width:118px;height:118px;border-radius:50%;background:#143d35}.focus-clock strong{font-size:27px}.focus-clock span{margin-top:3px;color:#b8d2be;font-size:9px}.focus-actions{display:flex;gap:8px}.focus-actions button{display:flex;align-items:center;justify-content:center;gap:5px;border:0;border-radius:9px;padding:10px;font-size:10px}.focus-play{flex:1;background:#c7e995;color:#235541;font-weight:700}.focus-reset{background:rgba(255,255,255,.11);color:#d8ede1}.focus-total{display:flex;align-items:center;gap:5px;margin:13px 0 0;color:#b9d2c1;font-size:10px}.focus-total strong{color:#eaf7ec}.journal-card textarea{height:102px;resize:none;margin-top:18px;padding:11px;line-height:1.55}.journal-last{margin:13px 0 0;color:#b1c8b8;font-size:10px;font-style:italic;line-height:1.5}.balance-list{margin-top:18px}.balance-list label{display:grid;grid-template-columns:78px 1fr 22px;align-items:center;gap:8px;margin:10px 0;color:#c3d8c9;font-size:10px}.balance-list b{color:#dff5ab;text-align:right}.challenge-list{display:grid;gap:8px;margin-top:18px}.challenge{display:flex;align-items:center;gap:9px;width:100%;padding:10px;border:1px solid #304b43;border-radius:11px;background:#15312b;color:#d8ece0;text-align:left}.challenge:hover{border-color:#76ad80}.challenge.joined{border-color:#83c781;background:#204937}.challenge i{display:grid;place-items:center;width:29px;height:29px;border-radius:9px;background:#29483d;font-style:normal}.challenge span{flex:1}.challenge strong,.challenge small{display:block}.challenge strong{font-size:10px}.challenge small{margin-top:3px;color:#aac4b2;font-size:8px;line-height:1.35}.challenge>b{display:grid;place-items:center;color:#d8f3a0}.review-card input{margin-top:10px;padding:10px}.review-card input:first-of-type{margin-top:18px}.life-rewards{display:flex;align-items:center;justify-content:space-between;gap:25px;margin-top:16px;padding:21px;border:1px solid #395749;border-radius:19px;background:linear-gradient(110deg,#193e34,#173029)}.life-rewards>div:first-child{max-width:310px}.life-rewards span{display:flex;align-items:center;gap:6px;color:#c7e8a5;font-size:9px;font-weight:800;letter-spacing:1.2px}.life-rewards h2{margin:8px 0;color:#edf8ef;font-size:16px}.life-rewards p{margin:0;color:#abc3b2;font-size:10px;line-height:1.5}.reward-list{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;flex:1}.reward{display:flex;align-items:center;gap:8px;min-width:0;padding:9px;border:1px solid #314d43;border-radius:11px;background:#163128;opacity:.52;filter:saturate(.55)}.reward.unlocked{opacity:1;filter:none;border-color:#83b974;background:#244a38;box-shadow:0 8px 18px rgba(4,20,15,.16);animation:rewardRise .5s ease both}@keyframes rewardRise{from{transform:translateY(7px);opacity:0}}.reward i{display:grid;place-items:center;width:28px;height:28px;flex:0 0 auto;border-radius:9px;background:#dbeab0;font-size:14px;font-style:normal}.reward span{display:block;min-width:0;flex:1}.reward strong,.reward small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.reward strong{color:#e8f5e4;font-size:9px}.reward small{margin-top:3px;color:#b0caaa;font-size:8px;letter-spacing:0}.reward>svg{color:#d7efa5}.life-loading{margin-top:18px;color:#a9c2b1;font-size:11px}.life-toast{position:fixed;right:24px;bottom:24px;z-index:300;padding:12px 14px;border:1px solid rgba(151,211,135,.3);border-radius:11px;background:#1d4938;color:#e5f8d0;box-shadow:0 15px 35px rgba(0,0,0,.25);font-size:11px}@media(max-width:980px){.life-grid-top,.life-grid-bottom{grid-template-columns:1fr 1fr}.journal-card,.review-card{grid-column:span 2}.life-rewards{align-items:flex-start;flex-direction:column}.reward-list{width:100%}}@media(max-width:620px){.life-center{padding:24px 18px 54px}.life-center-hero{min-height:270px;padding:30px 25px}.life-center-hero h1{font-size:31px}.life-orb{position:absolute;right:27px;bottom:23px;width:90px;height:90px}.life-orb strong{font-size:25px}.life-grid-top,.life-grid-bottom{grid-template-columns:1fr}.journal-card,.review-card{grid-column:auto}.life-card{padding:18px}.reward-list{grid-template-columns:1fr}.life-toast{right:16px;bottom:16px}}
  `}</style>
}

export default LifeCenter
