import { NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import { parseResumeText } from '@/lib/resume-parser'

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
