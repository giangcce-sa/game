import React, { createContext, useContext, useState, useEffect } from 'react';
import { VIETNAM_CURRICULUM } from './VietnamCurriculum';

const GameContext = createContext();

export const VOCAB = [
  // Animals 🐾 (16 words)
  {w:"cat",e:"🐱",vi:"con mèo",t:"animals"},
  {w:"dog",e:"🐶",vi:"con chó",t:"animals"},
  {w:"fish",e:"🐟",vi:"con cá",t:"animals"},
  {w:"bird",e:"🐦",vi:"con chim",t:"animals"},
  {w:"lion",e:"🦁",vi:"sư tử",t:"animals"},
  {w:"tiger",e:"🐯",vi:"con hổ",t:"animals"},
  {w:"elephant",e:"🐘",vi:"con voi",t:"animals"},
  {w:"monkey",e:"🐵",vi:"con khỉ",t:"animals"},
  {w:"rabbit",e:"🐰",vi:"con thỏ",t:"animals"},
  {w:"bear",e:"🐻",vi:"con gấu",t:"animals"},
  {w:"pig",e:"🐷",vi:"con heo",t:"animals"},
  {w:"cow",e:"🐮",vi:"con bò",t:"animals"},
  {w:"horse",e:"🐴",vi:"con ngựa",t:"animals"},
  {w:"duck",e:"🦆",vi:"con vịt",t:"animals"},
  {w:"frog",e:"🐸",vi:"con ếch",t:"animals"},
  {w:"panda",e:"🐼",vi:"gấu trúc",t:"animals"},
  
  // Food 🍎 (16 words)
  {w:"apple",e:"🍎",vi:"quả táo",t:"food"},
  {w:"banana",e:"🍌",vi:"quả chuối",t:"food"},
  {w:"orange",e:"🍊",vi:"quả cam",t:"food"},
  {w:"grape",e:"🍇",vi:"quả nho",t:"food"},
  {w:"pizza",e:"🍕",vi:"bánh pizza",t:"food"},
  {w:"bread",e:"🍞",vi:"bánh mì",t:"food"},
  {w:"cake",e:"🍰",vi:"bánh ngọt",t:"food"},
  {w:"milk",e:"🥛",vi:"sữa uống",t:"food"},
  {w:"egg",e:"🥚",vi:"quả trứng",t:"food"},
  {w:"rice",e:"🍚",vi:"cơm",t:"food"},
  {w:"ice cream",e:"🍦",vi:"cây kem",t:"food"},
  {w:"cookie",e:"🍪",vi:"bánh quy",t:"food"},
  {w:"watermelon",e:"🍉",vi:"dưa hấu",t:"food"},
  {w:"strawberry",e:"🍓",vi:"dâu tây",t:"food"},
  {w:"carrot",e:"🥕",vi:"củ cà rốt",t:"food"},
  {w:"corn",e:"🌽",vi:"bắp ngô",t:"food"},

  // Colors 🎨 (10 words)
  {w:"red",e:"🔴",vi:"màu đỏ",t:"colors"},
  {w:"blue",e:"🔵",vi:"màu xanh dương",t:"colors"},
  {w:"green",e:"🟢",vi:"màu xanh lá",t:"colors"},
  {w:"yellow",e:"🟡",vi:"màu vàng",t:"colors"},
  {w:"orange",e:"🟠",vi:"màu cam",t:"colors"},
  {w:"purple",e:"🟣",vi:"màu tím",t:"colors"},
  {w:"black",e:"⚫",vi:"màu đen",t:"colors"},
  {w:"white",e:"⚪",vi:"màu trắng",t:"colors"},
  {w:"brown",e:"🟤",vi:"màu nâu",t:"colors"},
  {w:"pink",e:"🌸",vi:"màu hồng",t:"colors"},

  // Numbers 🔢 (10 words)
  {w:"one",e:"1️⃣",vi:"số một",t:"numbers"},
  {w:"two",e:"2️⃣",vi:"số hai",t:"numbers"},
  {w:"three",e:"3️⃣",vi:"số ba",t:"numbers"},
  {w:"four",e:"4️⃣",vi:"số bốn",t:"numbers"},
  {w:"five",e:"5️⃣",vi:"số năm",t:"numbers"},
  {w:"six",e:"6️⃣",vi:"số sáu",t:"numbers"},
  {w:"seven",e:"7️⃣",vi:"số bảy",t:"numbers"},
  {w:"eight",e:"8️⃣",vi:"số tám",t:"numbers"},
  {w:"nine",e:"9️⃣",vi:"số chín",t:"numbers"},
  {w:"ten",e:"🔟",vi:"số mười",t:"numbers"},

  // Nature 🌳 (10 words)
  {w:"sun",e:"☀️",vi:"mặt trời",t:"nature"},
  {w:"moon",e:"🌙",vi:"mặt trăng",t:"nature"},
  {w:"star",e:"⭐",vi:"ngôi sao",t:"nature"},
  {w:"cloud",e:"☁️",vi:"đám mây",t:"nature"},
  {w:"rain",e:"🌧️",vi:"mưa",t:"nature"},
  {w:"tree",e:"🌳",vi:"cái cây",t:"nature"},
  {w:"flower",e:"🌷",vi:"bông hoa",t:"nature"},
  {w:"fire",e:"🔥",vi:"ngọn lửa",t:"nature"},
  {w:"rainbow",e:"🌈",vi:"cầu vồng",t:"nature"},
  {w:"snow",e:"❄️",vi:"tuyết rơi",t:"nature"},

  // Transport 🚗 (8 words)
  {w:"car",e:"🚗",vi:"ô tô",t:"transport"},
  {w:"bus",e:"🚌",vi:"xe buýt",t:"transport"},
  {w:"train",e:"🚆",vi:"tàu hỏa",t:"transport"},
  {w:"plane",e:"✈️",vi:"máy bay",t:"transport"},
  {w:"boat",e:"⛵",vi:"thuyền buồm",t:"transport"},
  {w:"bike",e:"🚲",vi:"xe đạp",t:"transport"},
  {w:"truck",e:"🚚",vi:"xe tải",t:"transport"},
  {w:"rocket",e:"🚀",vi:"tên lửa",t:"transport"},

  // Things 🏠 (8 words)
  {w:"house",e:"🏠",vi:"ngôi nhà",t:"things"},
  {w:"book",e:"📚",vi:"quyển sách",t:"things"},
  {w:"clock",e:"🕐",vi:"đồng hồ",t:"things"},
  {w:"key",e:"🔑",vi:"chìa khóa",t:"things"},
  {w:"phone",e:"📱",vi:"điện thoại",t:"things"},
  {w:"ball",e:"⚽",vi:"quả bóng",t:"things"},
  {w:"gift",e:"🎁",vi:"hộp quà",t:"things"},
  {w:"umbrella",e:"☂️",vi:"cái ô",t:"things"},

  // Body 🧒
  {w:"eye",e:"👁️",vi:"mắt",t:"body"},
  {w:"ear",e:"👂",vi:"tai",t:"body"},
  {w:"nose",e:"👃",vi:"mũi",t:"body"},
  {w:"mouth",e:"👄",vi:"miệng",t:"body"},
  {w:"hand",e:"🖐️",vi:"bàn tay",t:"body"},
  {w:"foot",e:"👣",vi:"bàn chân",t:"body"},
  {w:"tooth",e:"🦷",vi:"răng",t:"body"},
  {w:"brain",e:"🧠",vi:"não bộ",t:"body"},

  // Family 👪
  {w:"baby",e:"👶",vi:"em bé",t:"family"},
  {w:"mother",e:"👩",vi:"mẹ",t:"family"},
  {w:"father",e:"👨",vi:"bố",t:"family"},
  {w:"sister",e:"👧",vi:"chị/em gái",t:"family"},
  {w:"brother",e:"👦",vi:"anh/em trai",t:"family"},
  {w:"grandma",e:"👵",vi:"bà",t:"family"},
  {w:"grandpa",e:"👴",vi:"ông",t:"family"},

  // School 🎒
  {w:"pencil",e:"✏️",vi:"bút chì",t:"school"},
  {w:"bag",e:"🎒",vi:"cặp sách",t:"school"},
  {w:"ruler",e:"📏",vi:"thước kẻ",t:"school"},
  {w:"computer",e:"💻",vi:"máy tính",t:"school"},
  {w:"teacher",e:"👩‍🏫",vi:"cô giáo",t:"school"},
  {w:"school",e:"🏫",vi:"trường học",t:"school"},

  // Weather ☀️
  {w:"sunny",e:"☀️",vi:"nắng",t:"weather"},
  {w:"windy",e:"🌬️",vi:"nhiều gió",t:"weather"},
  {w:"stormy",e:"⛈️",vi:"bão bùng",t:"weather"},
  {w:"hot",e:"🥵",vi:"nóng bức",t:"weather"},
  {w:"cold",e:"🥶",vi:"lạnh giá",t:"weather"},

  // Sports ⚽
  {w:"soccer",e:"⚽",vi:"bóng đá",t:"sports"},
  {w:"swimming",e:"🏊",vi:"bơi lội",t:"sports"},
  {w:"tennis",e:"🎾",vi:"quần vợt",t:"sports"},
  {w:"runner",e:"🏃",vi:"chạy bộ",t:"sports"},
  {w:"skating",e:"⛸️",vi:"trượt băng",t:"sports"},

  // Clothes 👕
  {w:"shirt",e:"👕",vi:"áo sơ mi",t:"clothes"},
  {w:"pants",e:"👖",vi:"quần dài",t:"clothes"},
  {w:"dress",e:"👗",vi:"váy liền",t:"clothes"},
  {w:"hat",e:"👒",vi:"mũ",t:"clothes"},
  {w:"shoes",e:"👟",vi:"giày",t:"clothes"},
  {w:"socks",e:"🧦",vi:"tất chân",t:"clothes"},

  // Feelings 😊
  {w:"happy",e:"😊",vi:"vui vẻ",t:"feelings"},
  {w:"sad",e:"😢",vi:"buồn bã",t:"feelings"},
  {w:"angry",e:"😠",vi:"tức giận",t:"feelings"},
  {w:"sleepy",e:"😴",vi:"buồn ngủ",t:"feelings"},
  {w:"scared",e:"😱",vi:"sợ hãi",t:"feelings"},

  // Jobs 👮
  {w:"doctor",e:"🧑‍⚕️",vi:"bác sĩ",t:"jobs"},
  {w:"pilot",e:"🧑‍✈️",vi:"phi công",t:"jobs"},
  {w:"police",e:"👮",vi:"cảnh sát",t:"jobs"},
  {w:"chef",e:"🧑‍🍳",vi:"đầu bếp",t:"jobs"},
  {w:"farmer",e:"🧑‍🌾",vi:"nông dân",t:"jobs"},
  {w:"artist",e:"🧑‍🎨",vi:"họa sĩ",t:"jobs"},

  // Shapes 🔺
  {w:"circle",e:"⭕",vi:"hình tròn",t:"shapes"},
  {w:"square",e:"⏹️",vi:"hình vuông",t:"shapes"},
  {w:"triangle",e:"🔺",vi:"hình tam giác",t:"shapes"},
  {w:"heart",e:"❤️",vi:"hình trái tim",t:"shapes"},
  {w:"diamond",e:"🔷",vi:"hình thoi",t:"shapes"},
];

