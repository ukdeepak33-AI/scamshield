/**
 * Scanner — orchestrates all checks and computes trust score
 */
import { checkWhois } from './checks/whois.js'
import { checkSafeBrowsing } from './checks/safebrowsing.js'
import { checkVirusTotal } from './checks/virustotal.js'
import { checkIpGeo } from './checks/ipgeo.js'
import { checkAiAnalysis } from './checks/ai-analysis.js'

export function normalizeDomain(input) {
  try {
    const withProtocol = input.startsWith('http') ? input : `https://${input}`
    const url = new URL(withProtocol)
    return {
      domain: url.hostname.replace(/^www\./, ''),
      fullUrl: withProtocol,
    }
  } catch {
    return null
  }
}

export function computeVerdict(score) {
  if (score >= 60) return 'safe'
  if (score >= 30) return 'suspicious'
  return 'dangerous'
}

export async function runScan(rawInput) {
  const normalized = normalizeDomain(rawInput)
  if (!normalized) throw new Error('Invalid URL')

  const { domain, fullUrl } = normalized

  // Run all checks in parallel for speed
  const [whois, safeBrowsing, virusTotal, ipGeo, aiAnalysis] = await Promise.allSettled([
    checkWhois(domain),
    checkSafeBrowsing(fullUrl),
    checkVirusTotal(fullUrl),
    checkIpGeo(domain),
    checkAiAnalysis(fullUrl),
  ])

  // Collect results safely (handle any check that threw)
  const results = [whois, safeBrowsing, virusTotal, ipGeo, aiAnalysis].map(r =>
    r.status === 'fulfilled' ? r.value : { flags: [], score: 0 }
  )

  const allFlags = results.flatMap(r => r.flags)
  const totalDeduction = results.reduce((sum, r) => sum + (r.score || 0), 0)

  // Base score starts at 100, deductions applied from checks
  const trustScore = Math.max(0, Math.min(100, 100 + totalDeduction))
  const verdict = computeVerdict(trustScore)

  return {
    domain,
    fullUrl,
    trustScore,
    verdict,
    flags: allFlags,
  }
}
