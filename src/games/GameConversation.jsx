import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import CuOwl from '../components/CuOwl';

const API_BASE = import.meta.env.VITE_API_URL || '';

const TOPICS = [
  { id: 'free',    emoji: '💬', label: 'Tự do'     },
  { id: 'school',  emoji: '🏫', label: 'Trường học' },
  { id: 'animals', emoji: '🐾', label: 'Động vật'   },
  { id: 'food',    emoji: '🍎', label: 'Đồ ăn'      },
  { id: 'family',  emoji: '👨‍👩‍👧', label: 'Gia đình'  },
];

const LEVELS = ['A1', 'A2', 'B1', 'B2'];

const LEVEL_COLORS = { A1: '#26d0a6', A2: '#5ec8f8', B1: '#f59e0b', B2: '#ef4444' };

const TOPIC_CONTEXT = {
  free:    'any topic the child brings up',
  school:  'school life: subjects, teachers, homework, classroom',
  animals: 'animals: their sounds, habitats, and fun facts',
  food:    'food: meals, fruits, vegetables, cooking',
  family:  'family: parents, siblings, home life, daily routines',
};

function buildSystemPrompt(topicId, level) {
  const ctx = TOPIC_CONTEXT[topicId] || 'any topic';
  const guides = {
    A1: `Use ONLY very basic vocabulary (colors, numbers, animals, food, family). Present simple tense ONLY. Max 1 short sentence per reply. Never use difficult words. Speak like to a complete beginner. Example style: "I like cats. Do you like cats?"`,
    A2: `Use simple everyday vocabulary. Present and past simple tense. 1-2 short sentences. Use basic connectors: and, but, because. Example style: "That's great! I went to school yesterday. What did you study today?"`,
    B1: `Use varied vocabulary. Mix present, past, future tenses. 2-3 sentences. Ask for opinions and reasons. Use some interesting words but explain them if needed. Challenge the student to express ideas.`,
    B2: `Use rich vocabulary including some idioms. Complex sentences with subordinate clauses. 2-3 sentences. Discuss opinions, hypotheticals, and nuanced ideas. Introduce new vocabulary in context. Push the student to think and express themselves precisely.`,
  };
  return `You are Cú, a friendly English tutor owl for Vietnamese children aged 6-12. Topic: ${ctx}. ${guides[level] || guides.A1} Always end with exactly one question. If the child makes a grammar mistake, gently correct it in a fun way.`;
}

const MAX_MESSAGES = 20;

function detectExpression(text) {
  if (/great|excellent|perfect|awesome|wonderful|amazing|fantastic|bravo|well done|good job/i.test(text)) return 'happy';
  if (/\?/.test(text) && !/\!/.test(text)) return 'thinking';
  if (/hello|hi |hey |welcome|nice to meet/i.test(text)) return 'happy';
  return 'idle';
}

const WORD_RE = /\b(cat|dog|bird|fish|apple|orange|banana|school|house|book|food|family|play|run|jump|happy|big|small|red|blue|green|hot|cold|good|bad|yes|no|hello|hi|bye|please|thank|sorry|help|walk|talk|eat|drink|sleep|read|write|draw|sing|dance|swim|fly|go|come|see|look|know|like|love|want|need|have|give|take|make|think|say|ask|hear|feel|try|learn|study|live|home|mom|dad|sister|brother|friend|teacher|color|animal|tree|sun|moon|star|water|flower|rain|car|bus|train|plane|egg|milk|bread|rice|chicken|elephant|lion|tiger|monkey|rabbit|duck|bear|fox|owl|table|chair|bed|door|window|room|garden|park|city)\b/gi;
function extractWords(text) {
  return [...new Set((text.match(WORD_RE) || []).map(w => w.toLowerCase()))].slice(0, 4);
}

