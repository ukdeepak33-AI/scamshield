'use client'
import { useState, useEffect } from 'react'

const TYPE_COLORS = {
  cybercrime: 'var(--red)',
  consumer: 'var(--accent)',
  banking: '#818cf8',
  police: 'var(--yellow)',
  other: 'var(--muted)',
}

export default function AuthorityGuide({ domain }) {
  const [authorities, setAuthorities] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Fetch authority suggestions for current user's jurisdiction
    fetch(`/api/site/${encodeURIComponent(domain)}`)
      .then(r => r.json())
      .then(d => { setAuthorities(d.authorities || []); setLoading(false) })
      .catch(() => {
        // Fallback: show India authorities
        setAuthorities([
          { name: 'National Cyber Crime Reporting Portal', url: 'https://cybercrime.gov.in', country: 'India', type: 'cybercrime', description: 'File cybercrime complaints including online fraud' },
          { name: 'Consumer Helpline', url: 'https://consumerhelpline.gov.in', country: 'India', type: 'consumer', description: 'Report unfair trade practices' },
          { name: 'RBI Banking Ombudsman', url: 'https://bankingombudsman.rbi.org.in', country: 'India', type: 'banking', description: 'Report payment and banking fraud' },
        ])
        setLoading(false)
      })
  }, [domain])

  const reportTemplate = `SCAM REPORT — ${new Date().toLocaleDateString('en-IN')}

Website: ${domain}
Date: ${new Date().toLocaleDateString('en-IN')}
Scam Type: Fake e-commerce / Product fraud

Details:
[Describe what happened, what you ordered, how much you paid, and the payment method used]

Evidence:
- Analyzed by ScamShield: https://scamshield.vercel.app
- Screenshots: [attach any screenshots you have]
- Payment reference: [add your transaction ID]

Requested Action:
Please investigate and take down this fraudulent website to prevent further victims.`

  const copyTemplate = () => {
    navigator.clipboard.writeText(reportTemplate)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      {/* Info banner */}
      <div style={{
        background: 'var(--yellow)10', border: '1px solid var(--yellow)33',
        borderRadius: 10, padding: 16,
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--yellow)', letterSpacing: 2, marginBottom: 6 }}>
          ⚡ HOW TO REPORT A SCAM
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
          Reporting scams helps authorities identify and take down fraudulent sites, and may help you
          recover lost money. Use the pre-filled template below and file with the relevant authority.
        </p>
      </div>

      {/* Authorities */}
      {loading ? (
        <div style={{ color: 'var(--muted)', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', padding: 24 }}>
          Loading relevant authorities...
        </div>
      ) : (
        authorities.map((a, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            border: `1px solid ${TYPE_COLORS[a.type] || 'var(--border)'}33`,
            borderLeft: `3px solid ${TYPE_COLORS[a.type] || 'var(--border)'}`,
            borderRadius: 10, padding: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'monospace', fontSize: 12, fontWeight: 700, marginBottom: 4,
                color: TYPE_COLORS[a.type] || 'var(--text)',
              }}>
                {a.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                {a.description}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--dim)' }}>
                {a.url}
              </div>
            </div>
            <a
              href={a.url.startsWith('http') ? a.url : `https://${a.url}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: TYPE_COLORS[a.type] || 'var(--accent)',
                border: 'none', borderRadius: 6, padding: '8px 16px',
                color: 'white', fontFamily: 'monospace', fontSize: 10,
                fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
                textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
              FILE REPORT →
            </a>
          </div>
        ))
      )}

      {/* Pre-filled template */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 20,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--muted)', letterSpacing: 2 }}>
            📋 PRE-FILLED REPORT TEMPLATE
          </div>
          <button
            onClick={copyTemplate}
            style={{
              background: copied ? 'var(--green)22' : 'var(--accent)15',
              border: `1px solid ${copied ? 'var(--green)44' : 'var(--accent)44'}`,
              color: copied ? 'var(--green)' : 'var(--accent)',
              borderRadius: 6, padding: '6px 14px',
              fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', letterSpacing: 1,
            }}>
            {copied ? '✅ COPIED!' : '📋 COPY TEMPLATE'}
          </button>
        </div>
        <pre style={{
          fontSize: 12, color: 'var(--muted)', lineHeight: 1.7,
          whiteSpace: 'pre-wrap', fontFamily: 'monospace',
          background: 'var(--surface)', borderRadius: 8, padding: 16,
          border: '1px solid var(--border)',
        }}>
          {reportTemplate}
        </pre>
      </div>

      {/* Tips */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: 18,
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, marginBottom: 12 }}>
          💡 TIPS FOR STRONGER REPORTS
        </div>
        {[
          'Take screenshots of the website, your order confirmation, and all communications',
          'Note your payment transaction ID — banks can sometimes reverse charges',
          'Report to your bank immediately if you paid by card or UPI',
          'Save all emails and WhatsApp conversations as evidence',
          'File with multiple authorities — cybercrime portal AND consumer helpline',
        ].map((tip, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, marginBottom: 10, fontSize: 13,
          }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
            <span style={{ color: 'var(--muted)', lineHeight: 1.5 }}>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
