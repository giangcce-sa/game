import React, { useState } from 'react';
import { useGame, MERCHANDISE } from '../context/GameContext';
import { ArrowLeft } from 'lucide-react';
import { getPetStage } from '../lib/petStages';

const TIER_META = {
  common:    { color: '#9ca3af', label: 'Phổ thông', glow: 'rgba(156,163,175,0.25)' },
  rare:      { color: '#3b82f6', label: 'Hiếm',      glow: 'rgba(59,130,246,0.35)'  },
  epic:      { color: '#a855f7', label: 'Sử thi',    glow: 'rgba(168,85,247,0.45)'  },
  legendary: { color: '#f59e0b', label: 'Huyền thoại', glow: 'rgba(245,158,11,0.55)' },
};

export default function StoreScreen() {
  const { currentProfile, setActiveScreen, buyOrEquipItem } = useGame();
  const [activeTab, setActiveTab] = useState('pets'); // 'pets' | 'skins' | 'badges'
  const [tierFilter, setTierFilter] = useState('all'); // 'all' | tier id

  if (!currentProfile) return null;

  const allItems = MERCHANDISE[activeTab];
  const currentTabItems = tierFilter === 'all' ? allItems : allItems.filter(it => (it.tier || 'common') === tierFilter);
  const availableTiers = [...new Set(allItems.map(it => it.tier || 'common'))];

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

        {/* Tier filter */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none', padding: '2px 0' }}>
          <button onClick={() => setTierFilter('all')} style={{
            flexShrink: 0, padding: '5px 12px', borderRadius: 14, border: 'none',
            fontFamily: 'var(--font)', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
            background: tierFilter === 'all' ? '#1e1b4b' : 'rgba(0,0,0,0.06)',
            color: tierFilter === 'all' ? '#fff' : '#6b6391',
          }}>
            Tất cả ({allItems.length})
          </button>
          {['common', 'rare', 'epic', 'legendary'].filter(t => availableTiers.includes(t)).map(tier => {
            const count = allItems.filter(it => (it.tier || 'common') === tier).length;
            const meta = TIER_META[tier];
            return (
              <button key={tier} onClick={() => setTierFilter(tier)} style={{
                flexShrink: 0, padding: '5px 12px', borderRadius: 14, border: 'none',
                fontFamily: 'var(--font)', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
                background: tierFilter === tier ? meta.color : 'rgba(0,0,0,0.06)',
                color: tierFilter === tier ? '#fff' : meta.color,
                boxShadow: tierFilter === tier ? `0 2px 8px ${meta.glow}` : 'none',
              }}>
                {meta.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Merchandise Grid */}
        <div className="store-grid">
          {currentTabItems.map(item => {
            const isOwned = currentProfile.ownedItems.includes(item.id);
            const isEquipped = (activeTab === 'pets' && currentProfile.equippedPet === item.id) ||
                               (activeTab === 'skins' && currentProfile.equippedSkin === item.id);
            const tier = item.tier || 'common';
            const tierMeta = TIER_META[tier];
            const canAfford = currentProfile.coins >= item.price;

            return (
              <div
                key={item.id}
                className="store-item"
                style={{
                  background: isOwned ? '#f2fff9' : '#fff',
                  borderColor: isOwned ? 'var(--c-mint)' : tierMeta.color,
                  borderWidth: '2px', borderStyle: 'solid',
                  boxShadow: tier === 'legendary' ? `0 0 14px ${tierMeta.glow}` : tier === 'epic' ? `0 0 8px ${tierMeta.glow}` : 'none',
                  position: 'relative',
                }}
              >
                {/* Tier badge */}
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  background: tierMeta.color, color: '#fff',
                  fontSize: '0.62rem', fontWeight: 900,
                  padding: '2px 7px', borderRadius: 8,
                  letterSpacing: 0.3,
                }}>
                  {tierMeta.label}
                </div>

                <div className="s-visual" style={{ fontSize: '2.8rem', lineHeight: 1 }}>{item.e}</div>
                <div className="s-name" style={{ fontWeight: 800, fontSize: '0.98rem' }}>{item.name}</div>
                <div className="s-desc" style={{ fontSize: '0.75rem', color: '#6b6391', fontWeight: 600, minHeight: '34px' }}>
                  {item.desc}
                </div>

                {/* Pet evolution stage indicator (only for owned pets) */}
                {activeTab === 'pets' && isOwned && (() => {
                  const friendship = currentProfile.petFriendship?.[item.id] || 0;
                  const stage = getPetStage(friendship);
                  return (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      fontSize: '0.7rem', fontWeight: 800, color: stage.color,
                      background: `${stage.color}15`, padding: '3px 8px', borderRadius: 10,
                      marginBottom: 6,
                    }}>
                      <span>{stage.emoji}</span>
                      <span>Cấp {stage.id}: {stage.name}</span>
                      {stage.id < 4 && <span style={{ opacity: 0.6 }}>({friendship}/100)</span>}
                    </div>
                  );
                })()}

                <button
                  className={`btn-buy ${isOwned ? 'owned' : ''}`}
                  onClick={() => buyOrEquipItem(item)}
                  disabled={!isOwned && !canAfford}
                  style={{
                    background: isOwned ? (isEquipped ? '#26d0a6' : '#9d6bff') : (canAfford ? 'var(--c-sun)' : '#d4d4d8'),
                    color: (isOwned) ? '#fff' : (canAfford ? 'var(--ink)' : '#71717a'),
                    boxShadow: isOwned ? 'none' : (canAfford ? '0 3px 0 #dcae16' : 'none'),
                    cursor: (!isOwned && !canAfford) ? 'not-allowed' : 'pointer',
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
