import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft } from 'lucide-react';
import CuOwl from '../components/CuOwl';
import {
  ADVENTURE_CHAPTERS,
  ADVENTURE_NODES,
  GAME_LABEL,
  isNodeUnlocked,
  getNodeStars,
  getAdventureProgress,
  getChapterStars,
  getChapterMaxStars,
  isChapterComplete,
} from '../data/adventureMap';
import { TOPICS } from '../context/GameContext';

// ── Layout constants ──────────────────────────────────────────
const MAP_W = 300;
const CENTER_X = MAP_W / 2;
const OFFSET = 55;
const ROW_H = 96;
const NODE_SIZE = 68;
const BOSS_SIZE = 84;

// Pre-computed global index for each node id → O(1) lookup
const NODE_GLOBAL_IDX = {};
ADVENTURE_NODES.forEach((n, i) => { NODE_GLOBAL_IDX[n.id] = i; });

// Estimated quest rewards by game type
const QUEST_REWARDS = {
  picture:       { stars: 15, coins: 10 },
  memory:        { stars: 15, coins: 10 },
  quiz:          { stars: 20, coins: 15 },
  arcade:        { stars: 15, coins: 10 },
  writing:       { stars: 20, coins: 15 },
  grammar:       { stars: 20, coins: 15 },
  listening:     { stars: 20, coins: 15 },
  sentence:      { stars: 20, coins: 15 },
  minimal_pairs: { stars: 15, coins: 10 },
  arcade_vs:     { stars: 30, coins: 25 },
};

// Compute node center in the fixed-width MAP_W coordinate space
function nodeCenter(i) {
  return {
    x: CENTER_X + (i % 2 === 0 ? -1 : 1) * OFFSET,
    y: i * ROW_H + ROW_H / 2,
  };
}

