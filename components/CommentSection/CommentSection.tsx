'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Comment } from '@/types';
import {
  ThumbsUp, ThumbsDown, ChevronDown, ChevronUp,
  Languages, MapPin, X, RotateCcw,
} from 'lucide-react';
import styles from './CommentSection.module.css';

// ── helpers ────────────────────────────────────────────────────────────────

const SPECIAL_CHAR_RE = /[^a-zA-Z0-9\u00C0-\u024F\s.,!?'"\-:;()]/;
const hasSpecialChars = (text: string) => SPECIAL_CHAR_RE.test(text);

const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi',      flag: '🇮🇳' },
  { code: 'ta', label: 'Tamil',      flag: '🇮🇳' },
  { code: 'te', label: 'Telugu',     flag: '🇮🇳' },
  { code: 'es', label: 'Spanish',    flag: '🇪🇸' },
  { code: 'fr', label: 'French',     flag: '🇫🇷' },
  { code: 'de', label: 'German',     flag: '🇩🇪' },
  { code: 'zh', label: 'Chinese',    flag: '🇨🇳' },
  { code: 'ar', label: 'Arabic',     flag: '🇸🇦' },
  { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru', label: 'Russian',    flag: '🇷🇺' },
  { code: 'ja', label: 'Japanese',   flag: '🇯🇵' },
];

const MOCK_TRANSLATIONS: Record<string, string> = {
  hi: 'यह हिंदी में एक सिमुलेटेड अनुवाद है।',
  ta: 'இது தமிழில் ஒரு உருவகப்படுத்தப்பட்ட மொழிபெயர்ப்பு.',
  te: 'ఇది తెలుగులో అనుకరించిన అనువాదం.',
  es: 'Esta es una traducción simulada al español.',
  fr: 'Ceci est une traduction simulée en français.',
  de: 'Dies ist eine simulierte Übersetzung ins Deutsche.',
  zh: '这是一个模拟的中文翻译。',
  ar: 'هذه ترجمة محاكاة إلى العربية.',
  pt: 'Esta é uma tradução simulada para o português.',
  ru: 'Это симулированный перевод на русский язык.',
  ja: 'これは日本語への模擬翻訳です。',
};

function simulateTranslate(text: string, lang: string): string {
  if (lang === 'en') return text;
  const t = MOCK_TRANSLATIONS[lang];
  if (!t) return text;
  return `${t}\n[Original: "${text.slice(0, 80)}${text.length > 80 ? '…' : ''}"]`;
}

// ── CommentItem ────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment: Comment;
  isReply?: boolean;
  onRemove: (id: string) => void;
}

