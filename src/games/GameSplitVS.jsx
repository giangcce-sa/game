import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Volume2, Trophy, ArrowLeft, Swords } from 'lucide-react';

export default function GameSplitVS({ onFinish, onBack }) {
  const { 
    currentProfile, 
    addStarsAndCoins, 
    speak, 
    beep, 
    showToast,
    getCombinedVocab
  } = useGame();

  const [round, setRound] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);

  // Scores and round status
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [p1Answered, setP1Answered] = useState(false);
  const [p2Answered, setP2Answered] = useState(false);
  const [roundWinner, setRoundWinner] = useState(null); // 'p1' | 'p2' | null

  const [selectedP1Choice, setSelectedP1Choice] = useState(null);
  const [selectedP2Choice, setSelectedP2Choice] = useState(null);
  const [lockClick, setLockClick] = useState(false);

  const totalRounds = 5;

  const startRound = (roundIdx) => {
    const pool = getCombinedVocab();
    const correctAnswer = pool[Math.floor(Math.random() * pool.length)];
    
    const wrongs = pool.filter(v => v.w !== correctAnswer.w);
    const shuffledWrongs = wrongs.sort(() => 0.5 - Math.random()).slice(0, 3);
    const roundOpts = [correctAnswer, ...shuffledWrongs].sort(() => 0.5 - Math.random());

    setCurrentQuestion(correctAnswer);
    setOptions(roundOpts);
    setP1Answered(false);
    setP2Answered(false);
    setSelectedP1Choice(null);
    setSelectedP2Choice(null);
    setRoundWinner(null);
    setLockClick(false);

    speak(correctAnswer.w);
  };

  useEffect(() => {
    startRound(0);
  }, []);

  const handleP1Choice = (option) => {
    if (lockClick || p1Answered) return;
    setP1Answered(true);
    setSelectedP1Choice(option.w);

    const isCorrect = option.w === currentQuestion.w;

    if (isCorrect) {
      beep('good');
      if (!roundWinner) {
        setRoundWinner('p1');
        setP1Score(prev => prev + 1);
        showToast("⚡ Người chơi 1 nhanh tay hơn!", "good");
      }
      checkRoundOver(true, p2Answered);
    } else {
      beep('bad');
      checkRoundOver(p1Answered, p2Answered);
    }
  };

  const handleP2Choice = (option) => {
    if (lockClick || p2Answered) return;
    setP2Answered(true);
    setSelectedP2Choice(option.w);

    const isCorrect = option.w === currentQuestion.w;

    if (isCorrect) {
      beep('good');
      if (!roundWinner) {
        setRoundWinner('p2');
        setP2Score(prev => prev + 1);
        showToast("⚡ Người chơi 2 nhanh tay hơn!", "good");
      }
      checkRoundOver(p1Answered, true);
    } else {
      beep('bad');
      checkRoundOver(p1Answered, p2Answered);
    }
  };

  const checkRoundOver = (p1Done, p2Done) => {
    // If one answered correctly, or both finished answering incorrectly
    if (roundWinner || (p1Done && p2Done)) {
      setLockClick(true);
      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= totalRounds) {
          finishGame();
        } else {
          setRound(nextRound);
          startRound(nextRound);
        }
      }, 1500);
    }
  };

  const finishGame = () => {
    beep('win');
    
    let winner = 'hòa';
    let emoji = "🤝";
    let title = "Trận Đấu Bất Phân Thắng Bại! 🤝";
    let msg = `Kết quả hòa ${p1Score} - ${p2Score}! Cả hai bé đều xuất sắc.`;
    
    let earnStars = 25;
    let earnCoins = 8;

    if (p1Score > p2Score) {
      winner = 'p1';
      emoji = "🏆⚡";
      title = "Người Chơi 1 Chiến Thắng! 🥇";
      msg = `Người chơi 1 chiến thắng kịch tính với tỷ số ${p1Score} - ${p2Score}!`;
      earnStars = 35;
      earnCoins = 12;
    } else if (p2Score > p1Score) {
      winner = 'p2';
      emoji = "🏆⚡";
      title = "Người Chơi 2 Chiến Thắng! 🥇";
      msg = `Người chơi 2 chiến thắng kịch tính với tỷ số ${p2Score} - ${p1Score}!`;
      earnStars = 35;
      earnCoins = 12;
    }

    addStarsAndCoins(earnStars, earnCoins, true);

    onFinish({
      emoji,
      title,
      msg,
      stars: earnStars,
      coins: earnCoins
    });
  };

  if (!currentQuestion) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #130f40, #000000)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      overflow: 'hidden'
    }}>
      <style>{`
        .split-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 2px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          border-radius: 20px;
          font-size: 1.15rem;
          font-weight: 800;
          padding: 12px 6px;
          cursor: pointer;
          transition: all 0.1s;
          box-shadow: 0 4px 0 rgba(0,0,0,0.3);
        }
        .split-btn:active {
          transform: scale(0.95);
        }
        .split-btn.correct {
          background: var(--c-grass) !important;
          border-color: #fff !important;
          box-shadow: 0 0 10px var(--c-grass);
        }
        .split-btn.wrong {
          background: var(--c-coral) !important;
          border-color: #fff !important;
        }
        .split-btn.dim {
          opacity: 0.3;
        }
      `}</style>

      {/* ==================== 1. PLAYER 1 HALF (ROTATED 180 DEGREES) ==================== */}
      <div style={{
        flex: 1,
        transform: 'rotate(180deg)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 14px',
        borderBottom: '2px solid rgba(255,255,255,0.1)'
      }}>
        {/* HUD top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '2.2rem' }}>🦊</span>
            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#ffb8b8' }}>Người Chơi 1</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--c-sun)' }}>
            Điểm: {p1Score}
          </div>
        </div>

        {/* Buttons choices */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', alignContent: 'center' }}>
          {options.map(opt => {
            const isSelected = selectedP1Choice === opt.w;
            const isCorrect = opt.w === currentQuestion.w;
            
            let btnClass = '';
            if (selectedP1Choice) {
              if (isCorrect) btnClass = 'correct';
              else if (isSelected) btnClass = 'wrong';
              else btnClass = 'dim';
            }

            return (
              <button
                key={opt.w}
                className={`split-btn ${btnClass}`}
                onClick={() => handleP1Choice(opt)}
                disabled={lockClick || p1Answered}
              >
                {opt.e} {opt.vi}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== 2. CENTRAL DIVIDER GAME BAR ==================== */}
      <div style={{
        background: '#1e1b4b',
        borderTop: '3px solid #ff758c',
        borderBottom: '3px solid #5ec8f8',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 5
      }}>
        <button 
          onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem' }}
        >
          ← Thoát
        </button>

        {/* Word output */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ff7eb3', letterSpacing: '0.5px' }}>
            🔊 {currentQuestion.w}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#ccc', fontWeight: 800, marginTop: '2px' }}>
            Hiệp {round + 1}/{totalRounds}
          </div>
        </div>

        <button
          onClick={() => { beep('sine'); speak(currentQuestion.w); }}
          style={{
            background: 'linear-gradient(135deg, var(--c-purple), var(--c-pink))',
            color: '#fff', border: 'none', width: '38px', height: '38px', borderRadius: '50%',
            display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        >
          <Volume2 size={18} />
        </button>
      </div>

      {/* ==================== 3. PLAYER 2 HALF (NORMAL ORIENTATION) ==================== */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 14px',
        borderTop: '2px solid rgba(255,255,255,0.1)'
      }}>
        {/* HUD top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '2.2rem' }}>🦄</span>
            <span style={{ fontWeight: 900, fontSize: '0.9rem', color: '#ffb8b8' }}>Người Chơi 2</span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--c-sun)' }}>
            Điểm: {p2Score}
          </div>
        </div>

        {/* Buttons choices */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', alignContent: 'center' }}>
          {options.map(opt => {
            const isSelected = selectedP2Choice === opt.w;
            const isCorrect = opt.w === currentQuestion.w;
            
            let btnClass = '';
            if (selectedP2Choice) {
              if (isCorrect) btnClass = 'correct';
              else if (isSelected) btnClass = 'wrong';
              else btnClass = 'dim';
            }

            return (
              <button
                key={opt.w}
                className={`split-btn ${btnClass}`}
                onClick={() => handleP2Choice(opt)}
                disabled={lockClick || p2Answered}
              >
                {opt.e} {opt.vi}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
