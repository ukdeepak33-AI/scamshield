export async function checkAiAnalysis(url) {
  const flags = []; let score = 0
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 10000)
    let pageText = ''; let pageHtml = ''
    try {
      const pageRes = await fetch(url.startsWith('http') ? url : `https://${url}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ScamShieldBot/1.0)' }
      })
      pageHtml = await pageRes.text()
      pageText = pageHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 4000)
    } catch {
      flags.push({ icon:'🚫', label:'Page Unreachable', detail:'The website did not respond', severity:'medium', category:'ai_analysis' })
      score -= 10; return { flags, score }
    }
    const imgMatches = pageHtml.match(/src="([^"]+\.(png|jpg|jpeg|webp))"/gi) || []
    const imgUrls = imgMatches.slice(0, 10).join(', ')
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', max_tokens: 1200,
        messages: [{ role: 'user', content: `You are an expert scam detection analyst. Deeply analyze this website.\n\nURL: ${url}\nPage text: ${pageText}\nImage URLs: ${imgUrls}\n\nCheck ALL of these:\n1. Unrealistically cheap products (2TB SSD for ₹999, iPhone for ₹2000)\n2. Very few products in store (1-3 products = fake shop)\n3. AI-generated logo (filenames with "Copilot", "Dall-E", "generated")\n4. All navigation links pointing to same URL\n5. No contact info (phone, email, address)\n6. COD only payment (scammers prefer COD)\n7. Outdated banners (New Year offer in March)\n8. Bait and switch (product listed but no longer available)\n9. Fake discounts (60-90% off branded items)\n10. No GST number or business registration\n\nRespond ONLY with raw JSON, no markdown:\n{"scam_probability":<0-100>,"flags":[{"label":"<specific finding>","detail":"<exact evidence from page>","severity":"<high|medium|low>","icon":"<emoji>","category":"ai_analysis"}]}\n\nBe specific, quote actual evidence. Max 6 flags.` }]
      })
    })
    const aiData = await aiRes.json()
    const rawText = aiData?.content?.[0]?.text || ''
    let parsed = null
    try { parsed = JSON.parse(rawText.trim()) } catch {}
    if (!parsed) { try { parsed = JSON.parse(rawText.replace(/^```(?:json)?/m,'').replace(/```$/m,'').trim()) } catch {} }
    if (!parsed) { try { const m=rawText.match(/\{[\s\S]*\}/); if(m) parsed=JSON.parse(m[0]) } catch {} }
    if (parsed?.flags) {
      flags.push(...parsed.flags)
      const prob = parsed.scam_probability||0
      if (prob>80) score-=35
      else if (prob>60) score-=25
      else if (prob>40) score-=15
      else if (prob>20) score-=8
    }
  } catch(err) { console.error('[AI Analysis]', err.message) }
  return { flags, score }
}
