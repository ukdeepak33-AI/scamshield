import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request, { params }) {
  const domain = params.domain

  const { data: site } = await supabaseAdmin
    .from('sites')
    .select('*, flags(*), reports(*)')
    .eq('domain', domain)
    .single()

  if (!site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 })
  }

  // Get authority suggestions based on request location
  const country = request.headers.get('x-vercel-ip-country') || 'IN'
  const { data: authorities } = await supabaseAdmin
    .from('authorities')
    .select('*')
    .eq('country_code', country)
    .order('type')

  return NextResponse.json({ site, authorities: authorities || [] })
}
