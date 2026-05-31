import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function ProfilesScreen() {
  const { profiles, selectProfile, createProfile } = useGame();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('mid');
  const [avatar, setAvatar] = useState('🦊');

  const avatars = ['🦊', '🐼', '🦁', '🦄', '🦖', '🐱', '🐰', '🐯'];

  const handleCreate = () => {
    if (!name.trim()) {
      alert("Bé hãy nhập tên của mình nhé! 🥰");
      return;
    }
    createProfile(name.trim(), avatar, age);
    setName('');
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <div className="profile-box" style={{ maxWidth: '440px', margin: '40px auto 0' }}>
        <h2 style={{ marginBottom: '12px', fontSize: '1.6rem' }}>Bé Tên Gì Thế Nhỉ? 🧒</h2>
        
        <input 
          type="text" 
          className="input-fancy" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên của bé..." 
          maxLength={12} 
        />
        
        <select 
          className="select-fancy" 
          value={age}
          onChange={(e) => setAge(e.target.value)}
          style={{ width: '100%', marginTop: '12px', padding: '12px', borderRadius: '18px', border: '3px solid rgba(0,0,0,0.06)' }}
        >
          <option value="young">Mầm non (3-5 tuổi)</option>
          <option value="grade1">Học sinh Lớp 1</option>
          <option value="grade2">Học sinh Lớp 2</option>
          <option value="mid">Học sinh Lớp 3</option>
          <option value="grade4">Học sinh Lớp 4</option>
          <option value="older">Học sinh Lớp 5</option>
        </select>
        
        <p style={{ margin: '18px 0 6px', fontWeight: '700', fontSize: '1.05rem' }}>Chọn người bạn đồng hành của bé:</p>
        <div className="avatar-selector" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
          {avatars.map(av => (
            <span 
              key={av} 
              className={`avatar-option ${avatar === av ? 'selected' : ''}`}
              onClick={() => setAvatar(av)}
              style={{
                fontSize: '2.4rem', padding: '6px', borderRadius: '50%', background: '#fffdf7',
                cursor: 'pointer', transition: 'transform 0.15s', border: avatar === av ? '3px solid #9d6bff' : '3px solid transparent',
                transform: avatar === av ? 'scale(1.15)' : 'none'
              }}
            >
              {av}
            </span>
          ))}
        </div>
        
        <button className="btn-big" onClick={handleCreate}>✨ Bắt Đầu Học Thôi!</button>
        <button className="btn-ghost" onClick={() => setIsCreating(false)}>Quay lại</button>
      </div>
    );
  }

  return (
    <div className="profile-box" style={{ maxWidth: '520px', margin: '40px auto 0' }}>
      <div className="big" style={{ fontSize: '4.6rem', marginBottom: '10px' }}>🦉</div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Vương Quốc Tiếng Anh</h2>
      <p style={{ color: '#6b6391', fontWeight: 600, fontSize: '0.95rem' }}>Chọn bé đang học hoặc tạo tài khoản mới nhé!</p>
      
      <div className="profile-list" style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
        gap: '14px', margin: '24px 0' 
      }}>
        {profiles.map(p => (
          <div 
            key={p.id} 
            className="profile-card"
            onClick={() => selectProfile(p.id)}
            style={{
              background: '#fffdf7', borderRadius: '24px', padding: '16px 10px',
              boxShadow: '0 4px 0 rgba(0,0,0,.08)', border: '3px solid transparent', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
            }}
          >
            <span className="ava" style={{ fontSize: '3.2rem', lineHeight: 1 }}>{p.avatar}</span>
            <span className="pname" style={{ fontWeight: 800, fontSize: '1.05rem' }}>{p.name}</span>
            <span className="pbadge" style={{ fontSize: '0.75rem', background: '#5ec8f8', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
              ⭐ {p.stars}
            </span>
          </div>
        ))}
      </div>
      
      <button className="btn-big" onClick={() => setIsCreating(true)}>➕ Tạo Tài Khoản Mới</button>
    </div>
  );
}
