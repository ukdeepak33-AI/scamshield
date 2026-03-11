export async function checkAiAnalysis(url) {
  const flags = []; let score = 0
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 8000)
    let pageText = ''
    try {
      const pageRes = await fetch(url.startsWith('http') ? url : `https://${url}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ScamShieldBot/1.0)' }
      })
      const html = await pageRes.text()
      pageText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000)
    } catch {
      flags.push({ icon:'🚫', label:'Page Unreachable', detail:'The website did not respond to our check', severity:'medium', category:'ai_analysis' })
      score -= 10; return { flags, score }
    }

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Analyze this website for scam indicators. URL: ${url}\nContent: ${pageText}\n\nYou MUST respond with ONLY a raw JSON object. No markdown, no backticks, no explanation. Example format:\n{"scam_probability":50,"flags":[{"label":"Missing Contact Info","detail":"No phone or address found on site","severity":"medium","icon":"📞","category":"ai_analysis"}]}\n\nMax 4 flags. Only include real issues found.`
        }]
      })
    })

    const aiData = await aiRes.json()
    const rawText = aiData?.content?.[0]?.text || ''

    // Robust parsing — try multiple strategies
    let parsed = null

    // Strategy 1: direct parse
    try { parsed = JSON.parse(rawText.trim()) } catch {}

    // Strategy 2: strip markdown fences
    if (!parsed) {
      try {
        const stripped = rawText.replace(/^```(?:json)?/m, '').replace(/```$/m, '').trim()
        parsed = JSON.parse(stripped)
      } catch {}
    }

    // Strategy 3: extract JSON object with regex
    if (!parsed) {
      try {
        const match = rawText.match(/\{[\s\S]*\}/)
        if (match) parsed = JSON.parse(match[0])
      } catch {}
    }

    if (parsed && Array.isArray(parsed.flags)) {
      flags.push(...parsed.flags)
      const prob = parsed.scam_probability || 0
      if (prob > 70) score -= 20
      else if (prob > 40) score -= 10
      else if (prob > 20) score -= 5
    }

  } catch (err) { console.error('[AI Analysis]', err.message) }
  return { flags, score }
}
