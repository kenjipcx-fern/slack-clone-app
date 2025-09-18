# Slack Clone App 🚀

A full-featured Slack clone application with real-time messaging, workspaces, channels, reactions, and huddles. Built with modern web technologies to provide a seamless team collaboration experience.

## 🌟 Live Demo

- **Frontend**: https://slack-frontend-morphvm-30337fn0.http.cloud.morph.so
- **Backend API**: https://slack-backend-api-morphvm-30337fn0.http.cloud.morph.so

## ✨ Features

### Core Functionality
- 🔐 **Authentication System** - Secure JWT-based login/register
- 🏢 **Workspaces** - Create and manage team workspaces
- 💬 **Channels** - Public/private channels and direct messages
- 📨 **Real-time Messaging** - Instant message delivery with Socket.io
- 😀 **Emoji Reactions** - React to messages with emojis
- 📝 **Rich Text Formatting** - Bold, italic, code snippets
- 👥 **@Mentions** - Mention team members in messages
- 📞 **Huddles** - Voice/video call infrastructure
- 📎 **File Uploads** - Share files and images
- 🔍 **Search** - Search messages and users
- 🟢 **User Presence** - Online/offline status indicators
- 💬 **Thread Replies** - Organize conversations in threads

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database (Neon compatible)
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v3** - Styling
- **Socket.io Client** - Real-time updates
- **React Router** - Navigation
- **Axios** - HTTP client

## 📁 Project Structure

```
slack-clone-app/
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── config/      # Database and app config
│   │   ├── middleware/  # Auth and error middleware
│   │   ├── routes/      # API routes
│   │   └── server.js    # Main server file
│   └── schema.sql       # Database schema
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # React contexts
│   │   ├── services/    # API services
│   │   └── types/       # TypeScript types
│   └── package.json
└── fern/               # Documentation

```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up database
psql -U postgres < schema.sql

# Start the server
npm start
```

### Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/slack_db
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3002
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5001
```

## 📝 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Workspaces
- `GET /api/workspaces/my-workspaces` - Get user's workspaces
- `POST /api/workspaces` - Create workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Channels
- `GET /api/channels` - List channels
- `POST /api/channels` - Create channel
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

### Messages
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

## 🧪 Test Accounts

```
Email: test@example.com
Password: Test123!

Email: demo@slack.com
Password: demo123
```

## 🎯 Future Enhancements

- [ ] Voice/video calling implementation
- [ ] Screen sharing
- [ ] Message search functionality
- [ ] Slack app integrations
- [ ] Mobile app support
- [ ] Dark mode
- [ ] Message scheduling
- [ ] Custom emoji support

## 📄 License

MIT

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

## 👥 Team

Built with ❤️ by the development team

---

**Note**: This is a demonstration project showcasing full-stack development capabilities with modern web technologies.
A Slack clone application with messaging, huddles, and emojis
