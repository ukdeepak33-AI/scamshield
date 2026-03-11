import { NextResponse } from 'next/server'
import { runScan, normalizeDomain } from '@/lib/scanner'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const normalized = normalizeDomain(url.trim())
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const { domain } = normalized

    // ── Cache check: return cached result if scanned in last 24h ──
    const { data: cached } = await supabaseAdmin
      .from('sites')
      .select('*, flags(*), reports(count)')
      .eq('domain', domain)
      .single()

    if (cached) {
      const scannedAt = new Date(cached.last_scanned)
      const ageHours = (Date.now() - scannedAt.getTime()) / 3600000

      if (ageHours < 24) {
        // Update scan count
        await supabaseAdmin
          .from('sites')
          .update({ scan_count: cached.scan_count + 1 })
          .eq('id', cached.id)

        return NextResponse.json({
          ...cached,
          fromCache: true,
          reportCount: cached.reports?.[0]?.count || 0,
        })
      }
    }

    // ── Fresh scan ─────────────────────────────────────────────
    const result = await runScan(url.trim())

    // ── Save to Supabase ───────────────────────────────────────
    const { data: site, error: siteError } = await supabaseAdmin
      .from('sites')
      .upsert(
        {
          domain: result.domain,
          trust_score: result.trustScore,
          verdict: result.verdict,
          last_scanned: new Date().toISOString(),
          scan_count: (cached?.scan_count || 0) + 1,
        },
        { onConflict: 'domain' }
      )
      .select()
      .single()

    if (siteError) throw siteError

    // Save flags
    if (result.flags.length > 0) {
      // Delete old flags first
      await supabaseAdmin.from('flags').delete().eq('site_id', site.id)

      await supabaseAdmin.from('flags').insert(
        result.flags.map(flag => ({
          site_id: site.id,
          category: flag.category || 'general',
          label: flag.label,
          detail: flag.detail,
          severity: flag.severity,
          icon: flag.icon,
        }))
      )
    }

    return NextResponse.json({
      ...site,
      flags: result.flags,
      fromCache: false,
    })

  } catch (err) {
    console.error('[/api/scan] Error:', err)
    return NextResponse.json(
      { error: 'Scan failed. Please try again.' },
      { status: 500 }
    )
  }
}
