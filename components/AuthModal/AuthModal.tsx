'use client';
import { useState, useRef, useEffect } from 'react';
import { Mail, Smartphone, Shield, ArrowRight, CheckCircle, RefreshCw, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './AuthModal.module.css';

type Step = 'contact' | 'otp' | 'success';

export default function AuthModal() {
  const { showAuthModal, otpChannel, isSouthIndia, sendOtp, verifyOtp } = useAuth();
  const { userState } = useTheme();

  const [step, setStep] = useState<Step>('contact');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showOtp, setShowOtp] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  if (!showAuthModal) return null;

  const label = otpChannel === 'email' ? 'Email address' : 'Mobile number';
  const placeholder = otpChannel === 'email' ? 'you@example.com' : '+91 9876543210';
  const Icon = otpChannel === 'email' ? Mail : Smartphone;

  const stateDisplay = userState
    ? userState.replace(/\b\w/g, (c) => c.toUpperCase())
    : 'your region';

  const handleSendOtp = async () => {
    setError('');
    if (!contact.trim()) {
      setError(`Please enter your ${label.toLowerCase()}`);
      return;
    }
    if (otpChannel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      setError('Please enter a valid email address');
      return;
    }
    if (otpChannel === 'mobile' && !/^[+\d\s\-()]{7,15}$/.test(contact)) {
      setError('Please enter a valid mobile number');
      return;
    }

    setLoading(true);
    await sendOtp(contact);
    setLoading(false);
    setStep('otp');
    setResendTimer(30);
    // Show dev OTP from console for demo
    setTimeout(() => {
      // Access from console — dev hint
      setDevOtp('Check browser console for OTP');
    }, 900);
    setTimeout(() => otpRefs.current[0]?.focus(), 200);
  };

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    setError('');
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      e.preventDefault();
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setError('');
    const valid = verifyOtp(code);
    if (!valid) {
      setError('Invalid OTP. Please check and try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } else {
      setStep('success');
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '', '', '']);
    setError('');
    setLoading(true);
    await sendOtp(contact);
    setLoading(false);
    setResendTimer(30);
    setTimeout(() => otpRefs.current[0]?.focus(), 200);
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Sign in">
      <div className={styles.modal}>
        {/* Decorative glow blobs */}
        <div className={styles.blob1} />
        <div className={styles.blob2} />

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoMark}>
            <Shield size={22} />
          </div>
          <div>
            <h1 className={styles.title}>
              {step === 'success' ? 'You\'re in!' : 'Verify your identity'}
            </h1>
            <p className={styles.subtitle}>
              {step === 'contact' && (
                <>
                  {isSouthIndia ? (
                    <>
                      <span className={styles.regionBadge}>📍 {stateDisplay}</span>
                      {' '}— OTP will be sent to your <strong>email</strong>
                    </>
                  ) : (
                    <>
                      <span className={styles.regionBadge}>📍 {stateDisplay}</span>
                      {' '}— OTP will be sent to your <strong>mobile</strong>
                    </>
                  )}
                </>
              )}
              {step === 'otp' && `Enter the 6-digit OTP sent to ${contact}`}
              {step === 'success' && 'Authentication successful. Welcome!'}
            </p>
          </div>
        </div>

        {/* Step: Contact Input */}
        {step === 'contact' && (
          <div className={styles.body}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="auth-contact">
                <Icon size={14} /> {label}
              </label>
              <input
                id="auth-contact"
                className={styles.input}
                type={otpChannel === 'email' ? 'email' : 'tel'}
                placeholder={placeholder}
                value={contact}
                onChange={(e) => { setContact(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                autoComplete={otpChannel === 'email' ? 'email' : 'tel'}
                autoFocus
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              id="auth-send-otp-btn"
              className={styles.primaryBtn}
              onClick={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner} />
              ) : (
                <>
                  Send OTP <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className={styles.channelInfo}>
              <div className={styles.channelCard}>
                <Icon size={16} className={styles.channelIcon} />
                <div>
                  <p className={styles.channelCardTitle}>
                    {otpChannel === 'email' ? 'Email OTP' : 'Mobile OTP'}
                  </p>
                  <p className={styles.channelCardDesc}>
                    {otpChannel === 'email'
                      ? 'Used because you\'re in South India (Tamil Nadu, Kerala, Karnataka, AP, or Telangana)'
                      : 'Used because you\'re outside South India or location was not detected'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: OTP Verification */}
        {step === 'otp' && (
          <div className={styles.body}>
            <p className={styles.otpHint}>
              OTP sent to <strong>{contact}</strong> via {otpChannel}
            </p>
            {devOtp && (
              <div className={styles.devBanner}>
                🛠️ Dev mode: {devOtp}
              </div>
            )}

            <div className={styles.otpRow} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  id={`otp-digit-${i}`}
                  className={`${styles.otpBox} ${error ? styles.otpError : ''} ${digit ? styles.otpFilled : ''}`}
                  type={showOtp ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKey(i, e)}
                  autoComplete="one-time-code"
                />
              ))}
              <button
                className={styles.toggleOtpBtn}
                onClick={() => setShowOtp((v) => !v)}
                title={showOtp ? 'Hide OTP' : 'Show OTP'}
                type="button"
              >
                {showOtp ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button
              id="auth-verify-btn"
              className={styles.primaryBtn}
              onClick={handleVerify}
              disabled={otp.join('').length < 6}
            >
              Verify OTP <CheckCircle size={16} />
            </button>

            <div className={styles.resendRow}>
              <button
                className={styles.resendBtn}
                onClick={handleResend}
                disabled={resendTimer > 0 || loading}
              >
                <RefreshCw size={13} />
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
              <button
                className={styles.changeContact}
                onClick={() => { setStep('contact'); setOtp(['', '', '', '', '', '']); setError(''); }}
              >
                Change {otpChannel === 'email' ? 'email' : 'number'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className={styles.successBody}>
            <div className={styles.successIcon}>
              <CheckCircle size={48} />
            </div>
            <p className={styles.successText}>
              Verified via <strong>{otpChannel}</strong>
            </p>
            <p className={styles.successSub}>
              Redirecting you to the app…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
