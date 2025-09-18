export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  status?: string;
  statusEmoji?: string;
  isOnline?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  role?: 'owner' | 'admin' | 'member';
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  isPrivate: boolean;
  isDm: boolean;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  lastMessage?: Message;
  unreadCount?: number;
  dmUser?: User;
}

export interface Message {
  id: string;
  content: string;
  channelId: string;
  userId: string;
  user?: User;
  parentMessageId?: string;
  replyCount?: number;
  reactions?: Reaction[];
  attachments?: Attachment[];
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: string;
  emoji: string;
  messageId: string;
  userId: string;
  users?: User[];
  count?: number;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface Huddle {
  id: string;
  channelId: string;
  channel?: Channel;
  participants: HuddleParticipant[];
  createdAt: string;
  endedAt?: string;
}

export interface HuddleParticipant {
  userId: string;
  user?: User;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  joinedAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  user?: User;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface ChannelMember {
  id: string;
  userId: string;
  user?: User;
  channelId: string;
  joinedAt: string;
}

export interface ThreadMessage extends Message {
  replies?: Message[];
}

export interface SearchResult {
  messages: Message[];
  channels: Channel[];
  users: User[];
}

export interface Emoji {
  emoji: string;
  name: string;
  category: string;
}

export interface EmojiCategory {
  category: string;
  emojis: Emoji[];
}
