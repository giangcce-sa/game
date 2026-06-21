import React, { useEffect, useRef } from 'react';

/*
 * CuOwl — animated SVG owl character
 * expressions: 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy' | 'sleeping'
 * size: number (default 160)
 */

const CSS = `
@keyframes cu-blink {
  0%,90%,100% { transform: scaleY(1); }
  95%         { transform: scaleY(0.05); }
}
@keyframes cu-bob {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-6px); }
}
@keyframes cu-bob-small {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-3px); }
}
@keyframes cu-wing-flap {
  0%,100% { transform: rotate(0deg); }
  25%     { transform: rotate(-20deg); }
  75%     { transform: rotate(10deg); }
}
@keyframes cu-wing-up {
  0%,100% { transform: rotate(-30deg); }
  50%     { transform: rotate(-40deg); }
}
@keyframes cu-sparkle {
  0%   { opacity:0; transform: scale(0) rotate(0deg);   }
  40%  { opacity:1; transform: scale(1) rotate(90deg);  }
  100% { opacity:0; transform: scale(0) rotate(180deg); }
}
@keyframes cu-zzz {
  0%   { opacity:0; transform: translate(0,0)   scale(0.5); }
  30%  { opacity:1; }
  100% { opacity:0; transform: translate(14px,-22px) scale(1); }
}
@keyframes cu-thought {
  0%,100% { opacity:.6; transform: scale(1); }
  50%     { opacity:1;  transform: scale(1.1); }
}
@keyframes cu-speak-wave {
  0%,100% { transform: scaleX(1); }
  50%     { transform: scaleX(1.3); }
}
.cu-blink     { animation: cu-blink 4s ease-in-out infinite; transform-origin: center; }
.cu-blink-l   { animation: cu-blink 4s ease-in-out infinite; transform-origin: 38px 42px; }
.cu-blink-r   { animation: cu-blink 4s ease-in-out infinite 0.05s; transform-origin: 62px 42px; }
.cu-bob       { animation: cu-bob 2.8s ease-in-out infinite; }
.cu-bob-small { animation: cu-bob-small 2s ease-in-out infinite; }
.cu-wing-flap-l { animation: cu-wing-flap 0.7s ease-in-out infinite; transform-origin: 28px 72px; }
.cu-wing-flap-r { animation: cu-wing-flap 0.7s ease-in-out infinite 0.15s; transform-origin: 72px 72px; }
.cu-wing-up-l   { animation: cu-wing-up 1.2s ease-in-out infinite; transform-origin: 28px 72px; }
.cu-wing-up-r   { animation: cu-wing-up 1.2s ease-in-out infinite 0.1s; transform-origin: 72px 72px; }
.cu-sparkle   { animation: cu-sparkle 1.4s ease-in-out infinite; }
.cu-sparkle-2 { animation: cu-sparkle 1.4s ease-in-out infinite 0.35s; }
.cu-sparkle-3 { animation: cu-sparkle 1.4s ease-in-out infinite 0.7s; }
.cu-zzz-1     { animation: cu-zzz 2s ease-out infinite; }
.cu-zzz-2     { animation: cu-zzz 2s ease-out infinite 0.7s; }
.cu-zzz-3     { animation: cu-zzz 2s ease-out infinite 1.4s; }
.cu-thought   { animation: cu-thought 2s ease-in-out infinite; }
.cu-speak-wave{ animation: cu-speak-wave 0.4s ease-in-out infinite; transform-origin: 50px 60px; }
`;

let cssInjected = false;
function injectCss() {
  if (cssInjected) return;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
  cssInjected = true;
}

