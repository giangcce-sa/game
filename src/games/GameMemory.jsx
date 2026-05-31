import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Clock } from 'lucide-react';

export default function GameMemory({ onFinish, onBack }) {
  const { 
    currentProfile, 
    selectedTopic, 
    addStarsAndCoins, 
    speak, 
    beep,
    memLevel,
    levelUpGame,
    getCombinedVocab
  } = useGame();
  
  const [cards, setCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [firstCard, setFirstCard] = useState(null);
  const [lockBoard, setLockBoard] = useState(false);
  const [pairsCount, setPairsCount] = useState(6);
  
  // High levels limits
  const [maxMoves, setMaxMoves] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const getVocabPool = () => {
    const combined = getCombinedVocab();
    if (!selectedTopic || selectedTopic === 'all') return combined;
    const filtered = combined.filter(v => v.t === selectedTopic);
    return filtered.length >= 8 ? filtered : combined;
  };

  useEffect(() => {
    // 1. Determine pairs count by Level
    let pairs = 6;
    if (memLevel === 1) pairs = 4;
    else if (memLevel >= 4) pairs = 8;
    setPairsCount(pairs);

    // 2. Set limits by Level
    if (memLevel === 3) setMaxMoves(18);
    else if (memLevel === 4) setMaxMoves(24);
    else if (memLevel === 5) {
      setMaxMoves(20);
      setTimeLeft(50); // 50 seconds count down
    }

    const pool = getVocabPool().sort(() => 0.5 - Math.random()).slice(0, pairs);
    
    // Create card deck containing both Emoji and Word cards for match
    const deck = [];
    pool.forEach(item => {
      deck.push({ id: item.w, type: 'emoji', v: item, isFlipped: false, isMatched: false, uniqueId: `e_${item.w}` });
      deck.push({ id: item.w, type: 'word', v: item, isFlipped: false, isMatched: false, uniqueId: `w_${item.w}` });
    });

    setCards(deck.sort(() => 0.5 - Math.random()));
  }, []);

  // Timer ticking for Level 5
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || matchedCount === pairsCount) return;
    const timer = setTimeout(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, matchedCount]);

  const handleTimeout = () => {
    beep('bad');
    onFinish({
      emoji: "⏱️",
      title: "Hết Giờ Mất Rồi! 😢",
      msg: `Bé đã không kịp hoàn thành lật thẻ trong 50 giây. Cố gắng lên nhé!`,
      stars: matchedCount * 8,
      coins: matchedCount * 3
    });
  };

  const handleCardClick = (clickedCard) => {
    if (lockBoard || clickedCard.isFlipped || clickedCard.isMatched) return;

    // Flip card
    speak(clickedCard.v.w);
    const updatedCards = cards.map(c => c.uniqueId === clickedCard.uniqueId ? { ...c, isFlipped: true } : c);
    setCards(updatedCards);

    if (!firstCard) {
      setFirstCard(clickedCard);
      return;
    }

    // Checking match
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    setLockBoard(true);

    // Check if player has run out of moves
    const isOutofMoves = maxMoves !== null && nextMoves >= maxMoves;

    const a = firstCard;
    setFirstCard(null);

    if (a.id === clickedCard.id && a.uniqueId !== clickedCard.uniqueId) {
      // It's a MATCH!
      beep('good');
      speak(clickedCard.v.w);
      
      setTimeout(() => {
        const matchedDeck = updatedCards.map(c => 
          c.id === clickedCard.id ? { ...c, isMatched: true } : c
        );
        setCards(matchedDeck);
        setMatchedCount(prev => {
          const nextVal = prev + 1;
          addStarsAndCoins(8, 3, true);
          
          if (nextVal === pairsCount) {
            // Check level up condition: pass within limits
            const greatScore = nextMoves <= pairsCount + 3;
            let leveledUp = false;
            if (greatScore && memLevel < 5) {
              levelUpGame('memLevel');
              leveledUp = true;
            }
            onFinish({
              emoji: greatScore ? "🏆" : "🎉",
              title: greatScore ? "Trí Nhớ Siêu Phàm!" : "Ghép Thành Công!",
              msg: `Bé đã lật thành công trong ${nextMoves} lượt. ${leveledUp ? 'Bé đã thăng cấp độ khó mới!' : ''}`,
              stars: pairsCount * 8,
              coins: pairsCount * 3
            });
          } else if (isOutofMoves) {
            // Out of moves despite matching this correct pair
            handleOutOfMoves(nextVal);
          }
          return nextVal;
        });
        setLockBoard(false);
      }, 400);
    } else {
      // It's a MISMATCH
      beep('bad');
      setTimeout(() => {
        const resetDeck = updatedCards.map(c => 
          c.uniqueId === clickedCard.uniqueId || c.uniqueId === a.uniqueId
            ? { ...c, isFlipped: false }
            : c
        );
        setCards(resetDeck);
        setLockBoard(false);
        addStarsAndCoins(0, 0, false); // reset streak

        if (isOutofMoves) {
          handleOutOfMoves(matchedCount);
        }
      }, 850);
    }
  };

  const handleOutOfMoves = (currentMatched) => {
    beep('bad');
    onFinish({
      emoji: "🃏",
      title: "Hết Lượt Lật Mất Rồi! 🥺",
      msg: `Bé đã lật hết tối đa ${maxMoves} lượt. Hãy thử lại để có kết quả tốt hơn nhé!`,
      stars: currentMatched * 8,
      coins: currentMatched * 3
    });
  };

  return (
    <div>
      {/* Game Header */}
      <div className="game-head">
        <button className="back-btn" onClick={onBack}>← Về</button>
        <div className="progress-wrap">
          <div className="progress-bar" style={{ width: `${(matchedCount / pairsCount) * 100}%` }}></div>
        </div>
        {timeLeft !== null && (
          <div className="stat" style={{ color: timeLeft <= 10 ? 'var(--c-coral)' : 'var(--ink)' }}>
            <Clock size={14} style={{ marginRight: '2px', display: 'inline', verticalAlign: 'middle' }} />
            <span>{timeLeft}s</span>
          </div>
        )}
        <div className="lives" style={{ minWidth: '82px' }}>
          <span>👆 {moves}{maxMoves !== null ? `/${maxMoves}` : ""} lượt</span>
        </div>
      </div>

      {/* Memory Deck Grid */}
      <div className="play-card" style={{ padding: '14px' }}>
        <div className="q-label" style={{ marginBottom: '8px' }}>
          Ghép Hình ảnh 🖼️ tương ứng với Từ tiếng Anh đúng 🔤
        </div>
        
        <div 
          className="memory-grid" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${cards.length >= 16 ? 4 : cards.length >= 12 ? 4 : 3}, 1fr)`,
            gap: '8px'
          }}
        >
          {cards.map(card => (
            <div 
              key={card.uniqueId}
              onClick={() => handleCardClick(card)}
              className={`mcard ${(card.isFlipped || card.isMatched) ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
              style={{
                aspectRatio: '1/1', borderRadius: '18px', position: 'relative', cursor: 'pointer',
                transformStyle: 'preserve-3d', transition: 'transform .35s',
                transform: (card.isFlipped || card.isMatched) ? 'rotateY(180deg)' : 'none'
              }}
            >
              {/* Back Face */}
              <div 
                className="mface mfront"
                style={{
                  position: 'absolute', inset: 0, borderRadius: '18px', display: 'grid', placeItems: 'center',
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  boxShadow: 'var(--shadow-sm)', background: 'linear-gradient(150deg,#9d6bff,#6a3fd6)',
                  color: '#fff', fontSize: '1.7rem', fontWeight: 800
                }}
              >
                ?
              </div>
              
              {/* Front Face */}
              <div 
                className="mface mback"
                style={{
                  position: 'absolute', inset: 0, borderRadius: '18px', display: 'grid', placeItems: 'center',
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  boxShadow: 'var(--shadow-sm)', background: card.isMatched ? '#e6fff4' : '#fff',
                  border: card.isMatched ? '3px solid var(--c-mint)' : 'none',
                  transform: 'rotateY(180deg)', padding: '2px', textAlign: 'center'
                }}
              >
                {card.type === 'emoji' ? (
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>{card.v.e}</span>
                ) : (
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--ink)', wordBreak: 'break-word' }}>
                    {card.v.w}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
