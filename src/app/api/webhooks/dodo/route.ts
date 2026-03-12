// src/app/api/webhooks/dodo/route.ts
// Receives Dodo Payment webhook events
// On subscription.active → upgrades user to Pro in Supabase + triggers Pro welcome email

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Webhook } from 'standardwebhooks'

export async function POST(request: Request) {
  const rawBody = await request.text()

  // ── Verify webhook signature ─────────────────────────────────
  try {
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET
    if (!webhookSecret) throw new Error('DODO_WEBHOOK_SECRET not set')

    const webhook = new Webhook(webhookSecret)
    const webhookHeaders = {
      'webhook-id':        request.headers.get('webhook-id')        || '',
      'webhook-signature': request.headers.get('webhook-signature') || '',
      'webhook-timestamp': request.headers.get('webhook-timestamp') || '',
    }
    await webhook.verify(rawBody, webhookHeaders)
  } catch (err: any) {
    console.error('Webhook verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const eventType = payload.type || payload.event_type
  console.log('Dodo webhook received:', eventType)

  // ── Handle subscription activated ────────────────────────────
  if (eventType === 'subscription.active' || eventType === 'payment.succeeded') {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Extract customer details from payload
      const data       = payload.data || payload
      const email      = data.customer?.email || data.billing_address?.email || data.metadata?.user_email
      const billingType = data.metadata?.billing_type || 'monthly'
      const subscriptionId = data.subscription_id || data.id

      if (!email) {
        console.error('No email in webhook payload:', JSON.stringify(payload))
        return NextResponse.json({ error: 'No email in payload' }, { status: 400 })
      }

      console.log(`Upgrading ${email} to Pro (${billingType})`)

      // Calculate expiry date
      const expiresAt = new Date()
      if (billingType === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1)
      }

      // ── 1. Update profiles table ──────────────────────────────
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          plan:            'pro',
          plan_billing:    billingType,
          plan_updated_at: new Date().toISOString(),
          plan_expires_at: expiresAt.toISOString(),
        })
        .eq('email', email)

      if (profileError) {
        console.error('Profile update error:', profileError)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      // ── 2. Upsert subscriptions table ─────────────────────────
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', email)
        .single()

      await supabase.from('subscriptions').upsert({
        user_id:     profile?.id,
        user_email:  email,
        user_name:   profile?.full_name || email.split('@')[0],
        plan:        'pro',
        billing:     billingType,
        price_usd:   billingType === 'yearly' ? 49 : 5,
        status:      'active',
        starts_at:   new Date().toISOString(),
        expires_at:  expiresAt.toISOString(),
        assigned_by: 'dodo_webhook',
        notes:       `Dodo subscription ID: ${subscriptionId}`,
        updated_at:  new Date().toISOString(),
      }, { onConflict: 'user_email' })

      // ── 3. Log to agent_logs ──────────────────────────────────
      await supabase.from('agent_logs').insert({
        user_id:    profile?.id || null,
        user_email: email,
        action:     'pro_upgrade_webhook',
        plan:       'pro',
        note:       `Dodo webhook: ${eventType}. Billing: ${billingType}. Sub ID: ${subscriptionId}`,
      })

      // ── 4. Send Pro Welcome Email ─────────────────────────────
      const firstName = profile?.full_name?.split(' ')[0] || email.split('@')[0]
      await fetch(`${process.env.APP_URL}/api/send-pro-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName: profile?.full_name || firstName, billing: billingType }),
      })

      console.log(`✅ ${email} upgraded to Pro successfully`)
      return NextResponse.json({ success: true, email, plan: 'pro' })

    } catch (err: any) {
      console.error('Webhook processing error:', err)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // ── Handle subscription cancelled ────────────────────────────
  if (eventType === 'subscription.cancelled' || eventType === 'subscription.expired') {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const data  = payload.data || payload
      const email = data.customer?.email || data.metadata?.user_email

      if (email) {
        await supabase.from('profiles').update({
          plan:            'free',
          plan_billing:    null,
          plan_updated_at: new Date().toISOString(),
          plan_expires_at: null,
        }).eq('email', email)

        await supabase.from('subscriptions').update({
          status:     'cancelled',
          updated_at: new Date().toISOString(),
        }).eq('user_email', email)

        await supabase.from('agent_logs').insert({
          user_email: email,
          action:     'pro_cancelled_webhook',
          plan:       'free',
          note:       `Dodo webhook: ${eventType}`,
        })

        console.log(`${email} downgraded to Free`)
      }
    } catch (err: any) {
      console.error('Cancellation error:', err)
    }
  }

  return NextResponse.json({ received: true })
}
