import React, { useState } from 'react';
import { useGame, TOPICS } from '../context/GameContext';
import { ArrowLeft, Clock, BarChart3, Plus, Trash2, Award, Eye, BookOpen } from 'lucide-react';

export default function ParentHub() {
  const { 
    setActiveScreen, 
    screenTimeLimit, 
    changeTimeLimit, 
    customVocab, 
    addCustomWord, 
    removeCustomWord, 
    learningAnalytics,
    profiles,
    selectedGrade,
    changeGradeSetting
  } = useGame();

  const [verified, setVerified] = useState(false);
  const [numA] = useState(Math.floor(6 + Math.random() * 4)); // 6-9
  const [numB] = useState(Math.floor(6 + Math.random() * 4)); // 6-9
  const [parentAnswer, setParentAnswer] = useState('');
  
  // Custom word form
  const [word, setWord] = useState('');
  const [emoji, setEmoji] = useState('🍎');
  const [meaning, setMeaning] = useState('');

  const emojis = ['🍎', '🍌', '🐱', '🐶', '🚗', '🏠', '⚽', '🎒', '☀️', '✏️', '👗', '🦷', '😊', '🧑‍⚕️', '⭕', '🦁', '🍇', '✈️'];

  const handleVerify = (e) => {
    e.preventDefault();
    if (parseInt(parentAnswer) === numA * numB) {
      setVerified(true);
    } else {
      alert("Phép tính chưa chính xác rồi! Phụ huynh hãy tính lại nhé. 🧩");
      setParentAnswer('');
    }
  };

  const handleAddWord = (e) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) {
      alert("Hãy nhập đầy đủ từ tiếng Anh và nghĩa tiếng Việt nhé!");
      return;
    }
    addCustomWord(word, emoji, meaning);
    setWord('');
    setMeaning('');
  };

  if (!verified) {
    return (
      <div className="profile-box" style={{ maxWidth: '420px', margin: '40px auto 0' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>🔐 Cổng Bảo Mật</h2>
        <p style={{ fontSize: '0.88rem', color: '#6b6391', marginBottom: '20px', fontWeight: 600 }}>
          Vui lòng giải phép tính dưới đây để xác nhận bạn là Phụ huynh:
        </p>
        <form onSubmit={handleVerify}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--c-purple)', margin: '14px 0' }}>
            {numA} x {numB} = ?
          </div>
          <input 
            type="number" 
            className="input-fancy" 
            value={parentAnswer}
            onChange={(e) => setParentAnswer(e.target.value)}
            placeholder="Nhập kết quả..." 
            autoFocus
          />
          <button type="submit" className="btn-big" style={{ marginTop: '14px' }}>Xác Nhận ✅</button>
          <button type="button" className="btn-ghost" onClick={() => setActiveScreen('home')}>Quay lại</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '30px' }}>
      {/* Header */}
      <div className="game-head">
        <button className="back-btn" onClick={() => setActiveScreen('home')}>
          <ArrowLeft size={16} style={{ marginRight: '4px', display: 'inline', verticalAlign: 'middle' }} />
          Trang chủ
        </button>
      </div>

      <div className="profile-box" style={{ textAlign: 'left', padding: '22px 18px', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, textAlign: 'center', marginBottom: '4px' }}>🦉 Góc Phụ Huynh</h2>
        <p style={{ fontSize: '0.85rem', color: '#6b6391', textAlign: 'center', fontWeight: 600, marginBottom: '20px' }}>
          Quản lý thời gian chơi, xem kết quả học tập và tùy chỉnh từ học cho con
        </p>

        {/* 0. CHOOSE CURRICULUM GRADE */}
        <div style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <BookOpen size={18} color="var(--c-purple)" /> Thiết Lập Lớp Học Ở Trường
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '12px' }}>
            Đặt lớp để game tự động tải lộ trình 20 Unit học kỳ chuẩn theo sách giáo khoa Global Success của con.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { id: 'grade1', label: 'Lớp 1 🏫' },
              { id: 'grade2', label: 'Lớp 2 🏫' },
              { id: 'grade3', label: 'Lớp 3 🏫' },
              { id: 'grade4', label: 'Lớp 4 🏫' },
              { id: 'grade5', label: 'Lớp 5 🏫' }
            ].map(g => (
              <button
                key={g.id}
                className={`chip ${selectedGrade === g.id ? 'on' : ''}`}
                onClick={() => changeGradeSetting(g.id)}
                style={{ flex: '1 1 120px', fontSize: '0.82rem', padding: '10px 4px', whiteSpace: 'nowrap' }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1. EYE PROTECTION TIMER SETTING */}
        <div style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Clock size={18} color="var(--c-purple)" /> Hẹn Giờ Bảo Vệ Mắt
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '12px' }}>
            Khóa màn hình khuyên bé nghỉ ngơi khi hết giờ học để tránh mỏi mắt.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { label: 'Tắt hẹn giờ', val: null },
              { label: '5 phút', val: 5 },
              { label: '10 phút', val: 10 },
              { label: '20 phút', val: 20 },
              { label: '30 phút', val: 30 }
            ].map(item => (
              <button 
                key={item.label}
                className={`chip ${screenTimeLimit === item.val ? 'on' : ''}`}
                onClick={() => changeTimeLimit(item.val)}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. CUSTOM VOCAB CREATOR */}
        <div style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Plus size={18} color="var(--c-purple)" /> Soạn Từ Vựng Riêng Cho Con
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '12px' }}>
            Nhập các từ tiếng Anh con đang học trên lớp để bé được ôn tập trực tiếp trong game!
          </p>
          
          <form onSubmit={handleAddWord} style={{ background: 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="input-fancy" 
                placeholder="Tiếng Anh (ví dụ: melon)"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                style={{ fontSize: '0.92rem', padding: '10px', height: '44px' }}
              />
              <input 
                type="text" 
                className="input-fancy" 
                placeholder="Nghĩa Việt (ví dụ: dưa lưới)"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                style={{ fontSize: '0.92rem', padding: '10px', height: '44px' }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Biểu tượng:</span>
              <div className="chips-scroll" style={{ flex: 1, padding: '4px 0' }}>
                {emojis.map(em => (
                  <button 
                    key={em}
                    type="button"
                    className={`chip ${emoji === em ? 'on' : ''}`}
                    onClick={() => setEmoji(em)}
                    style={{ padding: '6px 10px', fontSize: '1.2rem', minWidth: '38px' }}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-big" style={{ padding: '10px', fontSize: '0.98rem' }}>
              ➕ Thêm Vào Bài Học Của Bé
            </button>
          </form>

          {/* Custom words list */}
          {customVocab.length > 0 && (
            <div style={{ marginTop: '14px', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '14px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '6px' }}>Danh sách từ cha mẹ soạn ({customVocab.length}):</h4>
              {customVocab.map(w => (
                <div key={w.w} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {w.e} {w.w} : <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>{w.vi}</span>
                  </span>
                  <button onClick={() => removeCustomWord(w.w)} style={{ color: 'var(--c-coral)', background: 'transparent' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. LEARNING PROGRESS ANALYTICS */}
        <div style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <BarChart3 size={18} color="var(--c-purple)" /> Kết Quả Học Tập Của Con
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '12px' }}>
            Xem các chủ đề con học tốt và các chủ đề con cần ôn luyện thêm.
          </p>

          {Object.keys(learningAnalytics).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '18px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
              📊 Bé chưa chơi game nào. Dữ liệu học tập sẽ cập nhật khi bé làm bài!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.keys(learningAnalytics).map(topicId => {
                const stat = learningAnalytics[topicId];
                const topic = TOPICS.find(t => t.id === topicId) || { name: 'Chủ đề', e: '📚' };
                const total = stat.correct + stat.wrong;
                const rate = total > 0 ? Math.round((stat.correct / total) * 100) : 0;

                return (
                  <div key={topicId} style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 14px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
                      <span>{topic.e} {topic.name}</span>
                      <span style={{ color: rate >= 80 ? 'var(--c-grass)' : (rate >= 50 ? 'var(--c-orange)' : 'var(--c-coral)') }}>
                        Đúng {rate}% ({stat.correct}/{total})
                      </span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(0,0,0,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${rate}%`, background: rate >= 80 ? 'var(--c-grass)' : 'var(--c-orange)', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. LEADERBOARD */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Award size={18} color="var(--c-purple)" /> Bảng Thi Đua Gia Đình
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '12px' }}>
            Xếp hạng điểm số tích lũy giữa các bé trong nhà.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {profiles.sort((a,b) => b.stars - a.stars).map((p, idx) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.02)',
                padding: '10px 14px', borderRadius: '16px'
              }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: '24px', color: idx===0 ? '#ffa502' : 'var(--ink-soft)' }}>
                  #{idx + 1}
                </span>
                <span style={{ fontSize: '1.6rem' }}>{p.avatar}</span>
                <span style={{ fontWeight: 800, flex: 1, fontSize: '0.92rem' }}>{p.name}</span>
                <span style={{ fontWeight: 800, color: 'var(--c-purple)', fontSize: '0.92rem' }}>⭐ {p.stars} sao</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
