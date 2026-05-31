import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Clock } from 'lucide-react';

export default function GameArcade({ onFinish, onBack }) {
  const { 
    currentProfile, 
    selectedTopic, 
    addStarsAndCoins, 
    speak, 
    beep, 
    showToast,
    arcLevel,
    levelUpGame,
    getCombinedVocab,
    updateAnalytics
  } = useGame();
  
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  
  // Single target for Level 1-4, Double target for Level 5
  const [targetWord, setTargetWord] = useState(null);
  const [secondaryTarget, setSecondaryTarget] = useState(null);
  
  const [balloons, setBalloons] = useState([]);
  
  const gameRunning = useRef(true);
  const spawnTimer = useRef(null);
  const gameTimer = useRef(null);
  const balloonIdCounter = useRef(0);
  const targetWordRef = useRef(null);
  const secondaryTargetRef = useRef(null);

  const getVocabPool = () => {
    const combined = getCombinedVocab();
    if (!selectedTopic || selectedTopic === 'all') return combined;
    const filtered = combined.filter(v => v.t === selectedTopic);
    return filtered.length >= 6 ? filtered : combined;
  };

  const getSpeedAndRates = () => {
    if (arcLevel === 1) return { spawnRate: 1300, minDuration: 5200, maxDuration: 6800 };
    if (arcLevel === 2) return { spawnRate: 1000, minDuration: 4400, maxDuration: 5600 };
    if (arcLevel === 3) return { spawnRate: 850, minDuration: 3600, maxDuration: 4600 };
    if (arcLevel === 4) return { spawnRate: 700, minDuration: 3000, maxDuration: 4000 };
    return { spawnRate: 650, minDuration: 2600, maxDuration: 3400 }; // Level 5 Extreme!
  };

  const chooseNewTarget = () => {
    const pool = getVocabPool();
    const newTarget = pool[Math.floor(Math.random() * pool.length)];
    setTargetWord(newTarget);
    targetWordRef.current = newTarget;
    speak(newTarget.w);

    // Level 5 Double Target Mode
    if (arcLevel === 5) {
      const wrongs = pool.filter(v => v.w !== newTarget.w);
      const secondary = wrongs[Math.floor(Math.random() * wrongs.length)] || newTarget;
      setSecondaryTarget(secondary);
      secondaryTargetRef.current = secondary;
    } else {
      secondaryTargetRef.current = null;
    }
  };

  useEffect(() => {
    gameRunning.current = true;
    chooseNewTarget();

    // Game duration timer (60s)
    gameTimer.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Spawning loop
    const config = getSpeedAndRates();
    spawnTimer.current = setInterval(() => {
      if (!gameRunning.current) return;
      spawnBalloon(config);
    }, config.spawnRate);

    return () => {
      clearInterval(gameTimer.current);
      clearInterval(spawnTimer.current);
    };
  }, []);

  const spawnBalloon = (config) => {
    const pool = getVocabPool();
    const currentTarget = targetWordRef.current;
    const currentSecondary = secondaryTargetRef.current;
    if (!currentTarget) return;

    // Choose correct balloon word or wrong balloon word
    const isCorrect = Math.random() < 0.48;

    let item;
    if (isCorrect) {
      // For level 5, could be either primary or secondary target
      if (arcLevel === 5 && currentSecondary) {
        item = Math.random() < 0.5 ? currentTarget : currentSecondary;
      } else {
        item = currentTarget;
      }
    } else {
      const filterWords = arcLevel === 5
        ? pool.filter(v => v.w !== currentTarget.w && v.w !== currentSecondary?.w)
        : pool.filter(v => v.w !== currentTarget.w);

      item = filterWords[Math.floor(Math.random() * filterWords.length)] || currentTarget;
    }

    if (!item) return;

    const id = balloonIdCounter.current++;
    const left = 8 + Math.random() * 72; // bounds
    const duration = config.minDuration + Math.random() * (config.maxDuration - config.minDuration);
    const colors = ["#ff6b6b","#ffd23f","#76d275","#5ec8f8","#9d6bff","#ff7eb3","#ff9f43","#26d0a6"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Check if correct
    const isBalloonCorrect = arcLevel === 5
      ? (item.w === currentTarget.w || item.w === currentSecondary?.w)
      : (item.w === currentTarget.w);

    const newBalloon = {
      id,
      item,
      left,
      duration,
      color,
      isCorrect: isBalloonCorrect,
      popped: false,
      style: {
        background: color,
        left: `${left}%`,
        bottom: '-100px',
        transition: `bottom ${duration}ms linear, transform .25s, opacity .25s`
      }
    };

    setBalloons(prev => [...prev, newBalloon]);

    // Animate balloon rising
    setTimeout(() => {
      setBalloons(prev => prev.map(b => 
        b.id === id ? { ...b, style: { ...b.style, bottom: 'calc(100% + 20px)' } } : b
      ));
    }, 50);

    // Remove balloon when transition ends
    setTimeout(() => {
      setBalloons(prev => prev.filter(b => b.id !== id));
    }, duration + 100);
  };

  const handleBalloonClick = (balloon) => {
    if (balloon.popped) return;

    // Pop animation
    setBalloons(prev => prev.map(b => 
      b.id === balloon.id ? { ...b, popped: true } : b
    ));

    const topic = targetWord?.t || 'all';

    if (balloon.isCorrect) {
      beep('good');
      setScore(prev => prev + 10);
      setCoins(prev => prev + 2);
      addStarsAndCoins(10, 2, true);
      updateAnalytics(topic, true);
      showToast("+10 ⭐ +2 🪙", "good");
      setTimeout(() => {
        setBalloons(prev => prev.filter(b => b.id !== balloon.id));
      }, 250);
      chooseNewTarget();
    } else {
      beep('bad');
      // Penalize higher scores on higher levels
      const penalty = arcLevel >= 3 ? 3 : 2;
      setScore(prev => Math.max(0, prev - penalty));
      updateAnalytics(topic, false);
      addStarsAndCoins(0, 0, false); // reset combo
      showToast(`-${penalty} ⭐ Bấm sai từ rồi!`, "bad");
      setTimeout(() => {
        setBalloons(prev => prev.filter(b => b.id !== balloon.id));
      }, 250);
    }
  };

  const endGame = () => {
    gameRunning.current = false;
    clearInterval(gameTimer.current);
    clearInterval(spawnTimer.current);

    const passed = score >= 60;
    let leveledUp = false;
    if (passed && arcLevel < 5) {
      levelUpGame('arcLevel');
      leveledUp = true;
    }

    onFinish({
      emoji: score >= 60 ? "🎈" : "⏱️",
      title: score >= 60 ? "Tay Nhanh Mắt Lẹ!" : "Hết Giờ Rồi Bé!",
      msg: `Bé đã xuất sắc thu thập được ${score} điểm! ${leveledUp ? 'Bé đã thăng cấp độ khó mới!' : ''}`,
      stars: score,
      coins: Math.floor(score / 5)
    });
  };

  const handleBack = () => {
    gameRunning.current = false;
    onBack();
  };

  return (
    <div>
      {/* Game Header */}
      <div className="game-head">
        <button className="back-btn" onClick={handleBack}>← Về</button>
        <div className="stat star" style={{ background: 'rgba(255,255,255,.9)' }}>
          <span className="ico">⭐</span>
          <span>{score}</span>
        </div>
        <div className="spacer"></div>
        <div className="lives">
          ⏱️ {timeLeft}s
        </div>
      </div>

      {/* Arcade Stage */}
      <div id="arcade-stage" style={{ position: 'relative', overflow: 'hidden' }}>
        {targetWord && (
          <div 
            className="arcade-target"
            onClick={() => speak(targetWord.w)}
            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {arcLevel === 5 && secondaryTarget ? (
              /* Level 5 Double Target Mode */
              <div>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '2.2rem' }}>{targetWord.e}</span>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800' }}>{targetWord.w}</div>
                  </div>
                  <div style={{ fontSize: '1.8rem', display: 'grid', placeItems: 'center', fontWeight: '800' }}>HOẶC</div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '2.2rem' }}>{secondaryTarget.e}</span>
                    <div style={{ fontSize: '0.8rem', fontWeight: '800' }}>{secondaryTarget.w}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', fontWeight: '700', marginTop: '6px', textAlign: 'center' }}>
                  🔊 Bấm đúng bóng chữ của 1 trong 2 hình đều được điểm!
                </div>
              </div>
            ) : (
              /* Level 1-4 Single Target Mode */
              <div>
                <div className="em" style={{ fontSize: '2.2rem', lineHeight: 1 }}>{targetWord.e}</div>
                <div className="vi" style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--ink)' }}>
                  {targetWord.vi} — chạm bóng chữ <b>{targetWord.w}</b>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating Balloons */}
        {balloons.map(b => (
          <div 
            key={b.id}
            onClick={() => handleBalloonClick(b)}
            className={`balloon ${b.popped ? 'pop' : ''}`}
            style={{ 
              ...b.style,
              cursor: 'pointer',
              opacity: b.popped ? 0 : 1,
              transform: b.popped ? 'scale(1.4)' : 'none'
            }}
          >
            {b.item.w}
          </div>
        ))}
      </div>
    </div>
  );
}
