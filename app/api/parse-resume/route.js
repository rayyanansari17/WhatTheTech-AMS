import { NextResponse } from 'next/server'
import { parseResumeText } from '@/lib/resume-parser'
import { getGroqClient } from '@/lib/groq-client'

export const runtime = 'nodejs'

const MARKITDOWN_URL = (process.env.MARKITDOWN_SERVICE_URL || '').replace(/\/$/, '')

// ── Step 1: extract raw text via MarkItDown service ───────────────────────────
async function extractText(file) {
  if (!MARKITDOWN_URL) throw new Error('MARKITDOWN_SERVICE_URL is not configured')
  const fd = new FormData()
  fd.append('file', file, file.name || 'resume')
  const res = await fetch(`${MARKITDOWN_URL}/convert`, {
    method: 'POST',
    body: fd,
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `MarkItDown service returned ${res.status}`)
  }
  const { text } = await res.json()
  return text || ''
}

// ── Step 2a: parse with Groq  -  outputs form-ready values directly ─────────────
async function parseWithGroq(text) {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')

  const groq = getGroqClient()
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    temperature: 0.1,
    max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `You are a resume parser for an Indian student hackathon registration system.

Extract information from the resume text below and return ONLY valid JSON. Use null for fields you cannot find.

Required JSON format:
{
  "full_name": "full name or null",
  "email": "email or null",
  "phone": "10 digit Indian mobile number, digits only, no country code  -  or null",
  "institution": "full college/university name or null",
  "degree_type": "MUST be exactly one of: bachelors, masters, phd, diploma  -  or null",
  "field_of_study": "MUST be exactly one of the values listed below  -  or null",
  "year_of_graduation": "4-digit year string like 2026 or null",
  "github": "full URL like https://github.com/username or null",
  "linkedin": "full URL like https://linkedin.com/in/username or null",
  "skills": ["up to 6 tech skills as strings"],
  "bio": "the summary/profile/objective paragraph from the resume, 1-3 sentences, or null"
}

degree_type rules:
- "bachelors" for B.Tech, B.E., BTech, B.Sc, BCA, BBA, B.Com, LLB, MBBS, B.Arch, B.Des
- "masters" for M.Tech, M.E., MBA, MCA, M.Sc, M.Com, LLM
- "phd" for Ph.D, Doctorate
- "diploma" for Diploma programs

field_of_study  -  copy one EXACTLY from this list:
Computer Science and Engineering, Information Technology, Electronics and Communication Engineering, Electrical Engineering, Mechanical Engineering, Civil Engineering, Chemical Engineering, Aerospace Engineering, Biotechnology, Bioinformatics, Data Science, Artificial Intelligence and Machine Learning, Cybersecurity, Software Engineering, Physics, Mathematics, Statistics, Chemistry, Biology, Commerce / Business Administration, Economics, Finance, Marketing, Management, Law, Medicine / MBBS, Pharmacy, Architecture, Design, Media and Communication, Psychology

Resume text:
${text.slice(0, 3000)}`,
    }],
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('Empty Groq response')

  const parsed = JSON.parse(content)

  // Normalize phone  -  strip non-digits, take last 10
  if (parsed.phone) {
    const digits = String(parsed.phone).replace(/\D/g, '')
    parsed.phone = digits.slice(-10) || null
  }

  // Ensure GitHub/LinkedIn are full URLs
  if (parsed.github && !parsed.github.startsWith('http')) {
    parsed.github = `https://${parsed.github}`
  }
  if (parsed.linkedin && !parsed.linkedin.startsWith('http')) {
    parsed.linkedin = `https://${parsed.linkedin}`
  }

  // Cap skills at 6
  if (Array.isArray(parsed.skills)) {
    parsed.skills = parsed.skills.slice(0, 6)
  }

  return parsed
}

// ── Infer year_of_study from a graduation year string ─────────────────────────
function inferYearOfStudy(gradYear) {
  if (!gradYear) return null
  const currentYear = new Date().getFullYear()
  const gYear = parseInt(gradYear)
  const yearsLeft = gYear - currentYear
  if (gYear < currentYear)  return 'alumni'
  if (yearsLeft === 0)      return '4'
  if (yearsLeft === 1)      return '3'
  if (yearsLeft === 2)      return '2'
  return '1'
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('resume')
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Step 1  -  extract raw text via MarkItDown (handles PDF, DOCX, DOC, TXT)
    let text
    try {
      text = await extractText(file)
    } catch (err) {
      console.error('[parse-resume] MarkItDown error:', err.message)
      return NextResponse.json(
        { error: 'Could not read your document. Make sure it is a PDF, DOCX, DOC, or TXT file.' },
        { status: 422 }
      )
    }

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'No text could be extracted from the document.' },
        { status: 422 }
      )
    }

    // Step 2  -  always run regex parser (fast, no network, handles inferred fields)
    const regexResult = parseResumeText(text)

    // Step 3  -  try Groq with 8s timeout; merge on success, pure regex on failure
    try {
      const groqResult = await Promise.race([
        parseWithGroq(text),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Groq timeout')), 8000)),
      ])

      // Merge: Groq wins on extracted text fields; regex wins on inferred fields
      const merged = {
        full_name:          groqResult.full_name        || regexResult.full_name,
        email:              groqResult.email            || regexResult.email,
        phone:              groqResult.phone            || regexResult.phone,
        institution:        groqResult.institution      || regexResult.institution,
        degree_type:        groqResult.degree_type      || regexResult.degree_type,
        field_of_study:     groqResult.field_of_study   || regexResult.field_of_study,
        year_of_graduation: groqResult.year_of_graduation || regexResult.year_of_graduation,
        github:             groqResult.github           || regexResult.github,
        linkedin:           groqResult.linkedin         || regexResult.linkedin,
        bio:                groqResult.bio              || regexResult.bio,
        skills:             groqResult.skills?.length > 0 ? groqResult.skills : regexResult.skills,
        // Inferred from the final grad year (re-infer if Groq gave a different year)
        year_of_study:      inferYearOfStudy(groqResult.year_of_graduation || regexResult.year_of_graduation),
        // Role type: always from regex  -  uses full text + title keywords, more reliable
        role_type:          regexResult.role_type,
      }

      console.log('[parse-resume] Groq succeeded')
      return NextResponse.json({ success: true, source: 'groq', data: merged })
    } catch (groqErr) {
      console.log('[parse-resume] Groq failed, using regex fallback:', groqErr.message)
      return NextResponse.json({ success: true, source: 'regex', data: regexResult })
    }
  } catch (err) {
    console.error('[parse-resume] Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