export const TOPICS = [
  {id:"all",  name:"Tất cả",     e:"🌈"},
  {id:"animals",name:"Động vật",  e:"🐾"},
  {id:"food",  name:"Thức ăn",    e:"🍎"},
  {id:"colors",name:"Màu sắc",    e:"🎨"},
  {id:"numbers",name:"Con số",    e:"🔢"},
  {id:"nature",name:"Thiên nhiên",e:"🌳"},
  {id:"transport",name:"Xe cộ",   e:"🚗"},
  {id:"things",name:"Đồ vật",     e:"🏠"},
  {id:"body",  name:"Cơ thể",     e:"🧒"},
  {id:"family",name:"Gia đình",   e:"👪"},
  {id:"school",name:"Trường học", e:"🎒"},
  {id:"weather",name:"Thời tiết", e:"☀️"},
  {id:"sports",name:"Thể thao",   e:"⚽"},
  {id:"clothes",name:"Quần áo",   e:"👕"},
  {id:"feelings",name:"Cảm xúc",  e:"😊"},
  {id:"jobs",  name:"Nghề nghiệp",e:"👮"},
  {id:"shapes",name:"Hình khối",  e:"🔺"},
  {id:"custom",name:"Của cha mẹ",  e:"📝"},
];

export const MERCHANDISE = {
  pets: [
    {id:"pet_dog", type:"pets", e:"🐶", name:"Cún Lông Xù", price: 80, desc:"Bạn cún thông minh, trung thành"},
    {id:"pet_cat", type:"pets", e:"🐱", name:"Mèo Con Quý Phái", price: 80, desc:"Chú mèo đáng yêu thích nô đùa"},
    {id:"pet_fox", type:"pets", e:"🦊", name:"Cáo Nhỏ Tinh Nghịch", price: 120, desc:"Thông minh và cực kỳ nhanh nhẹn"},
    {id:"pet_unicorn", type:"pets", e:"🦄", name:"Kỳ Lân Phép Thuật", price: 200, desc:"Mang lại may mắn diệu kỳ"},
    {id:"pet_dragon", type:"pets", e:"🐉", name:"Rồng Lửa Cổ Đại", price: 300, desc:"Oai vệ, phun ra lửa sao lấp lánh"},
  ],
  skins: [
    {id:"theme_candy", type:"skins", e:"🍬", name:"Kẹo Ngọt Hồng", price: 60, desc:"Tông màu kẹo hồng đáng yêu", class:"theme-candy"},
    {id:"theme_ocean", type:"skins", e:"🌊", name:"Đại Dương Xanh", price: 60, desc:"Màu xanh tươi mát của sóng biển", class:"theme-ocean"},
    {id:"theme_forest", type:"skins", e:"🌲", name:"Rừng Rậm Kỳ Bí", price: 100, desc:"Màu xanh ngọc êm dịu, sảng khoái", class:"theme-forest"},
    {id:"theme_sunset", type:"skins", e:"🌅", name:"Hoàng Hôn Ấm Áp", price: 120, desc:"Ánh sáng rực rỡ đầy năng lượng", class:"theme-sunset"},
    {id:"theme_space", type:"skins", e:"🌌", name:"Vũ Trụ Huyền Bí", price: 250, desc:"Không gian tối lung linh đầy sao", class:"theme-space"},
  ],
  badges: [
    {id:"first",   type:"badges", e:"🌟", name:"Khởi Đầu", price: 0, desc:"Có được khi bắt đầu hành trình"},
    {id:"star50",  type:"badges", e:"✨", name:"Ngôi Sao Sáng", price: 50, desc:"Tích lũy được 50 sao lấp lánh"},
    {id:"star100", type:"badges", e:"💫", name:"Vũ Trụ Sao", price: 100, desc:"Cực kỳ chăm chỉ vượt bậc"},
    {id:"badge_rich", type:"badges", e:"💰", name:"Nhà Giàu", price: 150, desc:"Sở hữu hơn 200 đồng xu"},
    {id:"badge_master", type:"badges", e:"👑", name:"Vua Trò Chơi", price: 250, desc:"Danh hiệu cho bé tài năng nhất"},
  ]
};

