import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { STORIES_DATABASE } from '../context/StoriesDatabase';
import { ArrowLeft, BookOpen, Volume2, Sparkles, HelpCircle, CheckCircle } from 'lucide-react';

export default function StoryScreen() {
  const {
    currentProfile,
    setActiveScreen,
    addStarsAndCoins,
    speak,
    beep,
    showToast,
    readStories = [],     // List of finished story IDs
    completeStory,    // Function in GameContext to mark a story as finished
  } = useGame();

  const [activeStory, setActiveStory] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showFullTranslation, setShowFullTranslation] = useState(false);
  const [activeTooltipWord, setActiveTooltipWord] = useState(null);
  const [tooltipText, setTooltipText] = useState('');
  const [speakingWordIdx, setSpeakingWordIdx] = useState(null); // Real-time Karaoke word highlight index
  
  // Library Grade filter state
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('All'); // 'All' | 'young' | 'older'

  // Auto storytelling play states
  const [autoPlayMode, setAutoPlayMode] = useState(false);
  const [autoPlayTimeout, setAutoPlayTimeout] = useState(null);

  // Reading Quiz states
  const [inQuizMode, setInQuizMode] = useState(false);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [lockQuizClick, setLockQuizClick] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  // Celebration result state
  const [showTreasureClaim, setShowTreasureClaim] = useState(false);

  // Cleanup autoplay timeout
  const clearAutoTimeout = () => {
    if (autoPlayTimeout) {
      clearTimeout(autoPlayTimeout);
      setAutoPlayTimeout(null);
    }
  };

  // Cancel speech synthesis, cloud audio, and autoplay timer when changing active story or page
  useEffect(() => {
    return () => {
      clearAutoTimeout();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (window.activeCloudAudio) {
        try {
          window.activeCloudAudio.pause();
        } catch (err) {}
        window.activeCloudAudio = null;
      }
    };
  }, [activeStory, currentPage]);

  // Karaoke-style sentence reader helper
  const readPageKaraoke = (textToRead) => {
    if (!textToRead) return;
    
    // Clear existing highlights and timers
    clearAutoTimeout();
    setSpeakingWordIdx(null);

    // Split text by spaces and find ranges of each word
    const words = textToRead.split(' ');
    let currentPos = 0;
    const wordRanges = words.map(w => {
      const start = textToRead.indexOf(w, currentPos);
      const end = start + w.length;
      currentPos = end;
      return { word: w, start, end };
    });

    // onBoundary callback
    const onBoundary = (event) => {
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        // Find which word matches this index
        const idx = wordRanges.findIndex(r => charIndex >= r.start && charIndex < r.end);
        if (idx !== -1) {
          setSpeakingWordIdx(idx);
        }
      }
    };

    // onEnd callback
    const onEnd = () => {
      setSpeakingWordIdx(null);
      if (autoPlayMode) {
        // Trigger auto page turn after 2.2 seconds of display time
        const t = setTimeout(() => {
          triggerAutoPageTurn();
        }, 2200);
        setAutoPlayTimeout(t);
      }
    };

    speak(textToRead, onBoundary, onEnd);
  };

  const triggerAutoPageTurn = () => {
    if (!activeStory || inQuizMode) return;
    const nextP = currentPage + 1;
    if (nextP < activeStory.pages.length) {
      setCurrentPage(nextP);
      setTimeout(() => {
        readPageKaraoke(activeStory.pages[nextP].text);
      }, 300);
    } else {
      // Last page reached! Go to reading comprehension quiz
      setInQuizMode(true);
      setActiveQuestionIdx(0);
      setSelectedAnswer(null);
      setWrongAnswers([]);
      setLockQuizClick(false);
      speak("Now let's do a quick fun quiz!");
      beep('win');
    }
  };

  const handleSelectStory = (story) => {
    clearAutoTimeout();
    setActiveStory(story);
    setCurrentPage(0);
    setShowFullTranslation(false);
    setActiveTooltipWord(null);
    setSpeakingWordIdx(null);
    setInQuizMode(false);
    setWrongAnswers([]);
    beep('sine');
    
    // Only auto-read page 1 on load if Autoplay is active!
    // Otherwise, stay quiet and let the child read at their own pace.
    if (autoPlayMode) {
      speak(`Let's read the story: ${story.title}`);
      setTimeout(() => {
        readPageKaraoke(story.pages[0].text);
      }, 2000);
    }
  };

  const handlePageTurn = (dir) => {
    clearAutoTimeout();
    beep('sine');
    setActiveTooltipWord(null);
    setSpeakingWordIdx(null);
    setShowFullTranslation(false);
    
    if (dir === 'next') {
      const nextP = currentPage + 1;
      if (nextP < activeStory.pages.length) {
        setCurrentPage(nextP);
        // Only read next page if Autoplay is active
        if (autoPlayMode) {
          setTimeout(() => {
            readPageKaraoke(activeStory.pages[nextP].text);
          }, 300);
        }
      } else {
        // Last page reached! Unlock reading comprehension quiz
        setInQuizMode(true);
        setActiveQuestionIdx(0);
        setSelectedAnswer(null);
        setWrongAnswers([]);
        setLockQuizClick(false);
        speak("Now let's do a quick fun quiz!");
        beep('win');
      }
    } else {
      const prevP = currentPage - 1;
      if (prevP >= 0) {
        setCurrentPage(prevP);
        // Only read previous page if Autoplay is active
        if (autoPlayMode) {
          setTimeout(() => {
            readPageKaraoke(activeStory.pages[prevP].text);
          }, 300);
        }
      }
    }
  };

  // Speak and Highlight individual word + trigger tooltip translation
  const handleWordClick = (word, event) => {
    event.stopPropagation();
    
    // Clear Karaoke highlighting as we speak individual word
    setSpeakingWordIdx(null);
    
    // Clean word string from punctuation marks for tooltip lookup
    const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
    
    // Speak word
    speak(cleanWord);
    
    // Flash word index
    setActiveTooltipWord(word);
    
    // Set Tooltip Text from dictionary
    const translation = activeStory.pages[currentPage].wordsVi[cleanWord] || "từ vựng";
    setTooltipText(translation);

    // Auto clear tooltip after 3 seconds
    setTimeout(() => {
      setActiveTooltipWord(null);
    }, 3000);
  };

  // Speak the entire page sentence
  const handleReadEntirePage = () => {
    readPageKaraoke(activeStory.pages[currentPage].text);
    beep('sine');
  };

  // Evaluate comprehension quiz answer
  const handleAnswerChoice = (opt) => {
    if (lockQuizClick || wrongAnswers.includes(opt)) return;

    setSelectedAnswer(opt);
    setLockQuizClick(true);

    const currentQuiz = activeStory.quiz[activeQuestionIdx];
    const isCorrect = opt === currentQuiz.ans;

    if (isCorrect) {
      beep('good');
      showToast("Đố vui cực giỏi! Câu trả lời chính xác! 🌟", "good");
      
      setTimeout(() => {
        const nextQ = activeQuestionIdx + 1;
        if (nextQ < activeStory.quiz.length) {
          setActiveQuestionIdx(nextQ);
          setSelectedAnswer(null);
          setWrongAnswers([]);
          setLockQuizClick(false);
        } else {
          // Quiz fully cleared! Open treasure chest!
          setShowTreasureClaim(true);
        }
      }, 1200);
    } else {
      beep('bad');
      showToast("Chưa đúng rồi bé ơi! Bé hãy suy nghĩ lại thử nhé. 🦉", "bad");
      setWrongAnswers(prev => [...prev, opt]);
      setLockQuizClick(false);
    }
  };

  // Claim final reward and finish story
  const handleClaimReward = () => {
    beep('win');
    addStarsAndCoins(25, 10, true); // Reward: 25 Stars, 10 Coins
    completeStory(activeStory.id);
    
    setShowTreasureClaim(false);
    setActiveStory(null);
    showToast("Chúc mừng bé nhận Rương Báu 25 Sao & 10 Xu! 🎁🏆", "good");
  };

  // Library Category Colors mapping
  const categoryGradients = {
    "Ngụ Ngôn 🎭": "linear-gradient(135deg, #a8c0ff, #3f2b96)",
    "Bài Học Cuộc Sống 🌱": "linear-gradient(135deg, #11998e, #38ef7d)",
    "Cổ Tích VN 🌾": "linear-gradient(135deg, #f857a6, #ff5858)"
  };

  if (!currentProfile) return null;

  try {
    return (
    <div style={{ padding: '16px 12px', color: 'var(--ink)' }}>
      
      {/* 1. MAIN STORIES LIBRARY SCREEN */}
      {!activeStory && (
        <div>
          {/* Library Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <button className="back-btn" onClick={() => setActiveScreen('home')} style={{ margin: 0 }}>
              ←
            </button>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--c-purple)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <BookOpen size={22} /> Góc Đọc Truyện 📖
            </h2>
          </div>

          {/* Stats Bar */}
          <div style={{
            background: 'var(--paper)', border: '2px solid rgba(0,0,0,0.05)',
            borderRadius: '20px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '18px', boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-soft)' }}>Học bạ đọc truyện</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--c-purple)', marginTop: '2px' }}>
                🏆 Bé đã đọc: {readStories.length}/{STORIES_DATABASE.length} truyện
              </div>
            </div>
            <div style={{
              fontSize: '2.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', animation: 'float 3s ease-in-out infinite'
            }}>
              📚
            </div>
          </div>
          {/* Library Grade Filters */}
          <div style={{
            display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.05)',
            padding: '5px', borderRadius: '16px', marginBottom: '18px'
          }}>
            <button
              onClick={() => { beep('sine'); setSelectedGradeFilter('All'); }}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 900,
                border: 'none',
                background: selectedGradeFilter === 'All' ? 'var(--c-purple)' : 'transparent',
                color: selectedGradeFilter === 'All' ? '#fff' : 'var(--ink-soft)',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              🌈 Tất cả
            </button>
            <button
              onClick={() => { beep('sine'); setSelectedGradeFilter('young'); }}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 900,
                border: 'none',
                background: selectedGradeFilter === 'young' ? 'var(--c-purple)' : 'transparent',
                color: selectedGradeFilter === 'young' ? '#fff' : 'var(--ink-soft)',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              🐥 Lớp 1 - 2
            </button>
            <button
              onClick={() => { beep('sine'); setSelectedGradeFilter('older'); }}
              style={{
                flex: 1, padding: '10px 4px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 900,
                border: 'none',
                background: selectedGradeFilter === 'older' ? 'var(--c-purple)' : 'transparent',
                color: selectedGradeFilter === 'older' ? '#fff' : 'var(--ink-soft)',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              🎓 Lớp 3 - 5
            </button>
          </div>

          {/* Stories Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
            {(() => {
              const filtered = STORIES_DATABASE.filter(story => {
                if (selectedGradeFilter === 'young') return story.gradeLevel.includes('1 - 2');
                if (selectedGradeFilter === 'older') return story.gradeLevel.includes('3 - 5');
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--ink-soft)', fontWeight: 800 }}>
                    🦉 Chưa có truyện nào thuộc nhóm lớp này bé ơi!
                  </div>
                );
              }

              return filtered.map(story => {
                const isCompleted = readStories.includes(story.id);
                const cardBg = categoryGradients[story.category] || "linear-gradient(135deg, #ff9f43, #ff5e36)";

                return (
                  <div
                    key={story.id}
                    onClick={() => handleSelectStory(story)}
                    style={{
                      background: cardBg, color: '#fff', borderRadius: '24px', padding: '16px',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.1)', cursor: 'pointer',
                    display: 'flex', gap: '14px', alignItems: 'center', position: 'relative',
                    transition: 'transform 0.2s', border: '3px solid rgba(255,255,255,0.2)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  {/* Category Pill Tag */}
                  <span style={{
                    position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.22)',
                    fontSize: '0.68rem', padding: '2px 8px', borderRadius: '8px', fontWeight: 800, textTransform: 'uppercase'
                  }}>
                    {story.category}
                  </span>

                  {/* Giant Emoji Book Cover */}
                  <div style={{
                    fontSize: '3.4rem', background: 'rgba(255,255,255,0.18)', borderRadius: '20px',
                    width: '74px', height: '74px', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)'
                  }}>
                    {story.e}
                  </div>

                  {/* Story descriptions */}
                  <div style={{ flex: 1, textAlign: 'left', paddingRight: '40px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '0 0 4px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                      {story.title}
                    </h3>
                    <p style={{ fontSize: '0.78rem', opacity: 0.9, margin: '0 0 8px', lineHeight: '1.3' }}>
                      {story.desc}
                    </p>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ background: '#fff', color: 'var(--c-purple)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>
                        {story.gradeLevel}
                      </span>
                      {isCompleted && (
                        <span style={{ background: 'var(--c-grass)', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '8px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          🏆 Hoàn thành
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE STORY VIEWER SCREEN */}
      {activeStory && !inQuizMode && (
        <div>
          {/* Active Story Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button 
              className="back-btn" 
              onClick={() => { beep('sine'); setActiveStory(null); }} 
              style={{ margin: 0, padding: '4px 12px', fontSize: '0.85rem' }}
            >
              ← Thư viện
            </button>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--ink-soft)' }}>
              Trang {currentPage + 1}/{activeStory.pages.length}
            </div>
          </div>

          {/* Interactive Story Reading Card */}
          <div className="play-card" style={{ padding: '22px 14px', minHeight: '380px' }}>
            
            {/* Auto Play / Narrator Mode Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <button
                onClick={() => {
                  beep('sine');
                  const newVal = !autoPlayMode;
                  setAutoPlayMode(newVal);
                  if (newVal) {
                    readPageKaraoke(activeStory.pages[currentPage].text);
                  } else {
                    clearAutoTimeout();
                    window.speechSynthesis?.cancel();
                    setSpeakingWordIdx(null);
                  }
                }}
                style={{
                  background: autoPlayMode ? 'linear-gradient(135deg, var(--c-sun), #ff9f43)' : 'rgba(0,0,0,0.06)',
                  color: autoPlayMode ? '#fff' : 'var(--ink-soft)',
                  border: 'none', padding: '6px 14px', borderRadius: '12px', fontSize: '0.8rem',
                  fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: autoPlayMode ? '0 3px 0 #d48000' : 'none'
                }}
              >
                <span>{autoPlayMode ? "📢 Đang tự động kể chuyện..." : "📖 Chế độ tự đọc truyện"}</span>
                <span style={{ fontSize: '0.9rem' }}>{autoPlayMode ? "⚡" : "⚙️"}</span>
              </button>
            </div>



            {/* Story Page Emoji Illustration */}
            <div style={{
              width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)',
              margin: '0 auto 16px', display: 'grid', placeItems: 'center', fontSize: '4.8rem',
              border: '3px solid rgba(0,0,0,0.04)', boxShadow: 'var(--shadow-sm)'
            }}>
              {activeStory.pages[currentPage].img}
            </div>

            {/* Karaoke-Style English Text with Tap-to-Translate */}
            <div style={{ margin: '14px 0 20px', position: 'relative' }}>
              <div style={{
                fontSize: '1.45rem', fontWeight: 900, color: 'var(--ink)', lineHeight: '1.6',
                display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px'
              }}>
                {activeStory.pages[currentPage].text.split(' ').map((word, wordIdx) => {
                  const cleanW = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
                  const isHovered = activeTooltipWord === word;
                  const isSpoken = speakingWordIdx === wordIdx;

                  let bg = 'transparent';
                  let textColor = 'var(--ink)';
                  let borderB = '2px dashed var(--c-purple)';
                  let scale = '1';

                  if (isHovered) {
                    bg = 'var(--c-sun)';
                    textColor = '#fff';
                    borderB = 'none';
                  } else if (isSpoken) {
                    bg = 'rgba(157, 107, 255, 0.22)';
                    textColor = 'var(--c-purple)';
                    borderB = '2px solid var(--c-purple)';
                    scale = '1.1';
                  }

                  return (
                    <span
                      key={wordIdx}
                      onClick={(e) => handleWordClick(word, e)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '6px',
                        padding: '1px 6px',
                        background: bg,
                        color: textColor,
                        borderBottom: borderB,
                        transform: `scale(${scale})`,
                        transition: 'all 0.15s ease',
                        display: 'inline-block',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => { if(!isHovered) e.currentTarget.style.color = 'var(--c-purple)'; }}
                      onMouseLeave={(e) => { if(!isHovered) e.currentTarget.style.color = 'var(--ink)'; }}
                    >
                      {word}

                      {/* Tap-to-Translate Tooltip popup */}
                      {isHovered && (
                        <span style={{
                          position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                          background: 'rgba(26,20,54,0.95)', color: '#fff', fontSize: '0.82rem',
                          padding: '6px 12px', borderRadius: '10px', whiteSpace: 'nowrap', zIndex: 120,
                          boxShadow: '0 4px 8px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)',
                          animation: 'popIn 0.2s ease'
                        }}>
                          💡 {tooltipText}
                          {/* Triangle arrow */}
                          <span style={{
                            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                            width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                            borderTop: '6px solid rgba(26,20,54,0.95)'
                          }}></span>
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
              
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', marginTop: '8px', fontWeight: 600 }}>
                💡 Bé gõ vào từng từ tiếng Anh ở trên để nghe đọc và xem giải nghĩa nhé!
              </div>
            </div>

            {/* Read aloud & translation quick buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '18px' }}>
              <button
                onClick={handleReadEntirePage}
                className="btn-ghost"
                style={{
                  width: 'auto', padding: '6px 18px', borderRadius: '12px',
                  background: 'var(--c-purple)', color: '#fff', border: 'none',
                  fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px',
                  boxShadow: '0 3px 0 #7a4fd6', fontWeight: 800
                }}
              >
                <Volume2 size={15} /> Đọc to cả trang 🔊
              </button>

              <button
                onClick={() => { beep('sine'); setShowFullTranslation(!showFullTranslation); }}
                className="btn-ghost"
                style={{
                  width: 'auto', padding: '6px 18px', borderRadius: '12px',
                  background: 'var(--paper)', color: 'var(--c-purple)', border: '2px solid var(--c-purple)',
                  fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontWeight: 800
                }}
              >
                💡 {showFullTranslation ? "Ẩn Dịch Nghĩa" : "Dịch Cả Trang"}
              </button>
            </div>

            {/* Full translation helper card */}
            {showFullTranslation && (
              <div style={{
                background: 'rgba(157, 107, 255, 0.05)', border: '2px dashed var(--c-purple)',
                padding: '12px 16px', borderRadius: '18px', margin: '8px 0 16px', animation: 'popIn 0.25s'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink-soft)' }}>Nghĩa tiếng Việt:</span>
                <div style={{ fontSize: '1.12rem', fontWeight: 800, color: 'var(--c-purple)', marginTop: '4px' }}>
                  {activeStory.pages[currentPage].vi}
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px' }}>
              <button
                onClick={() => handlePageTurn('prev')}
                disabled={currentPage === 0}
                className="btn-ghost"
                style={{
                  width: 'auto', padding: '10px 20px', borderRadius: '14px', fontSize: '0.88rem',
                  opacity: currentPage === 0 ? 0.35 : 1, pointerEvents: currentPage === 0 ? 'none' : 'auto'
                }}
              >
                ◀ Trang trước
              </button>

              <button
                onClick={() => handlePageTurn('next')}
                className="btn-big"
                style={{
                  width: 'auto', padding: '10px 24px', borderRadius: '14px', fontSize: '0.88rem',
                  marginTop: 0, background: 'linear-gradient(135deg, var(--c-grass), #38ef7d)',
                  boxShadow: '0 3px 0 #1f8054', fontWeight: 800
                }}
              >
                {currentPage === activeStory.pages.length - 1 ? "Đố Vui Đọc Hiểu 🧩" : "Trang sau ▶"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. INTERACTIVE READING COMPREHENSION QUIZ SCREEN */}
      {activeStory && inQuizMode && !showTreasureClaim && (
        <div>
          {/* Quiz Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: 800, color: 'var(--c-purple)' }}>
              <HelpCircle size={15} /> Thử thách đọc hiểu cuối truyện
            </div>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--ink-soft)' }}>
              Câu {activeQuestionIdx + 1}/{activeStory.quiz.length}
            </div>
          </div>

          {/* Quiz Play Card */}
          <div className="play-card" style={{ padding: '22px 14px' }}>
            
            {/* Owl Mascot representation */}
            <div style={{ fontSize: '4rem', animation: 'bob 2s ease-in-out infinite', margin: '4px 0 10px' }}>
              🦉🎓
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ink)', margin: '0 0 18px', padding: '0 6px' }}>
              ❓ {activeStory.quiz[activeQuestionIdx].q}
            </h3>

            {/* Multiple Choice Options Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {activeStory.quiz[activeQuestionIdx].opts.map(opt => {
                const isSelected = selectedAnswer === opt;
                const isWrong = wrongAnswers.includes(opt);
                const isCorrect = opt === activeStory.quiz[activeQuestionIdx].ans;

                let btnBg = '#fff';
                let btnBorder = '2px solid rgba(0,0,0,0.1)';
                let btnShadow = '0 4px 0 rgba(0,0,0,0.06)';
                let btnColor = 'var(--ink)';

                if (isSelected) {
                  if (isCorrect) {
                    btnBg = 'var(--c-grass)';
                    btnBorder = '2px solid #1f8054';
                    btnColor = '#fff';
                    btnShadow = '0 4px 0 #155b3b';
                  } else {
                    btnBg = 'var(--c-coral)';
                    btnBorder = '2px solid #b32a2a';
                    btnColor = '#fff';
                    btnShadow = '0 4px 0 #851c1c';
                  }
                } else if (isWrong) {
                  btnBg = 'rgba(0,0,0,0.04)';
                  btnBorder = '2px dashed rgba(0,0,0,0.1)';
                  btnShadow = 'none';
                  btnColor = 'var(--ink-soft)';
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswerChoice(opt)}
                    disabled={lockQuizClick || isWrong}
                    style={{
                      width: '100%', padding: '14px 18px', fontSize: '1.08rem', fontWeight: 800,
                      background: btnBg, border: btnBorder, boxShadow: btnShadow, color: btnColor,
                      borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      cursor: 'pointer', transition: 'all 0.1s'
                    }}
                  >
                    {isWrong ? "❌" : (isSelected && isCorrect ? "✅" : "✨")} {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. FINAL CELEBRATION TREASURE CLAIM MODAL */}
      {showTreasureClaim && (
        <div className="overlay show" style={{ zIndex: 190 }}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="big" style={{ fontSize: '5rem', animation: 'bounce 1.5s infinite' }}>🎁✨</div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--c-sun)', fontWeight: 900 }}>Rương Báu Đã Mở Khóa!</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', fontWeight: 600, lineHeight: '1.4', margin: '8px 0 18px' }}>
              Bé đã chinh phục xuất sắc truyện <b>{activeStory.title}</b> và trả lời trọn vẹn câu hỏi đọc hiểu của Chim Cú! 🦉🎉
            </p>

            {/* Treasure Reward row */}
            <div style={{
              background: 'rgba(255, 165, 0, 0.06)', border: '2px dashed var(--c-sun)',
              padding: '12px 14px', borderRadius: '18px', display: 'flex', justifyItems: 'center',
              justifyContent: 'center', gap: '20px', marginBottom: '20px'
            }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--c-sun)' }}>🪙 +10 Xu</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--c-sun)' }}>⭐ +25 Sao</div>
            </div>

            <button
              onClick={handleClaimReward}
              className="btn-big"
              style={{
                background: 'linear-gradient(135deg, #ffa500, #ff5e36)', color: '#fff',
                fontSize: '1.05rem', fontWeight: 800, marginTop: 0, boxShadow: '0 4px 0 #b97600'
              }}
            >
              🎉 Nhận Quà & Hoàn Thành
            </button>
          </div>
        </div>
      )}

    </div>
  );
  } catch (err) {
    return (
      <div style={{ padding: '24px', background: '#ffeef0', color: '#ff3b30', borderRadius: '20px', border: '3px solid #ff3b30', margin: '20px' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: '1.4rem' }}>Lỗi Nạp Màn Hình Đọc Truyện 😢</h3>
        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#555' }}>Vui lòng chụp lại thông báo này gửi cho kỹ thuật nhé:</p>
        <pre style={{ background: '#fff', padding: '12px', borderRadius: '10px', overflowX: 'auto', textAlign: 'left', border: '1px solid #ffccd2', color: '#333' }}>
          {err.stack || err.toString()}
        </pre>
        <button onClick={() => setActiveScreen('home')} className="btn-big" style={{ marginTop: '14px', background: 'var(--c-purple)', color: '#fff', border: 'none' }}>
          Quay lại Trang Chủ
        </button>
      </div>
    );
  }
}
