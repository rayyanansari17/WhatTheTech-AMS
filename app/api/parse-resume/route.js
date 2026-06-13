import { NextResponse } from 'next/server'
import { parseResumeText } from '@/lib/resume-parser'

export const runtime = 'nodejs'

const MARKITDOWN_URL = (process.env.MARKITDOWN_SERVICE_URL || '').replace(/\/$/, '')

// ── Extract raw text via MarkItDown service ───────────────────────────────────
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

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('resume')
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Step 1 — extract text via MarkItDown
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

    // Step 2 — extract structured fields via regex parser
    const parsed = parseResumeText(text)

    return NextResponse.json({ success: true, data: parsed })
  } catch (err) {
    console.error('[parse-resume] Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
