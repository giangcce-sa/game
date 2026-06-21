import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Sparkles, HelpCircle, Trophy, Zap, AlertCircle } from 'lucide-react';

export default function GameArcadeVS({ onComplete, onBack }) {
  const {
    currentProfile,
    setActiveScreen,
    addStarsAndCoins,
    speak,
    beep,
    showToast,
    getCombinedVocab,
    updateQuestProgress
  } = useGame();

  const [vocabList, setVocabList] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [targetWord, setTargetWord] = useState(null);
  const [options, setOptions] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [owlScore, setOwlScore] = useState(0);
  
  // Game states: 'idle' | 'playing' | 'round_end' | 'game_over'
  const [gameState, setGameState] = useState('idle');
  const [winnerMessage, setWinnerMessage] = useState('');
  
  // AI thinking states
  const [aiProgress, setAiProgress] = useState(0);
  const [aiLimitSec, setAiLimitSec] = useState(6); // Default 6 seconds thinking time
  const [roundWinner, setRoundWinner] = useState(null); // 'player' | 'owl' | 'none'
  const [clickedOption, setClickedOption] = useState(null);

  const aiTimerRef = useRef(null);
  const roundTimerRef = useRef(null);

  // Load vocab on mount
  useEffect(() => {
    const list = getCombinedVocab();
    setVocabList(list);
  }, []);

  // Determine Owl AI thinking speed based on current profile or grade
  useEffect(() => {
    if (!currentProfile) return;
    const grade = currentProfile.selectedGrade || 'grade3';
    if (grade === 'grade1' || grade === 'grade2') {
      setAiLimitSec(8); // Easier for smaller kids (8 seconds)
    } else {
      setAiLimitSec(5); // Faster for older kids (5 seconds)
    }
  }, [currentProfile]);

  const startNewGame = () => {
    if (vocabList.length < 5) {
      showToast("Kho từ vựng chưa đủ để thiết lập trận đấu! Cần ít nhất 5 từ.", "bad");
      return;
    }
    beep('sine');
    setPlayerScore(0);
    setOwlScore(0);
    setCurrentRound(1);
    setGameState('playing');
    setupRound(1);
  };

  const setupRound = (roundNum) => {
    // Pick a random target word
    const randIdx = Math.floor(Math.random() * vocabList.length);
    const word = vocabList[randIdx];
    setTargetWord(word);

    // Pick 3 random distractors
    const distractors = [];
    const usedIndices = new Set([randIdx]);
    while (distractors.length < 3) {
      const idx = Math.floor(Math.random() * vocabList.length);
      if (!usedIndices.has(idx)) {
        distractors.push(vocabList[idx]);
        usedIndices.add(idx);
      }
    }

    // Shuffle options
    const allOpts = [word, ...distractors].sort(() => 0.5 - Math.random());
    setOptions(allOpts);
    setRoundWinner(null);
    setClickedOption(null);
    setAiProgress(0);

    // Speak the English word automatically so kid hears and matches
    speak(word.w);

    // Start AI Thinking Interval
    if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    
    let currentPct = 0;
    const stepMs = 50; // Update every 50ms for smooth progress
    const totalSteps = (aiLimitSec * 1000) / stepMs;
    const pctIncrement = 100 / totalSteps;

    aiTimerRef.current = setInterval(() => {
      currentPct += pctIncrement;
      if (currentPct >= 100) {
        setAiProgress(100);
        clearInterval(aiTimerRef.current);
        // Owl AI triggers answer!
        handleOwlAnswer();
      } else {
        setAiProgress(currentPct);
      }
    }, stepMs);
  };

  const handlePlayerAnswer = (selectedOpt) => {
    if (roundWinner || gameState !== 'playing') return;
    
    // Stop AI Timer
    if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    setClickedOption(selectedOpt);

    const isCorrect = selectedOpt.w === targetWord.w;
    if (isCorrect) {
      beep('good');
      setRoundWinner('player');
      setPlayerScore(prev => prev + 1);
      showToast("Bé đã nhanh tay hơn Cú! +1 Điểm 🎉", "good");
    } else {
      beep('bad');
      setRoundWinner('owl');
      setOwlScore(prev => prev + 1);
      showToast("Tiếc quá! Bé chọn chưa đúng rồi 🦉", "bad");
    }

    moveToNextStep();
  };

  const handleOwlAnswer = () => {
    if (roundWinner || gameState !== 'playing') return;
    
    beep('bad');
    setRoundWinner('owl');
    setOwlScore(prev => prev + 1);
    showToast("Hết giờ! Cú Cốc Cốc đã trả lời nhanh hơn! 🦉💨", "bad");

    moveToNextStep();
  };

  const moveToNextStep = () => {
    if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    roundTimerRef.current = setTimeout(() => {
      if (currentRound < 5) {
        const nextR = currentRound + 1;
        setCurrentRound(nextR);
        setupRound(nextR);
      } else {
        // End of Game! Use functional setState to read the LATEST scores (avoid stale closure)
        setGameState('game_over');
        setPlayerScore(pScore => {
          setOwlScore(oScore => {
            if (pScore > oScore) {
              beep('win');
              setWinnerMessage("🏆 BÉ CHIẾN THẮNG XUẤT SẮC!");
              addStarsAndCoins(35, 12, true);
              updateQuestProgress('arena_win', 1);
            } else if (pScore < oScore) {
              beep('sine');
              setWinnerMessage("🦉 CÚ CỐC CỐC CHIẾN THẮNG!");
            } else {
              beep('sine');
              setWinnerMessage("🤝 KẾT QUẢ HÒA NHAU!");
            }
            // Report adventure node completion (12 stars/round won → 5 wins = 60 = 3⭐)
            if (onComplete) onComplete(pScore * 12);
            return oScore;
          });
          return pScore;
        });
      }
    }, 2200);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  return (
    <div style={{ padding: '16px 12px', color: 'var(--ink)' }}>
      {/* Game Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button 
          className="back-btn" 
          onClick={() => {
            beep('sine');
            if (aiTimerRef.current) clearInterval(aiTimerRef.current);
            if (onBack) onBack(); else setActiveScreen('home');
          }}
          style={{ margin: 0 }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--c-purple)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <Zap size={22} color="#ffa500" fill="#ffa500" /> Cú Đối Đầu 🦉⚡
        </h2>
      </div>

      {/* 1. IDLE STATE: WELCOME CARD */}
      {gameState === 'idle' && (
        <div className="play-card" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', animation: 'bounce 1.5s infinite', margin: '10px 0' }}>🦉⚡🧒</div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--c-purple)', margin: '10px 0 6px' }}>
            Thách Đấu Cú Cốc Cốc AI
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--ink-soft)', fontWeight: 600, lineHeight: '1.4', padding: '0 10px', marginBottom: '22px' }}>
            Chào mừng bé đến với Đấu Trường Tốc Độ! Cú Cốc Cốc sẽ đọc to một từ tiếng Anh. Bé hãy nhanh tay nhấp chọn nghĩa tiếng Việt đúng trước khi Cú AI suy nghĩ xong nhé!
          </p>

          {/* Difficulty tip */}
          <div style={{
            background: 'rgba(255, 165, 0, 0.06)', border: '2px dashed rgba(255,165,0,0.3)',
            padding: '10px 14px', borderRadius: '18px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '22px'
          }}>
            <Zap size={16} color="#ffa500" fill="#ffa500" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#d48000' }}>
              Độ khó: Cú AI suy nghĩ trong {aiLimitSec} giây!
            </span>
          </div>

          <button
            onClick={startNewGame}
            className="btn-big"
            style={{
              background: 'linear-gradient(135deg, #ffa500, #ff5e36)',
              boxShadow: '0 4px 0 #b97600', padding: '14px', fontSize: '1.15rem'
            }}
          >
            🔥 Sẵn Sàng Đối Đầu!
          </button>
        </div>
      )}

      {/* 2. PLAYING / ROUND END STATE */}
      {(gameState === 'playing' || roundWinner) && targetWord && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Real-time Arena Scoreboard */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'var(--paper)', border: '2px solid rgba(0,0,0,0.05)',
            borderRadius: '20px', padding: '10px 18px', boxShadow: 'var(--shadow-sm)'
          }}>
            {/* Player Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <span style={{ fontSize: '2rem' }}>{currentProfile?.avatar || '🧒'}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)' }}>Bé</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--c-purple)' }}>{playerScore} Điểm</div>
              </div>
            </div>

            {/* VS Badge */}
            <div style={{
              background: 'linear-gradient(135deg, #ffa500, #ff5e36)', color: '#fff',
              fontSize: '0.8rem', fontWeight: 900, padding: '4px 10px', borderRadius: '10px',
              boxShadow: '0 2px 4px rgba(255, 165, 0, 0.3)', textTransform: 'uppercase'
            }}>
              Hiệp {currentRound}/5
            </div>

            {/* Owl Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-soft)' }}>Cú Cốc Cốc</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--c-coral)' }}>{owlScore} Điểm</div>
              </div>
              <span style={{ fontSize: '2rem' }}>🦉</span>
            </div>
          </div>

          {/* Sân đấu Arena Card */}
          <div className="play-card" style={{ padding: '20px 14px', minHeight: '360px', position: 'relative' }}>
            
            {/* Owl AI progress indicator */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', fontWeight: 800, color: 'var(--ink-soft)', marginBottom: '4px' }}>
                <span>🦉 Tiến trình suy nghĩ của Cú AI:</span>
                <span style={{ color: aiProgress >= 70 ? 'var(--c-coral)' : 'var(--ink-soft)' }}>
                  {aiProgress >= 100 ? "Xong! 🦉💨" : `${Math.round(aiProgress)}%`}
                </span>
              </div>
              <div style={{ height: '14px', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.03)' }}>
                <div style={{
                  height: '100%',
                  width: `${aiProgress}%`,
                  background: aiProgress >= 70 
                    ? 'linear-gradient(90deg, #ff5e36, #dc3545)' 
                    : 'linear-gradient(90deg, var(--c-purple), var(--c-pink))',
                  borderRadius: '10px',
                  transition: 'width 0.05s linear'
                }}></div>
              </div>
            </div>

            {/* Mascot Owl avatar with dynamic animations */}
            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 12px' }}>
              <div style={{
                fontSize: '4.5rem',
                animation: roundWinner === 'owl' 
                  ? 'bounce 1s infinite' 
                  : (roundWinner === 'player' ? 'spin 0.6s' : 'bob 2.5s ease-in-out infinite')
              }}>
                {roundWinner === 'owl' ? '🦉🔥' : (roundWinner === 'player' ? '🦉😵' : '🦉')}
              </div>
              {/* Talking Bubble */}
              {!roundWinner && (
                <div style={{
                  position: 'absolute', bottom: '80%', left: '80%', background: 'rgba(0,0,0,0.85)',
                  color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '4px 8px', borderRadius: '8px',
                  whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  Đọc to: <span style={{ textDecoration: 'underline' }}>{targetWord.w}</span> 🔊
                </div>
              )}
            </div>

            {/* Target English Word */}
            <div style={{ margin: '6px 0 20px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                Nghe & chọn nghĩa đúng của:
              </span>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--c-purple)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                {targetWord.w}
                <button
                  onClick={() => { beep('sine'); speak(targetWord.w); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.8rem', display: 'grid', placeItems: 'center' }}
                  title="Nghe lại"
                >
                  🔊
                </button>
              </div>
            </div>

            {/* Bubble Options Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {options.map((opt, idx) => {
                const isCorrect = opt.w === targetWord.w;
                const isSelected = clickedOption === opt;
                
                let btnBg = '#fff';
                let btnBorder = '2px solid rgba(0,0,0,0.08)';
                let btnShadow = '0 4px 0 rgba(0,0,0,0.05)';
                let btnColor = 'var(--ink)';

                // Highlight results if round ended
                if (roundWinner) {
                  if (isCorrect) {
                    btnBg = 'var(--c-grass)';
                    btnBorder = '2px solid #1f8054';
                    btnShadow = '0 4px 0 #125737';
                    btnColor = '#fff';
                  } else if (isSelected) {
                    btnBg = 'var(--c-coral)';
                    btnBorder = '2px solid #b93737';
                    btnShadow = '0 4px 0 #7e2424';
                    btnColor = '#fff';
                  } else {
                    btnBg = 'rgba(0,0,0,0.02)';
                    btnBorder = '2px dashed rgba(0,0,0,0.06)';
                    btnShadow = 'none';
                    btnColor = 'var(--ink-soft)';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handlePlayerAnswer(opt)}
                    disabled={!!roundWinner}
                    style={{
                      width: '100%', padding: '14px 10px', fontSize: '1.05rem', fontWeight: 900,
                      background: btnBg, border: btnBorder, boxShadow: btnShadow, color: btnColor,
                      borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: '4px', cursor: 'pointer', transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!roundWinner) e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      if (!roundWinner) e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <span style={{ fontSize: '1.6rem' }}>{opt.e}</span>
                    <span>{opt.vi}</span>
                  </button>
                );
              })}
            </div>

            {/* Round outcome message */}
            {roundWinner && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(255,255,255,0.92)', borderRadius: '24px', zIndex: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '10px', animation: 'fadeIn 0.2s'
              }}>
                <div style={{ fontSize: '4.5rem' }}>
                  {roundWinner === 'player' ? '🎉🏆🚀' : '🦉💨💡'}
                </div>
                <h4 style={{
                  fontSize: '1.4rem', fontWeight: 900, 
                  color: roundWinner === 'player' ? 'var(--c-grass)' : 'var(--c-coral)', margin: 0
                }}>
                  {roundWinner === 'player' ? "BÉ THẮNG HIỆP NÀY! 🎉" : "CÚ CỐC CỐC CHIẾN THẮNG!"}
                </h4>
                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--ink-soft)', margin: 0 }}>
                  Từ vựng: <span style={{ color: 'var(--c-purple)', fontWeight: 800 }}>{targetWord.w}</span> nghĩa là <span style={{ color: 'var(--c-purple)', fontWeight: 800 }}>{targetWord.vi}</span>
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 3. GAME OVER STATE */}
      {gameState === 'game_over' && (
        <div className="play-card" style={{ padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '5.5rem', animation: 'bounce 1.5s infinite', margin: '10px 0' }}>
            {playerScore > owlScore ? '🏆👑🎁' : '🦉🎓💪'}
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--c-sun)', margin: '10px 0 6px' }}>
            {winnerMessage}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-soft)', fontWeight: 600, lineHeight: '1.4', marginBottom: '22px' }}>
            {playerScore > owlScore 
              ? `Chúc mừng bé đã phản xạ cực kỳ xuất sắc và thắng bạn Cú Cốc Cốc AI với tỷ số thuyết phục ${playerScore} - ${owlScore}! Nhận quà chiến thắng ngay!`
              : `Bé đã thi đấu rất cố gắng nhưng bạn Cú Cốc Cốc AI đã nhanh tay hơn chút xíu với tỷ số ${owlScore} - ${playerScore}. Hãy nhấn Chơi Lại để so tài tiếp nhé!`
            }
          </p>

          {/* Reward chest row if player won */}
          {playerScore > owlScore && (
            <div style={{
              background: 'rgba(255, 165, 0, 0.06)', border: '2px dashed var(--c-sun)',
              padding: '12px 14px', borderRadius: '18px', display: 'flex', justifyItems: 'center',
              justifyContent: 'center', gap: '20px', marginBottom: '22px'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--c-sun)' }}>🪙 +12 Xu</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--c-sun)' }}>⭐ +35 Sao</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { beep('sine'); if (onBack) onBack(); else setActiveScreen('home'); }}
              className="btn-ghost"
              style={{ flex: 1, padding: '12px', fontSize: '0.92rem', marginTop: 0 }}
            >
              ◀ Quay lại Bản Đồ
            </button>
            <button
              onClick={startNewGame}
              className="btn-big"
              style={{
                flex: 1, padding: '12px', fontSize: '0.92rem', marginTop: 0,
                background: 'linear-gradient(135deg, var(--c-grass), #38ef7d)',
                boxShadow: '0 4px 0 #1b7348'
              }}
            >
              🔄 Đấu Trận Mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