// Split text into plain + corrected segments based on AI grammar corrections
function splitWithCorrections(text, corrections) {
  if (!corrections || corrections.length === 0) return [{ type: 'plain', text }];
  // Find non-overlapping match positions, longest first
  const sorted = [...corrections].sort((a, b) => b.original.length - a.original.length);
  const marks = []; // [{start, end, correctionIdx}]
  for (const c of sorted) {
    const realIdx = corrections.indexOf(c);
    let from = 0;
    while (from < text.length) {
      const at = text.indexOf(c.original, from);
      if (at < 0) break;
      // Check overlap
      const overlap = marks.some(m => !(m.end <= at || m.start >= at + c.original.length));
      if (!overlap) {
        marks.push({ start: at, end: at + c.original.length, correctionIdx: realIdx });
        break; // mark only first occurrence per correction
      }
      from = at + 1;
    }
  }
  marks.sort((a, b) => a.start - b.start);
  const segments = [];
  let cursor = 0;
  for (const m of marks) {
    if (m.start > cursor) segments.push({ type: 'plain', text: text.slice(cursor, m.start) });
    segments.push({ type: 'error', text: text.slice(m.start, m.end), correctionIdx: m.correctionIdx });
    cursor = m.end;
  }
  if (cursor < text.length) segments.push({ type: 'plain', text: text.slice(cursor) });
  return segments;
}

const CSS = `
@keyframes cu-panel-in {
  from { opacity:0; transform: translateY(24px) scale(0.97); }
  to   { opacity:1; transform: translateY(0)    scale(1); }
}
@keyframes cu-panel-out {
  from { opacity:1; transform: translateY(0)    scale(1); }
  to   { opacity:0; transform: translateY(24px) scale(0.97); }
}
.cu-panel-in  { animation: cu-panel-in  0.28s cubic-bezier(0.22,1,0.36,1) forwards; }
.cu-panel-out { animation: cu-panel-out 0.22s cubic-bezier(0.55,0,1,0.45) forwards; }

@keyframes cu-msg-in {
  from { opacity:0; transform: translateY(8px); }
  to   { opacity:1; transform: translateY(0); }
}
.cu-msg-in { animation: cu-msg-in 0.2s ease-out forwards; }

@keyframes cu-wave-bar {
  0%,100% { height:6px;  }
  50%     { height:20px; }
}
.cu-wbar { animation: cu-wave-bar 0.55s ease-in-out infinite; width:4px; border-radius:3px; background:#ef4444; }
.cu-wbar:nth-child(2){animation-delay:.1s}
.cu-wbar:nth-child(3){animation-delay:.2s}
.cu-wbar:nth-child(4){animation-delay:.3s}
.cu-wbar:nth-child(5){animation-delay:.15s}

@keyframes cu-dot-bounce {
  0%,80%,100%{transform:translateY(0);opacity:.4}
  40%{transform:translateY(-4px);opacity:1}
}
.cu-dot2{width:7px;height:7px;border-radius:50%;background:#9d6bff;animation:cu-dot-bounce 1.2s infinite;display:inline-block;}
.cu-dot2:nth-child(2){animation-delay:.18s}.cu-dot2:nth-child(3){animation-delay:.36s}

@keyframes cu-mic-pulse {
  0%  { transform:scale(1);   opacity:.5; }
  100%{ transform:scale(1.7); opacity:0; }
}
.cu-mic-pulse {
  position:absolute; inset:-6px; border-radius:50%;
  border:2.5px solid #ef4444;
  animation: cu-mic-pulse 1s ease-out infinite;
  pointer-events:none;
}
`;
let cssInjected = false;
function injectCss() {
  if (cssInjected) return;
  const el = document.createElement('style'); el.textContent = CSS;
  document.head.appendChild(el); cssInjected = true;
}

