# ChatPulse 💬

ChatPulse is a lightweight, real-time messaging application built with the MERN stack. It features instant private messaging, typing indicators, and a privacy-first authentication system that requires no email.



## 🚀 Live Demo
**Check it out here:** [https://chat-pulse-lx6j.onrender.com](https://chat-pulse-lx6j.onrender.com)

---

## ✨ Features
* **Real-Time Messaging:** Instant private chat powered by **Socket.io**.
* **Privacy-Focused Auth:** Secure login and registration using **JWT**, designed without the need for user emails.
* **Smart Notifications:** Visual red-dot indicators for unread messages and real-time typing indicators.
* **Persistent Chat History:** Messages and user data are stored securely in **MongoDB Atlas**.
* **Modern UI:** Responsive "Glassmorphism" design that works on both Desktop and Mobile.
* **Cloud Hosted:** Fully deployed and managed on **Render**.

---

## 🛠️ Tech Stack
* **Frontend:** HTML5, CSS3 (Glassmorphism), JavaScript (Vanilla ES6)
* **Backend:** Node.js, Express.js
* **Real-time:** Socket.io
* **Database:** MongoDB Atlas (Cloud)
* **Authentication:** JSON Web Tokens (JWT)
* **Deployment:** Render

---

## 📂 Project Structure
```text
├── models/           # Mongoose Schemas (User, Message)
├── routes/           # Express API Routes (Auth)
├── public/           # Frontend Files (HTML, CSS, Client JS)
├── server.js         # Main Server & Socket logic
└── .env              # Environment Variables (Local only)

---

## ⚙️ Local Installation
1. Clone the repository:
git clone [https://github.com/your-username/chat-pulse.git](https://github.com/your-username/chat-pulse.git)
cd chat-pulse

2. Install dependencies:
npm install

3. Configure Environment Variables: Create a .env file in the root directory and add:
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_random_string
PORT=3000

4. Start the server:
npm start

Open http://localhost:3000 in your browser.
