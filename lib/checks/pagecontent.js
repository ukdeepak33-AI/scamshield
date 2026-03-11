/**
 * Page content analysis — no API key needed
 * Checks for price anomalies, missing contact info, pressure tactics
 */
export async function checkPageContent(url) {
  const flags = []; let score = 0

  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 8000)

    const res = await fetch(url.startsWith('http') ? url : `https://${url}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ScamShieldBot/1.0)' }
    })
    const html = await res.text()
    const text = html.toLowerCase()

    // ── Price anomaly: suspiciously cheap branded products ──
    const priceMatches = text.match(/₹\s?(\d+)|rs\.?\s?(\d+)|inr\s?(\d+)/g) || []
    const prices = priceMatches.map(p => parseInt(p.replace(/[^\d]/g, ''))).filter(p => p > 0)

    const suspiciousProducts = ['iphone','macbook','samsung','ps5','playstation','laptop','ipad','airpods','ssd','1tb','2tb','gpu','rtx']
    const hasSuspiciousProduct = suspiciousProducts.some(p => text.includes(p))

    if (hasSuspiciousProduct && prices.some(p => p < 2000)) {
      flags.push({ icon:'💸', label:'Suspiciously Low Price', detail:`Branded tech product listed at extremely low price — classic scam tactic`, severity:'high', category:'price_anomaly' })
      score -= 30
    }

    // ── Pressure tactics ──
    const pressureWords = ['limited time','only left','hurry','selling fast','last chance','expires today','act now','don\'t miss']
    const pressureCount = pressureWords.filter(w => text.includes(w)).length
    if (pressureCount >= 2) {
      flags.push({ icon:'⏰', label:'Pressure Tactics Detected', detail:`Site uses urgency language to rush purchases: "${pressureWords.find(w => text.includes(w))}"`, severity:'medium', category:'pressure' })
      score -= 10
    }

    // ── No contact info ──
    const hasPhone = /(\+91|0)[\s-]?\d{10}|\d{3}[\s-]\d{3}[\s-]\d{4}/.test(text)
    const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(text)
    const hasAddress = text.includes('address') || text.includes('street') || text.includes('nagar')

    if (!hasPhone && !hasEmail) {
      flags.push({ icon:'📞', label:'No Contact Information', detail:'No phone number or email address found on the site', severity:'high', category:'contact' })
      score -= 20
    } else if (!hasAddress) {
      flags.push({ icon:'📍', label:'No Physical Address', detail:'No physical business address found on the site', severity:'medium', category:'contact' })
      score -= 10
    }

    // ── Too-good-to-be-true discount ──
    const discountMatches = text.match(/(\d+)%\s*off/g) || []
    const bigDiscounts = discountMatches.filter(d => parseInt(d) >= 80)
    if (bigDiscounts.length > 0) {
      flags.push({ icon:'🏷️', label:'Extreme Discount Claims', detail:`Site claims ${bigDiscounts[0]} — unrealistic for genuine products`, severity:'high', category:'price_anomaly' })
      score -= 20
    }

    // ── Copied/generic about page ──
    const genericPhrases = ['we are committed to','best quality products','customer satisfaction is our','we strive to provide']
    const genericCount = genericPhrases.filter(p => text.includes(p)).length
    if (genericCount >= 2) {
      flags.push({ icon:'📄', label:'Generic Copied Content', detail:'Site uses boilerplate text commonly found on fake shops', severity:'low', category:'content' })
      score -= 5
    }

  } catch (err) {
    console.error('[PageContent]', err.message)
  }

  return { flags, score }
}
