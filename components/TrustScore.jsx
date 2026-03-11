'use client'
import { useState, useEffect } from 'react'

export default function TrustScore({ score = 0, verdict = 'suspicious' }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 200)
    return () => clearTimeout(t)
  }, [score])

  const color =
    verdict === 'safe' ? 'var(--green)'
    : verdict === 'suspicious' ? 'var(--yellow)'
    : 'var(--red)'

  const label =
    verdict === 'safe' ? 'LIKELY SAFE'
    : verdict === 'suspicious' ? 'SUSPICIOUS'
    : 'HIGH RISK'

  const r = 48
  const circ = 2 * Math.PI * r
  const dashOffset = circ * (1 - (animated / 100) * 0.75)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={120} height={90} viewBox="0 0 120 90">
        {/* Background arc */}
        <circle cx={60} cy={72} r={r} fill="none" stroke="var(--border)" strokeWidth={9}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          transform="rotate(135 60 72)" />
        {/* Value arc */}
        <circle cx={60} cy={72} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(135 60 72)"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1), stroke 0.3s' }}
          filter={`drop-shadow(0 0 6px ${color})`} />
        <text x={60} y={66} textAnchor="middle" fill={color} fontSize={26} fontWeight={700}
          fontFamily="monospace"
          style={{ transition: 'fill 0.3s' }}>
          {animated}
        </text>
        <text x={60} y={80} textAnchor="middle" fill="var(--muted)" fontSize={8} fontFamily="monospace">
          TRUST SCORE
        </text>
      </svg>
      <div style={{
        background: color + '22', border: `1px solid ${color}55`,
        color, padding: '3px 14px', borderRadius: 4,
        fontFamily: 'monospace', fontSize: 10, fontWeight: 700, letterSpacing: 3,
      }}>
        {label}
      </div>
    </div>
  )
}
