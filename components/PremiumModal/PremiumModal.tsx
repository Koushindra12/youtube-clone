'use client';
import { useState, useEffect } from 'react';
import { X, Crown, Zap, Clock, Infinity as InfinityIcon, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useUser, UserPlan, PLAN_PRICES, PLAN_WATCH_LIMITS } from '@/context/UserContext';
import styles from './PremiumModal.module.css';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

interface PlanConfig {
  key: Exclude<UserPlan, 'free'>;
  label: string;
  price: number;
  watchTime: string;
  color: string;
  gradient: string;
  badge: string;
  features: string[];
  icon: React.ReactNode;
}

const PLANS: PlanConfig[] = [
  {
    key: 'bronze',
    label: 'Bronze',
    price: PLAN_PRICES.bronze,
    watchTime: '7 min / video',
    color: '#cd7f32',
    gradient: 'linear-gradient(135deg, #cd7f32, #a0522d)',
    badge: '🥉',
    features: ['7 min watch time', '1 download/day', 'Bronze badge'],
    icon: <Crown size={18} />,
  },
  {
    key: 'silver',
    label: 'Silver',
    price: PLAN_PRICES.silver,
    watchTime: '10 min / video',
    color: '#a8a9ad',
    gradient: 'linear-gradient(135deg, #c0c0c0, #808080)',
    badge: '🥈',
    features: ['10 min watch time', '1 download/day', 'Silver badge'],
    icon: <Zap size={18} />,
  },
  {
    key: 'gold',
    label: 'Gold',
    price: PLAN_PRICES.gold,
    watchTime: 'Unlimited',
    color: '#ffd700',
    gradient: 'linear-gradient(135deg, #ffd700, #ff8c00)',
    badge: '🥇',
    features: ['Unlimited watch time', 'Unlimited downloads', 'Gold badge'],
    icon: <InfinityIcon size={18} />,
  },
];

