# Slack Clone Frontend

A modern React + TypeScript frontend for the Slack clone application.

## Features

- ✅ User authentication (login/register)
- ✅ Workspaces management
- ✅ Channel creation and management
- ✅ Real-time messaging with Socket.io
- ✅ Emoji reactions
- ✅ Rich text formatting
- ✅ @mentions and #channels
- ✅ File uploads
- ✅ Huddles (voice/video calls)
- ✅ Direct messages
- ✅ Thread replies
- ✅ User presence indicators

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v3** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The app will be available at http://localhost:3002

## Build

```bash
npm run build
```

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=https://your-backend-url.com
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   ├── contexts/        # React contexts
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── public/             # Static assets
└── index.html         # Entry HTML
```

## Live Demo

- Frontend: https://slack-frontend-morphvm-30337fn0.http.cloud.morph.so
- Backend API: https://slack-backend-api-morphvm-30337fn0.http.cloud.morph.so
