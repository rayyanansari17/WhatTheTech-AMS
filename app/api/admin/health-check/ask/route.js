import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getGroqClient } from '@/lib/groq-client'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function requireOrganiser() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const service = getServiceClient()
  const { data: profile } = await service.from('profiles').select('is_organiser').eq('id', user.id).single()
  return profile?.is_organiser ? user : null
}

export async function POST(req) {
  const user = await requireOrganiser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { question, checks } = await req.json()
  if (!question?.trim()) return Response.json({ error: 'Question is required' }, { status: 400 })
  if (!checks) return Response.json({ error: 'Health check data is required' }, { status: 400 })

  const groq = getGroqClient()

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You are a site reliability assistant for the Founders Fest hackathon management system. Answer questions ONLY based on the health check JSON data provided below. Be concise and actionable. If a service shows an error, suggest likely causes. If the data doesn't contain enough information to answer the question, say so clearly.

Health check data:
${JSON.stringify(checks, null, 2)}`,
      },
      { role: 'user', content: question },
    ],
    max_tokens: 500,
  })

  const answer = completion.choices[0]?.message?.content || 'No response from model.'
  return Response.json({ answer })
}
