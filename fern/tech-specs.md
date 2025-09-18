# Technical Architecture & Specifications
## Slack Clone - "Discord for Business"

### Executive Summary
This document defines the technical architecture for a modern Slack alternative that combines Discord's instant voice features with Slack's professional structure. The system prioritizes real-time communication, voice huddles, and team collaboration with enterprise-grade performance.

---

## 1. Technology Stack Definition

### Frontend Architecture
- **Framework**: Next.js 14+ (App Router, React Server Components)
- **Language**: TypeScript 5.0+ with strict mode
- **Styling**: Tailwind CSS 3.4+ with CSS-in-JS for dynamic styles
- **State Management**: Zustand for client state + TanStack Query for server state
- **Real-time**: Socket.io Client for WebSocket connections
- **Voice**: WebRTC with Simple-Peer for huddle functionality
- **Animation**: Framer Motion 10+ for UI animations
- **Forms**: React Hook Form + Zod for validation
- **Testing**: Jest + React Testing Library + Playwright E2E

### Backend Architecture
- **Runtime**: Node.js 20+ with Express.js
- **API Layer**: Next.js API Routes + dedicated Express server for Socket.io
- **Language**: TypeScript 5.0+ throughout
- **Database**: PostgreSQL 15+ with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: NextAuth.js 4+ with JWT strategy
- **Real-time**: Socket.io Server with Redis adapter
- **Voice Signaling**: Custom WebRTC signaling server
- **File Storage**: Local filesystem (MVP) → S3-compatible in production
- **Validation**: Zod schemas shared between client/server

### Infrastructure & Deployment
- **Deployment**: MorphVPS (current environment)
- **Database**: Local PostgreSQL instance
- **Process Manager**: PM2 for Node.js processes
- **Reverse Proxy**: Nginx for static files + SSL termination
- **Monitoring**: Simple logging to files (MVP)
- **Environment**: Docker containers for isolation

---

