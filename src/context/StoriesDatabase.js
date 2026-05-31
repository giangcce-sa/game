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
  }
];
