// src/app/api/capture-ip/route.ts
// Called on user login/signup to capture real IP and country
// Uses ipapi.co free tier (1000 req/day free)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'No userId' }, { status: 400 })

    // Get real IP from headers
    const headersList = await headers()
    const ip =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') || // Cloudflare
      'unknown'

    // Skip local/private IPs
    const isPrivate = ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('::1') || ip.startsWith('192.168.') || ip.startsWith('10.')

    let ipCountry = null
    let ipCity    = null

    if (!isPrivate) {
      try {
        // Free IP geolocation — 1000 req/day no key needed
        const geoRes  = await fetch(`https://ipapi.co/${ip}/json/`, {
          headers: { 'User-Agent': 'NexPlan/1.0' }
        })
        const geoData = await geoRes.json()
        if (geoData && !geoData.error) {
          ipCountry = geoData.country_name || null
          ipCity    = geoData.city || null
        }
      } catch {
        // Geo lookup failed — not critical
      }
    }

    // Save to profiles table
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabase.from('profiles').update({
      ip_address:   isPrivate ? null : ip,
      ip_country:   ipCountry,
      ip_city:      ipCity,
      last_seen_at: new Date().toISOString(),
    }).eq('id', userId)

    return NextResponse.json({ success: true, ip, ipCountry, ipCity })

  } catch (err: any) {
    console.error('IP capture error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
