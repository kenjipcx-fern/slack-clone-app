const jwt = require('jsonwebtoken');
const pool = require('../config/database');

module.exports = (io, socket) => {
  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userResult = await pool.query(
        'SELECT id, username, full_name, avatar_url FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        socket.emit('auth_error', 'User not found');
        return;
      }

      socket.userId = decoded.userId;
      socket.user = userResult.rows[0];

      // Update user online status
      await pool.query(
        'UPDATE users SET is_online = true, last_seen = CURRENT_TIMESTAMP WHERE id = $1',
        [socket.userId]
      );

      // Get user's workspaces and join socket rooms
      const workspaces = await pool.query(
        'SELECT workspace_id FROM workspace_members WHERE user_id = $1 AND is_active = true',
        [socket.userId]
      );

      for (const workspace of workspaces.rows) {
        socket.join(`workspace:${workspace.workspace_id}`);
        
        // Notify workspace members that user is online
        socket.to(`workspace:${workspace.workspace_id}`).emit('user_online', {
          userId: socket.userId,
          username: socket.user.username,
          fullName: socket.user.full_name
        });
      }

      // Get user's channels and join socket rooms
      const channels = await pool.query(
        'SELECT channel_id FROM channel_members WHERE user_id = $1',
        [socket.userId]
      );

      for (const channel of channels.rows) {
        socket.join(`channel:${channel.channel_id}`);
      }

      socket.emit('authenticated', { user: socket.user });
    } catch (error) {
      console.error('Socket auth error:', error);
      socket.emit('auth_error', 'Invalid token');
    }
  });

  // Join workspace
  socket.on('join_workspace', async (workspaceId) => {
    if (!socket.userId) return socket.emit('error', 'Not authenticated');

    // Verify user is member of workspace
    const memberCheck = await pool.query(
      'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND is_active = true',
      [workspaceId, socket.userId]
    );

    if (memberCheck.rows.length > 0) {
      socket.join(`workspace:${workspaceId}`);
      socket.emit('joined_workspace', { workspaceId });
    }
  });

  // Join channel
  socket.on('join_channel', async (channelId) => {
    if (!socket.userId) return socket.emit('error', 'Not authenticated');

    // Verify user has access to channel
    const accessCheck = await pool.query(
      `SELECT c.is_private, cm.user_id 
       FROM channels c
       LEFT JOIN channel_members cm ON c.id = cm.channel_id AND cm.user_id = $1
       WHERE c.id = $2`,
      [socket.userId, channelId]
    );

    if (accessCheck.rows.length > 0 && 
        (!accessCheck.rows[0].is_private || accessCheck.rows[0].user_id)) {
      socket.join(`channel:${channelId}`);
      socket.emit('joined_channel', { channelId });
    }
  });

  // Leave channel
  socket.on('leave_channel', (channelId) => {
    socket.leave(`channel:${channelId}`);
    socket.emit('left_channel', { channelId });
  });

  // Send message
  socket.on('send_message', async (data) => {
    if (!socket.userId) return socket.emit('error', 'Not authenticated');

    const { channelId, content, parentMessageId } = data;

    try {
      // Create message
      const messageResult = await pool.query(
        `INSERT INTO messages (channel_id, user_id, content, parent_message_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [channelId, socket.userId, content, parentMessageId || null]
      );

      const message = messageResult.rows[0];

      // Get full message with user info
      const fullMessage = await pool.query(
        `SELECT m.*, u.username, u.full_name, u.avatar_url,
                (SELECT COUNT(*) FROM message_reactions WHERE message_id = m.id) as reaction_count,
                (SELECT COUNT(*) FROM messages WHERE parent_message_id = m.id) as reply_count
         FROM messages m
         JOIN users u ON m.user_id = u.id
         WHERE m.id = $1`,
        [message.id]
      );

      // Emit to channel members
      io.to(`channel:${channelId}`).emit('new_message', {
        channelId,
        message: fullMessage.rows[0]
      });

      // If it's a reply, notify parent message author
      if (parentMessageId) {
        const parentMessage = await pool.query(
          'SELECT user_id FROM messages WHERE id = $1',
          [parentMessageId]
        );

        if (parentMessage.rows.length > 0 && parentMessage.rows[0].user_id !== socket.userId) {
          io.to(`user:${parentMessage.rows[0].user_id}`).emit('new_reply', {
            channelId,
            parentMessageId,
            reply: fullMessage.rows[0]
          });
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('message_error', 'Failed to send message');
    }
  });

  // Edit message
  socket.on('edit_message', async (data) => {
    if (!socket.userId) return socket.emit('error', 'Not authenticated');

    const { messageId, content } = data;

    try {
      // Check ownership
      const messageCheck = await pool.query(
        'SELECT channel_id, user_id FROM messages WHERE id = $1',
        [messageId]
      );

      if (messageCheck.rows.length === 0 || messageCheck.rows[0].user_id !== socket.userId) {
        return socket.emit('error', 'Cannot edit this message');
      }

      // Update message
      await pool.query(
        `UPDATE messages 
         SET content = $1, is_edited = true, edited_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [content, messageId]
      );

      // Emit to channel members
      io.to(`channel:${messageCheck.rows[0].channel_id}`).emit('message_edited', {
        messageId,
        content,
        editedAt: new Date()
      });
    } catch (error) {
      console.error('Edit message error:', error);
      socket.emit('error', 'Failed to edit message');
    }
  });

  // Delete message
  socket.on('delete_message', async (messageId) => {
    if (!socket.userId) return socket.emit('error', 'Not authenticated');

    try {
      // Check ownership
      const messageCheck = await pool.query(
        'SELECT channel_id, user_id FROM messages WHERE id = $1',
        [messageId]
      );

      if (messageCheck.rows.length === 0 || messageCheck.rows[0].user_id !== socket.userId) {
        return socket.emit('error', 'Cannot delete this message');
      }

      // Soft delete
      await pool.query(
        'UPDATE messages SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
        [messageId]
      );

      // Emit to channel members
      io.to(`channel:${messageCheck.rows[0].channel_id}`).emit('message_deleted', {
        messageId
      });
    } catch (error) {
      console.error('Delete message error:', error);
      socket.emit('error', 'Failed to delete message');
    }
  });

  // Add reaction
  socket.on('add_reaction', async (data) => {
    if (!socket.userId) return socket.emit('error', 'Not authenticated');

    const { messageId, emoji } = data;

    try {
      // Get message channel
      const messageResult = await pool.query(
        'SELECT channel_id FROM messages WHERE id = $1',
        [messageId]
      );

      if (messageResult.rows.length === 0) {
        return socket.emit('error', 'Message not found');
      }

      // Add reaction
      await pool.query(
        'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [messageId, socket.userId, emoji]
      );

      // Get updated reactions
      const reactions = await pool.query(
        `SELECT emoji, COUNT(*) as count,
                array_agg(json_build_object('id', u.id, 'username', u.username)) as users
         FROM message_reactions mr
         JOIN users u ON mr.user_id = u.id
         WHERE mr.message_id = $1
         GROUP BY emoji`,
        [messageId]
      );

      // Emit to channel members
      io.to(`channel:${messageResult.rows[0].channel_id}`).emit('reaction_added', {
        messageId,
        reactions: reactions.rows
      });
    } catch (error) {
      console.error('Add reaction error:', error);
      socket.emit('error', 'Failed to add reaction');
    }
  });

  // Remove reaction
  socket.on('remove_reaction', async (data) => {
    if (!socket.userId) return socket.emit('error', 'Not authenticated');

    const { messageId, emoji } = data;

    try {
      // Get message channel
      const messageResult = await pool.query(
        'SELECT channel_id FROM messages WHERE id = $1',
        [messageId]
      );

      if (messageResult.rows.length === 0) {
        return socket.emit('error', 'Message not found');
      }

      // Remove reaction
      await pool.query(
        'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
        [messageId, socket.userId, emoji]
      );

      // Get updated reactions
      const reactions = await pool.query(
        `SELECT emoji, COUNT(*) as count,
                array_agg(json_build_object('id', u.id, 'username', u.username)) as users
         FROM message_reactions mr
         JOIN users u ON mr.user_id = u.id
         WHERE mr.message_id = $1
         GROUP BY emoji`,
        [messageId]
      );

      // Emit to channel members
      io.to(`channel:${messageResult.rows[0].channel_id}`).emit('reaction_removed', {
        messageId,
        reactions: reactions.rows
      });
    } catch (error) {
      console.error('Remove reaction error:', error);
      socket.emit('error', 'Failed to remove reaction');
    }
  });

  // Typing indicator
  socket.on('typing_start', async (channelId) => {
    if (!socket.userId) return;

    socket.to(`channel:${channelId}`).emit('user_typing', {
      channelId,
      userId: socket.userId,
      username: socket.user?.username,
      fullName: socket.user?.full_name
    });
  });

  socket.on('typing_stop', async (channelId) => {
    if (!socket.userId) return;

    socket.to(`channel:${channelId}`).emit('user_stopped_typing', {
      channelId,
      userId: socket.userId
    });
  });

  // Huddle events
  socket.on('huddle_join', async (data) => {
    if (!socket.userId) return socket.emit('error', 'Not authenticated');

    const { huddleId } = data;

    socket.join(`huddle:${huddleId}`);
    
    // Get updated participants
    const participants = await pool.query(
      `SELECT hp.*, u.username, u.full_name, u.avatar_url
       FROM huddle_participants hp
       JOIN users u ON hp.user_id = u.id
       WHERE hp.huddle_id = $1 AND hp.left_at IS NULL`,
      [huddleId]
    );

    io.to(`huddle:${huddleId}`).emit('huddle_participant_joined', {
      huddleId,
      user: socket.user,
      participants: participants.rows
    });
  });

  socket.on('huddle_leave', async (huddleId) => {
    if (!socket.userId) return;

    socket.leave(`huddle:${huddleId}`);
    
    io.to(`huddle:${huddleId}`).emit('huddle_participant_left', {
      huddleId,
      userId: socket.userId
    });
  });

  socket.on('huddle_settings_update', async (data) => {
    if (!socket.userId) return;

    const { huddleId, isVideoEnabled, isAudioEnabled, isScreenSharing } = data;

    io.to(`huddle:${huddleId}`).emit('huddle_participant_settings', {
      huddleId,
      userId: socket.userId,
      isVideoEnabled,
      isAudioEnabled,
      isScreenSharing
    });
  });

  // WebRTC signaling for huddles
  socket.on('webrtc_offer', (data) => {
    socket.to(`user:${data.to}`).emit('webrtc_offer', {
      from: socket.userId,
      offer: data.offer
    });
  });

  socket.on('webrtc_answer', (data) => {
    socket.to(`user:${data.to}`).emit('webrtc_answer', {
      from: socket.userId,
      answer: data.answer
    });
  });

  socket.on('webrtc_ice_candidate', (data) => {
    socket.to(`user:${data.to}`).emit('webrtc_ice_candidate', {
      from: socket.userId,
      candidate: data.candidate
    });
  });

  // Presence updates
  socket.on('update_status', async (data) => {
    if (!socket.userId) return;

    const { status, statusMessage } = data;

    await pool.query(
      'UPDATE users SET status = $1, status_message = $2 WHERE id = $3',
      [status, statusMessage, socket.userId]
    );

    // Notify all workspaces
    const workspaces = await pool.query(
      'SELECT workspace_id FROM workspace_members WHERE user_id = $1 AND is_active = true',
      [socket.userId]
    );

    for (const workspace of workspaces.rows) {
      io.to(`workspace:${workspace.workspace_id}`).emit('user_status_changed', {
        userId: socket.userId,
        status,
        statusMessage
      });
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    if (!socket.userId) return;

    // Update user offline status
    await pool.query(
      'UPDATE users SET is_online = false, last_seen = CURRENT_TIMESTAMP WHERE id = $1',
      [socket.userId]
    );

    // Notify workspaces
    const workspaces = await pool.query(
      'SELECT workspace_id FROM workspace_members WHERE user_id = $1 AND is_active = true',
      [socket.userId]
    );

    for (const workspace of workspaces.rows) {
      socket.to(`workspace:${workspace.workspace_id}`).emit('user_offline', {
        userId: socket.userId
      });
    }
  });
};
