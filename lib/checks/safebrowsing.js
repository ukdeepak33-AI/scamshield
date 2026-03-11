/**
 * Google Safe Browsing API v4
 * Checks for malware, phishing, and unwanted software
 * Free: 10,000 req/day — https://console.cloud.google.com
 */
export async function checkSafeBrowsing(url) {
  const flags = []
  let score = 0

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'scamshield', clientVersion: '1.0.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
      }
    )

    const data = await res.json()

    if (data.matches && data.matches.length > 0) {
      const types = [...new Set(data.matches.map(m => m.threatType))]

      types.forEach(type => {
        const labels = {
          MALWARE: { label: 'Malware Detected', detail: 'Google flagged this site for distributing malware', icon: '☠️' },
          SOCIAL_ENGINEERING: { label: 'Phishing Site', detail: 'Google Safe Browsing flagged this as a phishing/scam site', icon: '🎣' },
          UNWANTED_SOFTWARE: { label: 'Unwanted Software', detail: 'This site may install unwanted software', icon: '⚠️' },
          POTENTIALLY_HARMFUL_APPLICATION: { label: 'Harmful App', detail: 'This site distributes potentially harmful applications', icon: '💀' },
        }
        const info = labels[type] || { label: type, detail: 'Flagged by Google Safe Browsing', icon: '🚨' }
        flags.push({ ...info, severity: 'high', category: 'blacklist' })
        score -= 40
      })
    }

  } catch (err) {
    console.error('[SafeBrowsing] Error:', err.message)
  }

  return { flags, score }
}
