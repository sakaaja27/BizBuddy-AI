# 🧠 BizBuddy AI

> Asisten bisnis cerdas berbasis AI untuk UMKM Indonesia. Dibangun dengan MERN Stack (MongoDB, Express, React, Node.js).

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🤖 **AI Order Parser** | Input pesanan dalam bahasa natural, AI otomatis memproses item, harga, dan tipe pesanan |
| 📦 **Inventory Radar** | Manajemen stok real-time dengan prediksi restock AI |
| ⭐ **Review Intelligence** | Analisis sentimen review pelanggan dari berbagai platform |
| 💬 **AI Assistant** | Chatbot bisnis cerdas yang memahami konteks usaha Anda |
| 📊 **Analytics Dashboard** | Visualisasi performa bisnis harian, mingguan, dan bulanan |
| 💰 **Keuangan** | Tracking pendapatan, pengeluaran, dan laporan keuangan |
| 🏪 **Multi Business Type** | Mendukung FnB, Fashion, Jasa, Retail, dan Home Industry |

## 🏗️ Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **AI**: Groq API (Llama 3)
- **State**: Zustand
- **Auth**: JWT + bcrypt

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Docker)
- Groq API Key

### 1. Clone & Install

```bash
git clone https://github.com/your-username/bizbuddy-ai.git
cd bizbuddy-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup

```bash
# From project root
cp .env.example backend/.env
```

Edit `backend/.env` and fill in:
- `MONGO_URI` - Your MongoDB connection string
- `JWT_SECRET` - Random secret for JWT tokens
- `GROQ_API_KEY` - Get from [console.groq.com](https://console.groq.com)

### 3. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

App runs at `http://localhost:5173` (frontend) and `http://localhost:5000` (API).

## 📁 Project Structure

```
BuzzyAi/
├── backend/
│   ├── controllers/     # Route handlers (auth, orders, products, etc.)
│   ├── middleware/       # Auth, trial check, free plan limits
│   ├── models/           # Mongoose schemas (User, Business, Order, Product)
│   ├── routes/           # Express route definitions
│   └── server.js         # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── config/       # Order config per business type
│   │   ├── pages/        # Page-level components
│   │   ├── store/        # Zustand state management
│   │   └── App.jsx       # Router & global setup
│   └── index.html
└── .env.example
```

## 🔑 Business Types

BizBuddy dynamically adapts the order system based on your business type:

| Type | Order Types | Special Fields |
|---|---|---|
| **FnB** | Dine-in, Takeaway, Delivery, GoFood, GrabFood | Table Number, Delivery Address |
| **Fashion** | Walk-in, Online, Custom, Marketplace | Size, Color, Shipping Address |
| **Jasa** | Booking, Panggilan, Konsultasi, Online | Appointment Date/Time, Service Address |
| **Retail** | Walk-in, Online, Pre-order, Reseller | Courier Service, Tracking Number |
| **Home Industry** | Custom Order, Toko, Online, Grosir | Due Date, Down Payment, Custom Details |

## 📜 License

MIT License - built with ❤️ for Indonesian small businesses.
