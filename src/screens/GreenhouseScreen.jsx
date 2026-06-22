import React, { useState } from 'react';
import { useGame, VOCAB } from '../context/GameContext';
import { ArrowLeft, Sparkles, Volume2, Heart, Award } from 'lucide-react';
import { useCelebration, CelebrationLayer } from '../components/Celebration';

export default function GreenhouseScreen({ onBack }) {
  const { 
    currentProfile, 
    growSeed, 
    harvestSeed, 
    beep, 
    showToast, 
    speak,
    getCombinedVocab
  } = useGame();

  // Review modal states
  const [activeQuizSeed, setActiveQuizSeed] = useState(null); // The word object currently being reviewed
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lockQuiz, setLockQuiz] = useState(false);
  const [quizSuccess, setQuizSuccess] = useState(null); // true | false
  const cel = useCelebration();

  if (!currentProfile) return null;

  const failedSeeds = currentProfile.failedSeeds || [];

  // Get stage visual info for a seed
  const getSeedStageInfo = (points) => {
    if (points >= 3) return { e: "🌳🍎", label: "Cây Trĩu Quả 🧺", desc: "Sẵn sàng thu hoạch quả ngọt!" };
    if (points === 2) return { e: "🌿", label: "Cây Ra Lá Xanh 🌱", desc: "Cần thêm 1 lần tưới nước." };
    if (points === 1) return { e: "🌱", label: "Mầm Nhỏ Đáng Yêu ✨", desc: "Cần thêm 2 lần tưới nước." };
    return { e: "🪵", label: "Hạt Giống Trong Đất 💤", desc: "Cần thêm 3 lần tưới nước." };
  };

  // Launch review quiz for a specific seed
  const handleStartReview = (seed) => {
    beep('sine');
    setActiveQuizSeed(seed);
    setSelectedAnswer(null);
    setLockQuiz(false);
    setQuizSuccess(null);

    // Generate 3 choices
    const pool = getCombinedVocab();
    const wrongs = pool.filter(v => v.w !== seed.w);
    const shuffledWrongs = wrongs.sort(() => 0.5 - Math.random()).slice(0, 2);
    const choices = [seed, ...shuffledWrongs].sort(() => 0.5 - Math.random());
    setQuizOptions(choices);

    speak(seed.w);
  };

  const handleReviewAnswer = (option) => {
    if (lockQuiz) return;
    setLockQuiz(true);
    setSelectedAnswer(option.w);

    const isCorrect = option.w === activeQuizSeed.w;
    setQuizSuccess(isCorrect);

    if (isCorrect) {
      beep('good');
      growSeed(activeQuizSeed.w);
      cel.fire({});
      showToast("Chính xác! Bé tưới nước giúp cây lớn hơn rồi! 💦🌱", "good");
    } else {
      beep('bad');
      showToast("Chưa chính xác rồi bé ơi! Lần sau bé hãy nhìn kỹ hình nhé.", "bad");
    }

    setTimeout(() => {
      setActiveQuizSeed(null);
    }, 1800);
  };

  return (
    <div style={{ padding: '16px 12px', color: 'var(--ink)' }}>
      <CelebrationLayer controller={cel} />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button 
          className="back-btn" 
          onClick={() => { beep('sine'); onBack(); }}
          style={{ margin: 0 }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--c-purple)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          🌱 Vườn Ươm Cây Tri Thức
        </h2>
      </div>

      {/* Intro Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(38, 208, 166, 0.08), rgba(94, 200, 248, 0.08))',
        border: '2px dashed var(--c-mint)',
        borderRadius: '24px',
        padding: '16px',
        textAlign: 'left',
        marginBottom: '18px',
        lineHeight: '1.4'
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: 'var(--c-mint)' }}>
          🍃 Vườn Ươm Ôn Tập Từ Vựng Của Bé
        </h3>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-soft)', fontWeight: 700 }}>
          Các từ vựng bé trả lời chưa đúng ở các game sẽ rơi xuống đây làm **hạt giống**. Bé hãy ôn tập, tưới nước nảy mầm chúng thành **cây trĩu quả** để thu hoạch Rương Quà đặc biệt nhé! 🧺✨
        </p>
      </div>

      {/* Seeds list shelf grid */}
      {failedSeeds.length === 0 ? (
        /* --- EMPTY GARDEN STATE --- */
        <div style={{
          background: 'var(--paper)', border: '2px solid rgba(0,0,0,0.04)',
          borderRadius: '28px', padding: '50px 16px', textTransform: 'center', boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '4.8rem', animation: 'bob 2.8s ease-in-out infinite', marginBottom: '14px' }}>🌸🐝</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--c-mint)', margin: '0 0 6px' }}>
            Khu Vườn Đang Trống Trơn!
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 600, maxWidth: '300px', margin: '0 auto 20px', lineHeight: '1.4' }}>
            Bé học cực kỳ siêu phàm! Không có từ vựng bị sai nào cần ươm mầm cả. Bé hãy chơi game và giữ vững phong độ nhé!
          </p>
          <button className="btn-big" onClick={onBack} style={{ background: 'var(--c-purple)', display: 'inline-block', width: 'auto', padding: '10px 24px' }}>
            🏠 Tiếp Tục Học Thôi!
          </button>
        </div>
      ) : (
        /* --- ACTIVE SEEDS GRID --- */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {failedSeeds.map(seed => {
            const stage = getSeedStageInfo(seed.points);
            const isReady = seed.points >= 3;

            return (
              <div
                key={seed.w}
                style={{
                  background: 'var(--paper)',
                  border: isReady ? '3.5px solid var(--c-orange)' : '2.5px solid rgba(0,0,0,0.04)',
                  borderRadius: '24px',
                  padding: '14px 10px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  position: 'relative'
                }}
              >
                {/* Visual Plant stage emoji */}
                <div style={{
                  fontSize: '3.6rem',
                  height: '70px',
                  display: 'grid',
                  placeItems: 'center',
                  animation: isReady ? 'bob 2s ease-in-out infinite' : 'none'
                }}>
                  {stage.e}
                </div>

                <div style={{ fontWeight: 900, fontSize: '0.98rem', color: 'var(--ink)' }}>
                  {seed.w}
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', fontWeight: 800 }}>
                  {stage.label}
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden', margin: '4px 0' }}>
                  <div style={{
                    width: `${(seed.points / 3) * 100}%`,
                    height: '100%',
                    background: isReady ? 'linear-gradient(90deg, #ffa500, #ff5e36)' : 'linear-gradient(90deg, var(--c-mint), #26d0a6)',
                    borderRadius: '4px',
                    transition: 'width 0.3s'
                  }}></div>
                </div>

                {/* Action button */}
                {isReady ? (
                  <button
                    onClick={() => { beep('sine'); harvestSeed(seed.w); cel.fire({ stars: 30, coins: 15 }); }}
                    className="btn-big"
                    style={{
                      background: 'linear-gradient(135deg, #ffa500, #ff5e36)',
                      boxShadow: '0 3.5px 0 #b87000',
                      fontSize: '0.74rem',
                      padding: '6px',
                      height: '32px',
                      marginTop: '4px',
                      width: '100%',
                      fontWeight: 800
                    }}
                  >
                    🧺 Thu Hoạch!
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartReview(seed)}
                    className="btn-ghost"
                    style={{
                      borderColor: 'var(--c-mint)',
                      color: 'var(--c-mint)',
                      background: 'rgba(38,208,166,0.04)',
                      fontSize: '0.74rem',
                      padding: '6px',
                      height: '32px',
                      marginTop: '4px',
                      width: '100%',
                      fontWeight: 800,
                      borderWidth: '2px'
                    }}
                  >
                    💦 Tưới Nước
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- REVIEW QUESTION INTERACTIVE MODAL OVERLAY --- */}
      {activeQuizSeed && (
        <div className="overlay show" style={{ zIndex: 190, background: 'rgba(26,20,54,0.92)' }}>
          <div className="modal" style={{ maxWidth: '440px', padding: '24px 18px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
              💦 Thử Thách Tưới Nước Cho Cây:
            </span>

            <div style={{ fontSize: '3rem', margin: '14px 0 4px' }}>
              🔊
            </div>
            
            <button
              onClick={() => { beep('sine'); speak(activeQuizSeed.w); }}
              className="btn-ghost"
              style={{
                width: 'auto', padding: '6px 14px', borderRadius: '10px',
                borderColor: 'var(--c-purple)', color: 'var(--c-purple)',
                fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: 0
              }}
            >
              <Volume2 size={14} /> Nghe phát âm
            </button>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--c-purple)', margin: '18px 0 16px' }}>
              Từ phát âm trên có nghĩa tiếng Việt là gì nhỉ?
            </h3>

            {/* choices list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {quizOptions.map(option => {
                const isSelected = selectedAnswer === option.w;
                const isCorrect = option.w === activeQuizSeed.w;
                
                let btnClass = '';
                if (selectedAnswer) {
                  if (isCorrect) btnClass = 'correct';
                  else if (isSelected) btnClass = 'wrong';
                  else btnClass = 'dim';
                }

                return (
                  <button
                    key={option.w}
                    className={`opt ${btnClass}`}
                    onClick={() => handleReviewAnswer(option)}
                    disabled={lockQuiz}
                    style={{
                      height: '52px', fontSize: '1.15rem', fontWeight: 800,
                      background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px',
                      boxShadow: 'var(--shadow-sm)', cursor: 'pointer'
                    }}
                  >
                    {option.e} {option.vi}
                  </button>
                );
              })}
            </div>

            {/* Immediate visual feedback */}
            {quizSuccess !== null && (
              <div style={{
                marginTop: '16px', fontSize: '1.1rem', fontWeight: 900,
                color: quizSuccess ? 'var(--c-grass)' : 'var(--c-coral)',
                animation: 'popIn 0.3s'
              }}>
                {quizSuccess ? "🎉 Hoàn hảo! Hạt giống lớn lên rồi!" : "😢 Chưa đúng rồi. Thử lại lần sau nhé!"}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
