import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Droplets, Flame, ListTodo, Sparkles, Target } from 'lucide-react'

const dayKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfWeek = (date) => {
  const copy = new Date(date)
  const offset = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - offset)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const addDays = (date, amount) => {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}

function Planner({ tasks, goals, habits, waterTodayTotal, waterGoal, onChangeView }) {
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()))
  const todayKey = dayKey(new Date())
  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekAnchor, index)), [weekAnchor])
  const openTasks = tasks.filter((task) => !task.completed)
  const todaysTasks = openTasks.filter((task) => task.due_date === todayKey)
  const scheduledTasks = openTasks.filter((task) => task.due_date)
  const todayHabitCount = habits.filter((habit) => habit.completedToday).length
  const activeGoal = [...goals].sort((a, b) => Number(b.progress || 0) - Number(a.progress || 0))[0]
  const hydrationRatio = waterGoal ? Math.min(100, Math.round((waterTodayTotal / waterGoal) * 100)) : 0

  const suggestion = todaysTasks.length
    ? `Önce “${todaysTasks[0].title}” ile başla; günün ilk küçük tamamlaması enerjini açar.`
    : habits.length && todayHabitCount < habits.length
      ? 'Bugün bir alışkanlığını tamamlayarak ritmini koru; en kolay olandan başlamak yeterli.'
      : activeGoal
        ? `“${activeGoal.title}” hedefine yaklaşmak için bugün 20 dakikalık küçük bir adım planla.`
        : 'Bugün kendine 20 dakikalık odak alanı aç; küçük ve net bir adım seç.'

  return (
    <section className="planner-page">
      <div className="planner-hero">
        <div className="planner-glow planner-glow-one" /><div className="planner-glow planner-glow-two" />
        <div><span className="planner-eyebrow"><Sparkles size={13} /> HAFTALIK AKIŞIN</span><h1>Planın, hayatının<br /><em>ritmine uyumlu.</em></h1><p>Yapılacaklarını haftanın içine yerleştir; Mova sana bugünün en iyi ilk adımını göstersin.</p></div>
        <div className="planner-hero-stat"><CalendarDays size={22} /><strong>{todaysTasks.length}</strong><span>bugünün<br />önceliği</span></div>
      </div>

      <div className="planner-main-grid">
        <article className="planner-card calendar-card">
          <div className="planner-card-head"><div><span>HAFTALIK TAKVİM</span><h2>Günlerini gör</h2></div><div className="calendar-controls"><button onClick={() => setWeekAnchor((date) => addDays(date, -7))} aria-label="Önceki hafta"><ChevronLeft size={17} /></button><button onClick={() => setWeekAnchor(startOfWeek(new Date()))}>Bugün</button><button onClick={() => setWeekAnchor((date) => addDays(date, 7))} aria-label="Sonraki hafta"><ChevronRight size={17} /></button></div></div>
          <div className="week-grid">{week.map((date) => { const key = dayKey(date); const entries = scheduledTasks.filter((task) => task.due_date === key); const isToday = key === todayKey; return <div className={isToday ? 'week-day today' : 'week-day'} key={key}><div className="week-date"><small>{date.toLocaleDateString('tr-TR', { weekday: 'short' })}</small><strong>{date.getDate()}</strong></div><div className="week-events">{entries.slice(0, 3).map((task) => <button key={task.id} className={`week-event ${task.priority || 'medium'}`} onClick={() => onChangeView('tasks')} title="Görevlerde aç">{task.title}</button>)}{entries.length > 3 && <span>+{entries.length - 3} görev</span>}{!entries.length && <i>—</i>}</div></div> })}</div>
          <button className="planner-link" onClick={() => onChangeView('tasks')}><ListTodo size={15} /> Tüm görevleri yönet <ChevronRight size={15} /></button>
        </article>

        <aside className="planner-side">
          <article className="planner-card suggestion-card"><div className="planner-card-head"><div><span>BUGÜNÜN PUSULASI</span><h2>Nereden başlamalı?</h2></div><Sparkles size={19} /></div><p>{suggestion}</p><button className="suggestion-button" onClick={() => onChangeView(todaysTasks.length ? 'tasks' : 'life')}>{todaysTasks.length ? 'Göreve git' : 'Ritime dön'} <ChevronRight size={16} /></button></article>
          <article className="planner-card pulse-card"><div className="pulse-top"><div className="pulse-icon water"><Droplets size={16} /></div><div><span>SU RİTMİ</span><strong>%{hydrationRatio}</strong></div></div><div className="pulse-line"><i style={{ width: `${hydrationRatio}%` }} /></div><small>{Math.round(waterTodayTotal / 1000 * 10) / 10} L / {Math.round(waterGoal / 1000 * 10) / 10} L</small><button onClick={() => onChangeView('water')}>Su takibine git</button></article>
        </aside>
      </div>

      <div className="planner-insights">
        <article><div className="insight-icon task"><CheckCircle2 size={18} /></div><div><span>BUGÜN</span><strong>{todaysTasks.length ? `${todaysTasks.length} öncelik seni bekliyor` : 'Takviminde net bir görev yok'}</strong><button onClick={() => onChangeView('tasks')}>Görevlerine bak</button></div></article>
        <article><div className="insight-icon habit"><Flame size={18} /></div><div><span>ALIŞKANLIK</span><strong>{habits.length ? `${todayHabitCount}/${habits.length} ritim tamamlandı` : 'İlk alışkanlığını oluştur'}</strong><button onClick={() => onChangeView('habits')}>Alışkanlıklara git</button></div></article>
        <article><div className="insight-icon goal"><Target size={18} /></div><div><span>YOLCULUK</span><strong>{activeGoal ? `“${activeGoal.title}” %${activeGoal.progress || 0}` : 'Bir hedefle yönünü belirle'}</strong><button onClick={() => onChangeView('goals')}>Hedeflere git</button></div></article>
      </div>
      <PlannerStyles />
    </section>
  )
}

