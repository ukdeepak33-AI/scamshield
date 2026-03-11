'use client'
import { useState, useEffect } from 'react'

export default function CommunityReports({ domain }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    displayName: '',
    city: '',
    description: '',
    amountLost: '',
  })

  useEffect(() => {
    fetch(`/api/report?domain=${encodeURIComponent(domain)}`)
      .then(r => r.json())
      .then(d => { setReports(d.reports || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [domain])

  const handleSubmit = async () => {
    if (!form.description || form.description.length < 10) return
    setSubmitting(true)

    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: domain, ...form }),
    })

    if (res.ok) {
      const { report } = await res.json()
      setReports(prev => [report, ...prev])
      setSubmitted(true)
      setForm({ displayName: '', city: '', description: '', amountLost: '' })
    }
    setSubmitting(false)
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* Submit form */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 20,
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 14 }}>
          SHARE YOUR EXPERIENCE WITH THIS SITE
        </div>

        {submitted ? (
          <div style={{
            background: 'var(--green)15', border: '1px solid var(--green)44',
            borderRadius: 8, padding: 16, textAlign: 'center',
            color: 'var(--green)', fontFamily: 'monospace', fontSize: 12, letterSpacing: 1,
          }}>
            ✅ REPORT SUBMITTED — Thank you for protecting others!
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input
                value={form.displayName}
                onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                placeholder="Your name (optional)"
                style={inputStyle}
              />
              <input
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                placeholder="City (optional)"
                style={inputStyle}
              />
            </div>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe what happened — what did you order, how were you scammed, what happened after payment?"
              style={{ ...inputStyle, width: '100%', minHeight: 90, resize: 'vertical', marginBottom: 10 }}
            />
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                value={form.amountLost}
                onChange={e => setForm(p => ({ ...p, amountLost: e.target.value }))}
                placeholder="Amount lost (₹)"
                type="number"
                style={{ ...inputStyle, width: 160 }}
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.description}
                style={{
                  background: 'var(--red)', border: 'none', borderRadius: 6,
                  padding: '10px 20px', color: 'white', fontFamily: 'monospace',
                  fontSize: 11, fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
                  opacity: submitting || !form.description ? 0.6 : 1,
                }}>
                {submitting ? 'SUBMITTING...' : 'SUBMIT REPORT'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Reports list */}
      {loading ? (
        <div style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 24 }}>
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: 24, textAlign: 'center',
        }}>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>
            No community reports yet for this site. Be the first to share your experience.
          </div>
        </div>
      ) : (
        reports.map((r, i) => (
          <div key={r.id || i} className="fade-in" style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent)66, var(--red)66)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
                }}>
                  {(r.display_name || 'A')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>
                    {r.display_name || 'Anonymous'}
                  </div>
                  {r.city && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.city}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--dim)', fontFamily: 'monospace' }}>
                  {timeAgo(r.created_at)}
                </span>
                {r.amount_lost && (
                  <span style={{
                    background: 'var(--red)15', border: '1px solid var(--red)33',
                    color: 'var(--red)', borderRadius: 4, padding: '2px 8px',
                    fontFamily: 'monospace', fontSize: 10,
                  }}>
                    Lost ₹{r.amount_lost.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
              {r.description}
            </p>
          </div>
        ))
      )}
    </div>
  )
}

const inputStyle = {
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '10px 14px', color: 'var(--text)',
  fontSize: 13, outline: 'none', fontFamily: 'Georgia, serif',
}
