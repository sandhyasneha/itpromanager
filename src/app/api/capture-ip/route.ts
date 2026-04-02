export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get real IP from headers
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') ?? 'unknown'

  // Skip private/local IPs
  const isPrivate = ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1'

  let country_ip = 'Unknown'

  if (!isPrivate) {
    try {
      // Free IP geolocation — no API key needed
      const geo = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode`)
      if (geo.ok) {
        const data = await geo.json()
        if (data.country) country_ip = data.country
      }
    } catch (e) {
      console.warn('IP lookup failed:', e)
    }
  }

  // Update profile with IP and country
  await supabase
    .from('profiles')
    .update({
      ip_address: isPrivate ? undefined : ip,
      country_ip: isPrivate ? undefined : country_ip,
    })
    .eq('id', user.id)

  return NextResponse.json({ ip, country_ip })
}
