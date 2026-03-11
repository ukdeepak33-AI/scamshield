/**
 * VirusTotal API v3
 * Checks URL against 70+ antivirus/security engines
 * Free: 500 req/day — https://www.virustotal.com/gui/sign-in
 */
export async function checkVirusTotal(url) {
  const flags = []
  let score = 0

  try {
    // VirusTotal requires URL to be base64url encoded
    const urlId = Buffer.from(url).toString('base64url').replace(/=+$/, '')

    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: { 'x-apikey': process.env.VIRUSTOTAL_API_KEY },
    })

    if (res.status === 404) {
      // URL not in VT db yet — submit it for analysis
      await fetch('https://www.virustotal.com/api/v3/urls', {
        method: 'POST',
        headers: {
          'x-apikey': process.env.VIRUSTOTAL_API_KEY,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: `url=${encodeURIComponent(url)}`,
      })
      return { flags, score } // Analysis takes time, skip for now
    }

    const data = await res.json()
    const stats = data?.data?.attributes?.last_analysis_stats

    if (stats) {
      const malicious = stats.malicious || 0
      const suspicious = stats.suspicious || 0
      const total = Object.values(stats).reduce((a, b) => a + b, 0)

      if (malicious > 0) {
        flags.push({
          icon: '🦠',
          label: 'Flagged by Security Engines',
          detail: `${malicious} out of ${total} security engines flagged this URL as malicious`,
          severity: malicious >= 5 ? 'high' : 'medium',
          category: 'virustotal',
        })
        score -= malicious >= 5 ? 35 : 20
      } else if (suspicious > 0) {
        flags.push({
          icon: '⚠️',
          label: 'Suspicious URL',
          detail: `${suspicious} security engines marked this URL as suspicious`,
          severity: 'medium',
          category: 'virustotal',
        })
        score -= 10
      }
    }

  } catch (err) {
    console.error('[VirusTotal] Error:', err.message)
  }

  return { flags, score }
}
