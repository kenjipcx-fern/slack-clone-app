# Slack Clone Frontend 🚀

A feature-rich, real-time Slack clone frontend built with React, TypeScript, and Tailwind CSS. This application provides all the core functionality of Slack including workspaces, channels, direct messaging, real-time chat, emoji reactions, file uploads, and huddles (audio/video calls).

## 🌐 Live Demo

**Frontend URL:** https://slack-frontend-morphvm-30337fn0.http.cloud.morph.so

**Backend API:** https://slack-backend-morphvm-30337fn0.http.cloud.morph.so

### Demo Credentials
- **Email:** demo@slack.com
- **Password:** demo123

## ✨ Features

### Core Functionality
- **🔐 Authentication System**
  - User registration and login
  - JWT-based authentication
  - Persistent sessions
  - Profile management

- **🏢 Workspaces**
  - Create and manage workspaces
  - Workspace switching
  - Member management with roles (owner, admin, member)
  - Automatic default channel creation

- **💬 Channels**
  - Public and private channels
  - Channel creation and management
  - Join/leave channels
  - Channel member lists
  - Channel descriptions

- **✉️ Direct Messages**
  - One-on-one messaging
  - Online/offline status indicators
  - User presence tracking

- **💌 Real-time Messaging**
  - Instant message delivery via WebSocket
  - Message editing and deletion
  - Thread conversations (replies)
  - Typing indicators
  - Message formatting
  - Auto-scrolling

- **😊 Emoji Reactions**
  - React to messages with emojis
  - 9 categories of emojis
  - Real-time reaction updates
  - Reaction counters

- **📞 Huddles (Audio/Video Calls)**
  - Start/join/leave huddles in channels
  - Audio/video controls
  - WebRTC-based peer-to-peer communication
  - Screen sharing support
  - Participant list

- **📎 File Uploads**
  - Multiple file upload support
  - File preview in messages
  - Attachment management

- **🔍 Search**
  - Global message search
  - User search
  - Channel search

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 3** - Styling
- **Vite** - Build tool
- **React Router v6** - Routing
- **Socket.io Client** - WebSocket communication
- **Axios** - HTTP client
- **SimplePeer** - WebRTC implementation
- **Date-fns** - Date formatting
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### State Management
- **Context API** - Global state management
- **Local Storage** - Persistent storage

## 📁 Project Structure

```
slack-frontend/
├── src/
│   ├── components/         # React components
│   │   ├── Login.tsx       # Authentication
│   │   ├── Register.tsx    
│   │   ├── Main.tsx        # Main app layout
│   │   ├── Sidebar.tsx     # Channel/DM navigation
│   │   ├── ChannelView.tsx # Message display
│   │   ├── MessageList.tsx # Message rendering
│   │   ├── MessageItem.tsx # Individual messages
│   │   ├── MessageComposer.tsx # Message input
│   │   ├── ThreadView.tsx  # Thread replies
│   │   ├── EmojiPicker.tsx # Emoji selection
│   │   ├── HuddleBar.tsx   # Audio/video calls
│   │   └── CreateChannelModal.tsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication state
│   ├── services/           # API services
│   │   ├── api.ts         # REST API calls
│   │   └── socket.ts      # WebSocket service
│   ├── types/             # TypeScript types
│   │   └── index.ts       # Type definitions
│   └── App.tsx            # Root component
├── dist/                  # Production build
├── server.js             # Express server
└── package.json          # Dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/kenjipcx-fern/slack-clone-frontend.git
cd slack-clone-frontend
```

2. Install dependencies
```bash
npm install
```

3. Run development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

5. Run production server
```bash
npm start
```

## 🔧 Configuration

The application connects to the backend API at:
- API URL: `https://slack-backend-morphvm-30337fn0.http.cloud.morph.so/api`
- WebSocket: `wss://slack-backend-morphvm-30337fn0.http.cloud.morph.so`

To use a different backend, update the URLs in:
- `src/services/api.ts`
- `src/services/socket.ts`

## 📱 UI Components

### Layout
- **Three-column design**: Sidebar | Messages | Thread
- **Responsive design** for mobile and desktop
- **Dark theme** with Slack's signature purple accent

### Key Components
1. **Sidebar** - Workspace navigation, channels, DMs
2. **Channel View** - Message list, composer, reactions
3. **Thread View** - Threaded conversations
4. **Message Composer** - Rich text input with emoji support
5. **Huddle Bar** - Audio/video call controls
6. **Emoji Picker** - Categorized emoji selection

## 🔌 API Integration

The frontend integrates with a comprehensive backend API:

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Workspace Endpoints
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces` - List workspaces
- `GET /api/workspaces/:id/members` - Get members

### Channel Endpoints
- `POST /api/channels` - Create channel
- `GET /api/channels/workspace/:id` - List channels
- `POST /api/channels/:id/join` - Join channel

### Message Endpoints
- `GET /api/messages/channel/:id` - Get messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

### Real-time Events (WebSocket)
- `new_message` - New message received
- `message_updated` - Message edited
- `message_deleted` - Message deleted
- `reaction_added` - Reaction added
- `user_typing` - User typing indicator
- `user_online/offline` - Presence updates

## 🎨 Design Features

- **Slack-inspired UI** with purple accent colors
- **Smooth animations** and transitions
- **Custom scrollbars** for better UX
- **Loading states** and error handling
- **Toast notifications** for user feedback
- **Keyboard shortcuts** (Shift+Enter for new line)

## 📦 Deployment

The application is deployed and accessible at:
- **Frontend:** https://slack-frontend-morphvm-30337fn0.http.cloud.morph.so
- **Backend:** https://slack-backend-morphvm-30337fn0.http.cloud.morph.so
- **GitHub:** https://github.com/kenjipcx-fern/slack-clone-frontend

## 🔒 Security

- JWT token-based authentication
- Secure WebSocket connections (WSS)
- HTTPS for all API calls
- Token expiry and refresh handling
- Input validation and sanitization

## 🚧 Future Enhancements

- [ ] Message search functionality
- [ ] User profile pages
- [ ] Custom emoji support
- [ ] Message formatting (bold, italic, code)
- [ ] Slash commands
- [ ] Desktop notifications
- [ ] Dark/light theme toggle
- [ ] Mobile app version
- [ ] Voice messages
- [ ] Screen sharing in huddles

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- Inspired by Slack's excellent UX/UI
- Built with modern React best practices
- Leverages the power of real-time WebSocket communication

---

**Live Demo:** https://slack-frontend-morphvm-30337fn0.http.cloud.morph.so

**Test Account:** demo@slack.com / demo123

Built with ❤️ using React, TypeScript, and Tailwind CSS
