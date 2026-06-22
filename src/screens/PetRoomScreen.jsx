import React, { useState, useEffect, useRef } from 'react';
import { useGame, MERCHANDISE } from '../context/GameContext';
import { ArrowLeft, Sparkles, Heart, Award, Shield, AlertCircle } from 'lucide-react';
import { getPetStage, getStageProgress, getPointsToNextStage, getNextStage, PET_STAGES } from '../lib/petStages';

const FOOD_ITEMS = [
  { name: "Dưa Hấu 🍉", cost: 5, points: 10, e: "🍉" },
  { name: "Bánh Quy 🍪", cost: 8, points: 18, e: "🍪" },
  { name: "Kẹo Ngọt 🍬", cost: 6, points: 14, e: "🍬" },
  { name: "Sữa Tươi 🥛", cost: 10, points: 25, e: "🥛" }
];

export default function PetRoomScreen() {
  const {
    currentProfile,
    setActiveScreen,
    buyOrEquipItem,
    feedPet,
    beep,
    showToast,
  } = useGame();

  const [activePet, setActivePet] = useState(null);
  const [friendshipPoints, setFriendshipPoints] = useState(0);
  const [heartsList, setHeartsList] = useState([]); // Array of floating hearts
  const [bouncePet, setBouncePet] = useState(false);
  const [showEvolveAnim, setShowEvolveAnim] = useState(false);
  const lastStageRef = useRef(0);

  // Load active pet and its friendship score
  useEffect(() => {
    if (!currentProfile) return;
    const petId = currentProfile.equippedPet;
    const pet = petId ? MERCHANDISE.pets.find(x => x.id === petId) : null;
    setActivePet(pet);

    const points = (currentProfile.petFriendship && currentProfile.petFriendship[petId]) || 0;
    setFriendshipPoints(points);

    // Detect evolution → trigger celebration animation
    const stage = getPetStage(points).id;
    if (lastStageRef.current && stage > lastStageRef.current) {
      setShowEvolveAnim(true);
      setTimeout(() => setShowEvolveAnim(false), 3000);
    }
    lastStageRef.current = stage;
  }, [currentProfile]);

  const stage = getPetStage(friendshipPoints);
  const progress = getStageProgress(friendshipPoints);
  const nextStage = getNextStage(stage.id);
  const ptsToNext = getPointsToNextStage(friendshipPoints);

  const handleFeed = (food) => {
    if (!activePet) return;
    
    // Call feedPet function in context
    const success = feedPet(food.name, food.cost, food.points);
    
    if (success) {
      // Trigger Pet bouncing animation
      setBouncePet(true);
      setTimeout(() => setBouncePet(false), 800);

      // Trigger floating hearts animation
      const id = Date.now();
      const newHeart = {
        id,
        left: `${40 + Math.random() * 20}%`,
        char: Math.random() > 0.5 ? '❤️' : '✨'
      };
      setHeartsList(prev => [...prev, newHeart]);
      
      // Auto remove heart after 1.5s
      setTimeout(() => {
        setHeartsList(prev => prev.filter(h => h.id !== id));
      }, 1500);
    }
  };

  // Get owned pets list
  const ownedPets = currentProfile
    ? MERCHANDISE.pets.filter(p => currentProfile.ownedItems.includes(p.id))
    : [];

  return (
    <div style={{ padding: '16px 12px', color: 'var(--ink)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button 
          className="back-btn" 
          onClick={() => {
            beep('sine');
            setActiveScreen('home');
          }} 
          style={{ margin: 0 }}
        >
          ←
        </button>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--c-purple)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          🦁 Góc Chăm Sóc Thú Cưng
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Main Pet Playroom Window */}
        <div className="play-card" style={{ padding: '22px 14px', minHeight: '340px', background: 'var(--paper)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Floating Hearts/Sparkles layer */}
          {heartsList.map(h => (
            <span
              key={h.id}
              className="pet-heart-float"
              style={{
                position: 'absolute',
                left: h.left,
                bottom: '40%',
                fontSize: '2rem',
                zIndex: 10,
                pointerEvents: 'none',
                animation: 'floatUpHeart 1.5s ease-out forwards'
              }}
            >
              {h.char}
            </span>
          ))}

          {/* Wallet HUD */}
          <div style={{
            position: 'absolute', top: '12px', right: '12px', background: 'rgba(255, 165, 0, 0.1)',
            border: '2px solid rgba(255,165,0,0.2)', padding: '4px 10px', borderRadius: '12px',
            fontSize: '0.8rem', fontWeight: 900, color: '#d48000'
          }}>
            🪙 Bé có: {currentProfile.coins} Xu
          </div>

          {activePet ? (
            /* --- ACTIVE PET VIEW --- */
            <div>
              {/* Evolution stage badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: `${stage.color}1a`, border: `2px solid ${stage.color}55`, padding: '6px 14px', borderRadius: '16px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1rem' }}>{stage.emoji}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: stage.color }}>
                  Cấp {stage.id}: {stage.name}
                </span>
                {stage.boostLabel && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, background: stage.color, color: '#fff', padding: '2px 7px', borderRadius: 8 }}>
                    {stage.boostLabel}
                  </span>
                )}
              </div>

              {/* Evolution celebration overlay */}
              {showEvolveAnim && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 20,
                  display: 'grid', placeItems: 'center', pointerEvents: 'none',
                  background: 'radial-gradient(circle at center, rgba(253,224,71,0.35), transparent 70%)',
                  animation: 'popIn 0.3s',
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: stage.color, textShadow: '0 2px 12px rgba(255,255,255,0.9)', animation: 'bounce 0.8s ease' }}>
                    ⚡ TIẾN HÓA! ⚡
                  </div>
                </div>
              )}

              {/* Particle ring for legendary */}
              {stage.particles && (
                <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 1 }}>
                  {['✨','⭐','💫','✨','⭐'].map((p, i) => (
                    <span key={i} style={{
                      position: 'absolute',
                      left: `${Math.cos(i * 1.26) * 90}px`,
                      top: `${Math.sin(i * 1.26) * 70}px`,
                      fontSize: '1.2rem',
                      animation: `floatUpHeart ${2 + i*0.3}s ease-in-out infinite`,
                      animationDelay: `${i * 0.3}s`,
                    }}>{p}</span>
                  ))}
                </div>
              )}

              {/* Giant Interactive Pet Emoji */}
              <div style={{
                fontSize: '6.8rem',
                margin: '10px auto 14px',
                width: '180px',
                height: '180px',
                display: 'grid',
                placeItems: 'center',
                position: 'relative',
                cursor: 'pointer',
                zIndex: 2,
              }}
              onClick={() => {
                beep('good');
                setBouncePet(true);
                setTimeout(() => setBouncePet(false), 800);
              }}
              >
                <div style={{
                  fontSize: '6.8rem',
                  transform: `scale(${stage.scale})`,
                  transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
                  filter: `drop-shadow(0 4px 8px rgba(0,0,0,0.15)) ${stage.glow !== 'none' ? `drop-shadow(${stage.glow})` : ''}`,
                  animation: bouncePet
                    ? 'bounce 0.8s ease'
                    : stage.id >= 3 ? 'bob 2.4s ease-in-out infinite' : (stage.id === 1 ? 'bob 3.5s ease-in-out infinite' : 'none'),
                }}>
                  {activePet.e}
                </div>
                {/* Egg shell for stage 1 */}
                {stage.id === 1 && (
                  <>
                    <span style={{ position: 'absolute', left: 8, bottom: 10, fontSize: '1.5rem', transform: 'rotate(-25deg)' }}>🥚</span>
                    <span style={{ position: 'absolute', right: 8, bottom: 10, fontSize: '1.2rem', transform: 'rotate(25deg)' }}>🥚</span>
                  </>
                )}
                {/* Crown for legendary */}
                {stage.id === 4 && (
                  <span style={{ position: 'absolute', top: -8, fontSize: '2rem', animation: 'bob 2s ease-in-out infinite' }}>👑</span>
                )}
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ink)', margin: '0 0 4px' }}>
                {activePet.name}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-soft)', fontWeight: 600, margin: '0 0 16px' }}>
                "{activePet.desc}"
              </p>

              {/* Stage progress bar */}
              <div style={{ maxWidth: '320px', margin: '0 auto 12px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: 'var(--ink-soft)', marginBottom: '3px' }}>
                  <span>Điểm Thân Thiết: {friendshipPoints}/100</span>
                  {nextStage && <span style={{ color: stage.color }}>Còn {ptsToNext} điểm → {nextStage.name}</span>}
                </div>
                <div style={{ height: '14px', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                  {/* Stage markers */}
                  {PET_STAGES.slice(0, -1).map(s => (
                    <div key={s.id} style={{
                      position: 'absolute',
                      left: `${s.maxPts + 0.5}%`,
                      top: 0, bottom: 0,
                      width: 2,
                      background: 'rgba(0,0,0,0.15)',
                    }} />
                  ))}
                  <div style={{
                    height: '100%',
                    width: `${friendshipPoints}%`,
                    background: `linear-gradient(90deg, ${PET_STAGES[0].color}, ${stage.color})`,
                    borderRadius: '10px',
                    transition: 'width 0.6s',
                  }}/>
                </div>
              </div>

              {/* Stage description / next stage hint */}
              {nextStage ? (
                <div style={{
                  background: `${stage.color}10`, border: `2px dashed ${stage.color}88`,
                  padding: '10px', borderRadius: '14px', maxWidth: '340px', margin: '0 auto',
                  fontSize: '0.78rem', fontWeight: 700, color: stage.color,
                }}>
                  💡 Cho ăn thêm <strong>{ptsToNext} điểm</strong> để tiến hóa thành <strong>{nextStage.emoji} {nextStage.name}</strong> ({nextStage.boostLabel || 'mở khóa kỹ năng mới'})
                </div>
              ) : (
                <div style={{
                  background: 'rgba(157,107,255,0.08)', border: '2px dashed var(--c-purple)',
                  padding: '10px', borderRadius: '14px', maxWidth: '340px', margin: '0 auto',
                  fontSize: '0.8rem', fontWeight: 800, color: 'var(--c-purple)',
                }}>
                  👑 ĐẠT ĐỈNH HUYỀN THOẠI! Linh thú ban phúc x2 xu mỗi lần thắng game!
                </div>
              )}

            </div>
          ) : (
            /* --- NO PET EQUIPPED --- */
            <div style={{ padding: '40px 10px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '12px' }}>🐾💤</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--ink-soft)' }}>
                Bé chưa dắt thú cưng vào phòng
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 600, maxWidth: '280px', margin: '6px auto 20px', lineHeight: '1.4' }}>
                Hãy mua một người bạn thú cưng ở Cửa Hàng hoặc chọn đồng hành đã có trong danh sách bên dưới nhé!
              </p>
            </div>
          )}

        </div>

        {/* Feeding Items Shelf */}
        {activePet && (
          <div style={{
            background: 'var(--paper)', border: '2px solid rgba(0,0,0,0.05)',
            padding: '16px 14px', borderRadius: '24px', boxShadow: 'var(--shadow-sm)', textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--c-purple)', margin: '0 0 10px' }}>
              🍪 Kệ Đồ Ăn Cho Thú Cưng (Dùng Xu mua)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {FOOD_ITEMS.map(food => (
                <button
                  key={food.name}
                  onClick={() => handleFeed(food)}
                  disabled={currentProfile.coins < food.cost}
                  style={{
                    background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '16px',
                    padding: '10px', display: 'flex', alignItems: 'center', gap: '8px',
                    cursor: currentProfile.coins >= food.cost ? 'pointer' : 'default',
                    opacity: currentProfile.coins >= food.cost ? 1 : 0.5,
                    boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: '1.8rem' }}>{food.e}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--ink)' }}>{food.name}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--c-purple)' }}>🪙 {food.cost} xu</div>
                    <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--c-pink)' }}>💖 +{food.points} thân thiết</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Owned Pets List Selector */}
        <div style={{
          background: 'var(--paper)', border: '2px solid rgba(0,0,0,0.05)',
          padding: '16px 14px', borderRadius: '24px', boxShadow: 'var(--shadow-sm)', textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--c-purple)', margin: '0 0 10px' }}>
            📖 Bộ Sưu Tập Thú Cưng ({ownedPets.length}/{MERCHANDISE.pets.length})
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '8px' }}>
            {MERCHANDISE.pets.map(pet => {
              const owned = currentProfile.ownedItems.includes(pet.id);
              const isEquipped = currentProfile.equippedPet === pet.id;
              const pts = (currentProfile.petFriendship && currentProfile.petFriendship[pet.id]) || 0;
              const petStageId = owned ? getPetStage(pts).id : 0;
              return (
                <button
                  key={pet.id}
                  onClick={() => { beep('sine'); if (owned) buyOrEquipItem(pet); else showToast(`Mở khóa ${pet.name} ở Cửa Hàng với ${pet.price}🪙 nhé! 🛍️`, ''); }}
                  style={{
                    background: isEquipped ? 'rgba(157, 107, 255, 0.08)' : owned ? '#fff' : 'rgba(0,0,0,0.04)',
                    border: isEquipped ? '2px solid var(--c-purple)' : '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '16px', padding: '8px 4px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '2px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', position: 'relative',
                    opacity: owned ? 1 : 0.55,
                  }}
                >
                  <span style={{ fontSize: '2rem', filter: owned ? 'none' : 'grayscale(1)' }}>
                    {owned ? pet.e : '❓'}
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isEquipped ? 'var(--c-purple)' : 'var(--ink-soft)' }}>
                    {owned ? pet.name.split(' ')[0] : `${pet.price}🪙`}
                  </span>
                  {/* evolution pips for owned pets */}
                  {owned && (
                    <span style={{ display: 'flex', gap: 2 }}>
                      {PET_STAGES.map(s => (
                        <span key={s.id} style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: s.id <= petStageId ? 'var(--c-sun)' : 'rgba(0,0,0,0.12)',
                        }} />
                      ))}
                    </span>
                  )}
                  {!owned && (
                    <span style={{ position: 'absolute', top: 4, right: 5, fontSize: '0.7rem' }}>🔒</span>
                  )}
                  {isEquipped && (
                    <span style={{
                      position: 'absolute', top: '-4px', right: '-4px', fontSize: '0.62rem',
                      background: 'var(--c-grass)', color: '#fff', borderRadius: '50%', width: '14px', height: '14px',
                      display: 'grid', placeItems: 'center', fontWeight: 900
                    }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
