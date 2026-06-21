import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Sparkles, Volume2, Mic, Play, Square, Award, AlertCircle } from 'lucide-react';
import IpaDisplay from '../components/IpaDisplay';
import { scorePronunciation, pctToStars } from '../lib/pronunciationScore';
import { getWeakPhonemes } from '../lib/adaptive';
import { getPhoneme } from '../lib/phonics';

const API_BASE = import.meta.env.VITE_API_URL || '';

const STUDIO_SENTENCES = [
  "Hello! How are you today?",
  "This is my beautiful home planet Earth.",
  "I love my mother and my father very much.",
  "Learning English is so much fun and easy!",
  "Look at the giant golden trophy on the table.",
  "The small caterpillar crawls on the green leaf.",
  "I want to be a clever doctor in the future.",
  "Welcome to the magical English kingdom!",
  "We are sleeping in a warm cocoon.",
  "Let's explore mysterious stars in the space!"
];

export default function GameSpeechStudio() {
  const {
    currentProfile,
    setActiveScreen,
    addStarsAndCoins,
    speak,
    beep,
    showToast,
    isSpeechSupported,
    startListeningSpeech,
    stopListeningSpeech,
    updateQuestProgress,
    recordPronunciation,
  } = useGame();

  const [activeSentenceIdx, setActiveSentenceIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlayingRecord, setIsPlayingRecord] = useState(false);
  const [score, setScore] = useState(null); // null | 1 | 2 | 3 | 'undetected'
  const [result, setResult] = useState(null); // { overall, matched, total, words:[{word,ok}] }
  const [selectedWord, setSelectedWord] = useState(null);
  const [tip, setTip] = useState(null); // Vietnamese pronunciation tip for weakest phoneme
  const evalTimerRef = useRef(null);
  const gotResultRef = useRef(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);
  const playbackAudioRef = useRef(null);

  const activeSentence = STUDIO_SENTENCES[activeSentenceIdx];

  const handleSelectSentence = (idx) => {
    beep('sine');
    setActiveSentenceIdx(idx);
    setAudioUrl(null);
    setScore(null);
    setResult(null);
    setTip(null);
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current = null;
    }
  };

  const handleStartRecord = async () => {
    try {
      beep('sine');
      setAudioUrl(null);
      setScore(null);
      setResult(null);
      setTip(null);
      gotResultRef.current = false;
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        // If recognition never returned, fall back to honest "undetected"
        evaluateFallback();
      };

      // Real per-word scoring from the speech recognizer's transcript.
      // skipPhonics: we record per-word ourselves below (target here is a full sentence).
      if (isSpeechSupported) {
        const handleTranscript = (transcript) => {
          gotResultRef.current = true;
          const r = scorePronunciation(activeSentence, transcript);
          setResult(r);
          setScore(pctToStars(r.overall));
          // Feed the per-word phonics tracker honestly
          r.words.forEach(w => recordPronunciation(w.word, w.ok));
          // Reward scales with accuracy; always a little for trying
          const stars = 5 + Math.round((r.overall / 100) * 15); // 5..20
          const coins = 2 + Math.round((r.overall / 100) * 8);  // 2..10
          beep(r.overall >= 50 ? 'good' : 'sine');
          addStarsAndCoins(stars, coins, r.overall >= 50);
          if (updateQuestProgress) updateQuestProgress('speech', 1);
          // Offer a pronunciation tip when not perfect
          if (r.overall < 100) maybeShowTip();
        };
        startListeningSpeech(activeSentence, handleTranscript, handleTranscript, { skipPhonics: true });
      }

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      showToast("Không truy cập được Micro! Vui lòng kiểm tra quyền ở trình duyệt.", "bad");
    }
  };

  const handleStopRecord = () => {
    beep('sine');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    // Stop mic stream
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach(track => track.stop());
      recordingStreamRef.current = null;
    }

    if (isSpeechSupported) {
      stopListeningSpeech();
    }

    setIsRecording(false);
  };

  const evaluateFallback = () => {
    if (evalTimerRef.current) clearTimeout(evalTimerRef.current);
    evalTimerRef.current = setTimeout(() => {
      if (gotResultRef.current) return; // recognizer already scored — nothing to do
      setScore('undetected');
      // Small consolation reward for trying, even when we couldn't hear clearly
      addStarsAndCoins(5, 2, false);
      if (updateQuestProgress) updateQuestProgress('speech', 1);
    }, 1200);
  };

  // Offline-first pronunciation tip: show the child's weakest tracked phoneme
  // immediately, then try to enrich with an AI tip (text endpoint) if reachable.
  const maybeShowTip = () => {
    const weak = getWeakPhonemes(currentProfile?.phonicsStats || {});
    if (weak.length === 0) return;
    const ph = getPhoneme(weak[0].id);
    if (!ph) return;
    // Instant, reliable offline tip
    setTip({ symbol: ph.symbol, text: `Âm ${ph.symbol} (${ph.examples}): ${ph.vi_tip}`, source: 'local' });

    // Best-effort AI enrichment (text-only endpoint). Never blocks the UI.
    if (!API_BASE) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `Một bé Việt Nam đang học tiếng Anh phát âm chưa chuẩn âm ${ph.symbol} (ví dụ: ${ph.examples}). Cho một mẹo luyện phát âm thật ngắn, vui, dễ hiểu cho trẻ em bằng tiếng Việt, tối đa 1 câu.`,
            }],
          }),
        });
        if (!res.ok || !res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = '', done = false;
        while (!done) {
          const { value, done: d } = await reader.read(); done = d;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              const t = line.trim();
              if (!t.startsWith('data:')) continue;
              const payload = t.slice(5).trim();
              if (payload === '[DONE]') { done = true; break; }
              try { acc += JSON.parse(payload).text || ''; } catch {}
            }
          }
        }
        const aiText = acc.trim();
        if (aiText) setTip({ symbol: ph.symbol, text: aiText, source: 'ai' });
      } catch {}
    })();
  };

  const handlePlayRecord = () => {
    if (!audioUrl) return;
    beep('sine');

    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    playbackAudioRef.current = audio;
    setIsPlayingRecord(true);

    audio.onended = () => {
      setIsPlayingRecord(false);
    };
    audio.onerror = () => {
      setIsPlayingRecord(false);
    };

    audio.play();
  };

  useEffect(() => {
    return () => {
      if (evalTimerRef.current) clearTimeout(evalTimerRef.current);
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }
    };
  }, []);

  return (
    <div style={{ padding: '16px 12px', color: 'var(--ink)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button 
          className="back-btn" 
          onClick={() => {
            beep('sine');
            setActiveScreen('home');
          }} 
          style={{ margin: 0 }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--c-purple)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          🎙️ Phòng Thu Luyện Nói
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Browser not supported banner */}
        {!isSpeechSupported && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.08)', border: '2px solid var(--c-coral)',
            borderRadius: '16px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={18} color="var(--c-coral)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--c-coral)' }}>
              Trình duyệt không hỗ trợ nhận diện giọng nói. Dùng <strong>Chrome</strong> để chấm điểm chính xác nhé!
            </span>
          </div>
        )}

        {/* Active Sentence Display Card */}
        <div className="play-card" style={{ padding: '24px 16px', minHeight: '260px', display: 'flex', flexDirection: 'column', justifyItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Bé hãy luyện nói câu tiếng Anh dưới đây:
          </span>

          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--c-purple)', lineHeight: '1.4', margin: '8px 0 10px', padding: '0 8px' }}>
            "{activeSentence}"
          </div>

          {/* Word IPA chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', justifyContent: 'center' }}>
            {activeSentence.replace(/[^a-zA-Z\s]/g, '').split(' ').filter(Boolean).map((word, i) => {
              const lower = word.toLowerCase();
              const isSelected = selectedWord === lower;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <button
                    onClick={() => { setSelectedWord(isSelected ? null : lower); speak(lower); }}
                    style={{
                      padding: '4px 10px', borderRadius: '10px', border: `2px solid ${isSelected ? 'var(--c-purple)' : 'rgba(108,92,231,0.2)'}`,
                      background: isSelected ? 'rgba(108,92,231,0.08)' : 'transparent',
                      fontWeight: 800, fontSize: '0.85rem', color: isSelected ? 'var(--c-purple)' : 'var(--ink)',
                      cursor: 'pointer'
                    }}
                  >
                    {word}
                  </button>
                  {isSelected && <IpaDisplay word={lower} style={{ fontSize: '0.78rem' }} />}
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            
            {/* 1. Play Native Voice */}
            <button
              onClick={() => { beep('sine'); speak(activeSentence); }}
              className="btn-ghost"
              style={{
                width: 'auto', padding: '10px 18px', borderRadius: '14px',
                background: 'rgba(157, 107, 255, 0.08)', color: 'var(--c-purple)', border: '2px solid var(--c-purple)',
                fontSize: '0.88rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: 0
              }}
            >
              <Volume2 size={16} /> Nghe Giọng Bản Xứ 🔊
            </button>

            {/* 2. Record Toggle */}
            <button
              onClick={isRecording ? handleStopRecord : handleStartRecord}
              className="btn-big"
              style={{
                width: 'auto', padding: '10px 22px', borderRadius: '14px',
                background: isRecording ? 'linear-gradient(135deg, #ff4757, #ff6b81)' : 'linear-gradient(135deg, var(--c-purple), var(--c-pink))',
                boxShadow: isRecording ? '0 4px 0 #b33939' : '0 4px 0 #7a4fd6',
                fontSize: '0.88rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: 0,
                animation: isRecording ? 'pulseMic 1.2s infinite' : 'none'
              }}
            >
              {isRecording ? <Square size={16} fill="#fff" /> : <Mic size={16} />}
              {isRecording ? "Dừng Ghi Âm" : "Ghi Âm Giọng Bé"}
            </button>

            {/* 3. Play Record */}
            <button
              onClick={handlePlayRecord}
              disabled={!audioUrl || isRecording}
              className="btn-ghost"
              style={{
                width: 'auto', padding: '10px 18px', borderRadius: '14px',
                background: '#fff', color: audioUrl ? 'var(--c-grass)' : 'var(--ink-soft)', 
                border: audioUrl ? '2px solid var(--c-grass)' : '2px solid rgba(0,0,0,0.1)',
                opacity: audioUrl ? 1 : 0.45,
                fontSize: '0.88rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: 0
              }}
            >
              <Play size={16} fill={audioUrl ? "var(--c-grass)" : "none"} /> Nghe Lại Giọng Con
            </button>
          </div>

          {/* Flashing Recording Status */}
          {isRecording && (
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#ff4757', fontWeight: 800, fontSize: '0.85rem' }}>
              <span className="dot-rec" style={{ width: '10px', height: '10px', background: '#ff4757', borderRadius: '50%', display: 'inline-block' }}></span>
              <span>Đang thu âm giọng nói của bé... Hãy đọc to câu trên nhé! 🎙️</span>
            </div>
          )}

          {/* Score Result Banner */}
          {score && (
            <div style={{
              marginTop: '20px', background: 'rgba(255, 165, 0, 0.04)', border: '2px dashed var(--c-sun)',
              padding: '12px 14px', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '6px', animation: 'popIn 0.3s'
            }}>
              {score === 'undetected' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem', fontWeight: 900, color: 'var(--ink-soft)' }}>
                    <AlertCircle size={18} /> Không nhận diện được giọng nói
                  </div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-soft)', margin: 0, textAlign: 'center' }}>
                    {isSpeechSupported
                      ? "Hãy nói to và rõ hơn, hoặc kiểm tra micro nhé! 🎙️ (+5 Sao, +2 Xu)"
                      : "Dùng Chrome để nhận điểm chính xác. (+5 Sao, +2 Xu)"}
                  </p>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '1.1rem', fontWeight: 900, color: 'var(--c-sun)' }}>
                    <Award size={18} fill="var(--c-sun)" /> Cú Cốc Cốc chấm điểm:
                  </div>
                  <div style={{ fontSize: '1.8rem', letterSpacing: '4px' }}>
                    {'⭐'.repeat(score)}{'☆'.repeat(3 - score)}
                  </div>
                  {result && (
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: result.overall >= 50 ? 'var(--c-grass)' : 'var(--c-coral)' }}>
                      Khớp {result.overall}% ({result.matched}/{result.total} từ)
                    </div>
                  )}
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-soft)', margin: 0, textAlign: 'center' }}>
                    {score === 3
                      ? "Tuyệt cú mèo! Bé phát âm chuẩn xác như người bản xứ! 🦉🎉"
                      : score === 2
                        ? "Bé đọc rất tốt! Thử lại để được 3 sao nhé! 🌟"
                        : "Cố lên! Nhấn vào từ màu đỏ để nghe lại rồi thử nói lại nhé! 💪"}
                  </p>
                  {/* Per-word breakdown — tap a missed word to hear it */}
                  {result && result.words.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center', marginTop: '4px' }}>
                      {result.words.map((w, i) => (
                        <button
                          key={i}
                          onClick={() => { beep('sine'); speak(w.word); }}
                          style={{
                            padding: '3px 9px', borderRadius: '9px', cursor: 'pointer',
                            border: `2px solid ${w.ok ? 'var(--c-grass)' : 'var(--c-coral)'}`,
                            background: w.ok ? 'rgba(118,210,117,0.12)' : 'rgba(255,107,107,0.1)',
                            color: w.ok ? 'var(--c-grass)' : 'var(--c-coral)',
                            fontWeight: 800, fontSize: '0.8rem',
                          }}
                        >
                          {w.ok ? '✓' : '🔁'} {w.word}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Pronunciation tip for weakest phoneme */}
                  {tip && (
                    <div style={{
                      marginTop: '6px', background: 'rgba(157,107,255,0.07)',
                      border: '1.5px solid rgba(157,107,255,0.25)', borderRadius: '12px',
                      padding: '8px 12px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      <Sparkles size={15} color="var(--c-purple)" />
                      <span>🦉 {tip.text}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Sentences Selector List */}
        <div style={{
          background: 'var(--paper)', border: '2px solid rgba(0,0,0,0.05)',
          padding: '16px 14px', borderRadius: '24px', boxShadow: 'var(--shadow-sm)', textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--c-purple)', margin: '0 0 10px' }}>
            📋 Danh Sách Câu Luyện Nói ({STUDIO_SENTENCES.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
            {STUDIO_SENTENCES.map((sent, idx) => {
              const isActive = activeSentenceIdx === idx;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectSentence(idx)}
                  style={{
                    padding: '10px 14px', borderRadius: '14px', border: isActive ? '2px solid var(--c-purple)' : '1px solid rgba(0,0,0,0.05)',
                    background: isActive ? 'rgba(157, 107, 255, 0.04)' : 'var(--paper)',
                    cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', transition: 'all 0.15s'
                  }}
                >
                  <span style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: isActive ? 'var(--c-purple)' : 'rgba(0,0,0,0.05)',
                    color: isActive ? '#fff' : 'var(--ink-soft)',
                    display: 'grid', placeItems: 'center', fontSize: '0.78rem', fontWeight: 900
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isActive ? 'var(--c-purple)' : 'var(--ink)' }}>
                    {sent}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
