'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Send, Activity } from 'lucide-react'

export default function SiteHealthPage() {
  const [checks, setChecks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [asking, setAsking] = useState(false)

  async function runChecks() {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/health-check')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch health checks')
      setChecks(data.checks)
    } catch (err) {
      setFetchError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { runChecks() }, [])

  async function askQuestion() {
    if (!question.trim() || !checks || asking) return
    setAsking(true)
    setAnswer('')
    try {
      const res = await fetch('/api/admin/health-check/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, checks }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get answer')
      setAnswer(data.answer || 'No response.')
    } catch (err) {
      setAnswer(`Error: ${err.message}`)
    } finally {
      setAsking(false)
    }
  }

  const okCount = checks?.filter(c => c.status === 'ok').length ?? 0
  const errorCount = checks?.filter(c => c.status === 'error').length ?? 0

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Site Health</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? 'Running checks…'
              : fetchError
                ? 'Failed to load checks'
                : `${okCount} ok · ${errorCount} error${errorCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={runChecks} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Service grid */}
      {fetchError ? (
        <Card className="border-destructive/50 mb-8">
          <CardContent className="p-6 text-center text-sm text-destructive">{fetchError}</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </CardContent>
                </Card>
              ))
            : checks?.map(c => (
                <Card key={c.name} className={c.status === 'error' ? 'border-destructive/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-none">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{c.latency_ms} ms</p>
                        {c.message && (
                          <p
                            className={`text-xs mt-1 break-words ${c.status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
                            title={c.message}
                          >
                            {c.message}
                          </p>
                        )}
                      </div>
                      <div
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${
                          c.status === 'ok' ? 'bg-green-500' : 'bg-destructive'
                        }`}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      )}

      {/* Ask box */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" /> Ask about your infrastructure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Why is Groq slow? Which services have errors?"
              onKeyDown={e => { if (e.key === 'Enter') askQuestion() }}
              disabled={asking || loading || !checks}
            />
            <Button
              onClick={askQuestion}
              disabled={asking || loading || !checks || !question.trim()}
              size="icon"
            >
              {asking
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </Button>
          </div>
          {answer && (
            <div className="mt-4 p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap leading-relaxed">
              {answer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
