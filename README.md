# MyLife Calendar 🗓️

A premium, production-quality personal activity calendar application built with the **MERN Stack** (MongoDB, Express, React, Node.js). 

Designed to look and feel like an authentic real-world wall calendar where you cross out dates with a hand-drawn cross mark after recording your daily activities.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS v4, Motion (Framer Motion), Lucide React, Axios, React Hook Form, Zod, react-i18next, date-fns, VitePWA
- **Backend:** Node.js, Express.js, MongoDB & Mongoose, In-Memory DB Fallback, JWT Auth via HTTP-only cookies, Helmet, CORS, Express Rate Limit, Zod Validation

---

## 📂 Project Architecture

```
MyLife-Calendar/
├── client/          # Vite + React 19 + Tailwind v4 + PWA frontend
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── calendar/
│   │   │   ├── activities/
│   │   │   ├── categories/
│   │   │   └── settings/
│   │   ├── locales/
│   │   └── styles/
├── server/          # Express.js + Mongoose REST API backend
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── routes/
│   └── tests/
```

---

## 🚀 Getting Started

### 1. Server Setup
```bash
cd server
npm install
npm test      # Run automated backend test suite
npm run dev   # Start development server on http://localhost:5000
```

### 2. Client Setup
```bash
cd client
npm install
npm run dev   # Start Vite dev server on http://localhost:5173
```
