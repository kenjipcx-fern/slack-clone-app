const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/avatars';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5242880 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  }
});

// Get user profile
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT id, email, username, full_name, avatar_url, status, 
              status_message, timezone, is_online, last_seen, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get shared workspaces
    const workspaces = await pool.query(
      `SELECT DISTINCT w.id, w.name, w.slug, w.logo_url
       FROM workspaces w
       INNER JOIN workspace_members wm1 ON w.id = wm1.workspace_id AND wm1.user_id = $1
       INNER JOIN workspace_members wm2 ON w.id = wm2.workspace_id AND wm2.user_id = $2
       WHERE wm1.is_active = true AND wm2.is_active = true`,
      [req.user.id, userId]
    );

    res.json({
      user: result.rows[0],
      sharedWorkspaces: workspaces.rows
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Search users
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, workspaceId, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let query;
    let params;

    if (workspaceId) {
      // Search within workspace
      query = `
        SELECT DISTINCT u.id, u.email, u.username, u.full_name, u.avatar_url, 
                u.status, u.status_message, u.is_online, u.last_seen,
                wm.role as workspace_role
        FROM users u
        INNER JOIN workspace_members wm ON u.id = wm.user_id
        WHERE wm.workspace_id = $1 
          AND wm.is_active = true
          AND (u.username ILIKE $2 OR u.full_name ILIKE $2 OR u.email ILIKE $2)
          AND u.id != $3
        ORDER BY u.full_name ASC
        LIMIT $4
      `;
      params = [workspaceId, `%${q}%`, req.user.id, parseInt(limit)];
    } else {
      // Global search
      query = `
        SELECT u.id, u.email, u.username, u.full_name, u.avatar_url, 
               u.status, u.status_message, u.is_online, u.last_seen
        FROM users u
        WHERE (u.username ILIKE $1 OR u.full_name ILIKE $1 OR u.email ILIKE $1)
          AND u.id != $2
        ORDER BY u.full_name ASC
        LIMIT $3
      `;
      params = [`%${q}%`, req.user.id, parseInt(limit)];
    }

    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Update user status
router.put('/status', authenticateToken, async (req, res) => {
  try {
    const { status, statusMessage, isOnline } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET status = COALESCE($1, status),
           status_message = COALESCE($2, status_message),
           is_online = COALESCE($3, is_online),
           last_seen = CASE WHEN $3 = false THEN CURRENT_TIMESTAMP ELSE last_seen END
       WHERE id = $4
       RETURNING id, status, status_message, is_online, last_seen`,
      [status, statusMessage, isOnline, req.user.id]
    );

    res.json({
      message: 'Status updated successfully',
      status: result.rows[0]
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Get old avatar URL
    const oldAvatar = await pool.query(
      'SELECT avatar_url FROM users WHERE id = $1',
      [req.user.id]
    );

    // Update user avatar
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING avatar_url',
      [avatarUrl, req.user.id]
    );

    // Delete old avatar file if it exists and is not the default
    if (oldAvatar.rows[0].avatar_url && 
        oldAvatar.rows[0].avatar_url.startsWith('/uploads/avatars/')) {
      try {
        const oldPath = path.join(process.cwd(), oldAvatar.rows[0].avatar_url);
        await fs.unlink(oldPath);
      } catch (err) {
        console.error('Failed to delete old avatar:', err);
      }
    }

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: result.rows[0].avatar_url
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Get user's direct message conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.query;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    const result = await pool.query(
      `SELECT DISTINCT c.*, 
              u.id as other_user_id, u.username, u.full_name, u.avatar_url, 
              u.status, u.is_online,
              (SELECT content FROM messages 
               WHERE channel_id = c.id AND is_deleted = false 
               ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages 
               WHERE channel_id = c.id AND is_deleted = false 
               ORDER BY created_at DESC LIMIT 1) as last_message_time,
              cm.last_read_at,
              (SELECT COUNT(*) FROM messages 
               WHERE channel_id = c.id AND created_at > cm.last_read_at AND is_deleted = false) as unread_count
       FROM channels c
       INNER JOIN channel_members cm ON c.id = cm.channel_id AND cm.user_id = $1
       INNER JOIN channel_members cm2 ON c.id = cm2.channel_id AND cm2.user_id != $1
       INNER JOIN users u ON cm2.user_id = u.id
       WHERE c.workspace_id = $2 AND c.is_direct = true
       ORDER BY last_message_time DESC NULLS LAST`,
      [req.user.id, workspaceId]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    // This could be expanded to include more preferences stored in a separate table
    const result = await pool.query(
      'SELECT timezone, status, status_message FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { timezone, notifications, theme } = req.body;

    const result = await pool.query(
      'UPDATE users SET timezone = COALESCE($1, timezone) WHERE id = $2 RETURNING timezone',
      [timezone, req.user.id]
    );

    // In a real app, you might store additional preferences in a separate table
    res.json({
      message: 'Preferences updated successfully',
      preferences: {
        timezone: result.rows[0].timezone,
        notifications: notifications,
        theme: theme
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get online users in workspace
router.get('/online/:workspaceId', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Check if user is member of workspace
    const memberCheck = await pool.query(
      'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND is_active = true',
      [workspaceId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this workspace' });
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.status, u.status_message
       FROM users u
       INNER JOIN workspace_members wm ON u.id = wm.user_id
       WHERE wm.workspace_id = $1 AND wm.is_active = true AND u.is_online = true
       ORDER BY u.full_name ASC`,
      [workspaceId]
    );

    res.json({ onlineUsers: result.rows });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ error: 'Failed to get online users' });
  }
});

module.exports = router;
