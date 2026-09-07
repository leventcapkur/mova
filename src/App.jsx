import { lazy, Suspense, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import WelcomeGuide from './WelcomeGuide'
import SetupStatus from './SetupStatus'
import heroPark from './assets/images/lifeos-hero-park.png'
import movaMark from './assets/mova-mark.svg'
import {
  ArrowRight,
  Check,
  CheckCircle,
  Clock3,
  Flame,
  Leaf,
  Dumbbell,
  Sun,
  LayoutDashboard,
  Droplets,
  BarChart3,
  ListTodo,
  LogIn,
  LogOut,
  Mail,
  Lock,
  Menu,
  Moon,
  Plus,
  Sparkles,
  Target,
  User,
  UserPlus,
  TrendingUp,
  Loader2,
  AlertCircle,
  Trash2,
  X,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react'

const LifeCenter = lazy(() => import('./LifeCenter'))
const Planner = lazy(() => import('./Planner'))
const PersonalSettings = lazy(() => import('./PersonalSettings'))
const AdminDashboard = lazy(() => import('./AdminDashboard'))

function App() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [page, setPage] = useState('landing')
  const [activeView, setActiveView] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  const [authLoading, setAuthLoading] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryPassword, setRecoveryPassword] = useState('')
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState('')

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  // Görevler
  const [tasks, setTasks] = useState([])
  const [tasksLoading, setTasksLoading] = useState(false)

  // Görev modalı
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('normal')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [newTaskGoal, setNewTaskGoal] = useState('')

  // Hedefler
  const [goals, setGoals] = useState([])
  const [goalsLoading, setGoalsLoading] = useState(false)

  // Hedef modalı
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [newGoalTitle, setNewGoalTitle] = useState('')
  const [newGoalDescription, setNewGoalDescription] = useState('')
  const [newGoalDate, setNewGoalDate] = useState('')

  // Alışkanlıklar
  const [habits, setHabits] = useState([])
  const [habitCompletions, setHabitCompletions] = useState([])
  const [habitsLoading, setHabitsLoading] = useState(false)
  const [showHabitModal, setShowHabitModal] = useState(false)
  const [newHabitTitle, setNewHabitTitle] = useState('')
  const [newHabitFrequency, setNewHabitFrequency] = useState('daily')

  // Su takibi
  const [waterEntries, setWaterEntries] = useState([])
  const [waterHistory, setWaterHistory] = useState([])
  const [waterGoal, setWaterGoal] = useState(2500)
  const [waterLoading, setWaterLoading] = useState(false)

  // Uyku takibi
  const [sleepEntries, setSleepEntries] = useState([])
  const [sleepLoading, setSleepLoading] = useState(false)
  const [showSleepModal, setShowSleepModal] = useState(false)
  const [sleepStartedAt, setSleepStartedAt] = useState('')
  const [sleepWokeAt, setSleepWokeAt] = useState('')
  const [sleepQuality, setSleepQuality] = useState('3')

  // =====================================================
  // SUPABASE OTURUM
  // =====================================================

  useEffect(() => {
    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null

      setUser(currentUser)

      if (event === 'PASSWORD_RECOVERY' && currentUser) {
        setPage('password-recovery')
        setPassword('')
        setLoading(false)
        return
      }

      if (currentUser) {
        setPage('dashboard')
        loadTasks(currentUser.id)
        loadGoals(currentUser.id)
        loadHabits(currentUser.id)
        loadWater(currentUser.id)
        loadSleep(currentUser.id)
        loadAdminStatus(currentUser.id)
      } else {
        setPage('landing')
        setTasks([])
        setGoals([])
        setHabits([])
        setHabitCompletions([])
        setWaterEntries([])
        setWaterHistory([])
        setWaterGoal(2500)
        setSleepEntries([])
        setIsAdmin(false)
      }

      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error(error)
      }

      if (session?.user) {
        setUser(session.user)
        const isRecoveryLink = window.location.hash.includes('type=recovery')
        setPage(isRecoveryLink ? 'password-recovery' : 'dashboard')

        if (isRecoveryLink) return

        await loadTasks(session.user.id)
        await loadGoals(session.user.id)
        await loadHabits(session.user.id)
        await loadWater(session.user.id)
        await loadSleep(session.user.id)
        await loadAdminStatus(session.user.id)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdminStatus = async (userId) => {
    if (!userId) {
      setIsAdmin(false)
      return
    }

    const { data, error } = await supabase
      .from('lifeos_admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    setIsAdmin(!error && Boolean(data))
  }

  // =====================================================
  // GÖREVLERİ GETİR
  // =====================================================

  const loadTasks = async (userId) => {
    if (!userId) return

    setTasksLoading(true)

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, goals(id, title)')
        .eq('user_id', userId)
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Görevleri alma hatası:', error)
        return
      }

      setTasks(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setTasksLoading(false)
    }
  }

  // =====================================================
  // HEDEFLERİ GETİR
  // =====================================================

  const loadGoals = async (userId) => {
    if (!userId) return

    setGoalsLoading(true)

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Hedefleri alma hatası:', error)
        return
      }

      setGoals(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setGoalsLoading(false)
    }
  }

  // =====================================================
  // ALIŞKANLIKLARI GETİR
  // =====================================================

  const loadHabits = async (userId) => {
    if (!userId) return

    setHabitsLoading(true)

    try {
      const [{ data: habitsData, error: habitsError }, { data: completionsData, error: completionsError }] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('habit_completions')
          .select('*')
          .eq('user_id', userId)
          .order('completed_on', { ascending: false }),
      ])

      if (habitsError || completionsError) {
        console.error('Alışkanlıkları alma hatası:', habitsError || completionsError)
        return
      }

      setHabits(habitsData || [])
      setHabitCompletions(completionsData || [])
    } catch (error) {
      console.error(error)
    } finally {
      setHabitsLoading(false)
    }
  }

  // =====================================================
  // SU TAKİBİNİ GETİR
  // =====================================================

  const loadWater = async (userId) => {
    if (!userId) return

    const localToday = new Date().toLocaleDateString('en-CA')
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const startDate = sevenDaysAgo.toLocaleDateString('en-CA')
    setWaterLoading(true)

    try {
      const [{ data: settings, error: settingsError }, { data: entries, error: entriesError }] = await Promise.all([
        supabase.from('water_settings').select('daily_goal_ml').eq('user_id', userId).maybeSingle(),
        supabase.from('water_entries').select('*').eq('user_id', userId).gte('logged_on', startDate).order('created_at', { ascending: false }),
      ])

      if (settingsError || entriesError) {
        console.error('Su kayıtlarını alma hatası:', settingsError || entriesError)
        return
      }

      setWaterGoal(settings?.daily_goal_ml || 2500)
      setWaterHistory(entries || [])
      setWaterEntries((entries || []).filter((entry) => entry.logged_on === localToday))
    } catch (error) {
      console.error(error)
    } finally {
      setWaterLoading(false)
    }
  }

  // =====================================================
  // UYKU KAYITLARINI GETİR
  // =====================================================

  const loadSleep = async (userId) => {
    if (!userId) return

    setSleepLoading(true)

    try {
      const { data, error } = await supabase
        .from('sleep_entries')
        .select('*')
        .eq('user_id', userId)
        .order('sleep_started_at', { ascending: false })
        .limit(14)

      if (error) {
        console.error('Uyku kayıtlarını alma hatası:', error)
        return
      }

      setSleepEntries(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setSleepLoading(false)
    }
  }

  // =====================================================
  // HEDEF OLUŞTUR
  // =====================================================

  const createGoal = async (e) => {
    e.preventDefault()

    if (!user) {
      showMessage('Hedef eklemek için giriş yapmalısın.', 'error')
      return
    }

    if (!newGoalTitle.trim()) {
      showMessage('Lütfen hedef adını gir.', 'error')
      return
    }

    setGoalsLoading(true)

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title: newGoalTitle.trim(),
          description: newGoalDescription.trim() || '',
          target_date: newGoalDate || null,
          progress: 0,
        })
        .select()
        .single()

      if (error) {
        console.error('Hedef oluşturma hatası:', error)
        showMessage('Hedef oluşturulamadı.', 'error')
        return
      }

      setGoals((prev) => [data, ...prev])
      setNewGoalTitle('')
      setNewGoalDescription('')
      setNewGoalDate('')
      setShowGoalModal(false)

      showMessage('Hedef başarıyla oluşturuldu.', 'success')
    } catch (error) {
      console.error(error)
      showMessage('Hedef oluşturulurken bir hata oluştu.', 'error')
    } finally {
      setGoalsLoading(false)
    }
  }

  // =====================================================
  // HEDEF İLERLEMESİ
  // =====================================================

  const updateGoalProgress = async (goalId, progressValue) => {
    if (!user) return

    const safeProgress = Math.max(
      0,
      Math.min(100, Number(progressValue))
    )

    const oldGoals = [...goals]

    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? { ...goal, progress: safeProgress }
          : goal
      )
    )

    try {
      const { error } = await supabase
        .from('goals')
        .update({ progress: safeProgress })
        .eq('id', goalId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Hedef güncelleme hatası:', error)
        setGoals(oldGoals)
        showMessage('Hedef güncellenemedi.', 'error')
      }
    } catch (error) {
      console.error(error)
      setGoals(oldGoals)
    }
  }

  // =====================================================
  // HEDEF SİL
  // =====================================================

  const deleteGoal = async (goalId) => {
    if (!user) return

    const oldGoals = [...goals]

    setGoals((prev) =>
      prev.filter((goal) => goal.id !== goalId)
    )

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Hedef silme hatası:', error)
        setGoals(oldGoals)
        showMessage('Hedef silinemedi.', 'error')
        return
      }

      showMessage('Hedef silindi.', 'success')
    } catch (error) {
      console.error(error)
      setGoals(oldGoals)
    }
  }

  // =====================================================
  // MESAJ
  // =====================================================

  const showMessage = (text, type = 'success') => {
    setMessage(text)
    setMessageType(type)
  }

  // =====================================================
  // GİRİŞ / KAYIT
  // =====================================================

  const openLogin = () => {
    setAuthMode('login')
    setMessage('')
    setPage('auth')
  }

  const openSignup = () => {
    setAuthMode('signup')
    setMessage('')
    setPage('auth')
  }

  // =====================================================
  // HESAP OLUŞTUR
  // =====================================================

  const handleSignup = async (e) => {
    e.preventDefault()

    setMessage('')

    if (!fullName.trim()) {
      showMessage('Lütfen adınızı ve soyadınızı girin.', 'error')
      return
    }

    if (!email.trim()) {
      showMessage('Lütfen e-posta adresinizi girin.', 'error')
      return
    }

    if (password.length < 6) {
      showMessage('Şifre en az 6 karakter olmalıdır.', 'error')
      return
    }

    setAuthLoading(true)

    try {
      const {
        data: { user, session },
        error,
      } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      if (error) {
        console.error(error)

        if (
          error.message.toLowerCase().includes('already registered')
        ) {
          showMessage(
            'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.',
            'error'
          )
        } else {
          showMessage(error.message, 'error')
        }

        return
      }

      if (user && !session) {
        showMessage(
          'Hesabın oluşturuldu! 📩 E-posta adresine gönderilen doğrulama bağlantısına tıkla.',
          'success'
        )

        setPassword('')
        return
      }

      if (user) {
        await createProfile(user, fullName.trim())

        setUser(user)
        setPage('dashboard')
        setPassword('')

        await loadTasks(user.id)
        await loadGoals(user.id)
        await loadAdminStatus(user.id)
      }
    } catch (error) {
      console.error(error)

      showMessage(
        'Hesap oluşturulurken bir hata oluştu.',
        'error'
      )
    } finally {
      setAuthLoading(false)
    }
  }

  // =====================================================
  // GİRİŞ
  // =====================================================

  const handleLogin = async (e) => {
    e.preventDefault()

    setMessage('')

    if (!email.trim() || !password) {
      showMessage(
        'E-posta ve şifre alanlarını doldurun.',
        'error'
      )
      return
    }

    setAuthLoading(true)

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        console.error(error)

        if (
          error.message
            .toLowerCase()
            .includes('email not confirmed')
        ) {
          showMessage(
            'E-posta adresin henüz doğrulanmamış.',
            'error'
          )
        } else if (
          error.message
            .toLowerCase()
            .includes('invalid login credentials')
        ) {
          showMessage(
            'E-posta veya şifre hatalı.',
            'error'
          )
        } else {
          showMessage(error.message, 'error')
        }

        return
      }

      if (user) {
        await createProfile(
          user,
          user.user_metadata?.full_name || ''
        )

        setUser(user)
        setPage('dashboard')
        setPassword('')

        await loadTasks(user.id)
        await loadGoals(user.id)
      }
    } catch (error) {
      console.error(error)

      showMessage(
        'Giriş yapılırken bir hata oluştu.',
        'error'
      )
    } finally {
      setAuthLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim()

    if (!cleanEmail) {
      showMessage('Önce e-posta adresini yaz, ardından şifre yenileme bağlantısını gönderelim.', 'error')
      return
    }

    setAuthLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      })
      if (error) throw error
      showMessage('Şifre yenileme bağlantısını e-posta adresine gönderdik.', 'success')
    } catch (error) {
      console.error('Şifre yenileme bağlantısı gönderilemedi:', error)
      showMessage('Şifre yenileme bağlantısı gönderilemedi. Biraz sonra tekrar dene.', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handlePasswordRecovery = async (e) => {
    e.preventDefault()
    setMessage('')

    if (recoveryPassword.length < 6) {
      showMessage('Yeni şifren en az 6 karakter olmalı.', 'error')
      return
    }

    if (recoveryPassword !== recoveryPasswordConfirm) {
      showMessage('Yeni şifreler birbiriyle eşleşmiyor.', 'error')
      return
    }

    setAuthLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: recoveryPassword })
      if (error) throw error

      setRecoveryPassword('')
      setRecoveryPasswordConfirm('')
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`)
      setPage('dashboard')
      showMessage('Şifren güncellendi. Mova’ya hoş geldin.', 'success')
    } catch (error) {
      console.error('Şifre güncellenemedi:', error)
      showMessage('Şifre güncellenemedi. Bağlantının süresi dolmuş olabilir.', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  // =====================================================
  // PROFİL
  // =====================================================

  const createProfile = async (user, name) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            full_name:
              name ||
              user.user_metadata?.full_name ||
              '',
            email: user.email,
          },
          {
            onConflict: 'id',
          }
        )

      if (error) {
        console.error(
          'Profil kayıt hatası:',
          error
        )
      }
    } catch (error) {
      console.error(error)
    }
  }

  // =====================================================
  // ÇIKIŞ
  // =====================================================

  const handleLogout = async () => {
    setAuthLoading(true)

    try {
      const { error } =
        await supabase.auth.signOut()

      if (error) {
        showMessage(
          'Çıkış yapılırken hata oluştu.',
          'error'
        )
        return
      }

      setUser(null)
      setIsAdmin(false)
      setTasks([])
      setGoals([])
      setPage('landing')
      setFullName('')
      setEmail('')
      setPassword('')
      setMessage('')
    } catch (error) {
      console.error(error)
    } finally {
      setAuthLoading(false)
    }
  }

  // =====================================================
  // YENİ GÖREV EKLE
  // =====================================================

  const handleAddTask = async (e) => {
    e.preventDefault()

    if (!user) {
      showMessage(
        'Görev eklemek için giriş yapmalısın.',
        'error'
      )
      return
    }

    if (!newTaskTitle.trim()) {
      showMessage(
        'Lütfen görev adını yaz.',
        'error'
      )
      return
    }

    setTasksLoading(true)

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: newTaskTitle.trim(),
          description:
            newTaskDescription.trim() || null,
          priority: newTaskPriority,
          due_date:
            newTaskDate || null,
          goal_id: newTaskGoal || null,
        })
        .select()
        .single()

      if (error) {
        console.error(
          'Görev ekleme hatası:',
          error
        )

        showMessage(
          'Görev eklenirken bir hata oluştu.',
          'error'
        )

        return
      }

      await loadTasks(user.id)

      if (data.goal_id) {
        await syncGoalProgressFromTasks(data.goal_id)
      }

      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskPriority('normal')
      setNewTaskDate('')
      setNewTaskGoal('')
      setShowTaskModal(false)

      showMessage(
        'Görev başarıyla eklendi.',
        'success'
      )
    } catch (error) {
      console.error(error)

      showMessage(
        'Görev eklenirken bir hata oluştu.',
        'error'
      )
    } finally {
      setTasksLoading(false)
    }
  }

  // =====================================================
  // GÖREV TAMAMLA
  // =====================================================

  const toggleTask = async (task) => {
    if (!user) return

    const newCompleted = !task.completed

    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id
          ? {
              ...item,
              completed: newCompleted,
            }
          : item
      )
    )

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          completed: newCompleted,
        })
        .eq('id', task.id)
        .eq('user_id', user.id)

      if (error) {
        console.error(
          'Görev güncelleme hatası:',
          error
        )

        setTasks((prev) =>
          prev.map((item) =>
            item.id === task.id
              ? {
                  ...item,
                  completed: task.completed,
                }
              : item
          )
        )

        showMessage(
          'Görev güncellenemedi.',
          'error'
        )
      }

      if (task.goal_id && !error) {
        await syncGoalProgressFromTasks(task.goal_id)
      }

    } catch (error) {
      console.error(error)
    }
  }

  // =====================================================
  // GÖREV SİL
  // =====================================================

  const syncGoalProgressFromTasks = async (goalId) => {
    if (!user || !goalId) return

    const { data, error } = await supabase
      .from('tasks')
      .select('completed')
      .eq('user_id', user.id)
      .eq('goal_id', goalId)

    if (error) {
      console.error('Hedef ilerlemesi hesaplanamadı:', error)
      return
    }

    const linkedTasks = data || []
    const progressFromTasks = linkedTasks.length === 0
      ? 0
      : Math.round(
          (linkedTasks.filter((item) => item.completed).length /
            linkedTasks.length) * 100
        )

    const { error: updateError } = await supabase
      .from('goals')
      .update({ progress: progressFromTasks })
      .eq('id', goalId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Hedef ilerlemesi güncellenemedi:', updateError)
      return
    }

    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? { ...goal, progress: progressFromTasks }
          : goal
      )
    )
  }

  const deleteTask = async (task) => {
    if (!user) return

    const taskId = task.id

    const oldTasks = [...tasks]

    setTasks((prev) =>
      prev.filter((task) => task.id !== taskId)
    )

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', user.id)

      if (error) {
        console.error(
          'Görev silme hatası:',
          error
        )

        setTasks(oldTasks)

        showMessage(
          'Görev silinemedi.',
          'error'
        )

        return
      }

      showMessage(
        'Görev silindi.',
        'success'
      )

      if (task.goal_id) {
        await syncGoalProgressFromTasks(task.goal_id)
      }
    } catch (error) {
      console.error(error)

      setTasks(oldTasks)
    }
  }

  // =====================================================
  // ALIŞKANLIK OLUŞTUR / TAMAMLA / SİL
  // =====================================================

  const createHabit = async (e) => {
    e.preventDefault()

    if (!user || !newHabitTitle.trim()) {
      showMessage('Lütfen alışkanlık adını gir.', 'error')
      return
    }

    setHabitsLoading(true)

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          title: newHabitTitle.trim(),
          frequency: newHabitFrequency,
        })
        .select()
        .single()

      if (error) throw error

      setHabits((prev) => [data, ...prev])
      setNewHabitTitle('')
      setNewHabitFrequency('daily')
      setShowHabitModal(false)
      showMessage('Alışkanlık eklendi.', 'success')
    } catch (error) {
      console.error('Alışkanlık ekleme hatası:', error)
      showMessage('Alışkanlık eklenemedi. Önce Supabase SQL dosyasını çalıştır.', 'error')
    } finally {
      setHabitsLoading(false)
    }
  }

  const toggleHabitToday = async (habit) => {
    if (!user) return

    const today = new Date().toLocaleDateString('en-CA')
    const completion = habitCompletions.find(
      (item) => item.habit_id === habit.id && item.completed_on === today
    )

    try {
      if (completion) {
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', completion.id)
          .eq('user_id', user.id)

        if (error) throw error
        setHabitCompletions((prev) => prev.filter((item) => item.id !== completion.id))
      } else {
        const { data, error } = await supabase
          .from('habit_completions')
          .insert({ user_id: user.id, habit_id: habit.id, completed_on: today })
          .select()
          .single()

        if (error) throw error
        setHabitCompletions((prev) => [data, ...prev])
      }
    } catch (error) {
      console.error('Alışkanlık güncelleme hatası:', error)
      showMessage('Alışkanlık güncellenemedi.', 'error')
    }
  }

  const deleteHabit = async (habitId) => {
    if (!user) return

    const previousHabits = habits
    const previousCompletions = habitCompletions
    setHabits((prev) => prev.filter((habit) => habit.id !== habitId))
    setHabitCompletions((prev) => prev.filter((item) => item.habit_id !== habitId))

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId)
        .eq('user_id', user.id)

      if (error) throw error
      showMessage('Alışkanlık silindi.', 'success')
    } catch (error) {
      console.error('Alışkanlık silme hatası:', error)
      setHabits(previousHabits)
      setHabitCompletions(previousCompletions)
      showMessage('Alışkanlık silinemedi.', 'error')
    }
  }

  // =====================================================
  // SU EKLE / HEDEF GÜNCELLE
  // =====================================================

  const addWater = async (amountMl) => {
    if (!user) return

    const loggedOn = new Date().toLocaleDateString('en-CA')
    setWaterLoading(true)

    try {
      const { data, error } = await supabase
        .from('water_entries')
        .insert({ user_id: user.id, amount_ml: amountMl, logged_on: loggedOn })
        .select()
        .single()

      if (error) throw error
      setWaterEntries((prev) => [data, ...prev])
      setWaterHistory((prev) => [data, ...prev])
    } catch (error) {
      console.error('Su ekleme hatası:', error)
      showMessage('Su kaydı eklenemedi. Önce Supabase SQL dosyasını çalıştır.', 'error')
    } finally {
      setWaterLoading(false)
    }
  }

  const updateWaterGoal = async (value) => {
    if (!user) return

    const safeGoal = Math.max(250, Math.min(10000, Number(value) || 2500))
    const previousGoal = waterGoal
    setWaterGoal(safeGoal)

    try {
      const { error } = await supabase
        .from('water_settings')
        .upsert({ user_id: user.id, daily_goal_ml: safeGoal }, { onConflict: 'user_id' })

      if (error) throw error
    } catch (error) {
      console.error('Su hedefi güncelleme hatası:', error)
      setWaterGoal(previousGoal)
      showMessage('Su hedefi güncellenemedi.', 'error')
    }
  }

  const createSleepEntry = async (e) => {
    e.preventDefault()
    if (!user || !sleepStartedAt || !sleepWokeAt) {
      showMessage('Uyku başlangıcı ve uyanış saatini gir.', 'error')
      return
    }

    const started = new Date(sleepStartedAt)
    const woke = new Date(sleepWokeAt)
    const durationMinutes = Math.round((woke.getTime() - started.getTime()) / 60000)
    if (durationMinutes < 30 || durationMinutes > 1440) {
      showMessage('Uyku süresi 30 dakika ile 24 saat arasında olmalı.', 'error')
      return
    }

    setSleepLoading(true)
    try {
      const { data, error } = await supabase.from('sleep_entries').insert({
        user_id: user.id,
        sleep_started_at: started.toISOString(),
        woke_at: woke.toISOString(),
        duration_minutes: durationMinutes,
        quality: Number(sleepQuality),
      }).select().single()

      if (error) throw error
      setSleepEntries((prev) => [data, ...prev])
      setSleepStartedAt('')
      setSleepWokeAt('')
      setSleepQuality('3')
      setShowSleepModal(false)
      showMessage('Uyku kaydı eklendi.', 'success')
    } catch (error) {
      console.error('Uyku kaydı ekleme hatası:', error)
      showMessage('Uyku kaydı eklenemedi. Önce Supabase SQL dosyasını çalıştır.', 'error')
    } finally {
      setSleepLoading(false)
    }
  }

  const deleteSleepEntry = async (entryId) => {
    if (!user) return
    const previousEntries = sleepEntries
    setSleepEntries((prev) => prev.filter((entry) => entry.id !== entryId))
    try {
      const { error } = await supabase.from('sleep_entries').delete().eq('id', entryId).eq('user_id', user.id)
      if (error) throw error
      showMessage('Uyku kaydı silindi.', 'success')
    } catch (error) {
      console.error('Uyku kaydı silme hatası:', error)
      setSleepEntries(previousEntries)
      showMessage('Uyku kaydı silinemedi.', 'error')
    }
  }

  // =====================================================
  // İSTATİSTİKLER
  // =====================================================

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length

  const totalTasks = tasks.length

  const progress =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks / totalTasks) * 100
        )

  const today = new Date().toLocaleDateString('en-CA')
  const todayHabitCount = habitCompletions.filter(
    (item) => item.completed_on === today
  ).length
  const maxHabitStreak = habits.reduce(
    (max, habit) => Math.max(max, calculateHabitStreak(habit.id, habitCompletions, habit.frequency)),
    0
  )
  const waterTodayTotal = waterEntries.reduce(
    (total, entry) => total + Number(entry.amount_ml || 0),
    0
  )
  const waterProgress = Math.min(100, Math.round((waterTodayTotal / waterGoal) * 100))
  const latestSleep = sleepEntries[0]
  const averageGoalProgress = goals.length
    ? Math.round(goals.reduce((sum, goal) => sum + Number(goal.progress || 0), 0) / goals.length)
    : 0
  const averageSleepMinutes = sleepEntries.length
    ? Math.round(sleepEntries.reduce((sum, entry) => sum + Number(entry.duration_minutes || 0), 0) / sleepEntries.length)
    : 0
  const recentDays = getRecentDays(7)
  const waterByDay = recentDays.map((day) => ({
    ...day,
    amount: waterHistory
      .filter((entry) => entry.logged_on === day.key)
      .reduce((sum, entry) => sum + Number(entry.amount_ml || 0), 0),
  }))
  const maxWaterAmount = Math.max(waterGoal, ...waterByDay.map((day) => day.amount), 1)

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Kullanıcı'


  // =====================================================
  // YÜKLENİYOR
  // =====================================================

  if (loading) {
    return (
      <>
        <div className="home-loading">
          <div className="home-loading-logo"><img src={movaMark} alt="Mova" /></div>
          <h2>Mova</h2>
          <p>Hayatın hazırlanıyor...</p>
          <Loader2 className="spinner" size={25} />
        </div>
        <GlobalStyles />
      </>
    )
  }

  // =====================================================
  // LANDING PAGE
  // =====================================================

  if (page === 'landing') {
    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

    return (
      <>
        <div className="home-page">
          <header className="home-header">
            <button className="home-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img className="home-logo-mark" src={movaMark} alt="" /><span>Mova</span>
            </button>
            <nav className="home-nav">
              <button onClick={() => scrollTo('home-features')}>Özellikler</button>
              <button onClick={() => scrollTo('home-how')}>Nasıl çalışır?</button>
            </nav>
            <div className="home-header-actions">
              <button className="home-login" onClick={openLogin}>Giriş yap</button>
              <button className="home-signup" onClick={openSignup}>Hesap oluştur</button>
            </div>
          </header>

          <main>
            <section className="home-hero home-hero-photo" style={{ backgroundImage: `url(${heroPark})` }}>
              <div className="hero-photo-shade" />
              <div className="hero-living-layer" aria-hidden="true">
                <i className="hero-sun-ring" />
                <i className="hero-drift-leaf hero-drift-leaf-one" />
                <i className="hero-drift-leaf hero-drift-leaf-two" />
                <i className="hero-drift-leaf hero-drift-leaf-three" />
                <b className="hero-light-speck hero-light-speck-one" />
                <b className="hero-light-speck hero-light-speck-two" />
                <b className="hero-light-speck hero-light-speck-three" />
              </div>
              <div className="home-copy home-photo-copy">
                <span className="home-kicker">KENDİN İÇİN DAHA İYİ BİR RİTİM</span>
                <h1>Yaşamını yönetmeye<br />hazır mısın?</h1>
                <p className="home-lead">Hedeflerini, sporunu, uyku düzenini ve günlük enerjini tek bir yerde takip et. Küçük adımlarla potansiyelini keşfet.</p>
                <div className="home-actions">
                  <button className="home-primary" onClick={openSignup}>Hemen başla <ArrowRight size={18} /></button>
                  <button className="home-secondary home-secondary-light" onClick={() => scrollTo('home-how')}>Nasıl çalışır?</button>
                </div>
                <div className="home-rhythm-strip" aria-label="Mova ile takip edebileceğin alanlar">
                  <span><i className="rhythm-dot rhythm-move" /> Hareket</span>
                  <span><i className="rhythm-dot rhythm-focus" /> Odak</span>
                  <span><i className="rhythm-dot rhythm-rest" /> Denge</span>
                </div>
              </div>
              <div className="hero-float-card hero-float-goal"><Target size={17} /><span>Günlük denge</span><strong>İyi gidiyorsun</strong></div>
              <div className="hero-float-card hero-float-plan"><CalendarDays size={17} /><span>Haftalık plan</span><div className="mini-calendar"><i /><i className="done" /><i /><i className="done" /><i className="done" /><i /><i /></div></div>
              <div className="hero-float-card hero-float-habit"><CheckCircle size={17} /><span>Bugünün listesi</span><strong>3 alışkanlık tamam</strong></div>
            </section>

            <section className="home-features" id="home-features">
              <div className="home-section-head home-section-head-life"><span>YAŞAMININ RİTMİ</span><h2>Kendine iyi gelen her şey, bir arada.</h2><p>Hayatını sıkıştırmak için değil, günün içinde sana alan açmak için tasarlandı.</p></div>
              <div className="home-feature-grid life-feature-grid">
                <article><div className="home-feature-icon move"><Dumbbell size={22}/></div><p className="feature-kicker">HAREKET</p><h3>Gününe yön ver</h3><p>Yapacaklarını, sporunu ve kişisel zamanını dengeli biçimde planla.</p></article>
                <article><div className="home-feature-icon nature"><Target size={22}/></div><p className="feature-kicker">YOLCULUK</p><h3>Hedefine yaklaş</h3><p>Büyük hedeflerini küçük ve gerçekçi adımlara dönüştür.</p></article>
                <article><div className="home-feature-icon habit"><Leaf size={22}/></div><p className="feature-kicker">RUTİN</p><h3>Ritmini koru</h3><p>Sana iyi gelen alışkanlıkları takip et, serini canlı tut.</p></article>
                <article><div className="home-feature-icon balance"><Sun size={22}/></div><p className="feature-kicker">DENGE</p><h3>Kendini dinle</h3><p>Uyku, su ve günlük verilerinle enerjini daha iyi tanı.</p></article>
              </div>
            </section>

            <section className="home-how life-how" id="home-how">
              <div className="home-section-head center"><span>KENDİN İÇİN BAŞLA</span><h2>Ritmini kurmak üç adımda başlar.</h2><p>Her şeyi aynı anda değiştirmene gerek yok.</p></div>
              <div className="home-steps life-steps">
                <article><b>01</b><div><UserPlus size={20}/></div><h3>Kendi alanını aç</h3><p>Ücretsiz hesabını oluştur; hayatına ait sade bir alanın olsun.</p></article>
                <article><b>02</b><div><Dumbbell size={20}/></div><h3>Bugün için seç</h3><p>Önceliklerini, hareketini ve sana iyi gelen rutinleri ekle.</p></article>
                <article><b>03</b><div><Leaf size={20}/></div><h3>Ritmini izle</h3><p>Her gün küçük ilerlemelerini gör ve kendinle bağını koru.</p></article>
              </div>
            </section>

            <section className="home-cta home-cta-life life-cta">
              <div><span>BUGÜN KENDİN İÇİN BAŞLA</span><h2>Hayatın için<br /><em>daha iyi bir ritim</em> kur.</h2><p>İyi yaşamak büyük kararlarla değil, her gün kendine ayırdığın küçük alanlarla başlar.</p></div>
              <button className="home-primary" onClick={openSignup}>Ücretsiz hesap oluştur <ArrowRight size={18}/></button>
            </section>
          </main>

          <footer className="home-footer"><div className="home-logo"><img className="home-logo-mark" src={movaMark} alt="" /><span>Mova</span></div><span>Kendin için daha iyi bir yaşam alanı.</span><span>© 2026 Mova</span></footer>
        </div>
        <GlobalStyles />
      </>
    )
  }


  // =====================================================
  // AUTH PAGE
  // =====================================================

  if (page === 'password-recovery') {
    return (
      <>
        <div className="auth-page auth-recovery-page">
          <aside className="auth-story">
            <div className="auth-story-brand"><img src={movaMark} alt="" /> Mova</div>
            <div className="auth-story-copy">
              <p className="auth-eyebrow">HESAP GÜVENLİĞİ</p>
              <h2>Yeni bir<br /><em>başlangıç.</em></h2>
              <p>Güçlü bir şifre belirle; ritmin ve kişisel alanın güvenle sana ait kalsın.</p>
            </div>
            <div className="auth-energy-orbit" aria-hidden="true"><span className="auth-sun" /><i className="auth-leaf auth-leaf-one" /><i className="auth-leaf auth-leaf-two" /><b>Güvenle<br />devam et.</b></div>
          </aside>

          <section className="auth-form-panel">
            <div className="auth-card auth-recovery-card">
              <div className="auth-logo"><img src={movaMark} alt="" /></div>
              <h1>Yeni şifreni belirle.</h1>
              <p className="auth-subtitle">En az 6 karakterden oluşan, sadece senin bileceğin yeni şifreni yaz.</p>

              <form onSubmit={handlePasswordRecovery}>
                <div className="input-group">
                  <label>Yeni şifre</label>
                  <div className="input-wrapper"><Lock size={18} /><input autoFocus type="password" autoComplete="new-password" placeholder="••••••••" value={recoveryPassword} onChange={(e) => setRecoveryPassword(e.target.value)} /></div>
                </div>
                <div className="input-group">
                  <label>Yeni şifre tekrar</label>
                  <div className="input-wrapper"><Lock size={18} /><input type="password" autoComplete="new-password" placeholder="••••••••" value={recoveryPasswordConfirm} onChange={(e) => setRecoveryPasswordConfirm(e.target.value)} /></div>
                </div>

                {message && <div className={messageType === 'error' ? 'message error' : 'message success'}>{messageType === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}<span>{message}</span></div>}

                <button type="submit" className="auth-submit" disabled={authLoading}>
                  {authLoading ? <><Loader2 size={18} className="spinner" /> Güncelleniyor...</> : <>Şifremi güncelle <ArrowRight size={18} /></>}
                </button>
              </form>
              <p className="auth-reset-help">Bu bağlantı yalnızca şifre yenileme işlemi için kullanılır.</p>
            </div>
          </section>
        </div>
        <GlobalStyles />
      </>
    )
  }

  if (page === 'auth') {
    return (
      <>
        <div className="auth-page">

          <aside className="auth-story">
            <div className="auth-story-brand"><img src={movaMark} alt="" /> Mova</div>
            <div className="auth-story-copy">
              <p className="auth-eyebrow">GÜNLÜK ENERJİN, SENİN RİTMİN</p>
              <h2>Gününe<br /><em>enerji</em> kat.</h2>
              <p>Hayatın tek bir yapılacaklar listesi değil. Hedeflerine, sağlığına ve kendine ayırdığın zamana birlikte yer aç.</p>
            </div>
            <div className="auth-energy-orbit" aria-hidden="true"><span className="auth-sun" /><i className="auth-leaf auth-leaf-one" /><i className="auth-leaf auth-leaf-two" /><b>Bugün<br />senin.</b></div>
            <div className="auth-life-rhythm">
              <div><span><Sun size={16} /></span><p><strong>Güne başla</strong><small>Günün için alan aç</small></p></div>
              <div><span><Dumbbell size={16} /></span><p><strong>Harekete geç</strong><small>Kendin için zaman ayır</small></p></div>
              <div><span><Leaf size={16} /></span><p><strong>Dengeyi koru</strong><small>Doğal ritmini takip et</small></p></div>
            </div>
            <div className="auth-story-note">
              <span>Bugünün niyeti</span>
              <strong>Kendine iyi gelmek.</strong>
              <i><b /></i>
              <small>Küçük adımlar, gerçek dönüşüm.</small>
            </div>
          </aside>

          <section className="auth-form-panel">

          <button
            type="button"
            className="auth-back"
            onClick={() =>
              setPage('landing')
            }
          >
            ← Mova'ya dön
          </button>

          <div className="auth-card">

            <div className="auth-logo"><img src={movaMark} alt="" /></div>

            <h1>
              {authMode === 'login'
                ? 'Kaldığın yerden devam et.'
                : 'Kendin için yeni bir alan aç.'}
            </h1>

            <p className="auth-subtitle">
              {authMode === 'login'
                ? 'Planların, alışkanlıkların ve hedeflerin seni bekliyor.'
                : 'Kişisel sistemini kurmak sadece birkaç dakika sürer.'}
            </p>

            <div className="auth-tabs">

              <button
                onClick={() => {
                  setAuthMode('login')
                  setMessage('')
                }}
                className={
                  authMode === 'login'
                    ? 'auth-tab active'
                    : 'auth-tab'
                }
              >
                <LogIn size={16} />
                Giriş Yap
              </button>

              <button
                onClick={() => {
                  setAuthMode('signup')
                  setMessage('')
                }}
                className={
                  authMode === 'signup'
                    ? 'auth-tab active'
                    : 'auth-tab'
                }
              >
                <UserPlus size={16} />
                Hesap Oluştur
              </button>

            </div>

            <form
              onSubmit={
                authMode === 'login'
                  ? handleLogin
                  : handleSignup
              }
            >

              {authMode === 'signup' && (
                <div className="input-group">

                  <label>
                    Ad Soyad
                  </label>

                  <div className="input-wrapper">

                    <User size={18} />

                    <input
                      type="text"
                      placeholder="Adınız Soyadınız"
                      value={fullName}
                      onChange={(e) =>
                        setFullName(
                          e.target.value
                        )
                      }
                    />

                  </div>

                </div>
              )}

              <div className="input-group">

                <label>
                  E-posta
                </label>

                <div className="input-wrapper">

                  <Mail size={18} />

                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                  />

                </div>

              </div>

              <div className="input-group">

                <label>
                  Şifre
                </label>

                <div className="input-wrapper">

                  <Lock size={18} />

                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                  />

                </div>

                {authMode === 'signup' && (
                  <small>
                    En az 6 karakter
                  </small>
                )}

                {authMode === 'login' && (
                  <button type="button" className="auth-forgot" onClick={handleForgotPassword} disabled={authLoading}>
                    Şifremi unuttum
                  </button>
                )}

              </div>

              {message && (
                <div
                  className={
                    messageType === 'error'
                      ? 'message error'
                      : 'message success'
                  }
                >
                  {messageType === 'error' ? (
                    <AlertCircle size={18} />
                  ) : (
                    <CheckCircle size={18} />
                  )}

                  <span>
                    {message}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={authLoading}
              >

                {authLoading ? (
                  <>
                    <Loader2
                      size={18}
                      className="spinner"
                    />

                    İşlem yapılıyor...
                  </>
                ) : authMode === 'login' ? (
                  <>
                    Giriş Yap
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    Hesap Oluştur
                    <ArrowRight size={18} />
                  </>
                )}

              </button>

            </form>

            <div className="auth-bottom">

              {authMode === 'login' ? (
                <>
                  Hesabın yok mu?

                  <button
                    onClick={() => {
                      setAuthMode('signup')
                      setMessage('')
                    }}
                  >
                    Hesap oluştur
                  </button>
                </>
              ) : (
                <>
                  Zaten hesabın var mı?

                  <button
                    onClick={() => {
                      setAuthMode('login')
                      setMessage('')
                    }}
                  >
                    Giriş yap
                  </button>
                </>
              )}

            </div>

          </div>

          </section>

        </div>

        <GlobalStyles />
      </>
    )
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <>
      <div className="dashboard-page">

        <nav className={mobileMenuOpen ? 'dashboard-nav mobile-open' : 'dashboard-nav'}>

          <div className="brand">

            <img className="brand-logo" src={movaMark} alt="Mova" />

            <span>
              Mova
            </span>

          </div>

          <button
            className="dashboard-mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="dashboard-menu" aria-label="Mova menüsü">
            {[
              { id: 'dashboard', label: 'Bugün', icon: LayoutDashboard },
              { id: 'life', label: 'Ritim', icon: Sparkles },
              { id: 'planner', label: 'Plan', icon: CalendarDays },
              { id: 'tasks', label: 'Görevler', icon: ListTodo },
              { id: 'goals', label: 'Hedefler', icon: Target },
              { id: 'habits', label: 'Alışkanlıklar', icon: Flame },
              { id: 'water', label: 'Su', icon: Droplets },
              { id: 'sleep', label: 'Uyku', icon: Moon },
              { id: 'statistics', label: 'İstatistikler', icon: BarChart3 },
              { id: 'settings', label: 'Alanım', icon: User },
              ...(isAdmin ? [{ id: 'admin', label: 'Yönetim', icon: ShieldCheck }] : []),
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={activeView === id ? 'dashboard-menu-item active' : 'dashboard-menu-item'}
                onClick={() => {
                  setActiveView(id)
                  setMobileMenuOpen(false)
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className="dashboard-user">

            <div className="dashboard-user-avatar">
              {displayName
                .charAt(0)
                .toUpperCase()}
            </div>

            <span>
              {displayName}
            </span>

            <button
              className="dashboard-logout"
              onClick={handleLogout}
              aria-label="Çıkış yap"
              title="Çıkış yap"
            >
              <LogOut size={16} />
              Çıkış
            </button>

          </div>

        </nav>

        <div className="dashboard-background" aria-hidden="true">
          <img src={heroPark} alt="" />
          <div className="dashboard-background-shade" />
          <div className="dashboard-background-glow glow-one" />
          <div className="dashboard-background-glow glow-two" />
          <div className="dashboard-background-path" />
          <span className="dashboard-background-speck speck-one" />
          <span className="dashboard-background-speck speck-two" />
          <span className="dashboard-background-speck speck-three" />
        </div>

        <main className="dashboard-content">

          {activeView === 'dashboard' && <>
          {/* ÜST ALAN */}

          <div className="dashboard-intro">

            <div className="dashboard-intro-copy">

              <span className="today-label">
                BUGÜN
              </span>

              <h1>
                Merhaba,{' '}
                {displayName.split(' ')[0]} 👋
              </h1>

              <p>
                Bugün kendin için bir adım daha at.
              </p>

              <div className="dashboard-date">
                <CalendarDays size={17} />

                {new Date().toLocaleDateString(
                  'tr-TR',
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  }
                )}
              </div>

            </div>

            <div className="dashboard-welcome-art" aria-hidden="true">
              <img src={heroPark} alt="" />
              <div className="dashboard-art-shade" />
              <div className="dashboard-art-sun" />
              <div className="dashboard-art-leaf leaf-one" />
              <div className="dashboard-art-leaf leaf-two" />
              <div className="dashboard-art-note"><Leaf size={15} /><span>Bugünün ritmi</span><strong>Kendine alan aç</strong></div>
              <div className="dashboard-art-orbit"><Sparkles size={15} /><span>İyi hisset</span></div>
            </div>

          </div>

          {/* İSTATİSTİKLER */}

          <div className="dashboard-grid">

            <DashboardCard
              icon={<ListTodo size={21} />}
              title="Görevler"
              value={`${completedTasks}/${totalTasks}`}
              description="Tamamlanan görev"
            />

            <DashboardCard
              icon={<TrendingUp size={21} />}
              title="İlerleme"
              value={`${progress}%`}
              description="Günlük ilerleme"
            />

            <DashboardCard
              icon={<Flame size={21} />}
              title="Seri"
              value={maxHabitStreak ? `🔥 ${maxHabitStreak}` : '0'}
              description={habits.length ? `${todayHabitCount}/${habits.length} alışkanlık` : 'Henüz alışkanlık yok'}
            />

            <DashboardCard
              icon={<Moon size={21} />}
              title="Uyku"
              value={latestSleep ? formatDuration(latestSleep.duration_minutes) : '—'}
              description={latestSleep ? `Kalite ${latestSleep.quality}/5` : 'Henüz kayıt yok'}
            />

            <DashboardCard
              icon={<Droplets size={21} />}
              title="Su"
              value={`${(waterTodayTotal / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} L`}
              description={`Hedefin %${waterProgress}'i`}
            />

          </div>
          </>}

          {/* GÖREV BÖLÜMÜ */}
          {activeView === 'tasks' && (
          <section className="tasks-section view-enter">

            <div className="tasks-header">

              <div>

                <div className="section-small-title">
                  GÜNÜN PLANI
                </div>

                <h2>
                  Bugünün görevleri
                </h2>

              </div>

              <button
                className="add-task-button"
                onClick={() =>
                  setShowTaskModal(true)
                }
              >
                <Plus size={18} />
                Görev Ekle
              </button>

            </div>

            {/* İLERLEME */}

            <div className="task-progress">

              <div className="task-progress-info">

                <span>
                  Günlük ilerleme
                </span>

                <strong>
                  {progress}%
                </strong>

              </div>

              <div className="task-progress-bar">
                <div
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

            </div>

            {/* GÖREVLER */}

            <div className="tasks-list">

              {tasksLoading ? (
                <div className="tasks-empty">

                  <Loader2
                    className="spinner"
                    size={25}
                  />

                  <p>
                    Görevler yükleniyor...
                  </p>

                </div>
              ) : tasks.length === 0 ? (
                <div className="tasks-empty">

                  <div className="empty-icon">
                    <ListTodo size={25} />
                  </div>

                  <h3>
                    Henüz görevin yok
                  </h3>

                  <p>
                    Gününü planlamak için ilk görevini
                    ekleyebilirsin.
                  </p>

                  <button
                    className="empty-add-button"
                    onClick={() =>
                      setShowTaskModal(true)
                    }
                  >
                    <Plus size={17} />
                    İlk Görevi Ekle
                  </button>

                </div>
              ) : (
                tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() =>
                      toggleTask(task)
                    }
                    onDelete={() =>
                      deleteTask(task)
                    }
                  />
                ))
              )}

            </div>

          </section>
          )}

          {/* HEDEFLER */}
          {activeView === 'goals' && (
          <section className="goals-section view-enter">
            <div className="tasks-header goals-header">
              <div>
                <div className="section-small-title">
                  HEDEFLER
                </div>

                <h2>
                  Hedeflerin
                </h2>
              </div>

              <button
                className="add-task-button"
                onClick={() => setShowGoalModal(true)}
              >
                <Plus size={18} />
                Hedef Ekle
              </button>
            </div>

            {goalsLoading ? (
              <div className="tasks-empty">
                <Loader2
                  className="spinner"
                  size={25}
                />

                <p>
                  Hedefler yükleniyor...
                </p>
              </div>
            ) : goals.length === 0 ? (
              <div className="tasks-empty">
                <div className="empty-icon goal-empty-icon">
                  <Target size={25} />
                </div>

                <h3>
                  Henüz hedefin yok
                </h3>

                <p>
                  İlk hedefini oluştur ve ilerlemeni takip et.
                </p>

                <button
                  className="empty-add-button"
                  onClick={() => setShowGoalModal(true)}
                >
                  <Plus size={17} />
                  İlk Hedefi Oluştur
                </button>
              </div>
            ) : (
              <div className="goals-list">
                {goals.map((goal) => (
                  <GoalItem
                    key={goal.id}
                    goal={goal}
                    onProgress={(value) =>
                      updateGoalProgress(goal.id, value)
                    }
                    onDelete={() =>
                      deleteGoal(goal.id)
                    }
                    isTaskDriven={tasks.some((task) => task.goal_id === goal.id)}
                  />
                ))}
              </div>
            )}
          </section>
          )}

          {/* ALT BİLGİ */}
          {activeView === 'dashboard' && (
          <SetupStatus user={user} />
          )}

          {activeView === 'dashboard' && (
          <div className="dashboard-coming">

            <Sparkles size={20} />

            <div>

              <strong>
                Mova büyümeye devam ediyor.
              </strong>

              <p>
                Ayrıntılı yönetim için sol menüden
                Görevler veya Hedefler sayfasını aç.
              </p>

            </div>

          </div>
          )}

          {activeView === 'habits' && (
            <section className="tasks-section habits-section view-enter">
              <div className="tasks-header">
                <div>
                  <div className="section-small-title">ALIŞKANLIKLAR</div>
                  <h2>Bugünkü alışkanlıkların</h2>
                </div>
                <button className="add-task-button" onClick={() => setShowHabitModal(true)}>
                  <Plus size={18} />
                  Alışkanlık Ekle
                </button>
              </div>

              <div className="task-progress">
                <div className="task-progress-info">
                  <span>Bugünkü başarı</span>
                  <strong>{habits.length ? Math.round((todayHabitCount / habits.length) * 100) : 0}%</strong>
                </div>
                <div className="task-progress-bar">
                  <div style={{ width: `${habits.length ? Math.round((todayHabitCount / habits.length) * 100) : 0}%` }} />
                </div>
              </div>

              {habitsLoading ? (
                <div className="tasks-empty"><Loader2 className="spinner" size={25} /><p>Alışkanlıklar yükleniyor...</p></div>
              ) : habits.length === 0 ? (
                <div className="tasks-empty">
                  <div className="empty-icon"><Flame size={25} /></div>
                  <h3>Henüz alışkanlığın yok</h3>
                  <p>Her gün yapmak istediğin küçük bir adımla başla.</p>
                  <button className="empty-add-button" onClick={() => setShowHabitModal(true)}><Plus size={17} /> İlk Alışkanlığı Ekle</button>
                </div>
              ) : (
                <div className="habits-list">
                  {habits.map((habit) => (
                    <HabitItem
                      key={habit.id}
                      habit={habit}
                      completed={habitCompletions.some((item) => item.habit_id === habit.id && item.completed_on === today)}
                      streak={calculateHabitStreak(habit.id, habitCompletions, habit.frequency)}
                      onToggle={() => toggleHabitToday(habit)}
                      onDelete={() => deleteHabit(habit.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {activeView === 'water' && (
            <section className="tasks-section water-section view-enter">
              <div className="tasks-header">
                <div>
                  <div className="section-small-title">SU TAKİBİ</div>
                  <h2>Bugünkü su tüketimin</h2>
                </div>
                <div className="water-goal-control">
                  <label htmlFor="water-goal">Günlük hedef</label>
                  <input
                    id="water-goal"
                    type="number"
                    min="250"
                    max="10000"
                    step="250"
                    value={waterGoal}
                    onChange={(e) => setWaterGoal(e.target.value)}
                    onBlur={(e) => updateWaterGoal(e.target.value)}
                  />
                  <span>ml</span>
                </div>
              </div>

              <div className="water-overview">
                <div className="water-total"><Droplets size={27} /><strong>{(waterTodayTotal / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} L</strong><span>/ {(waterGoal / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} L</span></div>
                <div className="water-progress"><div style={{ width: `${waterProgress}%` }} /></div>
                <p>{waterProgress >= 100 ? 'Günlük hedefine ulaştın, harika! 🎉' : `${waterGoal - waterTodayTotal} ml daha içerek hedefine ulaşabilirsin.`}</p>
              </div>

              <div className="water-actions">
                {[250, 500, 750].map((amount) => (
                  <button key={amount} className="water-add-button" disabled={waterLoading} onClick={() => addWater(amount)}><Plus size={17} /> {amount} ml</button>
                ))}
              </div>

              {waterEntries.length > 0 && (
                <div className="water-history">
                  <span>Bugünkü kayıtlar</span>
                  <strong>{waterEntries.map((entry) => `${entry.amount_ml} ml`).join(' · ')}</strong>
                </div>
              )}
            </section>
          )}

          {activeView === 'sleep' && (
            <section className="tasks-section sleep-section view-enter">
              <div className="tasks-header">
                <div>
                  <div className="section-small-title">UYKU TAKİBİ</div>
                  <h2>Uyku kayıtların</h2>
                </div>
                <button className="add-task-button" onClick={() => setShowSleepModal(true)}><Plus size={18} /> Uyku Ekle</button>
              </div>

              {sleepLoading ? (
                <div className="tasks-empty"><Loader2 className="spinner" size={25} /><p>Uyku kayıtları yükleniyor...</p></div>
              ) : sleepEntries.length === 0 ? (
                <div className="tasks-empty">
                  <div className="empty-icon"><Moon size={25} /></div>
                  <h3>Henüz uyku kaydın yok</h3>
                  <p>Uyku düzenini görmek için ilk kaydını ekle.</p>
                  <button className="empty-add-button" onClick={() => setShowSleepModal(true)}><Plus size={17} /> İlk Kaydı Ekle</button>
                </div>
              ) : (
                <div className="sleep-list">
                  {sleepEntries.map((entry) => (
                    <div className="sleep-item" key={entry.id}>
                      <div className="sleep-item-icon"><Moon size={19} /></div>
                      <div className="sleep-item-main">
                        <strong>{formatDuration(entry.duration_minutes)}</strong>
                        <span>{new Date(entry.sleep_started_at).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} → {new Date(entry.woke_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="sleep-quality">{'★'.repeat(entry.quality)}<span>/5</span></div>
                      <button className="delete-task" onClick={() => deleteSleepEntry(entry.id)} title="Kaydı sil"><Trash2 size={17} /></button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeView === 'life' && <div className="dashboard-module-enter"><Suspense fallback={<ViewLoading />}><LifeCenter user={user} /></Suspense></div>}

          {activeView === 'planner' && (
            <div className="dashboard-module-enter"><Suspense fallback={<ViewLoading />}><Planner
              tasks={tasks}
              goals={goals}
              habits={habits.map((habit) => ({
                ...habit,
                completedToday: habitCompletions.some((item) => item.habit_id === habit.id && item.completed_on === today),
              }))}
              waterTodayTotal={waterTodayTotal}
              waterGoal={waterGoal}
              onChangeView={setActiveView}
            /></Suspense></div>
          )}

          {activeView === 'settings' && <div className="dashboard-module-enter"><Suspense fallback={<ViewLoading />}><PersonalSettings user={user} onUserUpdated={setUser} /></Suspense></div>}

          {activeView === 'admin' && isAdmin && <div className="dashboard-module-enter"><Suspense fallback={<ViewLoading />}><AdminDashboard user={user} /></Suspense></div>}

          {activeView === 'statistics' && (
            <section className="statistics-section view-enter">
              <div className="statistics-heading">
                <div><div className="section-small-title">İSTATİSTİKLER</div><h2>Gelişiminin özeti</h2><p>Mova verilerine göre güncel performansın.</p></div>
              </div>

              <div className="statistics-grid">
                <StatisticCard icon={<ListTodo size={20} />} label="Görev başarısı" value={`%${progress}`} detail={`${completedTasks}/${totalTasks || 0} görev tamamlandı`} />
                <StatisticCard icon={<Target size={20} />} label="Hedef ilerlemesi" value={`%${averageGoalProgress}`} detail={`${goals.length} aktif hedef`} />
                <StatisticCard icon={<Flame size={20} />} label="Alışkanlık serisi" value={maxHabitStreak ? `${maxHabitStreak} gün` : '—'} detail={habits.length ? `${todayHabitCount}/${habits.length} bugün tamamlandı` : 'Henüz alışkanlık yok'} />
                <StatisticCard icon={<Moon size={20} />} label="Ortalama uyku" value={averageSleepMinutes ? formatDuration(averageSleepMinutes) : '—'} detail={sleepEntries.length ? `${sleepEntries.length} son kayıt` : 'Henüz uyku kaydı yok'} />
              </div>

              <div className="statistics-panels">
                <article className="statistics-panel water-chart-panel">
                  <div className="statistics-panel-title"><div><h3>Son 7 gün su tüketimi</h3><p>Günlük hedef: {(waterGoal / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} L</p></div><Droplets size={19} /></div>
                  <div className="water-chart">
                    {waterByDay.map((day) => (
                      <div className="water-chart-day" key={day.key}>
                        <div className="water-chart-column"><div className="water-chart-fill" style={{ height: `${Math.max(day.amount ? 5 : 0, Math.round((day.amount / maxWaterAmount) * 100))}%` }} title={`${day.amount} ml`} /></div>
                        <span>{day.label}</span>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="statistics-panel">
                  <div className="statistics-panel-title"><div><h3>Bugünün durumu</h3><p>Kısa özet</p></div><TrendingUp size={19} /></div>
                  <div className="daily-summary-row"><span>Görevler</span><strong>{completedTasks}/{totalTasks}</strong></div>
                  <div className="daily-summary-row"><span>Alışkanlıklar</span><strong>{todayHabitCount}/{habits.length}</strong></div>
                  <div className="daily-summary-row"><span>Su tüketimi</span><strong>{(waterTodayTotal / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} / {(waterGoal / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} L</strong></div>
                  <div className="daily-summary-row"><span>Son uyku</span><strong>{latestSleep ? formatDuration(latestSleep.duration_minutes) : '—'}</strong></div>
                </article>
              </div>
            </section>
          )}

        </main>

      </div>

      {/* GÖREV MODALI */}

      {showTaskModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowTaskModal(false)
          }
        >

          <div
            className="task-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <span>
                  MOVA
                </span>

                <h2>
                  Yeni görev
                </h2>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowTaskModal(false)
                }
              >
                <X size={19} />
              </button>

            </div>

            <form onSubmit={handleAddTask}>

              <div className="input-group">

                <label>
                  Görev
                </label>

                <div className="input-wrapper">

                  <ListTodo size={18} />

                  <input
                    autoFocus
                    type="text"
                    placeholder="Örn. 30 dakika kitap oku"
                    value={newTaskTitle}
                    onChange={(e) =>
                      setNewTaskTitle(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

              <div className="input-group">

                <label>
                  Açıklama
                </label>

                <textarea
                  className="task-textarea"
                  placeholder="Görev hakkında kısa bir açıklama..."
                  value={newTaskDescription}
                  onChange={(e) =>
                    setNewTaskDescription(
                      e.target.value
                    )
                  }
                />

              </div>

              <div className="modal-two-columns">

                <div className="input-group">

                  <label>
                    Öncelik
                  </label>

                  <select
                    className="task-select"
                    value={newTaskPriority}
                    onChange={(e) =>
                      setNewTaskPriority(
                        e.target.value
                      )
                    }
                  >
                    <option value="low">
                      Düşük
                    </option>

                    <option value="normal">
                      Normal
                    </option>

                    <option value="high">
                      Yüksek
                    </option>
                  </select>

                </div>

                <div className="input-group">

                  <label>
                    Tarih
                  </label>

                  <input
                    className="task-date"
                    type="date"
                    value={newTaskDate}
                    onChange={(e) =>
                      setNewTaskDate(
                        e.target.value
                      )
                    }
                  />

                </div>

              </div>

              <div className="input-group">
                <label>
                  Hedef (isteğe bağlı)
                </label>

                <div className="input-wrapper">
                  <Target size={18} />

                  <select
                    value={newTaskGoal}
                    onChange={(e) =>
                      setNewTaskGoal(e.target.value)
                    }
                  >
                    <option value="">
                      Hedef seçme
                    </option>

                    {goals.map((goal) => (
                      <option
                        key={goal.id}
                        value={goal.id}
                      >
                        {goal.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="modal-submit"
                type="submit"
                disabled={tasksLoading}
              >

                {tasksLoading ? (
                  <>
                    <Loader2
                      size={17}
                      className="spinner"
                    />

                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Görevi Kaydet
                  </>
                )}

              </button>

            </form>

          </div>

        </div>
      )}

      {/* ALIŞKANLIK MODALI */}
      {showHabitModal && (
        <div className="modal-overlay" onClick={() => setShowHabitModal(false)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div><span>MOVA</span><h2>Yeni alışkanlık</h2></div>
              <button className="modal-close" onClick={() => setShowHabitModal(false)}><X size={19} /></button>
            </div>
            <form onSubmit={createHabit}>
              <div className="input-group">
                <label>Alışkanlık</label>
                <div className="input-wrapper">
                  <Flame size={18} />
                  <input autoFocus type="text" placeholder="Örn. 30 dakika kitap oku" value={newHabitTitle} onChange={(e) => setNewHabitTitle(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Tekrar sıklığı</label>
                <select className="task-select" value={newHabitFrequency} onChange={(e) => setNewHabitFrequency(e.target.value)}>
                  <option value="daily">Her gün</option>
                  <option value="weekly">Haftalık</option>
                </select>
              </div>
              <button className="modal-submit" type="submit" disabled={habitsLoading}>
                {habitsLoading ? <><Loader2 size={17} className="spinner" /> Kaydediliyor...</> : <><Plus size={18} /> Alışkanlığı Kaydet</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* UYKU MODALI */}
      {showSleepModal && (
        <div className="modal-overlay" onClick={() => setShowSleepModal(false)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div><span>MOVA</span><h2>Uyku kaydı ekle</h2></div>
              <button className="modal-close" onClick={() => setShowSleepModal(false)}><X size={19} /></button>
            </div>
            <form onSubmit={createSleepEntry}>
              <div className="modal-two-columns">
                <div className="input-group">
                  <label>Uyku başlangıcı</label>
                  <input className="task-date" type="datetime-local" value={sleepStartedAt} onChange={(e) => setSleepStartedAt(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Uyanış</label>
                  <input className="task-date" type="datetime-local" value={sleepWokeAt} onChange={(e) => setSleepWokeAt(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label>Uyku kalitesi</label>
                <select className="task-select" value={sleepQuality} onChange={(e) => setSleepQuality(e.target.value)}>
                  <option value="1">1 — Çok kötü</option><option value="2">2 — Kötü</option><option value="3">3 — Orta</option><option value="4">4 — İyi</option><option value="5">5 — Çok iyi</option>
                </select>
              </div>
              <button className="modal-submit" type="submit" disabled={sleepLoading}>
                {sleepLoading ? <><Loader2 size={17} className="spinner" /> Kaydediliyor...</> : <><Moon size={18} /> Uyku Kaydını Kaydet</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HEDEF MODALI */}
      {showGoalModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowGoalModal(false)}
        >
          <div
            className="task-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span>
                  MOVA
                </span>

                <h2>
                  Yeni hedef
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowGoalModal(false)}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={createGoal}>
              <div className="input-group">
                <label>
                  Hedef
                </label>

                <div className="input-wrapper">
                  <Target size={18} />

                  <input
                    autoFocus
                    type="text"
                    placeholder="Örn. İngilizce öğren"
                    value={newGoalTitle}
                    onChange={(e) =>
                      setNewGoalTitle(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="input-group">
                <label>
                  Açıklama
                </label>

                <textarea
                  className="task-textarea"
                  placeholder="Hedef hakkında kısa bir açıklama..."
                  value={newGoalDescription}
                  onChange={(e) =>
                    setNewGoalDescription(e.target.value)
                  }
                />
              </div>

              <div className="input-group">
                <label>
                  Hedef tarihi
                </label>

                <input
                  className="task-date"
                  type="date"
                  value={newGoalDate}
                  onChange={(e) =>
                    setNewGoalDate(e.target.value)
                  }
                />
              </div>

              <button
                className="modal-submit"
                type="submit"
                disabled={goalsLoading}
              >
                {goalsLoading ? (
                  <>
                    <Loader2
                      size={17}
                      className="spinner"
                    />

                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Target size={18} />
                    Hedefi Kaydet
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MESAJ */}

      {message && (
        <div
          className={`toast ${
            messageType === 'error'
              ? 'toast-error'
              : 'toast-success'
          }`}
        >

          {messageType === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle size={18} />
          )}

          <span>
            {message}
          </span>

          <button
            onClick={() => setMessage('')}
          >
            <X size={15} />
          </button>

        </div>
      )}

      <WelcomeGuide user={user} onNavigate={setActiveView} />
      <GlobalStyles />
    </>
  )
}

// =====================================================
// ALIŞKANLIK YARDIMCILARI
// =====================================================


function getRecentDays(count) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (count - 1 - index))
    return {
      key: date.toLocaleDateString('en-CA'),
      label: date.toLocaleDateString('tr-TR', { weekday: 'narrow' }),
    }
  })
}

function StatisticCard({ icon, label, value, detail }) {
  return (
    <article className="statistic-card">
      <div className="statistic-card-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function formatDuration(minutes) {
  const total = Number(minutes || 0)
  const hours = Math.floor(total / 60)
  const remainingMinutes = total % 60
  return `${hours}s ${remainingMinutes}dk`
}

function calculateHabitStreak(habitId, completions, frequency = 'daily') {
  const completionDates = new Set(
    completions
      .filter((item) => item.habit_id === habitId)
      .map((item) => item.completed_on)
  )

  if (frequency === 'weekly') {
    const weekKey = (date) => {
      const monday = new Date(date)
      const day = monday.getDay() || 7
      monday.setDate(monday.getDate() - day + 1)
      return monday.toLocaleDateString('en-CA')
    }
    const completedWeeks = new Set(
      [...completionDates].map((date) => weekKey(new Date(`${date}T00:00:00`)))
    )
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    if (!completedWeeks.has(weekKey(cursor))) cursor.setDate(cursor.getDate() - 7)

    let weeklyStreak = 0
    while (completedWeeks.has(weekKey(cursor))) {
      weeklyStreak += 1
      cursor.setDate(cursor.getDate() - 7)
    }
    return weeklyStreak
  }

  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  // Bugün işaretlenmediyse seri dününden itibaren hesaplanır.
  const localDate = (date) => date.toLocaleDateString('en-CA')
  if (!completionDates.has(localDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (completionDates.has(localDate(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function HabitItem({ habit, completed, streak, onToggle, onDelete }) {
  return (
    <div className={`habit-item ${completed ? 'habit-completed' : ''}`}>
      <button className={`task-checkbox ${completed ? 'checked' : ''}`} onClick={onToggle} aria-label="Alışkanlığı tamamla">
        {completed && <Check size={15} />}
      </button>
      <div className="habit-main">
        <div className="task-title-row">
          <h3>{habit.title}</h3>
          <span className="habit-frequency">{habit.frequency === 'weekly' ? 'Haftalık' : 'Günlük'}</span>
        </div>
        <p className="habit-streak"><Flame size={13} /> {streak ? `${streak} ${habit.frequency === 'weekly' ? 'hafta' : 'gün'} seri` : 'Seriyi bugün başlat'}</p>
      </div>
      <button className="delete-task" onClick={onDelete} title="Alışkanlığı sil"><Trash2 size={17} /></button>
    </div>
  )
}

// =====================================================
// TASK ITEM
// =====================================================

function TaskItem({
  task,
  onToggle,
  onDelete,
}) {
  const priorityText = {
    low: 'Düşük',
    normal: 'Normal',
    high: 'Yüksek',
  }

  return (
    <div
      className={`task-item ${
        task.completed
          ? 'task-completed'
          : ''
      }`}
    >

      <button
        className={`task-checkbox ${
          task.completed
            ? 'checked'
            : ''
        }`}
        onClick={onToggle}
      >
        {task.completed && (
          <Check size={15} />
        )}
      </button>

      <div className="task-main">

        <div className="task-title-row">

          <h3>
            {task.title}
          </h3>

          {task.goals?.title && (
            <div className="task-goal-badge">
              <Target size={11} />
              {task.goals.title}
            </div>
          )}

          <span
            className={`priority priority-${task.priority}`}
          >
            {priorityText[task.priority]}
          </span>

        </div>

        {task.description && (
          <p>
            {task.description}
          </p>
        )}

        <div className="task-meta">

          <span>
            <Clock3 size={12} />

            {task.due_date
              ? new Date(
                  `${task.due_date}T00:00:00`
                ).toLocaleDateString(
                  'tr-TR'
                )
              : 'Tarih belirtilmedi'}
          </span>

          {task.goals?.title && (
            <span className="task-goal">
              <Target size={12} />
              {task.goals.title}
            </span>
          )}

        </div>

      </div>

      <button
        className="delete-task"
        onClick={onDelete}
        title="Görevi sil"
      >
        <Trash2 size={17} />
      </button>

    </div>
  )
}

// =====================================================
// GOAL ITEM
// =====================================================

function GoalItem({
  goal,
  onProgress,
  onDelete,
  isTaskDriven,
}) {
  return (
    <div className="goal-item">
      <div className="goal-item-top">
        <div className="goal-item-icon">
          <Target size={19} />
        </div>

        <button
          className="delete-task"
          onClick={onDelete}
          title="Hedefi sil"
        >
          <Trash2 size={17} />
        </button>
      </div>

      <div className="goal-item-content">
        <h3>
          {goal.title}
        </h3>

        {goal.description && (
          <p>
            {goal.description}
          </p>
        )}

        <div className="goal-progress-info">
          <span>
            İlerleme
          </span>

          <strong>
            {goal.progress || 0}%
          </strong>
        </div>

        <div className="goal-progress-bar">
          <div
            style={{
              width: `${goal.progress || 0}%`,
            }}
          />
        </div>

        {isTaskDriven ? (
          <p className="goal-task-driven">
            Bu ilerleme bağlı görevlerden otomatik hesaplanır.
          </p>
        ) : (
          <input
            className="goal-range"
            type="range"
            min="0"
            max="100"
            value={goal.progress || 0}
            onChange={(e) =>
              onProgress(e.target.value)
            }
          />
        )}

        {goal.target_date && (
          <div className="goal-date">
            <CalendarDays size={13} />

            {new Date(
              `${goal.target_date}T00:00:00`
            ).toLocaleDateString('tr-TR')}
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================================
// DASHBOARD CARD
// =====================================================

function DashboardCard({
  icon,
  title,
  value,
  description,
}) {
  return (
    <div className="dashboard-card">

      <div className="dashboard-card-icon">
        {icon}
      </div>

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>

    </div>
  )
}

// =====================================================
// EKRAN YÜKLENİYOR
// =====================================================

function ViewLoading() {
  return <div className="view-loading"><Loader2 className="spinner" size={24} /><span>Mova hazırlanıyor…</span></div>
}

// CSS
// =====================================================

function GlobalStyles() {
  return (<style>{`
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    button,input,textarea,select{font:inherit}button{cursor:pointer}.spinner{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
    .home-page{min-height:100vh;background:#fbfaf8;color:#20242d;overflow:hidden}.home-header{height:78px;max-width:1240px;margin:auto;padding:0 28px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eeeae3}.home-logo{display:flex;align-items:center;gap:10px;color:#20242d;font-weight:750;font-size:19px;padding:0}.home-logo-mark{width:36px;height:36px;border-radius:10px;background:#6d5ce7;color:#fff;display:grid;place-items:center;font-weight:800}.home-nav{display:flex;gap:30px;margin-left:100px}.home-nav button,.home-login{color:#686d77;font-size:14px;padding:9px 4px}.home-nav button:hover,.home-login:hover{color:#20242d}.home-header-actions{display:flex;align-items:center;gap:12px}.home-signup{background:#20242d;color:#fff;border-radius:9px;padding:11px 17px;font-size:14px;font-weight:650}.home-signup:hover{background:#333945}
    .home-hero{max-width:1240px;margin:auto;padding:86px 28px 96px;display:grid;grid-template-columns:.84fr 1.16fr;gap:64px;align-items:center}.home-copy{padding-left:24px}.home-kicker,.home-section-head>span,.home-cta span{display:inline-flex;align-items:center;gap:8px;color:#6d5ce7;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:750}.home-kicker:before{content:"";width:7px;height:7px;border-radius:50%;background:#6d5ce7}.home-copy h1{font-size:68px;line-height:1.02;letter-spacing:-3.5px;margin:20px 0 24px;font-weight:720}.home-copy h1 em{font-style:normal;color:#6d5ce7}.home-lead{max-width:510px;color:#686d77;font-size:17px;line-height:1.75;margin:0}.home-actions{display:flex;gap:12px;margin-top:30px}.home-primary{display:inline-flex;align-items:center;justify-content:center;gap:9px;background:#6d5ce7;color:#fff;border-radius:9px;padding:13px 19px;font-size:14px;font-weight:700;box-shadow:0 8px 20px rgba(109,92,231,.18)}.home-primary:hover{background:#5f50d7;transform:translateY(-1px)}.home-secondary{border:1px solid #ddd9d1;border-radius:9px;padding:12px 18px;color:#444a54;font-size:14px;background:#fff}.home-secondary:hover{border-color:#c9c4ba}.home-note{display:flex;align-items:center;gap:9px;margin-top:22px;color:#8a8e96;font-size:12px}.home-note-dot{width:7px;height:7px;background:#56a66c;border-radius:50%}
    .home-preview-wrap{position:relative;padding:22px 0}.home-preview-shadow{position:absolute;inset:36px 12px 8px 28px;background:#ddd8d0;border-radius:22px;filter:blur(22px);opacity:.65}.home-preview{position:relative;background:#171b24;border:1px solid #2b3140;border-radius:15px;overflow:hidden;box-shadow:0 28px 60px rgba(29,35,48,.20);transform:perspective(1300px) rotateY(-3deg) rotateX(1deg)}.preview-topbar{height:45px;background:#10141c;border-bottom:1px solid #2b3140;display:flex;align-items:center;justify-content:space-between;padding:0 16px;color:#eef0f5;font-size:11px}.preview-brand{display:flex;align-items:center;gap:7px;font-weight:700}.preview-brand span{width:8px;height:8px;background:#7a69f1;border-radius:3px}.preview-user{width:25px;height:25px;border-radius:50%;background:#7564e8;display:grid;place-items:center;font-size:10px;font-weight:700}.preview-body{display:grid;grid-template-columns:130px 1fr;min-height:410px}.preview-sidebar{background:#11151d;padding:18px 11px;color:#8c93a0}.preview-side-title{font-size:7px;letter-spacing:1.4px;margin:0 8px 12px;color:#5f6775}.preview-link{display:flex;align-items:center;gap:7px;padding:9px 8px;border-radius:6px;font-size:8.5px;margin-bottom:2px}.preview-link.active{background:#252035;color:#a99dff}.preview-main{padding:20px 22px;color:#e9ebef}.preview-heading{display:flex;justify-content:space-between;align-items:flex-end}.preview-heading small{font-size:7px;letter-spacing:1.5px;color:#777f8c}.preview-heading h3{margin:5px 0 0;font-size:16px;font-weight:650}.preview-heading>span{font-size:8px;color:#737b88}.preview-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:18px}.preview-cards>div,.preview-panel{background:#1c222d;border:1px solid #2c3442;border-radius:8px;padding:11px}.preview-cards small,.preview-panel small{display:block;color:#747d8b;font-size:7px}.preview-cards strong{display:block;font-size:19px;margin-top:7px}.preview-cards u{font-size:7px;text-decoration:none;color:#777f8c;font-weight:500}.preview-cards i,.preview-panel i{display:block;height:4px;background:#2d3542;border-radius:4px;margin-top:8px;overflow:hidden}.preview-cards i b,.preview-panel i b{display:block;height:100%;background:#8170ef;border-radius:4px}.preview-panels{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:9px}.preview-panel div{display:flex;justify-content:space-between;font-size:8px}.preview-panel strong{font-size:9px}.preview-panel .blue b{background:#55a6d7}.preview-tasks{margin-top:9px;background:#1c222d;border:1px solid #2c3442;border-radius:8px;padding:11px}.preview-task-title{display:flex;justify-content:space-between;font-size:8px;margin-bottom:7px}.preview-task-title span{color:#6f7784}.preview-task{font-size:8px;color:#a4abb6;padding:6px 0;display:flex;align-items:center;gap:7px}.preview-task span{width:13px;height:13px;border-radius:4px;background:#6d5ce7;color:#fff;display:grid;place-items:center;font-size:8px}.preview-task span.empty{background:transparent;border:1px solid #505867}.home-desk-line{height:9px;border-radius:50%;background:#d9d3ca;margin:0 6%}
    .home-features{max-width:1184px;margin:auto;padding:72px 28px 100px;border-top:1px solid #eeeae3}.home-section-head h2{font-size:34px;letter-spacing:-1.3px;margin:12px 0 35px}.home-feature-grid{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #e9e5de;border-bottom:1px solid #e9e5de}.home-feature-grid article{padding:30px 24px;border-right:1px solid #e9e5de}.home-feature-grid article:last-child{border-right:0}.home-feature-icon{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;margin-bottom:18px}.home-feature-icon.purple{background:#eeeafd;color:#6d5ce7}.home-feature-icon.green{background:#e6f2e8;color:#4b9360}.home-feature-icon.orange{background:#f7eadb;color:#c88336}.home-feature-icon.blue{background:#e5f0f7;color:#4b8db6}.home-feature-grid h3{font-size:17px;margin:0 0 8px}.home-feature-grid p{font-size:13px;line-height:1.65;color:#747982;margin:0}.home-how{background:#f4f1eb;padding:86px 28px 95px}.home-section-head.center{text-align:center}.home-steps{max-width:1000px;margin:45px auto 0;display:grid;grid-template-columns:repeat(3,1fr);gap:28px}.home-steps article{background:#fff;border:1px solid #e4dfd7;border-radius:12px;padding:27px;position:relative}.home-steps article>b{position:absolute;right:20px;top:18px;color:#d4cec4;font-size:12px}.home-steps article>div{width:40px;height:40px;border-radius:10px;background:#eeeafd;color:#6d5ce7;display:grid;place-items:center;margin-bottom:18px}.home-steps h3{font-size:16px;margin:0 0 8px}.home-steps p{font-size:13px;line-height:1.6;color:#747982;margin:0}.home-cta{max-width:1184px;margin:auto;padding:82px 28px;display:flex;align-items:center;justify-content:space-between;gap:30px}.home-cta h2{font-size:40px;line-height:1.15;letter-spacing:-1.5px;margin:12px 0}.home-cta p{color:#747982;margin:0;font-size:14px}.home-footer{max-width:1184px;margin:auto;padding:25px 28px 40px;border-top:1px solid #eeeae3;display:flex;align-items:center;justify-content:space-between;color:#92969e;font-size:12px}.home-footer .home-logo{font-size:16px}.home-footer .home-logo-mark{width:29px;height:29px;border-radius:8px;font-size:13px}.home-loading{min-height:100vh;display:grid;place-items:center;align-content:center;gap:9px;background:#fbfaf8;color:#20242d}.home-loading-logo{width:52px;height:52px;border-radius:14px;background:#6d5ce7;color:#fff;display:grid;place-items:center;font-size:24px;font-weight:800}.home-loading h2{margin:8px 0 0}.home-loading p{margin:0;color:#777d87;font-size:14px}
    .auth-page{min-height:100vh;display:grid;grid-template-columns:minmax(0,1fr) minmax(450px,.92fr);background:#f8fafc;color:#1d2430}.auth-story{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;padding:42px clamp(38px,7vw,110px);background:radial-gradient(circle at 78% 15%,rgba(132,114,255,.42),transparent 25%),linear-gradient(145deg,#171d2c,#252c42 57%,#1b2335);color:#f5f7fb}.auth-story:after{content:"";position:absolute;width:420px;height:420px;right:-170px;bottom:-185px;border:1px solid rgba(255,255,255,.11);border-radius:50%;box-shadow:0 0 0 45px rgba(255,255,255,.035),0 0 0 90px rgba(255,255,255,.02)}.auth-story-brand{position:relative;z-index:1;display:flex;align-items:center;gap:9px;font-weight:700;font-size:17px}.auth-story-brand span{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#8b7df5;color:#fff;font-weight:800}.auth-story-copy{position:relative;z-index:1;max-width:480px;margin:80px 0}.auth-eyebrow{margin:0 0 16px;color:#c4bcff;font-size:10px;font-weight:700;letter-spacing:2px}.auth-story-copy h2{margin:0;font-size:clamp(42px,4.4vw,66px);line-height:1.02;letter-spacing:-3px;font-weight:720}.auth-story-copy h2 em{font-style:normal;color:#bcb3ff}.auth-story-copy>p:last-child{max-width:390px;margin:24px 0 0;color:#c1c8d5;font-size:15px;line-height:1.7}.auth-story-note{position:relative;z-index:1;width:min(320px,100%);padding:18px 19px;border:1px solid rgba(255,255,255,.16);border-radius:14px;background:rgba(11,16,28,.25);backdrop-filter:blur(8px)}.auth-story-note span,.auth-story-note small{display:block;color:#adb7c8;font-size:10px}.auth-story-note strong{display:block;margin:7px 0 13px;font-size:15px}.auth-story-note i{display:block;height:5px;border-radius:9px;overflow:hidden;background:rgba(255,255,255,.16)}.auth-story-note i b{display:block;width:68%;height:100%;border-radius:inherit;background:#a99cff}.auth-story-note small{margin-top:10px}.auth-form-panel{position:relative;display:flex;align-items:center;justify-content:center;padding:70px 35px}.auth-back{position:absolute;top:32px;left:36px;border:0;background:transparent;color:#748094;font-size:12px}.auth-back:hover{color:#363e4d}.auth-card{width:min(100%,440px)}.auth-logo{display:grid;place-items:center;width:44px;height:44px;margin-bottom:28px;border-radius:13px;background:#edeaff;color:#6d5ce7;font-size:20px;font-weight:800}.auth-card h1{margin:0;color:#202633;font-size:30px;letter-spacing:-1.25px}.auth-subtitle{margin:12px 0 28px;color:#747d8e;font-size:13px;line-height:1.6}.auth-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:25px;padding:4px;border-radius:10px;background:#f0f2f6}.auth-tab{display:flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:7px;padding:10px;background:transparent;color:#788294;font-size:12px}.auth-tab.active{background:#fff;color:#5c4ed5;box-shadow:0 2px 8px rgba(37,45,59,.08);font-weight:650}.input-group{margin-bottom:17px}.input-group label{display:block;margin-bottom:8px;color:#434b58;font-size:11px;font-weight:650}.input-wrapper{display:flex;align-items:center;gap:10px;height:48px;padding:0 14px;border:1px solid #dfe3eb;border-radius:10px;background:#fff;color:#9aa4b5;transition:.18s}.input-wrapper:focus-within{border-color:#8172ed;box-shadow:0 0 0 4px rgba(109,92,231,.1)}.input-wrapper input{width:100%;border:0;outline:0;background:transparent;color:#28303d;font-size:13px}.input-wrapper input::placeholder{color:#b1b8c4}.input-group small{display:block;margin-top:6px;color:#8992a2;font-size:10px}.auth-submit{width:100%;height:49px;display:flex;align-items:center;justify-content:center;gap:9px;margin-top:23px;border:0;border-radius:10px;background:#6d5ce7;color:#fff;font-weight:700;font-size:13px;box-shadow:0 11px 20px rgba(109,92,231,.2)}.auth-submit:hover:not(:disabled){background:#5e50d1;transform:translateY(-1px)}.auth-submit:disabled{opacity:.65}.auth-bottom{margin-top:20px;text-align:center;color:#7b8494;font-size:11px}.auth-bottom button{margin-left:4px;border:0;background:transparent;color:#6355d7;font-weight:700;font-size:11px}.message{display:flex;align-items:flex-start;gap:8px;margin-top:16px;padding:11px;border-radius:9px;font-size:11px;line-height:1.45}.message.error{background:#fff1f1;color:#bd3b42}.message.success{background:#edf9f0;color:#238142}@media(max-width:820px){.auth-page{display:block}.auth-story{display:none}.auth-form-panel{min-height:100vh;padding:100px 24px 50px}.auth-back{top:28px;left:24px}}@media(max-width:430px){.auth-form-panel{padding-left:18px;padding-right:18px}.auth-back{left:18px}.auth-card h1{font-size:27px}}
    .auth-page .auth-story{background:radial-gradient(circle at 72% 19%,rgba(255,213,103,.95) 0 8%,rgba(255,213,103,.2) 19%,transparent 35%),radial-gradient(circle at 5% 88%,rgba(116,205,137,.34),transparent 31%),linear-gradient(145deg,#163238,#245047 58%,#183b35)}.auth-page .auth-story:before{content:"";position:absolute;width:580px;height:380px;left:-180px;top:43%;border-radius:50%;background:rgba(140,222,153,.08);transform:rotate(-17deg)}.auth-page .auth-story:after{width:480px;height:480px;right:-250px;bottom:-250px;border-color:rgba(255,255,255,.14);box-shadow:0 0 0 48px rgba(255,255,255,.04),0 0 0 96px rgba(255,255,255,.025)}.auth-page .auth-story-brand span{background:#f8c45e;color:#354739}.auth-page .auth-eyebrow{color:#f9d995}.auth-page .auth-story-copy h2 em{color:#f9d995}.auth-page .auth-story-copy>p:last-child{color:#d1e0d6}.auth-energy-orbit{position:absolute;z-index:1;right:clamp(35px,8vw,135px);top:43%;width:190px;height:190px;border:1px solid rgba(255,255,255,.22);border-radius:50%;transform:translateY(-50%)}.auth-energy-orbit:before,.auth-energy-orbit:after{content:"";position:absolute;border:1px solid rgba(255,255,255,.13);border-radius:50%}.auth-energy-orbit:before{inset:18px}.auth-energy-orbit:after{inset:42px}.auth-sun{position:absolute;top:50%;left:50%;width:72px;height:72px;border-radius:50%;background:#ffd66b;box-shadow:0 0 0 12px rgba(255,214,107,.12),0 0 40px rgba(255,214,107,.28);transform:translate(-50%,-50%)}.auth-leaf{position:absolute;width:35px;height:60px;background:#82d69a;border-radius:35px 0 35px 0;box-shadow:inset -5px -4px 0 rgba(15,72,50,.13)}.auth-leaf-one{left:-8px;bottom:25px;transform:rotate(-39deg)}.auth-leaf-two{right:2px;top:18px;transform:rotate(141deg);background:#b2e39a}.auth-energy-orbit b{position:absolute;right:-54px;bottom:22px;color:#f4f8ee;font-size:11px;line-height:1.3;letter-spacing:.3px}.auth-page .auth-story-note{border-color:rgba(222,244,221,.22);background:rgba(16,50,43,.34)}.auth-page .auth-story-note i b{width:74%;background:#f6c65e}.auth-page .auth-form-panel{background:linear-gradient(145deg,#fbfdf9,#f4f7f2)}.auth-page .auth-logo{background:#e4f1df;color:#3c8e61}.auth-page .auth-tab.active{color:#38845b}.auth-page .input-wrapper:focus-within{border-color:#59a776;box-shadow:0 0 0 4px rgba(84,162,108,.12)}.auth-page .auth-submit{background:#3f9562;box-shadow:0 11px 20px rgba(63,149,98,.2)}.auth-page .auth-submit:hover:not(:disabled){background:#327b4f}.auth-page .auth-bottom button{color:#358159}@media(max-width:1100px){.auth-energy-orbit{opacity:.65;right:30px}}@media(max-width:920px){.auth-energy-orbit{display:none}}
    .auth-life-rhythm{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 22px}.auth-life-rhythm>div{min-width:0;padding:12px 10px;border:1px solid rgba(226,245,222,.18);border-radius:12px;background:rgba(13,48,39,.3);backdrop-filter:blur(8px)}.auth-life-rhythm span{display:grid;place-items:center;width:28px;height:28px;margin-bottom:11px;border-radius:9px;background:rgba(255,214,107,.16);color:#f8d574}.auth-life-rhythm p{margin:0}.auth-life-rhythm strong,.auth-life-rhythm small{display:block}.auth-life-rhythm strong{color:#f3f8ef;font-size:10px}.auth-life-rhythm small{margin-top:4px;color:#b6cabe;font-size:8px;line-height:1.35}@media(max-width:1100px){.auth-life-rhythm{grid-template-columns:1fr}.auth-life-rhythm>div{display:flex;align-items:center;gap:9px;padding:8px 10px}.auth-life-rhythm span{flex:0 0 auto;margin:0}.auth-life-rhythm small{display:none}}@media(max-width:820px){.auth-life-rhythm{display:none}}
    .home-page{background:#f4faf7}.home-header{border-bottom:0}.home-logo{color:#356f67}.home-logo-mark{background:#74a88a}.home-nav button{color:#455650}.home-signup{background:#4b8f82}.home-hero-photo{position:relative;display:block;min-height:525px;margin:0 auto 25px;padding:0;border-radius:22px;background-position:center;background-size:cover;overflow:hidden}.hero-photo-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,32,25,.75) 0%,rgba(9,32,25,.43) 42%,rgba(9,32,25,.03) 72%)}.home-photo-copy{position:relative;z-index:1;max-width:560px;margin:0;padding:105px 0 0 clamp(36px,7vw,90px)}.home-hero-photo .home-kicker{color:#d3f1d4}.home-hero-photo .home-kicker:before{background:#a6dda9}.home-hero-photo h1{margin:18px 0;color:#fff;font-size:clamp(42px,4.8vw,65px);letter-spacing:-2.9px}.home-hero-photo h1 em{color:#fff}.home-hero-photo .home-lead{max-width:470px;color:#ecf3ee;font-size:16px}.home-hero-photo .home-primary{background:#4a9b92;box-shadow:0 10px 24px rgba(1,33,30,.26)}.home-hero-photo .home-primary:hover{background:#398279}.home-secondary-light{border-color:rgba(255,255,255,.55);background:rgba(255,255,255,.1);color:#fff;backdrop-filter:blur(6px)}.home-secondary-light:hover{border-color:#fff;background:rgba(255,255,255,.18)}.hero-float-card{position:absolute;z-index:2;display:flex;flex-direction:column;gap:5px;padding:11px 13px;border:1px solid rgba(231,255,247,.4);border-radius:12px;background:rgba(24,74,67,.53);color:#edfdf4;box-shadow:0 14px 28px rgba(9,39,31,.18);backdrop-filter:blur(10px);font-size:10px;animation:heroFloat 5s ease-in-out infinite}.hero-float-card svg{color:#bff2cf}.hero-float-card span{color:#d4ebe0}.hero-float-card strong{font-size:11px}.hero-float-goal{right:22%;top:37%;animation-delay:.8s}.hero-float-plan{right:44%;bottom:9%;animation-delay:1.5s}.hero-float-habit{right:5%;bottom:18%;animation-delay:2.2s}.mini-calendar{display:grid;grid-template-columns:repeat(4,9px);gap:3px;margin-top:2px}.mini-calendar i{height:9px;border-radius:2px;background:rgba(255,255,255,.3)}.mini-calendar i.done{background:#a3e7a8}@keyframes heroFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@media(max-width:900px){.home-hero-photo{min-height:510px;margin-left:18px;margin-right:18px;background-position:62% center}.home-photo-copy{padding-left:36px;padding-top:92px}.hero-float-goal{right:7%;top:48%}.hero-float-plan{right:31%;bottom:8%}.hero-float-habit{display:none}}@media(max-width:560px){.home-hero-photo{min-height:580px;margin:0;border-radius:0;background-position:63% center}.hero-photo-shade{background:linear-gradient(90deg,rgba(8,30,24,.78),rgba(8,30,24,.27))}.home-photo-copy{padding:75px 25px 0}.home-hero-photo h1{font-size:42px}.home-hero-photo .home-lead{font-size:14px}.hero-float-card{transform:scale(.9);transform-origin:right bottom}.hero-float-goal{right:1%;top:49%}.hero-float-plan{right:18%;bottom:9%}}
    .home-features{padding-top:86px;padding-bottom:86px;border-top:0}.home-section-head-life{max-width:680px}.home-section-head-life h2{margin-bottom:13px;font-size:42px;line-height:1.12}.home-section-head-life>p,.home-section-head.center>p{margin:0;color:#6f7e78;font-size:14px;line-height:1.65}.home-feature-grid{gap:14px;border:0}.home-feature-grid article{min-height:248px;padding:25px 23px;border:1px solid #e2ece5!important;border-radius:16px;background:#fbfdfb;transition:transform .2s,box-shadow .2s}.home-feature-grid article:hover{transform:translateY(-4px);box-shadow:0 16px 25px rgba(37,82,62,.08)}.home-feature-icon{margin-bottom:17px}.home-feature-icon.move{background:#e1f1e7;color:#38835c}.home-feature-icon.nature{background:#e8f2dc;color:#6d9952}.home-feature-icon.habit{background:#edf1dc;color:#849b36}.home-feature-icon.balance{background:#fff0d9;color:#c78a31}.feature-kicker{margin:0 0 8px!important;color:#73947c!important;font-size:9px!important;font-weight:750!important;letter-spacing:1.4px}.home-feature-grid h3{margin-bottom:10px}.home-feature-grid p:last-child{color:#687670;line-height:1.65}.home-how{position:relative;overflow:hidden;padding-top:84px;padding-bottom:88px;background:linear-gradient(140deg,#e9f3e9,#f5f2e9)}.home-how:before{content:"";position:absolute;width:430px;height:430px;top:-260px;right:-130px;border-radius:50%;background:rgba(127,183,121,.16)}.home-how .home-section-head{position:relative;z-index:1}.home-how .home-section-head h2{margin:12px 0}.home-steps{position:relative;z-index:1;gap:16px}.home-steps article{min-height:210px;border-color:#d9e2d8;background:rgba(255,255,255,.8);box-shadow:0 8px 18px rgba(60,95,71,.05)}.home-steps article>b{color:#b7c6b8}.home-steps article>div{background:#e4f1e4;color:#4d9666}.home-steps h3{margin-top:3px}.home-cta-life{position:relative;overflow:hidden;max-width:1184px;margin:76px auto 44px;padding:70px 64px;border-radius:20px;background:linear-gradient(124deg,#276a5c,#4f9278 58%,#82ad71);color:#fff}.home-cta-life:after{content:"";position:absolute;width:390px;height:390px;right:-110px;bottom:-240px;border:1px solid rgba(255,255,255,.25);border-radius:50%;box-shadow:0 0 0 44px rgba(255,255,255,.06),0 0 0 88px rgba(255,255,255,.035)}.home-cta-life>div,.home-cta-life>button{position:relative;z-index:1}.home-cta-life span{color:#d7f1d7}.home-cta-life h2{margin-top:12px;color:#fff}.home-cta-life h2 em{font-style:normal;color:#eaf6b5}.home-cta-life p{color:#e2f1e7}.home-cta-life .home-primary{background:#f4f9ee;color:#35705a;box-shadow:none}.home-cta-life .home-primary:hover{background:#fff}.home-footer{gap:18px;border-color:#dce7df}.home-footer>span:nth-child(2){margin-left:auto}@media(max-width:900px){.home-section-head-life h2{font-size:35px}.home-cta-life{margin:55px 18px 30px;padding:50px 35px}.home-footer>span:nth-child(2){display:none}}@media(max-width:560px){.home-features{padding:60px 18px}.home-section-head-life h2{font-size:30px}.home-feature-grid article{min-height:auto;padding:22px}.home-how{padding:62px 18px}.home-cta-life{margin:45px 18px 26px;padding:42px 25px}.home-cta-life h2{font-size:32px}.home-footer{flex-wrap:wrap}.home-footer>span:nth-child(2){display:block;order:3;width:100%;margin:0}}
    .home-page button{border:0;font-family:inherit}.home-header{height:92px;padding:0 38px}.home-logo{gap:11px;background:transparent}.home-logo-mark{display:block;width:39px!important;height:39px!important;border-radius:12px!important;background:transparent!important}.home-logo>span:last-child{font-size:21px;letter-spacing:-.7px;color:#276a5c}.home-nav{gap:6px;margin-left:auto;margin-right:24px;padding:5px;border:1px solid #dce8df;border-radius:12px;background:rgba(255,255,255,.55)}.home-nav button{padding:9px 13px;border-radius:8px;color:#506158;font-size:12px}.home-nav button:hover{background:#e8f2eb;color:#2b735f}.home-header-actions{gap:10px}.home-login{padding:11px 15px;border:1px solid #9ab9aa!important;border-radius:10px;background:#f8fcf8!important;color:#337663!important;font-size:12px}.home-login:hover{border-color:#4a997d!important;background:#eaf4ec!important}.home-signup{padding:12px 17px;border-radius:10px;background:linear-gradient(135deg,#2f8060,#4ca08d)!important;box-shadow:0 8px 17px rgba(47,128,96,.2);font-size:12px}.home-signup:hover{transform:translateY(-1px);box-shadow:0 11px 21px rgba(47,128,96,.26)}.home-primary{min-height:48px;padding:13px 19px;border-radius:12px!important;background:linear-gradient(135deg,#2f8060,#4ca08d)!important;box-shadow:0 9px 19px rgba(30,85,66,.25)!important;font-size:13px}.home-primary:hover{transform:translateY(-2px);box-shadow:0 13px 24px rgba(30,85,66,.3)!important}.home-primary svg{transition:transform .2s}.home-primary:hover svg{transform:translateX(3px)}.home-secondary{min-height:48px;padding:12px 18px;border-radius:12px!important;font-weight:600}.home-secondary-light{border:1px solid rgba(255,255,255,.5)!important}.home-cta-life .home-primary{border:1px solid rgba(255,255,255,.8)!important}.home-footer .home-logo-mark{width:31px!important;height:31px!important;border-radius:10px!important}.home-footer .home-logo>span:last-child{font-size:16px}@media(max-width:720px){.home-header{height:78px;padding:0 18px}.home-nav{display:none}.home-logo-mark{width:35px!important;height:35px!important}.home-header-actions{margin-left:auto}.home-login{display:none}.home-signup{padding:10px 13px;border-radius:9px}.home-logo>span:last-child{font-size:18px}}
    .home-section-head{max-width:760px}.home-section-head h2{letter-spacing:-1.4px;text-wrap:balance}.home-section-head-life h2{max-width:690px}.home-section-head.center{margin-left:auto;margin-right:auto}.home-section-head.center h2{max-width:620px;margin-left:auto;margin-right:auto}@media(max-width:560px){.home-section-head h2,.home-section-head-life h2{font-size:28px!important;line-height:1.18;letter-spacing:-.85px}.home-section-head>span{font-size:9px;letter-spacing:1.35px}.home-section-head-life>p,.home-section-head.center>p{font-size:13px}.home-how .home-section-head h2{max-width:330px}}
    .statistics-section{max-width:1160px;margin:0 auto;padding:42px 28px}.statistics-heading h2{margin:7px 0;font-size:30px;color:#f0f7ef;letter-spacing:-.8px}.statistics-heading p{margin:0;color:#a5c0ad;font-size:13px}.statistics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:28px 0}.statistic-card{position:relative;overflow:hidden;padding:18px;border:1px solid rgba(121,177,139,.3);border-radius:16px;background:linear-gradient(145deg,rgba(16,52,40,.92),rgba(8,30,23,.92));box-shadow:0 12px 28px rgba(1,18,12,.13);transition:transform .2s,border-color .2s,background .2s}.statistic-card::after{position:absolute;right:-20px;bottom:-39px;width:96px;height:96px;border:1px solid rgba(198,234,164,.12);border-radius:50%;box-shadow:0 0 0 20px rgba(198,234,164,.025);content:''}.statistic-card:hover{border-color:rgba(188,229,158,.5);background:linear-gradient(145deg,rgba(24,72,54,.96),rgba(9,37,27,.96));transform:translateY(-3px)}.statistic-card-icon{position:relative;z-index:1;color:#bee993;margin-bottom:15px}.statistic-card span,.statistic-card small{position:relative;z-index:1;display:block;color:#a4bca9;font-size:11px}.statistic-card strong{position:relative;z-index:1;display:block;margin:8px 0 5px;color:#f1f8ef;font-size:24px}.statistics-panels{display:grid;grid-template-columns:1.35fr 1fr;gap:16px}.statistics-panel{position:relative;overflow:hidden;padding:20px;border:1px solid rgba(121,177,139,.3);border-radius:16px;background:linear-gradient(145deg,rgba(14,48,37,.94),rgba(7,28,21,.95));box-shadow:0 16px 32px rgba(1,18,12,.15)}.statistics-panel-title{display:flex;align-items:flex-start;justify-content:space-between;color:#bde995}.statistics-panel-title h3{margin:0;color:#edf7ed;font-size:15px}.statistics-panel-title p{margin:5px 0 0;color:#9eb8a6;font-size:10px}.water-chart{height:205px;display:flex;align-items:end;justify-content:space-between;gap:10px;margin-top:18px;padding:10px 0 0;border-bottom:1px solid rgba(140,188,151,.2)}.water-chart-day{height:100%;display:flex;flex:1;min-width:0;flex-direction:column;justify-content:end;align-items:center;gap:8px;color:#a1b9a7;font-size:10px}.water-chart-column{height:165px;width:100%;display:flex;align-items:end;border-radius:8px 8px 0 0;background:rgba(98,151,117,.13)}.water-chart-fill{width:100%;min-height:0;border-radius:8px 8px 0 0;background:linear-gradient(180deg,#d7f29a,#6dbd79 58%,#3e9b78);box-shadow:0 0 18px rgba(185,237,147,.18);transition:height .25s}.daily-summary-row{display:flex;justify-content:space-between;gap:10px;padding:14px 0;border-bottom:1px solid rgba(140,188,151,.2);color:#aac1b0;font-size:11px}.daily-summary-row:last-child{border-bottom:0}.daily-summary-row strong{color:#edf7e8;font-weight:600}.section-small-title{color:#b9e995;font-size:10px;letter-spacing:1.5px;font-weight:700}
    @media(max-width:900px){.statistics-grid{grid-template-columns:repeat(2,1fr)}.statistics-panels{grid-template-columns:1fr}.home-header{padding:0 18px}.home-nav{display:none}.home-hero{grid-template-columns:1fr;padding:60px 22px 70px;gap:42px}.home-copy{padding-left:0}.home-copy h1{font-size:54px}.home-preview-wrap{max-width:720px;margin:auto}.home-feature-grid{grid-template-columns:1fr 1fr}.home-feature-grid article:nth-child(2){border-right:0}.home-feature-grid article:nth-child(-n+2){border-bottom:1px solid #e9e5de}.home-steps{grid-template-columns:1fr;max-width:520px}.home-cta{flex-direction:column;align-items:flex-start}}
    @media(max-width:560px){.home-header{height:68px}.home-header-actions .home-login{display:none}.home-signup{padding:10px 12px}.home-hero{padding:48px 18px 60px}.home-copy h1{font-size:45px;letter-spacing:-2px}.home-lead{font-size:15px}.home-actions{flex-direction:column;align-items:stretch}.home-preview{transform:none}.preview-body{grid-template-columns:92px 1fr}.preview-sidebar{padding:12px 7px}.preview-link{font-size:7px}.preview-main{padding:13px}.preview-cards strong{font-size:14px}.home-features{padding:55px 18px 70px}.home-section-head h2{font-size:27px}.home-feature-grid{grid-template-columns:1fr}.home-feature-grid article{border-right:0!important;border-bottom:1px solid #e9e5de}.home-how{padding:60px 18px 70px}.home-cta{padding:65px 18px}.home-cta h2{font-size:31px}.home-footer{padding:22px 18px 30px}}
    /* Landing page: final visual system */
    .home-page .home-features{background:#f7fbf8;padding:94px max(28px,calc((100vw - 1184px)/2)) 98px}.home-page .home-section-head-life{max-width:760px;margin-bottom:42px}.home-page .home-section-head-life h2{font-size:clamp(30px,3.6vw,48px);line-height:1.08;letter-spacing:-1.8px}.home-page .life-feature-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;border:0}.home-page .life-feature-grid article{position:relative;min-height:282px;padding:28px 25px 25px;border:0!important;border-radius:20px;background:#fff!important;box-shadow:0 10px 32px rgba(36,77,58,.08)}.home-page .life-feature-grid article:after{content:"";position:absolute;left:25px;right:25px;bottom:20px;height:3px;border-radius:9px;background:linear-gradient(90deg,#75b889,#e4f3e8)}.home-page .life-feature-grid article:nth-child(2){background:#f1f7ec!important}.home-page .life-feature-grid article:nth-child(3){background:#fbf6e9!important}.home-page .life-feature-grid article:nth-child(4){background:#edf6f3!important}.home-page .life-feature-grid h3{font-size:18px;letter-spacing:-.4px}.home-page .life-feature-grid p:last-child{font-size:13px}.home-page .life-how{padding:92px max(28px,calc((100vw - 1184px)/2)) 98px;background:linear-gradient(135deg,#e3f0e5,#f8f3e8)}.home-page .life-how .home-section-head{max-width:650px;margin:0 auto 42px;text-align:center}.home-page .life-how .home-section-head h2{font-size:clamp(30px,3.6vw,46px);line-height:1.1;letter-spacing:-1.6px}.home-page .life-steps{max-width:none;gap:18px}.home-page .life-steps article{min-height:236px;border:0;background:rgba(255,255,255,.87);border-radius:20px;box-shadow:0 12px 26px rgba(52,89,62,.07)}.home-page .life-steps article>b{top:22px;right:24px;color:#a9b9aa}.home-page .life-steps article>div{width:48px;height:48px;border-radius:14px}.home-page .life-steps h3{font-size:18px}.home-page .life-cta{display:flex;align-items:center;justify-content:space-between;gap:35px;min-height:315px;margin:80px auto 48px;padding:60px 68px;border-radius:28px;background:radial-gradient(circle at 86% 24%,rgba(215,241,151,.38),transparent 18%),linear-gradient(125deg,#1f6556,#3f8b70 60%,#76a86a)}.home-page .life-cta h2{font-size:clamp(32px,3.7vw,49px);line-height:1.08;letter-spacing:-1.7px}.home-page .life-cta p{max-width:540px;font-size:15px;line-height:1.7}.home-page .life-cta .home-primary{flex:0 0 auto;min-width:200px}.home-page .home-footer{padding-top:28px;padding-bottom:38px}@media(max-width:900px){.home-page .life-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.home-page .life-cta{padding:50px 42px}.home-page .life-cta .home-primary{width:auto}}@media(max-width:560px){.home-page .home-features,.home-page .life-how{padding:65px 20px}.home-page .home-section-head-life{margin-bottom:28px}.home-page .home-section-head-life h2,.home-page .life-how .home-section-head h2{font-size:29px!important;letter-spacing:-1px}.home-page .life-feature-grid{grid-template-columns:1fr;gap:12px}.home-page .life-feature-grid article{min-height:220px;padding:24px}.home-page .life-steps article{min-height:205px;padding:24px}.home-page .life-cta{display:block;min-height:auto;margin:48px 18px 32px;padding:42px 26px;border-radius:22px}.home-page .life-cta h2{font-size:31px!important}.home-page .life-cta .home-primary{width:100%;margin-top:24px}.home-page .home-footer{padding-left:20px;padding-right:20px}}
    /* Keep section content at a readable desktop width. */
    .home-page .home-features{max-width:none;padding:94px max(28px,calc((100vw - 1184px)/2)) 98px}.home-page .life-feature-grid{max-width:1184px;margin:0 auto}.home-page .home-section-head-life{margin-left:0}.home-page .life-how{max-width:none;padding-left:max(28px,calc((100vw - 1184px)/2));padding-right:max(28px,calc((100vw - 1184px)/2))}.home-page .life-steps{max-width:1184px;margin-left:auto;margin-right:auto}.home-page .life-cta{width:min(calc(100% - 56px),1184px)}@media(max-width:560px){.home-page .home-features{padding:65px 20px}.home-page .life-how{padding-left:20px;padding-right:20px}.home-page .life-cta{width:auto}}
    .home-page .home-header{position:relative;z-index:5;width:min(calc(100% - 56px),1184px);height:70px;margin:14px auto 0;padding:0 17px;border:1px solid rgba(171,201,181,.55);border-radius:18px;background:rgba(250,254,250,.82);box-shadow:0 11px 28px rgba(44,90,66,.08);backdrop-filter:blur(14px)}.home-page .home-logo{padding:0 3px}.home-page .home-nav{gap:3px;margin-right:17px;border-color:rgba(180,208,188,.65);background:rgba(235,246,237,.72)}.home-page .home-nav button{border:0!important;background:transparent!important;color:#426257!important;font-size:11px;font-weight:700;letter-spacing:.05px}.home-page .home-nav button:hover{background:#dceee0!important;color:#1d6048!important}.home-page .home-header-actions{gap:8px}.home-page .home-login{border-color:#9fc3aa!important;background:transparent!important;color:#28694f!important;font-weight:700}.home-page .home-hero-photo{min-height:548px;margin-top:16px;border:1px solid rgba(47,93,70,.2);box-shadow:0 24px 52px rgba(34,77,56,.16)}.home-page .home-hero-photo::before{position:absolute;z-index:1;top:-86px;right:19%;width:175px;height:175px;border-radius:50%;background:radial-gradient(circle,rgba(255,239,153,.42),rgba(255,239,153,.1) 38%,transparent 70%);box-shadow:0 0 70px rgba(255,235,143,.16);content:'';animation:home-sun-drift 8s ease-in-out infinite}.home-page .hero-photo-shade{z-index:0}.home-page .home-photo-copy{z-index:2;padding-top:83px}.home-page .hero-float-card{z-index:3}.home-page .home-photo-copy>*{animation:home-copy-enter .62s cubic-bezier(.2,.72,.28,1) both}.home-page .home-photo-copy .home-kicker{animation-delay:.04s}.home-page .home-photo-copy h1{animation-delay:.1s}.home-page .home-photo-copy .home-lead{animation-delay:.17s}.home-page .home-photo-copy .home-actions{animation-delay:.24s}.home-page .home-photo-copy .home-rhythm-strip{animation-delay:.31s}.home-page .home-section-head>span,.home-page .home-cta span{color:#438360}.home-rhythm-strip{display:flex;align-items:center;gap:9px;margin-top:19px;color:#e9f5e9;font-size:10px;font-weight:650}.home-rhythm-strip span{display:inline-flex;align-items:center;gap:6px;padding:7px 9px;border:1px solid rgba(229,250,231,.22);border-radius:999px;background:rgba(8,48,37,.3);backdrop-filter:blur(6px)}.rhythm-dot{display:block;width:7px;height:7px;border-radius:50%;box-shadow:0 0 0 4px rgba(255,255,255,.08);animation:rhythm-dot-pulse 2.8s ease-in-out infinite}.rhythm-move{background:#bce992}.rhythm-focus{background:#91d8e8;animation-delay:-.8s}.rhythm-rest{background:#f5ce75;animation-delay:-1.6s}@keyframes home-copy-enter{from{opacity:0;transform:translate3d(0,13px,0)}to{opacity:1;transform:translate3d(0,0,0)}}@keyframes home-sun-drift{0%,100%{transform:translate3d(0,0,0) scale(.96);opacity:.72}50%{transform:translate3d(10px,13px,0) scale(1.08);opacity:1}}@keyframes rhythm-dot-pulse{0%,100%{box-shadow:0 0 0 3px rgba(255,255,255,.08);transform:scale(.9)}50%{box-shadow:0 0 0 7px rgba(209,246,184,.11);transform:scale(1.12)}}.home-page .home-features{padding-top:66px}.home-page .home-section-head-life{margin-bottom:34px}@media(max-width:900px){.home-page .home-header{width:calc(100% - 36px);margin-top:10px}.home-page .home-hero-photo{margin-top:12px}.home-rhythm-strip{gap:6px}}@media(max-width:560px){.home-page .home-header{width:100%;height:68px;margin:0;border:0;border-bottom:1px solid rgba(171,201,181,.45);border-radius:0;box-shadow:none}.home-page .home-hero-photo{min-height:620px;margin-top:0;border:0}.home-page .home-photo-copy{padding-top:66px}.home-rhythm-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.home-rhythm-strip span{justify-content:center;padding:7px 4px;font-size:8px}.home-page .home-features{padding-top:55px}}
    .home-page .home-section-head > span { color: #438360 !important; }
    .home-page .hero-living-layer{position:absolute;z-index:1;inset:0;overflow:hidden;pointer-events:none}.home-page .hero-sun-ring{position:absolute;top:37px;right:108px;width:108px;height:108px;border:1px solid rgba(250,242,173,.46);border-radius:50%;box-shadow:0 0 0 18px rgba(250,242,173,.08),0 0 0 42px rgba(250,242,173,.035),0 0 42px rgba(255,238,149,.24);animation:hero-sun-breathe 5.5s ease-in-out infinite}.home-page .hero-drift-leaf{position:absolute;display:block;width:25px;height:45px;border:1px solid rgba(244,255,218,.32);border-radius:100% 0 100% 0;background:linear-gradient(135deg,rgba(228,247,157,.82),rgba(95,184,115,.52));box-shadow:inset -5px -5px 0 rgba(18,89,52,.11),0 7px 16px rgba(2,32,21,.12);animation:hero-wind-leaf 8s ease-in-out infinite}.home-page .hero-drift-leaf-one{--leaf-rotation:-33deg;top:50px;right:67px;animation-delay:-1.5s}.home-page .hero-drift-leaf-two{--leaf-rotation:138deg;right:18px;bottom:78px;width:21px;height:38px;background:linear-gradient(135deg,rgba(255,225,137,.82),rgba(148,200,111,.5));animation-delay:-4.5s}.home-page .hero-drift-leaf-three{--leaf-rotation:27deg;right:283px;bottom:70px;width:18px;height:33px;background:linear-gradient(135deg,rgba(178,238,175,.75),rgba(70,159,110,.45));animation-delay:-6.5s}.home-page .hero-light-speck{position:absolute;display:block;width:6px;height:6px;border-radius:50%;background:#f7f5bd;box-shadow:0 0 15px rgba(255,247,184,.85);animation:hero-speck-drift 6s ease-in-out infinite}.home-page .hero-light-speck-one{top:115px;right:229px;animation-delay:-1s}.home-page .hero-light-speck-two{top:197px;right:57px;width:4px;height:4px;animation-delay:-3.5s}.home-page .hero-light-speck-three{right:177px;bottom:104px;width:3px;height:3px;animation-delay:-5.2s}@keyframes hero-sun-breathe{0%,100%{opacity:.42;transform:scale(.94)}50%{opacity:.96;transform:scale(1.06)}}@keyframes hero-wind-leaf{0%,100%{transform:translate3d(0,0,0) rotate(var(--leaf-rotation));opacity:.48}50%{transform:translate3d(-12px,-17px,0) rotate(calc(var(--leaf-rotation) + 12deg));opacity:.94}}@keyframes hero-speck-drift{0%,100%{opacity:.15;transform:translate3d(0,8px,0) scale(.7)}50%{opacity:.9;transform:translate3d(7px,-24px,0) scale(1.2)}}@media(max-width:560px){.home-page .hero-sun-ring{right:44px;top:180px;width:76px;height:76px}.home-page .hero-drift-leaf-one{right:23px;top:215px}.home-page .hero-drift-leaf-two{right:11px;bottom:106px}.home-page .hero-drift-leaf-three{right:144px;bottom:74px}.home-page .hero-light-speck-one{right:126px;top:267px}.home-page .hero-light-speck-two{right:32px;top:332px}.home-page .hero-light-speck-three{right:103px;bottom:109px}}
    .home-page .hero-float-card{will-change:transform;animation-duration:6.8s}.home-page .hero-float-goal{animation-name:hero-goal-drift}.home-page .hero-float-plan{animation-name:hero-plan-drift;animation-duration:7.6s}.home-page .hero-float-habit{animation-name:hero-habit-drift;animation-duration:7.2s}@keyframes hero-goal-drift{0%,100%{transform:translate3d(0,0,0) rotate(-.3deg)}25%{transform:translate3d(5px,-4px,0) rotate(.5deg)}50%{transform:translate3d(8px,-9px,0) rotate(1deg)}75%{transform:translate3d(-4px,-5px,0) rotate(-.4deg)}}@keyframes hero-plan-drift{0%,100%{transform:translate3d(0,0,0) rotate(.35deg)}25%{transform:translate3d(-5px,-5px,0) rotate(-.35deg)}50%{transform:translate3d(-9px,-8px,0) rotate(-.8deg)}75%{transform:translate3d(4px,-3px,0) rotate(.25deg)}}@keyframes hero-habit-drift{0%,100%{transform:translate3d(0,0,0) rotate(-.25deg)}25%{transform:translate3d(5px,-3px,0) rotate(.35deg)}50%{transform:translate3d(7px,-8px,0) rotate(.75deg)}75%{transform:translate3d(-4px,-5px,0) rotate(-.35deg)}}
    .home-page .hero-float-goal{animation:hero-goal-drift 5.8s ease-in-out .2s infinite!important}.home-page .hero-float-plan{animation:hero-plan-drift 6.6s ease-in-out .7s infinite!important}.home-page .hero-float-habit{animation:hero-habit-drift 6.2s ease-in-out 1.1s infinite!important}@keyframes hero-goal-drift{0%,100%{transform:translate3d(0,0,0) rotate(-.5deg)}22%{transform:translate3d(9px,-6px,0) rotate(.7deg)}53%{transform:translate3d(13px,-13px,0) rotate(1.2deg)}78%{transform:translate3d(-7px,-5px,0) rotate(-.6deg)}}@keyframes hero-plan-drift{0%,100%{transform:translate3d(0,0,0) rotate(.5deg)}24%{transform:translate3d(-8px,-7px,0) rotate(-.6deg)}55%{transform:translate3d(-13px,-12px,0) rotate(-1deg)}79%{transform:translate3d(7px,-4px,0) rotate(.5deg)}}@keyframes hero-habit-drift{0%,100%{transform:translate3d(0,0,0) rotate(-.4deg)}25%{transform:translate3d(8px,-5px,0) rotate(.5deg)}52%{transform:translate3d(12px,-12px,0) rotate(1deg)}77%{transform:translate3d(-7px,-6px,0) rotate(-.5deg)}}
    .home-page .home-loading-logo{overflow:hidden;padding:0;background:transparent!important}.home-page .home-loading-logo img{display:block;width:100%;height:100%;object-fit:contain}@media(max-width:560px){.home-page .hero-float-plan{display:none}}
    .dashboard-mobile-menu-toggle{display:none}@media(max-width:720px){.dashboard-page .dashboard-nav{position:sticky;z-index:80;top:0;display:flex;width:100%;min-height:68px;flex-wrap:wrap;align-items:center;gap:9px;padding:10px 16px;border:0;border-bottom:1px solid rgba(128,178,143,.2);background:rgba(6,29,21,.97);box-shadow:0 8px 22px rgba(1,14,10,.12);backdrop-filter:blur(16px)}.dashboard-page .brand{order:1;margin:0}.dashboard-page .brand-logo{width:35px;height:35px}.dashboard-page .brand span{font-size:17px}.dashboard-page .dashboard-user{order:2;display:flex;width:auto;margin:0 0 0 auto;padding:0;border:0}.dashboard-page .dashboard-user>span,.dashboard-page .dashboard-logout{display:none}.dashboard-page .dashboard-user-avatar{width:31px;height:31px;border-radius:10px}.dashboard-page .dashboard-mobile-menu-toggle{order:3;display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(177,224,159,.3);border-radius:10px;background:#1b4a39;color:#d5f0aa}.dashboard-page .dashboard-menu{display:none;order:4;width:100%;max-height:none;flex:0 0 auto;margin:1px 0 0;padding:8px;border:1px solid rgba(128,178,143,.18);border-radius:14px;background:rgba(12,50,37,.94);overflow:visible}.dashboard-page .dashboard-nav.mobile-open .dashboard-menu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}.dashboard-page .dashboard-menu-item{width:100%;min-width:0;padding:10px 9px;border-radius:9px;font-size:10px}.dashboard-page .dashboard-menu-item svg{flex:0 0 auto}.dashboard-page .dashboard-content{min-height:calc(100vh - 68px)}.dashboard-page .dashboard-nav.mobile-open+.dashboard-background{top:68px}.dashboard-page .dashboard-nav.mobile-open~.dashboard-content{min-height:calc(100vh - 68px)}}
    @media(max-width:720px){.dashboard-page .dashboard-nav.mobile-open .dashboard-menu{grid-template-columns:1fr}.dashboard-page .dashboard-menu-item{padding:11px 12px;font-size:11px}}
    @media(max-width:720px){
      .dashboard-page .dashboard-user{
        gap:7px;
        align-items:center;
      }
      .dashboard-page .dashboard-logout{
        display:grid!important;
        place-items:center;
        grid-column:auto;
        width:32px;
        height:32px;
        min-height:0;
        margin:0;
        padding:0;
        border:1px solid rgba(244,174,157,.38);
        border-radius:10px;
        background:rgba(121,54,45,.28);
        color:#ffd6ca;
        font-size:0;
      }
      .dashboard-page .dashboard-logout svg{width:16px;height:16px}
      .dashboard-page .dashboard-logout:hover{background:rgba(154,65,53,.45)}
    }
    @media(max-width:560px){
      .home-page .home-header{
        height:64px;
        padding:0 16px;
      }
      .home-page .home-logo{gap:8px}
      .home-page .home-logo-mark{width:32px!important;height:32px!important}
      .home-page .home-logo>span:last-child{font-size:17px}
      .home-page .home-signup{padding:10px 12px;font-size:11px}
      .home-page .home-hero-photo{
        min-height:590px;
        background-position:60% center;
      }
      .home-page .hero-photo-shade{
        background:linear-gradient(90deg,rgba(5,28,22,.9) 0%,rgba(6,31,24,.72) 58%,rgba(6,31,24,.15) 100%),linear-gradient(0deg,rgba(5,27,21,.34),transparent 45%);
      }
      .home-page .home-photo-copy{
        max-width:none;
        padding:58px 20px 0;
      }
      .home-page .home-kicker{font-size:9px;letter-spacing:1.5px}
      .home-page .home-hero-photo h1{
        max-width:270px;
        margin:14px 0;
        font-size:36px;
        line-height:1.06;
        letter-spacing:-1.7px;
      }
      .home-page .home-hero-photo .home-lead{
        max-width:276px;
        font-size:13px;
        line-height:1.65;
      }
      .home-page .home-actions{gap:10px;margin-top:25px}
      .home-page .home-primary,.home-page .home-secondary{min-height:45px}
      .home-page .home-rhythm-strip{margin-top:17px}
      .home-page .hero-float-card{display:none}
      .home-page .hero-sun-ring{top:164px;right:28px;opacity:.72}
      .home-page .hero-drift-leaf-one{top:226px;right:15px}
      .home-page .hero-drift-leaf-two{bottom:62px;right:14px}
      .home-page .hero-drift-leaf-three{bottom:68px;right:122px}
    }
    @media(max-width:560px){
      .home-page .home-header-actions{gap:6px}
      .home-page .home-login{
        display:inline-flex!important;
        align-items:center;
        justify-content:center;
        min-height:36px;
        padding:0 10px;
        border-radius:9px;
        font-size:10px;
        white-space:nowrap;
      }
      .home-page .home-signup{
        min-height:36px;
        padding:0 10px;
        font-size:10px;
        white-space:nowrap;
      }
    }
    .auth-forgot{display:block;margin:9px 0 0 auto;border:0;background:transparent;color:#458b68;font-size:10px;font-weight:750}.auth-forgot:hover:not(:disabled){color:#286a4c;text-decoration:underline}.auth-forgot:disabled{opacity:.55;cursor:wait}.auth-recovery-card{max-width:420px}.auth-reset-help{margin:20px 0 0;color:#82978b;font-size:10px;line-height:1.5;text-align:center}
  `}</style>)
}

export default App
