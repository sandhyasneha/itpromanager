// src/app/api/capture-ip/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'No userId' }, { status: 400 })

    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') ||
      'unknown'

    console.log('[capture-ip] userId:', userId, 'ip:', ip)

    const isPrivate = ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('::1') || ip.startsWith('192.168.') || ip.startsWith('10.')

    let ipCountry = null
    let ipCity    = null

    if (!isPrivate) {
      try {
        const geoRes  = await fetch(`https://ipapi.co/${ip}/json/`, {
          headers: { 'User-Agent': 'NexPlan/1.0' }
        })
        const geoData = await geoRes.json()
        console.log('[capture-ip] geo:', JSON.stringify(geoData))
        if (geoData && !geoData.error) {
          ipCountry = geoData.country_name || null
          ipCity    = geoData.city || null
        }
      } catch (e) {
        console.error('[capture-ip] geo error:', e)
      }
    } else {
      console.log('[capture-ip] private IP, skipping geo lookup')
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.from('profiles').update({
      ip_address:   isPrivate ? null : ip,
      ip_country:   ipCountry,
      ip_city:      ipCity,
      last_seen_at: new Date().toISOString(),
    }).eq('id', userId)

    console.log('[capture-ip] supabase update error:', JSON.stringify(error))

    return NextResponse.json({ success: true, ip, isPrivate, ipCountry, ipCity })

  } catch (err: any) {
    console.error('[capture-ip] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
