import React, { useState, useEffect, useRef } from 'react';
import { useGame, TOPICS, MERCHANDISE } from '../context/GameContext';
import { VIETNAM_CURRICULUM } from '../context/VietnamCurriculum';
import { Sparkles, Gift, Trophy, Shield, Eye, BookOpen, Lock, Unlock, Heart, Award, Zap } from 'lucide-react';
import FeatureCards from './HomeScreen/FeatureCards';
import QuestWidget from './HomeScreen/QuestWidget';
import WeeklyChallengeWidget from './HomeScreen/WeeklyChallengeWidget';
import StreakTree from './HomeScreen/StreakTree';
import FriendsModal from './HomeScreen/FriendsModal';
import DailyStoryWidget from './HomeScreen/DailyStoryWidget';
import DailyStoryReader from './HomeScreen/DailyStoryReader';
import CuOwl from '../components/CuOwl';
import { getPetStage } from '../lib/petStages';

// Lucky Wheel sectors config
const WHEEL_SECTORS = [
  { label: '+30 🪙',  short: '30',  icon: '🪙', coins: 30, stars: 0,  color: '#ffd23f', boost: false },
  { label: '+20 ⭐', short: '20',  icon: '⭐', coins: 0,  stars: 20, color: '#ff7eb3', boost: false },
  { label: '+50 🪙',  short: '50',  icon: '🪙', coins: 50, stars: 0,  color: '#ff9f43', boost: false },
  { label: 'Bùa x2', short: 'x2',  icon: '🎟️', coins: 15, stars: 5,  color: '#9d6bff', boost: true  },
  { label: '+40 ⭐', short: '40',  icon: '⭐', coins: 0,  stars: 40, color: '#26d0a6', boost: false },
  { label: '+20 🪙',  short: '20',  icon: '🪙', coins: 20, stars: 5,  color: '#5ec8f8', boost: false },
];

