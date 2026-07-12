import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function requireSuperAdmin() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_organiser, is_super_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_super_admin) return null
  return { user, profile }
}
