import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { GameProvider, useGame } from './context/GameContext';

// Eager (always needed)
import ProfilesScreen from './screens/ProfilesScreen';
import HomeScreen from './screens/HomeScreen';

// Lazy-loaded screens (large, infrequent)
const StoreScreen           = lazy(() => import('./screens/StoreScreen'));
const ParentHub             = lazy(() => import('./screens/ParentHub'));
const StoryScreen           = lazy(() => import('./screens/StoryScreen'));
const PetRoomScreen         = lazy(() => import('./screens/PetRoomScreen'));
const GreenhouseScreen      = lazy(() => import('./screens/GreenhouseScreen'));
const OnboardingScreen      = lazy(() => import('./screens/OnboardingScreen'));
const StoryGeneratorScreen  = lazy(() => import('./screens/StoryGeneratorScreen'));
const AdventureMapScreen    = lazy(() => import('./screens/AdventureMapScreen'));

// Lazy-loaded games (heaviest payload, loaded on demand)
const GameSpeechStudio = lazy(() => import('./games/GameSpeechStudio'));
const GameSplitVS      = lazy(() => import('./games/GameSplitVS'));
const GameFlashcard    = lazy(() => import('./games/GameFlashcard'));
const GameMinimalPairs = lazy(() => import('./games/GameMinimalPairs'));
const GamePicture      = lazy(() => import('./games/GamePicture'));
const GameMemory       = lazy(() => import('./games/GameMemory'));
const GameArcade       = lazy(() => import('./games/GameArcade'));
const GameQuiz         = lazy(() => import('./games/GameQuiz'));
const GameSentence     = lazy(() => import('./games/GameSentence'));
const GameWriting      = lazy(() => import('./games/GameWriting'));
const GameArcadeVS     = lazy(() => import('./games/GameArcadeVS'));
const GameGrammar      = lazy(() => import('./games/GameGrammar'));
const GameListening    = lazy(() => import('./games/GameListening'));
const GameConversation = lazy(() => import('./games/GameConversation'));

import { VIETNAM_CURRICULUM } from './context/VietnamCurriculum';
import { Shield } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import AuthScreen from './screens/AuthScreen';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import { isSupabaseEnabled } from './lib/supabase';
import { maybeShowReminder } from './lib/notifications';

