import React, { useState, useEffect } from 'react';
import { useGame, TOPICS, VOCAB } from '../context/GameContext';
import { VIETNAM_CURRICULUM } from '../context/VietnamCurriculum';
import { ArrowLeft, Clock, BarChart3, Plus, Trash2, Award, Eye, BookOpen, Edit, FileCode, Check, Download, Upload, Mic } from 'lucide-react';
import { getPhonicsHeatmap } from '../lib/phonics';
import {
  isNotificationSupported,
  getNotificationPermission,
  isReminderEnabled,
  setReminderEnabled,
  requestNotificationPermission,
} from '../lib/notifications';

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
    changeGradeSetting,

    // Voice settings
    enVoice,
    setEnVoice,
    allEnVoices,
    speak,

    // Custom stories
    customStories = [],
    addCustomStory,
    deleteCustomStory,
    currentProfile,
    setDailyGoal,
    setThemeColor,
    nextFocusTopic,
  } = useGame();

  const [verified, setVerified] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(isReminderEnabled());
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission());

  const handleToggleNotif = async () => {
    if (notifEnabled) {
      setReminderEnabled(false);
      setNotifEnabled(false);
      return;
    }
    // Need to ensure permission first
    let perm = notifPerm;
    if (perm !== 'granted') {
      perm = await requestNotificationPermission();
      setNotifPerm(perm);
    }
    if (perm === 'granted') {
      setReminderEnabled(true);
      setNotifEnabled(true);
    } else {
      alert('Trình duyệt từ chối quyền thông báo. Hãy bật trong Cài đặt trình duyệt → Quyền → Thông báo.');
    }
  };

  const [numA, setNumA] = useState(0);
  const [numB, setNumB] = useState(0);
  const [parentAnswer, setParentAnswer] = useState('');

  // Find any profile-level PIN set by parents
  const savedPin = (profiles || []).map(p => p?.pinCode).find(p => typeof p === 'string' && p.length >= 4) || null;

  const generateMathQuestion = () => {
    // Harder gate when no PIN: 2-digit × 1-digit (e.g. 47 × 8)
    setNumA(Math.floor(20 + Math.random() * 70)); // 20-89
    setNumB(Math.floor(6 + Math.random() * 4));   // 6-9
  };

  useEffect(() => {
    if (!savedPin) generateMathQuestion();
  }, [savedPin]);
  
  // Custom word form
  const [word, setWord] = useState('');
  const [emoji, setEmoji] = useState('🍎');
  const [meaning, setMeaning] = useState('');

  const emojis = ['🍎', '🍌', '🐱', '🐶', '🚗', '🏠', '⚽', '🎒', '☀️', '✏️', '👗', '🦷', '😊', '🧑‍⚕️', '⭕', '🦁', '🍇', '✈️'];

  // --- GÓC TỰ TẠO TRUYỆN STATES & LOGIC ---
  const [activeStoryTab, setActiveStoryTab] = useState('create'); // 'create' | 'list'
  const [sTitle, setSTitle] = useState('');
  const [sEmoji, setSEmoji] = useState('📖');
  const [sCategory, setSCategory] = useState('Ngụ Ngôn 🎭');
  const [sGrade, setSGrade] = useState('Lớp 1 - 2 🐥');
  const [sDesc, setSDesc] = useState('');
  const [sPages, setSPages] = useState([{ text: '', vi: '', img: '📖' }]);
  const [sQuizzes, setSQuizzes] = useState([{ q: '', opts: ['', '', ''], ans: '' }]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [editingWords, setEditingWords] = useState({});
  const [jsonPasteVal, setJsonPasteVal] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [showStoryCreator, setShowStoryCreator] = useState(false);

  const handleStartCompile = () => {
    if (!sTitle.trim()) {
      alert("Vui lòng nhập Tiêu đề truyện!");
      return;
    }
    if (sPages.some(p => !p.text.trim() || !p.vi.trim())) {
      alert("Vui lòng điền đầy đủ câu tiếng Anh và bản dịch tiếng Việt cho tất cả các trang!");
      return;
    }
    if (sQuizzes.some(q => !q.q.trim() || q.opts.some(o => !o.trim()) || !q.ans.trim())) {
      alert("Vui lòng điền đầy đủ câu hỏi và chọn đáp án đúng cho phần Đố Vui!");
      return;
    }

    // Extract unique English words
    const uniqueWords = new Set();
    sPages.forEach(page => {
      const words = page.text.split(/\s+/);
      words.forEach(w => {
        const clean = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
        if (clean && isNaN(clean)) {
          uniqueWords.add(clean);
        }
      });
    });

    // Translate unique words using curriculum and vocabulary databases
    const wordMap = {};
    uniqueWords.forEach(w => {
      let foundVi = '';
      const vMatch = VOCAB.find(item => item.w === w);
      if (vMatch) {
        foundVi = vMatch.vi;
      } else {
        for (const grade in VIETNAM_CURRICULUM) {
          for (const unit of VIETNAM_CURRICULUM[grade]) {
            const uMatch = unit.words.find(item => item.w === w);
            if (uMatch) {
              foundVi = uMatch.vi;
              break;
            }
          }
          if (foundVi) break;
        }
      }

      if (!foundVi) {
        const fallbacks = {
          "the": "từ chỉ định", "a": "một", "an": "một", "is": "thì, là", "are": "thì, là", "am": "thì, là",
          "was": "thì, là (quá khứ)", "were": "thì, là (quá khứ)", "has": "có", "have": "có", "had": "có (quá khứ)",
          "and": "và", "but": "nhưng", "or": "hoặc", "in": "ở trong", "on": "ở trên", "at": "tại", "under": "ở dưới",
          "with": "với, bằng", "for": "cho, để", "to": "đến, để", "from": "từ", "of": "của", "this": "cái này",
          "that": "cái kia", "these": "những cái này", "those": "những cái kia", "he": "anh ấy, nó", "she": "cô ấy, nó",
          "it": "nó", "they": "họ, chúng nó", "we": "chúng ta", "you": "bạn", "i": "tôi", "my": "của tôi",
          "his": "của anh ấy", "her": "của cô ấy", "its": "của nó", "their": "của họ", "our": "của chúng ta",
          "your": "của bạn"
        };
        foundVi = fallbacks[w] || "";
      }

      wordMap[w] = foundVi;
    });

    setEditingWords(wordMap);
    setIsCompiling(true);
  };

  const handleSaveStory = () => {
    const emptyWords = Object.keys(editingWords).filter(w => !editingWords[w].trim());
    if (emptyWords.length > 0) {
      alert(`Vui lòng điền nghĩa tiếng Việt cho từ: "${emptyWords.join(', ')}" để bé chạm vào học được!`);
      return;
    }

    const compiledPages = sPages.map(page => {
      const pageWords = page.text.split(/\s+/);
      const pageWordsVi = {};
      pageWords.forEach(w => {
        const clean = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
        if (clean && editingWords[clean]) {
          pageWordsVi[clean] = editingWords[clean].trim();
        }
      });
      return {
        ...page,
        wordsVi: pageWordsVi
      };
    });

    const newStory = {
      id: `story_custom_${Date.now()}`,
      title: sTitle.trim(),
      e: sEmoji.trim(),
      category: sCategory,
      gradeLevel: sGrade,
      desc: sDesc.trim() || `Truyện tự tạo sinh động về chủ đề ${sCategory}.`,
      pages: compiledPages,
      quiz: sQuizzes
    };

    addCustomStory(newStory);

    setSTitle('');
    setSEmoji('📖');
    setSDesc('');
    setSPages([{ text: '', vi: '', img: '📖' }]);
    setSQuizzes([{ q: '', opts: ['', '', ''], ans: '' }]);
    setIsCompiling(false);
    setActiveStoryTab('list');
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonPasteVal.trim());
      if (!parsed.title || !Array.isArray(parsed.pages) || !Array.isArray(parsed.quiz)) {
        alert("Cấu trúc truyện JSON chưa chuẩn! Vui lòng kiểm tra lại định dạng.");
        return;
      }
      const importedStory = {
        ...parsed,
        id: `story_custom_${Date.now()}`
      };
      addCustomStory(importedStory);
      setJsonPasteVal('');
      setShowJsonImport(false);
      setActiveStoryTab('list');
    } catch(err) {
      alert("Lỗi nhập dữ liệu JSON. Vui lòng đảm bảo dán đúng mã nguồn truyện!");
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (savedPin) {
      if (parentAnswer === savedPin) {
        setVerified(true);
      } else {
        alert("Sai PIN. Vui lòng thử lại! 🔐");
        setParentAnswer('');
      }
    } else {
      if (parseInt(parentAnswer) === numA * numB) {
        setVerified(true);
      } else {
        alert("Phép tính chưa chính xác rồi! Phụ huynh hãy tính lại nhé. 🧩");
        setParentAnswer('');
        generateMathQuestion();
      }
    }
  };

  const handleBackup = () => {
    try {
      const data = localStorage.getItem("vhta_profiles_v2");
      if (!data) {
        alert("Chưa có dữ liệu nào để sao lưu!");
        return;
      }
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vương-quốc-tiếng-anh-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Có lỗi xảy ra khi sao lưu dữ liệu!");
    }
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].id) {
          alert("File sao lưu không hợp lệ! Vui lòng chọn đúng file backup của trò chơi.");
          return;
        }
        if (window.confirm("Bạn có chắc chắn muốn khôi phục dữ liệu? Tiến trình hiện tại trên máy này sẽ bị ghi đè hoàn toàn!")) {
          localStorage.setItem("vhta_profiles_v2", JSON.stringify(parsed));
          alert("Khôi phục dữ liệu thành công! Ứng dụng sẽ tự động tải lại.");
          window.location.reload();
        }
      } catch (err) {
        alert("Lỗi đọc file sao lưu. Vui lòng kiểm tra lại file của bạn!");
      }
    };
    reader.readAsText(file);
  };

  const handleAddWord = (e) => {
    e.preventDefault();
    const cleanWord = word.trim();
    const cleanMeaning = meaning.trim();

    if (!cleanWord || !cleanMeaning) {
      alert("Hãy nhập đầy đủ từ tiếng Anh và nghĩa tiếng Việt nhé!");
      return;
    }

    if (cleanWord.length > 15) {
      alert("Từ tiếng Anh quá dài! Vui lòng nhập từ ngắn hơn 15 ký tự để hiển thị tốt nhất trong game.");
      return;
    }

    if (!/^[A-Za-z\s\-]+$/.test(cleanWord)) {
      alert("Từ tiếng Anh chỉ được chứa chữ cái, dấu cách hoặc dấu gạch nối (-). Vui lòng không nhập số hoặc biểu tượng đặc biệt!");
      return;
    }

    if (cleanMeaning.length > 24) {
      alert("Nghĩa tiếng Việt quá dài! Vui lòng rút gọn tối đa 24 ký tự.");
      return;
    }

    addCustomWord(cleanWord, emoji, cleanMeaning);
    setWord('');
    setMeaning('');
  };

  if (!verified) {
    return (
      <div className="profile-box" style={{ maxWidth: '420px', margin: '40px auto 0' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '10px' }}>🔐 Cổng Bảo Mật</h2>
        <p style={{ fontSize: '0.88rem', color: '#6b6391', marginBottom: '20px', fontWeight: 600 }}>
          {savedPin
            ? 'Nhập mã PIN 4 chữ số của phụ huynh:'
            : 'Vui lòng giải phép tính dưới đây để xác nhận bạn là Phụ huynh:'}
        </p>
        <form onSubmit={handleVerify}>
          {!savedPin && (
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--c-purple)', margin: '14px 0' }}>
              {numA} × {numB} = ?
            </div>
          )}
          <input
            type={savedPin ? 'password' : 'number'}
            inputMode={savedPin ? 'numeric' : 'numeric'}
            maxLength={savedPin ? 8 : 6}
            className="input-fancy"
            value={parentAnswer}
            onChange={(e) => setParentAnswer(e.target.value)}
            placeholder={savedPin ? 'Mã PIN...' : 'Nhập kết quả...'}
            autoFocus
            style={{ textAlign: 'center', fontSize: savedPin ? '1.6rem' : '1.1rem', letterSpacing: savedPin ? '0.6em' : '0' }}
          />
          <button type="submit" className="btn-big" style={{ marginTop: '14px' }}>Xác Nhận ✅</button>
          <button type="button" className="btn-ghost" onClick={() => setActiveScreen('home')}>Quay lại</button>
          {!savedPin && (
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 12, fontWeight: 600 }}>
              💡 Đặt PIN trong Hồ sơ Bé để bảo vệ tốt hơn
            </p>
          )}
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

        {/* 0.25. DAILY REMINDER NOTIFICATIONS */}
        <div style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            🔔 Nhắc Nhở Học Hằng Ngày
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '12px' }}>
            Cú sẽ nhắc bé học mỗi tối khi bé chưa luyện tập — giúp giữ streak và tạo thói quen.
          </p>
          {!isNotificationSupported() ? (
            <div style={{ fontSize: '0.82rem', color: '#9ca3af', fontWeight: 700 }}>
              ⚠️ Trình duyệt không hỗ trợ thông báo. Dùng Chrome/Edge/Safari trên desktop hoặc cài app như PWA trên điện thoại.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={handleToggleNotif}
                style={{
                  padding: '10px 18px', borderRadius: 12, border: 'none',
                  background: notifEnabled ? 'var(--c-grass)' : 'rgba(0,0,0,0.08)',
                  color: notifEnabled ? '#fff' : '#6b6391',
                  fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font)',
                }}
              >
                {notifEnabled ? '✅ Đã bật nhắc nhở' : '🔔 Bật nhắc nhở'}
              </button>
              {notifPerm === 'denied' && (
                <span style={{ fontSize: '0.75rem', color: 'var(--c-coral)', fontWeight: 700 }}>
                  ⚠️ Trình duyệt đã chặn. Hãy mở quyền thông báo trong Cài đặt trang.
                </span>
              )}
              {notifEnabled && (
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-soft)', fontWeight: 600 }}>
                  Sẽ nhắc lúc 17h–21h nếu bé chưa học hôm nay
                </span>
              )}
            </div>
          )}
        </div>

        {/* 0.5. CHOOSE TTS VOICE */}
        <div style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            🔊 Chọn Giọng Đọc Tiếng Anh
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '12px' }}>
            Chọn giọng đọc bản ngữ chuẩn của Mỹ/Anh truyền cảm và dễ nghe nhất đối với con của bạn.
          </p>
          {!allEnVoices || allEnVoices.length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--c-coral)', fontWeight: 700 }}>
              ⚠️ Trình duyệt đang tải hoặc không hỗ trợ giọng đọc tiếng Anh bản xứ. Hệ thống sẽ sử dụng giọng mặc định tốt nhất của bạn.
            </div>
          ) : (
            <select
              value={enVoice?.name || ''}
              onChange={(e) => {
                const selected = allEnVoices.find(v => v.name === e.target.value);
                if (selected) {
                  setEnVoice(selected);
                  // Speak preview instantly
                  setTimeout(() => {
                    speak(`Hello! I am your new English reading companion. Let's learn together!`);
                  }, 100);
                }
              }}
              className="select-fancy"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '14px',
                fontSize: '0.9rem',
                border: '3px solid rgba(0,0,0,0.06)',
                fontWeight: 700,
                background: 'var(--paper)',
                color: 'var(--ink)'
              }}
            >
              {allEnVoices.map(voice => (
                <option key={voice.name} value={voice.name}>
                  🇺🇸🇬🇧 {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 1. EYE PROTECTION TIMER SETTING */}
        <div style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            🎯 Mục Tiêu Học Mỗi Ngày
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '12px' }}>
            Đặt số lượt chơi mỗi ngày cho bé <strong>{currentProfile?.name || ''}</strong>. Bé sẽ thấy vòng tiến độ ở màn hình chính.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[1, 2, 3, 5, 8].map(n => (
              <button
                key={n}
                className={`chip ${(currentProfile?.dailyGoal || 3) === n ? 'on' : ''}`}
                onClick={() => setDailyGoal(n)}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              >
                {n} lượt
              </button>
            ))}
          </div>
        </div>

        {/* 2. EYE PROTECTION TIMER SETTING */}
        <div style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            🎨 Màu Chủ Đề Của Bé
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '12px' }}>
            Chọn màu yêu thích cho giao diện của bé <strong>{currentProfile?.name || ''}</strong>.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            {[
              { label: 'Mặc định', val: null, color: '#9d6bff' },
              { label: 'Hồng', val: '#ff7eb3', color: '#ff7eb3' },
              { label: 'Xanh biển', val: '#0ea5e9', color: '#0ea5e9' },
              { label: 'Xanh lá', val: '#16a34a', color: '#16a34a' },
              { label: 'Cam', val: '#ff9f43', color: '#ff9f43' },
              { label: 'Đỏ', val: '#ef4444', color: '#ef4444' },
            ].map(item => {
              const active = (currentProfile?.themeColor || null) === item.val;
              return (
                <button
                  key={item.label}
                  onClick={() => setThemeColor(item.val)}
                  title={item.label}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: item.color, cursor: 'pointer',
                    border: active ? '3px solid #1e1b4b' : '3px solid rgba(0,0,0,0.1)',
                    boxShadow: active ? '0 0 0 3px rgba(157,107,255,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* 3. EYE PROTECTION TIMER SETTING */}
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

        {/* 2.5. VISUAL NO-CODE STORY CREATOR (COLLAPSIBLE) */}
        <div style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
          <button
            onClick={() => { beep('sine'); setShowStoryCreator(!showStoryCreator); }}
            className="btn-big"
            style={{
              background: 'linear-gradient(135deg, var(--c-purple), var(--c-pink))',
              boxShadow: '0 4px 0 #7a4fd6', padding: '12px 14px', fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginTop: 0, width: '100%'
            }}
          >
            <span>🎨 {showStoryCreator ? "Đóng Công Cụ Tự Tạo Truyện" : "Mở Góc Tự Tạo Truyện Song Ngữ ✍️"}</span>
            <span style={{ fontSize: '0.78rem' }}>{showStoryCreator ? "▲" : "▼"}</span>
          </button>

          {showStoryCreator && (
            <div style={{ marginTop: '18px', animation: 'fadeIn 0.25s' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--c-purple)' }}>
                🎨 Góc Tự Tạo Truyện Song Ngữ (No-Code Story Builder)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '16px' }}>
                Tự viết truyện song ngữ tương tác riêng cho con. Hệ thống tự động tách từ vựng tiếng Anh và hỗ trợ tra từ điển cực kỳ thông minh!
              </p>

          {/* Segmented Tab Controls */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.04)', padding: '4px', borderRadius: '14px', marginBottom: '16px' }}>
            <button
              onClick={() => { setActiveStoryTab('create'); setIsCompiling(false); }}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, border: 'none',
                background: activeStoryTab === 'create' ? 'var(--paper)' : 'transparent',
                color: activeStoryTab === 'create' ? 'var(--c-purple)' : 'var(--ink-soft)',
                boxShadow: activeStoryTab === 'create' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              ➕ Tạo Truyện Mới
            </button>
            <button
              onClick={() => setActiveStoryTab('list')}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 800, border: 'none',
                background: activeStoryTab === 'list' ? 'var(--paper)' : 'transparent',
                color: activeStoryTab === 'list' ? 'var(--c-purple)' : 'var(--ink-soft)',
                boxShadow: activeStoryTab === 'list' ? 'var(--shadow-sm)' : 'none', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              📖 Truyện Tự Tạo Của Bạn ({customStories.length})
            </button>
          </div>

          {/* --- TÁP 1: TẠO TRUYỆN MỚI --- */}
          {activeStoryTab === 'create' && (
            <div>
              {isCompiling ? (
                /* --- STAGE 2: COMPILE & REVIEW WORDSVI DICTIONARY --- */
                <div style={{ background: 'rgba(157, 107, 255, 0.04)', border: '2px dashed var(--c-purple)', padding: '16px', borderRadius: '20px', animation: 'fadeIn 0.3s' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--c-purple)' }}>
                    💡 Từ Điển Chạm-Dịch Tự Động (Words Translation Review)
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#6b6391', fontWeight: 600, margin: '0 0 16px', lineHeight: '1.4' }}>
                    Nhân vật Cú Cốc Cốc đã dịch sẵn các từ quen thuộc trong bài học. Vui lòng nhập nghĩa tiếng Việt cho những từ còn lại (màu đỏ) để bé chạm vào học được nhé!
                  </p>

                  {/* Word fields grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px', marginBottom: '18px' }}>
                    {Object.keys(editingWords).map(w => {
                      const hasTranslation = !!editingWords[w].trim();
                      return (
                        <div key={w} style={{
                          background: 'var(--paper)', border: hasTranslation ? '2px solid rgba(31, 128, 84, 0.25)' : '2px solid rgba(220, 53, 69, 0.3)',
                          borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: 'var(--shadow-sm)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ink)' }}>{w}</span>
                            <span style={{ fontSize: '0.72rem' }}>{hasTranslation ? '✅' : '🔴'}</span>
                          </div>
                          <input
                            type="text"
                            value={editingWords[w]}
                            onChange={(e) => setEditingWords({ ...editingWords, [w]: e.target.value })}
                            placeholder="Nghĩa từ..."
                            style={{
                              width: '100%', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', fontSize: '0.75rem',
                              padding: '4px 6px', outline: 'none', background: hasTranslation ? 'rgba(31, 128, 84, 0.02)' : 'rgba(220, 53, 69, 0.02)'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setIsCompiling(false)}
                      className="btn-ghost"
                      style={{ flex: 1, padding: '10px', fontSize: '0.85rem', marginTop: 0 }}
                    >
                      ◀ Quay lại sửa câu
                    </button>
                    <button
                      onClick={handleSaveStory}
                      className="btn-big"
                      style={{
                        flex: 1, padding: '10px', fontSize: '0.88rem', marginTop: 0,
                        background: 'linear-gradient(135deg, var(--c-grass), #38ef7d)', boxShadow: '0 4px 0 #1c7349'
                      }}
                    >
                      🚀 Xuất Bản Lên Thư Viện
                    </button>
                  </div>
                </div>
              ) : (
                /* --- STAGE 1: ENTER GENERAL & PAGE TEXTS --- */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* General Info block */}
                  <div style={{ background: 'rgba(0,0,0,0.015)', padding: '14px', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '10px', color: 'var(--c-purple)' }}>1. Thông tin chung của truyện</h4>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="Tiêu đề truyện bằng tiếng Anh (ví dụ: The Clever Monkey)"
                        className="input-fancy"
                        value={sTitle}
                        onChange={(e) => setSTitle(e.target.value)}
                        style={{ flex: 3, fontSize: '0.85rem', height: '40px' }}
                      />
                      <input
                        type="text"
                        placeholder="Bìa Emoji (ví dụ: 🐵🍌)"
                        className="input-fancy"
                        value={sEmoji}
                        onChange={(e) => setSEmoji(e.target.value)}
                        style={{ flex: 1, fontSize: '0.85rem', height: '40px', textAlign: 'center' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)' }}>Chọn Danh Mục:</span>
                        <select
                          value={sCategory}
                          onChange={(e) => setSCategory(e.target.value)}
                          className="select-fancy"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid rgba(0,0,0,0.1)', height: '36px' }}
                        >
                          <option value="Ngụ Ngôn 🎭">Ngụ Ngôn 🎭</option>
                          <option value="Bài Học Cuộc Sống 🌱">Bài Học Cuộc Sống 🌱</option>
                          <option value="Cổ Tích VN 🌾">Cổ Tích VN 🌾</option>
                          <option value="Khoa Học Kỳ Thú 🚀">Khoa Học Kỳ Thú 🚀</option>
                        </select>
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)' }}>Độ Tuổi / Khối Lớp:</span>
                        <select
                          value={sGrade}
                          onChange={(e) => setSGrade(e.target.value)}
                          className="select-fancy"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid rgba(0,0,0,0.1)', height: '36px' }}
                        >
                          <option value="Lớp 1 - 2 🐥">Lớp 1 - 2 (Dễ 🐥)</option>
                          <option value="Lớp 3 - 5 🎓">Lớp 3 - 5 (Trung bình 🎓)</option>
                        </select>
                      </div>
                    </div>

                    <textarea
                      placeholder="Mô tả ngắn truyện bằng tiếng Việt (giúp thu hút bé khi xem thư viện)..."
                      className="input-fancy"
                      value={sDesc}
                      onChange={(e) => setSDesc(e.target.value)}
                      style={{ width: '100%', fontSize: '0.85rem', minHeight: '60px', padding: '8px 10px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>

                  {/* Pages Editor */}
                  <div style={{ background: 'rgba(0,0,0,0.015)', padding: '14px', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '10px', color: 'var(--c-purple)', display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
                      <span>2. Soạn nội dung các trang truyện ({sPages.length})</span>
                      <button
                        onClick={() => setSPages([...sPages, { text: '', vi: '', img: '📖' }])}
                        style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', background: 'var(--c-purple)', border: 'none', borderRadius: '8px', padding: '2px 8px', cursor: 'pointer' }}
                      >
                        ➕ Thêm Trang
                      </button>
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {sPages.map((page, idx) => (
                        <div key={idx} style={{ background: 'var(--paper)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '10px', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--c-purple)' }}>TRANG SỐ {idx + 1}</span>
                            {sPages.length > 1 && (
                              <button
                                onClick={() => setSPages(sPages.filter((_, i) => i !== idx))}
                                style={{ background: 'transparent', border: 'none', color: 'var(--c-coral)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input
                              type="text"
                              placeholder="Câu tiếng Anh (ví dụ: The monkey likes sweet bananas.)"
                              className="input-fancy"
                              value={page.text}
                              onChange={(e) => {
                                const nextPages = [...sPages];
                                nextPages[idx].text = e.target.value;
                                setSPages(nextPages);
                              }}
                              style={{ flex: 3, fontSize: '0.8rem', height: '36px', padding: '6px 10px' }}
                            />
                            <input
                              type="text"
                              placeholder="Emoji trang (🐵)"
                              className="input-fancy"
                              value={page.img}
                              onChange={(e) => {
                                const nextPages = [...sPages];
                                nextPages[idx].img = e.target.value;
                                setSPages(nextPages);
                              }}
                              style={{ flex: 1, fontSize: '0.8rem', height: '36px', padding: '6px', textAlign: 'center' }}
                            />
                          </div>

                          <input
                            type="text"
                            placeholder="Dịch nghĩa tiếng Việt câu trên"
                            className="input-fancy"
                            value={page.vi}
                            onChange={(e) => {
                              const nextPages = [...sPages];
                              nextPages[idx].vi = e.target.value;
                              setSPages(nextPages);
                            }}
                            style={{ width: '100%', fontSize: '0.8rem', height: '36px', padding: '6px 10px' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quizzes Editor */}
                  <div style={{ background: 'rgba(0,0,0,0.015)', padding: '14px', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, marginBottom: '10px', color: 'var(--c-purple)', display: 'flex', justifyItems: 'center', justifyContent: 'space-between' }}>
                      <span>3. Soạn câu hỏi đố vui đọc hiểu ({sQuizzes.length})</span>
                      <button
                        onClick={() => setSQuizzes([...sQuizzes, { q: '', opts: ['', '', ''], ans: '' }])}
                        style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff', background: 'var(--c-purple)', border: 'none', borderRadius: '8px', padding: '2px 8px', cursor: 'pointer' }}
                      >
                        ➕ Thêm Câu Hỏi
                      </button>
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {sQuizzes.map((quiz, idx) => (
                        <div key={idx} style={{ background: 'var(--paper)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: 'var(--shadow-sm)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--c-purple)' }}>CÂU HỎI ĐỐ VUI {idx + 1}</span>
                            {sQuizzes.length > 1 && (
                              <button
                                onClick={() => setSQuizzes(sQuizzes.filter((_, i) => i !== idx))}
                                style={{ background: 'transparent', border: 'none', color: 'var(--c-coral)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>

                          <input
                            type="text"
                            placeholder="Câu hỏi tiếng Anh? (ví dụ: What does the monkey like?)"
                            className="input-fancy"
                            value={quiz.q}
                            onChange={(e) => {
                              const nextQ = [...sQuizzes];
                              nextQ[idx].q = e.target.value;
                              setSQuizzes(nextQ);
                            }}
                            style={{ width: '100%', fontSize: '0.8rem', height: '36px', padding: '6px 10px' }}
                          />

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                            {[0, 1, 2].map(optIdx => (
                              <input
                                key={optIdx}
                                type="text"
                                placeholder={`Đáp án ${optIdx + 1}`}
                                className="input-fancy"
                                value={quiz.opts[optIdx]}
                                onChange={(e) => {
                                  const nextQ = [...sQuizzes];
                                  nextQ[idx].opts[optIdx] = e.target.value;
                                  // Auto reset correct answer if text changed
                                  nextQ[idx].ans = '';
                                  setSQuizzes(nextQ);
                                }}
                                style={{ fontSize: '0.78rem', height: '32px', padding: '4px 6px', textAlign: 'center' }}
                              />
                            ))}
                          </div>

                          <div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--ink-soft)' }}>Chọn Đáp Án Đúng:</span>
                            <select
                              value={quiz.ans}
                              onChange={(e) => {
                                const nextQ = [...sQuizzes];
                                nextQ[idx].ans = e.target.value;
                                setSQuizzes(nextQ);
                              }}
                              className="select-fancy"
                              style={{ width: '100%', padding: '6px 10px', borderRadius: '10px', fontSize: '0.78rem', border: '1px solid rgba(0,0,0,0.1)', height: '32px', marginTop: '3px' }}
                            >
                              <option value="">-- Click để chọn đáp án đúng --</option>
                              {quiz.opts.filter(Boolean).map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compile Button */}
                  <button
                    onClick={handleStartCompile}
                    className="btn-big"
                    style={{
                      background: 'linear-gradient(135deg, var(--c-purple), var(--c-pink))',
                      boxShadow: '0 4px 0 #7a4fd6', padding: '12px', fontSize: '1rem'
                    }}
                  >
                    ⚡ Tự Động Phân Tích Từ Vựng & Tạo Từ Điển 🦉
                  </button>

                  {/* Quick JSON Importer Accordion */}
                  <div style={{ marginTop: '4px', textAlign: 'center' }}>
                    <button
                      onClick={() => setShowJsonImport(!showJsonImport)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--c-purple)', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {showJsonImport ? "Ẩn hộp nhập mã JSON" : "Hoặc Nhập truyện trực tiếp bằng mã JSON có sẵn 📋"}
                    </button>

                    {showJsonImport && (
                      <div style={{ marginTop: '10px', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <textarea
                          placeholder="Dán nội dung mã nguồn JSON của truyện vào đây..."
                          className="input-fancy"
                          value={jsonPasteVal}
                          onChange={(e) => setJsonPasteVal(e.target.value)}
                          style={{ width: '100%', fontSize: '0.8rem', minHeight: '80px', padding: '8px 10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'monospace' }}
                        />
                        <button
                          onClick={handleImportJson}
                          className="btn-big"
                          style={{ padding: '8px', fontSize: '0.85rem', marginTop: 0, background: 'var(--c-purple)', color: '#fff', border: 'none' }}
                        >
                          📥 Nhập Truyện Mới
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- TÁP 2: DANH SÁCH TRUYỆN ĐÃ TẠO --- */}
          {activeStoryTab === 'list' && (
            <div>
              {customStories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(0,0,0,0.015)', border: '2px dashed rgba(0,0,0,0.05)', borderRadius: '18px', fontWeight: 600, color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
                  🎨 Bạn chưa tự thiết kế truyện nào. Hãy chuyển sang Tab "Tạo Truyện Mới" để bắt đầu sáng tạo nhé!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {customStories.map(story => (
                    <div key={story.id} style={{
                      background: 'var(--paper)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '18px', padding: '12px 14px',
                      display: 'flex', alignItems: 'center', gap: '12px', boxShadow: 'var(--shadow-sm)', position: 'relative'
                    }}>
                      <div style={{
                        fontSize: '2rem', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', width: '52px', height: '52px', display: 'grid', placeItems: 'center'
                      }}>
                        {story.e}
                      </div>

                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 900, margin: '0 0 2px' }}>{story.title}</h4>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ background: 'rgba(157, 107, 255, 0.1)', color: 'var(--c-purple)', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                            {story.category}
                          </span>
                          <span style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--ink-soft)', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                            {story.gradeLevel}
                          </span>
                          <span style={{ background: 'rgba(79, 168, 78, 0.1)', color: 'var(--c-grass)', fontSize: '0.68rem', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>
                            📚 {story.pages.length} trang
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            try {
                              const cleanStoryForExport = {
                                title: story.title,
                                e: story.e,
                                category: story.category,
                                gradeLevel: story.gradeLevel,
                                desc: story.desc,
                                pages: story.pages.map(p => ({
                                  text: p.text,
                                  vi: p.vi,
                                  img: p.img,
                                  wordsVi: p.wordsVi
                                })),
                                quiz: story.quiz.map(q => ({
                                  q: q.q,
                                  opts: q.opts,
                                  ans: q.ans
                                }))
                              };
                              navigator.clipboard.writeText(JSON.stringify(cleanStoryForExport, null, 2));
                              alert(`Đã sao chép mã nguồn của truyện "${story.title}" vào bộ nhớ tạm! Bạn có thể dán chia sẻ cho người khác.`);
                            } catch(err) {
                              alert("Trình duyệt không hỗ trợ sao chép tự động!");
                            }
                          }}
                          className="btn-ghost"
                          style={{ width: 'auto', padding: '6px 8px', borderRadius: '8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px', marginTop: 0 }}
                          title="Sao chép JSON để chia sẻ"
                        >
                          <FileCode size={13} /> Chia sẻ
                        </button>
                        
                        <button
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa truyện tự tạo "${story.title}"?`)) {
                              deleteCustomStory(story.id);
                            }
                          }}
                          style={{
                            background: 'rgba(220, 53, 69, 0.08)', border: 'none', color: 'var(--c-coral)', width: '32px', height: '32px',
                            borderRadius: '8px', display: 'grid', placeItems: 'center', cursor: 'pointer'
                          }}
                          title="Xóa truyện"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

          {/* Personalized recommendation — what to practice next */}
          {(() => {
            const focusId = nextFocusTopic;
            const weakPhonemes = getPhonicsHeatmap(currentProfile?.phonicsStats || {})
              .filter(r => r.accuracy !== null && r.accuracy < 70).slice(0, 2);
            if (!focusId && weakPhonemes.length === 0) return null;
            const focusTopic = focusId ? (TOPICS.find(t => t.id === focusId) || null) : null;
            return (
              <div style={{
                background: 'linear-gradient(135deg, rgba(157,107,255,0.1), rgba(255,126,179,0.08))',
                border: '2px solid var(--c-purple)', borderRadius: '16px',
                padding: '12px 14px', marginBottom: '14px',
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 900, color: 'var(--c-purple)', marginBottom: '6px' }}>
                  🦉 Cú gợi ý cho bé {currentProfile?.name || ''}:
                </div>
                {focusTopic && (
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>
                    • Nên ôn thêm chủ đề <strong>{focusTopic.e} {focusTopic.name}</strong> — đây là phần bé hay sai nhất.
                  </div>
                )}
                {weakPhonemes.map(p => (
                  <div key={p.id} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>
                    • Luyện phát âm <strong style={{ color: 'var(--c-coral)' }}>{p.symbol}</strong> "{p.display}" qua Speech Studio.
                  </div>
                ))}
                <div style={{ fontSize: '0.74rem', color: '#6b6391', fontWeight: 600, marginTop: 4 }}>
                  Độ khó game tự điều chỉnh theo sức bé, phụ huynh không cần chỉnh tay.
                </div>
              </div>
            );
          })()}

          {Object.keys(learningAnalytics).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '18px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
              📊 Bé chưa chơi game nào. Dữ liệu học tập sẽ cập nhật khi bé làm bài!
            </div>
          ) : (() => {
            const rows = Object.keys(learningAnalytics).map(topicId => {
              const stat = learningAnalytics[topicId];
              const topic = TOPICS.find(t => t.id === topicId) || { name: 'Chủ đề', e: '📚' };
              const total = stat.correct + stat.wrong;
              const rate = total > 0 ? Math.round((stat.correct / total) * 100) : 0;
              return { topicId, topic, stat, total, rate };
            }).sort((a, b) => b.rate - a.rate);

            const strong = rows.filter(r => r.rate >= 70).slice(0, 3);
            const weak   = rows.filter(r => r.rate < 70).slice(-3).reverse();

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Summary cards */}
                {(strong.length > 0 || weak.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {strong.length > 0 && (
                      <div style={{ background: 'rgba(118,210,117,0.1)', border: '2px solid var(--c-grass)', borderRadius: '16px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--c-grass)', marginBottom: '6px' }}>💪 Mạnh nhất</div>
                        {strong.map(r => (
                          <div key={r.topicId} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>
                            {r.topic.e} {r.topic.name} <span style={{ color: 'var(--c-grass)' }}>{r.rate}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {weak.length > 0 && (
                      <div style={{ background: 'rgba(255,107,107,0.08)', border: '2px solid var(--c-coral)', borderRadius: '16px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--c-coral)', marginBottom: '6px' }}>🎯 Cần luyện thêm</div>
                        {weak.map(r => (
                          <div key={r.topicId} style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)' }}>
                            {r.topic.e} {r.topic.name} <span style={{ color: 'var(--c-coral)' }}>{r.rate}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Full chart sorted by rate */}
                {rows.map(({ topicId, topic, stat, total, rate }) => (
                  <div key={topicId} style={{ background: 'rgba(0,0,0,0.02)', padding: '10px 14px', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.88rem', marginBottom: '6px' }}>
                      <span>{topic.e} {topic.name}</span>
                      <span style={{ color: rate >= 80 ? 'var(--c-grass)' : rate >= 50 ? 'var(--c-orange)' : 'var(--c-coral)' }}>
                        {rate}% ({stat.correct}/{total})
                      </span>
                    </div>
                    <div style={{ height: '10px', background: 'rgba(0,0,0,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${rate}%`, borderRadius: '6px', transition: 'width 0.4s',
                        background: rate >= 80 ? 'var(--c-grass)' : rate >= 50 ? 'var(--c-orange)' : 'var(--c-coral)'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* 3.5 PHONICS HEATMAP */}
        <div style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', paddingBottom: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Mic size={18} color="var(--c-purple)" /> Bản Đồ Phát Âm Của Con
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '12px' }}>
            Các âm mà con thường phát âm sai khi luyện nói — gợi ý tập trung luyện thêm.
          </p>
          {(() => {
            const heatmap = getPhonicsHeatmap(currentProfile?.phonicsStats || {});
            if (heatmap.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '18px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                  🎙️ Bé chưa luyện nói. Dữ liệu phát âm sẽ xuất hiện khi bé dùng Speech Studio hoặc các game phát âm!
                </div>
              );
            }
            const weakest = heatmap.filter(r => r.accuracy !== null && r.accuracy < 70).slice(0, 3);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {weakest.length > 0 && (
                  <div style={{ background: 'rgba(255,107,107,0.08)', border: '2px solid var(--c-coral)', borderRadius: 14, padding: '10px 12px', marginBottom: 4 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--c-coral)', marginBottom: 6 }}>
                      🎯 3 âm cần luyện thêm:
                    </div>
                    {weakest.map(p => (
                      <div key={p.id} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
                        <strong style={{ color: 'var(--c-coral)' }}>{p.symbol}</strong> "{p.display}" ({p.examples}) — <em style={{ color: '#6b6391' }}>{p.vi_tip}</em>
                      </div>
                    ))}
                  </div>
                )}
                {heatmap.map(row => {
                  const color = row.accuracy >= 80 ? '#16a34a' : row.accuracy >= 60 ? '#f59e0b' : '#dc2626';
                  return (
                    <div key={row.id} style={{ background: 'rgba(0,0,0,0.02)', padding: '8px 12px', borderRadius: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 800, marginBottom: 4 }}>
                        <span style={{ background: color, color: '#fff', padding: '2px 8px', borderRadius: 8, fontSize: '0.78rem', fontFamily: 'monospace' }}>
                          {row.symbol}
                        </span>
                        <span style={{ color: 'var(--ink)' }}>"{row.display}"</span>
                        <span style={{ marginLeft: 'auto', color, fontWeight: 900 }}>{row.accuracy}%</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(0,0,0,0.07)', borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ height: '100%', width: `${row.accuracy}%`, background: color, borderRadius: 6, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6b6391', fontWeight: 600 }}>
                        {row.success}/{row.attempts} lần đúng • Ví dụ: {row.examples}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
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

        {/* 5. BACKUP & RESTORE */}
        <div style={{ borderTop: '2px solid rgba(0,0,0,0.05)', paddingTop: '20px', marginTop: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            💾 Sao Lưu & Khôi Phục Dữ Liệu
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#6b6391', fontWeight: 600, marginBottom: '14px' }}>
            Xuất file sao lưu lưu trữ trên máy tính của phụ huynh để khôi phục lại khi đổi thiết bị hoặc tránh mất tiến trình học của con.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleBackup} 
              className="btn-big" 
              style={{ flex: 1, marginTop: 0, padding: '10px 14px', fontSize: '0.88rem', background: 'linear-gradient(135deg, var(--c-purple), var(--c-pink))', boxShadow: '0 4px 0 #7a4fd6' }}
            >
              📥 Sao Lưu Tiến Trình
            </button>
            
            <label 
              className="btn-big" 
              style={{ flex: 1, marginTop: 0, padding: '10px 14px', fontSize: '0.88rem', background: 'linear-gradient(135deg, var(--c-grass), #4fa84e)', boxShadow: '0 4px 0 #3e8a3d', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
            >
              📤 Khôi Phục Dữ Liệu
              <input 
                type="file" 
                accept=".json" 
                onChange={handleRestore} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