export default function PremiumModal() {
  const { showPremiumModal, setShowPremiumModal, upgradeToPlan, plan: currentPlan, watchLimitMinutes } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<Exclude<UserPlan, 'free'>>('gold');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<PlanConfig | null>(null);
  const [error, setError] = useState('');

  // Load Razorpay script
  useEffect(() => {
    if (!showPremiumModal) return;
    if (document.getElementById('razorpay-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, [showPremiumModal]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowPremiumModal(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setShowPremiumModal]);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handlePayment = async () => {
    setEmailError('');
    setError('');

    if (!email.trim()) {
      setEmailError('Email is required to receive your invoice.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const chosenPlan = PLANS.find((p) => p.key === selectedPlan)!;

    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();

      const onSuccess = async (orderId: string) => {
        upgradeToPlan(selectedPlan, email.trim());
        setSuccess(chosenPlan);

        // Send invoice email
        await fetch('/api/payment/send-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            plan: selectedPlan,
            amount: chosenPlan.price,
            orderId,
            transactionDate: new Date().toLocaleString('en-IN', {
              dateStyle: 'long',
              timeStyle: 'short',
            }),
          }),
        }).catch((e) => console.warn('Invoice email failed:', e));
      };

      if (data.mock) {
        // Demo mode — simulate success
        await onSuccess(data.orderId);
        setLoading(false);
        return;
      }

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded. Please try again.');
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'YouTube Clone',
        description: `${chosenPlan.label} Plan – ${chosenPlan.watchTime} watch time`,
        order_id: data.orderId,
        image: '/favicon.ico',
        prefill: { name: 'User', email: email.trim(), contact: '9999999999' },
        theme: { color: chosenPlan.color },
        handler: async () => {
          await onSuccess(data.orderId);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp: { error: { description: string } }) => {
        setError(resp.error.description || 'Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (success) {
      setSuccess(null);
      setEmail('');
      setEmailError('');
      setError('');
    }
    setShowPremiumModal(false);
  };

  if (!showPremiumModal) return null;

  // Filter out plans the user already has or below
  const planOrder: UserPlan[] = ['free', 'bronze', 'silver', 'gold'];
  const currentIdx = planOrder.indexOf(currentPlan);
  const availablePlans = PLANS.filter((p) => planOrder.indexOf(p.key) > currentIdx);

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
          <X size={20} />
        </button>

        {success ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={56} />
            </div>
            <div className={styles.successBadge} style={{ color: success.color }}>
              {success.badge} {success.label} Plan Activated!
            </div>
            <h2>Welcome to {success.label}!</h2>
            <p>
              You can now watch videos for{' '}
              <strong style={{ color: success.color }}>{success.watchTime}</strong>.
              <br />
              Your invoice has been sent to your email.
            </p>
            <div className={styles.successDetails}>
              <Clock size={14} />
              <span>Watch limit: {success.watchTime}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.crownBadge}>
                <Crown size={28} />
              </div>
              <h2 className={styles.title}>Upgrade Your Plan</h2>
              <p className={styles.subtitle}>
                {currentPlan === 'free'
                  ? `You're on the Free plan — limited to ${PLAN_WATCH_LIMITS.free} min per video.`
                  : `You're on ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} — watch up to ${watchLimitMinutes} min per video.`}
                <br />
                Choose a plan to unlock more watch time.
              </p>
            </div>

            {/* Plan Cards */}
            {availablePlans.length === 0 ? (
              <div className={styles.maxPlanNote}>
                <CheckCircle2 size={32} style={{ color: '#ffd700' }} />
                <p>You&apos;re already on the Gold plan — enjoy unlimited watch time! 🎉</p>
              </div>
            ) : (
              <>
                <div className={styles.planGrid}>
                  {availablePlans.map((p) => (
                    <button
                      key={p.key}
                      className={`${styles.planCard} ${selectedPlan === p.key ? styles.planCardSelected : ''}`}
                      onClick={() => setSelectedPlan(p.key)}
                      style={selectedPlan === p.key ? { '--plan-color': p.color } as React.CSSProperties : {}}
                      id={`plan-${p.key}-btn`}
                    >
                      <div className={styles.planBadgeIcon} style={{ background: p.gradient }}>
                        {p.icon}
                      </div>
                      <div className={styles.planCardLabel}>{p.badge} {p.label}</div>
                      <div className={styles.planCardPrice}>
                        <span className={styles.planCurrency}>₹</span>
                        <span className={styles.planAmount}>{p.price}</span>
                      </div>
                      <div className={styles.planCardWatch} style={{ color: p.color }}>
                        <Clock size={13} /> {p.watchTime}
                      </div>
                      <ul className={styles.planFeatureList}>
                        {p.features.map((f) => (
                          <li key={f}><CheckCircle2 size={12} /> {f}</li>
                        ))}
                      </ul>
                      {selectedPlan === p.key && (
                        <div className={styles.selectedRing} style={{ borderColor: p.color }} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Email Input */}
                <div className={styles.emailGroup}>
                  <label className={styles.emailLabel} htmlFor="invoice-email">
                    <Mail size={14} /> Email for invoice
                  </label>
                  <input
                    id="invoice-email"
                    type="email"
                    className={`${styles.emailInput} ${emailError ? styles.emailInputError : ''}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    autoComplete="email"
                  />
                  {emailError && <p className={styles.emailErrorMsg}>{emailError}</p>}
                </div>

                {/* Error */}
                {error && <p className={styles.error}>{error}</p>}

                {/* CTA */}
                {(() => {
                  const chosen = PLANS.find((p) => p.key === selectedPlan)!;
                  return (
                    <button
                      className={styles.payBtn}
                      style={{ background: chosen.gradient }}
                      onClick={handlePayment}
                      disabled={loading}
                      id="premium-pay-btn"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={18} className={styles.spinner} />
                          Processing…
                        </>
                      ) : (
                        <>
                          {chosen.icon}
                          Upgrade to {chosen.label} – ₹{chosen.price}
                        </>
                      )}
                    </button>
                  );
                })()}

                <p className={styles.testNote}>
                  🔒 Secure payment via Razorpay &nbsp;|&nbsp; Test mode active
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
