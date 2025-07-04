# 🍽️ CookSync – Backend Server

**CookSync** is a real-time collaborative recipe-sharing platform built with the MERN stack. This backend repository powers the authentication, user management, recipe CRUD, chat, live cooking sessions, notifications, and admin operations.

This backend is developed with **Node.js**, **Express**, **MongoDB (Atlas)**, and **Socket.IO**.

---

## ⚙️ Tech Stack

- **Node.js + Express** – Web framework
- **MongoDB + Mongoose** – Database & ORM
- **Socket.IO** – Real-time collaboration
- **JWT** – Authentication (OTP-based)
- **Cloudinary** – Image hosting
- **Nodemailer** – Email OTP
- **Render** – Backend deployment

---

## 🚀 Features Implemented (Backend)

### 🔐 Authentication
- Passwordless email OTP login
- JWT generation and protected routes

### 👤 Users
- Role-based system: `user`, `chef`, `admin`
- Dietary preferences
- Favorites and profile management
- Chef request flow with admin approval

### 🍲 Recipes
- Full CRUD (Create, Read, Update, Delete)
- Image upload via Multer + Cloudinary
- Like, comment, view tracking
- Filter by tags or preferences

### 🧑‍🍳 Real-Time Cooking
- Join recipe room
- Step-by-step cooking instructions (broadcast)
- Live chat (Socket.IO)
- Typing indicators (optional)
- Cooking session history storage

### 🔔 Notifications
- Events trigger notifications:
  - Likes, comments, mentions
  - Room join/leave
  - Chef approval
- Real-time updates via `new-notification` socket event
- Notification read status

### 🛠️ Admin Panel
- View all users and their roles
- Moderate chef requests
- Delete any recipe

---

## 🧪 API Collection

📬 [Postman Collection (Full)](link-to-json-if-public)

Includes:
- `/api/auth/send-otp`, `/verify-otp`
- `/api/recipes`, `/favorites`, `/comments`
- `/api/users/preferences`, `/me`
- `/api/notifications`
- `/api/chat/:recipeId`
- Protected with `Bearer {{jwt}}`

---

## 🧠 Real-Time Events

| Event              | Payload                            | Triggered By            |
|--------------------|------------------------------------|--------------------------|
| `join-recipe`      | `{ recipeId }`                     | On page join            |
| `cooking-step`     | `{ recipeId, step }`               | Sent by chef only       |
| `step-update`      | `{ step, by, at }`                 | Broadcast to others     |
| `chat-message`     | `{ message, recipeId }`            | From all users          |
| `room-users`       | `[userIds]`                        | Room join/leave         |
| `new-notification` | `{ type, message, link, createdAt }` | Auto-emitted           |

---

## 📁 Folder Structure (Backend)

```

cooksync-backend/
├── config/             # DB & cloudinary configs
├── controllers/        # Business logic
├── models/             # Mongoose schemas
├── routes/             # Express route handlers
├── sockets/            # Chat + live step logic
├── middlewares/        # Auth, role checks
├── utils/              # Mailer, helpers
└── server.js           # Entry point + socket init

````

---

## 🧪 Testing

- REST APIs tested via Postman
- Real-time events tested via Postman WebSocket
- MongoDB Atlas used for persistence
- Socket.IO manually tested with 2 simulated users

---

## 🔐 .env Configuration

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_USER=your_email
EMAIL_PASS=app_password
ADMIN_EMAIL=admin@example.com
````

---

## 🧑‍💻 Backend Lead

**MD Khaled Bin Joha**
Backend Engineer – CookSync
📧 [G-Mail](mailto:kbin3140@gmail.com)
🌐 [GitHub](https://github.com/joha546)

---

## ✅ To-Do (Optional / Future)

* WebRTC integration for video calls
* AI-based recipe recommendations
* Collaborative editing with patch tracking
* Redis caching & rate-limiting

---

> This README focuses on backend logic. Frontend integration is handled separately using React and Socket.IO Client.
