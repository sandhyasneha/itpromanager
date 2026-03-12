// src/app/api/checkout/route.ts
// Creates a Dodo Payments checkout session and returns the payment URL

import { NextResponse } from 'next/server'
import DodoPayments from 'dodopayments'

const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: 'live_mode',
})

const PRODUCTS = {
  monthly: process.env.DODO_PRODUCT_MONTHLY!, // pdt_0NaJbiVffvDiNwo9snuJP
  yearly:  process.env.DODO_PRODUCT_YEARLY!,  // pdt_0NaJbx5ncNhbfp9j9E9Zg
}

export async function POST(request: Request) {
  try {
    const { billing, userEmail, userName } = await request.json()

    if (!billing || !userEmail) {
      return NextResponse.json({ error: 'Missing billing or email' }, { status: 400 })
    }

    if (!process.env.DODO_PAYMENTS_API_KEY) {
      return NextResponse.json({ error: 'Dodo API key not configured' }, { status: 500 })
    }

    const productId = billing === 'yearly' ? PRODUCTS.yearly : PRODUCTS.monthly

    // Create subscription checkout session
    const subscription = await dodo.subscriptions.create({
      billing:    { country: 'US' },
      customer:   { email: userEmail, name: userName || userEmail.split('@')[0] },
      product_id: productId,
      quantity:   1,
      metadata:   { user_email: userEmail, billing_type: billing },
      payment_link: true,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/kanban?upgrade=success`,
    } as any)

    const paymentLink = (subscription as any).payment_link

    if (!paymentLink) {
      return NextResponse.json({ error: 'No payment link returned' }, { status: 500 })
    }

    return NextResponse.json({ url: paymentLink })

  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
