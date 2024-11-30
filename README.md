---

# Edu Connect

Edu Connect is a full-stack web application designed to connect students with tutors for seamless online learning sessions.  

---

## 🏗️ Project Structure  

```
edu-connect/
├── client/          # React frontend
├── server/          # Node.js backend
└── backup.sql       # Database backup
```  

---

## ⚙️ Prerequisites  

- **Node.js** (v14 or higher)  
- **MySQL** (v8.0 or higher)  
- **npm** or **yarn**  

---

## 🚀 Quick Start  

### 1. Clone the Repository  

```bash
git clone https://github.com/ShahzebFaisal5649/DB_Lab_Project.git
cd DB_Lab_Project
```  

### 2. Install Dependencies  

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```  

### 3. Set Up the Database  

- Create a MySQL database named `edu_connect_db`.  
- Import the schema from `backup.sql`.  
- Configure database credentials in the `.env` file.  

### 4. Start the Application  

```bash
# Start all services (from the root directory)
npm start #In client directory
node server.js #In server directory
```  

---

## 🌟 Features  

- **User Authentication and Authorization**  
- **Real-Time Chat Functionality**  
- **Session Management**  
- **User Profiles with Ratings and Reviews**  
- **Subject-Based Tutor Matching**  
- **Admin Dashboard for Management**  

---

## 🛠️ Technology Stack  

**Frontend**: React, TypeScript, Tailwind CSS  
**Backend**: Node.js, Express, WebSocket  
**Database**: MySQL  

---

## 📜 License  

This project is licensed under the [MIT License](LICENSE).  

---

# 📱 Client Documentation  

## 🖥️ Overview  

The client-side of Edu Connect is a responsive and interactive web application built with modern technologies for an engaging user experience.  

### 🧰 Key Technologies  

- React (v18)  
- TypeScript  
- Tailwind CSS  
- shadcn/ui components  
- WebSocket for real-time updates  

### 📁 Project Structure  

```
client/
├── src/
│   ├── components/     # Reusable React components
│   ├── lib/            # Utility functions
│   └── App.tsx         # Main application component
```  

### 🔧 Available Scripts  

```bash
npm start       # Start development server
npm run build   # Create production build
npm test        # Run tests
```  

### 🛠️ Environment Setup  

Create a `.env` file in the `client` directory with the following variables:  

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5001
```  

### 🔍 Component Structure  

- `components/ui/`: Reusable UI components  
- `components/*.tsx`: Feature-specific components  

---

# 🖥️ Server Documentation  

## 🖥️ Overview  

The server-side provides RESTful API endpoints and WebSocket functionality for real-time communication between users.  

### 🧰 Key Technologies  

- Node.js  
- Express.js  
- MySQL  
- WebSocket (ws)  

### 📁 Project Structure  

```
server/
├── routes/           # API route definitions
├── middleware/       # Custom middleware
├── prisma/           # Database schema and migrations
└── websocket-server.js  # WebSocket logic
```  

### 🛠️ Environment Setup  

Create a `.env` file in the `server` directory with the following variables:  

```env
DB_HOST=localhost
DB_USER=edu_connect_user
DB_PASSWORD=your_password
DB_NAME=edu_connect_db
EXPRESS_PORT=5000
WS_PORT=5001
```  

### 🔗 API Endpoints  

#### **Authentication**  
- `POST /api/users/login`  
- `POST /api/users/register`  

#### **Sessions**  
- `GET /api/users/sessions`  
- `POST /api/users/session/request`  
- `PUT /api/users/session/:id/respond`  

#### **Profiles**  
- `GET /api/users/profile/:id`  
- `PUT /api/users/profile/:id`  

#### **Admin Routes**  
- `GET /api/users/admin/users`  
- `PUT /api/users/admin/users/:id/verify`  

---

## 📊 Database Schema  

The application uses MySQL with the following main tables:  

- **User**  
- **Student**  
- **Tutor**  
- **Session**  
- **SessionRequest**  
- **Message**  
- **Subject**  
- **Feedback**  

---

## 📡 WebSocket Events  

- **join**: Join a session  
- **chat**: Send/receive messages  
- **error**: Handle errors  

---