function LoadingFallback() {
  return (
    <div style={{
      display: 'grid', placeItems: 'center', minHeight: '60vh',
      flexDirection: 'column', gap: 14, padding: 20,
    }}>
      <div style={{ fontSize: '3rem', animation: 'bob 1.6s ease-in-out infinite' }}>🦉</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--c-purple)' }}>
        Cú đang chuẩn bị...
      </div>
      <div style={{
        width: 36, height: 36, border: '4px solid rgba(157,107,255,0.2)',
        borderTopColor: '#9d6bff', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AppContent({ userId, onSignOut }) {
  const {
    activeScreen,
    setActiveScreen,
    toastMessage,
    toastKind,
    beep,
    isTimeOut,
    changeTimeLimit,
    currentProfile,
    profiles,
    recordGameFinish,

    // Primary school curriculum details
    studyMode,
    selectedGrade,
    completeUnit,

    // Adventure Map
    completeAdventureNode,
    setSelectedTopic,

    // Cloud sync
    mergeCloudProfiles,

    // Adaptive difficulty
    autoAdjustLevel,
  } = useGame();

  // Sync profile to Supabase on every change (debounced 2s)
  const { upsertProfileDebounced, loadProfiles, flushOfflineQueue } = useSync(userId);
  useEffect(() => {
    if (currentProfile && userId) {
      upsertProfileDebounced(currentProfile);
    }
  }, [currentProfile, userId, upsertProfileDebounced]);
  useEffect(() => {
    if (userId) flushOfflineQueue();
  }, [userId, flushOfflineQueue]);
  // Pull cloud profiles on login and merge into local (last-write-wins)
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const cloud = await loadProfiles();
      if (!cancelled && cloud && cloud.length > 0) mergeCloudProfiles(cloud);
    })();
    return () => { cancelled = true; };
  }, [userId, loadProfiles, mergeCloudProfiles]);

  // Daily reminder check — on mount + every 30 min while app is open
  useEffect(() => {
    if (!currentProfile) return;
    maybeShowReminder(currentProfile);
    const interval = setInterval(() => maybeShowReminder(currentProfile), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentProfile]);

  const [chatOpen, setChatOpen] = useState(false);
  const [activeGame, setActiveGame] = useState(null); // 'picture' | 'memory' | 'arcade' | 'quiz' | 'sentence'
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState({ emoji: '🎉', title: '', msg: '', stars: 0, coins: 0 });
  const [bgDecoList, setBgDecoList] = useState([]);
  const [adventureQuestNode, setAdventureQuestNode] = useState(null);
  
  // Parental eye-lock verification states
  const [numA, setNumA] = useState(0);
  const [numB, setNumB] = useState(0);
  const [parentCode, setParentCode] = useState('');

  const savedPin = (profiles || []).map(p => p?.pinCode).find(p => typeof p === 'string' && p.length >= 4) || null;

  const generateMathQuestion = () => {
    // Harder gate when no PIN: 2-digit × 1-digit
    setNumA(Math.floor(20 + Math.random() * 70)); // 20-89
    setNumB(Math.floor(6 + Math.random() * 4));   // 6-9
  };

  useEffect(() => {
    if (isTimeOut) {
      if (!savedPin) generateMathQuestion();
      setParentCode('');
    }
  }, [isTimeOut, savedPin]);

  // Setup background floating bubbles
  useEffect(() => {
    const bubbles = [];
    const emojis = ["⭐", "🌈", "☁️", "🎈", "✨", "🍎", "🐱", "🚀", "🌟", "🎨", "🦖", "🦄", "🦊"];
    for (let i = 0; i < 12; i++) {
      bubbles.push({
        id: i,
        char: emojis[Math.floor(Math.random() * emojis.length)],
        left: `${Math.random() * 90}%`,
        top: `${Math.random() * 85}%`,
        dur: `${7 + Math.random() * 7}s`,
        delay: `${Math.random() * 4}s`
      });
    }
    setBgDecoList(bubbles);
  }, []);

  const handleSelectGame = (gameId) => {
    setActiveGame(gameId);
    setActiveScreen('game');
  };

  // Adventure Map: select quest → set topic + launch matching game
  const handleAdventureSelectQuest = (node) => {
    setAdventureQuestNode(node);
    if (node.topic && node.topic !== 'all') {
      setSelectedTopic(node.topic);
    }
    handleSelectGame(node.game);
  };

  const handleGameFinish = (result) => {
    setResultData(result);
    setShowResultModal(true);
    beep('win');
    triggerConfetti();

    // Daily mini-streak: count this game toward today's quota
    recordGameFinish();

    // Adventure Map: mark quest node complete with earned stars
    if (adventureQuestNode) {
      completeAdventureNode(adventureQuestNode.id, result.stars || 0);
    }

    // Adaptive difficulty: ease the level down after a weak session (step-ups handled in-game)
    if (activeGame && typeof result.scorePct === 'number') {
      autoAdjustLevel(activeGame, result.scorePct);
    }

    // If baby plays in SGK School Mode and passes successfully, mark current Unit as completed!
    if (studyMode === 'school' && result.stars >= 40) {
      completeUnit();
    }
  };

  const handleReplayGame = () => {
    setShowResultModal(false);
    const current = activeGame;
    setActiveGame(null);
    setTimeout(() => setActiveGame(current), 50);
  };

  const handleGoHome = () => {
    setShowResultModal(false);
    const wasAdventure = !!adventureQuestNode;
    setActiveGame(null);
    setAdventureQuestNode(null);
    setActiveScreen(wasAdventure ? 'adventure_map' : 'home');
  };

  const handleUnlockTimer = (e) => {
    e.preventDefault();
    const ok = savedPin ? (parentCode === savedPin) : (parseInt(parentCode) === numA * numB);
    if (ok) {
      changeTimeLimit(10);
      setParentCode('');
    } else {
      alert(savedPin ? "Sai PIN. Thử lại nhé! 🔐" : "Kết quả chưa chính xác rồi phụ huynh ơi! 🧩");
      setParentCode('');
      if (!savedPin) generateMathQuestion();
    }
  };

  const confettiCanvasRef = useRef(null);
  const confettiAnimRef = useRef(null);

  useEffect(() => {
    return () => { if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current); };
  }, []);

  // Listen for global 'cu-confetti' events from anywhere in the app
  useEffect(() => {
    const handler = () => triggerConfetti();
    window.addEventListener('cu-confetti', handler);
    return () => window.removeEventListener('cu-confetti', handler);
  }, []); // eslint-disable-line

  const triggerConfetti = () => {
    const cvs = confettiCanvasRef.current;
    if (!cvs) return;
    if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current);
    const ctx = cvs.getContext('2d');
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;

    let parts = [];
    const colors = ["#ff6b6b","#ffd23f","#76d275","#5ec8f8","#9d6bff","#ff7eb3"];
    for (let i = 0; i < 130; i++) {
      parts.push({
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.35,
        vx: (Math.random() - 0.5) * 14,
        vy: Math.random() * -14 - 4,
        g: 0.35 + Math.random() * 0.2,
        s: 6 + Math.random() * 8,
        c: colors[Math.floor(Math.random() * colors.length)],
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
        life: 0
      });
    }

    const step = () => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      parts.forEach(p => {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      });
      parts = parts.filter(p => p.y < cvs.height + 40 && p.life < 260);
      if (parts.length > 0) {
        confettiAnimRef.current = requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        confettiAnimRef.current = null;
      }
    };
    step();
  };

  // Find curriculum data for active grade
  const activeGradeUnits = VIETNAM_CURRICULUM[selectedGrade] || [];

  return (
    <div id="app">
      {/* Dynamic Background Decorations */}
      <div className="bg-deco" aria-hidden="true">
        {bgDecoList.map(b => (
          <span 
            key={b.id} 
            style={{ 
              left: b.left, 
              top: b.top, 
              animationDuration: b.dur, 
              animationDelay: b.delay 
            }}
          >
            {b.char}
          </span>
        ))}
      </div>

      {/* Confetti overlay layer */}
      <canvas ref={confettiCanvasRef} style={{ position: 'fixed', inset: 0, zIndex: 95, pointerEvents: 'none' }}></canvas>

      {/* Floating Popup Toast notifications */}
      {toastMessage && (
        <div className={`toast show ${toastKind}`}>
          {toastMessage}
        </div>
      )}

      {/* SCREEN ROUTING */}
      {activeScreen === 'profiles' && <ProfilesScreen />}
      {activeScreen === 'home' && <HomeScreen onSelectGame={handleSelectGame} onOpenChat={() => { beep('sine'); setChatOpen(true); }} />}

      <Suspense fallback={<LoadingFallback />}>
        {activeScreen === 'store' && <StoreScreen />}
        {activeScreen === 'parent' && <ParentHub onSignOut={userId ? onSignOut : null} />}
        {activeScreen === 'stories' && <ErrorBoundary onGoHome={handleGoHome}><StoryScreen /></ErrorBoundary>}
        {activeScreen === 'speech_studio' && <ErrorBoundary onGoHome={handleGoHome}><GameSpeechStudio /></ErrorBoundary>}
        {activeScreen === 'pet_room' && <ErrorBoundary onGoHome={handleGoHome}><PetRoomScreen /></ErrorBoundary>}
        {activeScreen === 'greenhouse' && <ErrorBoundary onGoHome={handleGoHome}><GreenhouseScreen onBack={handleGoHome} /></ErrorBoundary>}
        {activeScreen === 'split_vs' && <ErrorBoundary onGoHome={handleGoHome}><GameSplitVS onFinish={handleGameFinish} onBack={handleGoHome} /></ErrorBoundary>}
        {activeScreen === 'flashcard' && <ErrorBoundary onGoHome={handleGoHome}><GameFlashcard onBack={handleGoHome} /></ErrorBoundary>}
        {activeScreen === 'minimal_pairs' && <ErrorBoundary onGoHome={handleGoHome}><GameMinimalPairs onBack={handleGoHome} /></ErrorBoundary>}
        {chatOpen && <ErrorBoundary onGoHome={() => setChatOpen(false)}><GameConversation onBack={() => setChatOpen(false)} /></ErrorBoundary>}
        {activeScreen === 'story_generator' && <ErrorBoundary onGoHome={handleGoHome}><StoryGeneratorScreen onBack={handleGoHome} /></ErrorBoundary>}
        {activeScreen === 'adventure_map' && (
          <ErrorBoundary onGoHome={() => { setAdventureQuestNode(null); setActiveScreen('home'); }}>
            <AdventureMapScreen
              onSelectQuest={handleAdventureSelectQuest}
              onBack={() => { setAdventureQuestNode(null); setActiveScreen('home'); }}
            />
          </ErrorBoundary>
        )}

        {/* Onboarding overlay for new profiles */}
        {currentProfile && !currentProfile.onboardingDone && activeScreen === 'home' && (
          <OnboardingScreen />
        )}

        {/* Game Screens */}
        {activeScreen === 'game' && (
          <ErrorBoundary onGoHome={handleGoHome} onReset={handleReplayGame}>
            {activeGame === 'picture' && <GamePicture onFinish={handleGameFinish} onBack={handleGoHome} />}
            {activeGame === 'memory' && <GameMemory onFinish={handleGameFinish} onBack={handleGoHome} />}
            {activeGame === 'arcade' && <GameArcade onFinish={handleGameFinish} onBack={handleGoHome} />}
            {activeGame === 'quiz' && <GameQuiz onFinish={handleGameFinish} onBack={handleGoHome} />}
            {activeGame === 'sentence' && <GameSentence onFinish={handleGameFinish} onBack={handleGoHome} curriculumData={activeGradeUnits} />}
            {activeGame === 'writing' && <GameWriting onFinish={handleGameFinish} onBack={handleGoHome} />}
            {activeGame === 'arcade_vs' && <GameArcadeVS onComplete={(stars) => { if (adventureQuestNode) completeAdventureNode(adventureQuestNode.id, stars); }} onBack={handleGoHome} />}
            {activeGame === 'grammar' && <GameGrammar onFinish={handleGameFinish} onBack={handleGoHome} />}
            {activeGame === 'listening' && <GameListening onFinish={handleGameFinish} onBack={handleGoHome} />}
          </ErrorBoundary>
        )}
      </Suspense>

      {/* Game End Success/Result Popup Modal */}
      {showResultModal && (
        <div className="overlay show">
          <div className="modal">
            <div className="big">{resultData.emoji}</div>
            <h2>{resultData.title}</h2>
            <p>{resultData.msg}</p>
            <div className="reward-row">
              <div className="r" style={{ color: '#ffa502' }}>🪙 +{resultData.coins} Xu</div>
              <div className="r" style={{ color: '#e8a200' }}>⭐ +{resultData.stars} Sao</div>
            </div>
            <button className="btn-big" onClick={handleReplayGame}>Chơi Tiếp ▶</button>
            <button className="btn-ghost" onClick={handleGoHome}>🏠 Về Trang Chủ</button>
          </div>
        </div>
      )}

      {/* EYE PROTECTION FULLSCREEN LOCK SYSTEM */}
      {isTimeOut && (
        <div className="overlay show" style={{ zIndex: 200, background: 'rgba(26,20,54,0.96)', backdropFilter: 'blur(10px)' }}>
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="big" style={{ animation: 'bob 2.6s ease-in-out infinite' }}>🦉</div>
            <h2 style={{ color: 'var(--c-coral)', fontSize: '1.6rem', fontWeight: 800 }}>Đã Hết Giờ Học Rồi Bé Ơi!</h2>
            <p style={{ fontWeight: 600, color: 'var(--ink-soft)', margin: '10px 0 16px', fontSize: '0.92rem', lineHeight: '1.4' }}>
              Bé học rất tốt ngày hôm nay! 🌟 <br />
              Đã đến lúc đôi mắt cần nghỉ ngơi rồi. Bé hãy đứng dậy, vươn vai uống nước và nhìn ra cửa sổ 1 phút nhé!
            </p>
            
            <div style={{ background: 'rgba(0,0,0,0.03)', padding: '14px', borderRadius: '18px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <Shield size={14} color="var(--c-purple)" /> Mở khóa cho Phụ huynh:
              </h4>
              <form onSubmit={handleUnlockTimer} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!savedPin && (
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--c-purple)', whiteSpace: 'nowrap' }}>
                    {numA} × {numB} =
                  </span>
                )}
                <input
                  type={savedPin ? 'password' : 'number'}
                  inputMode="numeric"
                  maxLength={savedPin ? 8 : 6}
                  className="input-fancy"
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                  placeholder={savedPin ? 'Mã PIN...' : 'Kết quả...'}
                  style={{ height: '40px', padding: '6px', fontSize: '0.98rem', textAlign: 'center', letterSpacing: savedPin ? '0.4em' : '0' }}
                />
                <button type="submit" className="btn-big" style={{ height: '40px', padding: '0 14px', width: 'auto', marginTop: 0, whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                  Thêm 10p
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { session, loading, signUp, signIn, signOut } = useAuth();
  const [skipped, setSkipped] = useState(false);

  const handleAuth = async (mode, email, password) => {
    if (mode === 'signup') return await signUp(email, password);
    return await signIn(email, password);
  };

  if (loading) return null;

  if (isSupabaseEnabled() && !session && !skipped) {
    return <AuthScreen onAuth={handleAuth} onSkip={() => setSkipped(true)} />;
  }

  return (
    <GameProvider>
      <AppContent userId={session?.user?.id || null} onSignOut={signOut} />
    </GameProvider>
  );
}