## 2. System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Express API    │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ • App Router    │◄──►│ • REST API      │◄──►│ • User Data     │
│ • Server Comp   │    │ • Socket.io     │    │ • Messages      │
│ • Client Comp   │    │ • WebRTC Signal │    │ • Workspaces    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Socket.io     │    │   File System   │
│                 │    │                 │
│ • Real-time     │    │ • Uploads       │
│ • Presence      │    │ • Avatars       │
│ • Typing        │    │ • Attachments   │
└─────────────────┘    └─────────────────┘
```

### Component Communication Pattern
- **Client → Server**: REST API for CRUD operations
- **Client ↔ Server**: WebSocket for real-time messaging
- **Client ↔ Client**: WebRTC for voice huddles (peer-to-peer)
- **Server → Database**: Drizzle ORM with prepared statements
- **Server → Server**: Event-driven architecture with Socket.io

---

## 3. Performance Requirements & Budgets

### Frontend Performance Budgets
- **Initial Bundle Size**: <500KB (gzipped)
- **Route Chunks**: <200KB per route (gzipped)
- **First Contentful Paint**: <1.5s on 3G
- **Largest Contentful Paint**: <2.5s on 3G
- **Time to Interactive**: <3s on 3G
- **Cumulative Layout Shift**: <0.1

### Backend Performance Targets
- **API Response Time**: <100ms for 95th percentile
- **Message Delivery**: <50ms end-to-end latency
- **WebRTC Connection**: <2s establishment time
- **Database Queries**: <10ms for simple queries, <50ms for complex
- **Concurrent Users**: Support 100+ per workspace
- **Memory Usage**: <512MB per Node.js process

### Real-time Performance
- **WebSocket Connection**: <500ms establishment
- **Message Broadcasting**: <25ms server processing
- **Typing Indicators**: <20ms response time
- **Presence Updates**: <100ms propagation
- **Voice Quality**: 16kHz audio, <150ms latency

---

## 4. Security Requirements (OWASP Compliance)

### Authentication & Authorization
- **Password Security**: bcrypt with salt rounds 12+
- **JWT Tokens**: Short-lived (15min) access + long-lived refresh
- **Session Management**: Secure HTTP-only cookies
- **Multi-factor Auth**: TOTP support (optional feature)
- **Rate Limiting**: Per-user and per-IP limits on all endpoints

### Data Protection
- **Input Validation**: Zod schemas on all inputs
- **SQL Injection**: Prepared statements via Drizzle ORM
- **XSS Protection**: Content Security Policy + sanitization
- **CSRF Protection**: SameSite cookies + CSRF tokens
- **File Uploads**: Type validation + size limits + virus scanning

### Communication Security
- **HTTPS Only**: Force SSL in production
- **WebSocket Security**: Origin validation + authentication
- **WebRTC Security**: TURN server authentication
- **API Versioning**: Versioned endpoints for breaking changes
- **Audit Logging**: Track sensitive operations

---

## 5. Scalability Considerations

### Horizontal Scaling Strategy
- **Stateless Servers**: All session data in JWT or database
- **Database Sharding**: By workspace_id for multi-tenancy
- **File Storage**: S3-compatible for distributed access
- **WebSocket Scaling**: Redis adapter for multi-server Socket.io
- **CDN Strategy**: Static assets via CDN, API via load balancer

### Caching Strategy
- **Browser Cache**: Aggressive caching for static assets
- **API Cache**: Short TTL for user data, longer for workspace metadata
- **Database Cache**: Query result caching for frequently accessed data
- **Socket.io**: In-memory user presence cache
- **File Cache**: Thumbnail generation and caching

### Resource Optimization
- **Database Indexing**: Composite indexes on common query patterns
- **Query Optimization**: N+1 prevention, selective field loading
- **Bundle Splitting**: Route-based code splitting
- **Image Optimization**: Next.js Image component with WebP
- **Memory Management**: Periodic cleanup of inactive connections

---

## 6. Browser Compatibility

### Target Support Matrix
- **Chrome/Edge**: Last 2 versions (primary target)
- **Firefox**: Last 2 versions
- **Safari**: Last 2 versions (including iOS Safari)
- **Mobile Chrome/Safari**: Current versions
- **Minimum Support**: ES2020 features

### Progressive Enhancement
- **Core Functionality**: Works without JavaScript (basic messaging)
- **Enhanced Experience**: Full features with modern browser APIs
- **WebRTC Fallback**: Graceful degradation when WebRTC unavailable
- **Offline Support**: Service worker for basic offline functionality
- **Responsive Design**: Mobile-first with desktop enhancements

---

## 7. Monitoring & Observability

### Error Tracking (MVP)
- **Client Errors**: Console logging + user reporting
- **Server Errors**: File logging with rotation
- **Database Errors**: Connection monitoring + slow query logging
- **Real-time Errors**: Socket.io connection failure tracking

### Performance Monitoring (MVP)
- **Core Web Vitals**: Browser-based measurement
- **API Performance**: Response time logging
- **Database Performance**: Query execution time tracking
- **Real-time Metrics**: Connection count, message throughput

### Health Checks
- **Application Health**: `/api/health` endpoint
- **Database Health**: Connection pool status
- **Socket.io Health**: Active connection monitoring
- **Disk Space**: File upload directory monitoring

---

## 8. Development Environment Setup

### Required Software
```bash
# Node.js & Package Manager
node --version  # v20+
npm --version   # v9+

# Database
postgres --version  # v15+
createdb slack_clone_dev

# Development Tools
docker --version    # For optional containerization
git --version      # For version control
```

### Environment Variables Template
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/slack_clone_dev"
DATABASE_POOL_SIZE=10

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Socket.io
SOCKET_IO_PORT=3001
SOCKET_IO_CORS_ORIGIN="http://localhost:3000"

# File Uploads
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760  # 10MB

# WebRTC
TURN_SERVER_URL="turn:localhost:3478"
TURN_USERNAME="username"
TURN_CREDENTIAL="password"
```

### Development Workflow
1. **Local Database**: PostgreSQL running on port 5432
2. **Next.js Dev**: `npm run dev` on port 3000
3. **Socket.io Server**: Separate Express process on port 3001
4. **File Uploads**: Local directory with proper permissions
5. **WebRTC**: STUN server for local development

---

## 9. Database Design & Schema

### Entity Relationship Diagram
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ workspaces  │    │   users     │    │  channels   │
│             │    │             │    │             │
│ id (PK)     │◄──┐│ id (PK)     │   ┌►│ id (PK)     │
│ name        │   ││ email       │   ││ workspace_id│
│ slug        │   ││ password    │   ││ name        │
│ created_at  │   ││ avatar_url  │   ││ type        │
│ settings    │   ││ created_at  │   ││ created_at  │
└─────────────┘   │└─────────────┘   │└─────────────┘
       │          │       │          │       │
       │          │       │          │       │
