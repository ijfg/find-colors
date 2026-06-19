export const translations = {
  appName: { en: "Find Colors", "zh-Hans": "找颜色", "zh-Hant": "找顏色" },
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
      en: "Pinch to zoom · crosshair = pick point · release to confirm",
      "zh-Hans": "双指缩放 · 准心=取色点 · 松手确认",
      "zh-Hant": "雙指縮放 · 準心=取色點 · 鬆手確認",
    },
    hintMouse: {
      en: "Scroll to zoom · drag to view · click to pick",
      "zh-Hans": "滚轮缩放 · 拖动查看颜色 · 点击取色",
      "zh-Hant": "滾輪縮放 · 拖動查看顏色 · 點擊取色",
    },
  },
  score: {
    total: { en: "Score", "zh-Hans": "总分", "zh-Hant": "總分" },
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
} as const;

export type TranslationNode = {
  en: string;
  "zh-Hans": string;
  "zh-Hant": string;
};