export default function HomeScreen({ onSelectGame, onOpenChat }) {
  const {
    profiles,
    currentProfile,
    isDarkMode,
    toggleDarkMode,
    setActiveScreen,
    selectedTopic, 
    setSelectedTopic,
    claimDailyChest,
    speak,
    beep,
    showToast,
    customVocab,
    screenTimeRemaining,
    screenTimeLimit,
    updateProfileFields,
    setProfilePin,
    addStarsAndCoins,
    coinBoostRemaining,
    setCoinBoostRemaining,
    
    // Level progress
    picLevel,
    memLevel,
    arcLevel,
    quizLevel,
    wriLevel,

    // SGK primary mode from context
    studyMode,
    setStudyMode,
    selectedGrade,
    selectedUnit,
    setSelectedUnit,
    completedUnits,

    // BGM
    isBgmPlaying,
    toggleBgm,
  } = useGame();
  
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [dailyCoins, setDailyCoins] = useState(0);
  const [dailyStars, setDailyStars] = useState(0);

  // Lucky Wheel states
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showStoryReader, setShowStoryReader] = useState(false);
  const [showWheelModal, setShowWheelModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [landedSector, setLandedSector] = useState(null);
  const [wheelResult, setWheelResult] = useState(null);
  const wheelTimerRef = useRef(null);
  useEffect(() => () => { if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current); }, []);

  // Floating Cú: periodic flight tour
  const [cuFlying, setCuFlying] = useState(false);
  useEffect(() => {
    let t1, t2;
    const schedule = () => {
      const delay = 14000 + Math.random() * 12000; // 14-26s between flights
      t1 = setTimeout(() => {
        setCuFlying(true);
        beep('swoosh');
        t2 = setTimeout(() => { setCuFlying(false); schedule(); }, 5000); // flight = 5s
      }, delay);
    };
    schedule();
    return () => { if (t1) clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, []);

  // Hero mascot: random expression changes for personality
  const [mascotExpr, setMascotExpr] = useState('idle');
  const [heroFlying, setHeroFlying] = useState(false);
  const mascotExprResetRef = useRef(null);
  useEffect(() => {
    let scheduleT;
    const cycle = () => {
      const delay = 6000 + Math.random() * 8000; // 6-14s between mood changes
      scheduleT = setTimeout(() => {
        if (heroFlying) { cycle(); return; }
        const moods = ['happy', 'listening', 'thinking', 'happy'];
        setMascotExpr(moods[Math.floor(Math.random() * moods.length)]);
        if (mascotExprResetRef.current) clearTimeout(mascotExprResetRef.current);
        mascotExprResetRef.current = setTimeout(() => { setMascotExpr('idle'); cycle(); }, 1800);
      }, delay);
    };
    cycle();
    return () => {
      if (scheduleT) clearTimeout(scheduleT);
      if (mascotExprResetRef.current) clearTimeout(mascotExprResetRef.current);
    };
  }, [heroFlying]);

  // Hero mascot: periodic swoop tour (visit the games below)
  useEffect(() => {
    let t1, t2;
    const schedule = () => {
      const delay = 12000 + Math.random() * 10000; // 12-22s between swoops
      t1 = setTimeout(() => {
        setHeroFlying(true);
        setMascotExpr('flying');
        t2 = setTimeout(() => {
          setHeroFlying(false);
          setMascotExpr('happy');
          setTimeout(() => setMascotExpr('idle'), 1200);
          schedule();
        }, 4500); // swoop = 4.5s
      }, delay);
    };
    schedule();
    return () => { if (t1) clearTimeout(t1); if (t2) clearTimeout(t2); };
  }, []);

  // Passport & PIN setup modal states
  const [showPassport, setShowPassport] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [newPinCode, setNewPinCode] = useState('');

  const AVATAR_CHOICES = [
    '🦊', '🐼', '🦁', '🦄', '🐱', '🐰', '🐯', '🐶',
    '🦖', '🐲', '🐸', '🐵', '🐧', '🦉', '🐨', '🐻',
    '👧', '👦', '🧑‍🎤', '🦸', '🧚', '🧙', '🧜', '🤖',
    '🚀', '⭐', '🌈', '🦋',
  ];

  if (!currentProfile) return null;

  const today = new Date().toDateString();
  const hasClaimedDaily = currentProfile.lastDailyClaim === today;

  // Lucky Wheel spin logic
  const handleSpinWheel = () => {
    if (isSpinning || hasClaimedDaily) return;
    setIsSpinning(true);
    setWheelResult(null);
    setLandedSector(null);
    beep('sine');

    const sectorAngle = 360 / WHEEL_SECTORS.length;
    const sectorIdx = Math.floor(Math.random() * WHEEL_SECTORS.length);
    // Spin at least 5 full rotations + land on target sector
    const targetAngle = 360 * 6 + (sectorIdx * sectorAngle) + (sectorAngle / 2);
    setWheelRotation(prev => prev + targetAngle);

    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = setTimeout(() => {
      wheelTimerRef.current = null;
      const sector = WHEEL_SECTORS[sectorIdx];
      setLandedSector(sectorIdx);
      setWheelResult(sector);
      setIsSpinning(false);

      if (sector.boost) {
        setCoinBoostRemaining(300); // 5 minutes boost
        showToast('🎟️ Bùa Nhân Đôi Xu 5 phút đã kích hoạt! 🪙✨', 'good');
      }

      // Mark daily claim AND award rewards (claimDailyChest calls addStarsAndCoins internally)
      claimDailyChest(sector.stars, sector.coins);
    }, 4000);
  };

  const handleOpenDaily = () => {
    if (hasClaimedDaily) return;
    const coins = 20 + Math.floor(Math.random() * 41);
    const stars = 10 + Math.floor(Math.random() * 21);
    setDailyCoins(coins);
    setDailyStars(stars);
    setShowDailyModal(true);
  };

  const handleClaimDaily = () => {
    claimDailyChest(dailyStars, dailyCoins);
    setShowDailyModal(false);
  };

  const getRank = (stars) => {
    if (stars >= 500) return "👑 Đại pháp sư";
    if (stars >= 250) return "🦄 Hiệp sĩ rồng";
    if (stars >= 120) return "🚀 Phi hành gia";
    if (stars >= 50)  return "🌟 Thợ săn sao";
    return "🦉 Tân binh";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "Chào buổi sáng tốt lành";
    if (hour >= 11 && hour < 14) return "Bữa trưa vui vẻ nhé";
    if (hour >= 14 && hour < 18) return "Chào buổi chiều mát mẻ";
    return "Chúc bé tối vui vẻ";
  };

  const formatRemainingTime = (seconds) => {
    if (seconds === null) return null;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Find equipped companion pet
  const equippedPetItem = currentProfile.equippedPet
    ? MERCHANDISE.pets.find(x => x.id === currentProfile.equippedPet)
    : null;
  const equippedPetFriendship = currentProfile.equippedPet
    ? (currentProfile.petFriendship?.[currentProfile.equippedPet] || 0)
    : 0;
  const equippedPetStage = equippedPetItem ? getPetStage(equippedPetFriendship) : null;

  const handleMascotClick = () => {
    const speeches = [
      `Hello ${currentProfile.name}! Let's play games together!`,
      "Learning English is so much fun!",
      "Touch a game to start learning right now!",
      "You are doing an amazing job today!"
    ];
    setMascotExpr('happy');
    speak(speeches[Math.floor(Math.random() * speeches.length)], null, () => setMascotExpr('idle'));
    if (mascotExprResetRef.current) clearTimeout(mascotExprResetRef.current);
    mascotExprResetRef.current = setTimeout(() => setMascotExpr('idle'), 3500);
  };

  const handleSelectGameCheck = (gameKey) => {
    if (studyMode === 'free' && selectedTopic === 'custom' && customVocab.length === 0) {
      alert("Chủ đề tự chọn của cha mẹ đang trống trơn! 📝\nBé hãy bảo bố mẹ vào mục 'Góc Phụ Huynh' ở góc dưới màn hình soạn từ vựng cho mình học nhé!");
      return;
    }
    onSelectGame(gameKey);
  };

  // Get Primary School Curriculum Units lists
  const gradeUnits = VIETNAM_CURRICULUM[selectedGrade] || [];
  const currentUnitObj = gradeUnits.find(u => u.unit === selectedUnit) || { name: 'Bài học', sentence: '' };
  
  const getGradeLabel = (gId) => {
    if (gId === 'grade1') return "Lớp 1 🏫";
    if (gId === 'grade2') return "Lớp 2 🏫";
    if (gId === 'grade3') return "Lớp 3 🏫";
    if (gId === 'grade4') return "Lớp 4 🏫";
    return "Lớp 5 🏫";
  };

  return (
    <div>
      {/* HUD Top Bar */}
      <div className="topbar">
        <div className="hud-profile" onClick={() => setActiveScreen('profiles')}>
          <span className="ava" style={{ fontSize: '1.7rem', lineHeight: 1 }}>{currentProfile.avatar}</span>
          <span className="name" style={{ fontWeight: 800, fontSize: '0.85rem' }}>{currentProfile.name}</span>
        </div>
        <div className="spacer"></div>
        {screenTimeLimit && (
          <div className="stat" style={{ color: 'var(--c-coral)', border: '2px solid var(--c-coral)', padding: '4px 10px' }} title="Thời gian xem mắt còn lại">
            <Eye size={14} style={{ marginRight: '2px', display: 'inline', verticalAlign: 'middle' }} />
            <span style={{ fontSize: '0.85rem' }}>{formatRemainingTime(screenTimeRemaining)}</span>
          </div>
        )}
        <div className="stat star" title="Sao tích lũy"><span className="ico">⭐</span><span>{currentProfile.stars}</span></div>
        <div className="stat coin" title="Đồng xu đổi quà"><span className="ico">🪙</span><span>{currentProfile.coins}</span></div>
        <div className="stat streak" title="Chuỗi ngày liên tục"><span className="ico">🔥</span><span>{currentProfile.streak}</span></div>
        {coinBoostRemaining > 0 && (
          <div className="stat" style={{ background: 'linear-gradient(135deg,#ffd23f,#ff9f43)', color: '#fff', border: 'none', padding: '4px 8px', animation: 'pulseDaily 1.5s infinite' }} title="Bùa Nhân Đôi Xu đang hoạt động">
            <Zap size={13} style={{ marginRight: '2px', display: 'inline', verticalAlign: 'middle' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 900 }}>x2 {Math.floor(coinBoostRemaining/60)}:{String(coinBoostRemaining%60).padStart(2,'0')}</span>
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-icon"
            onClick={() => { beep('sine'); setShowHeaderMenu(v => !v); }}
            title="Menu"
            style={{ fontSize: '1.2rem' }}
          >
            {showHeaderMenu ? '✕' : '☰'}
          </button>
          {showHeaderMenu && (
            <>
              {/* click-away backdrop */}
              <div
                onClick={() => setShowHeaderMenu(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              />
              <div style={{
                position: 'absolute', top: '52px', right: 0, zIndex: 50,
                background: 'var(--paper, #fff)', borderRadius: 16, padding: 6,
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)', border: '1px solid rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column', gap: 2, minWidth: 190,
              }}>
                <button className="hdr-menu-item" onClick={() => { toggleBgm(); }}>
                  <span style={{ fontSize: '1.2rem' }}>{isBgmPlaying ? '🎵' : '🔇'}</span>
                  {isBgmPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
                </button>
                <button className="hdr-menu-item" onClick={() => { toggleDarkMode(); }}>
                  <span style={{ fontSize: '1.2rem' }}>{isDarkMode ? '☀️' : '🌙'}</span>
                  {isDarkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                </button>
                <button className="hdr-menu-item" onClick={() => { beep('sine'); setShowHeaderMenu(false); setShowFriendsModal(true); }}>
                  <span style={{ fontSize: '1.2rem' }}>👯</span>
                  Bạn bè & Xếp hạng
                </button>
                <button className="hdr-menu-item" onClick={() => { beep('sine'); setShowHeaderMenu(false); setActiveScreen('store'); }}>
                  <span style={{ fontSize: '1.2rem' }}>🏪</span>
                  Cửa hàng
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hero Mascot */}
      <div className="hero" style={{ position: 'relative', overflow: 'visible' }}>
        <div
          id="mascot-el"
          onClick={handleMascotClick}
          title="Chạm vào Cú để nghe lời chào!"
          style={{
            display: 'inline-block',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 5,
            animation: heroFlying
              ? 'cu-hero-swoop 4.5s cubic-bezier(0.45, 0, 0.55, 1) 1'
              : 'cu-hero-hop 2.6s ease-in-out infinite',
            filter: heroFlying
              ? 'drop-shadow(0 0 16px rgba(253,224,71,0.5)) drop-shadow(0 10px 8px rgba(0,0,0,.15))'
              : 'drop-shadow(0 10px 8px rgba(0,0,0,.15))',
          }}
        >
          {/* Trail when swooping */}
          {heroFlying && (
            <>
              <div style={{ position: 'absolute', top: '30%', left: -8, fontSize: 16, animation: 'cu-spark-trail 0.7s ease-out infinite', pointerEvents: 'none' }}>✨</div>
              <div style={{ position: 'absolute', top: '55%', left: -12, fontSize: 14, animation: 'cu-spark-trail 0.7s ease-out infinite', animationDelay: '0.2s', pointerEvents: 'none' }}>⭐</div>
              <div style={{ position: 'absolute', top: '75%', left: -8, fontSize: 12, animation: 'cu-spark-trail 0.7s ease-out infinite', animationDelay: '0.4s', pointerEvents: 'none' }}>✨</div>
            </>
          )}
          <CuOwl expression={mascotExpr} size={110} />
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800 }}>Vương Quốc Tiếng Anh</h1>
        <p style={{ fontWeight: 600, opacity: 0.95 }}>
          {(() => {
            const h = new Date().getHours();
            const part = h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
            return `${part}, ${currentProfile.name}! Cùng học nào! 🌟`;
          })()}
        </p>
      </div>

      {/* Daily goal progress — personalized per child */}
      {(() => {
        const goal = currentProfile.dailyGoal || 3;
        const playedToday = currentProfile.dailyGamesDate === today
          ? (currentProfile.dailyGamesPlayed || 0)
          : 0;
        const done = Math.min(playedToday, goal);
        const pct = Math.round((done / goal) * 100);
        const reached = done >= goal;
        return (
          <div style={{
            margin: '0 16px 14px', padding: '12px 16px', borderRadius: 18,
            background: reached
              ? 'linear-gradient(135deg,#22c55e,#16a34a)'
              : 'rgba(255,255,255,0.14)',
            backdropFilter: 'blur(8px)',
            border: '2px solid rgba(255,255,255,0.25)',
            color: '#fff',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 900, fontSize: '0.92rem' }}>
                🎯 Mục tiêu hôm nay
              </span>
              <span style={{ fontWeight: 900, fontSize: '0.92rem' }}>
                {reached ? 'Hoàn thành! 🎉' : `${done}/${goal} lượt`}
              </span>
            </div>
            <div style={{ height: 10, background: 'rgba(0,0,0,0.18)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: reached
                  ? 'rgba(255,255,255,0.9)'
                  : 'linear-gradient(90deg,#fde047,#f59e0b)',
                borderRadius: 6, transition: 'width 0.6s',
              }} />
            </div>
          </div>
        );
      })()}

      {/* Streak Tree — daily learning streak with growing tree visual */}
      <StreakTree profile={currentProfile} />

      {/* 🗺️ Adventure Map Entry */}
      <button 
        onClick={() => { beep('magic'); setActiveScreen('adventure_map'); }}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #16a34a, #0ea5e9, #9d6bff)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 3s ease infinite',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '24px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '18px',
          boxShadow: '0 6px 20px rgba(14,165,233,0.35)',
          transition: 'transform 0.15s',
          textAlign: 'left',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
      >
        <span style={{ fontSize: '2.8rem', lineHeight: 1 }}>🗺️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
            Bản Đồ Phiêu Lưu
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.92 }}>
            🌲 Rừng → 🌊 Biển → ☁️ Trời • {(currentProfile.adventureProgress?.completedNodes?.length || 0)}/30 quest
          </div>
        </div>
        <span style={{ fontSize: '1.5rem', opacity: 0.9 }}>▶</span>
      </button>

      {/* Daily Story Adventure — AI-generated story tailored to CEFR level */}
      <DailyStoryWidget onOpen={() => setShowStoryReader(true)} />

      {/* Daily Lucky Wheel Button */}
      <button 
        className="btn-daily" 
        onClick={() => { beep('sine'); setShowWheelModal(true); }}
        style={{
          background: hasClaimedDaily 
            ? 'linear-gradient(135deg, #b2bec3, #95a5a6)' 
            : 'linear-gradient(135deg, #ff9f43, #9d6bff, #ff5e36)',
          color: '#fff',
          backgroundSize: hasClaimedDaily ? '100%' : '200% 200%',
          animation: hasClaimedDaily ? 'none' : 'gradientShift 2s ease infinite, pulseDaily 2.2s infinite',
          cursor: 'pointer',
          boxShadow: hasClaimedDaily ? 'none' : '0 4px 14px rgba(157, 107, 255, 0.35)'
        }}
      >
        {hasClaimedDaily ? '✅' : '🎡'}
        {hasClaimedDaily ? " Bé đã quay Vòng May Mắn hôm nay rồi!" : " Vòng Quay May Mắn Cú Vui Vẻ! 🎉"}
      </button>
      <style>{`
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(var(--wheel-target)); }
        }
        .wheel-canvas {
          display: block;
          border-radius: 50%;
          border: 6px solid #fff;
          box-shadow: 0 0 28px rgba(157,107,255,0.5);
          transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);
          transform-origin: center center;
        }
        .sector-highlight {
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>

      {/* Profile Info & Companion Pet */}
      <div 
        className="greeting-card" 
        onClick={() => { beep('sine'); setShowPassport(true); }}
        style={{
          cursor: 'pointer',
          transition: 'all 0.15s',
          border: '3px solid rgba(157, 107, 255, 0.15)',
          position: 'relative',
          background: 'linear-gradient(135deg, #fff, rgba(157, 107, 255, 0.03))'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.borderColor = 'var(--c-purple)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = 'rgba(157, 107, 255, 0.15)';
        }}
      >
        <div className="ava-wrapper">
          <span className="ava" style={{ fontSize: '2.8rem', lineHeight: 1 }}>{currentProfile.avatar.split(' ')[currentProfile.avatar.split(' ').length - 1]}</span>
          {equippedPetItem && (
            <span className="pet-float" style={{
              position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '1.25rem',
              background: '#fff', borderRadius: '50%', width: '26px', height: '26px',
              display: 'grid', placeItems: 'center',
              boxShadow: equippedPetStage?.particles
                ? `0 2px 5px rgba(0,0,0,0.15), 0 0 10px ${equippedPetStage.color}cc`
                : '0 2px 5px rgba(0,0,0,0.15)',
              border: equippedPetStage ? `2px solid ${equippedPetStage.color}` : 'none',
            }} title={`Cấp ${equippedPetStage?.id}: ${equippedPetStage?.name}`}>
              <span style={{ transform: `scale(${(equippedPetStage?.scale || 1) * 0.85})`, display: 'inline-block' }}>
                {equippedPetItem.e.split(' ')[0]}
              </span>
              {equippedPetStage && equippedPetStage.id === 4 && (
                <span style={{ position: 'absolute', top: -8, right: -2, fontSize: '0.7rem' }}>👑</span>
              )}
            </span>
          )}
        </div>
        <div className="details" style={{ flex: 1 }}>
          <div className="txt" style={{ textAlign: 'left' }}>
            {getGreeting()}, <b style={{ color: 'var(--c-purple)' }}>{currentProfile.name}</b>!
            <small style={{ color: 'var(--c-purple)', fontWeight: 800, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              ✨ Nhấp chạm để xem Hộ Chiếu của bé!
            </small>
          </div>
          <div className="rank-badge" style={{ marginTop: '5px' }}>
            <Sparkles size={11} style={{ marginRight: '3px' }} />
            {getRank(currentProfile.stars)}
          </div>
        </div>
      </div>

      {/* Trophy Road (Đại Lộ Vinh Quang) */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255, 235, 240, 0.65), rgba(240, 235, 255, 0.65))',
        border: '3px solid #ff758c',
        borderRadius: '24px',
        padding: '18px 16px',
        marginBottom: '18px',
        boxShadow: 'var(--shadow-sm)',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 900,
            color: '#d63031',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            margin: 0
          }}>
            🏆 Đại Lộ Vinh Quang
          </h3>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--ink-soft)' }}>
            Mức Sao: <b>{currentProfile.stars} ⭐</b>
          </span>
        </div>

        {/* The progress map line */}
        <div style={{ position: 'relative', margin: '24px 8px 10px', height: '12px', background: '#e2e8f0', borderRadius: '10px' }}>
          {/* Progress fill */}
          <div style={{
            height: '100%',
            width: `${Math.min((currentProfile.stars / 500) * 100, 100)}%`,
            background: 'linear-gradient(90deg, #ff7eb3, #ff758c, #9d6bff)',
            borderRadius: '10px',
            transition: 'width 0.5s'
          }}></div>

          {/* Milestones markers */}
          {[
            { stars: 50, title: "Thợ Săn Sao", emoji: "🌟" },
            { stars: 150, title: "Phi Hành Gia", emoji: "🚀" },
            { stars: 500, title: "Đại Pháp Sư", emoji: "👑" }
          ].map((milestone, idx) => {
            const isUnlocked = currentProfile.stars >= milestone.stars;
            const pct = milestone.stars === 50 ? 10 : (milestone.stars === 150 ? 40 : 100);
            
            return (
              <div 
                key={milestone.stars}
                onClick={() => {
                  beep('sine');
                  if (isUnlocked) {
                    showToast(`🎉 Tuyệt cú mèo! Bé đã đạt mốc ${milestone.stars} Sao và mở khóa danh hiệu "${milestone.title}"!`, 'good');
                  } else {
                    showToast(`🔒 Cố lên bé ơi! Cần thêm ${milestone.stars - currentProfile.stars} Sao nữa để mở khóa danh hiệu "${milestone.title}"!`, 'bad');
                  }
                }}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: 2,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                {/* Checkpoint bubble */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isUnlocked ? '#fff' : '#f1f5f9',
                  border: isUnlocked ? '3px solid #ff758c' : '3px solid #cbd5e1',
                  boxShadow: isUnlocked ? '0 0 10px rgba(255, 117, 140, 0.4)' : 'none',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.1rem',
                  transition: 'all 0.2s',
                  transform: isUnlocked ? 'scale(1.15)' : 'scale(1)'
                }}>
                  {milestone.emoji}
                </div>
                
                {/* Checkpoint Text */}
                <div style={{
                  marginTop: '6px',
                  fontSize: '0.68rem',
                  fontWeight: 900,
                  color: isUnlocked ? 'var(--c-purple)' : 'var(--ink-soft)',
                  whiteSpace: 'nowrap',
                  background: 'rgba(255,255,255,0.85)',
                  padding: '2px 5px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0,0,0,0.04)'
                }}>
                  {milestone.stars}⭐
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Helper guide */}
        <div style={{ fontSize: '0.74rem', color: 'var(--ink-soft)', fontWeight: 700, marginTop: '26px', textAlign: 'center' }}>
          💡 Nhấp vào các mốc danh hiệu để kiểm tra tình trạng mở khóa của bé nhé!
        </div>
      </div>

      <FeatureCards />

      <QuestWidget />

      <WeeklyChallengeWidget />


      {/* MODE TABS: FREE PLAY OR SGK PROGRAM */}
      <div className="store-tabs" style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.06)', padding: '5px', borderRadius: '16px', marginBottom: '18px' }}>
        <button 
          className={`store-tab ${studyMode === 'free' ? 'active' : ''}`}
          onClick={() => setStudyMode('free')}
          style={{ fontSize: '0.9rem', padding: '10px 4px' }}
        >
          🌈 Chơi Tự Do
        </button>
        <button 
          className={`store-tab ${studyMode === 'school' ? 'active' : ''}`}
          onClick={() => setStudyMode('school')}
          style={{ fontSize: '0.9rem', padding: '10px 4px' }}
        >
          🏫 Học Theo Lớp (SGK)
        </button>
      </div>

      {/* RENDER MODE CONTENT */}
      {studyMode === 'school' ? (
        /* ==================== SCHOOL CURRICULUM MODE ==================== */
        <div className="topic-container" style={{ marginTop: 0, padding: '16px', background: '#fff', border: '3px solid var(--c-purple)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--c-purple)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={16} /> Giáo trình {getGradeLabel(selectedGrade)}
            </h3>
            <button 
              onClick={() => setActiveScreen('parent')}
              style={{ fontSize: '0.78rem', background: 'rgba(0,0,0,0.04)', color: 'var(--ink-soft)', padding: '3px 8px', borderRadius: '8px', fontWeight: 700 }}
            >
              Đổi lớp ⚙️
            </button>
          </div>

          {/* Unit selection dots scrollbar */}
          <p style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ink-soft)', marginBottom: '8px' }}>Bé hãy chọn Unit (Bài học) để ôn tập:</p>
          <div className="chips-scroll" style={{ paddingBottom: '10px', gap: '10px' }}>
            {gradeUnits.map(u => {
              const isCurrent = selectedUnit === u.unit;
              const isDone = completedUnits.includes(`${selectedGrade}_u${u.unit}`);
              return (
                <button
                  key={u.unit}
                  onClick={() => setSelectedUnit(u.unit)}
                  className={`chip ${isCurrent ? 'on' : ''}`}
                  style={{
                    minWidth: '50px', height: '50px', borderRadius: '50%', padding: 0, display: 'grid',
                    placeItems: 'center', fontSize: '1.05rem', fontWeight: 800, position: 'relative',
                    background: isCurrent ? 'var(--c-purple)' : '#fdfaf2',
                    boxShadow: isCurrent ? '0 3px 0 #7a4fd6' : '0 3px 0 rgba(0,0,0,0.05)',
                    border: isDone ? '2px solid var(--c-grass)' : '2px dashed #9d6bff'
                  }}
                >
                  {isDone && (
                    <span style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '0.75rem', background: '#fff', borderRadius: '50%', width: '16px', height: '16px', display: 'grid', placeItems: 'center' }}>
                      🏆
                    </span>
                  )}
                  {u.unit}
                </button>
              );
            })}
          </div>

          {/* Active Unit details banner */}
          <div style={{ background: 'rgba(157, 107, 255, 0.06)', border: '2px solid rgba(157, 107, 255, 0.15)', padding: '12px 14px', borderRadius: '18px', margin: '8px 0 16px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)' }}>
              {currentUnitObj.e} Unit {selectedUnit}: {currentUnitObj.name}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-soft)', marginTop: '2px' }}>
              💡 Mẫu câu giao tiếp: <b style={{ color: 'var(--c-purple)' }}>{currentUnitObj.sentence || "Bé hãy ghép các chữ cái nhé."}</b>
            </div>
          </div>

          {/* SGK Games grids */}
          <div className="game-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#ff9f43,#ff6b6b)', minHeight: '120px' }} onClick={() => handleSelectGameCheck('picture')}>
              <span className="gc-emoji">🖼️</span>
              <div>
                <div className="gc-title" style={{ fontSize: '1.05rem' }}>Đoán Từ Unit</div>
                <div className="gc-sub" style={{ fontSize: '0.72rem' }}>Học từ mới bài {selectedUnit}</div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#5ec8f8,#3a7bd5)', minHeight: '120px' }} onClick={() => handleSelectGameCheck('memory')}>
              <span className="gc-emoji">🃏</span>
              <div>
                <div className="gc-title" style={{ fontSize: '1.05rem' }}>Lật Thẻ Trí Nhớ</div>
                <div className="gc-sub" style={{ fontSize: '0.72rem' }}>Ghép bài học {selectedUnit}</div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#26d0a6,#1f9c8a)', minHeight: '120px' }} onClick={() => handleSelectGameCheck('arcade')}>
              <span className="gc-emoji">🎈</span>
              <div>
                <div className="gc-title" style={{ fontSize: '1.05rem' }}>Bắn Bóng Từ</div>
                <div className="gc-sub" style={{ fontSize: '0.72rem' }}>Bắt chữ bài {selectedUnit}</div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#ff7675,#d63031)', minHeight: '120px' }} onClick={() => handleSelectGameCheck('writing')}>
              <span className="gc-emoji">✏️</span>
              <div>
                <div className="gc-title" style={{ fontSize: '1.05rem' }}>Tập Viết Từ</div>
                <div className="gc-sub" style={{ fontSize: '0.72rem' }}>Gõ chính tả bài {selectedUnit}</div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#ffa500,#ff5e36)', minHeight: '120px' }} onClick={() => handleSelectGameCheck('arcade_vs')}>
              <span className="gc-emoji">⚡</span>
              <div>
                <div className="gc-title" style={{ fontSize: '1.05rem' }}>Cú Đối Đầu</div>
                <div className="gc-sub" style={{ fontSize: '0.72rem' }}>Đấu trí bài {selectedUnit}</div>
              </div>
            </button>
            
            {/* Game 5: Dynamic sentence maker for Grammar */}
            {currentUnitObj.sentence && (
              <button 
                className="game-card" 
                style={{ background: 'linear-gradient(150deg,#9d6bff,#6a3fd6)', minHeight: '120px', gridColumn: 'span 2' }} 
                onClick={() => handleSelectGameCheck('sentence')}
              >
                <span className="gc-emoji">🚂</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div>
                    <div className="gc-title" style={{ fontSize: '1.15rem' }}>Ghép Câu Giao Tiếp 🚂</div>
                    <div className="gc-sub" style={{ fontSize: '0.78rem' }}>Luyện viết ngữ pháp bài {selectedUnit}</div>
                  </div>
                  <span style={{ fontSize: '1.8rem' }}>▶</span>
                </div>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ==================== STANDARD FREE PLAY MODE ==================== */
        <div>
          <div className="game-grid">
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#ff9f43,#ff6b6b)' }} onClick={() => handleSelectGameCheck('picture')}>
              <span className="gc-emoji">🖼️</span>
              <div>
                <div className="gc-title">Đoán Từ</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    ⭐ Cấp {picLevel}
                  </span>
                </div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#5ec8f8,#3a7bd5)' }} onClick={() => handleSelectGameCheck('arcade')}>
              <span className="gc-emoji">🎈</span>
              <div>
                <div className="gc-title">Bắt Bóng</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    ⭐ Cấp {arcLevel}
                  </span>
                </div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#26d0a6,#1f9c8a)' }} onClick={() => handleSelectGameCheck('memory')}>
              <span className="gc-emoji">🃏</span>
              <div>
                <div className="gc-title">Lật Thẻ</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    ⭐ Cấp {memLevel}
                  </span>
                </div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#9d6bff,#6a3fd6)' }} onClick={() => handleSelectGameCheck('quiz')}>
              <span className="gc-emoji">🎯</span>
              <div>
                <div className="gc-title">Thử Tài</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    ⭐ Cấp {quizLevel}
                  </span>
                </div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#ff7675,#d63031)' }} onClick={() => handleSelectGameCheck('writing')}>
              <span className="gc-emoji">✏️</span>
              <div>
                <div className="gc-title">Tập Viết</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    ⭐ Cấp {wriLevel || 1}
                  </span>
                </div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#ffa500,#ff5e36)' }} onClick={() => handleSelectGameCheck('arcade_vs')}>
              <span className="gc-emoji">⚡</span>
              <div>
                <div className="gc-title">Cú Đối Đầu</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    🏆 Đấu Trí AI
                  </span>
                </div>
              </div>
            </button>
            <button className="game-card" style={{ background: 'linear-gradient(150deg,#11998e,#38ef7d)' }} onClick={() => handleSelectGameCheck('grammar')}>
              <span className="gc-emoji">📝</span>
              <div>
                <div className="gc-title">Ngữ Pháp</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    Luyện grammar vui
                  </span>
                </div>
              </div>
            </button>

            <button className="game-card" style={{ background: 'linear-gradient(150deg,#a0e9ff,#7b68ee)' }} onClick={() => handleSelectGameCheck('listening')}>
              <span className="gc-emoji">🎧</span>
              <div>
                <div className="gc-title">Luyện Nghe</div>
                <div className="gc-sub" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '800' }}>
                  <span style={{ background: 'rgba(255,255,255,0.22)', padding: '1px 6px', borderRadius: '8px', fontSize: '0.72rem' }}>
                    Nghe English đoán nghĩa
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div className="topic-container">
            <h3>
              <span>📚 Chủ Đề Từ Vựng</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
                {16 + (customVocab.length > 0 ? 1 : 0)} chủ đề
              </span>
            </h3>
            <div className="chips-scroll">
              {TOPICS.map(topic => {
                if (topic.id === 'custom' && customVocab.length === 0) return null;
                return (
                  <button 
                    key={topic.id}
                    className={`chip ${selectedTopic === topic.id ? 'on' : ''}`}
                    onClick={() => setSelectedTopic(topic.id)}
                  >
                    {topic.e} {topic.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Storybook Entrance banner */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button 
          onClick={() => {
            beep('sine');
            setActiveScreen('stories');
          }}
          style={{
            background: 'linear-gradient(135deg, var(--c-purple), var(--c-pink))',
            color: '#fff', padding: '12px 24px',
            borderRadius: '20px', fontWeight: 900, fontSize: '1.05rem', display: 'inline-flex',
            alignItems: 'center', gap: '8px', border: 'none',
            boxShadow: '0 5px 0 #7a4fd6, 0 4px 10px rgba(157, 107, 255, 0.3)',
            cursor: 'pointer', transition: 'all 0.15s',
            animation: 'pulseDaily 2s infinite'
          }}
        >
          📖 Góc Đọc Truyện Song Ngữ Tương Tác ✨
        </button>
      </div>

      {/* Parent Hub Secure entrance */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button 
          onClick={() => setActiveScreen('parent')}
          style={{
            background: 'rgba(0,0,0,0.06)', color: 'var(--ink-soft)', padding: '10px 18px',
            borderRadius: '16px', fontWeight: 800, fontSize: '0.85rem', display: 'inline-flex',
            alignItems: 'center', gap: '6px'
          }}
        >
          <Shield size={14} />
          Góc Phụ Huynh 🦉 (Cài đặt & Từ vựng)
        </button>
      </div>

      {/* ====== LUCKY WHEEL MODAL ====== */}
      {showWheelModal && (
        <div
          className="overlay show"
          style={{ zIndex: 185, background: 'rgba(10, 8, 30, 0.95)', backdropFilter: 'blur(12px)' }}
          onClick={(e) => {
            if (!isSpinning && e.target.className && e.target.className.includes && e.target.className.includes('overlay')) {
              setShowWheelModal(false);
              setWheelResult(null);
            }
          }}
        >
          <div className="modal" style={{
            maxWidth: '420px', padding: '24px 16px 28px',
            background: 'linear-gradient(145deg, #1e1b4b, #312e81)',
            border: '3px solid #ff758c',
            boxShadow: '0 0 40px rgba(255, 117, 140, 0.4)',
            borderRadius: '32px', color: '#fff', position: 'relative'
          }}>
            {/* Close btn */}
            {!isSpinning && (
              <button
                onClick={() => { setShowWheelModal(false); setWheelResult(null); }}
                style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 900 }}
              >✕</button>
            )}

            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ff7eb3', margin: '0 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              🎡 Vòng Quay May Mắn
            </h2>
            <p style={{ fontSize: '0.78rem', opacity: 0.75, margin: '0 0 20px' }}>
              {hasClaimedDaily ? 'Hẹn gặp lại ngày mai bé nhé! 🌙' : 'Quay và nhận phần thưởng ngẫu nhiên hôm nay!'}
            </p>

            {/* Wheel Visual */}
            <div style={{ position: 'relative', width: '300px', height: '300px', maxWidth: '90vw', maxHeight: '90vw', margin: '0 auto 20px', flexShrink: 0 }}>
              {/* SVG wheel */}
              <svg
                className="wheel-canvas"
                width="100%" height="100%"
                viewBox="0 0 300 300"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                }}
              >
                {WHEEL_SECTORS.map((sector, i) => {
                  const total = WHEEL_SECTORS.length;
                  const angle = 360 / total;
                  const startAngle = (i * angle - 90) * (Math.PI / 180);
                  const endAngle = ((i + 1) * angle - 90) * (Math.PI / 180);
                  const cx = 150, cy = 150, r = 140;
                  const x1 = cx + r * Math.cos(startAngle);
                  const y1 = cy + r * Math.sin(startAngle);
                  const x2 = cx + r * Math.cos(endAngle);
                  const y2 = cy + r * Math.sin(endAngle);
                  const largeArc = angle > 180 ? 1 : 0;
                  const midAngle = (startAngle + endAngle) / 2;
                  // Icon position (further from center)
                  const iconR = r * 0.72;
                  const ix = cx + iconR * Math.cos(midAngle);
                  const iy = cy + iconR * Math.sin(midAngle);
                  // Number position (closer to center)
                  const numR = r * 0.45;
                  const nx = cx + numR * Math.cos(midAngle);
                  const ny = cy + numR * Math.sin(midAngle);
                  const rotation = i * angle + angle/2;
                  return (
                    <g key={i}>
                      <path
                        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
                        fill={sector.color}
                        stroke="#fff"
                        strokeWidth="2.5"
                        opacity={landedSector !== null && landedSector !== i ? 0.45 : 1}
                      />
                      {/* Icon (emoji) */}
                      <text
                        x={ix} y={iy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="22"
                        transform={`rotate(${rotation}, ${ix}, ${iy})`}
                      >
                        {sector.icon}
                      </text>
                      {/* Number/short label */}
                      <text
                        x={nx} y={ny}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#fff"
                        fontSize="20"
                        fontWeight="900"
                        stroke="rgba(0,0,0,0.35)"
                        strokeWidth="0.5"
                        transform={`rotate(${rotation}, ${nx}, ${ny})`}
                      >
                        {sector.short}
                      </text>
                    </g>
                  );
                })}
                {/* Center circle */}
                <circle cx="150" cy="150" r="26" fill="#1e1b4b" stroke="#fff" strokeWidth="4" />
                <text x="150" y="156" textAnchor="middle" dominantBaseline="middle" fontSize="20" fill="#ffd23f">🎡</text>
              </svg>
              {/* Pointer arrow */}
              <div style={{
                position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '26px solid #ff758c',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
                zIndex: 5,
              }} />
            </div>

            {/* Result display */}
            {wheelResult && !isSpinning && (
              <div className="sector-highlight" style={{
                background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)',
                borderRadius: '18px', padding: '12px 16px', marginBottom: '14px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.6rem', marginBottom: '4px' }}>🎉</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffd23f' }}>{wheelResult.label}</div>
                {wheelResult.boost && (
                  <div style={{ fontSize: '0.8rem', color: '#ff7eb3', fontWeight: 800, marginTop: '4px' }}>
                    🎟️ Bùa Nhân Đôi Xu 5 phút đã kích hoạt!
                  </div>
                )}
              </div>
            )}

            {/* Spin button */}
            <button
              onClick={handleSpinWheel}
              disabled={isSpinning || hasClaimedDaily}
              className="btn-big"
              style={{
                background: hasClaimedDaily
                  ? 'rgba(255,255,255,0.1)'
                  : 'linear-gradient(135deg, #ff9f43, #9d6bff)',
                color: hasClaimedDaily ? 'rgba(255,255,255,0.4)' : '#fff',
                cursor: (isSpinning || hasClaimedDaily) ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem',
                fontWeight: 900,
                boxShadow: hasClaimedDaily ? 'none' : '0 5px 0 #7a3fd6'
              }}
            >
              {isSpinning ? '🌀 Đang quay...' : hasClaimedDaily ? '✅ Đã quay hôm nay rồi!' : '🎡 QUAY NGAY!'}
            </button>
          </div>
        </div>
      )}

      {/* 🦉 PREMIUM PASSPORT & ACHIEVEMENT MODAL */}
      {showPassport && (
        <div 
          className="overlay show" 
          style={{ zIndex: 180, background: 'rgba(20, 16, 42, 0.95)', backdropFilter: 'blur(12px)' }}
          onClick={(e) => {
            if (e.target.className && e.target.className.includes('overlay')) {
              beep('sine');
              setShowPassport(false);
              setShowPinSetup(false);
            }
          }}
        >
          <div 
            className="modal animate-popIn" 
            style={{ 
              maxWidth: '500px', 
              padding: '24px 20px', 
              background: 'linear-gradient(145deg, #1e1b4b, #312e81)', 
              color: '#fff', 
              border: '3px solid #ff758c',
              boxShadow: '0 0 30px rgba(255, 117, 140, 0.4)',
              textAlign: 'center',
              position: 'relative',
              borderRadius: '32px'
            }}
          >
            {/* Close Button */}
            <button 
              onClick={() => { beep('sine'); setShowPassport(false); setShowPinSetup(false); }}
              style={{
                position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)',
                border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%',
                cursor: 'pointer', fontSize: '1.2rem', fontWeight: 900
              }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ff7eb3', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '0 0 6px' }}>
              🎖️ Hộ Chiếu Học Tập Cao Cấp
            </h2>
            <p style={{ fontSize: '0.78rem', opacity: 0.8, margin: '0 0 20px' }}>
              Chứng nhận vinh quang của nhà thám hiểm Tiếng Anh tài ba!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Profile Card Identity block */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '16px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                textAlign: 'left'
              }}>
                {/* Photo frame */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                    <span style={{ fontSize: '4rem', lineHeight: '70px', display: 'block', textAlign: 'center' }}>
                      {currentProfile.avatar.split(' ')[currentProfile.avatar.split(' ').length - 1]}
                    </span>
                    {equippedPetItem && (
                      <span style={{
                        position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '1.3rem',
                        background: '#fff', borderRadius: '50%', width: '26px', height: '26px',
                        display: 'grid', placeItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(0,0,0,0.1)'
                      }} title={`Pet: ${equippedPetItem.name}`}>
                        {equippedPetItem.e.split(' ')[0]}
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => { beep('pop'); setShowAvatarPicker(true); }}
                    style={{
                      background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none',
                      fontSize: '0.68rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Đổi Ảnh 🎨
                  </button>
                </div>

                {/* Text Identity */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0 0 4px', color: '#ffb8b8' }}>
                    {currentProfile.name}
                  </h3>
                  
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.1)', padding: '3px 8px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800, marginBottom: '6px' }}>
                    <Trophy size={11} color="#ffd23f" /> {getRank(currentProfile.stars)}
                  </div>
                  
                  {/* Motto Selector */}
                  <div style={{ marginTop: '4px' }}>
                    <span style={{ fontSize: '0.62rem', color: '#ccc', fontWeight: 800, textTransform: 'uppercase' }}>Châm ngôn học tập:</span>
                    <select
                      value={currentProfile.motto || "Con hứa sẽ học tiếng Anh thật chăm chỉ mỗi ngày! 🌟"}
                      onChange={(e) => {
                        beep('sine');
                        updateProfileFields(currentProfile.id, { motto: e.target.value });
                        showToast("Đã cập nhật châm ngôn học tập mới! 🌟", "good");
                      }}
                      style={{
                        width: '100%',
                        padding: '4px 6px',
                        background: 'rgba(0,0,0,0.3)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '8px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        marginTop: '3px'
                      }}
                    >
                      {[
                        "Con hứa sẽ học tiếng Anh thật chăm chỉ mỗi ngày! 🌟",
                        "Tiếng Anh là chuyện nhỏ! Bứt phá điểm số! 🚀",
                        "Chăm ngoan học giỏi, cho Pet ăn no tròn! 🍉",
                        "Chinh phục thế giới từ vựng cùng Cú con! 🦉",
                        "Càng học càng thông minh, tích lũy triệu Sao! 👑"
                      ].map(opt => (
                        <option key={opt} value={opt} style={{ background: '#1e1b4b', color: '#fff' }}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Achievements stats showcase grid */}
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 900, color: '#ffb8b8', margin: '0 0 6px', textTransform: 'uppercase' }}>
                  📊 Bảng Chiến Tích Của Bé
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  
                  {/* Stat 1: Streak */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 700 }}>🔥 Chuỗi chăm chỉ:</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--c-coral)', marginTop: '2px' }}>
                      {currentProfile.streak} ngày liên tiếp
                    </div>
                  </div>

                  {/* Stat 2: Grade completed units */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 700 }}>🏫 Giáo trình lớp:</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#5ec8f8', marginTop: '2px' }}>
                      {selectedGrade === 'grade1' ? 'Lớp 1' : (selectedGrade === 'grade2' ? 'Lớp 2' : (selectedGrade === 'grade3' ? 'Lớp 3' : (selectedGrade === 'grade4' ? 'Lớp 4' : 'Lớp 5')))}
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff', marginLeft: '4px', background: 'rgba(0,0,0,0.2)', padding: '2px 4px', borderRadius: '4px' }}>
                        {completedUnits.length} Unit 🏆
                      </span>
                    </div>
                  </div>

                  {/* Stat 3: Speaking performance */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 700 }}>🎙️ Luyện nói chuẩn:</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#ffd23f', marginTop: '2px' }}>
                      ⭐⭐⭐ Tuyệt vời!
                    </div>
                  </div>

                  {/* Stat 4: Companion Pet level */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 700 }}>💖 Quan hệ với Pet:</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#ff758c', marginTop: '2px' }}>
                      {equippedPetItem && equippedPetStage
                        ? `${equippedPetStage.emoji} Cấp ${equippedPetStage.id}: ${equippedPetStage.name} (${equippedPetFriendship}/100)`
                        : 'Chưa có Pet 🐾'
                      }
                    </div>
                  </div>

                </div>
              </div>

              {/* Personal Security PIN lock configuration section */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1.5px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '18px',
                padding: '12px',
                textAlign: 'left'
              }}>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 900, color: '#ffb8b8', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 4px' }}>
                  <Shield size={13} /> Bảo Mật Tài Khoản Của Bé:
                </h4>

                {currentProfile.pinCode ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--c-mint)' }}>
                        🔒 Đang Bật Mã Khóa PIN Bảo Vệ (4 Số)
                      </span>
                      <button
                        onClick={() => {
                          beep('sine');
                          setProfilePin(currentProfile.id, null);
                        }}
                        style={{
                          background: 'rgba(255, 71, 87, 0.15)', border: 'none', color: '#ff4757',
                          padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer'
                        }}
                      >
                        Tắt Khóa 🔓
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 600, opacity: 0.85, flex: 1 }}>
                        🔓 Tài khoản chưa đặt mã PIN. Đặt mật khẩu để tránh các bé khác vào nhầm tài khoản của con nhé!
                      </span>
                      
                      {!showPinSetup ? (
                        <button
                          onClick={() => { beep('sine'); setShowPinSetup(true); }}
                          style={{
                            background: 'var(--c-purple)', border: 'none', color: '#fff',
                            padding: '5px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer'
                          }}
                        >
                          Cài Mã PIN 🔒
                        </button>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newPinCode.length !== 4) {
                              showToast("Mã PIN phải chứa đúng 4 chữ số!", "bad");
                              return;
                            }
                            setProfilePin(currentProfile.id, newPinCode);
                            setNewPinCode('');
                            setShowPinSetup(false);
                          }}
                          style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%', marginTop: '6px' }}
                        >
                          <input
                            type="text"
                            pattern="[0-9]*"
                            inputMode="numeric"
                            maxLength={4}
                            value={newPinCode}
                            onChange={(e) => setNewPinCode(e.target.value.replace(/\D/g, ''))}
                            className="input-fancy"
                            placeholder="Nhập 4 số PIN..."
                            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', height: '32px', fontSize: '0.78rem', padding: '6px', flex: 1, letterSpacing: '4px', textAlign: 'center' }}
                            autoFocus
                          />
                          <button type="submit" className="btn-big" style={{ height: '32px', fontSize: '0.7rem', width: 'auto', padding: '0 10px', marginTop: 0, background: 'var(--c-mint)', color: '#fff' }}>
                            Lưu
                          </button>
                          <button type="button" onClick={() => setShowPinSetup(false)} style={{ background: 'none', border: 'none', color: '#ccc', fontSize: '0.7rem', cursor: 'pointer' }}>
                            Hủy
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Friends & Leaderboard Modal */}
      {showFriendsModal && <FriendsModal onClose={() => setShowFriendsModal(false)} />}

      {/* Daily Story Reader */}
      {showStoryReader && <DailyStoryReader onClose={() => setShowStoryReader(false)} />}

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div onClick={() => setShowAvatarPicker(false)} style={{
          position: 'fixed', inset: 0, zIndex: 195,
          background: 'rgba(10,8,30,0.7)', backdropFilter: 'blur(6px)',
          display: 'grid', placeItems: 'center', padding: 16,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            maxWidth: 420, width: '100%',
            background: 'linear-gradient(160deg,#fff 0%,#fef3ff 100%)',
            borderRadius: 24, padding: '20px 18px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
            maxHeight: '85vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#4c1d95', margin: 0 }}>
                🎨 Chọn nhân vật cho bé
              </h2>
              <button onClick={() => setShowAvatarPicker(false)} style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: 'rgba(0,0,0,0.06)', cursor: 'pointer', fontSize: '1rem', fontWeight: 900,
              }}>✕</button>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: 14 }}>
              {AVATAR_CHOICES.length} lựa chọn — chạm vào để chọn
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
              gap: 8,
            }}>
              {AVATAR_CHOICES.map(av => {
                const isCurrent = currentProfile.avatar?.split(' ').pop() === av;
                return (
                  <button
                    key={av}
                    onClick={() => {
                      beep('pop');
                      updateProfileFields(currentProfile.id, { avatar: av });
                      showToast(`Đã đổi nhân vật! ${av}`, 'good');
                      setShowAvatarPicker(false);
                    }}
                    style={{
                      width: 56, height: 56, borderRadius: '50%',
                      background: isCurrent ? 'linear-gradient(135deg,#9d6bff,#ff7eb3)' : '#fffdf7',
                      border: isCurrent ? '3px solid #fff' : '2px solid rgba(0,0,0,0.05)',
                      cursor: 'pointer', fontSize: '2rem',
                      display: 'grid', placeItems: 'center',
                      transition: 'all 0.15s',
                      transform: isCurrent ? 'scale(1.12)' : 'none',
                      boxShadow: isCurrent ? '0 4px 12px rgba(157,107,255,0.4)' : 'none',
                    }}
                  >
                    {av}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Cú AI button ──────────────────────────────── */}
      <div
        style={{
          position: 'fixed', bottom: 80, right: 14, zIndex: 120,
          animation: cuFlying ? 'cu-fly-tour 5s cubic-bezier(0.45, 0, 0.55, 1) 1' : 'cu-float-idle 3.5s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      >
        {/* Sparkle trail (only when flying) */}
        {cuFlying && (
          <>
            <div style={{ position: 'absolute', top: 8, left: -6, fontSize: 14, opacity: 0.8, animation: 'cu-spark-trail 0.8s ease-out infinite', animationDelay: '0s', pointerEvents: 'none' }}>✨</div>
            <div style={{ position: 'absolute', top: 28, left: -10, fontSize: 12, opacity: 0.8, animation: 'cu-spark-trail 0.8s ease-out infinite', animationDelay: '0.2s', pointerEvents: 'none' }}>⭐</div>
            <div style={{ position: 'absolute', top: 48, left: -6, fontSize: 10, opacity: 0.8, animation: 'cu-spark-trail 0.8s ease-out infinite', animationDelay: '0.4s', pointerEvents: 'none' }}>✨</div>
          </>
        )}
        <button
          onClick={() => { setCuFlying(false); onOpenChat?.(); }}
          title="Nói chuyện với Cú AI"
          style={{
            width: 64, height: 64, borderRadius: '50%', border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
            boxShadow: cuFlying ? '0 6px 24px rgba(253,224,71,0.6), 0 0 0 3px rgba(255,255,255,0.35)' : '0 4px 18px rgba(124,58,237,0.55), 0 0 0 3px rgba(255,255,255,0.25)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, overflow: 'hidden',
            pointerEvents: 'auto',
            transition: 'box-shadow 0.3s',
          }}
        >
          <CuOwl expression={cuFlying ? 'flying' : 'idle'} size={52} />
        </button>
      </div>
    </div>
  );
}
