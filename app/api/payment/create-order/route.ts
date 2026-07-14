import { NextRequest, NextResponse } from 'next/server';

// Razorpay test credentials – replace with your real test keys via env vars
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_yourkeyhere';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'your_test_secret_here';

const PLAN_AMOUNTS: Record<string, number> = {
  bronze: 1000,  // ₹10 in paise
  silver: 5000,  // ₹50 in paise
  gold: 10000,   // ₹100 in paise
};

const PLAN_LABELS: Record<string, string> = {
  bronze: 'Bronze Plan – 7 min watch time',
  silver: 'Silver Plan – 10 min watch time',
  gold: 'Gold Plan – Unlimited watch time',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const plan: string = body.plan || 'gold';

    const amountInPaise = PLAN_AMOUNTS[plan] ?? PLAN_AMOUNTS.gold;
    const description = PLAN_LABELS[plan] ?? PLAN_LABELS.gold;

    const orderPayload = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `${plan}_${Date.now()}`,
      notes: { plan, description },
    };

    const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Razorpay error:', err);
      // Demo / test mode fallback
      return NextResponse.json({
        orderId: `mock_order_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID,
        plan,
        mock: true,
      });
    }

    const order = await response.json();
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      plan,
      mock: false,
    });
  } catch (error) {
    console.error('Payment route error:', error);
    const body = { plan: 'gold' };
    const plan = body.plan;
    const amountInPaise = PLAN_AMOUNTS[plan] ?? PLAN_AMOUNTS.gold;
    return NextResponse.json({
      orderId: `mock_order_${Date.now()}`,
      amount: amountInPaise,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID || 'rzp_test_yourkeyhere',
      plan,
      mock: true,
    });
  }
}
