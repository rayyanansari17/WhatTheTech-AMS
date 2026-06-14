import Groq from 'groq-sdk'

let _groq = null

export function getGroqClient() {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return _groq
}
