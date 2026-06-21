export const MERCHANDISE = {
  pets: [
    // ── Tier 1: Common (80–180 xu) ─────────────────────────
    {id:"pet_dog",       type:"pets", e:"🐶",    name:"Cún Lông Xù",          price: 80,   desc:"Bạn cún thông minh, trung thành",                tier:"common"},
    {id:"pet_cat",       type:"pets", e:"🐱",    name:"Mèo Con Quý Phái",      price: 80,   desc:"Chú mèo đáng yêu thích nô đùa",                  tier:"common"},
    {id:"pet_rabbit",    type:"pets", e:"🐰",    name:"Thỏ Bông Mây",          price: 100,  desc:"Thỏ trắng êm ái, nhảy lon ton",                  tier:"common"},
    {id:"pet_hamster",   type:"pets", e:"🐹",    name:"Chuột Hamster Mũm Mĩm",price: 110,  desc:"Tròn xoe đáng yêu, ngủ trong túi áo",            tier:"common"},
    {id:"pet_duck",      type:"pets", e:"🦆",    name:"Vịt Vàng Tinh Nghịch", price: 120,  desc:"Quạc quạc dễ thương khắp ao nhà",                tier:"common"},
    {id:"pet_penguin",   type:"pets", e:"🐧",    name:"Chim Cánh Cụt Lạnh Lùng",price: 150, desc:"Đáng yêu, đi lạch bạch trên băng",               tier:"common"},

    // ── Tier 2: Rare (200–400 xu) ──────────────────────────
    {id:"pet_fox",       type:"pets", e:"🦊",    name:"Cáo Nhỏ Tinh Nghịch",   price: 220,  desc:"Thông minh và cực kỳ nhanh nhẹn",                tier:"rare"},
    {id:"pet_robocow",   type:"pets", e:"🐢⚡",  name:"Rùa Công Nghệ",         price: 250,  desc:"Rùa siêu tốc mang tua-bin chớp điện xẹt xẹt",    tier:"rare"},
    {id:"pet_panda",     type:"pets", e:"🐼",    name:"Gấu Trúc Thiền Sư",     price: 280,  desc:"Hiền lành, nhai tre cả ngày không chán",         tier:"rare"},
    {id:"pet_koala",     type:"pets", e:"🐨",    name:"Koala Mơ Màng",         price: 300,  desc:"Ôm thân cây ngủ 20 tiếng/ngày",                  tier:"rare"},
    {id:"pet_octopus",   type:"pets", e:"🐙",    name:"Bạch Tuộc Bảy Sắc",     price: 320,  desc:"Tám tay thay đổi màu liên tục",                  tier:"rare"},
    {id:"pet_owl_smart", type:"pets", e:"🦉",    name:"Cú Đêm Thông Tuệ",      price: 380,  desc:"Bạn đồng hành học tiếng Anh tuyệt vời",          tier:"rare"},

    // ── Tier 3: Epic (500–900 xu) ──────────────────────────
    {id:"pet_unicorn",   type:"pets", e:"🦄",    name:"Kỳ Lân Cầu Vồng",       price: 550,  desc:"Mang lại may mắn diệu kỳ, sừng lấp lánh",        tier:"epic"},
    {id:"pet_phoenix",   type:"pets", e:"🦅🔥",  name:"Phượng Hoàng Lửa",      price: 680,  desc:"Linh thú rực cháy kiêu sa, tái sinh lấp lánh",   tier:"epic"},
    {id:"pet_wiseowl",   type:"pets", e:"🦉🎓",  name:"Cú Thông Thái",         price: 720,  desc:"Người bạn đồng hành tri thức siêu việt",         tier:"epic"},
    {id:"pet_dragon",    type:"pets", e:"🐉",    name:"Rồng Lửa Cổ Đại",       price: 850,  desc:"Oai vệ, phun ra lửa sao lấp lánh",               tier:"epic"},

    // ── Tier 4: Legendary (1200–3000 xu) ───────────────────
    {id:"pet_pegasus",   type:"pets", e:"🦄✨",  name:"Pegasus Cánh Trắng",    price: 1200, desc:"Tuấn mã có cánh bay xuyên mây trời",             tier:"legendary"},
    {id:"pet_kraken",    type:"pets", e:"🐙🌊",  name:"Kraken Đại Dương",      price: 1500, desc:"Quái vật biển sâu huyền thoại, tám xúc tu khổng lồ", tier:"legendary"},
    {id:"pet_kitsune",   type:"pets", e:"🦊✨",  name:"Hồ Ly Chín Đuôi",       price: 1800, desc:"Linh thú thần thoại, mỗi đuôi một phép màu",     tier:"legendary"},
    {id:"pet_celestial", type:"pets", e:"🌟🦌",  name:"Hươu Tinh Tú",          price: 2200, desc:"Sừng dát kim cương, móng tỏa sáng dải ngân hà",  tier:"legendary"},
    {id:"pet_dragon_ice",type:"pets", e:"🐲❄️",  name:"Rồng Băng Vĩnh Cửu",    price: 2800, desc:"Rồng cổ đại bao phủ băng ngàn năm",              tier:"legendary"},
    {id:"pet_supreme",   type:"pets", e:"👑🦁",  name:"Sư Tử Vương Mặt Trời",  price: 3500, desc:"Vua của muôn loài, bờm rực lửa thiêng",          tier:"legendary"},
  ],

  skins: [
    // ── Common (80–200 xu) ────────────────────────────────
    {id:"theme_candy",    type:"skins", e:"🍬", name:"Kẹo Ngọt Hồng",      price: 80,   desc:"Tông màu kẹo hồng đáng yêu",          class:"theme-candy",    tier:"common"},
    {id:"theme_ocean",    type:"skins", e:"🌊", name:"Đại Dương Xanh",      price: 100,  desc:"Màu xanh tươi mát của sóng biển",      class:"theme-ocean",    tier:"common"},
    {id:"theme_forest",   type:"skins", e:"🌲", name:"Rừng Rậm Kỳ Bí",     price: 150,  desc:"Màu xanh ngọc êm dịu, sảng khoái",    class:"theme-forest",   tier:"common"},
    {id:"theme_sunset",   type:"skins", e:"🌅", name:"Hoàng Hôn Ấm Áp",    price: 180,  desc:"Ánh sáng rực rỡ đầy năng lượng",      class:"theme-sunset",   tier:"common"},

    // ── Rare (300–600 xu) ─────────────────────────────────
    {id:"theme_sakura",   type:"skins", e:"🌸", name:"Hoa Anh Đào",         price: 350,  desc:"Cánh hoa hồng bay khắp màn hình",      class:"theme-sakura",   tier:"rare"},
    {id:"theme_mint",     type:"skins", e:"🌿", name:"Bạc Hà Mát Lạnh",    price: 380,  desc:"Tươi mát màu lá bạc hà non",           class:"theme-mint",     tier:"rare"},
    {id:"theme_lavender", type:"skins", e:"💜", name:"Hoa Oải Hương",       price: 450,  desc:"Tím dịu nhẹ thoang thoảng",            class:"theme-lavender", tier:"rare"},
    {id:"theme_peach",    type:"skins", e:"🍑", name:"Đào Mật Ngọt",        price: 500,  desc:"Vàng cam ngọt ngào như mật đào",       class:"theme-peach",    tier:"rare"},

    // ── Epic (700–1200 xu) ────────────────────────────────
    {id:"theme_space",    type:"skins", e:"🌌", name:"Vũ Trụ Huyền Bí",     price: 750,  desc:"Không gian tối lung linh đầy sao",     class:"theme-space",    tier:"epic"},
    {id:"theme_neon",     type:"skins", e:"💎", name:"Neon Tương Lai",      price: 900,  desc:"Đèn neon rực rỡ phong cách cyberpunk", class:"theme-neon",     tier:"epic"},
    {id:"theme_aurora",   type:"skins", e:"🌠", name:"Cực Quang Phương Bắc",price: 1100, desc:"Dải sáng kỳ ảo nhảy múa trên trời",    class:"theme-aurora",   tier:"epic"},

    // ── Legendary (1500+ xu) ──────────────────────────────
    {id:"theme_galaxy",   type:"skins", e:"🌠", name:"Thiên Hà Vô Tận",     price: 1800, desc:"Cả dải ngân hà thu nhỏ trong màn hình",class:"theme-galaxy",   tier:"legendary"},
    {id:"theme_royal",    type:"skins", e:"👑", name:"Hoàng Tộc Vàng",      price: 2500, desc:"Đẳng cấp hoàng gia dát vàng",          class:"theme-royal",    tier:"legendary"},
  ],

  badges: [
    // ── Khởi đầu ─────────────────────────────────────────
    {id:"first",          type:"badges", e:"🌟", name:"Khởi Đầu",          price: 0,    desc:"Có được khi bắt đầu hành trình",              tier:"common"},

    // ── Tích lũy sao ─────────────────────────────────────
    {id:"star50",         type:"badges", e:"✨", name:"Ngôi Sao Sáng",     price: 60,   desc:"Tích lũy được 50 sao lấp lánh",               tier:"common"},
    {id:"star100",        type:"badges", e:"💫", name:"Vũ Trụ Sao",        price: 120,  desc:"Cực kỳ chăm chỉ vượt bậc",                    tier:"common"},
    {id:"star500",        type:"badges", e:"🌠", name:"Thiên Hà Sao",      price: 350,  desc:"Sưu tầm 500 sao — quá ấn tượng!",             tier:"rare"},
    {id:"star1000",       type:"badges", e:"🌌", name:"Vô Cực Sao",        price: 800,  desc:"1000 sao — bậc thầy tuyệt đối",               tier:"epic"},

    // ── Của cải ──────────────────────────────────────────
    {id:"badge_rich",     type:"badges", e:"💰", name:"Nhà Giàu",          price: 200,  desc:"Sở hữu hơn 200 đồng xu",                      tier:"rare"},
    {id:"badge_tycoon",   type:"badges", e:"💎", name:"Tỷ Phú Kim Cương",  price: 500,  desc:"Đẳng cấp tài chính siêu việt",                tier:"epic"},

    // ── Danh hiệu ────────────────────────────────────────
    {id:"badge_master",   type:"badges", e:"👑", name:"Vua Trò Chơi",      price: 600,  desc:"Danh hiệu cho bé tài năng nhất",              tier:"epic"},
    {id:"badge_legend",   type:"badges", e:"🏆", name:"Huyền Thoại",        price: 1200, desc:"Đỉnh cao thành tựu — danh hiệu cao nhất",     tier:"legendary"},

    // ── Kỹ năng ──────────────────────────────────────────
    {id:"badge_speech",   type:"badges", e:"🎤", name:"Giọng Vàng",         price: 250,  desc:"Phát âm tiếng Anh chuẩn xuất sắc",            tier:"rare"},
    {id:"badge_reader",   type:"badges", e:"📚", name:"Mọt Sách",           price: 280,  desc:"Đọc hết 20 truyện song ngữ",                  tier:"rare"},
    {id:"badge_writer",   type:"badges", e:"✏️", name:"Cây Bút Trẻ",       price: 320,  desc:"Viết chính tả không sai 1 chữ",               tier:"rare"},
    {id:"badge_grammar",  type:"badges", e:"📝", name:"Bậc Thầy Ngữ Pháp",  price: 450,  desc:"Chinh phục ngữ pháp khó nhằn",                tier:"epic"},
    {id:"badge_streak",   type:"badges", e:"🔥", name:"Lửa Học Tập",        price: 380,  desc:"Học liên tiếp 30 ngày không nghỉ",            tier:"epic"},
    {id:"badge_polyglot", type:"badges", e:"🌍", name:"Công Dân Toàn Cầu",  price: 1500, desc:"Đạt trình độ B2 — giao tiếp như người bản xứ", tier:"legendary"},
  ],
};

export const QUEST_POOL = [
  { type: "speech",         text: "Phát âm đúng 3 từ tiếng Anh bằng Micro 🎙️",           target: 3, rewardStars: 25, rewardCoins: 8  },
  { type: "story",          text: "Đọc và trả lời xong 1 câu truyện song ngữ 📖",          target: 1, rewardStars: 30, rewardCoins: 10 },
  { type: "picture_correct",text: "Trả lời đúng 5 từ đoán hình 🖼️",                        target: 5, rewardStars: 20, rewardCoins: 6  },
  { type: "write_correct",  text: "Tập viết gõ đúng chính tả 3 từ vựng ✏️",               target: 3, rewardStars: 25, rewardCoins: 8  },
  { type: "memory_match",   text: "Tìm cặp đúng 4 lần trong Lật Thẻ Trí Nhớ 🃏",          target: 4, rewardStars: 20, rewardCoins: 6  },
  { type: "arena_win",      text: "Đánh bại Cú Cốc Cốc AI trong Cú Đối Đầu 🦉⚡",         target: 1, rewardStars: 35, rewardCoins: 12 },
];