const DB_KEY = "vhta_profiles_v2";

export const GameProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [activeScreen, setActiveScreen] = useState('profiles');
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKind, setToastKind] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [enVoice, setEnVoice] = useState(null);
  const [ttsEngine, setTtsEngine] = useState('cloud'); // 'native' | 'cloud' (default to 'cloud' for maximum compatibility)

  // Expanded features: Vietnamese primary curriculum support
  const [studyMode, setStudyMode] = useState('free'); // 'free' | 'school'
  const [selectedGrade, setSelectedGrade] = useState('grade3'); // 'grade3' | 'grade4' | 'grade5'
  const [selectedUnit, setSelectedUnit] = useState(1);
  const [completedUnits, setCompletedUnits] = useState([]); // Array of string ids: "grade3_u1", "grade3_u2", etc.
  const [readStories, setReadStories] = useState([]); // Array of string ids of read stories

  // Parent Controls states
  const [screenTimeLimit, setScreenTimeLimit] = useState(null);
  const [screenTimeRemaining, setScreenTimeRemaining] = useState(null);
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [customVocab, setCustomVocab] = useState([]);
  const [learningAnalytics, setLearningAnalytics] = useState({});

  // Streak Combo multipliers
  const [comboCount, setComboCount] = useState(0);

  // Initialize Voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const initVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      const voice = vs.find(v => /en-US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
      setEnVoice(voice);
    };
    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;
  }, []);

  // Load profiles from LocalStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        let data = JSON.parse(raw);
        // Sync & Migrate all old profiles
        data = data.map(p => ({
          picLevel: 1,
          memLevel: 1,
          arcLevel: 1,
          quizLevel: 1,
          wriLevel: 1,
          customVocab: [],
          analytics: {},
          selectedGrade: p.selectedGrade || (p.age === 'older' ? 'grade5' : (p.age === 'grade4' ? 'grade4' : (p.age === 'grade2' ? 'grade2' : (p.age === 'grade1' || p.age === 'young' ? 'grade1' : 'grade3')))),
          completedUnits: [],
          readStories: [],
          ...p
        }));

        setProfiles(data);
        if (data.length > 0) {
          setCurrentProfile(data[0]);
          applySkin(data[0].equippedSkin);
          setCustomVocab(data[0].customVocab || []);
          setLearningAnalytics(data[0].analytics || {});
          setCompletedUnits(data[0].completedUnits || []);
          setReadStories(data[0].readStories || []);
          setSelectedGrade(data[0].selectedGrade || 'grade3');
          setActiveScreen('home');
        }
      } else {
        const defaultProf = {
          id: "p_default",
          name: "Khủng Long",
          avatar: "🦖",
          age: "mid",
          stars: 0,
          coins: 20,
          badges: ["first"],
          streak: 0,
          lastDay: null,
          quizLevel: 1,
          picLevel: 1,
          memLevel: 1,
          arcLevel: 1,
          wriLevel: 1,
          ownedItems: ["first"],
          equippedPet: null,
          equippedSkin: null,
          lastDailyClaim: null,
          customVocab: [],
          analytics: {},
          selectedGrade: "grade3",
          completedUnits: [],
          readStories: []
        };
        setProfiles([defaultProf]);
        setCurrentProfile(defaultProf);
        setActiveScreen('home');
        localStorage.setItem(DB_KEY, JSON.stringify([defaultProf]));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Eye-protection timer ticking down
  useEffect(() => {
    if (screenTimeRemaining === null || isTimeOut) return;
    if (screenTimeRemaining <= 0) {
      setIsTimeOut(true);
      return;
    }
    const timer = setTimeout(() => {
      setScreenTimeRemaining(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [screenTimeRemaining, isTimeOut]);

  const saveDatabase = (updatedProfiles) => {
    setProfiles(updatedProfiles);
    localStorage.setItem(DB_KEY, JSON.stringify(updatedProfiles));
  };

  const applySkin = (skinId) => {
    document.body.className = "";
    if (skinId) {
      const sk = MERCHANDISE.skins.find(x => x.id === skinId);
      if (sk && sk.class) document.body.classList.add(sk.class);
    }
  };

  const selectProfile = (pId) => {
    const prof = profiles.find(x => x.id === pId);
    if (prof) {
      setCurrentProfile(prof);
      applySkin(prof.equippedSkin);
      setCustomVocab(prof.customVocab || []);
      setLearningAnalytics(prof.analytics || {});
      setCompletedUnits(prof.completedUnits || []);
      setReadStories(prof.readStories || []);
      setSelectedGrade(prof.selectedGrade || 'grade3');
      setActiveScreen('home');
      setComboCount(0);
      setStudyMode('free');
      showToast(`Chào bé ${prof.name}! 👋`, 'good');
    }
  };

  const createProfile = (name, avatar, age) => {
    const newProf = {
      id: "p_" + Date.now(),
      name,
      avatar,
      age,
      stars: 0,
      coins: 30, // Welcome gift
      badges: ["first"],
      streak: 0,
      lastDay: null,
      quizLevel: 1,
      picLevel: 1,
      memLevel: 1,
      arcLevel: 1,
      wriLevel: 1,
      ownedItems: ["first"],
      equippedPet: null,
      equippedSkin: null,
      lastDailyClaim: null,
      customVocab: [],
      analytics: {},
      selectedGrade: age === 'older' ? 'grade5' : (age === 'grade4' ? 'grade4' : (age === 'grade2' ? 'grade2' : (age === 'grade1' || age === 'young' ? 'grade1' : 'grade3'))),
      completedUnits: [],
      readStories: []
    };

    const newProfiles = [...profiles, newProf];
    saveDatabase(newProfiles);
    setCurrentProfile(newProf);
    setCustomVocab([]);
    setLearningAnalytics({});
    setCompletedUnits([]);
    setReadStories([]);
    setSelectedGrade(newProf.selectedGrade);
    applySkin(null);
    setComboCount(0);
    setStudyMode('free');
    setActiveScreen('home');
    showToast(`Chào mừng ${name} gia nhập vương quốc! ✨`, 'good');
  };

  const addStarsAndCoins = (stars, coins, isCorrect = true) => {
    if (!currentProfile) return;

    const updated = { ...currentProfile };
    
    // Streak Combo double reward logic
    let earnCoins = coins;
    if (isCorrect) {
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);
      if (nextCombo >= 3) {
        earnCoins = coins * 2;
        showToast(`Combo Lửa 🔥 Nhân đôi: +${earnCoins} Xu!`, 'good');
      }
    } else {
      setComboCount(0);
    }

    updated.stars += stars;
    updated.coins += earnCoins;

    // Badges unlocking
    if (updated.stars >= 50 && !updated.ownedItems.includes("star50")) {
      updated.ownedItems.push("star50");
      showToast("🏆 Nhận Huy Hiệu: Ngôi Sao Sáng! ✨", "good");
    }
    if (updated.stars >= 100 && !updated.ownedItems.includes("star100")) {
      updated.ownedItems.push("star100");
      showToast("🏆 Nhận Huy Hiệu: Vũ Trụ Sao! 💫", "good");
    }
    if (updated.coins >= 200 && !updated.ownedItems.includes("badge_rich")) {
      updated.ownedItems.push("badge_rich");
      showToast("🏆 Nhận Huy Hiệu: Nhà Giàu! 💰", "good");
    }

    setCurrentProfile(updated);
    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
  };

  const updateAnalytics = (topicId, isCorrect) => {
    if (!currentProfile) return;
    const analytics = { ...learningAnalytics };
    if (!analytics[topicId]) {
      analytics[topicId] = { correct: 0, wrong: 0 };
    }
    if (isCorrect) {
      analytics[topicId].correct += 1;
    } else {
      analytics[topicId].wrong += 1;
    }

    setLearningAnalytics(analytics);
    const updated = { ...currentProfile, analytics };
    setCurrentProfile(updated);

    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
  };

  const levelUpGame = (gameKey) => {
    if (!currentProfile) return;
    const updated = { ...currentProfile };
    
    if (updated[gameKey] < 5) {
      updated[gameKey] += 1;
      showToast(`🎉 Thăng Cấp! Bé đã lên Cấp ${updated[gameKey]}!`, 'good');
      beep('win');
      
      if (gameKey === 'quizLevel' && updated.quizLevel >= 3 && !updated.ownedItems.includes("quiz3")) {
        updated.ownedItems.push("quiz3");
      }
    }

    setCurrentProfile(updated);
    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
  };

  const buyOrEquipItem = (item) => {
    if (!currentProfile) return;

    const updated = { ...currentProfile };
    const isOwned = updated.ownedItems.includes(item.id);

    if (isOwned) {
      if (item.type === 'pets') {
        updated.equippedPet = updated.equippedPet === item.id ? null : item.id;
      } else if (item.type === 'skins') {
        updated.equippedSkin = updated.equippedSkin === item.id ? null : item.id;
        applySkin(updated.equippedSkin);
      }
      showToast("Áp dụng thành công! ✨", "good");
    } else {
      if (updated.coins >= item.price) {
        updated.coins -= item.price;
        updated.ownedItems.push(item.id);
        showToast(`Chúc mừng bé có thêm ${item.name}! 🎉`, "good");
        beep('win');
      } else {
        showToast("Bé cần tích lũy thêm xu nhé! 🥺", "bad");
        beep('bad');
      }
    }

    setCurrentProfile(updated);
    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
  };

  const claimDailyChest = (luckyStars, luckyCoins) => {
    if (!currentProfile) return;
    const today = new Date().toDateString();
    
    const updated = { ...currentProfile };
    updated.lastDailyClaim = today;
    setCurrentProfile(updated);

    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
    
    addStarsAndCoins(luckyStars, luckyCoins);
  };

  const updateStreak = () => {
    if (!currentProfile) return;
    const today = new Date().toDateString();
    if (currentProfile.lastDay === today) return;

    const updated = { ...currentProfile };
    const yest = new Date(Date.now() - 86400000).toDateString();
    if (currentProfile.lastDay === yest) {
      updated.streak += 1;
    } else {
      updated.streak = 1;
    }
    updated.lastDay = today;
    
    setCurrentProfile(updated);
    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
  };

  // Primary curriculum action: Complete SGK unit
  const completeUnit = () => {
    if (!currentProfile) return;
    const unitKey = `${selectedGrade}_u${selectedUnit}`;
    if (completedUnits.includes(unitKey)) return;

    const updatedUnits = [...completedUnits, unitKey];
    setCompletedUnits(updatedUnits);

    const updated = { ...currentProfile, completedUnits: updatedUnits };
    setCurrentProfile(updated);

    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
    
    showToast("🏆 Nhận Cúp Bài Học! Xuất sắc bé ơi!", "good");
    beep('win');
  };

  const completeStory = (storyId) => {
    if (!currentProfile) return;
    if (readStories.includes(storyId)) return;

    const updatedStories = [...readStories, storyId];
    setReadStories(updatedStories);

    const updated = { ...currentProfile, readStories: updatedStories };
    setCurrentProfile(updated);

    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
  };

  const changeGradeSetting = (gradeKey) => {
    setSelectedGrade(gradeKey);
    setSelectedUnit(1);
    if (!currentProfile) return;
    const updated = { ...currentProfile, selectedGrade: gradeKey };
    setCurrentProfile(updated);
    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
  };

  const speak = (text, onBoundary, onEnd) => {
    if (!text || !text.trim()) { if (onEnd) onEnd(); return; }
    if (!("speechSynthesis" in window)) { if (onEnd) onEnd(); return; }

    // Cancel previous speech cleanly
    try { window.speechSynthesis.cancel(); } catch(e) {}

    setTimeout(() => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = 0.82;
        u.pitch = 1.05;
        u.volume = 1.0;
        // Do NOT manually set voice — let the browser pick the default en-US voice.
        // Manually setting voice is the #1 cause of silent failure on Chrome/macOS.

        if (onBoundary) u.onboundary = onBoundary;

        let finished = false;
        let pollInterval = null;

        const finish = () => {
          if (finished) return;
          finished = true;
          if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
          if (onEnd) onEnd();
        };

        u.onend = finish;
        u.onerror = (e) => {
          if (e.error === 'canceled' || e.error === 'interrupted') return;
          finish();
        };

        // Poll every 1s: if speaking stopped but onend never fired, call finish manually.
        // Also handles Chrome/macOS bug where speech ends silently.
        let pollCount = 0;
        pollInterval = setInterval(() => {
          if (finished) { clearInterval(pollInterval); return; }
          pollCount++;
          if (!window.speechSynthesis.speaking) {
            // Not speaking anymore — finished (onend may not have fired on Chrome)
            clearInterval(pollInterval);
            pollInterval = null;
            finish();
          } else if (pollCount % 10 === 0) {
            // Every 10 seconds: kick Chrome to prevent auto-pause after 15s
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 1000);

        window.speechSynthesis.resume();
        window.speechSynthesis.speak(u);
      } catch(e) {
        if (onEnd) onEnd();
      }
    }, 200);
  };

  const beep = (type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === "good") {
        o.type = "triangle";
        o.frequency.setValueAtTime(523, now);
        o.frequency.setValueAtTime(659, now + .08);
        o.frequency.setValueAtTime(784, now + .16);
      } else if (type === "bad") {
        o.type = "sawtooth";
        o.frequency.setValueAtTime(220, now);
        o.frequency.setValueAtTime(130, now + .14);
      } else if (type === "win") {
        o.type = "triangle";
        [523, 659, 784, 1046, 1318].forEach((f, i) => o.frequency.setValueAtTime(f, now + i * .1));
      } else {
        o.type = "sine";
        o.frequency.setValueAtTime(440, now);
      }
      g.gain.setValueAtTime(.0001, now);
      g.gain.exponentialRampToValueAtTime(.25, now + .02);
      g.gain.exponentialRampToValueAtTime(.0001, now + (type === "win" ? .65 : .25));
      o.start(now);
      o.stop(now + (type === "win" ? .7 : .3));
    } catch (e) {}
  };

  // Parental customization actions
  const addCustomWord = (word, emoji, viMeaning) => {
    if (!currentProfile) return;
    const newWord = {
      w: word.toLowerCase().trim(),
      e: emoji,
      vi: viMeaning.trim(),
      t: "custom"
    };
    const updatedVocab = [...customVocab, newWord];
    setCustomVocab(updatedVocab);

    const updated = { ...currentProfile, customVocab: updatedVocab };
    setCurrentProfile(updated);

    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
    showToast(`Đã thêm từ: ${word}! 📝`, 'good');
  };

  const removeCustomWord = (wordStr) => {
    if (!currentProfile) return;
    const updatedVocab = customVocab.filter(w => w.w !== wordStr);
    setCustomVocab(updatedVocab);

    const updated = { ...currentProfile, customVocab: updatedVocab };
    setCurrentProfile(updated);

    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
    showToast("Đã xoá từ tự chọn", "");
  };

  const changeTimeLimit = (minutes) => {
    setScreenTimeLimit(minutes);
    if (minutes === null) {
      setScreenTimeRemaining(null);
    } else {
      setScreenTimeRemaining(minutes * 60);
    }
    setIsTimeOut(false);
    showToast(`Đã đặt giới hạn: ${minutes ? `${minutes} phút` : "Không giới hạn"}`, 'good');
  };

  const showToast = (message, kind = '') => {
    setToastMessage(message);
    setToastKind(kind);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
        setToastKind('');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const resetTimer = () => {
    if (screenTimeLimit) {
      setScreenTimeRemaining(screenTimeLimit * 60);
    }
    setIsTimeOut(false);
  };

  const getCombinedVocab = () => {
    if (studyMode === 'school') {
      // Return vocabulary of selected SGK Unit!
      const gradeUnits = VIETNAM_CURRICULUM[selectedGrade] || [];
      const currentUnitObj = gradeUnits.find(u => u.unit === selectedUnit) || { words: [] };
      return currentUnitObj.words;
    }
    return [...VOCAB, ...customVocab];
  };

  return (
    <GameContext.Provider value={{
      profiles,
      currentProfile,
      activeScreen,
      setActiveScreen,
      toastMessage,
      toastKind,
      showToast,
      selectedTopic,
      setSelectedTopic,
      selectProfile,
      createProfile,
      addStarsAndCoins,
      buyOrEquipItem,
      claimDailyChest,
      updateStreak,
      speak,
      beep,
      ttsEngine,
      setTtsEngine,
      
      // Level progression variables
      picLevel: currentProfile?.picLevel || 1,
      memLevel: currentProfile?.memLevel || 1,
      arcLevel: currentProfile?.arcLevel || 1,
      quizLevel: currentProfile?.quizLevel || 1,
      wriLevel: currentProfile?.wriLevel || 1,
      levelUpGame,
      comboCount,
      setComboCount,
      updateAnalytics,
      
      // Parental hubs
      screenTimeLimit,
      screenTimeRemaining,
      isTimeOut,
      changeTimeLimit,
      resetTimer,
      customVocab,
      addCustomWord,
      removeCustomWord,
      learningAnalytics,
      getCombinedVocab,

      // Primary School Curriculum Mode variables
      studyMode,
      setStudyMode,
      selectedGrade,
      changeGradeSetting,
      selectedUnit,
      setSelectedUnit,
      completedUnits,
      completeUnit,
      readStories,
      completeStory
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
