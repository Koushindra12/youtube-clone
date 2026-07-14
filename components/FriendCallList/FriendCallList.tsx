'use client';
import { Phone, X, Users } from 'lucide-react';
import { useVoIP, MOCK_FRIENDS, Friend } from '@/context/VoIPContext';
import styles from './FriendCallList.module.css';

export default function FriendCallList() {
  const { showFriendList, setShowFriendList, initiateCall, callStatus } = useVoIP();

  if (!showFriendList) return null;

  const handleCall = async (friend: Friend) => {
    await initiateCall(friend);
  };

  const onlineFirst = [...MOCK_FRIENDS].sort((a, b) =>
    Number(b.online) - Number(a.online)
  );

  return (
    <>
      {/* Transparent backdrop to close panel */}
      <div
        className={styles.backdrop}
        onClick={() => setShowFriendList(false)}
        aria-hidden="true"
      />

      <aside className={styles.panel} role="dialog" aria-label="Friends — Start a Call">
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>
            <Users size={18} />
            Start a Call
          </h2>
          <button
            className={styles.closeBtn}
            onClick={() => setShowFriendList(false)}
            aria-label="Close friend list"
            id="friendlist-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        <p className={styles.sectionLabel}>Friends</p>

        <ul className={styles.list} role="list">
          {onlineFirst.map((friend) => (
            <li key={friend.id} className={styles.friendItem}>
              <div className={styles.avatarWrap}>
                <div
                  className={styles.avatar}
                  style={{ background: friend.avatarColor }}
                  aria-hidden="true"
                >
                  {friend.avatar}
                </div>
                <span
                  className={friend.online ? styles.onlineDot : styles.offlineDot}
                  title={friend.online ? 'Online' : 'Offline'}
                />
              </div>

              <div className={styles.friendInfo}>
                <p className={styles.friendName}>{friend.name}</p>
                <p className={`${styles.friendStatus} ${friend.online ? styles.online : ''}`}>
                  {friend.online ? 'Active now' : 'Offline'}
                </p>
              </div>

              <button
                className={styles.callBtn}
                onClick={() => handleCall(friend)}
                disabled={!friend.online || callStatus !== 'idle'}
                aria-label={`Call ${friend.name}`}
                id={`call-btn-${friend.id}`}
                title={
                  !friend.online
                    ? `${friend.name} is offline`
                    : callStatus !== 'idle'
                    ? 'A call is already in progress'
                    : `Call ${friend.name}`
                }
              >
                <Phone size={16} />
              </button>
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          <p className={styles.footerNote}>
            Open a second browser tab to simulate the other participant receiving the call.
          </p>
        </div>
      </aside>
    </>
  );
}
