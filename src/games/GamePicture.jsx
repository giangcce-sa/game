import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Clock } from 'lucide-react';

export default function GamePicture({ onFinish, onBack }) {
  const { 
    currentProfile, 
    selectedTopic, 
    addStarsAndCoins, 
    speak, 
    beep, 
    showToast,
    picLevel,
    levelUpGame,
    getCombinedVocab,
    updateAnalytics
  } = useGame();
  
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [lockClick, setLockClick] = useState(false);
  const [dimmedOpts, setDimmedOpts] = useState([]);
  
  // Timer state for high levels
  const [timeLeft, setTimeLeft] = useState(null);

  const totalRounds = 6;
  const isTimedLevel = picLevel >= 3;
  const secondsPerRound = picLevel === 3 ? 12 : 8;

  const getVocabPool = () => {
    const combined = getCombinedVocab();
    if (!selectedTopic || selectedTopic === 'all') return combined;
    const filtered = combined.filter(v => v.t === selectedTopic);
    return filtered.length >= 6 ? filtered : combined;
  };

  const startRound = (roundIdx) => {
    const pool = getVocabPool();
    const correctAnswer = pool[Math.floor(Math.random() * pool.length)];
    
    // Scoped Wrongs choices
    let wrongs = pool.filter(v => v.w !== correctAnswer.w);
    
    if (picLevel === 4) {
      // Hard distractors: prefer wrong words starting with the same character
      const firstChar = correctAnswer.w[0];
      const similarWrongs = wrongs.filter(w => w.w[0] === firstChar);
      if (similarWrongs.length >= 2) wrongs = similarWrongs;
    }

    const wrongsCount = picLevel === 1 ? 2 : 3; // 3 choices at Level 1, 4 choices later
    const shuffledWrongs = wrongs.sort(() => 0.5 - Math.random()).slice(0, wrongsCount);
    
    const roundOpts = [correctAnswer, ...shuffledWrongs].sort(() => 0.5 - Math.random());
    
    setCurrentQuestion(correctAnswer);
    setOptions(roundOpts);
    setSelectedOpt(null);
    setDimmedOpts([]);
    setLockClick(false);
    
    if (isTimedLevel) {
      setTimeLeft(secondsPerRound);
    }
    
    speak(correctAnswer.w);
  };

  useEffect(() => {
    startRound(0);
  }, []);

  // Ticking round timer
  useEffect(() => {
    if (timeLeft === null || lockClick) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, lockClick]);

  const handleTimeout = () => {
    setLockClick(true);
    beep('bad');
    setLives(prev => prev - 1);
    
    // Highlight correct answer
    setSelectedOpt('TIMEOUT_OCCURRED');
    showToast("⏱️ Hết giờ rồi bé ơi!", "bad");
    updateAnalytics(currentQuestion.t, false);

    setTimeout(() => {
      const nextRound = round + 1;
      const updatedLives = lives - 1;

      if (nextRound >= totalRounds || updatedLives <= 0) {
        finishGame(updatedLives > 0);
      } else {
        setRound(nextRound);
        startRound(nextRound);
      }
    }, 1500);
  };

  const handleAnswer = (option) => {
    if (lockClick) return;
    setLockClick(true);
    setSelectedOpt(option.w);

    const isCorrect = option.w === currentQuestion.w;
    updateAnalytics(currentQuestion.t, isCorrect);
    
    if (isCorrect) {
      beep('good');
      speak(currentQuestion.w);
      showToast(
        ["Đúng rồi bé ơi! 🎉", "Tuyệt vời quá! ⭐", "Quá giỏi luôn! 🌟"][Math.floor(Math.random() * 3)], 
        "good"
      );
      addStarsAndCoins(10, 4, true);
      setCorrectCount(prev => prev + 1);
    } else {
      beep('bad');
      setLives(prev => prev - 1);
      
      // Dim wrong options except correct and selected ones
      const wrongOpts = options.filter(o => o.w !== currentQuestion.w && o.w !== option.w).map(o => o.w);
      setDimmedOpts(wrongOpts);
      showToast(`Từ đúng là: ${currentQuestion.w}`, "bad");
      addStarsAndCoins(0, 0, false); // reset combo streak
    }

    setTimeout(() => {
      const nextRound = round + 1;
      const updatedLives = isCorrect ? lives : lives - 1;

      if (nextRound >= totalRounds || updatedLives <= 0) {
        finishGame(updatedLives > 0, isCorrect);
      } else {
        setRound(nextRound);
        startRound(nextRound);
      }
    }, isCorrect ? 900 : 1600);
  };

  const finishGame = (passed, lastWasCorrect = false) => {
    const finalCorrect = correctCount + (lastWasCorrect ? 1 : 0);
    const perfectScore = finalCorrect >= 5 && passed; // Correct at least 5 out of 6 questions to level up
    
    let leveledUp = false;
    if (perfectScore && picLevel < 5) {
      levelUpGame('picLevel');
      leveledUp = true;
    }

    onFinish({
      emoji: passed ? (perfectScore ? "🏆" : "🎉") : "💪",
      title: passed ? (leveledUp ? `Lên Cấp ${picLevel + 1}! 🎉` : "Vượt Ải Thành Công!") : "Cố Gắng Lên Bé!",
      msg: `Bé đã đúng ${finalCorrect}/${totalRounds} câu. ${leveledUp ? 'Bé đã thăng cấp độ khó mới!' : ''}`,
      stars: finalCorrect * 10,
      coins: finalCorrect * 4
    });
  };

  if (!currentQuestion) return null;

  return (
    <div>
      {/* Game Header */}
      <div className="game-head">
        <button className="back-btn" onClick={onBack}>← Về</button>
        <div className="progress-wrap">
          <div className="progress-bar" style={{ width: `${(round / totalRounds) * 100}%` }}></div>
        </div>
        {isTimedLevel && timeLeft !== null && (
          <div className="stat" style={{ color: timeLeft <= 3 ? 'var(--c-coral)' : 'var(--ink)' }}>
            <Clock size={14} style={{ marginRight: '2px', display: 'inline', verticalAlign: 'middle' }} />
            <span>{timeLeft}s</span>
          </div>
        )}
        <div className="lives">
          {"❤️".repeat(lives)}{"🤍".repeat(Math.max(0, 3 - lives))}
        </div>
      </div>

      {/* Main Play Card */}
      <div className="play-card">
        {picLevel === 5 ? (
          /* Level 5 Mode: Show word, Choose Emoji Option */
          <div>
            <div className="q-label" style={{ marginBottom: '10px' }}>Bé hãy chọn hình đúng cho từ tiếng Anh:</div>
            <div 
              className="big-emoji" 
              onClick={() => speak(currentQuestion.w)}
              style={{ cursor: 'pointer' }}
            >
              🔤
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--c-purple)', margin: '8px 0 16px' }}>
              🔊 {currentQuestion.w}
            </div>

            <div className="options">
              {options.map(opt => {
                const isSelected = selectedOpt === opt.w;
                const isCorrect = opt.w === currentQuestion.w;
                const isDimmed = dimmedOpts.includes(opt.w);
                
                let btnClass = '';
                if (selectedOpt) {
                  if (isCorrect) btnClass = 'correct';
                  else if (isSelected) btnClass = 'wrong';
                  else if (isDimmed) btnClass = 'dim';
                }

                return (
                  <button 
                    key={opt.w}
                    className={`opt ${btnClass}`}
                    onClick={() => handleAnswer(opt)}
                    disabled={lockClick}
                    style={{ fontSize: '2rem', padding: '10px 4px' }}
                  >
                    {opt.e}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Level 1-4 Mode: Show Emoji, Choose English Word Option */
          <div>
            <div className="q-label">Đây là hình gì nhỉ?</div>
            
            <div 
              className="big-emoji" 
              onClick={() => speak(currentQuestion.w)}
              style={{ cursor: 'pointer' }}
            >
              {currentQuestion.e}
            </div>
            
            <div className="speak-hint">
              <span className="pill">🔊 Bấm vào hình để nghe phát âm</span>
            </div>

            <div className="options">
              {options.map(opt => {
                const isSelected = selectedOpt === opt.w;
                const isCorrect = opt.w === currentQuestion.w;
                const isDimmed = dimmedOpts.includes(opt.w);
                
                let btnClass = '';
                if (selectedOpt) {
                  if (isCorrect) btnClass = 'correct';
                  else if (isSelected) btnClass = 'wrong';
                  else if (isDimmed) btnClass = 'dim';
                }

                return (
                  <button 
                    key={opt.w}
                    className={`opt ${btnClass}`}
                    onClick={() => handleAnswer(opt)}
                    disabled={lockClick}
                  >
                    {opt.w}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
