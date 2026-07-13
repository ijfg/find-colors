export const translations = {
  appName: { en: "Find Colors", "zh-Hans": "找颜色", "zh-Hant": "找顏色" },
  theme: {
    label: { en: "Theme", "zh-Hans": "主题", "zh-Hant": "主題" },
    light: { en: "Light", "zh-Hans": "浅色", "zh-Hant": "淺色" },
    dark: { en: "Dark", "zh-Hans": "深色", "zh-Hant": "深色" },
  },
  language: {
    label: { en: "Language", "zh-Hans": "语言", "zh-Hant": "語言" },
  },
  home: {
    chooseDifficulty: {
      en: "Choose difficulty",
      "zh-Hans": "选难度",
      "zh-Hant": "選難度",
    },
    pickPhoto: {
      en: "Pick a photo",
      "zh-Hans": "选照片",
      "zh-Hant": "選照片",
    },
    generating: { en: "Generating...", "zh-Hans": "生成中…", "zh-Hant": "生成中…" },
    cantProcess: {
      en: "Couldn't process this photo. Try another.",
      "zh-Hans": "无法处理该图片，请换一张试试。",
      "zh-Hant": "無法處理該圖片，請換一張試試。",
    },
    cantRegenerate: {
      en: "Couldn't generate new colors. Try another photo.",
      "zh-Hans": "无法重新生成目标色，请换一张试试。",
      "zh-Hant": "無法重新生成目標色，請換一張試試。",
    },
    dailyChallenge: {
      en: "Daily challenge",
      "zh-Hans": "每日挑战",
      "zh-Hant": "每日挑戰",
    },
    comingSoon: {
      en: "Coming soon",
      "zh-Hans": "即将推出",
      "zh-Hant": "即將推出",
    },
    soloGame: {
      en: "Solo game",
      "zh-Hans": "单机游戏",
      "zh-Hant": "單機遊戲",
    },
  },
  difficulty: {
    one: { en: "1 color", "zh-Hans": "1 色", "zh-Hant": "1 色" },
    four: { en: "4 colors", "zh-Hans": "4 色", "zh-Hant": "4 色" },
    nine: { en: "9 colors", "zh-Hans": "9 色", "zh-Hant": "9 色" },
    sixteen: { en: "16 colors", "zh-Hans": "16 色", "zh-Hant": "16 色" },
  },
  game: {
    target: { en: "Target", "zh-Hans": "目标", "zh-Hant": "目標" },
    yours: { en: "You", "zh-Hans": "你的", "zh-Hant": "你的" },
    yoursCount: {
      en: "You ({filled}/{count})",
      "zh-Hans": "你的 ({filled}/{count})",
      "zh-Hant": "你的 ({filled}/{count})",
    },
    submit: { en: "Submit", "zh-Hans": "提交", "zh-Hant": "提交" },
    clear: { en: "Clear", "zh-Hans": "清空", "zh-Hant": "清空" },
    clearLong: { en: "Clear all", "zh-Hans": "清空重填", "zh-Hant": "清空重填" },
    newPhoto: { en: "New photo", "zh-Hans": "换图", "zh-Hant": "換圖" },
    newPhotoLong: {
      en: "Pick another photo",
      "zh-Hans": "换一张照片",
      "zh-Hant": "換一張照片",
    },
    fillingHint: {
      en: "Filling cell {n} · tap the photo to pick",
      "zh-Hans": "正在填第 {n} 格 · 在照片里点击取色",
      "zh-Hant": "正在填第 {n} 格 · 在照片裡點擊取色",
    },
    clearCell: { en: "Clear", "zh-Hans": "清除", "zh-Hant": "清除" },
    legend: {
      en: "Solid = target · Dashed = your color · Tap a marker for a closeup",
      "zh-Hans": "实线 = 目标色 · 虚线 = 你的 · 点击标记查看截图",
      "zh-Hant": "實線 = 目標色 · 虛線 = 你的 · 點擊標記查看截圖",
    },
    cellTarget: {
      en: "Cell {n} · Target",
      "zh-Hans": "第 {n} 格 · 目标",
      "zh-Hant": "第 {n} 格 · 目標",
    },
    cellYours: {
      en: "Cell {n} · You",
      "zh-Hans": "第 {n} 格 · 你的",
      "zh-Hant": "第 {n} 格 · 你的",
    },
    closeCompare: {
      en: "Close comparison",
      "zh-Hans": "关闭对比",
      "zh-Hant": "關閉對比",
    },
    saveErrorWrite: {
      en: "Score shown but record didn't save (storage may be full).",
      "zh-Hans": "得分已显示，但记录未能写入（可能是浏览器存储空间不足）。",
      "zh-Hant": "得分已顯示，但記錄未能寫入（可能是瀏覽器儲存空間不足）。",
    },
    saveErrorGeneric: {
      en: "Score shown but saving the record failed.",
      "zh-Hans": "得分已显示，但保存记录时出错。",
      "zh-Hant": "得分已顯示，但儲存記錄時出錯。",
    },
  },
  picker: {
    zoomIn: { en: "Zoom in", "zh-Hans": "放大", "zh-Hant": "放大" },
    zoomOut: { en: "Zoom out", "zh-Hans": "缩小", "zh-Hant": "縮小" },
    reset: { en: "Reset", "zh-Hans": "重置", "zh-Hant": "重置" },
    hintTouch: {
      en: "Drag to preview · release to pick · two fingers to zoom/pan",
      "zh-Hans": "单指拖动看色 · 松手取色 · 双指缩放/平移",
      "zh-Hant": "單指拖動看色 · 鬆手取色 · 雙指縮放/平移",
    },
    hintZoomedTouch: {
      en: "Drag to pick · two fingers to pan",
      "zh-Hans": "单指取色 · 双指平移",
      "zh-Hant": "單指取色 · 雙指平移",
    },
    hintMouse: {
      en: "Scroll to zoom · drag to pan when zoomed · click to pick",
      "zh-Hans": "滚轮缩放 · 放大后拖动平移 · 点击取色",
      "zh-Hant": "滾輪縮放 · 放大後拖動平移 · 點擊取色",
    },
  },
  score: {
    total: { en: "Score", "zh-Hans": "总分", "zh-Hant": "總分" },
    resultsTitle: {
      en: "Results",
      "zh-Hans": "结果",
      "zh-Hant": "結果",
    },
    cellLabel: {
      en: "Cell {n}",
      "zh-Hans": "第 {n} 格",
      "zh-Hant": "第 {n} 格",
    },
    targetSmall: { en: "Target", "zh-Hans": "目标", "zh-Hant": "目標" },
    yoursSmall: { en: "You", "zh-Hans": "你的", "zh-Hant": "你的" },
    tapToInspect: {
      en: "Tap a cell to see the closeup",
      "zh-Hans": "点击某一格，在照片上查看局部对比",
      "zh-Hant": "點擊某一格，在照片上查看局部對比",
    },
    playAgain: { en: "Play again", "zh-Hans": "再玩一次", "zh-Hant": "再玩一次" },
    playAgainBusy: {
      en: "Generating...",
      "zh-Hans": "生成中…",
      "zh-Hant": "生成中…",
    },
    newPhoto: {
      en: "New photo",
      "zh-Hans": "换一张照片",
      "zh-Hant": "換一張照片",
    },
    ratings: {
      master: { en: "Color master", "zh-Hans": "色感大师", "zh-Hant": "色感大師" },
      sharp: { en: "Sharp eye", "zh-Hans": "眼力不错", "zh-Hant": "眼力不錯" },
      okay: { en: "Not bad", "zh-Hans": "还可以", "zh-Hant": "還可以" },
      practice: { en: "Keep practicing", "zh-Hans": "再练练", "zh-Hant": "再練練" },
      farOff: { en: "Way off", "zh-Hans": "差得有点远", "zh-Hant": "差得有點遠" },
    },
  },
  records: {
    title: { en: "My records", "zh-Hans": "我的记录", "zh-Hant": "我的記錄" },
    titleShort: { en: "Records", "zh-Hans": "记录", "zh-Hant": "記錄" },
    back: { en: "Back", "zh-Hans": "返回", "zh-Hant": "返回" },
    sortByTime: {
      en: "Sort by time",
      "zh-Hans": "按时间排序",
      "zh-Hant": "按時間排序",
    },
    sortByScore: {
      en: "Sort by score",
      "zh-Hans": "按分数排序",
      "zh-Hant": "按分數排序",
    },
    clearAll: {
      en: "Clear all",
      "zh-Hans": "清空所有记录",
      "zh-Hant": "清空所有記錄",
    },
    empty: {
      en: "No records yet. Play a round and submit to save automatically.",
      "zh-Hans": "还没有记录，玩一局并提交后会自动保存",
      "zh-Hant": "還沒有記錄，玩一局並提交後會自動儲存",
    },
    confirmDelete: {
      en: "Delete this record?",
      "zh-Hans": "确定删除这条记录？",
      "zh-Hant": "確定刪除這條記錄？",
    },
    confirmClearAll: {
      en: "Clear all records? This cannot be undone.",
      "zh-Hans": "确定清空所有记录？此操作不可恢复。",
      "zh-Hant": "確定清空所有記錄？此操作不可恢復。",
    },
    deleteAria: {
      en: "Delete record",
      "zh-Hans": "删除记录",
      "zh-Hant": "刪除記錄",
    },
    roomRank: {
      en: "#{rank}/{total}",
      "zh-Hans": "第 {rank}/{total} 名",
      "zh-Hant": "第 {rank}/{total} 名",
    },
    targetColor: {
      en: "Target color",
      "zh-Hans": "目标色",
      "zh-Hant": "目標色",
    },
    targetColors: {
      en: "Target colors",
      "zh-Hans": "目标色",
      "zh-Hant": "目標色",
    },
    yourColor: {
      en: "Your color",
      "zh-Hans": "你的色",
      "zh-Hant": "你的顏色",
    },
    yourColors: {
      en: "Your colors",
      "zh-Hans": "你的色",
      "zh-Hant": "你的顏色",
    },
    cellLabel: {
      en: "Cell {n}",
      "zh-Hans": "第 {n} 格",
      "zh-Hant": "第 {n} 格",
    },
  },
  a11y: {
    emptyCell: {
      en: "Empty cell {n}",
      "zh-Hans": "空格 {n}",
      "zh-Hant": "空格 {n}",
    },
    colorCell: {
      en: "Color {n} {hex}",
      "zh-Hans": "颜色 {n} {hex}",
      "zh-Hant": "顏色 {n} {hex}",
    },
    waitingFill: {
      en: "Waiting to fill",
      "zh-Hans": "等待填色",
      "zh-Hant": "等待填色",
    },
    colorGrid: {
      en: "Color grid",
      "zh-Hans": "色彩宫格",
      "zh-Hant": "色彩宮格",
    },
    difficulty: { en: "Difficulty", "zh-Hans": "难度", "zh-Hant": "難度" },
  },
  room: {
    playWithFriends: {
      en: "Play with friends",
      "zh-Hans": "和朋友一起玩",
      "zh-Hant": "和朋友一起玩",
    },
    orDivider: { en: "or", "zh-Hans": "或", "zh-Hant": "或" },
    hubTitle: {
      en: "Room game",
      "zh-Hans": "房间游戏",
      "zh-Hant": "房間遊戲",
    },
    createRoom: {
      en: "Create room",
      "zh-Hans": "创建房间",
      "zh-Hant": "創建房間",
    },
    joinRoom: {
      en: "Join room",
      "zh-Hans": "加入房间",
      "zh-Hant": "加入房間",
    },
    backHome: {
      en: "Back to home",
      "zh-Hans": "回到首页",
      "zh-Hant": "回到首頁",
    },
    yourName: {
      en: "Your name",
      "zh-Hans": "你的昵称",
      "zh-Hant": "你的暱稱",
    },
    roomCode: {
      en: "Room code",
      "zh-Hans": "房间码",
      "zh-Hant": "房間碼",
    },
    deadlineMinutes: {
      en: "Deadline (minutes)",
      "zh-Hans": "截止时间（分钟）",
      "zh-Hant": "截止時間（分鐘）",
    },
    creating: {
      en: "Creating room…",
      "zh-Hans": "创建中…",
      "zh-Hant": "創建中…",
    },
    joining: { en: "Joining…", "zh-Hans": "加入中…", "zh-Hant": "加入中…" },
    createFailed: {
      en: "Couldn't create room. Try again.",
      "zh-Hans": "无法创建房间，请重试。",
      "zh-Hant": "無法創建房間，請重試。",
    },
    joinFailed: {
      en: "Couldn't join room. Check the code and try again.",
      "zh-Hans": "无法加入房间，请检查房间码。",
      "zh-Hant": "無法加入房間，請檢查房間碼。",
    },
    lobbyTitle: {
      en: "Room {code}",
      "zh-Hans": "房间 {code}",
      "zh-Hant": "房間 {code}",
    },
    hostLabel: { en: "Host", "zh-Hans": "房主", "zh-Hant": "房主" },
    players: { en: "Players", "zh-Hans": "玩家", "zh-Hant": "玩家" },
    submittedCount: {
      en: "{submitted} / {total} submitted",
      "zh-Hans": "已提交 {submitted} / {total} 人",
      "zh-Hant": "已提交 {submitted} / {total} 人",
    },
    copyLink: {
      en: "Copy link",
      "zh-Hans": "复制链接",
      "zh-Hant": "複製連結",
    },
    copied: { en: "Copied!", "zh-Hans": "已复制", "zh-Hant": "已複製" },
    startGame: {
      en: "Start guessing",
      "zh-Hans": "开始猜色",
      "zh-Hant": "開始猜色",
    },
    waitingTitle: {
      en: "Submitted!",
      "zh-Hans": "已提交！",
      "zh-Hant": "已提交！",
    },
    waitingHint: {
      en: "Scores stay hidden until everyone submits or the deadline passes.",
      "zh-Hans": "全员提交或截止到期后才会揭晓分数。",
      "zh-Hant": "全員提交或截止到期後才會揭曉分數。",
    },
    viewLeaderboard: {
      en: "View results",
      "zh-Hans": "查看结果",
      "zh-Hant": "查看結果",
    },
    leaderboardTitle: {
      en: "Results",
      "zh-Hans": "成果发表",
      "zh-Hant": "成果發表",
    },
    rankings: {
      en: "Rankings",
      "zh-Hans": "排名",
      "zh-Hant": "排名",
    },
    you: {
      en: "you",
      "zh-Hans": "你",
      "zh-Hant": "你",
    },
    dnf: { en: "No submit", "zh-Hans": "未提交", "zh-Hant": "未提交" },
    revealAllSubmitted: {
      en: "Everyone submitted",
      "zh-Hans": "全员已提交",
      "zh-Hant": "全員已提交",
    },
    revealDeadline: {
      en: "Deadline reached",
      "zh-Hans": "已到截止时间",
      "zh-Hant": "已到截止時間",
    },
    leaveRoom: {
      en: "Leave room",
      "zh-Hans": "离开房间",
      "zh-Hant": "離開房間",
    },
    roomClosed: {
      en: "This room is closed.",
      "zh-Hans": "房间已关闭。",
      "zh-Hant": "房間已關閉。",
    },
    loadingRoom: {
      en: "Loading room…",
      "zh-Hans": "加载房间…",
      "zh-Hant": "載入房間…",
    },
    playerStatusTitle: {
      en: "Players",
      "zh-Hans": "玩家状态",
      "zh-Hant": "玩家狀態",
    },
    playerStatusShort: {
      en: "Players",
      "zh-Hans": "玩家",
      "zh-Hant": "玩家",
    },
    closeStatus: {
      en: "Hide player status",
      "zh-Hans": "关闭玩家状态",
      "zh-Hant": "關閉玩家狀態",
    },
    playerSubmitted: {
      en: "{name} submitted",
      "zh-Hans": "{name} 已提交",
      "zh-Hant": "{name} 已提交",
    },
    playerNotStarted: {
      en: "{name} hasn't started",
      "zh-Hans": "{name} 还没开始",
      "zh-Hant": "{name} 還沒開始",
    },
    playerFilling: {
      en: "{name} is on color {n}",
      "zh-Hans": "{name} 正在填第 {n} 个颜色",
      "zh-Hant": "{name} 正在填第 {n} 個顏色",
    },
    playerReadySubmit: {
      en: "{name} is ready to submit",
      "zh-Hans": "{name} 填完了，准备提交",
      "zh-Hant": "{name} 填完了，準備提交",
    },
    showAllPlayers: {
      en: "Show everyone's picks on photo",
      "zh-Hans": "在照片上显示所有人的取色点",
      "zh-Hant": "在照片上顯示所有人的取色點",
    },
    cellCompareTitle: {
      en: "Cell {n} — everyone's picks",
      "zh-Hans": "第 {n} 格 · 所有人的取色",
      "zh-Hant": "第 {n} 格 · 所有人的取色",
    },
    tapCellOnPhoto: {
      en: "Tap a numbered circle on the photo to compare picks",
      "zh-Hans": "点击照片上的号码，查看所有人这一格的取色对比",
      "zh-Hant": "點擊照片上的號碼，查看所有人這一格的取色對比",
    },
    expandPhoto: {
      en: "Enlarge photo",
      "zh-Hans": "放大照片",
      "zh-Hant": "放大照片",
    },
    collapsePhoto: {
      en: "Show results",
      "zh-Hans": "查看成果发表",
      "zh-Hant": "查看成果發表",
    },
    tapPlayerForScore: {
      en: "Tap a player to see their score breakdown",
      "zh-Hans": "点击一位玩家，查看总分与取色对比",
      "zh-Hant": "點擊一位玩家，查看總分與取色對比",
    },
  },
} as const;

export type TranslationNode = {
  en: string;
  "zh-Hans": string;
  "zh-Hant": string;
};
