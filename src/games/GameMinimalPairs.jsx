import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import PAIRS from '../data/minimal_pairs.json';

const ROUNDS = 10;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function GameMinimalPairs({ onBack }) {
  const { speak, beep, addStarsAndCoins, updateQuestProgress } = useGame();
  const [queue, setQueue] = useState([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [targetWord, setTargetWord] = useState('');
  const [options, setOptions] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [correct, setCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const shuffled = shuffle(PAIRS).slice(0, ROUNDS);
    setQueue(shuffled);
  }, []);

  useEffect(() => {
    if (queue.length === 0) return;
    const pair = queue[roundIdx];
    if (!pair) return;
    const target = pair.pair[Math.round(Math.random())]; // random which of the two to play
    setTargetWord(target);
    setOptions(shuffle(pair.pair));
    setChosen(null);
    setCorrect(null);
    setRevealed(false);
    // Auto-play after short delay
    const t = setTimeout(() => speak(target), 400);
    return () => clearTimeout(t);
  }, [queue, roundIdx]);

  const handlePlay = useCallback(() => {
    if (targetWord) speak(targetWord);
  }, [targetWord, speak]);

  const handleChoose = useCallback((word) => {
    if (chosen !== null) return;
    setChosen(word);
    const isCorrect = word === targetWord;
    setCorrect(isCorrect);
    setRevealed(true);
    if (isCorrect) {
      beep('sine');
      setScore(s => s + 1);
    } else {
      beep('square');
    }
    setTimeout(() => {
      const next = roundIdx + 1;
      if (next >= queue.length) {
        setDone(true);
      } else {
        setRoundIdx(next);
      }
    }, 1800);
  }, [chosen, targetWord, roundIdx, queue.length, beep]);

  useEffect(() => {
    if (done) {
      addStarsAndCoins(score >= 8 ? 3 : score >= 5 ? 2 : 1, score * 3);
      updateQuestProgress('minimal_pairs', 1);
    }
  }, [done]);

  if (done) {
    const pct = Math.round((score / ROUNDS) * 100);
    const msg = pct >= 80 ? 'Tuyệt vời! 🏆' : pct >= 50 ? 'Khá tốt! 💪' : 'Cần luyện thêm! 📚';
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '12px' }}>🎧</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--c-purple)', marginBottom: '8px' }}>{msg}</h2>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: score >= 8 ? 'var(--c-grass)' : 'var(--c-orange)', marginBottom: '8px' }}>
          {score}/{ROUNDS}
        </div>
        <div style={{ fontSize: '1rem', color: '#888', marginBottom: '32px' }}>{pct}% chính xác</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => { setRoundIdx(0); setScore(0); setDone(false); setQueue(shuffle(PAIRS).slice(0, ROUNDS)); }}
            style={{
              padding: '12px 24px', borderRadius: '14px', background: 'var(--c-purple)',
              color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.95rem'
            }}
          >
            🔄 Chơi lại
          </button>
          <button onClick={onBack} style={{
            padding: '12px 24px', borderRadius: '14px', background: 'rgba(108,92,231,0.1)',
            color: 'var(--c-purple)', fontWeight: 800, border: '2px solid var(--c-purple)', cursor: 'pointer', fontSize: '0.95rem'
          }}>
            🏠 Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  const currentPair = queue[roundIdx];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={onBack} style={{
          background: 'none', border: '2px solid var(--c-purple)', borderRadius: '12px',
          padding: '8px 14px', cursor: 'pointer', fontWeight: 800, color: 'var(--c-purple)'
        }}>← Về</button>
        <span style={{ fontWeight: 800, color: 'var(--ink)' }}>🎧 Cặp Âm Tương Tự</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 700, color: '#888' }}>
          {roundIdx + 1}/{ROUNDS} • ✅ {score}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', marginBottom: '28px', overflow: 'hidden' }}>
        <div style={{
          width: `${(roundIdx / ROUNDS) * 100}%`, height: '100%',
          background: 'var(--c-purple)', borderRadius: '4px', transition: 'width 0.3s'
        }} />
      </div>

      {/* Prompt */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#666', marginBottom: '20px' }}>
          Nghe và chọn từ đúng:
        </div>
        <button
          onClick={handlePlay}
          style={{
            background: 'linear-gradient(135deg, var(--c-purple), #a55eea)',
            border: 'none', borderRadius: '50%', width: '90px', height: '90px',
            fontSize: '2.4rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(108,92,231,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
          }}
        >
          🔊
        </button>
        {currentPair && (
          <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '12px' }}>
            Âm tập trung: <strong style={{ color: 'var(--c-orange)' }}>{currentPair.focus}</strong>
            {currentPair.vi_note && <span> — {currentPair.vi_note}</span>}
          </div>
        )}
      </div>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
        {options.map(word => {
          let borderColor = 'var(--c-purple)';
          let bg = '#fff';
          let textColor = 'var(--ink)';
          if (revealed) {
            if (word === targetWord) {
              borderColor = 'var(--c-grass)'; bg = 'rgba(38,222,129,0.1)'; textColor = 'var(--c-grass)';
            } else if (word === chosen) {
              borderColor = '#ff6b6b'; bg = 'rgba(255,107,107,0.1)'; textColor = '#ff6b6b';
            } else {
              borderColor = '#ddd'; textColor = '#aaa';
            }
          }
          return (
            <button
              key={word}
              onClick={() => handleChoose(word)}
              style={{
                padding: '28px 16px', borderRadius: '20px',
                border: `3px solid ${borderColor}`, background: bg,
                fontWeight: 900, fontSize: '1.5rem', color: textColor,
                cursor: chosen !== null ? 'default' : 'pointer',
                transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                fontFamily: 'monospace', letterSpacing: '0.02em'
              }}
            >
              {word}
              {revealed && word === targetWord && <div style={{ fontSize: '1.5rem', marginTop: '4px' }}>✅</div>}
              {revealed && word === chosen && word !== targetWord && <div style={{ fontSize: '1.5rem', marginTop: '4px' }}>❌</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