function PlannerStyles() {
  return <style>{`
    .planner-page{max-width:1184px;margin:0 auto;padding:38px 28px 70px;color:#e8f4ec}.planner-hero{position:relative;display:flex;justify-content:space-between;align-items:center;min-height:218px;overflow:hidden;padding:37px 48px;border-radius:25px;background:linear-gradient(130deg,#173e37,#28735e 58%,#d0dd95)}.planner-hero>*:not(.planner-glow){position:relative;z-index:1}.planner-glow{position:absolute;border-radius:50%;filter:blur(1px);animation:plannerFloat 7s ease-in-out infinite}.planner-glow-one{width:280px;height:280px;right:180px;top:-160px;border:1px solid rgba(255,255,255,.19);box-shadow:0 0 0 33px rgba(255,255,255,.06),0 0 0 66px rgba(255,255,255,.035)}.planner-glow-two{width:160px;height:160px;left:-50px;bottom:-90px;background:rgba(207,235,155,.18)}@keyframes plannerFloat{50%{transform:translateY(13px) translateX(-8px)}}.planner-eyebrow{display:flex;align-items:center;gap:6px;color:#e1f4b8;font-size:9px;font-weight:800;letter-spacing:1.5px}.planner-hero h1{margin:10px 0;font-size:37px;line-height:1.09;letter-spacing:-1.8px}.planner-hero h1 em{color:#f0f9ce;font-style:normal}.planner-hero p{max-width:480px;margin:0;color:#d8eadb;font-size:12px;line-height:1.6}.planner-hero-stat{display:grid;grid-template-columns:auto 1fr;column-gap:9px;align-items:center;min-width:135px;padding:16px 17px;border:1px solid rgba(255,255,255,.23);border-radius:16px;background:rgba(8,42,34,.28);backdrop-filter:blur(8px)}.planner-hero-stat svg{grid-row:span 2;color:#eaf6b8}.planner-hero-stat strong{font-size:29px;line-height:1}.planner-hero-stat span{color:#d7e8d4;font-size:9px;line-height:1.25}.planner-main-grid{display:grid;grid-template-columns:1.56fr .76fr;gap:16px;margin-top:18px}.planner-card{border:1px solid #29463e;border-radius:19px;background:#10241f}.planner-card-head{display:flex;align-items:flex-start;justify-content:space-between}.planner-card-head span{color:#a4ceaa;font-size:9px;font-weight:800;letter-spacing:1.3px}.planner-card-head h2{margin:7px 0 0;color:#eff8f0;font-size:16px;letter-spacing:-.4px}.calendar-card{padding:21px}.calendar-controls{display:flex;align-items:center;gap:3px}.calendar-controls button{display:grid;place-items:center;min-height:29px;border:1px solid #315247;border-radius:8px;padding:0 8px;background:#16342d;color:#bdd7c5;font-size:9px}.calendar-controls button:hover{border-color:#88bc7d;color:#e9f5ca}.week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:22px 0 15px}.week-day{min-height:152px;padding:9px 7px;border:1px solid #29463e;border-radius:12px;background:#122b25}.week-day.today{border-color:#92c778;background:linear-gradient(165deg,#1d4b3c,#16362e);box-shadow:0 10px 22px rgba(4,20,15,.15)}.week-date{display:flex;align-items:center;justify-content:space-between;color:#a5bead}.week-date small{font-size:8px;text-transform:capitalize}.week-date strong{display:grid;place-items:center;width:25px;height:25px;border-radius:8px;font-size:12px}.today .week-date strong{background:#dff1ad;color:#28523e}.week-events{display:grid;gap:5px;margin-top:11px}.week-events i{color:#4f6b60;font-size:12px;font-style:normal}.week-event{overflow:hidden;border:0;border-left:2px solid #b6dc7e;border-radius:5px;padding:5px 4px;background:#244b3d;color:#d8ecdf;font-size:8px;line-height:1.25;text-align:left;text-overflow:ellipsis;white-space:nowrap}.week-event.high{border-left-color:#f0aa74}.week-event.low{border-left-color:#8ac9db}.week-events span{color:#a9c2af;font-size:8px}.planner-link{display:flex;align-items:center;gap:6px;margin-left:auto;border:0;background:transparent;color:#b7d993;font-size:10px}.planner-link svg:last-child{margin-left:-2px}.planner-side{display:grid;gap:16px}.suggestion-card{padding:21px;background:linear-gradient(155deg,#1d4c40,#17352e)}.suggestion-card>.planner-card-head>svg{color:#e2f3ac}.suggestion-card p{min-height:61px;margin:20px 0;color:#d4e7db;font-size:12px;line-height:1.7}.suggestion-button{display:flex;align-items:center;gap:5px;width:100%;justify-content:center;border:0;border-radius:10px;padding:10px;background:#d9efa4;color:#28543e;font-size:10px;font-weight:800}.pulse-card{padding:19px;background:#12251f}.pulse-top{display:flex;align-items:center;gap:9px}.pulse-icon{display:grid;place-items:center;width:33px;height:33px;border-radius:10px}.pulse-icon.water{background:#1c4350;color:#a9dded}.pulse-top span,.pulse-top strong{display:block}.pulse-top span{color:#99bdad;font-size:9px;letter-spacing:1px}.pulse-top strong{margin-top:3px;font-size:19px}.pulse-line{height:6px;margin:16px 0 7px;overflow:hidden;border-radius:5px;background:#29453e}.pulse-line i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#74c8d5,#b9e896);transition:width .6s ease}.pulse-card small{color:#a7c1af;font-size:9px}.pulse-card button{margin-top:13px;border:0;background:transparent;color:#b9dc91;font-size:9px}.planner-insights{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}.planner-insights article{display:flex;gap:11px;align-items:flex-start;padding:17px;border:1px solid #2b483f;border-radius:17px;background:#10241f}.insight-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:11px}.insight-icon.task{background:#e6f0d3;color:#5d844d}.insight-icon.habit{background:#f4ead6;color:#c9894c}.insight-icon.goal{background:#ddecdf;color:#498664}.planner-insights span,.planner-insights strong,.planner-insights button{display:block}.planner-insights span{color:#91b29f;font-size:8px;font-weight:800;letter-spacing:1.1px}.planner-insights strong{min-height:31px;margin-top:5px;color:#e6f2e8;font-size:11px;line-height:1.35}.planner-insights button{margin-top:7px;border:0;background:transparent;padding:0;color:#b4db92;font-size:9px}@media(max-width:900px){.planner-main-grid{grid-template-columns:1fr}.planner-side{grid-template-columns:1fr 1fr}.week-day{min-height:122px}.planner-insights{grid-template-columns:1fr}.planner-insights article{padding:15px}}@media(max-width:620px){.planner-page{padding:24px 18px 54px}.planner-hero{min-height:250px;padding:30px 25px}.planner-hero h1{font-size:30px}.planner-hero-stat{position:absolute;right:20px;bottom:18px;min-width:114px;padding:12px}.planner-side{grid-template-columns:1fr}.calendar-card{padding:17px}.week-grid{gap:3px;overflow:auto}.week-day{min-width:57px;padding:7px 4px}.week-event{font-size:7px}.calendar-controls button:nth-child(2){display:none}}
  `}</style>
}

export default Planner