┌─────────────┐   │┌─────────────┐   │┌─────────────┐
│workspace_   │   ││  messages   │   ││message_     │
│members      │◄──┼┤             │◄──┼┤reactions    │
│             │   ││ id (PK)     │   ││             │
│ workspace_id│   ││ user_id     │   ││ message_id  │
│ user_id     │   ││ channel_id  │   ││ user_id     │
│ role        │   ││ content     │   ││ emoji       │
│ joined_at   │   ││ thread_id   │   ││ created_at  │
└─────────────┘   ││ created_at  │   │└─────────────┘
                  │└─────────────┘   │
                  │       │          │
┌─────────────┐   │┌─────────────┐   │┌─────────────┐
│  huddles    │   ││attachments  │   ││direct_      │
│             │   ││             │   ││messages     │
│ id (PK)     │◄──┼┤ id (PK)     │   ││             │
│ workspace_id│   ││ message_id  │   ││ id (PK)     │
│ channel_id  │   ││ filename    │   ││ sender_id   │
│ created_by  │   ││ url         │   ││ recipient_id│
│ status      │   ││ size        │   ││ content     │
│ created_at  │   ││ mime_type   │   ││ created_at  │
└─────────────┘   │└─────────────┘   │└─────────────┘
       │          │                  │
┌─────────────┐   │┌─────────────┐   │
│huddle_      │◄──┼┤user_        │   │
│participants │   ││presence     │   │
│             │   ││             │   │
│ huddle_id   │   ││ user_id     │◄──┘
│ user_id     │   ││ workspace_id│
│ joined_at   │   ││ status      │
│ left_at     │   ││ last_seen   │
└─────────────┘   │└─────────────┘
                  │
```

### Core Table Schemas

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### Workspaces Table
```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    avatar_url VARCHAR(500),
    settings JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_created_by ON workspaces(created_by);
```

#### Workspace Members Table
```sql
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member', 'guest');

CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    
    UNIQUE(workspace_id, user_id)
);

-- Indexes
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_role ON workspace_members(workspace_id, role);
```

#### Channels Table
```sql
CREATE TYPE channel_type AS ENUM ('public', 'private', 'direct');

CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type channel_type NOT NULL DEFAULT 'public',
    settings JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_channel_name CHECK (name ~ '^[a-z0-9-_]+$')
);

-- Indexes
CREATE INDEX idx_channels_workspace_id ON channels(workspace_id);
CREATE INDEX idx_channels_type ON channels(workspace_id, type);
CREATE UNIQUE INDEX idx_channels_workspace_name ON channels(workspace_id, name) WHERE type != 'direct';
```

#### Messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    thread_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 4000)
);

-- Indexes
CREATE INDEX idx_messages_channel_id ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_thread_id ON messages(thread_id, created_at);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

#### Message Reactions Table
```sql
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(message_id, user_id, emoji)
);

-- Indexes
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
```

#### Attachments Table
```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    url VARCHAR(500) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT check_file_size CHECK (size_bytes > 0 AND size_bytes <= 52428800) -- 50MB
);

-- Indexes
CREATE INDEX idx_attachments_message_id ON attachments(message_id);
CREATE INDEX idx_attachments_uploaded_by ON attachments(uploaded_by);
```

#### Huddles Table
```sql
CREATE TYPE huddle_status AS ENUM ('active', 'ended');

CREATE TABLE huddles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(200),
    status huddle_status NOT NULL DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_huddles_workspace_id ON huddles(workspace_id, status);
CREATE INDEX idx_huddles_channel_id ON huddles(channel_id, status);
CREATE INDEX idx_huddles_status ON huddles(status, started_at);
```

#### Huddle Participants Table
```sql
CREATE TABLE huddle_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    huddle_id UUID NOT NULL REFERENCES huddles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(huddle_id, user_id)
);

-- Indexes
CREATE INDEX idx_huddle_participants_huddle_id ON huddle_participants(huddle_id);
CREATE INDEX idx_huddle_participants_user_id ON huddle_participants(user_id);
CREATE INDEX idx_huddle_participants_active ON huddle_participants(huddle_id, user_id) WHERE left_at IS NULL;
```

#### User Presence Table
```sql
CREATE TYPE presence_status AS ENUM ('online', 'away', 'offline');

CREATE TABLE user_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    status presence_status NOT NULL DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, workspace_id)
);