// ══════════════════════════════════════════════════════════════
export default function AdventureMapScreen({ onSelectQuest, onBack }) {
  const { currentProfile, beep, showToast, claimChapterReward } = useGame();
  const [selectedNode, setSelectedNode] = useState(null);
  const [ceremonyClosed, setCeremonyClosed] = useState(false);
  const currentNodeRef = useRef(null);

  const adv = currentProfile?.adventureProgress || { completedNodes: [], starsByNode: {} };
  const completedNodes = adv.completedNodes || [];
  const completedKey = completedNodes.join(',');

  // Set for O(1) completion checks — recomputes when the actual list content changes
  const completedSet = useMemo(
    () => new Set(completedNodes),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completedKey]
  );
  const completedCount = completedSet.size;
  const progress = getAdventureProgress(completedNodes);

  // Cú's current position: first uncompleted node
  const currentIdx = useMemo(() => {
    for (let i = 0; i < ADVENTURE_NODES.length; i++) {
      if (!completedSet.has(ADVENTURE_NODES[i].id)) return i;
    }
    return ADVENTURE_NODES.length - 1;
  }, [completedSet]);

  // ── Chapter unlock ceremony ─────────────────────────────────
  // Show when lastNodeId is a chapter boss AND next chapter not yet started
  const chapterCeremony = useMemo(() => {
    if (ceremonyClosed) return null;
    const last = adv.lastNodeId;
    if (!last) return null;
    const bossToNext = { f10: 'sea', s10: 'sky' };
    const nextChapterId = bossToNext[last];
    if (!nextChapterId) return null;
    // Only show if next chapter hasn't been started yet
    const firstNextNode = ADVENTURE_NODES.find(n => n.chapter === nextChapterId);
    if (firstNextNode && completedSet.has(firstNextNode.id)) return null;
    return ADVENTURE_CHAPTERS.find(c => c.id === nextChapterId) || null;
  }, [adv.lastNodeId, ceremonyClosed, completedSet]);

  // Auto-scroll to current node on mount
  useEffect(() => {
    const t = setTimeout(() => {
      currentNodeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 350);
    return () => clearTimeout(t);
  }, []);

  if (!currentProfile) return null;

  // Total stars earned across all nodes
  const totalStars = ADVENTURE_NODES.reduce(
    (sum, n) => sum + getNodeStars(adv.starsByNode?.[n.id] || 0), 0
  );
  const maxStars = ADVENTURE_NODES.length * 3;
  const claimedChapters = adv.claimedChapters || [];
  const allDone = completedCount === ADVENTURE_NODES.length;
  const currentNode = ADVENTURE_NODES[currentIdx];

  const handleNodeClick = (node, unlocked) => {
    if (!unlocked) {
      beep('bad');
      showToast('Bé cần hoàn thành ô trước! 🔒', 'bad');
      return;
    }
    beep('pop');
    setSelectedNode(node);
  };

  const handleStartQuest = () => {
    if (!selectedNode || !onSelectQuest) return;
    beep('magic');
    onSelectQuest(selectedNode);
    setSelectedNode(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg,#a7f3d0 0%,#bae6fd 50%,#e9d5ff 100%)',
      paddingBottom: 40,
    }}>
      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)',
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '2px solid rgba(0,0,0,0.06)',
      }}>
        <button className="back-btn" onClick={onBack} style={{ margin: 0 }}>
          <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}/>
          Quay lại
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4c1d95', margin: 0 }}>
            🗺️ Bản Đồ Phiêu Lưu
          </h2>
          <div style={{ height: 5, background: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
            <div style={{
              height: '100%', width: `${progress * 100}%`,
              background: 'linear-gradient(90deg,#22c55e,#0ea5e9,#9d6bff)',
              borderRadius: 4, transition: 'width 0.6s',
            }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#4c1d95', whiteSpace: 'nowrap' }}>
            {completedCount}/{ADVENTURE_NODES.length} 🏆
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#e8a200', whiteSpace: 'nowrap' }}>
            {totalStars}/{maxStars} ⭐
          </div>
        </div>
      </div>

      {/* ── Next-quest hint banner ── */}
      {!allDone && currentNode && (
        <button
          onClick={() => { beep('pop'); setSelectedNode(currentNode); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: 'calc(100% - 28px)',
            margin: '14px 14px 0', padding: '10px 14px', borderRadius: 16,
            border: '2px solid rgba(157,107,255,0.25)', cursor: 'pointer',
            background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 14px rgba(157,107,255,0.18)', textAlign: 'left',
            animation: 'pulseDaily 2.4s ease-in-out infinite',
          }}
        >
          <span style={{ fontSize: '1.8rem' }}>{currentNode.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9d6bff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              👉 Quest tiếp theo
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#4c1d95' }}>
              {currentNode.title}
            </div>
          </div>
          <span style={{ fontSize: '1.3rem' }}>▶️</span>
        </button>
      )}

      {/* ── Chapters + Nodes ── */}
      <div style={{ padding: '20px 8px' }}>
        {ADVENTURE_CHAPTERS.map(chapter => {
          const chapterNodes = ADVENTURE_NODES.filter(n => n.chapter === chapter.id);
          const chapterDone = chapterNodes.every(n => completedSet.has(n.id));
          const chapterCompletedCount = chapterNodes.filter(n => completedSet.has(n.id)).length;
          const totalH = chapterNodes.length * ROW_H;
          const chStars = getChapterStars(chapter.id, adv.starsByNode || {});
          const chMaxStars = getChapterMaxStars(chapter.id);
          const isPerfect = chStars === chMaxStars;
          const rewardClaimed = claimedChapters.includes(chapter.id);
          const canClaim = chapterDone && chapter.reward && !rewardClaimed;

          return (
            <div key={chapter.id} style={{
              marginBottom: 24,
              background: chapter.bg,
              borderRadius: 20,
              padding: '16px 0 20px',
              border: chapterDone ? `3px solid ${chapter.color}` : '3px solid transparent',
              boxShadow: chapterDone ? `0 0 16px ${chapter.color}66` : '0 4px 14px rgba(0,0,0,0.06)',
              position: 'relative',
            }}>
              {/* Chapter title */}
              <div style={{
                textAlign: 'center', marginBottom: 4,
                fontSize: '1.05rem', fontWeight: 900, color: chapter.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <span style={{ fontSize: '1.5rem' }}>{chapter.emoji}</span>
                <span>Chương {chapter.idx}: {chapter.name}</span>
                {chapterDone && <span>✅</span>}
              </div>

              {/* Chapter progress dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 2 }}>
                {chapterNodes.map(n => (
                  <div key={n.id} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: completedSet.has(n.id) ? chapter.color : 'rgba(0,0,0,0.1)',
                    border: completedSet.has(n.id) ? 'none' : '1.5px solid rgba(0,0,0,0.1)',
                    transition: 'all 0.3s',
                    boxShadow: completedSet.has(n.id) ? `0 0 6px ${chapter.color}88` : 'none',
                  }} />
                ))}
              </div>
              <div style={{
                fontSize: '0.72rem', fontWeight: 800,
                color: chapter.color, textAlign: 'center', marginBottom: 12, opacity: 0.85,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap',
              }}>
                <span>{chapterCompletedCount}/{chapterNodes.length} quests</span>
                <span style={{ opacity: 0.4 }}>•</span>
                <span style={{ color: '#e8a200' }}>{chStars}/{chMaxStars} ⭐</span>
                {isPerfect && (
                  <span style={{
                    background: 'linear-gradient(135deg,#fde047,#f59e0b)', color: '#fff',
                    padding: '1px 8px', borderRadius: 8, fontWeight: 900, fontSize: '0.68rem',
                    boxShadow: '0 2px 6px rgba(245,158,11,0.4)',
                  }}>
                    👑 HOÀN HẢO
                  </span>
                )}
              </div>

              {/* ── Node map (absolute positioning + SVG connectors) ── */}
              <div style={{ width: MAP_W, height: totalH, margin: '0 auto', position: 'relative' }}>

                {/* SVG curved path connectors */}
                <svg
                  width={MAP_W}
                  height={totalH}
                  style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 0 }}
                >
                  {chapterNodes.slice(0, -1).map((node, i) => {
                    const from = nodeCenter(i);
                    const to = nodeCenter(i + 1);
                    const midY = (from.y + to.y) / 2;
                    const d = `M${from.x},${from.y} C${from.x},${midY} ${to.x},${midY} ${to.x},${to.y}`;
                    const done = completedSet.has(node.id);
                    return (
                      <path
                        key={node.id}
                        d={d}
                        fill="none"
                        stroke={done ? chapter.color : 'rgba(0,0,0,0.12)'}
                        strokeWidth={done ? 3.5 : 2.5}
                        strokeLinecap="round"
                        strokeDasharray={done ? '0' : '6 5'}
                        style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }}
                      />
                    );
                  })}
                </svg>

                {/* Node buttons */}
                {chapterNodes.map((node, i) => {
                  const unlocked = isNodeUnlocked(node, completedNodes);
                  const completed = completedSet.has(node.id);
                  const globalIdx = NODE_GLOBAL_IDX[node.id] ?? -1;
                  const isCurrent = globalIdx === currentIdx;
                  const isBoss = node.game === 'arcade_vs';
                  const size = isBoss ? BOSS_SIZE : NODE_SIZE;
                  const center = nodeCenter(i);
                  const stars = getNodeStars(adv.starsByNode?.[node.id] || 0);
                  const is3Star = stars === 3;

                  return (
                    <div
                      key={node.id}
                      ref={isCurrent ? currentNodeRef : null}
                      style={{
                        position: 'absolute',
                        top: i * ROW_H,
                        left: 0,
                        width: MAP_W,
                        height: ROW_H,
                      }}
                    >
                      {/* Node circle */}
                      <button
                        onClick={() => handleNodeClick(node, unlocked)}
                        style={{
                          position: 'absolute',
                          left: center.x - size / 2,
                          top: (ROW_H - size) / 2,
                          width: size,
                          height: size,
                          borderRadius: '50%',
                          border: 'none',
                          cursor: unlocked ? 'pointer' : 'not-allowed',
                          background: completed
                            ? `linear-gradient(135deg, ${chapter.color}, ${chapter.color}aa)`
                            : unlocked
                              ? '#fff'
                              : 'rgba(0,0,0,0.15)',
                          color: unlocked ? '#1e1b4b' : '#888',
                          fontSize: isBoss ? '2.1rem' : '1.7rem',
                          display: 'grid',
                          placeItems: 'center',
                          boxShadow: isCurrent
                            ? `0 0 0 4px ${chapter.color}, 0 6px 20px rgba(0,0,0,0.25)`
                            : completed
                              ? is3Star
                                ? `0 0 14px ${chapter.color}aa, 0 4px 12px rgba(0,0,0,0.15)`
                                : '0 4px 12px rgba(0,0,0,0.2)'
                              : unlocked
                                ? '0 4px 10px rgba(0,0,0,0.12)'
                                : 'none',
                          opacity: unlocked ? 1 : 0.55,
                          transition: 'all 0.25s',
                          zIndex: 2,
                          animation: isCurrent
                            ? 'pulseDaily 2s ease-in-out infinite'
                            : is3Star
                              ? 'advGoldenGlow 2.5s ease-in-out infinite'
                              : 'none',
                        }}
                      >
                        {!unlocked && (
                          <span style={{ position: 'absolute', fontSize: '0.8rem', top: -2, right: -2 }}>🔒</span>
                        )}
                        <span>{node.emoji}</span>
                      </button>

                      {/* Title under node */}
                      <div style={{
                        position: 'absolute',
                        left: center.x,
                        top: (ROW_H + size) / 2 + 3,
                        transform: 'translateX(-50%)',
                        fontSize: '0.67rem',
                        fontWeight: 800,
                        color: unlocked ? '#1e1b4b' : '#999',
                        whiteSpace: 'nowrap',
                        textShadow: '0 1px 2px rgba(255,255,255,0.7)',
                        zIndex: 2,
                      }}>
                        {node.title}
                      </div>

                      {/* Stars badge */}
                      {completed && stars > 0 && (
                        <div style={{
                          position: 'absolute',
                          left: center.x + size / 2 - 6,
                          top: (ROW_H - size) / 2 - 5,
                          fontSize: '0.65rem',
                          background: is3Star
                            ? 'linear-gradient(135deg,#fde047,#f59e0b)'
                            : '#fff',
                          padding: '2px 5px',
                          borderRadius: 8,
                          boxShadow: is3Star
                            ? '0 2px 8px rgba(245,158,11,0.4)'
                            : '0 2px 6px rgba(0,0,0,0.12)',
                          fontWeight: 900,
                          color: is3Star ? '#fff' : '#f59e0b',
                          zIndex: 3,
                          whiteSpace: 'nowrap',
                        }}>
                          {'⭐'.repeat(stars)}
                        </div>
                      )}

                      {/* Cú mascot on current node */}
                      {isCurrent && (
                        <div style={{
                          position: 'absolute',
                          left: center.x + size / 2 + 2,
                          top: (ROW_H - size) / 2 - 10,
                          zIndex: 4,
                          animation: 'bob 2s ease-in-out infinite',
                        }}>
                          <CuOwl expression="happy" size={36} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Chapter completion reward chest ── */}
              {chapter.reward && chapterDone && (
                <div style={{ padding: '4px 16px 0' }}>
                  <button
                    onClick={() => {
                      if (!canClaim) return;
                      beep('magic');
                      claimChapterReward(chapter.id, chapter.reward);
                    }}
                    disabled={!canClaim}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: 16,
                      padding: '12px 16px',
                      cursor: canClaim ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      fontWeight: 900, fontSize: '0.9rem',
                      color: '#fff',
                      background: canClaim
                        ? 'linear-gradient(135deg,#fde047,#f59e0b)'
                        : 'rgba(0,0,0,0.12)',
                      boxShadow: canClaim ? '0 4px 14px rgba(245,158,11,0.45)' : 'none',
                      transition: 'all 0.25s',
                      animation: canClaim ? 'pulseDaily 1.8s ease-in-out infinite' : 'none',
                    }}
                  >
                    {canClaim ? (
                      <>
                        <span style={{ fontSize: '1.4rem' }}>🎁</span>
                        <span>Nhận thưởng chương: +{chapter.reward.stars}⭐ +{chapter.reward.coins}🪙</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '1.2rem' }}>✅</span>
                        <span style={{ color: '#16a34a' }}>Đã nhận thưởng chương!</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Final completion banner */}
        {allDone && (
          <div style={{
            margin: '20px 16px',
            padding: '20px 16px',
            background: 'linear-gradient(135deg,#fde047,#f59e0b)',
            borderRadius: 20,
            textAlign: 'center',
            color: '#7c2d12',
            fontWeight: 900,
            boxShadow: '0 8px 24px rgba(245,158,11,0.45)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>👑🎉</div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 6 }}>HOÀN THÀNH PHIÊU LƯU!</h3>
            <p style={{ fontSize: '0.85rem' }}>Bé là Đại pháp sư tiếng Anh đích thực! 🌟</p>
          </div>
        )}
      </div>

      {/* ── Quest detail modal ── */}
      {selectedNode && (
        <QuestDetailModal
          node={selectedNode}
          starsAlready={getNodeStars(adv.starsByNode?.[selectedNode.id] || 0)}
          completed={completedSet.has(selectedNode.id)}
          onClose={() => setSelectedNode(null)}
          onStart={handleStartQuest}
        />
      )}

      {/* ── Chapter unlock ceremony ── */}
      {chapterCeremony && (
        <ChapterCeremonyModal
          chapter={chapterCeremony}
          onClose={() => setCeremonyClosed(true)}
        />
      )}

      {/* Extra keyframes for this screen */}
      <style>{`
        @keyframes advGoldenGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(245,158,11,0.25)); }
          50%       { filter: drop-shadow(0 0 14px rgba(245,158,11,0.55)); }
        }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Quest Detail Modal
// ══════════════════════════════════════════════════════════════
function QuestDetailModal({ node, completed, starsAlready, onClose, onStart }) {
  const topicLabel = TOPICS.find(t => t.id === node.topic);
  const gameLabel = GAME_LABEL[node.game] || node.game;
  const isBoss = node.game === 'arcade_vs';
  const rewards = QUEST_REWARDS[node.game] || { stars: 15, coins: 10 };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 190,
      background: 'rgba(10,8,30,0.75)', backdropFilter: 'blur(6px)',
      display: 'grid', placeItems: 'center', padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        maxWidth: 380, width: '100%',
        background: 'linear-gradient(160deg,#fff 0%,#fef3ff 100%)',
        borderRadius: 24, padding: '24px 20px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        textAlign: 'center', position: 'relative',
        animation: 'popIn 0.3s cubic-bezier(.2,.9,.3,1.4)',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%',
          border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', fontSize: '1rem', fontWeight: 900,
        }}>✕</button>

        {isBoss && (
          <div style={{
            background: 'linear-gradient(90deg,#ef4444,#f59e0b)', color: '#fff',
            display: 'inline-block', padding: '4px 12px', borderRadius: 12,
            fontSize: '0.78rem', fontWeight: 900, marginBottom: 10,
          }}>
            ⚔️ BOSS BATTLE
          </div>
        )}

        <div style={{ fontSize: '4rem', marginBottom: 8, lineHeight: 1 }}>{node.emoji}</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#4c1d95', marginBottom: 4 }}>
          {node.title}
        </h2>
        <div style={{ fontSize: '0.85rem', color: '#6b6391', fontWeight: 700, marginBottom: 12 }}>
          {gameLabel}{topicLabel ? ` • Chủ đề: ${topicLabel.e} ${topicLabel.name || node.topic}` : ''}
        </div>

        {/* Reward preview */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16,
          background: 'rgba(157,107,255,0.06)',
          padding: '10px 16px',
          borderRadius: 14,
          marginBottom: 14,
          border: '1.5px solid rgba(157,107,255,0.12)',
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#e8a200', display: 'flex', alignItems: 'center', gap: 4 }}>
            ⭐ <span>+{rewards.stars} Sao</span>
          </div>
          <div style={{ width: 1, background: 'rgba(0,0,0,0.08)' }} />
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ff9f43', display: 'flex', alignItems: 'center', gap: 4 }}>
            🪙 <span>+{rewards.coins} Xu</span>
          </div>
        </div>

        {completed && (
          <div style={{
            background: 'rgba(34,197,94,0.12)', border: '2px solid #22c55e',
            borderRadius: 14, padding: '10px 14px', marginBottom: 14,
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#16a34a', marginBottom: 2 }}>
              ✅ Đã hoàn thành!
            </div>
            <div style={{ fontSize: '1.2rem' }}>
              {'⭐'.repeat(starsAlready)}{'☆'.repeat(3 - starsAlready)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginTop: 4 }}>
              Chơi lại để đạt 3 sao!
            </div>
          </div>
        )}

        <button
          onClick={onStart}
          className="btn-big"
          style={{
            background: isBoss
              ? 'linear-gradient(135deg,#ef4444,#f59e0b)'
              : 'linear-gradient(135deg,#9d6bff,#ff7eb3)',
            color: '#fff',
            fontSize: '1.05rem',
          }}
        >
          {completed ? '🔄 Chơi lại' : isBoss ? '⚔️ Vào đánh boss!' : '🚀 Bắt đầu quest'}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Chapter Unlock Ceremony
// ══════════════════════════════════════════════════════════════
function ChapterCeremonyModal({ chapter, onClose }) {
  useEffect(() => {
    // Trigger confetti
    try { window.dispatchEvent(new Event('cu-confetti')); } catch {}
  }, []);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(10,8,30,0.92)', backdropFilter: 'blur(14px)',
      display: 'grid', placeItems: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        textAlign: 'center', maxWidth: 380, width: '100%',
        animation: 'popIn 0.5s cubic-bezier(.2,.9,.3,1.4)',
      }}>
        <div style={{
          fontSize: '5.5rem', marginBottom: 16, lineHeight: 1,
          filter: 'drop-shadow(0 0 24px rgba(255,255,255,0.25))',
          animation: 'bob 2s ease-in-out infinite',
        }}>
          {chapter.emoji}
        </div>
        <div style={{
          fontSize: '0.82rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          🎉 Vương quốc mới mở khóa!
        </div>
        <h1 style={{
          fontSize: '1.8rem', fontWeight: 900, color: chapter.color,
          marginBottom: 8, textShadow: `0 0 30px ${chapter.color}88`,
        }}>
          {chapter.name}
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.7)', fontWeight: 700,
          fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.5,
        }}>
          Bé đã chinh phục thử thách và bước vào vùng đất mới!<br />
          Những cuộc phiêu lưu thú vị đang chờ đón! ✨
        </p>
        <div style={{ marginBottom: 20 }}>
          <CuOwl expression="happy" size={70} />
        </div>
        <button onClick={onClose} className="btn-big" style={{
          background: `linear-gradient(135deg, ${chapter.color}, ${chapter.color}cc)`,
          color: '#fff',
          fontSize: '1.1rem',
          boxShadow: `0 6px 0 ${chapter.color}88, 0 6px 18px rgba(0,0,0,0.3)`,
        }}>
          🚀 Khám phá ngay!
        </button>
      </div>
    </div>
  );
}
