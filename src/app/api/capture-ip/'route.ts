// src/app/api/capture-ip/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'No userId' }, { status: 400 })

    const headersList = await headers()

    // cf-connecting-ip = real user IP when behind Cloudflare (highest priority)
    // x-real-ip = real user IP from reverse proxy
    // x-forwarded-for = may contain Cloudflare edge IPs, use last entry for origin
    const cfIp        = headersList.get('cf-connecting-ip')
    const realIp      = headersList.get('x-real-ip')
    const forwardedFor = headersList.get('x-forwarded-for')

    // x-forwarded-for can be "userIP, cloudflareIP" — the FIRST entry is the real user
    const forwardedFirst = forwardedFor?.split(',')[0]?.trim()

    const ip = cfIp || realIp || forwardedFirst || 'unknown'

    console.log('[capture-ip] cf-connecting-ip:', cfIp)
    console.log('[capture-ip] x-real-ip:', realIp)
    console.log('[capture-ip] x-forwarded-for:', forwardedFor)
    console.log('[capture-ip] using ip:', ip)

    const isPrivate =
      !ip ||
      ip === 'unknown' ||
      ip.startsWith('127.') ||
      ip.startsWith('::1') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      // Cloudflare edge IPs (172.64.x.x - 172.71.x.x) — skip these
      /^172\.(6[4-9]|7[0-1])\./.test(ip)

    let ipCountry = null
    let ipCity    = null

    if (!isPrivate) {
      try {
        const geoRes  = await fetch(`https://ipapi.co/${ip}/json/`, {
          headers: { 'User-Agent': 'NexPlan/1.0' }
        })
        const geoData = await geoRes.json()
        console.log('[capture-ip] geo result:', JSON.stringify(geoData))
        if (geoData && !geoData.error) {
          ipCountry = geoData.country_name || null
          ipCity    = geoData.city || null
        }
      } catch (e) {
        console.error('[capture-ip] geo lookup failed:', e)
      }
    } else {
      console.log('[capture-ip] skipping geo — private or Cloudflare edge IP:', ip)
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

    if (error) console.error('[capture-ip] supabase error:', error)

    return NextResponse.json({ success: true, ip, isPrivate, ipCountry, ipCity })

  } catch (err: any) {
    console.error('[capture-ip] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
