import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getGroqClient } from '@/lib/groq-client'

const FALLBACK_NAMES = [
  { name: 'Null Pointer Exception', vibe: 'Punny' },
  { name: 'The Merge Conflicts',    vibe: 'Funny' },
  { name: '404 Sleep Not Found',    vibe: 'Funny' },
  { name: 'Ctrl Alt Elite',         vibe: 'Powerful' },
  { name: 'Stack Overflow Bros',    vibe: 'Punny' },
  { name: 'Binary Bandits',         vibe: 'Creative' },
]

export async function GET() {
  // Auth check
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ success: true, source: 'fallback', names: FALLBACK_NAMES })
  }

  try {
    const groq = getGroqClient()
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0.9,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: `Generate 6 unique and creative hackathon team names for "Founders Fest"  -  a tech & startup hackathon at Gachibowli Indoor Stadium, Hyderabad, India.

Mix these styles:
- Clever tech puns (e.g. "Null Pointer Exception")
- Pop culture + tech mashups (e.g. "The Merge Conflicts")
- Powerful/motivational names (e.g. "Binary Bandits")
- Funny/quirky names (e.g. "404 Sleep Not Found")
- Startup/founder culture references (fits the "Founders Fest" theme)
- Indian dev culture references

Rules:
- Max 3-4 words each
- No offensive content
- Must sound cool when said out loud
- Mix of serious and funny

Return ONLY a JSON object in this exact format:
{
  "names": [
    { "name": "Team Name Here", "vibe": "one of: Funny / Powerful / Punny / Creative" }
  ]
}`,
      }],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Empty response')

    const { names } = JSON.parse(content)
    if (!Array.isArray(names) || names.length === 0) throw new Error('Invalid names array')

    return NextResponse.json({ success: true, source: 'groq', names: names.slice(0, 6) })
  } catch (err) {
    console.error('[suggest-names] Groq error:', err.message)
    return NextResponse.json({ success: true, source: 'fallback', names: FALLBACK_NAMES })
  }
}
