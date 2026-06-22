import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { VIETNAM_CURRICULUM } from './VietnamCurriculum';
import { VOCAB } from '../data/vocab';
import { MERCHANDISE, QUEST_POOL, WEEKLY_CHALLENGE_POOL } from '../data/merchandise';
import VOCAB_A1 from '../data/vocab_a1.json';
import { getDueWords, reviewWord, getDefaultCard } from '../lib/srs';
import { getIpa } from '../lib/ipaCache';
import { getPetStage } from '../lib/petStages';
import { STREAK_MILESTONES, getMilestoneToClaim } from '../lib/streakLevels';
import { generateFriendCode, isValidFriendCode, currentWeekKey } from '../lib/friendCode';
import { extractPhonemesFromIpa } from '../lib/phonics';
import { getLevelKey, getLevelDelta, getWeakTopics, getNextFocusTopic } from '../lib/adaptive';
import { getSeedById, effectiveGrowth, GARDEN_MAX_GROWTH, PLOT_UNLOCK_COSTS } from '../data/garden';

// Re-export so existing imports from GameContext still work
export { VOCAB, TOPICS } from '../data/vocab';
export { MERCHANDISE, QUEST_POOL } from '../data/merchandise';

const GameContext = createContext();


const DB_KEY = "vhta_profiles_v2";
let globalAudioCtx = null;
let bgmInterval = null;

const playBgmNode = (ctx) => {
  try {
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // Pentatonic scale (C, D, E, G, A, C)
    const freq = notes[Math.floor(Math.random() * notes.length)];
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 0.6); // slow attack
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2); // slow release
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.4);
  } catch (e) {}
};


