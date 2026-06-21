// Interactive stories database for children (Góc Đọc Truyện Tương Tác)
// Contains bilingual text, animated emoji illustrations, word tooltip translations, and comprehension quizzes.

export const STORIES_DATABASE = [
  {
    id: "story_tortoise",
    title: "The Tortoise and the Hare",
    e: "🐢🐰",
    category: "Ngụ Ngôn 🎭",
    gradeLevel: "Lớp 1 - 2 🐥",
    desc: "Câu chuyện rùa và thỏ thi chạy. Dạy bé sự kiên trì, không chủ quan khinh địch.",
    pages: [
      {
        text: "The Hare is very fast and proud.",
        vi: "Chú Thỏ rất nhanh nhẹn nhưng kiêu ngạo.",
        img: "🐰⚡✨",
        wordsVi: {
          "the": "từ chỉ định", "hare": "con thỏ", "is": "thì, là", "very": "rất",
          "fast": "nhanh", "and": "và", "proud": "kiêu ngạo, tự hào"
        }
      },
      {
        text: "The Tortoise walks slowly but never stops.",
        vi: "Chú Rùa đi bộ chậm chạp nhưng không bao giờ dừng lại.",
        img: "🐢🚶🛤️",
        wordsVi: {
          "the": "từ chỉ định", "tortoise": "con rùa", "walks": "đi bộ", "slowly": "chậm chạp",
          "but": "nhưng", "never": "không bao giờ", "stops": "dừng lại"
        }
      },
      {
        text: "The Hare falls asleep under a green tree.",
        vi: "Chú Thỏ ngủ quên dưới một gốc cây xanh mát.",
        img: "🐰😴🌳💤",
        wordsVi: {
          "the": "từ chỉ định", "hare": "con thỏ", "falls": "bị rơi vào", "asleep": "buồn ngủ, ngủ quên",
          "under": "ở dưới", "a": "một", "green": "màu xanh lá", "tree": "cái cây"
        }
      },
      {
        text: "The Tortoise wins the golden trophy!",
        vi: "Chú Rùa kiên trì đã chiến thắng và nhận cúp vàng!",
        img: "🐢🏆🎉✨",
        wordsVi: {
          "the": "từ chỉ định", "tortoise": "con rùa", "wins": "chiến thắng", "golden": "bằng vàng",
          "trophy": "chiếc cúp, phần thưởng"
        }
      }
    ],
    quiz: [
      {
        q: "Who falls asleep under the tree?",
        opts: ["The Tortoise", "The Hare", "The Bird"],
        ans: "The Hare"
      },
      {
        q: "Who wins the golden trophy?",
        opts: ["The Hare", "The Fox", "The Tortoise"],
        ans: "The Tortoise"
      }
    ]
  },
  {
    id: "story_lion_mouse",
    title: "The Lion and the Mouse",
    e: "🦁🐭",
    category: "Bài Học Cuộc Sống 🌱",
    gradeLevel: "Lớp 1 - 2 🐥",
    desc: "Chú chuột nhỏ bé cứu mạng chúa sơn lâm. Dạy bé bài học về lòng biết ơn và tôn trọng bạn bè.",
    pages: [
      {
        text: "A big Lion is sleeping in the jungle.",
        vi: "Một chú Sư Tử to lớn đang ngủ trong rừng sâu.",
        img: "🦁😴🌳🌳",
        wordsVi: {
          "a": "một", "big": "to lớn", "lion": "sư tử", "is": "thì, là", "sleeping": "đang ngủ",
          "in": "ở trong", "the": "từ chỉ định", "jungle": "rừng rậm nhiệt đới"
        }
      },
      {
        text: "A small Mouse plays on the Lion's nose.",
        vi: "Chú Chuột nhỏ nghịch ngợm chơi đùa trên mũi Sư Tử.",
        img: "🦁👃🐭🤪",
        wordsVi: {
          "a": "một", "small": "nhỏ bé", "mouse": "con chuột", "plays": "chơi đùa",
          "on": "ở trên", "the": "từ chỉ định", "lion's": "của sư tử", "nose": "cái mũi"
        }
      },
      {
        text: "Hunters catch the Lion with a strong net.",
        vi: "Những người thợ săn bẫy được Sư Tử bằng một chiếc lưới chắc chắn.",
        img: "🧑‍🌾🕸️🦁😭",
        wordsVi: {
          "hunters": "thợ săn", "catch": "bắt giữ", "the": "từ chỉ định", "lion": "sư tử",
          "with": "với, bằng", "a": "một", "strong": "mạnh mẽ, chắc chắn", "net": "chiếc bẫy lưới"
        }
      },
      {
        text: "The Mouse chews the net and saves the Lion!",
        vi: "Chú Chuột gặm đứt mắt lưới và cứu thoát Sư Tử!",
        img: "🐭🦷🕸️🦁😃",
        wordsVi: {
          "the": "từ chỉ định", "mouse": "con chuột", "chews": "gặm nhấm, nhai", "net": "chiếc bẫy lưới",
          "and": "và", "saves": "cứu giúp", "lion": "sư tử"
        }
      }
    ],
    quiz: [
      {
        q: "Who plays on the Lion's nose?",
        opts: ["The Fox", "The Mouse", "The Monkey"],
        ans: "The Mouse"
      },
      {
        q: "How does the Mouse save the Lion?",
        opts: ["By chewing the net", "By fighting hunters", "By running away"],
        ans: "By chewing the net"
      }
    ]
  },
  {
    id: "story_starfruit",
    title: "The Golden Starfruit Tree",
    e: "🌳🪙",
    category: "Cổ Tích VN 🌾",
    gradeLevel: "Lớp 3 - 5 🎓",
    desc: "Truyện cổ tích Cây Khế Việt Nam. Dạy bé sự trung thực, chia sẻ và trừng trị kẻ tham lam.",
    pages: [
      {
        text: "The kind younger brother has a starfruit tree.",
        vi: "Người em trai tốt bụng sở hữu một cây khế ngọt.",
        img: "🧑‍🌾🏡🌳⭐",
        wordsVi: {
          "the": "từ chỉ định", "kind": "tốt bụng, hiền lành", "younger": "trẻ hơn, em",
          "brother": "anh em trai", "has": "sở hữu, có", "a": "một", "starfruit": "quả khế", "tree": "cái cây"
        }
      },
      {
        text: "A giant Raven eats the starfruits and promises gold.",
        vi: "Một chú Chim Phượng Hoàng khổng lồ đến ăn khế và hứa trả bằng vàng.",
        img: "🦅🍎🪙✨",
        wordsVi: {
          "a": "một", "giant": "khổng lồ", "raven": "con quạ lớn, chim phượng hoàng", "eats": "ăn uống",
          "the": "từ chỉ định", "starfruits": "những quả khế", "and": "và", "promises": "hứa hẹn", "gold": "vàng bạc"
        }
      },
      {
        text: "The brother sews a three-span bag for gold.",
        vi: "Người em may chiếc túi ba gang xinh xắn để đựng vàng.",
        img: "🧑‍🌾🧵👜🪙",
        wordsVi: {
          "the": "từ chỉ định", "brother": "anh em trai", "sews": "khâu vá, may vá", "a": "một",
          "three-span": "ba gang tay", "bag": "chiếc cặp, túi xách", "for": "dành cho, để đựng", "gold": "vàng"
        }
      },
      {
        text: "The greedy older brother makes a giant bag and falls.",
        vi: "Người anh tham lam may chiếc túi khổng lồ và bị rơi xuống biển.",
        img: "👨‍💼🦖🛍️🌊",
        wordsVi: {
          "the": "từ chỉ định", "greedy": "tham lam", "older": "lớn tuổi hơn, anh", "brother": "anh em trai",
          "makes": "làm ra, may ra", "a": "một", "giant": "khổng lồ", "bag": "chiếc túi", "and": "và", "falls": "bị rơi ngã"
        }
      }
    ],
    quiz: [
      {
        q: "What tree does the younger brother have?",
        opts: ["An Apple Tree", "A Starfruit Tree", "A Banana Tree"],
        ans: "A Starfruit Tree"
      },
      {
        q: "How big was the younger brother's bag?",
        opts: ["Three-span bag", "Ten-span bag", "A giant bag"],
        ans: "Three-span bag"
      }
    ]
  },
  {
    id: "story_ant_grasshopper",
    title: "The Ant and the Grasshopper",
    e: "🐜🦗",
    category: "Ngụ Ngôn 🎭",
    gradeLevel: "Lớp 3 - 5 🎓",
    desc: "Chuyện kiến và ve sầu. Ve sầu mải chơi không trữ thức ăn cho mùa đông lạnh giá.",
    pages: [
      {
        text: "In summer, the clever Ant collects food all day.",
        vi: "Vào mùa hè, chú Kiến thông minh thu thập thức ăn cả ngày.",
        img: "☀️🐜🌾🍇",
        wordsVi: {
          "in": "vào trong", "summer": "mùa hè", "the": "từ chỉ định", "clever": "thông minh",
          "ant": "con kiến", "collects": "thu thập, tích trữ", "food": "thức ăn", "all": "tất cả", "day": "ngày"
        }
      },
      {
        text: "The Grasshopper sings songs and plays in the grass.",
        vi: "Chú Ve Sầu chỉ mải mê ca hát và vui chơi trong bãi cỏ.",
        img: "🦗🎤🎸🌱",
        wordsVi: {
          "the": "từ chỉ định", "grasshopper": "con ve sầu, châu chấu", "sings": "ca hát",
          "songs": "những bài hát", "and": "và", "plays": "vui chơi", "in": "ở trong", "grass": "bãi cỏ"
        }
      },
      {
        text: "Winter comes with cold wind and white snow.",
        vi: "Mùa đông buốt giá tràn về cùng gió lạnh và tuyết trắng.",
        img: "❄️🌬️❄️🌨️",
        wordsVi: {
          "winter": "mùa đông", "comes": "đi tới, tràn về", "with": "với, cùng", "cold": "lạnh lẽo",
          "wind": "cơn gió", "and": "và", "white": "màu trắng", "snow": "tuyết rơi"
        }
      },
      {
        text: "The hungry Grasshopper learns a very big lesson.",
        vi: "Chú Ve Sầu đói lả đã rút ra một bài học cực kỳ sâu sắc.",
        img: "🦗😭🥶🐜",
        wordsVi: {
          "the": "từ chỉ định", "hungry": "đói lả, đói bụng", "grasshopper": "con ve sầu",
          "learns": "học tập, rút ra", "a": "một", "very": "rất", "big": "to lớn, sâu sắc", "lesson": "bài học"
        }
      }
    ],
    quiz: [
      {
        q: "What does the Ant do in summer?",
        opts: ["Sings songs", "Collects food", "Goes to sleep"],
        ans: "Collects food"
      },
      {
        q: "Why is the Grasshopper hungry in winter?",
        opts: ["Because it slept", "Because it lost food", "Because it only sang and played"],
        ans: "Because it only sang and played"
      }
    ]
  },
  {
    id: "story_fox_grapes",
    title: "The Fox and the Grapes",
    e: "🦊🍇",
    category: "Ngụ Ngôn 🎭",
    gradeLevel: "Lớp 3 - 5 🎓",
    desc: "Chuyện con cáo và chùm nho. Bài học về sự từ bỏ và không nên chê bai thứ mình không đạt được.",
    pages: [
      {
        text: "A hungry fox walks in the forest.",
        vi: "Một con cáo đói bụng đang đi dạo trong rừng.",
        img: "🦊🚶🌳",
        wordsVi: {
          "a": "một", "hungry": "đói", "fox": "con cáo", "walks": "đi bộ", "in": "ở trong", "the": "từ chỉ định", "forest": "khu rừng"
        }
      },
      {
        text: "He sees some sweet purple grapes.",
        vi: "Nó nhìn thấy những chùm nho màu tím ngọt ngào.",
        img: "🦊👀🍇😋",
        wordsVi: {
          "he": "anh ấy, nó", "sees": "nhìn thấy", "some": "vài", "sweet": "ngọt ngào", "purple": "màu tím", "grapes": "nho"
        }
      },
      {
        text: "The fox jumps high but cannot reach them.",
        vi: "Con cáo nhảy thật cao nhưng không thể với tới chúng.",
        img: "🦊⬆️🚫🍇",
        wordsVi: {
          "the": "từ chỉ định", "fox": "con cáo", "jumps": "nhảy lên", "high": "cao", "but": "nhưng", "cannot": "không thể", "reach": "với tới", "them": "chúng"
        }
      },
      {
        text: "He says the grapes are sour and leaves.",
        vi: "Nó nói rằng những quả nho này bị chua và bỏ đi.",
        img: "🦊🗣️🍋🚶",
        wordsVi: {
          "he": "anh ấy, nó", "says": "nói", "the": "từ chỉ định", "grapes": "nho", "are": "thì, là", "sour": "chua", "and": "và", "leaves": "rời đi"
        }
      }
    ],
    quiz: [
      {
        q: "What does the fox see?",
        opts: ["Apples", "Grapes", "Bananas"],
        ans: "Grapes"
      },
      {
        q: "Why does the fox leave?",
        opts: ["He is not hungry", "He eats them all", "He cannot reach them"],
        ans: "He cannot reach them"
      }
    ]
  },
  {
    id: "story_boy_wolf",
    title: "The Boy Who Cried Wolf",
    e: "👦🐺",
    category: "Ngụ Ngôn 🎭",
    gradeLevel: "Lớp 3 - 5 🎓",
    desc: "Cậu bé chăn cừu hay nói dối. Bài học về sự trung thực và hậu quả của việc nói dối.",
    pages: [
      {
        text: "A young boy watches his sheep on a hill.",
        vi: "Một cậu bé đang chăn bầy cừu của mình trên đồi.",
        img: "👦🐑⛰️",
        wordsVi: {
          "a": "một", "young": "trẻ tuổi", "boy": "cậu bé", "watches": "trông coi, xem", "his": "của anh ấy", "sheep": "con cừu", "on": "trên", "hill": "ngọn đồi"
        }
      },
      {
        text: "He shouts 'Wolf, wolf!' for fun.",
        vi: "Cậu bé hét lên 'Sói, sói!' để đùa nghịch.",
        img: "👦🗣️🐺😂",
        wordsVi: {
          "he": "cậu ấy", "shouts": "hét lên", "wolf": "chó sói", "for": "cho", "fun": "niềm vui, đùa nghịch"
        }
      },
      {
        text: "People run to help but see no wolf.",
        vi: "Mọi người chạy đến giúp nhưng không thấy con sói nào.",
        img: "🏃‍♂️👀🚫🐺",
        wordsVi: {
          "people": "mọi người", "run": "chạy", "to": "đến", "help": "giúp đỡ", "but": "nhưng", "see": "nhìn thấy", "no": "không có", "wolf": "chó sói"
        }
      },
      {
        text: "A real wolf comes and nobody helps him.",
        vi: "Một con sói thật sự đến và không có ai giúp cậu bé.",
        img: "🐺🐑👦😭",
        wordsVi: {
          "a": "một", "real": "thật sự", "wolf": "chó sói", "comes": "đến", "and": "và", "nobody": "không có ai", "helps": "giúp đỡ", "him": "cậu ấy"
        }
      }
    ],
    quiz: [
      {
        q: "What does the boy watch?",
        opts: ["Cows", "Sheep", "Pigs"],
        ans: "Sheep"
      },
      {
        q: "Why does nobody help him at the end?",
        opts: ["They don't hear him", "They think he is lying again", "They are scared"],
        ans: "They think he is lying again"
      }
    ]
  },
  {
    id: "story_crow",
    title: "The Thirsty Crow",
    e: "🐦🏺",
    category: "Bài Học Cuộc Sống 🌱",
    gradeLevel: "Lớp 1 - 2 🐥",
    desc: "Chú quạ khát nước thông minh dùng sỏi để dâng nước lên. Dạy bé tư duy thông minh và kiên trì.",
    pages: [
      {
        text: "A thirsty Crow finds a deep water jug.",
        vi: "Một chú Quạ khát nước tìm thấy một chiếc bình nước sâu.",
        img: "🐦🥵🏺💧",
        wordsVi: {
          "a": "một", "thirsty": "khát nước", "crow": "con quạ", "finds": "tìm thấy", "deep": "sâu", "water": "nước", "jug": "chiếc bình"
        }
      },
      {
        text: "He cannot reach the water at the bottom.",
        vi: "Chú quạ không thể với tới nước ở dưới đáy bình.",
        img: "🐦🚫🏺😭",
        wordsVi: {
          "he": "cậu ấy, nó", "cannot": "không thể", "reach": "với tới", "the": "từ chỉ định", "water": "nước", "at": "ở tại", "bottom": "đáy bình"
        }
      },
      {
        text: "The clever Crow drops small stones into the jug.",
        vi: "Chú Quạ thông minh thả từng viên sỏi nhỏ vào bình.",
        img: "🐦🪨🏺✨",
        wordsVi: {
          "the": "từ chỉ định", "clever": "thông minh", "crow": "con quạ", "drops": "thả vào, làm rơi", "small": "nhỏ", "stones": "những viên sỏi", "into": "vào trong", "jug": "chiếc bình"
        }
      },
      {
        text: "The water rises and the Crow drinks happily.",
        vi: "Nước dâng cao lên và chú Quạ đã được uống nước vui vẻ.",
        img: "🐦🏺💧😀",
        wordsVi: {
          "the": "từ chỉ định", "water": "nước", "rises": "dâng lên, mọc lên", "and": "và", "crow": "con quạ", "drinks": "uống", "happily": "vui vẻ, hạnh phúc"
        }
      }
    ],
    quiz: [
      {
        q: "What does the Crow drop into the jug?",
        opts: ["Food", "Stones", "Flowers"],
        ans: "Stones"
      },
      {
        q: "Why does the Crow drop stones?",
        opts: ["To make water rise", "To play a game", "To break the jug"],
        ans: "To make water rise"
      }
    ]
  },
  {
    id: "story_butterfly",
    title: "The Life Cycle of a Butterfly",
    e: "🐛🦋",
    category: "Khoa Học Kỳ Thú 🚀",
    gradeLevel: "Lớp 1 - 2 🐥",
    desc: "Khám phá vòng đời kỳ diệu của bạn bướm xinh đẹp. Dạy bé kiến thức khoa học tự nhiên thú vị.",
    pages: [
      {
        text: "A small egg sits on a green leaf.",
        vi: "Một chiếc trứng nhỏ nằm xinh xắn trên chiếc lá xanh.",
        img: "🥚🍃🌳✨",
        wordsVi: {
          "a": "một", "small": "nhỏ", "egg": "quả trứng", "sits": "nằm, ngồi", "on": "trên", "green": "màu xanh lá", "leaf": "chiếc lá"
        }
      },
      {
        text: "A hungry Caterpillar crawls out and eats leaves.",
        vi: "Một chú Sâu bướm đói bụng bò ra và ăn lá cây.",
        img: "🐛😋🍃🌳",
        wordsVi: {
          "a": "một", "hungry": "đói bụng", "caterpillar": "sâu bướm", "crawls": "bò trườn", "out": "ra ngoài", "and": "và", "eats": "ăn", "leaves": "những chiếc lá"
        }
      },
      {
        text: "It makes a warm cocoon and sleeps inside.",
        vi: "Chú sâu tự làm chiếc kén ấm áp và ngủ ngoan bên trong.",
        img: "🛌🪹😴💤",
        wordsVi: {
          "it": "nó", "makes": "làm ra", "a": "một", "warm": "ấm áp", "cocoon": "chiếc kén tơ", "and": "và", "sleeps": "ngủ", "inside": "bên trong"
        }
      },
      {
        text: "A beautiful Butterfly flies into the blue sky!",
        vi: "Một bạn Bướm xinh đẹp bay vút lên bầu trời xanh!",
        img: "🦋🌈🌤️✨",
        wordsVi: {
          "a": "một", "beautiful": "xinh đẹp", "butterfly": "con bướm", "flies": "bay lượn", "into": "vào trong", "the": "từ chỉ định", "blue": "màu xanh dương", "sky": "bầu trời"
        }
      }
    ],
    quiz: [
      {
        q: "What crawls out of the small egg?",
        opts: ["A Butterfly", "A Caterpillar", "A Bird"],
        ans: "A Caterpillar"
      },
      {
        q: "What does the Caterpillar make to sleep inside?",
        opts: ["A house", "A warm cocoon", "A bird nest"],
        ans: "A warm cocoon"
      }
    ]
  },
  {
    id: "story_solar",
    title: "The Solar System Journey",
    e: "🪐🚀",
    category: "Khoa Học Kỳ Thú 🚀",
    gradeLevel: "Lớp 3 - 5 🎓",
    desc: "Du hành vũ trụ cùng phi thuyền khám phá Hệ Mặt Trời. Học tên các hành tinh tuyệt đẹp.",
    pages: [
      {
        text: "The hot Sun sits at the center of space.",
        vi: "Mặt trời rực lửa nằm ở trung tâm của vũ trụ bao la.",
        img: "☀️🌌☄️🪐",
        wordsVi: {
          "the": "từ chỉ định", "hot": "nóng bức", "sun": "mặt trời", "sits": "nằm ở", "at": "tại", "center": "trung tâm", "of": "của", "space": "không gian vũ trụ"
        }
      },
      {
        text: "Earth is our beautiful blue home planet.",
        vi: "Trái Đất là hành tinh xanh quê hương xinh đẹp của chúng ta.",
        img: "🌍🌳💙🌌",
        wordsVi: {
          "earth": "trái đất", "is": "là", "our": "của chúng ta", "beautiful": "xinh đẹp", "blue": "xanh dương", "home": "nhà, quê hương", "planet": "hành tinh"
        }
      },
      {
        text: "Giant Jupiter is the biggest planet of all.",
        vi: "Sao Mộc khổng lồ là hành tinh to lớn nhất trong tất cả.",
        img: "🪐👑🌌✨",
        wordsVi: {
          "giant": "khổng lồ", "jupiter": "sao mộc", "is": "là", "the": "từ chỉ định", "biggest": "to lớn nhất", "planet": "hành tinh", "of": "của", "all": "tất cả"
        }
      },
      {
        text: "Rockets travel fast to explore mysterious stars.",
        vi: "Những chiếc tên lửa bay cực nhanh để khám phá các vì sao bí ẩn.",
        img: "🚀☄️🌟✨",
        wordsVi: {
          "rockets": "những tên lửa", "travel": "du hành, đi lại", "fast": "nhanh", "to": "để", "explore": "khám phá", "mysterious": "bí ẩn, kỳ bí", "stars": "những ngôi sao"
        }
      }
    ],
    quiz: [
      {
        q: "Which planet is the biggest in our solar system?",
        opts: ["Earth", "Mars", "Jupiter"],
        ans: "Jupiter"
      },
      {
        q: "What is Earth's color in space?",
        opts: ["Red", "Blue", "Green"],
        ans: "Blue"
      }
    ]
  },
  {
    id: "story_chung",
    title: "The Legend of Banh Chung",
    e: "🌾🍃",
    category: "Cổ Tích VN 🌾",
    gradeLevel: "Lớp 3 - 5 🎓",
    desc: "Sự tích Bánh Chưng Bánh Dầy ngày Tết Việt Nam. Dạy bé lòng hiếu thảo và tình yêu cội nguồn.",
    pages: [
      {
        text: "King Hung wants to choose a new king.",
        vi: "Vua Hùng vương muốn chọn một vị vua hiền đức mới để truyền ngôi.",
        img: "👑👨‍💼🏰🌾",
        wordsVi: {
          "king": "vua", "hung": "hùng vương", "wants": "muốn", "to": "để", "choose": "lựa chọn", "a": "một", "new": "mới"
        }
      },
      {
        text: "Prince Lang Lieu is poor but very kind.",
        vi: "Hoàng tử Lang Liêu nghèo khó nhưng rất hiền lành hiếu thảo.",
        img: "🧑‍🌾🏡❤️🌾",
        wordsVi: {
          "prince": "hoàng tử", "lang": "lang", "lieu": "liêu", "is": "thì, là", "poor": "nghèo khó", "but": "nhưng", "very": "rất", "kind": "tốt bụng, hiền hậu"
        }
      },
      {
        text: "He makes square cakes from green rice leaves.",
        vi: "Chàng may mắn nghĩ ra cách làm bánh chưng vuông từ hạt gạo và lá dong xanh.",
        img: "🧑‍🌾🍃🌾🟩",
        wordsVi: {
          "he": "chàng, nó", "makes": "làm ra, gói ra", "square": "hình vuông", "cakes": "những chiếc bánh", "from": "từ", "green": "xanh", "rice": "gạo, lúa nước", "leaves": "lá cây"
        }
      },
      {
        text: "Lang Lieu becomes the king on Tet holiday!",
        vi: "Lang Liêu đã được truyền ngôi vua xứng đáng vào dịp Tết cổ truyền!",
        img: "👑🎉🌾✨",
        wordsVi: {
          "lang": "lang", "lieu": "liêu", "becomes": "trở thành", "the": "từ chỉ định", "king": "vua", "on": "vào dịp", "tet": "tết", "holiday": "ngày lễ"
        }
      }
    ],
    quiz: [
      {
        q: "Who made the square cakes?",
        opts: ["King Hung", "Prince Lang Lieu", "The Raven"],
        ans: "Prince Lang Lieu"
      },
      {
        q: "What shape are the cakes made by Lang Lieu?",
        opts: ["Circle", "Triangle", "Square"],
        ans: "Square"
      }
    ]
  }
];

