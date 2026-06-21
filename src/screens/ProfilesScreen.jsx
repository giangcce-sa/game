import React, { useState } from 'react';
import { useGame, MERCHANDISE } from '../context/GameContext';
import { Lock, Shield, ArrowLeft, RefreshCw, Delete } from 'lucide-react';

export default function ProfilesScreen() {
  const { profiles, currentProfile, selectProfile, createProfile, setActiveScreen, beep, showToast } = useGame();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('mid');
  const [avatar, setAvatar] = useState('🦊');
  const [pinCode, setPinCode] = useState(''); // Optional PIN code for creation

  // PIN lock entry states
  const [lockedProfile, setLockedProfile] = useState(null); // The profile currently clicked and locked
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  
  // Parental override/recovery puzzle
  const [showParentRecovery, setShowParentRecovery] = useState(false);
  const [numA, setNumA] = useState(0);
  const [numB, setNumB] = useState(0);
  const [parentAnswer, setParentAnswer] = useState('');

  const avatars = [
    // Animals (kid favorites)
    '🦊', '🐼', '🦁', '🦄', '🐱', '🐰', '🐯', '🐶',
    '🦖', '🐲', '🐸', '🐵', '🐧', '🦉', '🐨', '🐻',
    // Characters / fantasy
    '👧', '👦', '🧑‍🎤', '🦸', '🧚', '🧙', '🧜', '🤖',
    // Cool stuff
    '🚀', '⭐', '🌈', '🦋',
  ];

  const getRank = (stars) => {
    if (stars >= 500) return "👑 Đại pháp sư";
    if (stars >= 250) return "🦄 Hiệp sĩ rồng";
    if (stars >= 120) return "🚀 Phi hành gia";
    if (stars >= 50)  return "🌟 Thợ săn sao";
    return "🦉 Tân binh";
  };

  const handleCreate = () => {
    if (!name.trim()) {
      showToast("Bé hãy nhập tên của mình nhé! 🥰", "bad");
      return;
    }
    if (pinCode && pinCode.length !== 4) {
      showToast("Mã khóa bảo mật PIN phải chứa đúng 4 chữ số!", "bad");
      return;
    }
    createProfile(name.trim(), avatar, age, pinCode || null);
    setName('');
    setPinCode('');
    setIsCreating(false);
  };

  const handleSelectProfile = (p) => {
    beep('sine');
    if (p.pinCode) {
      setLockedProfile(p);
      setEnteredPin('');
      setPinError(false);
      setShowParentRecovery(false);
    } else {
      selectProfile(p.id);
    }
  };

  const handleKeypadPress = (num) => {
    if (enteredPin.length >= 4) return;
    beep('click');
    const nextPin = enteredPin + num;
    setEnteredPin(nextPin);

    if (nextPin.length === 4) {
      if (nextPin === lockedProfile.pinCode) {
        beep('good');
        showToast(`Đăng nhập thành công! Chào bé ${lockedProfile.name} 👋`, 'good');
        selectProfile(lockedProfile.id);
        setLockedProfile(null);
        setEnteredPin('');
      } else {
        beep('bad');
        setPinError(true);
        setTimeout(() => {
          setPinError(false);
          setEnteredPin('');
        }, 500);
      }
    }
  };

  const handleKeypadDelete = () => {
    beep('sine');
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    beep('sine');
    setEnteredPin('');
  };

  // Trigger parental PIN reset override question
  const handleOpenParentRecovery = () => {
    beep('sine');
    setNumA(Math.floor(6 + Math.random() * 4)); // 6-9
    setNumB(Math.floor(6 + Math.random() * 4)); // 6-9
    setParentAnswer('');
    setShowParentRecovery(true);
  };

  const handleParentVerify = (e) => {
    e.preventDefault();
    if (parseInt(parentAnswer) === numA * numB) {
      beep('win');
      showToast(`Mở khóa khẩn cấp thành công! Vui lòng đặt lại mã PIN cho bé trong phần Hộ Chiếu.`, 'good');
      selectProfile(lockedProfile.id);
      setLockedProfile(null);
      setEnteredPin('');
      setShowParentRecovery(false);
    } else {
      beep('bad');
      showToast("Kết quả chưa chính xác rồi phụ huynh ơi!", 'bad');
      setParentAnswer('');
      setNumA(Math.floor(6 + Math.random() * 4));
      setNumB(Math.floor(6 + Math.random() * 4));
    }
  };

  if (lockedProfile) {
    /* ==================== BUBBLE NUMERIC PIN KEYPAD ==================== */
    return (
      <div 
        className="profile-box" 
        style={{ 
          maxWidth: '440px', 
          margin: '40px auto 0', 
          padding: '24px 20px',
          background: 'rgba(26, 20, 54, 0.96)',
          backdropFilter: 'blur(10px)',
          border: '3px solid var(--c-purple)',
          color: '#fff',
          position: 'relative'
        }}
      >
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
          .shake-anim {
            animation: shake 0.4s ease;
          }
          .key-bubble {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 2px solid rgba(255,255,255,0.15);
            font-size: 1.5rem;
            font-weight: 800;
            cursor: pointer;
            display: grid;
            place-items: center;
            transition: all 0.1s;
            box-shadow: 0 4px 0 rgba(0,0,0,0.2);
          }
          .key-bubble:active {
            transform: scale(0.92) translateY(4px);
            box-shadow: none;
            background: var(--c-purple);
          }
        `}</style>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '6px', color: 'var(--c-pink)' }}>
          🔐 Mật Mã Bảo Vệ
        </h2>
        <p style={{ fontSize: '0.8rem', opacity: 0.85, margin: '0 0 16px' }}>
          Tài khoản của **{lockedProfile.name}** đã được bảo vệ. Bé hãy nhập mã PIN nhé!
        </p>

        {/* Visual locked kid avatar */}
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '4.2rem', lineHeight: 1, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>
            {lockedProfile.avatar}
          </span>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', marginTop: '6px', color: '#ffb8b8' }}>
            {lockedProfile.name}
          </span>
        </div>

        {/* PIN Entry Indicators */}
        <div 
          className={pinError ? 'shake-anim' : ''} 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '16px', 
            margin: '10px 0 28px' 
          }}
        >
          {[0, 1, 2, 3].map(idx => {
            const isFilled = enteredPin.length > idx;
            return (
              <div 
                key={idx}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: isFilled 
                    ? (pinError ? 'var(--c-coral)' : 'var(--c-mint)') 
                    : 'rgba(255, 255, 255, 0.2)',
                  border: isFilled ? 'none' : '2px solid rgba(255,255,255,0.4)',
                  transition: 'all 0.15s',
                  transform: isFilled ? 'scale(1.2)' : 'scale(1)'
                }}
              />
            );
          })}
        </div>

        {/* Parental recovery option link */}
        {showParentRecovery ? (
          /* --- PARENT MATHEMATICS puzzles screen bypass --- */
          <form onSubmit={handleParentVerify} style={{ background: 'rgba(255,255,255,0.06)', padding: '16px', borderRadius: '18px', margin: '14px 0', textAlign: 'left' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--c-pink)', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 6px' }}>
              <Shield size={14} /> Mở khóa khẩn cấp dành cho Bố Mẹ:
            </h4>
            <p style={{ fontSize: '0.74rem', opacity: 0.8, margin: '0 0 10px' }}>
              Giải phép tính để vượt qua và tự động xóa mật mã cũ của bé:
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--c-pink)', whiteSpace: 'nowrap' }}>
                {numA} x {numB} =
              </span>
              <input
                type="number"
                value={parentAnswer}
                onChange={(e) => setParentAnswer(e.target.value)}
                className="input-fancy"
                placeholder="..."
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '2px solid rgba(255,255,255,0.15)', height: '36px', padding: '6px', textAlign: 'center', fontSize: '1rem', flex: 1 }}
                autoFocus
              />
              <button type="submit" className="btn-big" style={{ height: '36px', padding: '0 12px', width: 'auto', marginTop: 0, fontSize: '0.78rem', background: 'linear-gradient(135deg, var(--c-purple), var(--c-pink))' }}>
                Mở khóa
              </button>
            </div>
            <button 
              type="button" 
              onClick={() => setShowParentRecovery(false)} 
              style={{ background: 'none', border: 'none', color: '#ccc', fontSize: '0.7rem', textDecoration: 'underline', marginTop: '10px', cursor: 'pointer' }}
            >
              Quay lại nhập mã PIN của bé
            </button>
          </form>
        ) : (
          /* --- STANDARD NUMERIC KEYPAD --- */
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              justifyItems: 'center',
              rowGap: '16px',
              maxWidth: '240px',
              margin: '0 auto 20px'
            }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button key={num} onClick={() => handleKeypadPress(num)} className="key-bubble">{num}</button>
              ))}
              <button onClick={handleKeypadClear} className="key-bubble" style={{ fontSize: '0.9rem', color: '#ffb8b8' }}>Xóa</button>
              <button onClick={() => handleKeypadPress('0')} className="key-bubble">0</button>
              <button onClick={handleKeypadDelete} className="key-bubble" style={{ fontSize: '0.9rem', display: 'grid', placeItems: 'center' }} title="Backspace">
                <Delete size={20} />
              </button>
            </div>

            <button 
              onClick={handleOpenParentRecovery}
              style={{ background: 'none', border: 'none', color: '#ffb8b8', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Bé quên mã khóa? Nhờ bố mẹ mở khóa giúp nhé! 🙋‍♂️
            </button>
          </div>
        )}

        <button 
          className="btn-ghost" 
          onClick={() => { beep('sine'); setLockedProfile(null); }}
          style={{ color: '#aaa', borderColor: 'rgba(255,255,255,0.2)', marginTop: '20px', height: '40px' }}
        >
          ← Trở lại danh sách bé
        </button>
      </div>
    );
  }

  if (isCreating) {
    /* ==================== PREMIUM PROFILE CREATION FORM ==================== */
    return (
      <div className="profile-box" style={{ maxWidth: '440px', margin: '40px auto 0', padding: '24px 20px' }}>
        <h2 style={{ marginBottom: '12px', fontSize: '1.6rem', fontWeight: 900, color: 'var(--c-purple)' }}>
          Bé Tên Gì Thế Nhỉ? 🧒
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ink-soft)' }}>Họ tên biệt danh của bé:</label>
            <input 
              type="text" 
              className="input-fancy" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Vy Vy, Ben, ..." 
              maxLength={12} 
              style={{ marginTop: '4px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ink-soft)' }}>Độ tuổi / Trình độ học:</label>
            <select 
              className="select-fancy" 
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={{ width: '100%', marginTop: '4px', padding: '10px 14px', borderRadius: '18px', border: '3px solid rgba(0,0,0,0.06)' }}
            >
              <option value="young">Mầm non (3-5 tuổi) 🐥</option>
              <option value="grade1">Học sinh Lớp 1 🏫</option>
              <option value="grade2">Học sinh Lớp 2 🏫</option>
              <option value="mid">Học sinh Lớp 3 🏫</option>
              <option value="grade4">Học sinh Lớp 4 🏫</option>
              <option value="older">Học sinh Lớp 5 🏫</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ink-soft)' }}>Cài mã khóa bảo mật PIN (Tự chọn - 4 chữ số):</label>
            <p style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', margin: '2px 0 4px' }}>
              💡 Để trống nếu không muốn đặt mã bảo mật. Bé khác sẽ không vào xem bài của con được.
            </p>
            <input 
              type="text" 
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              className="input-fancy" 
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Ví dụ: 1234" 
              style={{ marginTop: '4px', letterSpacing: '4px', fontSize: '1.1rem', textAlign: 'center' }}
            />
          </div>
        </div>
        
        <p style={{ margin: '18px 0 6px', fontWeight: '800', fontSize: '0.98rem', color: 'var(--ink)' }}>
          Chọn nhân vật cho bé <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', fontWeight: 700 }}>({avatars.length} lựa chọn)</span>
        </p>
        <div className="avatar-selector" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
          gap: '8px',
          marginBottom: '20px',
          maxHeight: '220px',
          overflowY: 'auto',
          padding: '6px',
          background: 'rgba(0,0,0,0.03)',
          borderRadius: '14px',
        }}>
          {avatars.map(av => (
            <span
              key={av}
              className={`avatar-option ${avatar === av ? 'selected' : ''}`}
              onClick={() => { beep('pop'); setAvatar(av); }}
              style={{
                fontSize: '2rem', borderRadius: '50%', background: avatar === av ? 'linear-gradient(135deg,var(--c-purple),var(--c-pink))' : '#fffdf7',
                cursor: 'pointer', transition: 'all 0.15s', border: avatar === av ? '3px solid #fff' : '2px solid rgba(0,0,0,0.05)',
                transform: avatar === av ? 'scale(1.12)' : 'none',
                width: '52px', height: '52px',
                display: 'grid', placeItems: 'center',
                boxShadow: avatar === av ? '0 4px 12px rgba(157,107,255,0.4)' : 'none',
              }}
            >
              {av.split(' ')[av.split(' ').length - 1]}
            </span>
          ))}
        </div>
        
        <button className="btn-big" onClick={handleCreate} style={{ background: 'linear-gradient(135deg, var(--c-purple), var(--c-pink))' }}>
          ✨ Bắt Đầu Học Thôi!
        </button>
        <button className="btn-ghost" onClick={() => { beep('sine'); setIsCreating(false); }}>Quay lại</button>
      </div>
    );
  }

  /* ==================== PREMIUM PROFILES SELECTION DASHBOARD ==================== */
  return (
    <div className="profile-box" style={{ maxWidth: '540px', margin: '40px auto 0', padding: '28px 22px', position: 'relative' }}>
      {currentProfile && (
        <button
          className="back-btn"
          onClick={() => { beep('sine'); setActiveScreen('home'); }}
          style={{ position: 'absolute', top: 14, left: 14, margin: 0 }}
        >
          <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          Quay lại
        </button>
      )}
      <div className="big" style={{ fontSize: '4.6rem', marginBottom: '10px', animation: 'bob 2s ease-in-out infinite' }}>🦉</div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--c-purple)' }}>Vương Quốc Tiếng Anh</h2>
      <p style={{ color: '#6b6391', fontWeight: 600, fontSize: '0.92rem', margin: '0 0 10px' }}>
        Chọn bé đang học hoặc tạo tài khoản mới để khám phá nhé!
      </p>
      
      <div className="profile-list" style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
        gap: '14px', margin: '24px 0' 
      }}>
        {profiles.map(p => {
          const equippedPetItem = p.equippedPet 
            ? MERCHANDISE.pets.find(x => x.id === p.equippedPet) 
            : null;

          return (
            <div 
              key={p.id} 
              className="profile-card"
              onClick={() => handleSelectProfile(p)}
              style={{
                background: '#fffdf7', 
                borderRadius: '24px', 
                padding: '18px 12px',
                boxShadow: '0 6px 0 rgba(0,0,0,.05)', 
                border: '3px solid rgba(0,0,0,0.03)', 
                cursor: 'pointer',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '4px',
                transition: 'all 0.15s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 16px rgba(0,0,0,0.06)';
                e.currentTarget.style.borderColor = 'var(--c-purple)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 6px 0 rgba(0,0,0,.05)';
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.03)';
              }}
            >
              {/* Shield Pin status label */}
              {p.pinCode && (
                <span 
                  style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    right: '8px', 
                    color: 'var(--c-purple)', 
                    background: 'rgba(157, 107, 255, 0.08)',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'grid',
                    placeItems: 'center'
                  }}
                  title="Tài khoản bảo mật PIN"
                >
                  <Lock size={11} fill="var(--c-purple)" />
                </span>
              )}

              {/* Avatar Photo & Pet Badge side-by-side inside cards */}
              <div style={{ position: 'relative', width: '64px', height: '64px', margin: '4px 0' }}>
                <span className="ava" style={{ fontSize: '3.6rem', lineHeight: '64px', display: 'block' }}>
                  {p.avatar.split(' ')[p.avatar.split(' ').length - 1]}
                </span>
                {equippedPetItem && (
                  <span style={{
                    position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '1.1rem',
                    background: '#fff', borderRadius: '50%', width: '22px', height: '22px',
                    display: 'grid', placeItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }} title={`Thú cưng: ${equippedPetItem.name}`}>
                    {equippedPetItem.e.split(' ')[0]}
                  </span>
                )}
              </div>

              <span className="pname" style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--ink)' }}>
                {p.name}
              </span>
              
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
                {getRank(p.stars)}
              </span>

              <span className="pbadge" style={{ fontSize: '0.72rem', background: 'var(--c-purple)', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 800, marginTop: '4px' }}>
                ⭐ {p.stars} Sao
              </span>
            </div>
          );
        })}
      </div>
      
      <button 
        className="btn-big" 
        onClick={() => { beep('sine'); setIsCreating(true); }}
        style={{ background: 'linear-gradient(135deg, var(--c-purple), var(--c-pink))', boxShadow: '0 4px 0 #7a4fd6' }}
      >
        ➕ Tạo Tài Khoản Mới Cho Bé
      </button>
    </div>
  );
}
