import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req) {
  const authClient = createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data: profile } = await service.from('profiles').select('is_organiser').eq('id', user.id).single()
  if (!profile?.is_organiser) return Response.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file')
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop().toLowerCase()
  const allowed = ['jpg', 'jpeg', 'png', 'webp']
  if (!allowed.includes(ext)) return Response.json({ error: 'Only jpg, png, webp allowed' }, { status: 400 })

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await service.storage
    .from('announcement-posters')
    .upload(fileName, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = service.storage
    .from('announcement-posters')
    .getPublicUrl(fileName)

  return Response.json({ url: publicUrl })
}
