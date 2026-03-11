import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { normalizeDomain } from '@/lib/scanner'

export async function POST(request) {
  try {
    const body = await request.json()
    const { url, description, displayName, city, amountLost, screenshotUrl } = body

    if (!url || !description) {
      return NextResponse.json({ error: 'URL and description are required' }, { status: 400 })
    }

    if (description.length < 10) {
      return NextResponse.json({ error: 'Description is too short' }, { status: 400 })
    }

    const normalized = normalizeDomain(url)
    if (!normalized) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Get or create site record
    let { data: site } = await supabaseAdmin
      .from('sites')
      .select('id, report_count')
      .eq('domain', normalized.domain)
      .single()

    if (!site) {
      const { data: newSite } = await supabaseAdmin
        .from('sites')
        .insert({ domain: normalized.domain, trust_score: 50, verdict: 'suspicious' })
        .select()
        .single()
      site = newSite
    }

    // Insert report
    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .insert({
        site_id: site.id,
        display_name: displayName || 'Anonymous',
        city: city || null,
        description: description.slice(0, 1000),
        amount_lost: amountLost ? parseInt(amountLost) : null,
        screenshot_url: screenshotUrl || null,
      })
      .select()
      .single()

    if (error) throw error

    // Update report count on site
    await supabaseAdmin
      .from('sites')
      .update({ report_count: (site.report_count || 0) + 1 })
      .eq('id', site.id)

    return NextResponse.json({ success: true, report })

  } catch (err) {
    console.error('[/api/report] Error:', err)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }
}

// GET all reports for a domain
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')

  if (!domain) {
    return NextResponse.json({ error: 'domain param required' }, { status: 400 })
  }

  const { data: site } = await supabaseAdmin
    .from('sites')
    .select('id')
    .eq('domain', domain)
    .single()

  if (!site) return NextResponse.json({ reports: [] })

  const { data: reports } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('site_id', site.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ reports: reports || [] })
}
