'use client';
import { useEffect } from 'react';
import { useVoIP } from '@/context/VoIPContext';
import VoIPModal from '@/components/VoIPModal/VoIPModal';

export default function CallPage() {
  const { callStatus } = useVoIP();

  useEffect(() => {
    // This page acts as the "second peer" in multi-tab testing.
    // The VoIPContext automatically listens for incoming offers via BroadcastChannel.
    document.title = 'Call Room — YouTube Clone';
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d0d1a',
      color: '#f1f1f1',
      fontFamily: 'Roboto, sans-serif',
      gap: '16px',
      padding: '40px 20px',
    }}>
      {callStatus === 'idle' ? (
        <>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.86-1.86a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
            Call Room
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 360, textAlign: 'center', margin: 0, lineHeight: 1.7 }}>
            Waiting for an incoming call…
          </p>
          <p style={{
            marginTop: 8,
            fontSize: 13,
            color: 'rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.05)',
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            maxWidth: 400,
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            In the <strong style={{ color: 'rgba(255,255,255,0.6)' }}>other tab</strong>, click the 📞 icon in the header, select a friend, and press&nbsp;
            <strong style={{ color: '#818cf8' }}>Call</strong> to initiate a call to this tab.
          </p>

          <div style={{
            display: 'flex',
            gap: 10,
            marginTop: 8,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {[
              { icon: '🎥', text: 'Video call' },
              { icon: '🖥️', text: 'Screen share' },
              { icon: '⏺️', text: 'Record session' },
            ].map(({ icon, text }) => (
              <span key={text} style={{
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 13,
                color: '#c7d2fe',
              }}>
                {icon} {text}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
          Call active — see the overlay
        </p>
      )}

      {/* VoIPModal renders above everything */}
      <VoIPModal />
    </div>
  );
}
