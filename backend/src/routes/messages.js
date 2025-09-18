const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/attachments';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm',
      'audio/mpeg', 'audio/wav',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Send a message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { channelId, content, parentMessageId } = req.body;

    if (!channelId || !content) {
      return res.status(400).json({ error: 'Channel ID and content are required' });
    }

    // Check if user is member of channel
    const memberCheck = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      // Check if channel is public
      const channelCheck = await pool.query(
        'SELECT is_private FROM channels WHERE id = $1',
        [channelId]
      );

      if (channelCheck.rows.length === 0 || channelCheck.rows[0].is_private) {
        return res.status(403).json({ error: 'You cannot send messages to this channel' });
      }
    }

    // Create message
    const result = await pool.query(
      `INSERT INTO messages (channel_id, user_id, content, parent_message_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [channelId, req.user.id, content, parentMessageId || null]
    );

    const message = result.rows[0];

    // Update last_read_at for sender
    if (memberCheck.rows.length > 0) {
      await pool.query(
        'UPDATE channel_members SET last_read_at = CURRENT_TIMESTAMP WHERE channel_id = $1 AND user_id = $2',
        [channelId, req.user.id]
      );
    }

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

    res.status(201).json({
      message: 'Message sent successfully',
      data: fullMessage.rows[0]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get channel messages
router.get('/channel/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before, after } = req.query;

    // Check if user has access to channel
    const accessCheck = await pool.query(
      `SELECT c.is_private, cm.user_id 
       FROM channels c
       LEFT JOIN channel_members cm ON c.id = cm.channel_id AND cm.user_id = $1
       WHERE c.id = $2`,
      [req.user.id, channelId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    if (accessCheck.rows[0].is_private && !accessCheck.rows[0].user_id) {
      return res.status(403).json({ error: 'You do not have access to this channel' });
    }

    // Build query conditions
    let whereConditions = ['m.channel_id = $1', 'm.parent_message_id IS NULL', 'm.is_deleted = false'];
    let params = [channelId];
    let paramIndex = 2;

    if (before) {
      whereConditions.push(`m.created_at < $${paramIndex}`);
      params.push(before);
      paramIndex++;
    }

    if (after) {
      whereConditions.push(`m.created_at > $${paramIndex}`);
      params.push(after);
      paramIndex++;
    }

    // Get messages
    const result = await pool.query(
      `SELECT m.*, u.username, u.full_name, u.avatar_url, u.is_online,
              (SELECT COUNT(*) FROM message_reactions WHERE message_id = m.id) as reaction_count,
              (SELECT COUNT(*) FROM messages WHERE parent_message_id = m.id AND is_deleted = false) as reply_count,
              (SELECT json_agg(json_build_object(
                'id', ma.id,
                'fileName', ma.file_name,
                'fileUrl', ma.file_url,
                'fileType', ma.file_type,
                'fileSize', ma.file_size,
                'thumbnailUrl', ma.thumbnail_url
              )) FROM message_attachments ma WHERE ma.message_id = m.id) as attachments
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY m.created_at DESC
       LIMIT ${parseInt(limit)}`,
      params
    );

    // Update last_read_at if user is a member
    if (accessCheck.rows[0].user_id) {
      await pool.query(
        'UPDATE channel_members SET last_read_at = CURRENT_TIMESTAMP WHERE channel_id = $1 AND user_id = $2',
        [channelId, req.user.id]
      );
    }

    res.json({ messages: result.rows.reverse() }); // Reverse to get chronological order
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Get message thread (replies)
router.get('/:messageId/thread', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Get parent message
    const parentResult = await pool.query(
      `SELECT m.*, u.username, u.full_name, u.avatar_url,
              c.id as channel_id, c.is_private
       FROM messages m
       JOIN users u ON m.user_id = u.id
       JOIN channels c ON m.channel_id = c.id
       WHERE m.id = $1 AND m.is_deleted = false`,
      [messageId]
    );

    if (parentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const parent = parentResult.rows[0];

    // Check if user has access to channel
    if (parent.is_private) {
      const memberCheck = await pool.query(
        'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
        [parent.channel_id, req.user.id]
      );

      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: 'You do not have access to this message' });
      }
    }

    // Get replies
    const repliesResult = await pool.query(
      `SELECT m.*, u.username, u.full_name, u.avatar_url, u.is_online,
              (SELECT COUNT(*) FROM message_reactions WHERE message_id = m.id) as reaction_count
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.parent_message_id = $1 AND m.is_deleted = false
       ORDER BY m.created_at ASC`,
      [messageId]
    );

    res.json({
      parent: parent,
      replies: repliesResult.rows
    });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ error: 'Failed to get message thread' });
  }
});

// Edit message
router.put('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Check if user owns the message
    const messageCheck = await pool.query(
      'SELECT user_id FROM messages WHERE id = $1 AND is_deleted = false',
      [messageId]
    );

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (messageCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    // Update message
    const result = await pool.query(
      `UPDATE messages 
       SET content = $1, is_edited = true, edited_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [content, messageId]
    );

    res.json({
      message: 'Message updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Delete message (soft delete)
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    // Check if user owns the message
    const messageCheck = await pool.query(
      'SELECT user_id, channel_id FROM messages WHERE id = $1 AND is_deleted = false',
      [messageId]
    );

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user owns message or is channel admin
    const isOwner = messageCheck.rows[0].user_id === req.user.id;
    
    if (!isOwner) {
      const adminCheck = await pool.query(
        'SELECT is_admin FROM channel_members WHERE channel_id = $1 AND user_id = $2',
        [messageCheck.rows[0].channel_id, req.user.id]
      );

      if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
        return res.status(403).json({ error: 'You can only delete your own messages' });
      }
    }

    // Soft delete message
    await pool.query(
      'UPDATE messages SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [messageId]
    );

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Add reaction to message
router.post('/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    // Check if message exists and user has access
    const messageCheck = await pool.query(
      `SELECT m.id, c.is_private 
       FROM messages m
       JOIN channels c ON m.channel_id = c.id
       WHERE m.id = $1 AND m.is_deleted = false`,
      [messageId]
    );

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check existing reaction
    const existingReaction = await pool.query(
      'SELECT id FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, req.user.id, emoji]
    );

    if (existingReaction.rows.length > 0) {
      return res.status(409).json({ error: 'You have already reacted with this emoji' });
    }

    // Add reaction
    await pool.query(
      'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
      [messageId, req.user.id, emoji]
    );

    // Get updated reactions
    const reactions = await pool.query(
      `SELECT emoji, COUNT(*) as count,
              array_agg(json_build_object('id', u.id, 'username', u.username, 'fullName', u.full_name)) as users
       FROM message_reactions mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.message_id = $1
       GROUP BY emoji`,
      [messageId]
    );

    res.json({
      message: 'Reaction added successfully',
      reactions: reactions.rows
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction from message
router.delete('/:messageId/reactions/:emoji', authenticateToken, async (req, res) => {
  try {
    const { messageId, emoji } = req.params;

    // Remove reaction
    const result = await pool.query(
      'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3 RETURNING id',
      [messageId, req.user.id, emoji]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reaction not found' });
    }

    // Get updated reactions
    const reactions = await pool.query(
      `SELECT emoji, COUNT(*) as count,
              array_agg(json_build_object('id', u.id, 'username', u.username, 'fullName', u.full_name)) as users
       FROM message_reactions mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.message_id = $1
       GROUP BY emoji`,
      [messageId]
    );

    res.json({
      message: 'Reaction removed successfully',
      reactions: reactions.rows
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Get message reactions
router.get('/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const reactions = await pool.query(
      `SELECT emoji, COUNT(*) as count,
              array_agg(json_build_object(
                'id', u.id, 
                'username', u.username, 
                'fullName', u.full_name,
                'avatarUrl', u.avatar_url
              )) as users
       FROM message_reactions mr
       JOIN users u ON mr.user_id = u.id
       WHERE mr.message_id = $1
       GROUP BY emoji`,
      [messageId]
    );

    res.json({ reactions: reactions.rows });
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ error: 'Failed to get reactions' });
  }
});

// Upload attachment
router.post('/upload', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    const { messageId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const attachments = [];

    for (const file of req.files) {
      const fileUrl = `/uploads/attachments/${file.filename}`;
      
      // Save attachment to database if messageId provided
      if (messageId) {
        const result = await pool.query(
          `INSERT INTO message_attachments (message_id, file_name, file_url, file_type, file_size)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [messageId, file.originalname, fileUrl, file.mimetype, file.size]
        );
        attachments.push(result.rows[0]);
      } else {
        attachments.push({
          fileName: file.originalname,
          fileUrl: fileUrl,
          fileType: file.mimetype,
          fileSize: file.size
        });
      }
    }

    res.json({
      message: 'Files uploaded successfully',
      attachments: attachments
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Search messages
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, workspaceId, channelId, userId, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let query = `
      SELECT DISTINCT m.*, u.username, u.full_name, u.avatar_url,
             c.name as channel_name, c.id as channel_id,
             w.name as workspace_name, w.id as workspace_id
      FROM messages m
      JOIN users u ON m.user_id = u.id
      JOIN channels c ON m.channel_id = c.id
      JOIN workspaces w ON c.workspace_id = w.id
      JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = $1
      LEFT JOIN channel_members cm ON c.id = cm.channel_id AND cm.user_id = $1
      WHERE m.is_deleted = false
        AND m.content ILIKE $2
        AND (c.is_private = false OR cm.user_id IS NOT NULL)
    `;

    const params = [req.user.id, `%${q}%`];
    let paramIndex = 3;

    if (workspaceId) {
      query += ` AND w.id = $${paramIndex}`;
      params.push(workspaceId);
      paramIndex++;
    }

    if (channelId) {
      query += ` AND c.id = $${paramIndex}`;
      params.push(channelId);
      paramIndex++;
    }

    if (userId) {
      query += ` AND m.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    query += ` ORDER BY m.created_at DESC LIMIT ${parseInt(limit)}`;

    const result = await pool.query(query, params);

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

module.exports = router;