export default function CuOwl({ expression = 'idle', size = 160 }) {
  useEffect(() => { injectCss(); }, []);

  const isIdle      = expression === 'idle';
  const isListening = expression === 'listening';
  const isThinking  = expression === 'thinking';
  const isSpeaking  = expression === 'speaking';
  const isHappy     = expression === 'happy';
  const isSleeping  = expression === 'sleeping';
  const isFlying    = expression === 'flying';

  // Eye vertical scale
  const eyeScaleY = isSleeping ? 0.08 : isThinking ? 0.55 : isHappy ? 1.15 : isFlying ? 1.1 : 1;
  // Pupil position
  const pupilDX = isListening ? -1.5 : isFlying ? 1.5 : 0;
  const pupilDY = isThinking ? -3 : isSpeaking ? 1 : isFlying ? -1 : 0;
  // Ear size
  const earScale = isListening ? 1.25 : isSleeping ? 0.85 : 1;
  // Wing class — flying also flaps wings
  const wingClass = (isSpeaking || isFlying) ? 'cu-wing-flap' : isHappy ? 'cu-wing-up' : '';

  // No bob when flying — parent container handles motion
  const containerClass = isFlying ? '' : isSleeping ? 'cu-bob-small' : isHappy ? 'cu-bob' : isIdle ? 'cu-bob-small' : '';

  return (
    <svg
      viewBox="0 0 100 128"
      width={size}
      height={size * 1.28}
      xmlns="http://www.w3.org/2000/svg"
      className={containerClass}
      style={{ display: 'block', overflow: 'visible', filter: isHappy ? 'drop-shadow(0 0 12px rgba(253,224,71,0.7))' : 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}
    >
      <defs>
        <radialGradient id="cu-body-grad" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="#9d6bff"/>
          <stop offset="100%" stopColor="#4c1d95"/>
        </radialGradient>
        <radialGradient id="cu-face-grad" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#f5f3ff"/>
          <stop offset="100%" stopColor="#ddd6fe"/>
        </radialGradient>
        <radialGradient id="cu-belly-grad" cx="50%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#e9d5ff"/>
          <stop offset="100%" stopColor="#c4b5fd"/>
        </radialGradient>
        <radialGradient id="cu-wing-grad" cx="50%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#7c3aed"/>
          <stop offset="100%" stopColor="#3b0764"/>
        </radialGradient>
      </defs>

      {/* ── Ears ─────────────────────────────────────────── */}
      <g transform={`translate(50,30) scale(${earScale}) translate(-50,-30)`}>
        {/* Left ear */}
        <polygon points="24,33 16,6 38,24" fill="#5b21b6" stroke="#3b0764" strokeWidth="0.5"/>
        <polygon points="26,31 20,12 34,24" fill="#7c3aed" opacity="0.6"/>
        {/* Right ear */}
        <polygon points="76,33 62,24 84,6" fill="#5b21b6" stroke="#3b0764" strokeWidth="0.5"/>
        <polygon points="74,31 66,24 80,12" fill="#7c3aed" opacity="0.6"/>
      </g>

      {/* ── Body ─────────────────────────────────────────── */}
      <ellipse cx="50" cy="88" rx="30" ry="28" fill="url(#cu-body-grad)"/>
      {/* Belly */}
      <ellipse cx="50" cy="92" rx="17" ry="16" fill="url(#cu-belly-grad)"/>
      {/* Belly pattern lines */}
      <line x1="44" y1="84" x2="44" y2="100" stroke="#c4b5fd" strokeWidth="0.8" opacity="0.5"/>
      <line x1="50" y1="82" x2="50" y2="102" stroke="#c4b5fd" strokeWidth="0.8" opacity="0.5"/>
      <line x1="56" y1="84" x2="56" y2="100" stroke="#c4b5fd" strokeWidth="0.8" opacity="0.5"/>

      {/* ── Wings ────────────────────────────────────────── */}
      <ellipse cx="20" cy="84" rx="13" ry="20" fill="url(#cu-wing-grad)"
        className={wingClass ? `${wingClass}-l` : ''}
        transform={isHappy ? 'rotate(-25, 20, 84)' : 'rotate(10, 20, 84)'}
      />
      <ellipse cx="80" cy="84" rx="13" ry="20" fill="url(#cu-wing-grad)"
        className={wingClass ? `${wingClass}-r` : ''}
        transform={isHappy ? 'rotate(25, 80, 84)' : 'rotate(-10, 80, 84)'}
      />

      {/* ── Feet ─────────────────────────────────────────── */}
      <g opacity="0.9">
        <ellipse cx="38" cy="116" rx="9" ry="4" fill="#f59e0b"/>
        <line x1="32" y1="118" x2="30" y2="122" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="37" y1="119" x2="36" y2="123" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="42" y1="119" x2="43" y2="123" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
        <ellipse cx="62" cy="116" rx="9" ry="4" fill="#f59e0b"/>
        <line x1="56" y1="118" x2="55" y2="122" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="61" y1="119" x2="60" y2="123" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="66" y1="118" x2="68" y2="122" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
      </g>

      {/* ── Head ─────────────────────────────────────────── */}
      <circle cx="50" cy="44" r="29" fill="url(#cu-body-grad)"/>
      {/* Head highlight */}
      <ellipse cx="40" cy="32" rx="10" ry="7" fill="rgba(255,255,255,0.12)"/>

      {/* Face */}
      <ellipse cx="50" cy="47" rx="21" ry="19" fill="url(#cu-face-grad)"/>

      {/* ── Eyes ─────────────────────────────────────────── */}
      {/* Left eye */}
      <g className={!isSleeping ? 'cu-blink-l' : ''}>
        <ellipse cx="38" cy="42" rx="9.5"
          ry={9.5 * eyeScaleY}
          fill={isSleeping ? '#ddd6fe' : 'white'}
          stroke="#e9d5ff" strokeWidth="0.5"
        />
        {!isSleeping && (
          <>
            <circle cx={38 + pupilDX} cy={42 + pupilDY} r={isThinking ? 3.5 : 5} fill="#1e1b4b"/>
            <circle cx={40 + pupilDX} cy={40 + pupilDY} r={1.5} fill="white"/>
            {isHappy && <circle cx={35 + pupilDX} cy={44 + pupilDY} r={1} fill="white" opacity="0.7"/>}
          </>
        )}
        {isSleeping && (
          <path d="M 30,42 Q 38,39 46,42" stroke="#9d6bff" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        )}
      </g>

      {/* Right eye */}
      <g className={!isSleeping ? 'cu-blink-r' : ''}>
        <ellipse cx="62" cy="42" rx="9.5"
          ry={9.5 * eyeScaleY}
          fill={isSleeping ? '#ddd6fe' : 'white'}
          stroke="#e9d5ff" strokeWidth="0.5"
        />
        {!isSleeping && (
          <>
            <circle cx={62 + pupilDX} cy={42 + pupilDY} r={isThinking ? 3.5 : 5} fill="#1e1b4b"/>
            <circle cx={64 + pupilDX} cy={40 + pupilDY} r={1.5} fill="white"/>
            {isHappy && <circle cx={59 + pupilDX} cy={44 + pupilDY} r={1} fill="white" opacity="0.7"/>}
          </>
        )}
        {isSleeping && (
          <path d="M 54,42 Q 62,39 70,42" stroke="#9d6bff" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        )}
      </g>

      {/* ── Beak ─────────────────────────────────────────── */}
      {isSpeaking ? (
        // Open beak (split into upper + lower)
        <>
          <path d="M 44,54 L 50,50 L 56,54 Z" fill="#d97706" className="cu-speak-wave"/>
          <path d="M 44,57 L 50,62 L 56,57 Z" fill="#f59e0b" className="cu-speak-wave"/>
        </>
      ) : (
        <polygon
          points={isHappy ? "44,54 50,51 56,54 50,60" : "45,54 50,51 55,54 50,59"}
          fill="#f59e0b"
          stroke="#d97706"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      )}

      {/* ── Expression overlays ──────────────────────────── */}

      {/* THINKING: thought bubbles */}
      {isThinking && (
        <g className="cu-thought">
          <circle cx="72" cy="22" r="4" fill="white" stroke="#c4b5fd" strokeWidth="1"/>
          <circle cx="80" cy="14" r="5.5" fill="white" stroke="#c4b5fd" strokeWidth="1"/>
          <circle cx="88" cy="7"  r="4" fill="white" stroke="#c4b5fd" strokeWidth="1"/>
          <text x="76" y="17" textAnchor="middle" fontSize="5" fill="#7c3aed" fontWeight="bold">?</text>
        </g>
      )}

      {/* LISTENING: sound waves near ear */}
      {isListening && (
        <g opacity="0.8">
          <path d="M 7,28 Q 3,22 7,16" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
          <path d="M 4,30 Q -2,22 4,14" stroke="#9d6bff" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.35"/>
          {/* Listening ear highlight */}
          <ellipse cx="22" cy="18" rx="4" ry="6" fill="rgba(253,224,71,0.35)" transform="rotate(-20,22,18)"/>
        </g>
      )}

      {/* HAPPY: sparkles */}
      {isHappy && (
        <g>
          <text x="8"  y="20" fontSize="10" className="cu-sparkle">✨</text>
          <text x="82" y="18" fontSize="9"  className="cu-sparkle-2">⭐</text>
          <text x="15" y="80" fontSize="8"  className="cu-sparkle-3">✨</text>
          <path d="M 85,30 L 87,25 L 89,30 L 94,32 L 89,34 L 87,39 L 85,34 L 80,32 Z" fill="#fde047" className="cu-sparkle-2"/>
        </g>
      )}

      {/* SLEEPING: zzz */}
      {isSleeping && (
        <g fontSize="9" fontWeight="900" fill="#9d6bff" fontFamily="Arial">
          <text x="68" y="30" className="cu-zzz-1" opacity="0">z</text>
          <text x="74" y="22" className="cu-zzz-2" opacity="0" fontSize="11">z</text>
          <text x="81" y="12" className="cu-zzz-3" opacity="0" fontSize="13">Z</text>
        </g>
      )}

      {/* SPEAKING: sound waves from beak */}
      {isSpeaking && (
        <g opacity="0.6">
          <path d="M 58,58 Q 64,55 62,50" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" className="cu-speak-wave"/>
          <path d="M 60,60 Q 70,57 67,49" stroke="#9d6bff" strokeWidth="1.5" fill="none" strokeLinecap="round" className="cu-speak-wave"/>
        </g>
      )}
    </svg>
  );
}
