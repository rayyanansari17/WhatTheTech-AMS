import { NextResponse } from 'next/server'
import { createRequire } from 'module'
import { parseResumeText } from '@/lib/resume-parser'

// Force the CJS build of pdf-parse — the ESM build depends on pdfjs-dist's web worker
// which is not available in Node.js serverless environments.
const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

export const runtime = 'nodejs'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('resume')
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })
    const data = await parser.getText()
    const parsed = parseResumeText(data.text)

    return NextResponse.json({ success: true, data: parsed })
  } catch (err) {
    console.error('Resume parse error:', err)
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