export default function GameConversation({ onBack }) {
  const { speak, showToast, currentProfile } = useGame();

  const defaultLevel = LEVELS.includes(currentProfile?.cefrLevel) ? currentProfile.cefrLevel : 'A1';

  const [topicId, setTopicId]         = useState('free');
  const [level, setLevel]             = useState(defaultLevel);
  const [messages, setMessages]       = useState([]);
  const [inputText, setInputText]     = useState('');
  const [isThinking, setIsThinking]   = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [lastError, setLastError]     = useState(null);
  const [srSupported, setSrSupported] = useState(true);
  const [mode, setMode]               = useState('voice');
  const [closing, setClosing]         = useState(false);
  const [cuExpr, setCuExpr]           = useState('idle');
  const [openCorrection, setOpenCorrection] = useState(null); // {msgId, idx}

  const chatEndRef  = useRef(null);
  const abortRef    = useRef(null);
  const srRef       = useRef(null);
  const textareaRef = useRef(null);
  const mountedRef  = useRef(true);
  useEffect(() => () => {
    mountedRef.current = false;
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} }
    if (srRef.current)    { try { srRef.current.stop(); }  catch {} }
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  const activeTopic  = TOPICS.find(t => t.id === topicId) || TOPICS[0];
  const systemPrompt = buildSystemPrompt(topicId, level);
  const isAtLimit   = messages.length >= MAX_MESSAGES;
  const isBusy      = isThinking || isSpeaking || isListening;

  useEffect(() => { injectCss(); }, []);
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSrSupported(false);
  }, []);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, interimText]);

  useEffect(() => {
    if (isListening)  { setCuExpr('listening'); return; }
    if (isThinking)   { setCuExpr('thinking');  return; }
    if (isSpeaking)   { setCuExpr('speaking');  return; }
    setCuExpr('idle');
  }, [isListening, isThinking, isSpeaking]);

  const handleBack = useCallback(() => {
    stopListening();
    window.speechSynthesis?.cancel();
    if (abortRef.current) abortRef.current.abort();
    setClosing(true);
    setTimeout(() => { if (onBack) onBack(); }, 230);
  }, [onBack]);

  const speakAi = useCallback((text) => {
    setIsSpeaking(true);
    speak(text, null, () => setIsSpeaking(false));
  }, [speak]);

  const stopListening = useCallback(() => {
    if (srRef.current) { try { srRef.current.stop(); } catch {} srRef.current = null; }
    setIsListening(false); setInterimText('');
  }, []);

  const sendMessage = useCallback(async (override) => {
    const text = (override ?? inputText).trim();
    if (!text || isThinking || isAtLimit) return;

    setLastError(null); setInputText(''); setInterimText('');
    const userMsgId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const userMsg = { id: userMsgId, role: 'user', text };
    const history = [...messages, userMsg];
    setMessages(history);
    setIsThinking(true);

    // Async grammar check — runs in parallel with chat, updates user bubble when done
    (async () => {
      try {
        const gr = await fetch(`${API_BASE}/api/grammar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!gr.ok) return;
        const data = await gr.json();
        const corrections = Array.isArray(data?.corrections) ? data.corrections : [];
        if (!mountedRef.current) return;
        // Validate each correction is actually a substring of the user's text
        const valid = corrections.filter(c => typeof c?.original === 'string' && text.includes(c.original));
        setMessages(prev => prev.map(m => m.id === userMsgId ? { ...m, corrections: valid } : m));
      } catch {}
    })();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.text })),
          systemPrompt,
          level,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = ''; let done = false;
      while (!done) {
        if (!mountedRef.current || controller.signal.aborted) { try { await reader.cancel(); } catch {} return; }
        const { value, done: d } = await reader.read(); done = d;
        if (value) {
          const lines = decoder.decode(value, { stream: true }).split('\n');
          for (const ln of lines) {
            if (!ln.startsWith('data: ')) continue;
            const raw = ln.slice(6).trim();
            if (raw === '[DONE]') { done = true; break; }
            try { const p = JSON.parse(raw); acc += p.text || p.content || ''; } catch {}
          }
        }
      }
      if (!mountedRef.current) return;

      const final = acc.trim() || '…';
      const words = extractWords(final);
      const expr  = detectExpression(final);
      setCuExpr(expr);
      setMessages(prev => [...prev, { role: 'assistant', text: final, words, expr }]);
      setIsThinking(false);
      abortRef.current = null;
      speakAi(final);

    } catch (err) {
      if (!mountedRef.current) return;
      if (err.name === 'AbortError') { setIsThinking(false); return; }
      setIsThinking(false);
      setLastError('Không kết nối được AI. Thử lại nhé!');
    }
  }, [inputText, isThinking, isAtLimit, messages, systemPrompt, level, speakAi]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Dùng Chrome để nói nhé! 🎤', 'bad'); return; }
    if (isBusy) return;
    window.speechSynthesis?.cancel(); setIsSpeaking(false);
    const sr = new SR();
    sr.lang = 'en-US'; sr.interimResults = true; sr.continuous = false; sr.maxAlternatives = 1;
    srRef.current = sr;
    sr.onstart  = () => { setIsListening(true); setInterimText(''); };
    sr.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t; else interim += t;
      }
      setInterimText(interim || final);
      if (final) { stopListening(); sendMessage(final); }
    };
    sr.onerror = (e) => {
      stopListening();
      if (e.error === 'no-speech') return;
      if (e.error === 'not-allowed') showToast('Cho phép trình duyệt dùng mic nhé!', 'bad');
    };
    sr.onend = () => stopListening();
    try { sr.start(); } catch { stopListening(); }
  }, [isBusy, stopListening, sendMessage, showToast]);

  const toggleMic = () => { if (isListening) stopListening(); else startListening(); };

  const startNewChat = () => {
    stopListening(); window.speechSynthesis?.cancel();
    if (abortRef.current) abortRef.current.abort();
    setMessages([]); setInputText(''); setIsThinking(false);
    setIsSpeaking(false); setInterimText(''); setLastError(null);
    setCuExpr('idle');
  };

  const handleTopicChange = (id) => { if (id !== topicId) { setTopicId(id); startNewChat(); } };
  const handleLevelChange = (lv) => { if (lv !== level) { setLevel(lv); startNewChat(); } };

  const lastAiMsg = messages.filter(m => m.role === 'assistant').slice(-1)[0];
  const greeting  = currentProfile?.name ? `Chào ${currentProfile.name}!` : 'Xin chào!';

  const bubbleText = isThinking
    ? null
    : isListening && interimText
    ? interimText
    : messages.length === 0
    ? `${greeting} Tôi là Cú! Nói tiếng Anh với tôi nhé 🦉`
    : lastAiMsg?.text || null;

  return (
    <>
      {/* Backdrop — click to close */}
      <div
        onClick={handleBack}
        style={{
          position: 'fixed', inset: 0, zIndex: 160,
          background: 'rgba(15,10,40,0.55)',
          backdropFilter: 'blur(3px)',
          animation: closing ? 'none' : undefined,
          opacity: closing ? 0 : undefined,
          transition: closing ? 'opacity 0.22s ease' : undefined,
        }}
      />

      {/* Floating window */}
      <div
        className={closing ? 'cu-panel-out' : 'cu-panel-in'}
        style={{
          position: 'fixed',
          bottom: 10,
          right: 10,
          left: 10,
          maxWidth: 420,
          margin: '0 auto',
          height: 'min(640px, calc(100vh - 20px))',
          zIndex: 161,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(160deg,#1e1b4b 0%,#3b0764 50%,#1e1b4b 100%)',
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(255,255,255,0.08)',
          overflow: 'hidden',
          fontFamily: 'var(--font)',
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Row 1: Cú + level selector + actions */}
          <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flexShrink: 0 }}>
              <CuOwl expression={cuExpr} size={44} />
            </div>

            {/* Level selector */}
            <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', marginRight: 2 }}>Cấp độ:</span>
              {LEVELS.map(lv => (
                <button key={lv} onClick={() => handleLevelChange(lv)} style={{
                  padding: '3px 9px', borderRadius: 12, border: 'none',
                  fontFamily: 'var(--font)', fontWeight: 900, fontSize: '0.72rem', cursor: 'pointer',
                  background: lv === level ? LEVEL_COLORS[lv] : 'rgba(255,255,255,0.08)',
                  color: lv === level ? '#fff' : 'rgba(255,255,255,0.45)',
                  boxShadow: lv === level ? `0 2px 8px ${LEVEL_COLORS[lv]}55` : 'none',
                  transition: 'all .15s',
                }}>
                  {lv}
                </button>
              ))}
              <span style={{ marginLeft: 4, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                {level === 'A1' ? '• Mới bắt đầu' : level === 'A2' ? '• Cơ bản' : level === 'B1' ? '• Trung cấp' : '• Nâng cao'}
              </span>
            </div>

            <button onClick={startNewChat} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🔄
            </button>
            <button onClick={handleBack} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>

          {/* Row 2: Topic pills */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 12px 8px' }}>
            {TOPICS.map(t => (
              <button key={t.id} onClick={() => handleTopicChange(t.id)} style={{
                flexShrink: 0, padding: '3px 9px', borderRadius: 14, border: 'none',
                fontFamily: 'var(--font)', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer',
                background: t.id === topicId ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.08)',
                color: t.id === topicId ? '#4c1d95' : 'rgba(255,255,255,0.55)',
                transition: 'all .15s',
              }}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Speech bubble (Cú status) ───────────────────── */}
        <div style={{ flexShrink: 0, padding: '8px 12px 4px', minHeight: 52 }}>
          {isThinking ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: 16, width: 'fit-content' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>Cú đang nghĩ</span>
              <span style={{ display: 'flex', gap: 3 }}>
                <span className="cu-dot2"/><span className="cu-dot2"/><span className="cu-dot2"/>
              </span>
            </div>
          ) : bubbleText ? (
            <div style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.92)', borderRadius: '16px 16px 16px 4px', fontSize: '0.87rem', fontWeight: 700, color: '#1e1b4b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {isListening && interimText
                ? <span style={{ color: '#dc2626', fontStyle: 'italic' }}>{interimText}…</span>
                : bubbleText
              }
            </div>
          ) : null}

          {/* Waveform when listening */}
          {isListening && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6, height: 24 }}>
              {[1,2,3,4,5].map(i => <div key={i} className="cu-wbar" style={{ animationDelay: `${i*0.08}s` }}/>)}
              <span style={{ marginLeft: 6, fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Đang nghe…</span>
            </div>
          )}
        </div>

        {/* ── Chat history ────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'none' }}>
          {messages.map((msg, i) => (
            <div key={msg.id || i} className="cu-msg-in" style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'user' ? (
                <>
                  <div style={{ maxWidth: '80%', background: 'linear-gradient(135deg,#5ec8f8,#4b7bec)', color: '#fff', borderRadius: '16px 16px 4px 16px', padding: '9px 13px', fontWeight: 700, fontSize: '0.86rem', lineHeight: 1.5 }}>
                    {(msg.corrections && msg.corrections.length > 0)
                      ? splitWithCorrections(msg.text, msg.corrections).map((seg, si) => (
                          seg.type === 'error'
                            ? <span
                                key={si}
                                onClick={() => setOpenCorrection({ msgId: msg.id, idx: seg.correctionIdx })}
                                style={{
                                  background: 'rgba(252,165,165,0.45)',
                                  borderBottom: '2px wavy #fecaca',
                                  textDecoration: 'underline wavy #fecaca',
                                  textUnderlineOffset: '3px',
                                  cursor: 'pointer',
                                  padding: '0 2px',
                                  borderRadius: 3,
                                }}
                              >{seg.text}</span>
                            : <span key={si}>{seg.text}</span>
                        ))
                      : msg.text
                    }
                  </div>
                  {/* Inline correction popup */}
                  {openCorrection && openCorrection.msgId === msg.id && msg.corrections?.[openCorrection.idx] && (
                    <div onClick={(e) => e.stopPropagation()} style={{
                      maxWidth: '85%', marginTop: 4,
                      background: 'rgba(254,243,199,0.97)', color: '#92400e',
                      borderRadius: 12, padding: '8px 12px', fontSize: '0.78rem', fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'relative',
                    }}>
                      <button onClick={() => setOpenCorrection(null)} style={{
                        position: 'absolute', top: 4, right: 6, background: 'none', border: 'none',
                        fontSize: '0.85rem', cursor: 'pointer', color: '#92400e', fontWeight: 900,
                      }}>✕</button>
                      <div style={{ marginBottom: 3 }}>
                        <span style={{ textDecoration: 'line-through', color: '#dc2626' }}>{msg.corrections[openCorrection.idx].original}</span>
                        {' → '}
                        <strong style={{ color: '#15803d' }}>{msg.corrections[openCorrection.idx].corrected}</strong>
                      </div>
                      <div style={{ fontSize: '0.74rem', fontWeight: 600 }}>
                        💡 {msg.corrections[openCorrection.idx].explanation_vi || msg.corrections[openCorrection.idx].explanation || ''}
                      </div>
                    </div>
                  )}
                  {/* Grammar badge hint */}
                  {msg.corrections && msg.corrections.length > 0 && !(openCorrection && openCorrection.msgId === msg.id) && (
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fcd34d', marginTop: 3, marginRight: 4 }}>
                      ⚠️ {msg.corrections.length} chỗ chạm vào xem giải thích
                    </div>
                  )}
                </>
              ) : (
                <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                  <div style={{ background: 'rgba(255,255,255,0.13)', color: '#fff', borderRadius: '16px 16px 16px 4px', padding: '9px 13px', fontWeight: 600, fontSize: '0.86rem', lineHeight: 1.55 }}>
                    {msg.text}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    <button onClick={() => speakAi(msg.text)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', cursor: 'pointer' }}>
                      🔊
                    </button>
                    {msg.words?.map(w => (
                      <button key={w} onClick={() => speak(w)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', cursor: 'pointer' }}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {lastError && (
            <div style={{ background: 'rgba(239,68,68,0.18)', border: '1.5px solid rgba(239,68,68,0.45)', borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', fontWeight: 700, color: '#fca5a5' }}>
              ⚠️ {lastError}
              <button onClick={() => setLastError(null)} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.4)', color: '#fff', border: 'none', borderRadius: 8, padding: '3px 8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>OK</button>
            </div>
          )}

          {isAtLimit && (
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <button onClick={startNewChat} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: 14, padding: '8px 18px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                🔄 Cuộc trò chuyện mới
              </button>
            </div>
          )}

          <div ref={chatEndRef}/>
        </div>

        {/* ── Input / Voice controls ───────────────────────── */}
        <div style={{ flexShrink: 0, padding: '10px 12px 14px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {mode === 'voice' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Mode toggle */}
              <button onClick={() => setMode('text')} style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ⌨️
              </button>

              {/* Mic button */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'relative' }}>
                  {isListening && <div className="cu-mic-pulse"/>}
                  <button
                    onClick={toggleMic}
                    disabled={isThinking || isSpeaking || isAtLimit}
                    style={{
                      width: 62, height: 62, borderRadius: '50%', border: 'none',
                      cursor: isThinking || isSpeaking || isAtLimit ? 'not-allowed' : 'pointer',
                      background: isListening
                        ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                        : isThinking || isSpeaking
                        ? 'rgba(255,255,255,0.12)'
                        : 'linear-gradient(135deg,#fff,#e9d5ff)',
                      color: isListening ? '#fff' : '#4c1d95',
                      fontSize: '1.7rem',
                      boxShadow: isListening ? '0 0 0 5px rgba(239,68,68,0.25)' : '0 4px 14px rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .18s',
                    }}
                  >
                    {isListening ? '⏹' : isSpeaking ? '🔊' : '🎤'}
                  </button>
                </div>
              </div>

              {/* Replay */}
              <button onClick={() => lastAiMsg && speakAi(lastAiMsg.text)} disabled={!lastAiMsg || isSpeaking}
                style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '1rem', cursor: !lastAiMsg || isSpeaking ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🔈
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end' }}>
              <button onClick={() => setMode('voice')} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '1rem', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                🎤
              </button>
              <textarea
                value={inputText}
                ref={textareaRef}
                placeholder={isAtLimit ? 'Bắt đầu cuộc trò chuyện mới!' : 'Nhập tiếng Anh...'}
                disabled={isAtLimit || isThinking}
                rows={1}
                onChange={e => { setInputText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px'; }}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (inputText.trim() && !isThinking) sendMessage(); } }}
                style={{ flex: 1, resize: 'none', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '9px 12px', fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.88rem', color: '#fff', background: 'rgba(255,255,255,0.08)', outline: 'none', minHeight: 38, maxHeight: 90, lineHeight: 1.4 }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputText.trim() || isThinking || isAtLimit}
                style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: !inputText.trim() || isThinking || isAtLimit ? 'default' : 'pointer', background: !inputText.trim() || isThinking || isAtLimit ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#fff,#e9d5ff)', color: !inputText.trim() || isThinking || isAtLimit ? 'rgba(255,255,255,0.3)' : '#4c1d95', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isThinking ? '⏳' : '➤'}
              </button>
            </div>
          )}

          {/* Status hint */}
          <div style={{ textAlign: 'center', marginTop: 6, fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
            {isListening ? '🎤 Đang nghe...' : isSpeaking ? '🔊 Cú đang nói...' : isThinking ? '⏳ Cú đang nghĩ...' : !srSupported ? '⚠️ Dùng Chrome để nói' : mode === 'voice' ? 'Nhấn 🎤 và nói tiếng Anh' : 'Ctrl+Enter để gửi'}
          </div>
        </div>
      </div>
    </>
  );
}
