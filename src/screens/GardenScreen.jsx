import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Volume2, Coins } from 'lucide-react';
import { SEED_SHOP, BOOSTS, getSeedById, getGrowthStage, effectiveGrowth, GARDEN_MAX_GROWTH, PLOT_UNLOCK_COSTS } from '../data/garden';

export default function GardenScreen({ onBack }) {
  const {
    currentProfile, beep, showToast, speak, getCombinedVocab,
    buySeed, plantSeed, waterPlant, harvestPlant, buyGardenBoost, unlockPlot,
  } = useGame();

  const [tab, setTab] = useState('garden'); // 'garden' | 'shop'
  // tick re-renders so time-based growth updates while the screen is open
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  // Vocab gate modal: { mode:'plant'|'harvest'|'water', seed, plotIndex, options, answered }
  const [gate, setGate] = useState(null);

  if (!currentProfile) return null;
  const g = currentProfile.gardenProgress || { plots: [], inventory: {}, unlockedPlots: 4, bigFruit: 0 };
  const plots = g.plots || [];
  const inventory = g.inventory || {};
  const unlocked = g.unlockedPlots || 4;
  const TOTAL_PLOTS = 8;

  // Build a 3-choice quiz for a seed's word
  const openGate = (mode, seed, plotIndex) => {
    beep('sine');
    const pool = getCombinedVocab();
    const target = { w: seed.word, e: seed.e, vi: seed.vi };
    const wrongs = pool.filter(v => (v.vi || '') !== seed.vi).sort(() => 0.5 - Math.random()).slice(0, 2)
      .map(v => ({ w: v.w, e: v.e, vi: v.vi }));
    const options = [target, ...wrongs].sort(() => 0.5 - Math.random());
    setGate({ mode, seed, plotIndex, options, answered: null });
    speak(seed.word);
  };

  const answerGate = (opt) => {
    if (!gate || gate.answered) return;
    const correct = opt.vi === gate.seed.vi;
    setGate({ ...gate, answered: opt.vi });
    if (correct) {
      beep('good');
      setTimeout(() => {
        if (gate.mode === 'plant') plantSeed(gate.seed.id, gate.plotIndex);
        else if (gate.mode === 'water') waterPlant(gate.plotIndex);
        else if (gate.mode === 'harvest') harvestPlant(gate.plotIndex);
        setGate(null);
      }, 900);
    } else {
      beep('bad');
      setTimeout(() => setGate(null), 1400);
    }
  };

  // Which seed to plant next: first in inventory with count > 0
  const [selectedSeedId, setSelectedSeedId] = useState(null);
  const ownedSeedIds = Object.keys(inventory).filter(id => inventory[id] > 0);
  const activeSeedId = selectedSeedId && inventory[selectedSeedId] > 0 ? selectedSeedId : ownedSeedIds[0] || null;

  const handlePlotClick = (i) => {
    if (i >= unlocked) { // locked plot → offer unlock
      const cost = PLOT_UNLOCK_COSTS[i] || 0;
      if (window.confirm(`Mở luống đất này với ${cost} xu?`)) unlockPlot(i);
      return;
    }
    const plot = plots[i];
    if (!plot) {
      // empty → plant the selected seed (vocab gate)
      if (!activeSeedId) { showToast('Bé hãy mua hạt ở Cửa hàng trước nhé! 🌰', 'bad'); setTab('shop'); return; }
      openGate('plant', getSeedById(activeSeedId), i);
      return;
    }
    const grown = effectiveGrowth(plot);
    if (grown >= GARDEN_MAX_GROWTH) openGate('harvest', getSeedById(plot.seedId), i);
    else openGate('water', getSeedById(plot.seedId), i);
  };

  return (
    <div style={{ padding: '16px 12px', color: 'var(--ink)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button className="back-btn" onClick={() => { beep('sine'); onBack(); }} style={{ margin: 0 }}>←</button>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--c-mint, #16a34a)', margin: 0 }}>
          🌱 Vườn Cây Của Bé
        </h2>
        <div style={{ marginLeft: 'auto', fontWeight: 900, color: '#e8a200', display: 'flex', alignItems: 'center', gap: 4 }}>
          🪙 {currentProfile.coins}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['garden', '🌳 Vườn'], ['shop', '🛒 Cửa hàng hạt']].map(([id, label]) => (
          <button key={id} onClick={() => { beep('pop'); setTab(id); }}
            className={`chip ${tab === id ? 'on' : ''}`}
            style={{ flex: 1, padding: '8px', fontSize: '0.85rem', fontWeight: 800 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'garden' ? (
        <>
          {/* Seed selector */}
          {ownedSeedIds.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 4 }}>
                Chọn hạt để trồng (chạm vào luống trống):
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ownedSeedIds.map(id => {
                  const s = getSeedById(id);
                  const on = activeSeedId === id;
                  return (
                    <button key={id} onClick={() => { beep('pop'); setSelectedSeedId(id); }}
                      style={{
                        padding: '6px 10px', borderRadius: 12, cursor: 'pointer',
                        border: on ? '2px solid var(--c-mint,#16a34a)' : '2px solid rgba(0,0,0,0.1)',
                        background: on ? 'rgba(22,163,74,0.08)' : '#fff', fontWeight: 800, fontSize: '0.82rem',
                      }}>
                      {s.e} {s.vi} ×{inventory[id]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plot grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {Array.from({ length: TOTAL_PLOTS }).map((_, i) => {
              const locked = i >= unlocked;
              const plot = plots[i];
              const grown = plot ? effectiveGrowth(plot) : 0;
              const stage = plot ? getGrowthStage(grown) : null;
              const seed = plot ? getSeedById(plot.seedId) : null;
              return (
                <button key={i} onClick={() => handlePlotClick(i)}
                  style={{
                    aspectRatio: '1', borderRadius: 16, cursor: 'pointer',
                    border: '2px solid rgba(0,0,0,0.08)',
                    background: locked ? 'rgba(0,0,0,0.06)' : 'linear-gradient(180deg,#d9f99d,#bbf7d0)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 2, position: 'relative', padding: 4,
                  }}>
                  {locked ? (
                    <>
                      <span style={{ fontSize: '1.6rem' }}>🔒</span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--ink-soft)' }}>
                        {PLOT_UNLOCK_COSTS[i]}🪙
                      </span>
                    </>
                  ) : plot ? (
                    <>
                      <span style={{ fontSize: '2rem', animation: stage.ready ? 'bob 2s ease-in-out infinite' : 'none' }}>
                        {stage.ready ? seed.e : stage.e}
                      </span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: stage.ready ? '#16a34a' : 'var(--ink-soft)' }}>
                        {stage.ready ? 'Thu hoạch!' : `${grown}/3`}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '1.4rem', opacity: 0.5 }}>➕</span>
                  )}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', fontWeight: 700, marginTop: 12, textAlign: 'center' }}>
            🌱 Chạm luống trống để trồng • 💧 chạm cây để tưới (trả lời đúng từ) • 🧺 cây chín để thu hoạch bán lấy xu
          </p>
        </>
      ) : (
        /* SHOP TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SEED_SHOP.map(seed => (
            <div key={seed.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              background: 'var(--paper)', border: '2px solid rgba(0,0,0,0.05)', borderRadius: 16,
            }}>
              <span style={{ fontSize: '2rem' }}>{seed.e}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: '0.92rem' }}>{seed.vi} <span style={{ color: 'var(--ink-soft)', fontWeight: 700, fontSize: '0.78rem' }}>({seed.word})</span></div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', fontWeight: 700 }}>
                  Bán được {seed.sellPrice}🪙 • lớn ~{seed.growMinutes}p
                </div>
              </div>
              <button onClick={() => buySeed(seed)} className="btn-big"
                style={{ width: 'auto', padding: '8px 12px', marginTop: 0, fontSize: '0.8rem',
                  background: 'linear-gradient(135deg,#16a34a,#22c55e)', boxShadow: '0 3px 0 #15803d' }}>
                Mua {seed.buyPrice}🪙
              </button>
            </div>
          ))}

          {/* Boosts */}
          <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--c-purple)', marginTop: 8 }}>✨ Vật phẩm đặc biệt</div>
          {BOOSTS.map(b => (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              background: 'rgba(157,107,255,0.06)', border: '2px solid rgba(157,107,255,0.2)', borderRadius: 16,
            }}>
              <span style={{ fontSize: '1.8rem' }}>{b.e}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>{b.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ink-soft)', fontWeight: 700 }}>{b.desc}</div>
              </div>
              <button onClick={() => buyGardenBoost(b)} className="btn-big"
                style={{ width: 'auto', padding: '8px 12px', marginTop: 0, fontSize: '0.8rem',
                  background: 'linear-gradient(135deg,#9d6bff,#ff7eb3)', boxShadow: '0 3px 0 #7a4fd6' }}>
                {b.price}🪙
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Vocab gate modal */}
      {gate && (
        <div className="overlay show" style={{ zIndex: 190, background: 'rgba(26,20,54,0.92)' }}>
          <div className="modal" style={{ maxWidth: 420, padding: '22px 18px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
              {gate.mode === 'plant' ? '🌱 Gieo hạt' : gate.mode === 'harvest' ? '🧺 Thu hoạch' : '💧 Tưới nước'} — đọc & chọn nghĩa đúng
            </span>
            <div style={{ fontSize: '2.6rem', margin: '12px 0 6px' }}>{gate.seed.e}</div>
            <button onClick={() => { beep('sine'); speak(gate.seed.word); }} className="btn-ghost"
              style={{ width: 'auto', padding: '6px 14px', borderRadius: 10, borderColor: 'var(--c-purple)', color: 'var(--c-purple)', fontSize: '0.82rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 0 }}>
              <Volume2 size={14} /> {gate.seed.word}
            </button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--c-purple)', margin: '16px 0 14px' }}>
              Từ này nghĩa là gì?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {gate.options.map(opt => {
                const isCorrect = opt.vi === gate.seed.vi;
                let cls = '';
                if (gate.answered) cls = isCorrect ? 'correct' : (gate.answered === opt.vi ? 'wrong' : 'dim');
                return (
                  <button key={opt.vi} className={`opt ${cls}`} onClick={() => answerGate(opt)} disabled={!!gate.answered}
                    style={{ height: 50, fontSize: '1.05rem', fontWeight: 800, background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, cursor: 'pointer' }}>
                    {opt.e} {opt.vi}
                  </button>
                );
              })}
            </div>
            {gate.answered && (
              <div style={{ marginTop: 14, fontWeight: 900, color: gate.answered === gate.seed.vi ? 'var(--c-grass)' : 'var(--c-coral)' }}>
                {gate.answered === gate.seed.vi ? '🎉 Chính xác!' : '😢 Chưa đúng, thử lại sau nhé!'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
