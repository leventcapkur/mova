import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

const getRequiredEnv = (key: string) => {
  const value = Deno.env.get(key)
  if (!value) throw new Error(`${key} is not configured`)
  return value
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const url = getRequiredEnv('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || getRequiredEnv('SUPABASE_PUBLISHABLE_KEY')
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    const authorization = request.headers.get('Authorization')
    if (!authorization) return json({ error: 'Oturum doğrulaması gerekli.' }, 401)

    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user) return json({ error: 'Geçersiz oturum.' }, 401)

    const requester = authData.user
    const service = createClient(url, serviceRoleKey)
    const { data: requesterAdmin, error: adminError } = await service
      .from('lifeos_admins')
      .select('user_id')
      .eq('user_id', requester.id)
      .maybeSingle()
    if (adminError || !requesterAdmin) return json({ error: 'Bu işlem için yönetici yetkisi gerekli.' }, 403)

    const { action, targetUserId, payload = {} } = await request.json()

    if (action === 'list') {
      const [{ data: usersData, error: usersError }, { data: profilesData, error: profilesError }, { data: adminsData, error: adminsError }] = await Promise.all([
        service.auth.admin.listUsers({ page: 1, perPage: 100 }),
        service.from('profiles').select('id, full_name, email'),
        service.from('lifeos_admins').select('user_id'),
      ])
      if (usersError || profilesError || adminsError) throw usersError || profilesError || adminsError

      const profiles = new Map((profilesData || []).map((profile) => [profile.id, profile]))
      const adminIds = new Set((adminsData || []).map((admin) => admin.user_id))
      const users = (usersData.users || []).map((account) => {
        const profile = profiles.get(account.id)
        return {
          id: account.id,
          fullName: profile?.full_name || account.user_metadata?.full_name || '',
          email: profile?.email || account.email || '',
          createdAt: account.created_at,
          lastSignInAt: account.last_sign_in_at,
          emailConfirmedAt: account.email_confirmed_at,
          isAdmin: adminIds.has(account.id),
          isSuspended: Boolean(account.banned_until && new Date(account.banned_until) > new Date()),
        }
      })
      return json({ users })
    }

    if (!targetUserId || typeof targetUserId !== 'string') return json({ error: 'Kullanıcı seçilmedi.' }, 400)
    const { data: targetData, error: targetError } = await service.auth.admin.getUserById(targetUserId)
    if (targetError || !targetData.user) return json({ error: 'Kullanıcı bulunamadı.' }, 404)
    const target = targetData.user

    if (action === 'update_profile') {
      const fullName = String(payload.fullName || '').trim()
      const email = String(payload.email || '').trim().toLowerCase()
      if (!fullName || !email || !email.includes('@')) return json({ error: 'Geçerli ad ve e-posta bilgisi gir.' }, 400)

      const { error: updateError } = await service.auth.admin.updateUserById(targetUserId, {
        email,
        user_metadata: { ...target.user_metadata, full_name: fullName },
      })
      if (updateError) throw updateError
      const { error: profileError } = await service.from('profiles').upsert({ id: targetUserId, full_name: fullName, email }, { onConflict: 'id' })
      if (profileError) throw profileError
      return json({ message: 'Kullanıcı bilgileri güncellendi.' })
    }

    if (action === 'send_password_reset') {
      if (!target.email) return json({ error: 'Bu kullanıcı için e-posta adresi bulunamadı.' }, 400)
      const { error: resetError } = await service.auth.resetPasswordForEmail(target.email)
      if (resetError) throw resetError
      return json({ message: 'Şifre sıfırlama bağlantısı kullanıcının e-posta adresine gönderildi.' })
    }

    if (action === 'set_admin') {
      const shouldBeAdmin = Boolean(payload.isAdmin)
      const { data: admins, error: adminsError } = await service.from('lifeos_admins').select('user_id')
      if (adminsError) throw adminsError
      if (!shouldBeAdmin && admins?.some((admin) => admin.user_id === targetUserId) && admins.length <= 1) {
        return json({ error: 'Son yöneticinin yetkisi kaldırılamaz.' }, 400)
      }
      const { error: roleError } = shouldBeAdmin
        ? await service.from('lifeos_admins').upsert({ user_id: targetUserId }, { onConflict: 'user_id' })
        : await service.from('lifeos_admins').delete().eq('user_id', targetUserId)
      if (roleError) throw roleError
      return json({ message: shouldBeAdmin ? 'Yönetici yetkisi verildi.' : 'Yönetici yetkisi kaldırıldı.' })
    }

    if (action === 'set_suspension') {
      const { error: suspensionError } = await service.auth.admin.updateUserById(targetUserId, {
        ban_duration: payload.suspended ? '876000h' : 'none',
      })
      if (suspensionError) throw suspensionError
      return json({ message: payload.suspended ? 'Kullanıcının erişimi kapatıldı.' : 'Kullanıcının erişimi yeniden açıldı.' })
    }

    return json({ error: 'Bilinmeyen yönetim işlemi.' }, 400)
  } catch (error) {
    console.error('admin-user-manager error:', error)
    return json({ error: error instanceof Error ? error.message : 'Yönetim işlemi tamamlanamadı.' }, 500)
  }
})
