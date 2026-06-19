export const translations = {
  appName: { en: "Find Colors", zh: "找颜色" },
  home: {
    chooseDifficulty: { en: "Choose difficulty", zh: "选难度" },
    pickPhoto: { en: "Pick a photo", zh: "选照片" },
    generating: { en: "Generating...", zh: "生成中…" },
    cantProcess: {
      en: "Couldn't process this photo. Try another.",
      zh: "无法处理该图片，请换一张试试。",
    },
    cantRegenerate: {
      en: "Couldn't generate new colors. Try another photo.",
      zh: "无法重新生成目标色，请换一张试试。",
    },
  },
  difficulty: {
    one: { en: "1 color", zh: "1 色" },
    four: { en: "4 colors", zh: "4 色" },
    nine: { en: "9 colors", zh: "9 色" },
    sixteen: { en: "16 colors", zh: "16 色" },
  },
  game: {
    target: { en: "Target", zh: "目标" },
    yours: { en: "You", zh: "你的" },
    yoursCount: { en: "You ({filled}/{count})", zh: "你的 ({filled}/{count})" },
    submit: { en: "Submit", zh: "提交" },
    clear: { en: "Clear", zh: "清空" },
    clearLong: { en: "Clear all", zh: "清空重填" },
    newPhoto: { en: "New photo", zh: "换图" },
    newPhotoLong: { en: "Pick another photo", zh: "换一张照片" },
    fillingHint: {
      en: "Filling cell {n} · tap the photo to pick",
      zh: "正在填第 {n} 格 · 在照片里点击取色",
    },
    clearCell: { en: "Clear", zh: "清除" },
    legend: {
      en: "Solid = target · Dashed = your color · Tap a marker for a closeup",
      zh: "实线 = 目标色 · 虚线 = 你的 · 点击标记查看截图",
    },
    cellTarget: { en: "Cell {n} · Target", zh: "第 {n} 格 · 目标" },
    cellYours: { en: "Cell {n} · You", zh: "第 {n} 格 · 你的" },
    closeCompare: { en: "Close comparison", zh: "关闭对比" },
    saveErrorWrite: {
      en: "Score shown but record didn't save (storage may be full).",
      zh: "得分已显示，但记录未能写入（可能是浏览器存储空间不足）。",
    },
    saveErrorGeneric: {
      en: "Score shown but saving the record failed.",
      zh: "得分已显示，但保存记录时出错。",
    },
  },
  picker: {
    zoomIn: { en: "Zoom in", zh: "放大" },
    zoomOut: { en: "Zoom out", zh: "缩小" },
    reset: { en: "Reset", zh: "重置" },
    hintTouch: {
      en: "Pinch to zoom · crosshair = pick point · release to confirm",
      zh: "双指缩放 · 准心=取色点 · 松手确认",
    },
    hintMouse: {
      en: "Scroll to zoom · drag to view · click to pick",
      zh: "滚轮缩放 · 拖动查看颜色 · 点击取色",
    },
  },
  score: {
    total: { en: "Score", zh: "总分" },
    cellLabel: { en: "Cell {n}", zh: "第 {n} 格" },
    targetSmall: { en: "Target", zh: "目标" },
    yoursSmall: { en: "You", zh: "你的" },
    tapToInspect: {
      en: "Tap a cell to see the closeup",
      zh: "点击某一格，在照片上查看局部对比",
    },
    playAgain: { en: "Play again", zh: "再玩一次" },
    playAgainBusy: { en: "Generating...", zh: "生成中…" },
    newPhoto: { en: "New photo", zh: "换一张照片" },
    ratings: {
      master: { en: "Color master", zh: "色感大师" },
      sharp: { en: "Sharp eye", zh: "眼力不错" },
      okay: { en: "Not bad", zh: "还可以" },
      practice: { en: "Keep practicing", zh: "再练练" },
      farOff: { en: "Way off", zh: "差得有点远" },
    },
  },
  records: {
    title: { en: "My records", zh: "我的记录" },
    back: { en: "Back", zh: "返回" },
    sortByTime: { en: "Sort by time", zh: "按时间排序" },
    sortByScore: { en: "Sort by score", zh: "按分数排序" },
    clearAll: { en: "Clear all", zh: "清空所有记录" },
    empty: {
      en: "No records yet. Play a round and submit to save automatically.",
      zh: "还没有记录，玩一局并提交后会自动保存",
    },
    confirmDelete: { en: "Delete this record?", zh: "确定删除这条记录？" },
    confirmClearAll: {
      en: "Clear all records? This cannot be undone.",
      zh: "确定清空所有记录？此操作不可恢复。",
    },
    deleteAria: { en: "Delete record", zh: "删除记录" },
    targetColors: { en: "Target colors", zh: "目标色" },
    yourColors: { en: "Your colors", zh: "你的色" },
    cellLabel: { en: "Cell {n}", zh: "第 {n} 格" },
  },
  a11y: {
    emptyCell: { en: "Empty cell {n}", zh: "空格 {n}" },
    colorCell: { en: "Color {n} {hex}", zh: "颜色 {n} {hex}" },
    waitingFill: { en: "Waiting to fill", zh: "等待填色" },
    colorGrid: { en: "Color grid", zh: "色彩宫格" },
    difficulty: { en: "Difficulty", zh: "难度" },
  },
} as const;

export type TranslationNode = { en: string; zh: string };
