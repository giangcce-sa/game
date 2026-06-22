import { useEffect, useState, useCallback, useRef } from 'react';

// Reusable "juice" layer: confetti burst + flying score chips + combo pop.
// Usage:
//   const cel = useCelebration();
//   cel.fire({ stars: 25, coins: 10, combo: 3 });  // on correct answer
//   <CelebrationLayer controller={cel} />            // mount once near root
//
// Purely visual; it does not touch game state.

const CONFETTI_COLORS = ['#76d275', '#ffd23f', '#ff6b6b', '#9d6bff', '#5ec8f8', '#ff9ff3'];

let _id = 0;
const nextId = () => ++_id;

export function useCelebration() {
  const [bursts, setBursts] = useState([]);
  const timers = useRef([]);

  const remove = useCallback((id) => {
    setBursts(prev => prev.filter(b => b.id !== id));
  }, []);

  const fire = useCallback((opts = {}) => {
    const id = nextId();
    setBursts(prev => [...prev, { id, ...opts }]);
    const t = setTimeout(() => remove(id), 1600);
    timers.current.push(t);
  }, [remove]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  return { bursts, fire };
}

function ConfettiBurst() {
  // 18 pieces flung outward from center
  const pieces = Array.from({ length: 18 }, (_, i) => {
    const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5);
    const dist = 90 + Math.random() * 90;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 40; // bias upward
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const rot = (Math.random() * 720 - 360) | 0;
    const delay = Math.random() * 0.06;
    return (
      <span
        key={i}
        style={{
          position: 'absolute', left: 0, top: 0, width: 9, height: 14, borderRadius: 2,
          background: color,
          // CSS vars consumed by the keyframes
          ['--dx']: `${dx}px`, ['--dy']: `${dy}px`, ['--rot']: `${rot}deg`,
          animation: `celConfetti 1.1s cubic-bezier(.15,.7,.4,1) ${delay}s both`,
        }}
      />
    );
  });
  return <div style={{ position: 'absolute', left: '50%', top: '42%' }}>{pieces}</div>;
}

function CelebrationItem({ burst }) {
  const { stars, coins, combo, confetti = true } = burst;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {confetti && <ConfettiBurst />}

      {/* flying score chips */}
      <div style={{
        position: 'absolute', left: '50%', top: '46%', transform: 'translateX(-50%)',
        display: 'flex', gap: 14, animation: 'celFloatUp 1.4s ease-out both',
      }}>
        {stars > 0 && (
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffb300', textShadow: '0 2px 4px rgba(0,0,0,0.25)' }}>
            ⭐ +{stars}
          </span>
        )}
        {coins > 0 && (
          <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#e8a200', textShadow: '0 2px 4px rgba(0,0,0,0.25)' }}>
            🪙 +{coins}
          </span>
        )}
      </div>

      {/* combo pop */}
      {combo >= 3 && (
        <div style={{
          position: 'absolute', left: '50%', top: '30%', transform: 'translateX(-50%)',
          fontSize: '2.4rem', fontWeight: 900, color: '#ff5e36',
          textShadow: '0 3px 0 #b93d1a, 0 0 18px rgba(255,94,54,0.6)',
          animation: 'celComboPop 1.2s cubic-bezier(.2,1.4,.4,1) both', whiteSpace: 'nowrap',
        }}>
          🔥 Combo x{combo}!
        </div>
      )}
    </div>
  );
}

export function CelebrationLayer({ controller }) {
  if (!controller) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 300 }}>
      {controller.bursts.map(b => <CelebrationItem key={b.id} burst={b} />)}
      <style>{`
        @keyframes celConfetti {
          0%   { transform: translate(0,0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes celFloatUp {
          0%   { transform: translateX(-50%) translateY(10px) scale(0.6); opacity: 0; }
          25%  { transform: translateX(-50%) translateY(0) scale(1.15); opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: translateX(-50%) translateY(-70px) scale(1); opacity: 0; }
        }
        @keyframes celComboPop {
          0%   { transform: translateX(-50%) scale(0.2) rotate(-12deg); opacity: 0; }
          35%  { transform: translateX(-50%) scale(1.25) rotate(6deg); opacity: 1; }
          55%  { transform: translateX(-50%) scale(1) rotate(0deg); }
          80%  { opacity: 1; }
          100% { transform: translateX(-50%) scale(1.05) translateY(-30px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
