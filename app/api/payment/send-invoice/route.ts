import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const PLAN_LABELS: Record<string, string> = {
  bronze: 'Bronze Plan',
  silver: 'Silver Plan',
  gold: 'Gold Plan',
};

const PLAN_WATCH_TIME: Record<string, string> = {
  bronze: '7 minutes per video',
  silver: '10 minutes per video',
  gold: 'Unlimited',
};

const PLAN_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#a8a9ad',
  gold: '#ffd700',
};

function buildInvoiceHtml(data: {
  email: string;
  plan: string;
  amount: number;
  orderId: string;
  transactionDate: string;
}) {
  const planLabel = PLAN_LABELS[data.plan] || data.plan;
  const watchTime = PLAN_WATCH_TIME[data.plan] || 'N/A';
  const color = PLAN_COLORS[data.plan] || '#f59e0b';
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Invoice – YouTube Clone</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e,#0f3460);padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <span style="background:#ff0000;display:inline-block;width:28px;height:20px;border-radius:4px;"></span>
              <span style="font-size:22px;font-weight:700;color:#f1f1f1;letter-spacing:-0.3px;">YouTube Clone</span>
            </div>
            <p style="color:#aaa;font-size:13px;margin:8px 0 0;">Payment Confirmation &amp; Invoice</p>
          </td>
        </tr>

        <!-- Plan Badge -->
        <tr>
          <td style="padding:32px 32px 0;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid ${color}44;border-radius:50px;padding:10px 24px;">
              <span style="color:${color};font-size:16px;font-weight:700;letter-spacing:0.5px;">✦ ${planLabel}</span>
            </div>
            <h1 style="color:#f1f1f1;font-size:28px;font-weight:800;margin:16px 0 4px;">Payment Successful!</h1>
            <p style="color:#aaa;font-size:14px;margin:0;">Thank you for upgrading. Your plan is now active.</p>
          </td>
        </tr>

        <!-- Invoice Details -->
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border-radius:12px;overflow:hidden;">
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="padding:14px 20px;color:#aaa;font-size:13px;">Invoice Number</td>
                <td style="padding:14px 20px;color:#f1f1f1;font-size:13px;font-weight:600;text-align:right;">${invoiceNumber}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="padding:14px 20px;color:#aaa;font-size:13px;">Transaction ID</td>
                <td style="padding:14px 20px;color:#f1f1f1;font-size:13px;font-weight:600;text-align:right;">${data.orderId}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="padding:14px 20px;color:#aaa;font-size:13px;">Date &amp; Time</td>
                <td style="padding:14px 20px;color:#f1f1f1;font-size:13px;font-weight:600;text-align:right;">${data.transactionDate}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="padding:14px 20px;color:#aaa;font-size:13px;">Plan</td>
                <td style="padding:14px 20px;font-size:13px;font-weight:700;text-align:right;color:${color};">${planLabel}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                <td style="padding:14px 20px;color:#aaa;font-size:13px;">Watch Time</td>
                <td style="padding:14px 20px;color:#f1f1f1;font-size:13px;font-weight:600;text-align:right;">${watchTime}</td>
              </tr>
              <tr>
                <td style="padding:16px 20px;color:#f1f1f1;font-size:15px;font-weight:700;">Total Paid</td>
                <td style="padding:16px 20px;color:#4ade80;font-size:20px;font-weight:800;text-align:right;">₹${data.amount}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Features -->
        <tr>
          <td style="padding:0 32px 24px;">
            <p style="color:#aaa;font-size:12px;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">What's included</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;color:#f1f1f1;font-size:13px;">✓ &nbsp;Watch videos up to <strong>${watchTime}</strong></td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#f1f1f1;font-size:13px;">✓ &nbsp;${data.plan === 'gold' ? 'Unlimited downloads' : '1 free download per day'}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#f1f1f1;font-size:13px;">✓ &nbsp;${planLabel} badge on profile</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="color:#717171;font-size:12px;margin:0;">
              This is an auto-generated invoice. Please keep it for your records.<br/>
              For support, reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, plan, amount, orderId, transactionDate } = body as {
      email: string;
      plan: string;
      amount: number;
      orderId: string;
      transactionDate: string;
    };

    if (!email || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let transporter: nodemailer.Transporter;

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      // Production: use Gmail SMTP
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });
    } else {
      // Development: use Ethereal fake SMTP
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    }

    const planLabel = PLAN_LABELS[plan] || plan;
    const htmlBody = buildInvoiceHtml({ email, plan, amount, orderId, transactionDate });

    const info = await transporter.sendMail({
      from: gmailUser ? `"YouTube Clone" <${gmailUser}>` : '"YouTube Clone" <noreply@ytclone.dev>',
      to: email,
      subject: `✅ Payment Confirmed – ${planLabel} | YouTube Clone`,
      html: htmlBody,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Invoice email preview URL:', previewUrl);
    }

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ error: 'Failed to send invoice email' }, { status: 500 });
  }
}
