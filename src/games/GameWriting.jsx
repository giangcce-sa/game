import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function GameWriting({ onFinish, onBack }) {
  const {
    currentProfile,
    studyMode,
    selectedGrade,
    addStarsAndCoins,
    speak,
    beep,
    showToast,
    getCombinedVocab,
    updateAnalytics
  } = useGame();

  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  
  const [currentWordObj, setCurrentWordObj] = useState(null);
  const [typedLetters, setTypedLetters] = useState([]);
  const [lockClick, setLockClick] = useState(false);
  const [vocabPool, setVocabPool] = useState([]);

  const totalRounds = 6;
  const wordSpelledRef = useRef(false);

  // Detect if tracing mode is active (For Grade 1 and Grade 2 curriculum mode)
  const isTracingMode = studyMode === 'school' && (selectedGrade === 'grade1' || selectedGrade === 'grade2');

  // Bubble keyboard layout: standard QWERTY or simple alphabetical. Let's do a beautiful alphabetical or QWERTY keyboard.
  // QWERTY keyboard is very standard and prepares kids for real typing!
  const keyboardRows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M", "-"]
  ];

  const vowels = ["A", "E", "I", "O", "U"];

  // Initialize pool of words
  useEffect(() => {
    const pool = getCombinedVocab();
    if (pool && pool.length > 0) {
      // Shuffle and slice to get random unique words for this session
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      setVocabPool(shuffled);
      startRound(0, shuffled);
    }
  }, []);

  const startRound = (roundIdx, pool = vocabPool) => {
    if (!pool || pool.length === 0) return;
    
    // Pick word cyclically if pool is smaller than 6
    const wordObj = pool[roundIdx % pool.length];
    setCurrentWordObj(wordObj);
    setTypedLetters([]);
    setLockClick(false);
    wordSpelledRef.current = false;

    // Speak the word on start
    setTimeout(() => {
      speak(wordObj.w);
    }, 200);
  };

  // Double Input: Handle physical keyboard typing
  useEffect(() => {
    const handlePhysicalKeyDown = (e) => {
      if (lockClick || !currentWordObj) return;

      const key = e.key.toUpperCase();
      
      // Handle backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }

      // Handle letter inputs
      if (/^[A-Z\-]$/.test(key)) {
        e.preventDefault();
        handleInputLetter(key);
      }
    };

    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => {
      window.removeEventListener('keydown', handlePhysicalKeyDown);
    };
  }, [lockClick, currentWordObj, typedLetters]);

  const handleInputLetter = (letter) => {
    if (lockClick || !currentWordObj) return;

    const targetWord = currentWordObj.w.toUpperCase();
    const nextIndex = typedLetters.length;
    const expectedLetter = targetWord[nextIndex];

    // Play phonics audio or soft key sound
    speak(letter.toLowerCase());

    if (letter === expectedLetter) {
      // Correct letter!
      const newTyped = [...typedLetters, letter];
      setTypedLetters(newTyped);
      beep('sine');

      // Check if word completed
      if (newTyped.length === targetWord.length) {
        setLockClick(true);
        wordSpelledRef.current = true;
        
        // Update analytics
        updateAnalytics(currentWordObj.t, true);
        
        beep('good');
        speak(currentWordObj.w);
        showToast("Bé viết chính xác tuyệt đối! ✏️🎉", "good");
        
        // Reward: 15 stars, 6 coins
        addStarsAndCoins(15, 6, true);
        setCorrectCount(prev => prev + 1);

        setTimeout(() => {
          const nextRound = round + 1;
          if (nextRound >= totalRounds || lives <= 0) {
            finishGame(lives > 0, true);
          } else {
            setRound(nextRound);
            startRound(nextRound);
          }
        }, 1500);
      }
    } else {
      // Wrong letter!
      beep('bad');
      setLives(prev => prev - 1);
      
      showToast(`Chữ cái tiếp theo phải là "${expectedLetter}" bé ơi! 🥺`, "bad");
      addStarsAndCoins(0, 0, false); // reset combo streak

      const updatedLives = lives - 1;
      if (updatedLives <= 0) {
        setLockClick(true);
        updateAnalytics(currentWordObj.t, false);
        setTimeout(() => {
          finishGame(false, false);
        }, 1500);
      }
    }
  };

  const handleBackspace = () => {
    if (lockClick || typedLetters.length === 0) return;
    beep('sine');
    setTypedLetters(prev => prev.slice(0, -1));
  };

  // Magic hint wand 🪄: auto fills the next correct letter
  const handleMagicHint = () => {
    if (lockClick || !currentWordObj) return;

    const targetWord = currentWordObj.w.toUpperCase();
    const nextIndex = typedLetters.length;
    if (nextIndex >= targetWord.length) return;

    const nextCorrectLetter = targetWord[nextIndex];
    
    // Spend 2 coins or 5 stars if possible
    if (currentProfile && currentProfile.coins >= 2) {
      addStarsAndCoins(0, -2, false);
      showToast("🪄 Đũa thần giúp bé một chữ cái (-2 Xu)!", "good");
    } else if (currentProfile && currentProfile.stars >= 5) {
      addStarsAndCoins(-5, 0, false);
      showToast("🪄 Đũa thần giúp bé một chữ cái (-5 Sao)!", "good");
    } else {
      showToast("🪄 Đũa thần tặng bé miễn phí chữ cái này nè!", "good");
    }

    handleInputLetter(nextCorrectLetter);
  };

  const finishGame = (passed, lastWasCorrect = false) => {
    const finalCorrect = correctCount + (lastWasCorrect && wordSpelledRef.current ? 1 : 0);
    
    onFinish({
      emoji: passed ? "🏆" : "💪",
      title: passed ? "Vua Chính Tả Nhí! ✏️" : "Cùng Luyện Thêm Nhé!",
      msg: `Bé đã tập viết đúng ${finalCorrect}/${totalRounds} từ vựng bài học!`,
      stars: finalCorrect * 15,
      coins: finalCorrect * 6
    });
  };

  if (!currentWordObj) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink)' }}>
        <p>🔄 Đang chuẩn bị bài tập viết cho bé...</p>
      </div>
    );
  }

  const targetWordUpper = currentWordObj.w.toUpperCase();

  return (
    <div>
      {/* Game Header HUD */}
      <div className="game-head">
        <button className="back-btn" onClick={onBack}>← Về</button>
        <div className="progress-wrap">
          <div className="progress-bar" style={{ width: `${(round / totalRounds) * 100}%` }}></div>
        </div>
        <div className="lives">
          {"❤️".repeat(lives)}{"🤍".repeat(Math.max(0, 3 - lives))}
        </div>
      </div>

      {/* Play Card Container */}
      <div className="play-card" style={{ padding: '16px 12px', minHeight: '380px' }}>
        <div className="q-label" style={{ marginBottom: '4px' }}>
          {isTracingMode ? "✍️ Bé hãy viết đè lên các chữ cái mờ màu xám:" : "✏️ Bé hãy tự gõ đúng từ tiếng Anh cho hình này:"}
        </div>

        {/* Big Interactive Emoji */}
        <div 
          className="big-emoji"
          onClick={() => speak(currentWordObj.w)}
          style={{ 
            cursor: 'pointer',
            fontSize: '4.8rem',
            margin: '8px auto',
            width: '100px',
            height: '100px',
            display: 'grid',
            placeItems: 'center',
            background: 'var(--paper)',
            borderRadius: '24px',
            boxShadow: 'var(--shadow-sm)',
            border: '2px solid rgba(0,0,0,0.05)',
            transform: 'scale(1.05)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        >
          {currentWordObj.e}
        </div>

        {/* Vietnamese Translation helper card */}
        <div style={{
          background: 'var(--paper)', border: '2px dashed var(--c-purple)',
          padding: '6px 12px', borderRadius: '14px', display: 'inline-block',
          fontSize: '1.05rem', color: 'var(--ink)', fontWeight: 800, marginBottom: '14px'
        }}>
          💡 Nghĩa tiếng Việt: <span style={{ color: 'var(--c-purple)' }}>{currentWordObj.vi}</span>
        </div>

        {/* Spelling Slots Row */}
        <div style={{
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px', margin: '10px 0 20px'
        }}>
          {Array.from({ length: targetWordUpper.length }).map((_, idx) => {
            const letter = targetWordUpper[idx];
            const isFilled = idx < typedLetters.length;
            const filledChar = typedLetters[idx];

            return (
              <div
                key={idx}
                style={{
                  width: '38px',
                  height: '46px',
                  borderBottom: `4px solid ${isFilled ? 'var(--c-grass)' : 'var(--c-purple)'}`,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.45rem',
                  fontWeight: 900,
                  color: isFilled ? 'var(--c-grass)' : 'rgba(0,0,0,0.22)',
                  transition: 'all 0.15s ease-in-out',
                  transform: isFilled ? 'scale(1.08)' : 'none'
                }}
              >
                {isFilled ? filledChar : (isTracingMode ? letter : "_")}
              </div>
            );
          })}
        </div>

        {/* Magic Hint & Backspace Quick Actions row */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '16px'
        }}>
          <button
            onClick={handleMagicHint}
            disabled={lockClick || typedLetters.length === targetWordUpper.length}
            className="btn-ghost"
            style={{
              width: 'auto', padding: '6px 16px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #ffe27a, var(--c-orange))', color: '#fff',
              fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '4px',
              border: 'none', boxShadow: '0 3px 0 #d97b18', fontWeight: 800
            }}
          >
            <Sparkles size={14} /> Gợi ý đũa thần 🪄
          </button>

          <button
            onClick={handleBackspace}
            disabled={lockClick || typedLetters.length === 0}
            className="btn-ghost"
            style={{
              width: 'auto', padding: '6px 16px', borderRadius: '12px',
              background: 'var(--c-coral)', color: '#fff',
              fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '4px',
              border: 'none', boxShadow: '0 3px 0 #b32a2a', fontWeight: 800
            }}
          >
            <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>⌫</span> Xoá chữ cái
          </button>
        </div>

        {/* Bubble Virtual Keyboard */}
        <div style={{
          background: 'rgba(0,0,0,0.03)',
          border: '2px solid rgba(0,0,0,0.04)',
          borderRadius: '20px',
          padding: '10px 4px',
          margin: '0 auto',
          maxWidth: '560px'
        }}>
          {keyboardRows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '5px',
                marginBottom: rowIdx < keyboardRows.length - 1 ? '6px' : '0'
              }}
            >
              {row.map(char => {
                const isVowel = vowels.includes(char);
                let btnColor = 'linear-gradient(to bottom, #ffffff, #f0f0f0)';
                let activeBorder = '2px solid rgba(0,0,0,0.1)';
                let shadowColor = 'rgba(0,0,0,0.15)';
                let charColor = 'var(--ink)';

                if (isVowel) {
                  // Beautiful pastel purple/pink for vowels
                  btnColor = 'linear-gradient(to bottom, #e8ddff, #cbb5ff)';
                  activeBorder = '2px solid #b294ff';
                  shadowColor = '#9772fc';
                  charColor = '#5e2be3';
                } else if (char === '-') {
                  // Separator sign
                  btnColor = 'linear-gradient(to bottom, #e2f4ff, #b6e2ff)';
                  activeBorder = '2px solid #85c8ff';
                  shadowColor = '#57aeff';
                  charColor = '#0b66b7';
                }

                return (
                  <button
                    key={char}
                    onClick={() => handleInputLetter(char)}
                    disabled={lockClick || typedLetters.length === targetWordUpper.length}
                    style={{
                      width: '34px',
                      height: '42px',
                      padding: 0,
                      borderRadius: '10px',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      background: btnColor,
                      border: activeBorder,
                      boxShadow: `0 3px 0 ${shadowColor}`,
                      color: charColor,
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                      display: 'grid',
                      placeItems: 'center',
                      userSelect: 'none'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateY(2px)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = `0 3px 0 ${shadowColor}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = `0 3px 0 ${shadowColor}`;
                    }}
                  >
                    {char}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Physical Keyboard Tip */}
        <div style={{
          fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '12px', fontWeight: 600
        }}>
          💡 Mẹo: Bé có thể gõ trực tiếp phím chữ cái trên bàn phím máy tính thật nhé!
        </div>

      </div>
    </div>
  );
}
