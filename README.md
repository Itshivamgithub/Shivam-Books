<h1 align="center">📚 Shivam Books – Full‑Stack React Native App 🚀</h1>

This is a true **full‑stack**

✅ Works on **real devices & simulators** (Android / iOS)  

## 🧑‍🍳 App Features Overview

- 🔐 **Auth** — signup & login with JWT, error handling for bad creds
- 🏠 **Home Feed** — newest‑first posts with **infinite scrolling**
- ➕ **Create Post** — title, rating, cover image & caption (all required)
- 👤 **Profile Screen** — user info + their posts
- 🗑️ **Delete Post** — confirmation alert before removal
- 🎨 **4 instant themes** — just swap one color object
- 🌐 **Web support** — run on `localhost` in the browser
- 🚪 **Logout**

---

## 📁 .env Setup

### ⚙️ Backend (`/backend`)

```bash
PORT=3000
MONGO_URI=<YOUR_MONGO_DB_URI>
JWT_SECRET=<YOUR_VERY_HARD_TO_FIND_SECRET>

CLOUDINARY_CLOUD_NAME=<YOUR_CLOUDINARY_CLOUD_NAME>
CLOUDINARY_API_KEY=<YOUR_CLOUDINARY_API_KEY>
CLOUDINARY_API_SECRET=<YOUR_CLOUDINARY_API_SECRET>

API_URL=<YOUR_DEPLOYED_API_URL>
```

## ⚙️ Run the backend

```bash
cd backend
npm install
npm run dev

```

## 📱 Run the mobile

```bash
cd mobile
npm install
npx expo
```
