import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { ArrowLeft, Clock } from 'lucide-react';

export default function GameSentence({ onFinish, onBack, curriculumData }) {
  const { 
    addStarsAndCoins, 
    speak, 
    beep, 
    showToast,
    updateAnalytics
  } = useGame();

  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(3);
  const [correctCount, setCorrectCount] = useState(0);
  
  const [targetSentence, setTargetSentence] = useState('');
  const [vietnameseMeaning, setVietnameseMeaning] = useState('');
  const [scrambledWords, setScrambledWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  
  const [lockClick, setLockClick] = useState(false);
  const [dimmedIndices, setDimmedIndices] = useState([]);

  const totalRounds = curriculumData ? Math.min(curriculumData.length, 5) : 5;

  const startRound = (roundIdx) => {
    if (!curriculumData || !curriculumData[roundIdx]) return;
    
    const data = curriculumData[roundIdx];
    const sentence = data.sentence; // e.g. "What is your name?"
    
    // Auto translate meaning for visual aids
    const translateMap = {
      "Hello, I am Nam.": "Xin chào, mình là Nam.",
      "What is your name?": "Tên của bạn là gì thế?",
      "Is she your friend?": "Cô ấy có phải là bạn của bạn không?",
      "Touch your face.": "Bé hãy chạm vào khuôn mặt mình nào.",
      "Is this your pencil?": "Đây có phải là bút chì của bạn không?",
      "Let's go to the library.": "Chúng mình cùng đến thư viện nhé.",
      "May I come in?": "Em xin phép vào lớp ạ?",
      "What color is it?": "Đây là màu sắc gì thế?",
      "What are they doing?": "Họ đang làm gì vậy nhỉ?",
      "I am going to the beach.": "Mình chuẩn bị đi tắm biển đây.",
      "Who is that?": "Kia là ai thế?",
      "Where is the cat?": "Chú mèo con đang ở đâu vậy?",
      "What is he doing?": "Cậu ấy đang làm hành động gì thế?",
      "Where are my books?": "Những quyển sách của mình đâu rồi?",
      "Would you like some milk?": "Bé có muốn uống một chút sữa không?",
      "How many dogs do you have?": "Bạn nuôi bao nhiêu chú cún thế?",
      "Do you have a doll?": "Bạn có búp bê không?",
      "I am wearing a hat.": "Mình đang đội một chiếc mũ xinh.",
      "There is a park near my house.": "Có một công viên ở gần nhà mình.",
      "Where is the bakery?": "Tiệm bánh mì nằm ở đâu thế?",
      "I am from Vietnam.": "Mình đến từ Việt Nam.",
      "I get up at six o'clock.": "Mình thức dậy vào lúc 6 giờ đúng.",
      "I play soccer on Sundays.": "Mình chơi đá bóng vào các ngày Chủ Nhật.",
      "What is your address?": "Địa chỉ nhà bạn là gì thế?",
      "Where did you go on holiday?": "Kỳ nghỉ vừa rồi bạn đã đi chơi ở đâu?"
    };

    setTargetSentence(sentence);
    setVietnameseMeaning(data.sentenceVi || translateMap[sentence] || "Hãy dịch câu tiếng Anh này nhé!");
    
    // Split sentence into words
    const words = sentence.split(' ');
    // Scramble words
    const scrambled = words
      .map((word, idx) => ({ word, originalIdx: idx }))
      .sort(() => 0.5 - Math.random());
      
    setScrambledWords(scrambled);
    setSelectedWords([]);
    setDimmedIndices([]);
    setLockClick(false);
    
    speak(sentence);
  };

  useEffect(() => {
    startRound(0);
  }, [curriculumData]);

  const handleWordClick = (wordObj) => {
    if (lockClick || dimmedIndices.includes(wordObj.originalIdx)) return;
    
    const newSelected = [...selectedWords, wordObj.word];
    const newDimmed = [...dimmedIndices, wordObj.originalIdx];
    
    setSelectedWords(newSelected);
    setDimmedIndices(newDimmed);

    const targetWords = targetSentence.split(' ');
    
    // Check if correct so far
    const isCorrectSoFar = newSelected.every((w, i) => w === targetWords[i]);

    if (!isCorrectSoFar) {
      // Mistake! Trừ tim ngay lập tức
      beep('bad');
      setLives(prev => prev - 1);
      showToast("Xếp sai từ rồi bé ơi! 🥺 Bấm Xoá để sửa lại nhé.", "bad");
      
      // Auto backspace the mistake
      setSelectedWords(prev => prev.slice(0, -1));
      setDimmedIndices(prev => prev.slice(0, -1));
      return;
    }

    // Check if sentence completed successfully
    if (newSelected.length === targetWords.length) {
      setLockClick(true);
      beep('good');
      speak(targetSentence);
      showToast("Bé ghép câu xuất sắc! 🚂🎉", "good");
      addStarsAndCoins(15, 6, true); // 6 coins for sentence builder
      setCorrectCount(prev => prev + 1);

      setTimeout(() => {
        const nextRound = round + 1;
        const updatedLives = lives;

        if (nextRound >= totalRounds || updatedLives <= 0) {
          finishGame(updatedLives > 0, true);
        } else {
          setRound(nextRound);
          startRound(nextRound);
        }
      }, 1500);
    }
  };

  const handleBackspace = () => {
    if (lockClick || selectedWords.length === 0) return;
    setSelectedWords(prev => prev.slice(0, -1));
    setDimmedIndices(prev => prev.slice(0, -1));
  };

  const finishGame = (passed, lastWasCorrect = false) => {
    const finalCorrect = correctCount + (lastWasCorrect ? 1 : 0);
    
    onFinish({
      emoji: passed ? "🏆" : "💪",
      title: passed ? "Học Giả Xuất Sắc!" : "Cùng Thử Lại Bé Nhé!",
      msg: `Bé đã xếp đúng ${finalCorrect}/${totalRounds} câu giao tiếp!`,
      stars: finalCorrect * 15,
      coins: finalCorrect * 6
    });
  };

  return (
    <div>
      {/* Game Header */}
      <div className="game-head">
        <button className="back-btn" onClick={onBack}>← Về</button>
        <div className="progress-wrap">
          <div className="progress-bar" style={{ width: `${(round / totalRounds) * 100}%` }}></div>
        </div>
        <div className="lives">
          {"❤️".repeat(lives)}{"🤍".repeat(Math.max(0, 3 - lives))}
        </div>
      </div>

      {/* Main Play Card */}
      <div className="play-card" style={{ padding: '22px 16px' }}>
        <div className="q-label" style={{ marginBottom: '4px' }}>Bé hãy nhấp từ xếp thành câu tiếng Anh đúng:</div>
        
        {/* Vietnamese translation prompt */}
        <div style={{
          fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', background: 'var(--paper)',
          padding: '12px 16px', borderRadius: '18px', display: 'inline-block', border: '2px dashed var(--c-purple)',
          margin: '10px 0 20px', width: '100%'
        }}>
          💡 Nghĩa tiếng Việt: <br />
          <span style={{ color: 'var(--c-purple)', fontSize: '1.35rem' }}>{vietnameseMeaning}</span>
        </div>

        {/* Selected Words (Toa tàu) */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px',
          background: 'rgba(0,0,0,0.03)', padding: '16px 12px', borderRadius: '22px', minHeight: '66px',
          border: '3px solid rgba(0,0,0,0.04)', marginBottom: '22px'
        }}>
          {selectedWords.length === 0 ? (
            <span style={{ color: 'var(--ink-soft)', fontWeight: 600, fontSize: '0.92rem', display: 'grid', placeItems: 'center' }}>
              🚂 Chọn từ phía dưới để xếp toa tàu câu của bé...
            </span>
          ) : (
            selectedWords.map((w, idx) => (
              <span 
                key={idx}
                style={{
                  background: 'linear-gradient(135deg, var(--c-purple), var(--c-pink))',
                  color: '#fff', padding: '6px 14px', borderRadius: '12px', fontWeight: 800,
                  fontSize: '1.15rem', boxShadow: '0 3px 0 #7a4fd6', animation: 'popIn 0.25s'
                }}
              >
                {w}
              </span>
            ))
          )}
        </div>

        {/* Scrambled Word Buttons Pool */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '20px'
        }}>
          {scrambledWords.map(wordObj => {
            const isUsed = dimmedIndices.includes(wordObj.originalIdx);
            return (
              <button
                key={wordObj.originalIdx}
                onClick={() => handleWordClick(wordObj)}
                disabled={lockClick || isUsed}
                className="opt"
                style={{
                  width: 'auto', padding: '10px 18px', fontSize: '1.15rem',
                  opacity: isUsed ? 0.3 : 1, transform: isUsed ? 'scale(0.9)' : 'none',
                  background: '#fff', boxShadow: isUsed ? 'none' : '0 4px 0 rgba(0,0,0,0.1)'
                }}
              >
                {wordObj.word}
              </button>
            );
          })}
        </div>

        {/* Backspace to edit sentence */}
        <button
          className="btn-ghost"
          onClick={handleBackspace}
          disabled={lockClick || selectedWords.length === 0}
          style={{
            width: 'auto', padding: '8px 20px', background: 'var(--c-coral)', color: '#fff',
            fontSize: '0.88rem', borderRadius: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px'
          }}
        >
          ⬅ Xoá từ cuối cùng
        </button>

      </div>
    </div>
  );
}