-- Indexes
CREATE INDEX idx_user_presence_workspace_status ON user_presence(workspace_id, status);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen);
```

### Migration Strategy

#### Migration Management
- **Tool**: Drizzle Kit for schema management
- **Versioning**: Sequential numbered migrations (001_initial.sql, 002_add_threads.sql)
- **Rollback Strategy**: Down migrations for each schema change
- **Environment Sync**: Schema comparison between dev/prod environments

#### Seed Data Requirements
```sql
-- Default workspace for development
INSERT INTO workspaces (name, slug, created_by) VALUES 
('Default Workspace', 'default', '00000000-0000-0000-0000-000000000000');

-- General channel for each workspace
INSERT INTO channels (workspace_id, name, type, created_by) VALUES 
((SELECT id FROM workspaces WHERE slug = 'default'), 'general', 'public', '00000000-0000-0000-0000-000000000000');

-- Default emoji reactions
CREATE TABLE emoji_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emoji VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO emoji_presets (emoji, name, category, sort_order) VALUES
('👍', 'thumbs_up', 'reactions', 1),
('👎', 'thumbs_down', 'reactions', 2),
('😄', 'smile', 'reactions', 3),
('❤️', 'heart', 'reactions', 4),
('🎉', 'celebration', 'reactions', 5);
```

### Database Performance Optimization

#### Query Optimization Patterns
```sql
-- Efficient message pagination
SELECT m.*, u.display_name, u.avatar_url
FROM messages m
JOIN users u ON m.user_id = u.id
WHERE m.channel_id = $1
ORDER BY m.created_at DESC
LIMIT 50 OFFSET $2;

-- Thread message loading
WITH RECURSIVE thread_messages AS (
    SELECT * FROM messages WHERE id = $1
    UNION ALL
    SELECT m.* FROM messages m
    JOIN thread_messages tm ON m.thread_id = tm.id
)
SELECT * FROM thread_messages ORDER BY created_at;

-- Active huddle detection
SELECT h.*, COUNT(hp.user_id) as participant_count
FROM huddles h
LEFT JOIN huddle_participants hp ON h.id = hp.huddle_id AND hp.left_at IS NULL
WHERE h.workspace_id = $1 AND h.status = 'active'
GROUP BY h.id;
```

#### Connection Pooling Configuration
```typescript
// Database connection pool settings
const poolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,          // Maximum connections
  min: 2,           // Minimum connections
  idleTimeoutMillis: 30000,  // 30 second timeout
  connectionTimeoutMillis: 2000,  // 2 second connection timeout
};
```

---

## 10. API Design & Specifications

### RESTful API Endpoints

#### Authentication Endpoints
```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  workspaceSlug?: string; // Join existing workspace
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  };
  accessToken: string;
  refreshToken: string;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
  workspaceSlug?: string;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/auth/logout
interface LogoutRequest {
  refreshToken: string;
}
```

#### Workspace Management Endpoints
```typescript
// GET /api/workspaces - List user's workspaces
interface WorkspaceListResponse {
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    avatarUrl?: string;
    role: 'owner' | 'admin' | 'member' | 'guest';
    unreadCount: number;
  }>;
}

// POST /api/workspaces - Create new workspace
interface CreateWorkspaceRequest {
  name: string;
  slug: string;
  description?: string;
}

// GET /api/workspaces/:slug - Get workspace details
interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatarUrl?: string;
  settings: Record<string, any>;
  memberCount: number;
  createdAt: string;
}

// PUT /api/workspaces/:slug - Update workspace
interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  settings?: Record<string, any>;
}
```

#### Channel Management Endpoints
```typescript
// GET /api/workspaces/:slug/channels - List channels
interface ChannelListResponse {
  channels: Array<{
    id: string;
    name: string;
    type: 'public' | 'private' | 'direct';
    description?: string;
    unreadCount: number;
    lastMessage?: {
      content: string;
      timestamp: string;
      user: { displayName: string; };
    };
    isHuddleActive: boolean;
  }>;
}

// POST /api/workspaces/:slug/channels - Create channel
interface CreateChannelRequest {
  name: string;
  type: 'public' | 'private';
  description?: string;
  members?: string[]; // User IDs for private channels
}

// GET /api/channels/:channelId - Get channel details
interface ChannelResponse {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  description?: string;
  settings: Record<string, any>;
  members: Array<{
    userId: string;
    displayName: string;
    avatarUrl?: string;
    role: string;
  }>;
  createdAt: string;
}
```

#### Message Endpoints
```typescript
// GET /api/channels/:channelId/messages - Get messages with pagination
interface MessageListRequest {
  limit?: number; // Default 50, max 100
  before?: string; // Message ID for pagination
  after?: string;  // Message ID for pagination
}

