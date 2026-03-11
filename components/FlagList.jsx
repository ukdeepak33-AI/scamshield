'use client'

const SEV_COLOR = {
  high: 'var(--red)',
  medium: 'var(--yellow)',
  low: 'var(--green)',
}

export default function FlagList({ flags = [] }) {
  if (flags.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--green)33',
        borderRadius: 12, padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
        <div style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--green)', letterSpacing: 1 }}>
          NO RED FLAGS DETECTED
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
          All checks passed — this site appears to be legitimate.
        </div>
      </div>
    )
  }

  const counts = flags.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      {/* Severity summary bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {['high', 'medium', 'low'].map(sev => counts[sev] ? (
          <div key={sev} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: SEV_COLOR[sev] + '15',
            border: `1px solid ${SEV_COLOR[sev]}44`,
            borderRadius: 6, padding: '4px 12px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: SEV_COLOR[sev] }} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: SEV_COLOR[sev], letterSpacing: 1 }}>
              {counts[sev]} {sev.toUpperCase()}
            </span>
          </div>
        ) : null)}
      </div>

      {/* Flag cards */}
      <div style={{ display: 'grid', gap: 10 }}>
        {flags.map((flag, i) => (
          <div key={i} className="fade-in" style={{
            background: 'var(--surface)',
            border: `1px solid ${SEV_COLOR[flag.severity] || 'var(--border)'}33`,
            borderLeft: `3px solid ${SEV_COLOR[flag.severity] || 'var(--border)'}`,
            borderRadius: 8, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animationDelay: `${i * 0.06}s`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{flag.icon || '⚠️'}</span>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, marginBottom: 3 }}>
                  {flag.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>{flag.detail}</div>
              </div>
            </div>
            <div style={{
              background: (SEV_COLOR[flag.severity] || 'var(--border)') + '22',
              color: SEV_COLOR[flag.severity] || 'var(--muted)',
              borderRadius: 4, padding: '3px 10px', flexShrink: 0, marginLeft: 12,
              fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: 2,
            }}>
              {(flag.severity || 'unknown').toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
