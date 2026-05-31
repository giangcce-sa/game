import React, { useState } from 'react';
import { useGame, MERCHANDISE } from '../context/GameContext';
import { ArrowLeft } from 'lucide-react';

export default function StoreScreen() {
  const { currentProfile, setActiveScreen, buyOrEquipItem } = useGame();
  const [activeTab, setActiveTab] = useState('pets'); // 'pets' | 'skins' | 'badges'

  if (!currentProfile) return null;

  const currentTabItems = MERCHANDISE[activeTab];

  return (
    <div>
      {/* Store Header */}
      <div className="game-head">
        <button className="back-btn" onClick={() => setActiveScreen('home')}>
          <ArrowLeft size={16} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />
          Trang chủ
        </button>
        <div className="spacer"></div>
        <div className="stat coin" style={{ background: '#fff' }}>
          <span className="ico">🪙</span>
          <span>{currentProfile.coins}</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="profile-box" style={{ padding: '20px 14px' }}>
        <h2 style={{ marginBottom: '4px', fontSize: '1.5rem', fontWeight: 800 }}>🏪 Cửa Hàng Kỳ Diệu</h2>
        <p style={{ marginBottom: '14px', fontSize: '0.85rem', color: '#6b6391', fontWeight: 600 }}>
          Bé hãy chơi đúng các câu hỏi để rinh thật nhiều xu đổi quà nhé!
        </p>
        
        {/* Navigation Tabs */}
        <div className="store-tabs" style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '14px', marginBottom: '12px' }}>
          <button 
            className={`store-tab ${activeTab === 'pets' ? 'active' : ''}`}
            onClick={() => setActiveTab('pets')}
          >
            🐾 Thú Cưng
          </button>
          <button 
            className={`store-tab ${activeTab === 'skins' ? 'active' : ''}`}
            onClick={() => setActiveTab('skins')}
          >
            🎨 Giao Diện
          </button>
          <button 
            className={`store-tab ${activeTab === 'badges' ? 'active' : ''}`}
            onClick={() => setActiveTab('badges')}
          >
            🏆 Huy Hiệu
          </button>
        </div>

        {/* Merchandise Grid */}
        <div className="store-grid">
          {currentTabItems.map(item => {
            const isOwned = currentProfile.ownedItems.includes(item.id);
            const isEquipped = (activeTab === 'pets' && currentProfile.equippedPet === item.id) ||
                               (activeTab === 'skins' && currentProfile.equippedSkin === item.id);

            return (
              <div 
                key={item.id} 
                className="store-item"
                style={{
                  background: isOwned ? '#f2fff9' : '#fff',
                  borderColor: isOwned ? 'var(--c-mint)' : 'transparent',
                  borderWidth: '2px', borderStyle: 'solid'
                }}
              >
                <div className="s-visual" style={{ fontSize: '2.8rem', lineHeight: 1 }}>{item.e}</div>
                <div className="s-name" style={{ fontWeight: 800, fontSize: '0.98rem' }}>{item.name}</div>
                <div className="s-desc" style={{ fontSize: '0.75rem', color: '#6b6391', fontWeight: 600, minHeight: '34px' }}>
                  {item.desc}
                </div>
                
                <button 
                  className={`btn-buy ${isOwned ? 'owned' : ''}`}
                  onClick={() => buyOrEquipItem(item)}
                  style={{
                    background: isOwned ? (isEquipped ? '#26d0a6' : '#9d6bff') : 'var(--c-sun)',
                    color: (isOwned) ? '#fff' : 'var(--ink)',
                    boxShadow: isOwned ? 'none' : '0 3px 0 #dcae16'
                  }}
                >
                  {isOwned ? (isEquipped ? "Đang dùng" : "Chọn dùng") : `🪙 ${item.price}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
