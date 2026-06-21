import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export default function GameQuiz({ onFinish, onBack }) {
  const { 
    currentProfile, 
    selectedTopic, 
    addStarsAndCoins, 
    speak, 
    beep, 
    showToast,
    quizLevel,
    levelUpGame,
    getCombinedVocab,
    updateAnalytics,
    addFailedSeed
  } = useGame();
  
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  
  // Standard choice state
  const [options, setOptions] = useState([]);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [lockClick, setLockClick] = useState(false);
  const [dimmedOpts, setDimmedOpts] = useState([]);
  const [coolDownActive, setCoolDownActive] = useState(false);
  
  // Quiz modes: 'pic' | 'word' | 'listen' | 'spelling'
  const [quizMode, setQuizMode] = useState('pic'); 

  // Spelling mode states (Anagram)
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [typedLetters, setTypedLetters] = useState([]);
  const [usedLetterIndices, setUsedLetterIndices] = useState([]); // tracks which scrambled indices are active

  const totalRounds = 6;
  const currentLevel = currentProfile?.quizLevel || 1;

  const getVocabPool = () => {
    const combined = getCombinedVocab();
    if (!selectedTopic || selectedTopic === 'all') return combined;
    const filtered = combined.filter(v => v.t === selectedTopic);
    return filtered.length >= 6 ? filtered : combined;
  };

  const startRound = (roundIdx) => {
    const pool = getVocabPool();
    const correctAnswer = pool[Math.floor(Math.random() * pool.length)];
    
    // Choose wrong choices
    const wrongs = pool.filter(v => v.w !== correctAnswer.w);
    const shuffledWrongs = wrongs.sort(() => 0.5 - Math.random()).slice(0, 3);
    const roundOpts = [correctAnswer, ...shuffledWrongs].sort(() => 0.5 - Math.random());
    
    // Determine quiz modes. Level 4 and 5 include Anagram spelling challenge!
    const availableModes = currentLevel >= 4 
      ? ['pic', 'word', 'listen', 'spelling'] 
      : (currentLevel >= 3 ? ['pic', 'word', 'listen'] : (currentLevel >= 2 ? ['pic', 'word'] : ['pic']));
      
    const selectedMode = availableModes[Math.floor(Math.random() * availableModes.length)];
    
    setCurrentQuestion(correctAnswer);
    setOptions(roundOpts);
    setQuizMode(selectedMode);
    setSelectedOpt(null);
    setDimmedOpts([]);
    setLockClick(false);

    // If spelling mode, prepare letters
    if (selectedMode === 'spelling') {
      const letters = correctAnswer.w.toUpperCase().split('');
      // Scramble letters
      const scrambled = letters.map((char, index) => ({ char, index })).sort(() => 0.5 - Math.random());
      setScrambledLetters(scrambled);
      setTypedLetters([]);
      setUsedLetterIndices([]);
    }
    
    speak(correctAnswer.w);
  };

  useEffect(() => {
    startRound(0);
  }, []);

  // Standard choices handler
  const handleAnswerChoice = (option) => {
    if (lockClick) return;
    setLockClick(true);
    setSelectedOpt(option.w);

    const isCorrect = option.w === currentQuestion.w;
    updateAnalytics(currentQuestion.t, isCorrect);
    
    if (isCorrect) {
      beep('good');
      speak(currentQuestion.w);
      showToast(
        ["Hoàn hảo luôn bé ơi! 🎉", "Bé quá xuất sắc! ⭐", "Đúng rồi! Cực tốt! 🌟"][Math.floor(Math.random() * 3)], 
        "good"
      );
      addStarsAndCoins(12, 5, true);
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
      
      const wrongOpts = options.filter(o => o.w !== currentQuestion.w && o.w !== option.w).map(o => o.w);
      setDimmedOpts(wrongOpts);
      showToast(`Từ đúng là: ${currentQuestion.w}`, "bad");
      addStarsAndCoins(0, 0, false); // reset streak
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

  // Spelling Anagram actions
  const handleSpellingLetterClick = (letterObj) => {
    if (lockClick || usedLetterIndices.includes(letterObj.index)) return;
    
    const newTyped = [...typedLetters, letterObj.char];
    const newUsed = [...usedLetterIndices, letterObj.index];
    
    setTypedLetters(newTyped);
    setUsedLetterIndices(newUsed);

    // If fully typed, evaluate spelling
    if (newTyped.length === currentQuestion.w.length) {
      setLockClick(true);
      const spellingWord = newTyped.join('').toLowerCase();
      const isCorrect = spellingWord === currentQuestion.w.toLowerCase();
      
      updateAnalytics(currentQuestion.t, isCorrect);

      if (isCorrect) {
        beep('good');
        speak(currentQuestion.w);
        showToast("Ghép chữ cực giỏi! 🔠🎉", "good");
        addStarsAndCoins(15, 6, true); // More coins for spelling!
        setCorrectCount(prev => prev + 1);
      } else {
        beep('bad');
        setLives(prev => prev - 1);
        showToast(`Từ đúng là: ${currentQuestion.w.toUpperCase()}`, "bad");
        addStarsAndCoins(0, 0, false); // reset streak
        addFailedSeed(currentQuestion);
        setCoolDownActive(true);
      }

      setTimeout(() => {
        setCoolDownActive(false);
        const nextRound = round + 1;
        const updatedLives = isCorrect ? lives : lives - 1;

        if (nextRound >= totalRounds || updatedLives <= 0) {
          finishGame(updatedLives > 0, isCorrect);
        } else {
          setRound(nextRound);
          startRound(nextRound);
        }
      }, isCorrect ? 900 : 2500);
    }
  };

  const handleSpellingBackspace = () => {
    if (lockClick || typedLetters.length === 0) return;
    setTypedLetters(prev => prev.slice(0, -1));
    setUsedLetterIndices(prev => prev.slice(0, -1));
  };

  const finishGame = (passed, lastWasCorrect = false) => {
    const finalCorrect = correctCount + (lastWasCorrect ? 1 : 0);
    const perfectScore = finalCorrect >= 5 && passed; // Correct at least 5 out of 6 questions to level up
    
    let leveledUp = false;
    if (perfectScore && quizLevel < 5) {
      levelUpGame('quizLevel');
      leveledUp = true;
    }

    const isPerfect = finalCorrect === totalRounds && passed;
    const isCareless = finalCorrect <= 2;

    let rewardStars = finalCorrect * 12;
    let rewardCoins = finalCorrect * 5;
    let emoji = passed ? (perfectScore ? "🏆" : "🎓") : "💪";
    let title = passed ? (leveledUp ? `Lên Cấp ${quizLevel + 1}! 🎉` : "Vượt Ải Xuất Sắc!") : "Cùng Thử Lại Nhé!";
    let msg = `Bé đã đúng ${finalCorrect}/${totalRounds} câu. Trình độ hiện tại: Cấp ${currentProfile.quizLevel}.`;

    if (isPerfect) {
      emoji = "🎁🏆";
      title = "Perfect! Rương Vàng Nhân Đôi! 🎁";
      msg = "Con làm bài cực kỳ tập trung, không sai câu nào! Cú thưởng Rương Vàng gấp đôi điểm số nhé!";
      rewardStars = 120;
      rewardCoins = 50;
      // Dispatch double reward directly in game session
      addStarsAndCoins(60, 25, true); // give the extra bonus (we already gave standard)
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
        <button className="back-btn" onClick={onBack}>← Về</button>
        <div className="progress-wrap">
          <div className="progress-bar" style={{ width: `${(round / totalRounds) * 100}%` }}></div>
        </div>
        <div className="lives">
          {"❤️".repeat(lives)}{"🤍".repeat(Math.max(0, 3 - lives))}
        </div>
      </div>

      {/* Level Indicator Pills */}
      <div className="level-row" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
        {[1, 2, 3, 4, 5].map(lvl => (
          <div 
            key={lvl}
            className={`level-pill ${lvl < quizLevel ? 'done' : ''} ${lvl === quizLevel ? 'cur' : ''}`}
            style={{
              width: '36px', height: '36px', borderRadius: '50%', display: 'grid', placeItems: 'center',
              fontWeight: 800, fontSize: '0.9rem',
              background: lvl < quizLevel ? 'var(--c-grass)' : (lvl === quizLevel ? 'var(--c-sun)' : 'rgba(255,255,255,0.4)'),
              color: lvl < quizLevel ? '#fff' : 'var(--ink-soft)',
              boxShadow: 'var(--shadow-sm)',
              transform: lvl === quizLevel ? 'scale(1.18)' : 'none',
              border: lvl === quizLevel ? '3px solid #fff' : 'none'
            }}
          >
            {lvl < quizLevel ? "★" : lvl}
          </div>
        ))}
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

        {/* MODE 1: SPELLING ANAGRAM */}
        {quizMode === 'spelling' && (
          <div>
            <div className="q-label" style={{ marginBottom: '6px' }}>Bé hãy chọn chữ cái ghép thành từ đúng:</div>
            
            <div 
              className="big-emoji" 
              onClick={() => speak(currentQuestion.w)}
              style={{ cursor: 'pointer' }}
            >
              {currentQuestion.e}
            </div>

            {/* Spelling slots output */}
            <div style={{
              display: 'flex', justifyContent: 'center', gap: '6px', margin: '14px 0', minHeight: '44px'
            }}>
              {Array.from({ length: currentQuestion.w.length }).map((_, i) => (
                <div 
                  key={i}
                  style={{
                    width: '38px', height: '42px', borderBottom: '4px solid var(--c-purple)',
                    display: 'grid', placeItems: 'center', fontSize: '1.4rem', fontWeight: 800,
                    color: 'var(--c-purple)'
                  }}
                >
                  {typedLetters[i] || ""}
                </div>
              ))}
            </div>

            {/* Letters buttons pool */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
              {scrambledLetters.map(letterObj => {
                const isUsed = usedLetterIndices.includes(letterObj.index);
                return (
                  <button
                    key={letterObj.index}
                    onClick={() => handleSpellingLetterClick(letterObj)}
                    disabled={lockClick || isUsed}
                    className="opt"
                    style={{
                      width: '46px', height: '46px', padding: 0, display: 'grid', placeItems: 'center',
                      fontSize: '1.3rem', borderRadius: '12px',
                      opacity: isUsed ? 0.35 : 1, transform: isUsed ? 'scale(0.85)' : 'none',
                      background: '#fff', boxShadow: isUsed ? 'none' : '0 3px 0 rgba(0,0,0,0.1)'
                    }}
                  >
                    {letterObj.char}
                  </button>
                );
              })}
            </div>

            {/* Spelling backspace */}
            <button 
              className="btn-ghost" 
              onClick={handleSpellingBackspace}
              disabled={lockClick || typedLetters.length === 0}
              style={{
                width: 'auto', padding: '6px 14px', background: 'var(--c-coral)', color: '#fff',
                fontSize: '0.82rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px'
              }}
            >
              ⬅ Xoá chữ
            </button>
          </div>
        )}

        {/* MODE 2: CHOOSE EMOJI IMAGE FOR ENGLISH WORD */}
        {quizMode === 'word' && (
          <div>
            <div className="q-label">Bé tìm hình đúng cho từ tiếng Anh dưới đây:</div>
            <div 
              className="big-emoji" 
              onClick={() => speak(currentQuestion.w)}
              style={{ cursor: 'pointer' }}
            >
              🔤
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--c-purple)', margin: '8px 0 12px' }}>
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
                    onClick={() => handleAnswerChoice(opt)}
                    disabled={lockClick}
                    style={{ fontSize: '2rem', padding: '10px 4px' }}
                  >
                    {opt.e}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 3: AUDIO ONLY (LISTEN AND CHOOSE WORD) */}
        {quizMode === 'listen' && (
          <div>
            <div className="q-label">Bé hãy nghe kỹ phát âm và chọn từ đúng nhé:</div>
            
            <button 
              className="listen-btn" 
              onClick={() => speak(currentQuestion.w)}
              style={{
                width: '120px', height: '120px', borderRadius: '50%', margin: '14px auto',
                background: 'radial-gradient(circle at 35% 30%,#ffe27a,var(--c-orange))',
                display: 'grid', placeItems: 'center', fontSize: '3.4rem', color: '#fff',
                boxShadow: '0 8px 0 #d97b18, 0 6px 12px rgba(60,40,120,.18)', transition: '.12s',
                cursor: 'pointer'
              }}
            >
              🔊
            </button>
            <div className="speak-hint">
              <span className="pill">Chạm nút cam để nghe lại phát âm</span>
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
                    onClick={() => handleAnswerChoice(opt)}
                    disabled={lockClick}
                  >
                    {opt.w}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 4: STANDARD PICTURE CHOOSE WORD */}
        {quizMode === 'pic' && (
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
                    onClick={() => handleAnswerChoice(opt)}
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
