# FX Journal — Feature TODO

Одоо байгаа: Dashboard, Trades list/detail/new, Journal, Stats, Lot-size calculator, Auth, Claude AI analysis, Screenshot upload.

---

## 🔴 Яаралтай (Core UX — байхгүй бол хэцүү)

### 1. Trade засах (Edit Trade)
- `/trades/[id]/edit` хуудас — entry/exit price, SL/TP, tags, notes, lot size засах
- Trade detail хуудсанд "Edit" товч нэм
- PATCH `/api/trades/[id]` аль хэдийн бий, зөвхөн UI дутуу

### 2. Trade хаах (Close Trade) — Open трейдээс шууд
- Trade detail дээр open trade байвал "Close Trade" товч харуул
- Exit price + closed at оруулж submit хийх modal/inline form
- Одоо үүнийг хийхийн тулд edit рүү орж байх шаардлагатай

### 3. Export CSV
- `/api/export/csv` endpoint — бүх trades-г MetaTrader форматтай ойролцоо CSV болгон гаргах
- Trades list хуудсанд "Export" товч
- Шүүлтүүрийн үр дүнг ч экспортлох боломж

---

## 🟡 Чухал (Analytics — трейдерт их хэрэгтэй)

### 4. P&L Calendar Heatmap
- GitHub-ийн contribution graph шиг — өдөр бүрийн P&L өнгөөр харуул
- Stats хуудсанд нэм (ногоон = ашигтай, улаан = алдагдалтай өдрүүд)
- Хамгийн сайн/муу өдрүүдийг hover tooltip-р харуул

### 5. Trading Session шинжилгээ
- Лондон (07:00–16:00 UTC), Нью-Йорк (12:00–21:00 UTC), Азийн (00:00–09:00 UTC) session-аар P&L задаргаа
- Stats хуудсанд "By Session" хэсэг нэм
- `openedAt` цагаас автоматаар тодорхойл

### 6. Цагийн шинжилгээ (Time of Day)
- Өдрийн хэдэн цагт хамгийн их ашиг/алдагдал авсан бэ?
- 24h heatmap эсвэл bar chart — `openedAt` цагаар бүлэглэ

### 7. Drawdown Chart
- Equity curve-ийн доор underwater chart нэм
- Max drawdown-г visual болгон харуул (одоо зөвхөн тоогоор харагдана)

### 8. Profit Factor & Advanced Stats
- Profit Factor = Нийт ашиг / Нийт алдагдал
- Average win vs average loss харьцуулалт
- Expectancy per trade = (Win% × AvgWin) - (Loss% × AvgLoss)
- Dashboard secondary stats хэсэгт нэм

### 9. Currency Exposure / Correlation
- Нэгэн зэрэг ижил валюттай (жнь EUR) олон трейд нээлттэй байвал анхааруулга
- Open trades-г base/quote currency-р бүлэглэж харуул

---

## 🟢 Хэрэгтэй (Quality of Life)

### 10. Trade Templates / Quick Entry
- Байнга хэрэглэдэг setup-уудаа template болгон хадгал (pair + SL pips + тэмдэглэл)
- New trade form дээр "Load template" dropdown нэм

### 11. Pre-trade Plan
- Trade нэмэхдээ "Trade Rationale" талбар нэм — яагаад энэ трейдийг хийж байна вэ?
- AI analysis дотор plan vs actual харьцуулалт хий
- DB-д `plan` текст талбар нэм (`prisma migrate`)

### 12. AI Daily Recap
- `/api/ai/daily-recap` — өнөөдрийн трейдүүдийг Claude-аар нэгтгэн дүн шинжилгээ хий
- "Өнөөдрийн алдаа юу байсан бэ? Дахин давтагдах хэв маяг байна уу?" гэж асуу
- Dashboard дээр "Today's AI Recap" товч

### 13. Journal дээр AI Pattern Detection
- `/api/ai/journal-insights` — сүүлийн 30 өдрийн journal entries-г Claude-аар шинжил
- Сэтгэл зүйн хэв маяг (байнга "greedy" гэж тэмдэглэсэн → алдагдал), давтагдах алдаа ол
- Journal хуудсанд "Get Insights" товч

### 14. Multiple Screenshots per Trade
- Одоо зөвхөн 1 screenshot — before/after, HTF/LTF гэх мэт олон зураг хадгалах
- `TradeScreenshot` model нэм, `screenshotUrl` → `screenshots[]` болго
- Trade detail дээр carousel/grid харуул

### 15. Account Balance Tracker
- Settings хуудсанд эхний баланс тохируулах
- Dashboard дээр "Current Equity = Initial Balance + Total P&L" харуул
- % gain/loss харуул (зөвхөн $ биш)

### 16. Password Change хуудас
- `/settings` хуудас нэм — нууц үг солих форм
- `PATCH /api/auth/password` endpoint
- Одоо нууц үг зөвхөн `.env`-р тохируулна

### 17. Mobile-responsive nav
- Одоо nav нь жижиг дэлгэцэнд хэт том
- Hamburger menu / bottom tab bar нэм (mobile)
- `useWindowSize` hook-р responsive болго

---

## 🔵 Advanced (Нэмэлт боломж)

### 18. CSV Import (MetaTrader)
- MT4/MT5-ийн history export CSV-г parse хийж trades массаар импортлох
- `/api/import/csv` POST endpoint
- Column mapping UI (ямар багана юуд вэ гэдгийг тохируул)

### 19. Trade Duplicate / Copy
- Trade detail дээр "Duplicate" товч — ижил pair/direction/lot-тай шинэ форм нээ
- Ижил setup дахин хийхэд хурдан

### 20. Keyboard Shortcuts
- `N` → New trade
- `T` → Trades list
- `J` → Journal
- `/` → Search trades
- `Escape` → Modal хаа
- `?` товч → shortcuts modal харуул

### 21. Trade Search
- Trades list дээр text search нэм (pair, notes, tags-р хайх)
- `GET /api/trades?q=keyword` дэмж

### 22. Dark/Light Mode Toggle
- Одоо зөвхөн dark theme — light mode option нэм
- `localStorage`-д хадгал, nav дээр toggle товч

### 23. Vercel / Cloud Deployment
- `node:sqlite` → Turso (libsql) эсвэл Neon (PostgreSQL) руу шилж
- Screenshot upload → Vercel Blob эсвэл Cloudinary руу шилж
- `.env` дээр `DATABASE_URL` тохируул

---

## Тэргүүлэх дараалал (хэрэв нэг зүйл сонгох бол)

| # | Feature | Ач холбогдол | Хэцүү эсэх |
|---|---------|-------------|-----------|
| 1 | Trade засах (Edit) | ⭐⭐⭐⭐⭐ | Хялбар |
| 2 | Trade хаах (Close) | ⭐⭐⭐⭐⭐ | Хялбар |
| 3 | Export CSV | ⭐⭐⭐⭐ | Хялбар |
| 4 | P&L Calendar | ⭐⭐⭐⭐ | Дунд |
| 8 | Profit Factor | ⭐⭐⭐⭐ | Хялбар |
| 13 | AI Journal Insights | ⭐⭐⭐⭐ | Дунд |
| 5 | Session Analysis | ⭐⭐⭐ | Дунд |
| 15 | Account Balance | ⭐⭐⭐ | Хялбар |
| 23 | Cloud Deploy fix | ⭐⭐⭐⭐⭐ | Хэцүү |
