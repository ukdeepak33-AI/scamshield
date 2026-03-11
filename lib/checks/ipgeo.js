/**
 * ip-api.com — Hosting country and ISP detection
 * No API key needed. Free: 45 req/min
 * https://ip-api.com
 */

// Countries commonly associated with hosting scam infrastructure
const HIGH_RISK_COUNTRIES = ['RU', 'CN', 'NG', 'KP', 'SC', 'CY', 'PW', 'WS']
const MEDIUM_RISK_COUNTRIES = ['UA', 'BY', 'MD', 'VN', 'ID']

export async function checkIpGeo(domain) {
  const flags = []
  let score = 0

  try {
    const res = await fetch(
      `http://ip-api.com/json/${domain}?fields=status,country,countryCode,city,isp,org,hosting`
    )
    const data = await res.json()

    if (data.status !== 'success') return { flags, score }

    // ── Offshore/anonymous hosting ─────────────────
    if (HIGH_RISK_COUNTRIES.includes(data.countryCode)) {
      flags.push({
        icon: '🌍',
        label: 'High-Risk Hosting Location',
        detail: `Server hosted in ${data.country} — frequently used for scam infrastructure`,
        severity: 'high',
        category: 'hosting',
      })
      score -= 15
    } else if (MEDIUM_RISK_COUNTRIES.includes(data.countryCode)) {
      flags.push({
        icon: '🌍',
        label: 'Suspicious Hosting Location',
        detail: `Server hosted in ${data.country}`,
        severity: 'medium',
        category: 'hosting',
      })
      score -= 8
    }

    // ── Bulletproof/anonymous hosting providers ────
    const suspiciousISPs = ['hostinger', 'namecheap hosting', 'nicenic', 'shinjiru', 'aeza']
    const ispLower = (data.isp || '').toLowerCase()
    if (suspiciousISPs.some(s => ispLower.includes(s))) {
      flags.push({
        icon: '🖥️',
        label: 'Anonymous Hosting Provider',
        detail: `Hosted with ${data.isp} — provider known for minimal abuse monitoring`,
        severity: 'medium',
        category: 'hosting',
      })
      score -= 8
    }

  } catch (err) {
    console.error('[IpGeo] Error:', err.message)
  }

  return { flags, score }
}
