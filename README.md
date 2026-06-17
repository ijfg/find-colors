# 色彩日记

从照片中提取 16 种代表性颜色，以十六宫格呈现，并可导出为图片。每条记录可添加可选备注。

## 功能

- 上传照片，自动提取 16 种主色
- 4×4 十六宫格展示色彩，并保存每个颜色的真实采样点
- 点击色块查看它来自照片中的哪个小区域
- 手动从照片取色替换某一格
- 可选文字备注（描述原照片）
- 导出十六宫格为 PNG 图片
- 数据保存在浏览器本地（localStorage）

## 运行

```bash
npm install
npm run dev
```

浏览器打开终端显示的本地地址（通常是 http://localhost:5173）。

## 构建

```bash
npm run build
npm run preview
```

## 部署到网上（GitHub + Vercel / Netlify）

这是纯前端应用，构建后的 `dist` 文件夹即可托管，无需服务器。

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```

在 [GitHub](https://github.com/new) 新建仓库（不要勾选 README），然后：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

### 2. 连接托管平台（二选一）

**Vercel（推荐）**
1. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录
2. Add New → Project → 选择你的仓库
3. 保持默认设置（Framework: Vite，Output: `dist`），Deploy
4. 得到链接，例如 `https://color-diary.vercel.app`

**Netlify**
1. 打开 [netlify.com](https://www.netlify.com)，用 GitHub 登录
2. Add new site → Import an existing project → 选择仓库
3. Build command: `npm run build`，Publish directory: `dist`
4. Deploy

之后每次 `git push`，网站会自动更新。

### 说明

- 照片在浏览器本地处理，不上传服务器
- 「我的记录」存在各自手机的浏览器里，朋友之间不共享
- 需使用 HTTPS 链接，手机上传照片才稳定

