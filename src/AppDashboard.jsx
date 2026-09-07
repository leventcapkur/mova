import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Flame,
  CalendarDays,
  BarChart3,
  Lightbulb,
  Settings,
  Bell,
  Plus,
  Clock,
  TrendingUp,
  CircleCheck,
} from "lucide-react";

function App() {
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: CheckSquare, label: "Tasks" },
    { icon: Target, label: "Goals" },
    { icon: Flame, label: "Habits" },
    { icon: CalendarDays, label: "Calendar" },
    { icon: BarChart3, label: "Statistics" },
    { icon: Lightbulb, label: "Suggestions" },
  ];

  const tasks = [
    {
      title: "Java çalış",
      time: "10:00 - 11:00",
      priority: "High",
      completed: true,
    },
    {
      title: "LifeOS projesini geliştir",
      time: "14:00 - 16:00",
      priority: "High",
      completed: false,
    },
    {
      title: "30 dakika yürüyüş",
      time: "18:30",
      priority: "Medium",
      completed: false,
    },
    {
      title: "Kitap oku",
      time: "21:00",
      priority: "Low",
      completed: false,
    },
  ];

  const goals = [
    {
      title: "React öğren",
      progress: 72,
      category: "Education",
    },
    {
      title: "LifeOS'u tamamla",
      progress: 48,
      category: "Project",
    },
    {
      title: "Kitap okuma hedefi",
      progress: 65,
      category: "Personal",
    },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0d0d10] md:flex md:flex-col">

          {/* Logo */}
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 font-bold">
              L
            </div>

            <div>
              <h1 className="text-lg font-bold">LifeOS</h1>
              <p className="text-xs text-zinc-500">Personal Dashboard</p>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 px-4 py-6">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Workspace
            </p>

            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                      item.active
                        ? "bg-violet-500/15 text-violet-300"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Settings */}
          <div className="border-t border-white/10 p-4">
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white">
              <Settings size={19} />
              Settings
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 overflow-hidden">

          {/* HEADER */}
          <header className="flex h-20 items-center justify-between border-b border-white/10 px-6 lg:px-10">
            <div>
              <p className="text-sm text-zinc-500">Wednesday, August 12</p>
              <h2 className="mt-1 text-xl font-semibold">
                Good morning 👋
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative rounded-xl border border-white/10 p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-white">
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-500" />
              </button>

              <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-semibold">
                  L
                </div>

                <div className="hidden sm:block">
                  <p className="text-sm font-medium">Mova kullanıcı hesabı</p>
                  <p className="text-xs text-zinc-500">Account</p>
                </div>
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <div className="p-6 lg:p-10">

            {/* Welcome */}
            <div className="mb-8">
              <p className="max-w-2xl text-sm leading-6 text-zinc-500">
                Here's your day at a glance. Stay focused, complete your
                priorities and keep moving forward.
              </p>
            </div>

            {/* STAT CARDS */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Daily Progress</span>
                  <TrendingUp size={18} className="text-violet-400" />
                </div>

                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold">72%</span>
                  <span className="text-xs text-emerald-400">+8%</span>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-violet-500 to-blue-500" />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Tasks Completed</span>
                  <CircleCheck size={18} className="text-emerald-400" />
                </div>

                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold">4/6</span>
                  <span className="text-xs text-zinc-500">Today</span>
                </div>

                <p className="mt-4 text-xs text-zinc-600">
                  2 tasks remaining
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Current Streak</span>
                  <Flame size={18} className="text-orange-400" />
                </div>

                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold">12</span>
                  <span className="text-xs text-orange-400">🔥 days</span>
                </div>

                <p className="mt-4 text-xs text-zinc-600">
                  Keep your streak alive
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-zinc-500">Focus Time</span>
                  <Clock size={18} className="text-blue-400" />
                </div>

                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold">3h 24m</span>
                </div>

                <p className="mt-4 text-xs text-zinc-600">
                  +42 min from yesterday
                </p>
              </div>
            </div>

            {/* MAIN GRID */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">

              {/* TASKS */}
              <section className="rounded-2xl border border-white/10 bg-white/[0.03]">

                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <div>
                    <h3 className="font-semibold">Today's Tasks</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Your priorities for today
                    </p>
                  </div>

                  <button className="flex items-center gap-2 rounded-xl bg-violet-500 px-3 py-2 text-xs font-medium transition hover:bg-violet-400">
                    <Plus size={15} />
                    Add Task
                  </button>
                </div>

                <div className="divide-y divide-white/5">
                  {tasks.map((task) => (
                    <div
                      key={task.title}
                      className="flex items-center gap-4 p-5 transition hover:bg-white/[0.02]"
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          task.completed
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-zinc-600"
                        }`}
                      >
                        {task.completed && (
                          <CircleCheck size={14} className="text-white" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            task.completed
                              ? "text-zinc-500 line-through"
                              : "text-zinc-200"
                          }`}
                        >
                          {task.title}
                        </p>

                        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-600">
                          <Clock size={12} />
                          {task.time}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                          task.priority === "High"
                            ? "bg-red-500/10 text-red-400"
                            : task.priority === "Medium"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-zinc-500/10 text-zinc-400"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* SUGGESTIONS */}
              <section className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.08] to-transparent">

                <div className="border-b border-white/10 p-5">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-violet-500/15 p-2">
                      <Lightbulb size={18} className="text-violet-400" />
                    </div>

                    <div>
                      <h3 className="font-semibold">Personalized Suggestions</h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Ideas based on your activity
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 p-5">

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-medium">
                      🎯 You're close to your React goal
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      You're at 72%. Spending another 45 minutes today could
                      help you reach your weekly target.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-medium">
                      🔥 Keep your 12-day streak
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      You haven't completed your reading habit today yet.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-medium">
                      ⏰ Your most productive hours
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Your activity is usually highest between 18:00 and
                      21:00.
                    </p>
                  </div>

                </div>
              </section>
            </div>

            {/* BOTTOM */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">

              {/* GOALS */}
              <section className="rounded-2xl border border-white/10 bg-white/[0.03]">

                <div className="flex items-center justify-between border-b border-white/10 p-5">
                  <div>
                    <h3 className="font-semibold">Your Goals</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Track your progress
                    </p>
                  </div>

                  <Target size={18} className="text-violet-400" />
                </div>

                <div className="space-y-5 p-5">
                  {goals.map((goal) => (
                    <div key={goal.title}>
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{goal.title}</p>
                          <p className="mt-1 text-[11px] text-zinc-600">
                            {goal.category}
                          </p>
                        </div>

                        <span className="text-xs text-zinc-400">
                          {goal.progress}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* WEEKLY PRODUCTIVITY */}
              <section className="rounded-2xl border border-white/10 bg-white/[0.03]">

                <div className="border-b border-white/10 p-5">
                  <h3 className="font-semibold">Weekly Productivity</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Your activity this week
                  </p>
                </div>

                <div className="flex h-52 items-end justify-between gap-3 p-6">

                  {[45, 70, 55, 85, 62, 92, 74].map((height, index) => (
                    <div
                      key={index}
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div
                        className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-violet-600 to-blue-400 transition hover:opacity-80"
                        style={{ height: `${height}%` }}
                      />

                      <span className="text-[10px] text-zinc-600">
                        {["M", "T", "W", "T", "F", "S", "S"][index]}
                      </span>
                    </div>
                  ))}

                </div>
              </section>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