interface MessageListResponse {
  messages: Array<{
    id: string;
    content: string;
    userId: string;
    user: {
      displayName: string;
      avatarUrl?: string;
    };
    threadId?: string;
    threadReplyCount?: number;
    reactions: Array<{
      emoji: string;
      count: number;
      users: string[]; // User IDs
    }>;
    attachments: Array<{
      id: string;
      filename: string;
      mimeType: string;
      size: number;
      url: string;
    }>;
    editedAt?: string;
    createdAt: string;
  }>;
  hasMore: boolean;
  nextCursor?: string;
}

// POST /api/channels/:channelId/messages - Send message
interface SendMessageRequest {
  content: string;
  threadId?: string;
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
    data: string; // Base64 encoded file data
  }>;
}

// PUT /api/messages/:messageId - Edit message
interface EditMessageRequest {
  content: string;
}

// DELETE /api/messages/:messageId - Delete message
```

#### Reaction Endpoints
```typescript
// POST /api/messages/:messageId/reactions - Add reaction
interface AddReactionRequest {
  emoji: string;
}

// DELETE /api/messages/:messageId/reactions/:emoji - Remove reaction
```

#### Huddle Endpoints
```typescript
// GET /api/channels/:channelId/huddles/active - Get active huddle
interface ActiveHuddleResponse {
  id: string;
  title?: string;
  participants: Array<{
    userId: string;
    displayName: string;
    avatarUrl?: string;
    joinedAt: string;
    isSpeaking: boolean;
  }>;
  startedAt: string;
}

// POST /api/channels/:channelId/huddles - Start huddle
interface StartHuddleRequest {
  title?: string;
}

// POST /api/huddles/:huddleId/join - Join huddle
interface JoinHuddleRequest {
  offer?: RTCSessionDescriptionInit; // WebRTC offer
}

interface JoinHuddleResponse {
  answer?: RTCSessionDescriptionInit; // WebRTC answer
  iceServers: RTCIceServer[];
}

// DELETE /api/huddles/:huddleId/leave - Leave huddle
```

#### File Upload Endpoints
```typescript
// POST /api/upload - Upload file
interface UploadResponse {
  id: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;
}
```

### WebSocket Event Specifications

#### Client → Server Events
```typescript
// Connection and authentication
interface JoinWorkspaceEvent {
  workspaceId: string;
  accessToken: string;
}

// Messaging events
interface SendMessageEvent {
  channelId: string;
  content: string;
  threadId?: string;
  tempId: string; // For optimistic UI updates
}

interface TypingStartEvent {
  channelId: string;
}

interface TypingStopEvent {
  channelId: string;
}

// Presence events
interface UpdatePresenceEvent {
  status: 'online' | 'away' | 'offline';
}

// Huddle events
interface JoinHuddleEvent {
  huddleId: string;
  offer: RTCSessionDescriptionInit;
}

interface HuddleSignalEvent {
  huddleId: string;
  signal: {
    type: 'offer' | 'answer' | 'ice-candidate';
    data: any;
    targetUserId?: string;
  };
}
```

#### Server → Client Events
```typescript
// Message events
interface MessageReceivedEvent {
  message: {
    id: string;
    channelId: string;
    content: string;
    userId: string;
    user: { displayName: string; avatarUrl?: string; };
    threadId?: string;
    createdAt: string;
  };
}

interface MessageUpdatedEvent {
  messageId: string;
  channelId: string;
  content: string;
  editedAt: string;
}

interface MessageDeletedEvent {
  messageId: string;
  channelId: string;
}

// Reaction events
interface ReactionAddedEvent {
  messageId: string;
  channelId: string;
  emoji: string;
  userId: string;
  user: { displayName: string; };
}

// Typing events
interface TypingEvent {
  channelId: string;
  userId: string;
  user: { displayName: string; };
  isTyping: boolean;
}

// Presence events
interface PresenceUpdateEvent {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
}

// Huddle events
interface HuddleStartedEvent {
  huddle: {
    id: string;
    channelId: string;
    title?: string;
    startedBy: { displayName: string; };
    startedAt: string;
  };
}

interface HuddleUserJoinedEvent {
  huddleId: string;
  user: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
  };
}

