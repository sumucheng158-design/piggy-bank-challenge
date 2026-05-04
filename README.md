# 小小大富翁養成計畫 🐷

> 讓孩子透過每日存錢任務，學習等待、規劃與累積，建立理財觀念。

**活動期間：2026/6/1 – 2026/6/30**

---

## 技術架構

| 層次 | 技術 |
|------|------|
| 前端框架 | Next.js 14 (App Router) |
| 樣式 | Tailwind CSS |
| 後端/資料庫 | Firebase Firestore |
| 部署平台 | Vercel |
| 版本控管 | GitHub |

---

## 專案資料夾結構

```
piggy-bank-challenge/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # 首頁 (Landing Page)
│   │   ├── globals.css         # 全局樣式
│   │   └── calendar/
│   │       └── page.tsx        # 活動日曆頁
│   ├── components/
│   │   ├── CalendarGrid.tsx    # 月曆元件
│   │   └── ProgressBar.tsx     # 進度條元件
│   └── lib/
│       ├── firebase.ts         # Firebase 初始化
│       └── firestore.ts        # Firestore 資料存取函式
├── .env.local.example          # 環境變數範本
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Firestore 資料結構

### Collection: `users`
```json
{
  "id": "auto-generated",
  "name": "小明",
  "createdAt": "Timestamp"
}
```

### Collection: `checkins`
Document ID 格式：`{userId}_{YYYY-MM-DD}`（避免重複）
```json
{
  "userId": "abc123",
  "date": "2026-06-15",
  "completed": true
}
```

---

## 本地開發設定

### 1. Clone 專案
```bash
git clone https://github.com/your-username/piggy-bank-challenge.git
cd piggy-bank-challenge
npm install
```

### 2. 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 建立新專案（例如：`piggy-bank-challenge`）
3. 啟用 **Firestore Database**
   - 選擇「以測試模式開始」（之後記得設定安全規則）
4. 在「專案設定 > 您的應用程式」中新增 **Web 應用程式**
5. 複製 Firebase 設定

### 3. 設定環境變數
```bash
cp .env.local.example .env.local
```
編輯 `.env.local`，填入你的 Firebase 設定值：
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. 啟動開發伺服器
```bash
npm run dev
```
打開 [http://localhost:3000](http://localhost:3000)

---

## Firestore 安全規則

在 Firebase Console > Firestore > 規則，貼上以下規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: anyone can create, only read their own
    match /users/{userId} {
      allow create: if request.resource.data.name is string
                    && request.resource.data.name.size() > 0
                    && request.resource.data.name.size() <= 20;
      allow read: if true;
    }

    // Checkins: only read/write your own
    match /checkins/{docId} {
      allow read, write: if request.resource.data.userId == docId.split('_')[0]
                          || resource.data.userId != null;
      allow read: if true;
      allow write: if request.resource.data.userId is string
                   && request.resource.data.date is string
                   && request.resource.data.completed is bool;
    }
  }
}
```

---

## GitHub 初始化

```bash
# 在專案目錄中
git init
git add .
git commit -m "feat: initial project setup"

# 在 GitHub 建立 repo 後
git remote add origin https://github.com/your-username/piggy-bank-challenge.git
git branch -M main
git push -u origin main
```

---

## 部署到 Vercel

### 方式一：透過 Vercel 網頁（推薦）

1. 前往 [vercel.com](https://vercel.com) 並登入
2. 點擊「Add New Project」
3. 選擇你的 GitHub repository
4. 在「Environment Variables」加入所有 `NEXT_PUBLIC_FIREBASE_*` 變數
5. 點擊「Deploy」

### 方式二：Vercel CLI

```bash
npm i -g vercel
vercel login
vercel

# 設定環境變數
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID

# 重新部署
vercel --prod
```

---

## 功能說明

| 功能 | 說明 |
|------|------|
| 首頁 | 活動介紹、獎勵說明、立即開始按鈕 |
| 用戶建立 | 輸入名字即可開始，資料存入 Firestore |
| 月曆打卡 | 點擊日期切換完成/未完成狀態 |
| 即時同步 | 打卡資料即時存入 Firestore |
| 進度追蹤 | 顯示完成天數與進度條 |
| 重新進入 | userId 快取於 localStorage，自動讀取進度 |

---

## 常見問題

**Q: 打卡資料沒有儲存？**
A: 請確認 `.env.local` 中的 Firebase 設定正確，且 Firestore 已啟用。

**Q: 如何切換用戶？**
A: 點擊右上角「切換用戶」按鈕，會清除 localStorage 並返回首頁。

**Q: 未來日期可以打卡嗎？**
A: 不行，未來日期的格子為灰色且不可點擊。