function CommentItem({ comment, isReply = false, onRemove }: CommentItemProps) {
  const [liked,          setLiked]          = useState(false);
  const [disliked,       setDisliked]       = useState(false);
  const [likeCount,      setLikeCount]      = useState(comment.likeCount);
  const [dislikeCount,   setDislikeCount]   = useState(comment.dislikes);
  const [showReplies,    setShowReplies]    = useState(false);

  // Translate state
  const [showTranslator, setShowTranslator] = useState(false);
  const [selectedLang,   setSelectedLang]   = useState('en');
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating,  setIsTranslating]  = useState(false);

  // Close dropdown when clicking outside
  const translatorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showTranslator) return;
    const handler = (e: MouseEvent) => {
      if (translatorRef.current && !translatorRef.current.contains(e.target as Node)) {
        setShowTranslator(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTranslator]);

  // ── handlers ──────────────────────────────────────────────

  const handleLike = () => {
    if (liked) { setLiked(false); setLikeCount(c => c - 1); }
    else {
      setLiked(true); setLikeCount(c => c + 1);
      if (disliked) { setDisliked(false); setDislikeCount(c => c - 1); }
    }
  };

  const handleDislike = () => {
    if (disliked) { setDisliked(false); setDislikeCount(c => c - 1); }
    else {
      setDisliked(true);
      const n = dislikeCount + 1;
      setDislikeCount(n);
      if (liked) { setLiked(false); setLikeCount(c => c - 1); }
      if (n >= 2) setTimeout(() => onRemove(comment.id), 600);
    }
  };

  const toggleTranslator = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTranslator(v => !v);
  };

  const closeTranslator = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTranslator(false);
    setTranslatedText(null);
    setSelectedLang('en');
  };

  const pickLanguage = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    setSelectedLang(code);
    if (code === 'en') { setTranslatedText(null); return; }
    setIsTranslating(true);
    setTimeout(() => {
      setTranslatedText(simulateTranslate(comment.text, code));
      setIsTranslating(false);
    }, 700);
  };

  const resetTranslation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTranslatedText(null);
    setSelectedLang('en');
  };

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  const activeLangLabel = LANGUAGES.find(l => l.code === selectedLang)?.label ?? 'English';

  return (
    <div className={`${styles.comment} ${isReply ? styles.reply : ''}`}>
      <img src={comment.avatar} alt={comment.author} className={styles.avatar}
        width={isReply ? 28 : 40} height={isReply ? 28 : 40} />

      <div className={styles.body}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.author}>{comment.author}</span>
          <span className={styles.time}>{comment.postedAt}</span>
          {comment.city && (
            <span className={styles.city}><MapPin size={11} />{comment.city}</span>
          )}
        </div>

        {/* Comment text */}
        <p className={styles.text}>{comment.text}</p>

        {/* Translation result (shown inline below text) */}
        {translatedText && !isTranslating && (
          <div className={styles.translationResult}>
            <div className={styles.translationResultHeader}>
              <span>Translated to {activeLangLabel}</span>
              <button className={styles.resetTranslation} onClick={resetTranslation} type="button">
                <RotateCcw size={11} /> Show original
              </button>
            </div>
            <p className={styles.translationResultText}>{translatedText}</p>
          </div>
        )}

        {/* Translating spinner */}
        {isTranslating && (
          <div className={styles.translatingSpinner}>
            <div className={styles.spinnerDot} />
            <div className={styles.spinnerDot} />
            <div className={styles.spinnerDot} />
            <span>Translating to {activeLangLabel}…</span>
          </div>
        )}

        {/* ── Actions row ─────────────────────────────────── */}
        <div className={styles.actions}>
          {/* Like */}
          <button className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
            onClick={handleLike} type="button" aria-label="Like comment">
            <ThumbsUp size={14} /><span>{fmt(likeCount)}</span>
          </button>

          {/* Dislike */}
          <button
            className={`${styles.actionBtn} ${disliked ? styles.disliked : ''}`}
            onClick={handleDislike} type="button" aria-label="Dislike comment"
            title={`${dislikeCount} dislike${dislikeCount !== 1 ? 's' : ''} — auto-removed at 2`}
          >
            <ThumbsDown size={14} />
            {dislikeCount > 0 && <span>{dislikeCount}</span>}
          </button>

          {/* Translate toggle button only */}
          <button
            className={`${styles.actionBtn} ${showTranslator ? styles.translateActive : ''}`}
            onClick={toggleTranslator}
            type="button"
            aria-label="Translate comment"
            aria-expanded={showTranslator}
          >
            <Languages size={14} /><span>Translate</span>
          </button>

          {/* Reply */}
          <button className={styles.replyBtn} type="button">Reply</button>
        </div>

        {/* ── Translator panel (inline, NOT absolute) ──────── */}
        {showTranslator && (
          <div className={styles.translatorPanel} ref={translatorRef}>
            {/* Header */}
            <div className={styles.translatorPanelHeader}>
              <Languages size={13} />
              <span>Translate to</span>
              <button className={styles.translatorClose} onClick={closeTranslator} type="button">
                <X size={13} />
              </button>
            </div>

            {/* Language chips */}
            <div className={styles.langGrid}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  className={`${styles.langChip} ${selectedLang === lang.code ? styles.langChipActive : ''}`}
                  onClick={(e) => pickLanguage(e, lang.code)}
                  disabled={isTranslating}
                >
                  {lang.flag} {lang.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className={styles.repliesSection}>
            <button className={styles.toggleReplies} type="button"
              onClick={() => setShowReplies(v => !v)}>
              {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
            {showReplies && (
              <div className={styles.repliesList}>
                {comment.replies.map(reply => (
                  <CommentItem key={reply.id} comment={reply} isReply onRemove={onRemove} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── CommentSection ─────────────────────────────────────────────────────────

interface CommentSectionProps {
  comments: Comment[];
  commentCount?: string;
}

let nextId = 100;

export default function CommentSection({
  comments: initialComments,
  commentCount = '0',
}: CommentSectionProps) {
  const [commentList, setCommentList] = useState<Comment[]>(initialComments);
  const [newComment,  setNewComment]  = useState('');
  const [isTyping,    setIsTyping]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null);

  const handleRemove = useCallback((id: string) => {
    setCommentList(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleSubmit = () => {
    const text = newComment.trim();
    if (!text) return;
    if (hasSpecialChars(text)) {
      setError('Special characters are not allowed. Please use only letters, numbers, and basic punctuation.');
      return;
    }
    const comment: Comment = {
      id: `c${++nextId}`,
      author: 'You',
      avatar: 'https://picsum.photos/seed/currentuser/40/40',
      text,
      likes: '0',
      likeCount: 0,
      dislikes: 0,
      city: 'Your City',
      language: 'en',
      postedAt: 'Just now',
    };
    setCommentList(prev => [comment, ...prev]);
    setNewComment('');
    setIsTyping(false);
    setError(null);
    setSuccessMsg('Comment posted!');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  return (
    <section id="comment-section" className={styles.section}>
      <h2 className={styles.heading}>{commentCount} Comments</h2>

      {/* Add comment */}
      <div className={styles.addComment}>
        <div className={styles.userAvatar}>
          <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
        <div className={styles.inputWrapper}>
          <input
            id="comment-input"
            type="text"
            placeholder="Add a comment… (no special characters)"
            value={newComment}
            onChange={e => { setNewComment(e.target.value); setError(null); }}
            onFocus={() => setIsTyping(true)}
            onBlur={() => !newComment && setIsTyping(false)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className={styles.input}
          />
          {error && (
            <div className={styles.errorMsg}>
              <X size={13} /> {error}
            </div>
          )}
          {successMsg && <div className={styles.successMsg}>{successMsg}</div>}
          {isTyping && (
            <div className={styles.inputActions}>
              <button className={styles.cancelBtn} type="button"
                onClick={() => { setNewComment(''); setIsTyping(false); setError(null); }}>
                Cancel
              </button>
              <button
                id="comment-submit-btn"
                className={`${styles.submitBtn} ${newComment ? styles.active : ''}`}
                disabled={!newComment}
                onClick={handleSubmit}
                type="button"
              >
                Comment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Moderation notice */}
      <div className={styles.moderationNotice}>
        <span>🛡️ Comments with special characters are automatically blocked. Comments with 2+ dislikes are removed.</span>
      </div>

      {/* Comments list */}
      <div className={styles.list}>
        {commentList.map(comment => (
          <CommentItem key={comment.id} comment={comment} onRemove={handleRemove} />
        ))}
      </div>
    </section>
  );
}
