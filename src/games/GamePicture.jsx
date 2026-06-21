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
    updateAnalytics,

    // Speech variables
    isSpeechSupported,
    isListeningSpeech,
    startListeningSpeech,
    stopListeningSpeech,
    addFailedSeed
  } = useGame();
  
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [lockClick, setLockClick] = useState(false);
  const [dimmedOpts, setDimmedOpts] = useState([]);
  const [coolDownActive, setCoolDownActive] = useState(false);
  
  // Timer state for high levels
  const [timeLeft, setTimeLeft] = useState(null);

  const totalRounds = 6;
  const isTimedLevel = picLevel >= 3;
  const secondsPerRound = picLevel === 3 ? 12 : 8;

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (stopListeningSpeech) stopListeningSpeech();
    };
  }, []);

  const handleSpeechClick = () => {
    if (lockClick || !currentQuestion) return;

    if (isListeningSpeech) {
      if (stopListeningSpeech) stopListeningSpeech();
      return;
    }

    if (startListeningSpeech) {
      startListeningSpeech(
        currentQuestion.w,
        (spokenText) => {
          beep('good');
          speak(currentQuestion.w);
          showToast(`Bé phát âm chuẩn quá! "${spokenText}" 🎙️🎉`, "good");
          
          // Bonus reward: +5 Stars, +2 Coins for speaking!
          addStarsAndCoins(5, 2, true);
          setCorrectCount(prev => prev + 1);
          
          setSelectedOpt(currentQuestion.w);
          setLockClick(true);
          updateAnalytics(currentQuestion.t, true);

          setTimeout(() => {
            const nextRound = round + 1;
            if (nextRound >= totalRounds || lives <= 0) {
              finishGame(lives > 0, true);
            } else {
              setRound(nextRound);
              startRound(nextRound);
            }
          }, 900);
        },
        (spokenText) => {
          beep('bad');
          showToast(`Bé phát âm chưa đúng lắm, thử lại nhé! Bé nói: "${spokenText}" 🦉`, "bad");
        }
      );
    }
  };

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

      setTimeout(() => {
        const nextRound = round + 1;
        if (nextRound >= totalRounds) {
          finishGame(lives > 0, true);
        } else {
          setRound(nextRound);
          startRound(nextRound);
        }
      }, 900);
    } else {
      beep('bad');
      setLives(prev => prev - 1);
      
      // Dim wrong options except correct and selected ones
      const wrongOpts = options.filter(o => o.w !== currentQuestion.w && o.w !== option.w).map(o => o.w);
      setDimmedOpts(wrongOpts);
      showToast(`Từ đúng là: ${currentQuestion.w}`, "bad");
      addStarsAndCoins(0, 0, false); // reset combo streak
      addFailedSeed(currentQuestion);

      setCoolDownActive(true);

      setTimeout(() => {
        setCoolDownActive(false);
        const nextRound = round + 1;
        const updatedLives = lives - 1;

        if (nextRound >= totalRounds || updatedLives <= 0) {
          finishGame(updatedLives > 0, false);
        } else {
          setRound(nextRound);
          startRound(nextRound);
        }
      }, 2500);
    }
  };

  const finishGame = (passed, lastWasCorrect = false) => {
    const finalCorrect = correctCount + (lastWasCorrect ? 1 : 0);
    const perfectScore = finalCorrect >= 5 && passed; // Correct at least 5 out of 6 questions to level up
    
    let leveledUp = false;
    if (perfectScore && picLevel < 5) {
      levelUpGame('picLevel');
      leveledUp = true;
    }

    const isPerfect = finalCorrect === totalRounds && passed;
    const isCareless = finalCorrect <= 2;

    let rewardStars = finalCorrect * 10;
    let rewardCoins = finalCorrect * 4;
    let emoji = passed ? (perfectScore ? "🏆" : "🎉") : "💪";
    let title = passed ? (leveledUp ? `Lên Cấp ${picLevel + 1}! 🎉` : "Vượt Ải Thành Công!") : "Cố Gắng Lên Bé!";
    let msg = `Bé đã đúng ${finalCorrect}/${totalRounds} câu. ${leveledUp ? 'Bé đã thăng cấp độ khó mới!' : ''}`;

    if (isPerfect) {
      emoji = "🎁🏆";
      title = "Perfect! Rương Vàng Nhân Đôi! 🎁";
      msg = "Con làm bài cực kỳ tập trung, không sai câu nào! Cú thưởng Rương Vàng gấp đôi điểm số nhé!";
      rewardStars = 100;
      rewardCoins = 40;
      addStarsAndCoins(50, 20, true); // extra double bonus
    } else if (isCareless) {
      emoji = "🦉💤";
      title = "Bé Cần Tập Trung Hơn! 🦉";
      msg = "Bé làm hơi nhanh và bị sai nhiều rồi. Hãy bình tĩnh nhìn hình để đạt điểm tuyệt đối nhé!";
      rewardStars = 1;
      rewardCoins = 1;
    }

    onFinish({
      emoji,
      title,
      msg,
      stars: rewardStars,
      coins: rewardCoins,
      scorePct: Math.round((finalCorrect / totalRounds) * 100),
    });
  };

  if (!currentQuestion) return null;

  return (
    <div>
      {/* Game Header */}
      <div className="game-head">
        <button className="back-btn" onClick={() => { if (stopListeningSpeech) stopListeningSpeech(); onBack(); }}>← Về</button>
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
      <div className="play-card" style={{ position: 'relative' }}>
        
        {/* Focus Guardian Timeout Prompt overlay */}
        {coolDownActive && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.08)',
            border: '3.5px dashed var(--c-coral)',
            padding: '12px 16px',
            borderRadius: '20px',
            margin: '0 0 16px',
            fontSize: '0.86rem',
            fontWeight: 800,
            color: 'var(--c-coral)',
            animation: 'shake 0.4s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center'
          }}>
            <span>🦉</span>
            <span>Cú nhắc nhở: "Bé chọn chưa đúng rồi. Hãy dừng lại 2 giây, suy nghĩ kỹ rồi chọn tiếp nhé!" ⏳</span>
          </div>
        )}

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

            {isSpeechSupported && (
              <div style={{ marginBottom: '14px', marginTop: '-6px' }}>
                <button
                  type="button"
                  onClick={handleSpeechClick}
                  className="btn-speech"
                  style={{
                    background: isListeningSpeech ? 'linear-gradient(135deg, #ff4757, #ff6b81)' : 'linear-gradient(135deg, #2ed573, #7bed9f)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '16px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isListeningSpeech ? '0 0 12px #ff4757' : '0 3px 0 #26af5f',
                    animation: isListeningSpeech ? 'pulseMic 1.2s infinite' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{isListeningSpeech ? '🎤 Đang nghe bé nói...' : '🎙️ Nói để trả lời (Thưởng +5⭐)'}</span>
                </button>
              </div>
            )}

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

            {isSpeechSupported && (
              <div style={{ marginBottom: '14px', marginTop: '-4px' }}>
                <button
                  type="button"
                  onClick={handleSpeechClick}
                  className="btn-speech"
                  style={{
                    background: isListeningSpeech ? 'linear-gradient(135deg, #ff4757, #ff6b81)' : 'linear-gradient(135deg, #2ed573, #7bed9f)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '16px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isListeningSpeech ? '0 0 12px #ff4757' : '0 3px 0 #26af5f',
                    animation: isListeningSpeech ? 'pulseMic 1.2s infinite' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{isListeningSpeech ? '🎤 Đang nghe bé nói...' : '🎙️ Nói để trả lời (Thưởng +5⭐)'}</span>
                </button>
              </div>
            )}

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