interface HuddleSignalEvent {
  huddleId: string;
  fromUserId: string;
  signal: {
    type: 'offer' | 'answer' | 'ice-candidate';
    data: any;
  };
}
```

### Authentication & Authorization Strategy

#### JWT Token Structure
```typescript
interface AccessTokenPayload {
  sub: string;           // User ID
  email: string;
  workspaceId?: string;  // Current workspace
  role?: string;         // Role in current workspace
  iat: number;           // Issued at
  exp: number;           // Expires at (15 minutes)
}

interface RefreshTokenPayload {
  sub: string;           // User ID
  tokenId: string;       // Unique token identifier
  iat: number;           // Issued at
  exp: number;           // Expires at (7 days)
}
```

#### Authorization Middleware
```typescript
// Permission checking for API endpoints
interface PermissionCheck {
  workspace?: {
    member: boolean;     // Must be workspace member
    role?: string[];     // Required roles
  };
  channel?: {
    member: boolean;     // Must be channel member
    type?: string[];     // Channel types allowed
  };
  resource?: {
    owner: boolean;      // Must own the resource
    createdBy?: boolean; // Must have created the resource
  };
}

// Example usage in API routes
const requireAuth = (permissions: PermissionCheck) => {
  // Middleware implementation
};
```

### Rate Limiting Strategy

#### Rate Limit Rules
```typescript
interface RateLimitRule {
  endpoint: string;
  requests: number;
  windowMs: number;
  per: 'user' | 'ip' | 'workspace';
}

const rateLimits: RateLimitRule[] = [
  // Authentication
  { endpoint: '/api/auth/login', requests: 5, windowMs: 15 * 60 * 1000, per: 'ip' },
  { endpoint: '/api/auth/register', requests: 3, windowMs: 60 * 60 * 1000, per: 'ip' },
  
  // Messaging
  { endpoint: '/api/channels/*/messages', requests: 60, windowMs: 60 * 1000, per: 'user' },
  
  // File uploads
  { endpoint: '/api/upload', requests: 10, windowMs: 60 * 1000, per: 'user' },
  
  // WebSocket events
  { endpoint: 'socket:send_message', requests: 100, windowMs: 60 * 1000, per: 'user' },
  { endpoint: 'socket:typing', requests: 30, windowMs: 60 * 1000, per: 'user' },
];
```

### Error Response Standards

#### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}

// Standard error codes
enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  
  // Permission errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  WORKSPACE_ACCESS_DENIED = 'WORKSPACE_ACCESS_DENIED',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}
```

### API Versioning Strategy

#### Version Header Strategy
```typescript
// API versioning through Accept header
// Accept: application/json; version=1
// Default to latest version if not specified

interface APIVersion {
  version: number;
  deprecated?: boolean;
  sunsetDate?: string;
  migrationGuide?: string;
}

const supportedVersions: APIVersion[] = [
  { version: 1, deprecated: false }
];
```

---

## 11. Final Technical Constraints & Considerations

### Performance Budget Enforcement
```typescript
// Bundle size monitoring
const bundleBudgets = {
  initial: 500 * 1024,      // 500KB gzipped
  chunks: 200 * 1024,       // 200KB per chunk
  assets: 100 * 1024,       // 100KB per asset
};

// API response time SLA
const apiSLA = {
  simple: 100,    // Simple queries <100ms
  complex: 250,   // Complex queries <250ms
  files: 500,     // File operations <500ms
};
```

### Security Implementation Checklist
- [ ] Input validation with Zod schemas
- [ ] SQL injection prevention via Drizzle ORM
- [ ] XSS protection with CSP headers
- [ ] CSRF protection for state-changing operations
- [ ] Rate limiting on all public endpoints
- [ ] File upload validation and scanning
- [ ] WebSocket origin validation
- [ ] Secure JWT token handling
- [ ] Password hashing with bcrypt (12+ rounds)
- [ ] HTTPS-only cookies with SameSite attributes

### Scalability Implementation Plan
1. **Phase 1** (MVP): Single server, local database
2. **Phase 2**: Database read replicas, Redis caching
3. **Phase 3**: Horizontal API scaling, CDN integration
4. **Phase 4**: Database sharding, microservice extraction

---

## Next Steps

This comprehensive technical specification provides the foundation for:
1. **Component Architecture**: Mapping UI components to technical implementations
2. **Development Planning**: Breaking down features into implementable tasks
3. **Implementation**: Concrete code structure and patterns

The architecture balances modern web standards with practical implementation constraints, ensuring we can deliver a production-ready Slack alternative that meets all performance, security, and scalability requirements.