export const GameProvider = ({ children }) => {
  const speakPollRef = useRef(null);
  const audioCacheRef = useRef({}); // word → audioUrl (from Dictionary API)

  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [activeScreen, setActiveScreen] = useState('profiles');
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKind, setToastKind] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [enVoice, setEnVoice] = useState(null);
  const [allEnVoices, setAllEnVoices] = useState([]);
  const [ttsEngine, setTtsEngine] = useState('cloud'); // 'native' | 'cloud' (default to 'cloud' for maximum compatibility)

  // Expanded features: Vietnamese primary curriculum support
  const [studyMode, setStudyMode] = useState('free'); // 'free' | 'school'
  const [selectedGrade, setSelectedGrade] = useState('grade3'); // 'grade3' | 'grade4' | 'grade5'
  const [selectedUnit, setSelectedUnit] = useState(1);
  const [completedUnits, setCompletedUnits] = useState([]); // Array of string ids: "grade3_u1", "grade3_u2", etc.
  const [readStories, setReadStories] = useState([]); // Array of string ids of read stories
  const [coinBoostRemaining, setCoinBoostRemaining] = useState(0);

  useEffect(() => {
    if (coinBoostRemaining <= 0) return;
    const timer = setTimeout(() => {
      setCoinBoostRemaining(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [coinBoostRemaining]);

  // Parent Controls states
  const [screenTimeLimit, setScreenTimeLimit] = useState(null);
  const [screenTimeRemaining, setScreenTimeRemaining] = useState(null);
  const [isTimeOut, setIsTimeOut] = useState(false);
  const [customVocab, setCustomVocab] = useState([]);
  const [learningAnalytics, setLearningAnalytics] = useState({});
  const [customStories, setCustomStories] = useState([]);

  // Load custom stories on mount
  useEffect(() => {
    try {
      const rawStories = localStorage.getItem("vhta_custom_stories_v1");
      if (rawStories) {
        setCustomStories(JSON.parse(rawStories));
      }
    } catch (e) {
      console.error("Lỗi đọc custom stories từ localStorage:", e);
    }
  }, []);

  const addCustomStory = (story) => {
    const updated = [...customStories, story];
    setCustomStories(updated);
    localStorage.setItem("vhta_custom_stories_v1", JSON.stringify(updated));
    showToast(`Đã lưu truyện: ${story.title}! 📚`, 'good');
  };

  const deleteCustomStory = (storyId) => {
    const updated = customStories.filter(s => s.id !== storyId);
    setCustomStories(updated);
    localStorage.setItem("vhta_custom_stories_v1", JSON.stringify(updated));
    showToast("Đã xoá truyện tự chọn", "");
  };

  // Streak Combo multipliers
  const [comboCount, setComboCount] = useState(0);

  // BGM & Daily Quests States
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [dailyQuests, setDailyQuests] = useState([]);
  const [weeklyChallenge, setWeeklyChallenge] = useState(null);

  const initializeDailyQuests = (profileId) => {
    try {
      const today = new Date().toDateString();
      const storageKey = `vhta_quests_${profileId}_${today}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setDailyQuests(JSON.parse(saved));
      } else {
        const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random()).slice(0, 3);
        const generated = shuffled.map((q, idx) => ({
          id: `q_${Date.now()}_${idx}`,
          type: q.type,
          text: q.text,
          target: q.target,
          current: 0,
          completed: false,
          rewardStars: q.rewardStars,
          rewardCoins: q.rewardCoins
        }));
        setDailyQuests(generated);
        localStorage.setItem(storageKey, JSON.stringify(generated));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateQuestProgress = (type, amount = 1) => {
    if (!currentProfile) return;
    setDailyQuests(prevQuests => {
      let updated = false;
      const nextQuests = prevQuests.map(q => {
        if (q.type === type && !q.completed) {
          const nextVal = Math.min(q.current + amount, q.target);
          const isCompletedNow = nextVal >= q.target;
          if (isCompletedNow) {
            // Defer out of the setState updater; addStarsAndCoins is now safe to
            // stack with the weekly reward (commitProfile accumulates via refs).
            setTimeout(() => {
              addStarsAndCoins(q.rewardStars, q.rewardCoins, true);
              showToast(`🏆 Nhiệm vụ hoàn thành: ${q.text} (+${q.rewardCoins} Xu, +${q.rewardStars} Sao)`, "good");
              beep('win');
            }, 0);
          }
          updated = true;
          return { ...q, current: nextVal, completed: isCompletedNow };
        }
        return q;
      });
      if (updated) {
        const today = new Date().toDateString();
        localStorage.setItem(`vhta_quests_${currentProfile.id}_${today}`, JSON.stringify(nextQuests));
      }
      return nextQuests;
    });
    // Same event also advances the weekly challenge if types match
    updateWeeklyProgress(type, amount);
  };

  const updateWeeklyProgress = (type, amount = 1) => {
    if (!currentProfile) return;
    setWeeklyChallenge(prev => {
      if (!prev || prev.completed || prev.type !== type) return prev;
      const nextVal = Math.min(prev.current + amount, prev.target);
      const isCompletedNow = nextVal >= prev.target;
      if (isCompletedNow) {
        setTimeout(() => {
          addStarsAndCoins(prev.rewardStars, prev.rewardCoins, true);
          showToast(`🏅 THỬ THÁCH TUẦN HOÀN THÀNH! +${prev.rewardStars}⭐ +${prev.rewardCoins}🪙`, "good");
          beep('win');
          try { window.dispatchEvent(new Event('cu-confetti')); } catch {}
        }, 0);
      }
      const next = { ...prev, current: nextVal, completed: isCompletedNow };
      localStorage.setItem(`vhta_weekly_${currentProfile.id}_${prev.weekKey}`, JSON.stringify(next));
      return next;
    });
  };

  // Weekly challenge — one bigger goal per ISO week per child, persisted by weekKey.
  const initializeWeeklyChallenge = (profileId) => {
    try {
      const weekKey = currentWeekKey();
      const storageKey = `vhta_weekly_${profileId}_${weekKey}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setWeeklyChallenge(JSON.parse(saved));
      } else {
        const pick = WEEKLY_CHALLENGE_POOL[Math.floor(Math.random() * WEEKLY_CHALLENGE_POOL.length)];
        const generated = {
          id: `w_${Date.now()}`,
          weekKey,
          type: pick.type,
          text: pick.text,
          target: pick.target,
          current: 0,
          completed: false,
          rewardStars: pick.rewardStars,
          rewardCoins: pick.rewardCoins,
        };
        setWeeklyChallenge(generated);
        localStorage.setItem(storageKey, JSON.stringify(generated));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBgm = () => {
    const ctx = globalAudioCtx || (window.AudioContext || window.webkitAudioContext ? new (window.AudioContext || window.webkitAudioContext)() : null);
    if (!ctx) return;
    if (!globalAudioCtx) globalAudioCtx = ctx;

    if (isBgmPlaying) {
      if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
      }
      setIsBgmPlaying(false);
    } else {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      setIsBgmPlaying(true);
      playBgmNode(ctx);
      bgmInterval = setInterval(() => {
        playBgmNode(ctx);
      }, 2400);
    }
  };

  useEffect(() => {
    return () => {
      if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
      }
    };
  }, []);

  // Speech Recognition States
  const isSpeechSupported = typeof window !== 'undefined' && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isSpeechSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recognitionRef.current = rec;
    }
  }, []);


  // Initialize Voices — prefer high-quality voices
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const pickBestVoice = (vs) => {
      const en = vs.filter(v => /^en/i.test(v.lang));
      // Priority: Google WaveNet > Google > Microsoft Neural > Apple > any en-US
      return (
        en.find(v => /google.*us/i.test(v.name)) ||
        en.find(v => /google/i.test(v.name)) ||
        en.find(v => /microsoft.*aria|microsoft.*jenny|microsoft.*guy/i.test(v.name)) ||
        en.find(v => /microsoft/i.test(v.name) && /en.US/i.test(v.lang)) ||
        en.find(v => /samantha|alex|karen|daniel/i.test(v.name)) ||
        en.find(v => /en-US/i.test(v.lang)) ||
        en[0] ||
        null
      );
    };
    const initVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      const en = vs.filter(v => /^en/i.test(v.lang));
      setAllEnVoices(en);
      setEnVoice(prev => prev || pickBestVoice(vs));
    };
    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;
  }, []);

  // Default shape for any profile — used for migration & new profile creation
  const profileDefaults = {
    picLevel: 1, memLevel: 1, arcLevel: 1, quizLevel: 1, wriLevel: 1,
    customVocab: [], analytics: {}, completedUnits: [], readStories: [],
    petFriendship: {}, pinCode: null, failedSeeds: [],
    cefrLevel: 'A1', cefrMastery: { A1: 0, A2: 0, B1: 0, B2: 0 },
    srsData: {},
    onboardingDone: false,
    // A3 Streak Quest fields
    streakShieldCount: 0,
    streakMilestonesClaimed: [],
    dailyGamesPlayed: 0,
    dailyGamesDate: null,
    dailyChestClaimed: false,
    // Personalization — per-child daily learning goal (games/day)
    dailyGoal: 3,
    // Personalization — per-child theme
    prefersDark: null,          // null = follow device; true/false = explicit per child
    themeColor: null,           // null = default palette; else accent hex e.g. '#9d6bff'
    // A4 Friend Leaderboard fields
    friendCode: null,           // 6-char code, auto-generated
    friendCodes: [],            // list of added friend codes
    weeklyStars: 0,
    weeklyWeekKey: null,
    // B3 Daily Story Adventure
    dailyStory: null,           // { date, story, completed }
    // B4 Phonics Heatmap — tracks pronunciation accuracy per phoneme
    phonicsStats: {},           // { phonemeId: { attempts, success } }
    // A1 Adventure Map — quest progression
    adventureProgress: { completedNodes: [], starsByNode: {}, lastNodeId: null },
    // Garden mode — Grow a Garden (plots, seed inventory, boosts)
    gardenProgress: { plots: [], inventory: {}, unlockedPlots: 4, bigFruit: 0 },
  };

  // Load profiles from LocalStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        let data = JSON.parse(raw);
        // Migrate: merge defaults first, then overlay saved data, but ignore null/undefined
        // (some older profiles stored explicit null which would otherwise blow away defaults)
        data = data.map(p => {
          const merged = { ...profileDefaults };
          merged.selectedGrade = p.age === 'older' ? 'grade5' : (p.age === 'grade4' ? 'grade4' : (p.age === 'grade2' ? 'grade2' : (p.age === 'grade1' || p.age === 'young' ? 'grade1' : 'grade3')));
          for (const k of Object.keys(p || {})) {
            const v = p[k];
            if (v === null || v === undefined) continue; // skip nulls so defaults survive
            merged[k] = v;
          }
          // Defensive: ensure nested objects exist
          if (!merged.petFriendship || typeof merged.petFriendship !== 'object') merged.petFriendship = {};
          if (!Array.isArray(merged.failedSeeds))    merged.failedSeeds = [];
          if (!Array.isArray(merged.ownedItems))     merged.ownedItems = [];
          if (!Array.isArray(merged.completedUnits)) merged.completedUnits = [];
          if (!Array.isArray(merged.readStories))    merged.readStories = [];
          if (!Array.isArray(merged.customVocab))    merged.customVocab = [];
          if (!merged.srsData || typeof merged.srsData !== 'object') merged.srsData = {};
          if (!merged.analytics || typeof merged.analytics !== 'object') merged.analytics = {};
          if (!merged.cefrMastery || typeof merged.cefrMastery !== 'object') merged.cefrMastery = { A1: 0, A2: 0, B1: 0, B2: 0 };
          // Ensure friend code exists
          if (!merged.friendCode || typeof merged.friendCode !== 'string') merged.friendCode = generateFriendCode();
          if (!Array.isArray(merged.friendCodes)) merged.friendCodes = [];
          return merged;
        });

        setProfiles(data);
        if (data.length > 0) {
          setCurrentProfile(data[0]);
          applySkin(data[0].equippedSkin);
          setCustomVocab(data[0].customVocab || []);
          setLearningAnalytics(data[0].analytics || {});
          setCompletedUnits(data[0].completedUnits || []);
          setReadStories(data[0].readStories || []);
          setSelectedGrade(data[0].selectedGrade || 'grade3');
          initializeDailyQuests(data[0].id);
          initializeWeeklyChallenge(data[0].id);
          setActiveScreen('home');
        }
      } else {
        const defaultProf = {
          ...profileDefaults,
          id: "p_default",
          name: "Khủng Long",
          avatar: "🦖",
          age: "mid",
          stars: 0,
          coins: 20,
          badges: ["first"],
          streak: 0,
          lastDay: null,
          ownedItems: ["first"],
          equippedPet: null,
          equippedSkin: null,
          friendCode: generateFriendCode(),
          friendCodes: [],
          lastDailyClaim: null,
          selectedGrade: "grade3",
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

  // Load eye-protection timer on mount
  // Wipe legacy Azure key from any device that previously saved it
  useEffect(() => {
    try {
      localStorage.removeItem('vhta_azure_key');
      localStorage.removeItem('vhta_azure_region');
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const savedLimit = localStorage.getItem("vhta_timer_limit");
      const savedRemaining = localStorage.getItem("vhta_timer_remaining");
      if (savedLimit !== null) {
        const limit = parseInt(savedLimit);
        setScreenTimeLimit(limit);
        if (savedRemaining !== null) {
          const rem = parseInt(savedRemaining);
          setScreenTimeRemaining(rem);
          if (rem <= 0) {
            setIsTimeOut(true);
          }
        }
      }
    } catch (e) {
      console.error("Lỗi đọc timer từ localStorage:", e);
    }
  }, []);

  // Eye-protection timer ticking down
  useEffect(() => {
    if (screenTimeRemaining === null || isTimeOut) return;
    if (screenTimeRemaining <= 0) {
      setIsTimeOut(true);
      localStorage.setItem("vhta_timer_remaining", "0");
      return;
    }
    const timer = setTimeout(() => {
      const nextRemaining = screenTimeRemaining - 1;
      setScreenTimeRemaining(nextRemaining);
      localStorage.setItem("vhta_timer_remaining", nextRemaining.toString());
    }, 1000);
    return () => clearTimeout(timer);
  }, [screenTimeRemaining, isTimeOut]);

  const saveDatabase = (updatedProfiles) => {
    // Stamp the active profile so cloud sync can resolve conflicts (last-write-wins)
    const now = new Date().toISOString();
    const stamped = updatedProfiles.map(p =>
      p.id === currentProfile?.id ? { ...p, updatedAt: now } : p
    );
    profilesRef.current = stamped;
    setProfiles(stamped);
    localStorage.setItem(DB_KEY, JSON.stringify(stamped));
  };

  // Synchronous mirrors of the latest profile state. Plain setState is async, so
  // calling several profile mutators in one handler (e.g. game-finish chain) would
  // each read the same stale closure and clobber each other. commitProfile reads &
  // writes these refs synchronously so chained updates accumulate instead.
  const currentProfileRef = useRef(null);
  const profilesRef = useRef([]);
  useEffect(() => { currentProfileRef.current = currentProfile; }, [currentProfile]);
  useEffect(() => { profilesRef.current = profiles; }, [profiles]);

  // Apply mutator to the latest active profile atomically. mutator receives a shallow
  // copy of the current profile and returns the updated profile (or null to abort).
  const commitProfile = (mutator) => {
    const base = currentProfileRef.current;
    if (!base) return null;
    const result = mutator({ ...base });
    if (!result) return null;
    const stamped = { ...result, updatedAt: new Date().toISOString() };
    const nextProfiles = (profilesRef.current || []).map(p => p.id === stamped.id ? stamped : p);
    currentProfileRef.current = stamped;
    profilesRef.current = nextProfiles;
    setCurrentProfile(stamped);
    setProfiles(nextProfiles);
    try { localStorage.setItem(DB_KEY, JSON.stringify(nextProfiles)); } catch {}
    return stamped;
  };

  // Merge cloud profiles into local state (last-write-wins by updatedAt).
  // Called after pulling from Supabase on login so multi-device data converges.
  const mergeCloudProfiles = useCallback((cloudProfiles) => {
    if (!Array.isArray(cloudProfiles) || cloudProfiles.length === 0) return;

    let localProfiles = [];
    try { localProfiles = JSON.parse(localStorage.getItem(DB_KEY) || '[]'); } catch {}

    const byId = new Map((localProfiles || []).map(p => [p.id, p]));
    // Drop the auto-generated offline default once the user has real cloud
    // profiles, so a signed-in user never inherits the shared "p_default".
    byId.delete('p_default');

    for (const cloud of cloudProfiles) {
      if (!cloud?.id) continue;
      const local = byId.get(cloud.id);
      if (!local) { byId.set(cloud.id, { ...profileDefaults, ...cloud }); continue; }
      const localTs = Date.parse(local.updatedAt || 0) || 0;
      const cloudTs = Date.parse(cloud.updatedAt || 0) || 0;
      // Merge defaults so newly added fields never come back undefined
      byId.set(cloud.id, cloudTs > localTs
        ? { ...profileDefaults, ...cloud }
        : { ...profileDefaults, ...local });
    }

    const merged = Array.from(byId.values());
    localStorage.setItem(DB_KEY, JSON.stringify(merged));
    setProfiles(merged);

    // Activate a cloud profile so the signed-in user sees their own data.
    const cloudIds = new Set(cloudProfiles.map(c => c.id));
    const target = merged.find(p => cloudIds.has(p.id)) || merged[0];
    if (target) {
      setCurrentProfile(target);
      applySkin(target.equippedSkin);
      setCustomVocab(target.customVocab || []);
      setLearningAnalytics(target.analytics || {});
      setCompletedUnits(target.completedUnits || []);
      setReadStories(target.readStories || []);
      setSelectedGrade(target.selectedGrade || 'grade3');
      initializeDailyQuests(target.id);
      initializeWeeklyChallenge(target.id);
    }
  }, []);

  // Signed in with an empty cloud account: drop the shared offline default and
  // send the user to create their own profile (which gets a unique id + syncs up).
  const prepareNewAccount = useCallback(() => {
    let local = [];
    try { local = JSON.parse(localStorage.getItem(DB_KEY) || '[]'); } catch {}
    const real = (local || []).filter(p => p.id !== 'p_default');
    localStorage.setItem(DB_KEY, JSON.stringify(real));
    setProfiles(real);
    if (real.length > 0) {
      // Returning user on a fresh device with leftover real profiles — activate one.
      const target = real[0];
      setCurrentProfile(target);
      applySkin(target.equippedSkin);
      setCustomVocab(target.customVocab || []);
      setLearningAnalytics(target.analytics || {});
      setCompletedUnits(target.completedUnits || []);
      setReadStories(target.readStories || []);
      setSelectedGrade(target.selectedGrade || 'grade3');
      initializeDailyQuests(target.id);
      initializeWeeklyChallenge(target.id);
      setActiveScreen('home');
    } else {
      // No profile at all → go create one instead of the shared default.
      setCurrentProfile(null);
      setActiveScreen('profiles');
    }
  }, []);

  const applySkin = (skinId) => {
    // Preserve dark-mode class when changing skin
    const wasDark = document.body.classList.contains('dark-mode');
    document.body.className = "";
    if (skinId) {
      const sk = MERCHANDISE.skins.find(x => x.id === skinId);
      if (sk && sk.class) document.body.classList.add(sk.class);
    }
    if (wasDark) document.body.classList.add('dark-mode');
  };

  // Device-level fallback for dark mode when a profile hasn't set a preference
  const devicePrefersDark = () => {
    try {
      const saved = localStorage.getItem('vhta_dark_mode');
      if (saved === '1') return true;
      if (saved === '0') return false;
      return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches || false;
    } catch { return false; }
  };

  // Dark mode is now per-profile: prefersDark on the profile wins; null → device default
  const [isDarkMode, setIsDarkModeState] = useState(devicePrefersDark);
  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [isDarkMode]);

  // Apply a child's accent color as a CSS variable override
  const applyThemeColor = (color) => {
    const root = document.documentElement;
    if (color) root.style.setProperty('--c-purple', color);
    else root.style.removeProperty('--c-purple');
  };

  // Sync dark mode + theme color whenever the active profile changes
  useEffect(() => {
    if (!currentProfile) return;
    const pref = currentProfile.prefersDark;
    setIsDarkModeState(pref === null || pref === undefined ? devicePrefersDark() : !!pref);
    applyThemeColor(currentProfile.themeColor || null);
  }, [currentProfile?.id, currentProfile?.prefersDark, currentProfile?.themeColor]);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkModeState(next);
    try { localStorage.setItem('vhta_dark_mode', next ? '1' : '0'); } catch {}
    // Persist the choice on the active profile so it follows the child across devices
    if (currentProfile) {
      const updated = { ...currentProfile, prefersDark: next };
      setCurrentProfile(updated);
      saveDatabase(profiles.map(p => p.id === updated.id ? updated : p));
    }
  };

  // Set this child's accent theme color (null resets to default palette)
  const setThemeColor = (color) => {
    if (!currentProfile) return;
    applyThemeColor(color || null);
    const updated = { ...currentProfile, themeColor: color || null };
    setCurrentProfile(updated);
    saveDatabase(profiles.map(p => p.id === updated.id ? updated : p));
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
      initializeDailyQuests(prof.id);
      initializeWeeklyChallenge(prof.id);
      setActiveScreen('home');
      setComboCount(0);
      setStudyMode('free');
      showToast(`Chào bé ${prof.name}! 👋`, 'good');
    }
  };

  const createProfile = (name, avatar, age, pinCode = null) => {
    const newProf = {
      ...profileDefaults,
      id: "p_" + Date.now(),
      name,
      avatar,
      age,
      stars: 0,
      coins: 30,
      badges: ["first"],
      streak: 0,
      lastDay: null,
      ownedItems: ["first"],
      equippedPet: null,
      equippedSkin: null,
      lastDailyClaim: null,
      selectedGrade: age === 'older' ? 'grade5' : (age === 'grade4' ? 'grade4' : (age === 'grade2' ? 'grade2' : (age === 'grade1' || age === 'young' ? 'grade1' : 'grade3'))),
      pinCode: pinCode || null,
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
    initializeDailyQuests(newProf.id);
    initializeWeeklyChallenge(newProf.id);
    setActiveScreen('home');
    showToast(`Chào mừng ${name} gia nhập vương quốc! ✨`, 'good');
  };

  const setProfilePin = (profileId, pin) => {
    const updatedProfiles = profiles.map(p => {
      if (p.id === profileId) {
        const updatedProfile = { ...p, pinCode: pin || null };
        if (currentProfile && currentProfile.id === profileId) {
          setCurrentProfile(updatedProfile);
        }
        return updatedProfile;
      }
      return p;
    });
    saveDatabase(updatedProfiles);
    showToast(pin ? "Đã cài đặt mã khóa bảo mật! 🔐" : "Đã xóa mã khóa bảo mật! 🔓", "good");
  };

  const updateProfileFields = (profileId, fields) => {
    const updatedProfiles = profiles.map(p => {
      if (p.id === profileId) {
        const updatedProfile = { ...p, ...fields };
        if (currentProfile && currentProfile.id === profileId) {
          setCurrentProfile(updatedProfile);
        }
        return updatedProfile;
      }
      return p;
    });
    saveDatabase(updatedProfiles);
  };

  const addFailedSeed = (wordObj) => {
    if (!currentProfile || !wordObj) return;
    const currentSeeds = currentProfile.failedSeeds || [];
    if (currentSeeds.some(s => s.w === wordObj.w)) return;

    const newSeed = {
      w: wordObj.w,
      e: wordObj.e,
      vi: wordObj.vi,
      t: wordObj.t || "general",
      points: 0
    };

    const updated = {
      ...currentProfile,
      failedSeeds: [...currentSeeds, newSeed]
    };

    const updatedProfiles = profiles.map(p => p.id === currentProfile.id ? updated : p);
    setCurrentProfile(updated);
    saveDatabase(updatedProfiles);
  };

  const growSeed = (wordW) => {
    if (!currentProfile) return;
    const currentSeeds = currentProfile.failedSeeds || [];
    const updatedSeeds = currentSeeds.map(s => {
      if (s.w === wordW) {
        return { ...s, points: Math.min(s.points + 1, 3) };
      }
      return s;
    });

    const updated = {
      ...currentProfile,
      failedSeeds: updatedSeeds
    };

    const updatedProfiles = profiles.map(p => p.id === currentProfile.id ? updated : p);
    setCurrentProfile(updated);
    saveDatabase(updatedProfiles);
  };

  const harvestSeed = (wordW) => {
    if (!currentProfile) return;
    const currentSeeds = currentProfile.failedSeeds || [];
    const updatedSeeds = currentSeeds.filter(s => s.w !== wordW);

    const updated = {
      ...currentProfile,
      failedSeeds: updatedSeeds
    };

    const updatedProfiles = profiles.map(p => p.id === currentProfile.id ? updated : p);
    setCurrentProfile(updated);
    saveDatabase(updatedProfiles);
    
    beep('win');
    showToast("Chúc mừng bé đã thu hoạch quả ngọt thành công! 🧺✨ (+30 Sao, +15 Xu)", "good");
  };

  const addStarsAndCoins = (stars, coins, isCorrect = true, extraFields = null) => {
    if (!currentProfileRef.current) return;

    // Streak Combo double reward logic (combo state is separate from profile)
    let earnCoins = coins;
    if (isCorrect) {
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);
      if (nextCombo >= 3) {
        earnCoins = coins * 2;
        showToast(`🔥 Combo x${nextCombo}! Nhân đôi xu thưởng! 🪙`, 'good');
      }
    } else {
      setComboCount(0);
    }

    commitProfile((updated) => {
      Object.assign(updated, extraFields || {});

      // Equipped pet stage → coin boost (1.0 / 1.25 / 1.5 / 2.0)
      const petId = updated.equippedPet;
      const petFriendshipPoints = (updated.petFriendship && updated.petFriendship[petId]) || 0;
      const petStage = petId ? getPetStage(petFriendshipPoints) : null;

      let coinsToAdd = earnCoins;
      if (petStage && petStage.boost > 1.0) {
        coinsToAdd = Math.round(coinsToAdd * petStage.boost);
        if (petStage.boost >= 2) {
          showToast(`👑 Linh thú Huyền thoại: NHÂN ĐÔI Xu! 🪙✨`, 'good');
        } else if (petStage.boost >= 1.5) {
          showToast(`🌟 Linh thú Trưởng thành: +50% Xu! 🪙`, 'good');
        }
      }

      if (coinBoostRemaining > 0) {
        coinsToAdd = coinsToAdd * 2;
        showToast(`🎟️ Bùa Nhân Đôi Xu đang hoạt động: Nhân đôi Xu! 🪙✨`, 'good');
      }

      updated.stars += stars;
      updated.coins += coinsToAdd;

      // Track weekly stars for friend leaderboard
      const weekKey = currentWeekKey();
      if (updated.weeklyWeekKey !== weekKey) {
        updated.weeklyWeekKey = weekKey;
        updated.weeklyStars = 0;
      }
      if (stars > 0) updated.weeklyStars = (updated.weeklyStars || 0) + stars;

      // Badges unlocking
      if (updated.stars >= 50 && !updated.ownedItems.includes("star50")) {
        updated.ownedItems = [...updated.ownedItems, "star50"];
        showToast("🏆 Nhận Huy Hiệu: Ngôi Sao Sáng! ✨", "good");
      }
      if (updated.stars >= 100 && !updated.ownedItems.includes("star100")) {
        updated.ownedItems = [...updated.ownedItems, "star100"];
        showToast("🏆 Nhận Huy Hiệu: Vũ Trụ Sao! 💫", "good");
      }
      if (updated.coins >= 200 && !updated.ownedItems.includes("badge_rich")) {
        updated.ownedItems = [...updated.ownedItems, "badge_rich"];
        showToast("🏆 Nhận Huy Hiệu: Nhà Giàu! 💰", "good");
      }

      return updated;
    });
  };

  const updateAnalytics = (topicId, isCorrect) => {
    if (!currentProfileRef.current) return;
    const base = currentProfileRef.current.analytics || {};
    const prev = base[topicId] || { correct: 0, wrong: 0 };
    const analytics = {
      ...base,
      [topicId]: {
        correct: prev.correct + (isCorrect ? 1 : 0),
        wrong: prev.wrong + (isCorrect ? 0 : 1),
      },
    };
    setLearningAnalytics(analytics);
    commitProfile((updated) => { updated.analytics = analytics; return updated; });
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

  // Adaptive difficulty: nudge a game's level toward the child's ability.
  // Step-up is already handled in-game via levelUpGame on a perfect run; this
  // adds a gentle step-DOWN when a session goes poorly so kids don't get stuck.
  const autoAdjustLevel = (gameKey, scorePct) => {
    if (!currentProfileRef.current) return;
    const levelKey = getLevelKey(gameKey);
    if (!levelKey) return;
    const current = currentProfileRef.current[levelKey] || 1;
    const delta = getLevelDelta(scorePct, current);
    if (delta >= 0) return; // step-ups handled elsewhere; nothing to do
    const next = Math.max(1, current + delta);
    if (next === current) return;
    showToast(`🦉 Cú giảm độ khó một chút để bé luyện vững hơn nhé! (Cấp ${next})`, '');
    commitProfile((updated) => { updated[levelKey] = next; return updated; });
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
        // Confetti for legendary/epic purchases
        if (item.tier === 'legendary' || item.tier === 'epic') {
          try { window.dispatchEvent(new Event('cu-confetti')); } catch {}
        }
      } else {
        showToast("Bé cần tích lũy thêm xu nhé! 🥺", "bad");
        beep('bad');
      }
    }

    setCurrentProfile(updated);
    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
  };

  const feedPet = (foodName, cost, points) => {
    if (!currentProfile) return false;
    const petId = currentProfile.equippedPet;
    if (!petId) {
      showToast("Hãy trang bị một thú cưng đồng hành trước nhé! 🐾", "bad");
      beep('bad');
      return false;
    }

    if (currentProfile.coins < cost) {
      showToast("Bé không đủ xu để mua món ăn này! 🥺", "bad");
      beep('bad');
      return false;
    }

    const updated = { ...currentProfile };
    updated.coins -= cost;
    if (!updated.petFriendship) updated.petFriendship = {};
    
    const currentPoints = updated.petFriendship[petId] || 0;
    const nextPoints = Math.min(currentPoints + points, 100);
    updated.petFriendship[petId] = nextPoints;

    // Detect stage-up
    const oldStage = getPetStage(currentPoints).id;
    const newStage = getPetStage(nextPoints).id;
    const stageUp = newStage > oldStage;

    setCurrentProfile(updated);
    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
    beep('win');

    if (stageUp) {
      const newStageObj = getPetStage(nextPoints);
      showToast(`🎉 LINH THÚ TIẾN HÓA! Lên cấp "${newStageObj.name}"! ${newStageObj.boostLabel || ''}`, 'good');
      beep('magic');
      try { window.dispatchEvent(new Event('cu-confetti')); } catch {}
    } else {
      showToast(`Bé đã cho Pet ăn ${foodName}! Thân thiết +${points} 🍎✨`, 'good');
    }
    return { success: true, stageUp, newStage };
  };

  const claimDailyChest = (luckyStars, luckyCoins) => {
    if (!currentProfile) return;
    if (currentProfile.lastDailyClaim === new Date().toDateString()) return; // already claimed
    // Atomic update: stars/coins + lastDailyClaim in one profile write
    addStarsAndCoins(luckyStars, luckyCoins, true, {
      lastDailyClaim: new Date().toDateString(),
    });
  };

  const updateStreak = () => {
    if (!currentProfile) return;
    const today = new Date().toDateString();
    if (currentProfile.lastDay === today) return;

    const updated = { ...currentProfile };
    const yest       = new Date(Date.now() - 86400000).toDateString();
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toDateString();

    if (currentProfile.lastDay === yest) {
      updated.streak += 1;
    } else if (currentProfile.lastDay === twoDaysAgo && (updated.streakShieldCount || 0) > 0) {
      // Skipped exactly 1 day — auto-use a shield to preserve the streak
      updated.streakShieldCount = (updated.streakShieldCount || 0) - 1;
      updated.streak += 1;
      showToast(`🛡️ Khiên Streak đã giữ chuỗi học của bé! Còn ${updated.streakShieldCount} khiên.`, 'good');
    } else {
      updated.streak = 1;
    }
    updated.lastDay = today;

    // Reset daily-games counter for the new day
    if (updated.dailyGamesDate !== today) {
      updated.dailyGamesDate = today;
      updated.dailyGamesPlayed = 0;
      updated.dailyChestClaimed = false;
    }

    // Claim milestone reward if newly reached
    const milestone = getMilestoneToClaim(updated.streak, updated.streakMilestonesClaimed || []);
    if (milestone) {
      updated.streakMilestonesClaimed = [...(updated.streakMilestonesClaimed || []), milestone.days];
      updated.coins += milestone.reward.coins;
      updated.stars += milestone.reward.stars;
      if (milestone.reward.shield > 0) {
        updated.streakShieldCount = (updated.streakShieldCount || 0) + milestone.reward.shield;
      }
      const shieldMsg = milestone.reward.shield > 0 ? ` + ${milestone.reward.shield} 🛡️` : '';
      showToast(`🎉 MỐC ${milestone.days} NGÀY: ${milestone.emoji} ${milestone.name}! +${milestone.reward.coins}🪙 +${milestone.reward.stars}⭐${shieldMsg}`, 'good');
    }

    setCurrentProfile(updated);
    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    saveDatabase(updatedProfiles);
  };

  // ── A1 Adventure Map ────────────────────────────────────────
  const completeAdventureNode = (nodeId, gameStars = 0) => {
    if (!currentProfileRef.current || !nodeId) return;
    const adv = currentProfileRef.current.adventureProgress || { completedNodes: [], starsByNode: {} };
    const completed = adv.completedNodes || [];
    const alreadyDone = completed.includes(nodeId);

    const newCompleted = alreadyDone ? completed : [...completed, nodeId];
    const newStars = { ...(adv.starsByNode || {}) };
    // Keep best stars
    if (!newStars[nodeId] || gameStars > newStars[nodeId]) {
      newStars[nodeId] = gameStars;
    }
    commitProfile((updated) => {
      // Preserve other adventureProgress fields (e.g. claimedChapters)
      updated.adventureProgress = {
        ...adv,
        completedNodes: newCompleted,
        starsByNode: newStars,
        lastNodeId: nodeId,
      };
      return updated;
    });

    if (!alreadyDone) {
      showToast(`🗺️ Hoàn thành "${nodeId}"! Mở khóa ô tiếp theo.`, 'good');
      try { window.dispatchEvent(new Event('cu-confetti')); } catch {}
    }
  };

  // Claim the one-time completion reward for a fully-cleared chapter
  const claimChapterReward = (chapterId, reward) => {
    if (!currentProfile || !chapterId || !reward) return false;
    const adv = currentProfile.adventureProgress || { completedNodes: [], starsByNode: {} };
    const claimed = adv.claimedChapters || [];
    if (claimed.includes(chapterId)) return false;

    // Grant loot + persist claim atomically via extraFields (avoids stale-state overwrite)
    addStarsAndCoins(reward.stars, reward.coins, false, {
      adventureProgress: { ...adv, claimedChapters: [...claimed, chapterId] },
    });
    showToast(`🎁 Phần thưởng chương: +${reward.stars}⭐ +${reward.coins}🪙!`, 'good');
    try { window.dispatchEvent(new Event('cu-confetti')); } catch {}
    return true;
  };

  // ── Garden mode (Grow a Garden) ─────────────────────────────
  const buySeed = (seed) => {
    if (!currentProfileRef.current || !seed) return false;
    if ((currentProfileRef.current.coins || 0) < seed.buyPrice) {
      showToast('Bé cần thêm xu để mua hạt này! 🪙', 'bad');
      beep('bad');
      return false;
    }
    beep('pop');
    commitProfile((updated) => {
      updated.coins -= seed.buyPrice;
      const g = { ...(updated.gardenProgress || {}) };
      g.inventory = { ...(g.inventory || {}) };
      g.inventory[seed.id] = (g.inventory[seed.id] || 0) + 1;
      updated.gardenProgress = g;
      return updated;
    });
    showToast(`Đã mua hạt ${seed.vi}! 🌰`, 'good');
    return true;
  };

  // Plant a seed from inventory into a plot (called after the vocab gate passes)
  const plantSeed = (seedId, plotIndex) => {
    if (!currentProfileRef.current) return false;
    const g0 = currentProfileRef.current.gardenProgress || {};
    if ((g0.inventory?.[seedId] || 0) <= 0) return false;
    commitProfile((updated) => {
      const g = { ...(updated.gardenProgress || {}) };
      g.inventory = { ...(g.inventory || {}) };
      g.inventory[seedId] = Math.max(0, (g.inventory[seedId] || 0) - 1);
      g.plots = [...(g.plots || [])];
      g.plots[plotIndex] = { seedId, plantedAt: Date.now(), waterings: 0 };
      updated.gardenProgress = g;
      return updated;
    });
    beep('magic');
    return true;
  };

  // Water a plant (+1 growth) — called after a correct vocab answer
  const waterPlant = (plotIndex) => {
    if (!currentProfileRef.current) return;
    commitProfile((updated) => {
      const g = { ...(updated.gardenProgress || {}) };
      g.plots = [...(g.plots || [])];
      const plot = g.plots[plotIndex];
      if (!plot) return updated;
      g.plots[plotIndex] = { ...plot, waterings: (plot.waterings || 0) + 1 };
      updated.gardenProgress = g;
      return updated;
    });
  };

  // Harvest a ripe plant → sell for coins (×2 if a big-fruit boost is active)
  const harvestPlant = (plotIndex) => {
    if (!currentProfileRef.current) return 0;
    const g0 = currentProfileRef.current.gardenProgress || {};
    const plot = (g0.plots || [])[plotIndex];
    if (!plot) return 0;
    const seed = getSeedById(plot.seedId);
    if (!seed || effectiveGrowth(plot) < GARDEN_MAX_GROWTH) return 0;

    const useBoost = (g0.bigFruit || 0) > 0;
    const payout = seed.sellPrice * (useBoost ? 2 : 1);

    commitProfile((updated) => {
      const g = { ...(updated.gardenProgress || {}) };
      g.plots = [...(g.plots || [])];
      g.plots[plotIndex] = null; // clear plot
      if (useBoost) g.bigFruit = Math.max(0, (g.bigFruit || 0) - 1);
      updated.gardenProgress = g;
      updated.coins += payout;
      return updated;
    });
    beep('win');
    showToast(`🧺 Thu hoạch ${seed.vi}! +${payout}🪙${useBoost ? ' (x2 Bùa!)' : ''}`, 'good');
    try { window.dispatchEvent(new Event('cu-confetti')); } catch {}
    return payout;
  };

  const buyGardenBoost = (boost) => {
    if (!currentProfileRef.current || !boost) return false;
    if ((currentProfileRef.current.coins || 0) < boost.price) {
      showToast('Bé cần thêm xu! 🪙', 'bad'); beep('bad'); return false;
    }
    beep('pop');
    commitProfile((updated) => {
      updated.coins -= boost.price;
      const g = { ...(updated.gardenProgress || {}) };
      if (boost.id === 'big_fruit') g.bigFruit = (g.bigFruit || 0) + 1;
      else if (boost.id === 'magic_water') g.magicWater = (g.magicWater || 0) + 1;
      updated.gardenProgress = g;
      return updated;
    });
    showToast(`Đã mua ${boost.name}! ${boost.e}`, 'good');
    return true;
  };

  const unlockPlot = (plotIndex) => {
    if (!currentProfileRef.current) return false;
    const cost = PLOT_UNLOCK_COSTS[plotIndex] || 0;
    if ((currentProfileRef.current.coins || 0) < cost) {
      showToast('Bé cần thêm xu để mở luống đất! 🪙', 'bad'); beep('bad'); return false;
    }
    commitProfile((updated) => {
      updated.coins -= cost;
      const g = { ...(updated.gardenProgress || {}) };
      g.unlockedPlots = Math.max(g.unlockedPlots || 4, plotIndex + 1);
      updated.gardenProgress = g;
      return updated;
    });
    beep('magic');
    showToast('🌱 Đã mở luống đất mới!', 'good');
    return true;
  };


  // Updates phoneme stats based on word-level pronunciation success
  const recordPronunciation = async (word, success) => {
    if (!currentProfileRef.current || !word) return;
    const cleanWord = word.toLowerCase().trim();
    if (!cleanWord) return;
    let ipa = null;
    try {
      const info = await getIpa(cleanWord);
      ipa = info?.ipa;
    } catch {}
    if (!ipa) return;
    const phonemes = extractPhonemesFromIpa(ipa);
    if (phonemes.length === 0) return;

    // commitProfile reads the latest ref at run time, so concurrent per-word
    // calls accumulate instead of clobbering each other (and don't drop rewards).
    commitProfile((updated) => {
      const stats = { ...(updated.phonicsStats || {}) };
      for (const id of phonemes) {
        const prev = stats[id] || { attempts: 0, success: 0 };
        stats[id] = {
          attempts: prev.attempts + 1,
          success: prev.success + (success ? 1 : 0),
        };
      }
      updated.phonicsStats = stats;
      return updated;
    });
  };

  // ── B3 Daily Story Adventure ────────────────────────────────
  const saveDailyStory = (story) => {
    if (!currentProfile) return;
    const today = new Date().toDateString();
    const updated = {
      ...currentProfile,
      dailyStory: { date: today, story, completed: false },
    };
    setCurrentProfile(updated);
    saveDatabase(profiles.map(p => p.id === updated.id ? updated : p));
  };

  const markDailyStoryComplete = () => {
    if (!currentProfile || !currentProfile.dailyStory) return;
    if (currentProfile.dailyStory.completed) return;
    // Reward: 30 stars + 15 coins for finishing a story
    addStarsAndCoins(30, 15, true, {
      dailyStory: { ...currentProfile.dailyStory, completed: true },
    });
    showToast('📖 Đọc xong truyện hôm nay! +30⭐ +15🪙', 'good');
    try { window.dispatchEvent(new Event('cu-confetti')); } catch {}
  };

  // Add a friend by code
  const addFriend = (rawCode) => {
    if (!currentProfile) return { ok: false, error: 'no_profile' };
    const code = (rawCode || '').trim().toUpperCase();
    if (!isValidFriendCode(code)) return { ok: false, error: 'invalid_code' };
    if (code === currentProfile.friendCode) return { ok: false, error: 'self' };
    const existing = currentProfile.friendCodes || [];
    if (existing.includes(code)) return { ok: false, error: 'duplicate' };
    if (existing.length >= 20) return { ok: false, error: 'limit' };
    const updated = { ...currentProfile, friendCodes: [...existing, code] };
    setCurrentProfile(updated);
    saveDatabase(profiles.map(p => p.id === updated.id ? updated : p));
    return { ok: true };
  };

  const removeFriend = (code) => {
    if (!currentProfile) return;
    const filtered = (currentProfile.friendCodes || []).filter(c => c !== code);
    const updated = { ...currentProfile, friendCodes: filtered };
    setCurrentProfile(updated);
    saveDatabase(profiles.map(p => p.id === updated.id ? updated : p));
  };

  // Record a completed game — drives streak bump + daily mini-streak (3 games → bonus chest)
  // Personalization — set this child's daily learning goal (games per day)
  const setDailyGoal = (n) => {
    if (!currentProfile) return;
    const goal = Math.max(1, Math.min(20, Math.round(n) || 1));
    const updated = { ...currentProfile, dailyGoal: goal };
    setCurrentProfile(updated);
    saveDatabase(profiles.map(p => p.id === updated.id ? updated : p));
  };

  const recordGameFinish = () => {
    if (!currentProfileRef.current) return;
    const today      = new Date().toDateString();
    const yest       = new Date(Date.now() - 86400000).toDateString();
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toDateString();

    commitProfile((updated) => {
      // ── 1. Streak bump (only once per calendar day) ──
      if (updated.lastDay !== today) {
        if (updated.lastDay === yest) {
          updated.streak = (updated.streak || 0) + 1;
        } else if (updated.lastDay === twoDaysAgo && (updated.streakShieldCount || 0) > 0) {
          // Skipped exactly 1 day — auto-use shield
          updated.streakShieldCount -= 1;
          updated.streak = (updated.streak || 0) + 1;
          showToast(`🛡️ Khiên Streak đã giữ chuỗi học! Còn ${updated.streakShieldCount} khiên.`, 'good');
        } else {
          updated.streak = 1;
        }
        updated.lastDay = today;

        // Check milestone reward
        const milestone = getMilestoneToClaim(updated.streak, updated.streakMilestonesClaimed || []);
        if (milestone) {
          updated.streakMilestonesClaimed = [...(updated.streakMilestonesClaimed || []), milestone.days];
          updated.coins += milestone.reward.coins;
          updated.stars += milestone.reward.stars;
          if (milestone.reward.shield > 0) {
            updated.streakShieldCount = (updated.streakShieldCount || 0) + milestone.reward.shield;
          }
          const shieldMsg = milestone.reward.shield > 0 ? ` + ${milestone.reward.shield} 🛡️` : '';
          showToast(`🎉 MỐC ${milestone.days} NGÀY: ${milestone.emoji} ${milestone.name}! +${milestone.reward.coins}🪙 +${milestone.reward.stars}⭐${shieldMsg}`, 'good');
          try { window.dispatchEvent(new Event('cu-confetti')); } catch {}
        }
      }

      // ── 2. Daily mini-streak (3 games → bonus chest) ──
      if (updated.dailyGamesDate !== today) {
        updated.dailyGamesDate = today;
        updated.dailyGamesPlayed = 0;
        updated.dailyChestClaimed = false;
      }
      updated.dailyGamesPlayed = (updated.dailyGamesPlayed || 0) + 1;

      if (updated.dailyGamesPlayed >= 3 && !updated.dailyChestClaimed) {
        updated.dailyChestClaimed = true;
        updated.coins += 50;
        updated.stars += 20;
        showToast('🎁 RƯƠNG NGÀY: 3 game hôm nay! +50 🪙 +20 ⭐', 'good');
      }

      return updated;
    });
  };

  // Primary curriculum action: Complete SGK unit
  const completeUnit = () => {
    if (!currentProfileRef.current) return;
    const unitKey = `${selectedGrade}_u${selectedUnit}`;
    const existing = currentProfileRef.current.completedUnits || [];
    if (existing.includes(unitKey)) return;

    const updatedUnits = [...existing, unitKey];
    setCompletedUnits(updatedUnits);
    commitProfile((updated) => { updated.completedUnits = updatedUnits; return updated; });

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

  const speakWithTTS = (text, onBoundary, onEnd) => {
    if (!("speechSynthesis" in window)) { if (onEnd) onEnd(); return; }
    if (speakPollRef.current) { clearInterval(speakPollRef.current); speakPollRef.current = null; }
    try { window.speechSynthesis.cancel(); } catch(e) {}

    // Estimate a safe max duration: ~80ms/char + 4s buffer. Caps at 30s.
    const estMs = Math.min(30000, 4000 + (text || '').length * 80);

    setTimeout(() => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        u.rate = 0.88;
        u.pitch = 1.05;
        u.volume = 1.0;

        const voice = enVoice || (() => {
          const vs = window.speechSynthesis.getVoices();
          return vs.find(v => /google.*us/i.test(v.name)) ||
            vs.find(v => /google/i.test(v.name)) ||
            vs.find(v => /microsoft/i.test(v.name) && /en-US/i.test(v.lang)) ||
            vs.find(v => /en-US/i.test(v.lang)) ||
            vs.find(v => /^en/i.test(v.lang));
        })();
        if (voice) u.voice = voice;

        if (onBoundary) u.onboundary = onBoundary;

        let finished = false;
        let safetyTimer = null;
        const finish = () => {
          if (finished) return;
          finished = true;
          if (speakPollRef.current) { clearInterval(speakPollRef.current); speakPollRef.current = null; }
          if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
          if (onEnd) onEnd();
        };
        u.onend = finish;
        u.onerror = (e) => { if (e.error !== 'canceled' && e.error !== 'interrupted') finish(); };

        // Safety: if Chrome/iOS speech engine hangs, force-finish after estMs
        safetyTimer = setTimeout(() => {
          if (finished) return;
          try { window.speechSynthesis.cancel(); } catch {}
          finish();
        }, estMs);

        let pollCount = 0;
        speakPollRef.current = setInterval(() => {
          if (finished) { clearInterval(speakPollRef.current); speakPollRef.current = null; return; }
          pollCount++;
          if (!window.speechSynthesis.speaking) {
            clearInterval(speakPollRef.current); speakPollRef.current = null; finish();
          } else if (pollCount % 10 === 0) {
            window.speechSynthesis.pause(); window.speechSynthesis.resume();
          }
        }, 1000);

        window.speechSynthesis.resume();
        window.speechSynthesis.speak(u);
      } catch(e) { if (onEnd) onEnd(); }
    }, 60);
  };

  const speak = (text, onBoundary, onEnd) => {
    if (!text || !text.trim()) { if (onEnd) onEnd(); return; }

    const word = text.trim().toLowerCase();
    const isSingleWord = /^[a-z'-]+$/.test(word);

    // For single words: try Dictionary API real audio first
    if (isSingleWord) {
      const cached = audioCacheRef.current[word];

      const playAudio = (url) => {
        if (!url) { speakWithTTS(text, onBoundary, onEnd); return; }
        try {
          const audio = new Audio(url);
          audio.playbackRate = 0.85;
          audio.onended = () => { if (onEnd) onEnd(); };
          audio.onerror = () => speakWithTTS(text, onBoundary, onEnd);
          audio.play().catch(() => speakWithTTS(text, onBoundary, onEnd));
        } catch {
          speakWithTTS(text, onBoundary, onEnd);
        }
      };

      if (cached !== undefined) {
        playAudio(cached);
      } else {
        // Fetch from Dictionary API, play TTS immediately while fetching
        speakWithTTS(text, onBoundary, onEnd);
        // Prefetch for next time
        getIpa(word).then(({ audioUrl }) => {
          audioCacheRef.current[word] = audioUrl || null;
        }).catch(() => { audioCacheRef.current[word] = null; });
      }
      return;
    }

    // Sentences: use TTS directly
    speakWithTTS(text, onBoundary, onEnd);
  };

  // Richer sound effect library — pure Web Audio (no asset files needed)
  const beep = (type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!globalAudioCtx) globalAudioCtx = new AudioCtx();
      const ctx = globalAudioCtx;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      // Helper: play a tone segment with attack/release envelope
      const tone = (freq, start, dur, opts = {}) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = opts.type || 'triangle';
        o.frequency.setValueAtTime(freq, now + start);
        if (opts.endFreq) {
          o.frequency.exponentialRampToValueAtTime(opts.endFreq, now + start + dur);
        }
        const peak = opts.gain ?? 0.22;
        g.gain.setValueAtTime(0.0001, now + start);
        g.gain.exponentialRampToValueAtTime(peak, now + start + Math.min(0.02, dur * 0.3));
        g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + start);
        o.stop(now + start + dur + 0.02);
      };

      // Helper: noise burst (for soft pops / whoosh)
      const noise = (start, dur, opts = {}) => {
        const bufferSize = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(opts.gain || 0.15, now + start);
        const filter = ctx.createBiquadFilter();
        filter.type = opts.filterType || 'bandpass';
        filter.frequency.value = opts.freq || 1000;
        filter.Q.value = opts.q || 1;
        src.connect(filter); filter.connect(g); g.connect(ctx.destination);
        src.start(now + start);
        src.stop(now + start + dur);
      };

      switch (type) {
        case 'good':
          // 3-note happy ascent
          tone(523, 0,    0.10, { type: 'triangle' });
          tone(659, 0.08, 0.10, { type: 'triangle' });
          tone(784, 0.16, 0.16, { type: 'triangle' });
          break;
        case 'bad':
          tone(220, 0,    0.12, { type: 'sawtooth', endFreq: 110, gain: 0.18 });
          break;
        case 'win':
          // Sparkle fanfare: ascending arpeggio + bell
          [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.08, 0.12, { type: 'triangle' }));
          tone(1568, 0.5, 0.5, { type: 'sine', gain: 0.18 });
          break;
        case 'pop':
          // Bubble pop (used for taps/clicks)
          tone(800, 0,    0.05, { type: 'sine', endFreq: 1400, gain: 0.15 });
          break;
        case 'bell':
          // Bell ring for notifications
          tone(880,  0,    0.45, { type: 'sine', gain: 0.20 });
          tone(1320, 0.02, 0.35, { type: 'sine', gain: 0.12 });
          tone(1760, 0.04, 0.25, { type: 'sine', gain: 0.08 });
          break;
        case 'swoosh':
          // Swoosh (used for transitions/flying)
          noise(0, 0.3, { filterType: 'bandpass', freq: 2000, q: 0.7, gain: 0.12 });
          break;
        case 'magic':
          // Magical sparkle for level-up / evolution
          [523, 698, 880, 1175, 1568].forEach((f, i) => tone(f, i * 0.04, 0.20, { type: 'sine', gain: 0.18 }));
          tone(2093, 0.25, 0.6, { type: 'triangle', gain: 0.12 });
          break;
        case 'square':
        case 'sine':
          // UI click (small, soft)
          tone(440, 0, 0.08, { type: type === 'square' ? 'square' : 'sine', gain: 0.10 });
          break;
        default:
          tone(440, 0, 0.10, { type: 'sine', gain: 0.12 });
      }
    } catch {}
  };
  const startListeningSpeech = (targetWord, onCorrect, onIncorrect, options = {}) => {
    if (!isSpeechSupported || !recognitionRef.current) {
      showToast("Trình duyệt không hỗ trợ luyện nói tiếng Anh! 🎙️", "bad");
      return;
    }

    // Stop speaking first to prevent feedback loop
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}

    const rec = recognitionRef.current;
    
    // Reset callbacks cleanly
    rec.onstart = null;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;

    rec.onstart = () => {
      setIsListeningSpeech(true);
      setSpeechTranscript('');
    };

    rec.onresult = (event) => {
      if (event.results && event.results[0]) {
        const transcript = event.results[0][0].transcript;
        setSpeechTranscript(transcript);
        
        const spokenClean = transcript.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
        const targetClean = targetWord.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
        
        const success = spokenClean === targetClean || spokenClean.includes(targetClean) || targetClean.includes(spokenClean);
        // B4: track per-phoneme pronunciation accuracy.
        // skipPhonics lets multi-word callers (Speech Studio) handle phonics AND
        // quest progress themselves — avoid double-counting the 'speech' quest.
        if (!options.skipPhonics) {
          recordPronunciation(targetWord, success);
        }
        if (success) {
          if (!options.skipPhonics) updateQuestProgress('speech', 1);
          if (onCorrect) onCorrect(transcript);
        } else {
          if (onIncorrect) onIncorrect(transcript);
        }
      }
    };

    rec.onerror = (e) => {
      setIsListeningSpeech(false);
      if (e.error === 'no-speech') {
        showToast("Bé ơi, hình như bé chưa nói gì nè! 🎙️", "bad");
      } else if (e.error === 'audio-capture') {
        showToast("Không tìm thấy micro thu âm! 🎙️", "bad");
      } else if (e.error === 'not-allowed') {
        showToast("Bé hãy cho phép sử dụng Micro ở góc trình duyệt nhé! 🎙️", "bad");
      } else {
        if (onIncorrect) onIncorrect(`Lỗi: ${e.error}`);
      }
    };

    rec.onend = () => {
      setIsListeningSpeech(false);
    };

    try {
      rec.start();
    } catch (err) {
      // If already started, force stop and restart
      try {
        rec.stop();
      } catch (stopErr) {}
      
      setTimeout(() => {
        try { rec.start(); } catch (retryErr) {}
      }, 200);
    }
  };

  const stopListeningSpeech = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListeningSpeech(false);
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
      localStorage.removeItem("vhta_timer_limit");
      localStorage.removeItem("vhta_timer_remaining");
    } else {
      const secs = minutes * 60;
      setScreenTimeRemaining(secs);
      localStorage.setItem("vhta_timer_limit", minutes.toString());
      localStorage.setItem("vhta_timer_remaining", secs.toString());
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

  // Returns all vocab for a given CEFR level (with lazy-loading stubs for A2+)
  const getCefrVocab = async (level = 'A1') => {
    if (level === 'A1') return VOCAB_A1;
    try {
      if (level === 'A2') {
        const mod = await import('../data/vocab_a2.json');
        return mod.default;
      }
      if (level === 'B1') {
        const mod = await import('../data/vocab_b1.json');
        return mod.default;
      }
      if (level === 'B2') {
        const mod = await import('../data/vocab_b2.json');
        return mod.default;
      }
    } catch {
      return [];
    }
    return [];
  };

  // Returns vocab for SRS review: words due today + new words up to dailyNewLimit
  const getDueSrsWords = (dailyNewLimit = 10) => {
    if (!currentProfile) return { due: [], newWords: [] };
    const srsData = currentProfile.srsData || {};
    const allVocab = [...VOCAB_A1, ...VOCAB];
    const uniqueMap = new Map();
    for (const w of allVocab) uniqueMap.set(w.w.toLowerCase(), w);
    const { due, newWords } = getDueWords(srsData, Array.from(uniqueMap.values()));
    return { due, newWords: newWords.slice(0, dailyNewLimit) };
  };

  // Called after each game answer to update SRS card for a word
  const updateSrsCard = (wordW, quality) => {
    if (!currentProfile) return;
    const key = wordW.toLowerCase();
    const srsData = currentProfile.srsData || {};
    const existingCard = srsData[key] || getDefaultCard();
    const updatedCard = reviewWord(existingCard, quality);
    const updatedSrsData = { ...srsData, [key]: updatedCard };
    updateProfileFields(currentProfile.id, { srsData: updatedSrsData });
  };

  const getCombinedVocab = () => {
    if (studyMode === 'school') {
      // Return vocabulary of selected SGK Unit!
      const gradeUnits = VIETNAM_CURRICULUM[selectedGrade] || [];
      const currentUnitObj = gradeUnits.find(u => u.unit === selectedUnit) || { words: [] };
      return currentUnitObj.words;
    }
    
    // In free play, extract ALL words from all grades in VIETNAM_CURRICULUM
    const curriculumWords = [];
    const uniqueWordSet = new Set();
    
    // 1. Add custom words first so they take precedence
    customVocab.forEach(item => {
      curriculumWords.push(item);
      uniqueWordSet.add(item.w.toLowerCase().trim());
    });
    
    // 2. Add baseline VOCAB words
    VOCAB.forEach(item => {
      const cleanW = item.w.toLowerCase().trim();
      if (!uniqueWordSet.has(cleanW)) {
        curriculumWords.push(item);
        uniqueWordSet.add(cleanW);
      }
    });

    // 3. Add all words from VIETNAM_CURRICULUM (Grade 1 to 5)
    Object.keys(VIETNAM_CURRICULUM).forEach(gradeKey => {
      VIETNAM_CURRICULUM[gradeKey].forEach(unit => {
        unit.words.forEach(item => {
          const cleanW = item.w.toLowerCase().trim();
          if (!uniqueWordSet.has(cleanW)) {
            curriculumWords.push({
              w: item.w,
              e: item.e,
              vi: item.vi,
              t: item.t || "curriculum"
            });
            uniqueWordSet.add(cleanW);
          }
        });
      });
    });
    
    return curriculumWords;
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
      setProfilePin,
      updateProfileFields,
      addStarsAndCoins,
      buyOrEquipItem,
      claimDailyChest,
      updateStreak,
      recordGameFinish,
      addFriend,
      removeFriend,
      saveDailyStory,
      markDailyStoryComplete,
      recordPronunciation,
      completeAdventureNode,
      claimChapterReward,
      buySeed,
      plantSeed,
      waterPlant,
      harvestPlant,
      buyGardenBoost,
      unlockPlot,
      mergeCloudProfiles,
      prepareNewAccount,
      autoAdjustLevel,
      setDailyGoal,
      setThemeColor,
      weakTopics: getWeakTopics(learningAnalytics || {}),
      nextFocusTopic: getNextFocusTopic(learningAnalytics || {}),
      isDarkMode,
      toggleDarkMode,
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
      customStories,
      addCustomStory,
      deleteCustomStory,
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
      completeStory,

      // Speech Recognition variables
      isSpeechSupported,
      isListeningSpeech,
      speechTranscript,
      startListeningSpeech,
      stopListeningSpeech,
      
      // Sprouting Greenhouse & Boosters exports
      addFailedSeed,
      growSeed,
      harvestSeed,
      coinBoostRemaining,
      setCoinBoostRemaining,

      // BGM and Daily Quests
      isBgmPlaying,
      toggleBgm,
      dailyQuests,
      weeklyChallenge,
      updateQuestProgress,

      // CEFR vocab & SRS
      getCefrVocab,
      getDueSrsWords,
      updateSrsCard,

      // English Voice states
      enVoice,
      setEnVoice,
      allEnVoices,
      feedPet
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);
