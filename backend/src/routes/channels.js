const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create a new channel
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { workspaceId, name, description, isPrivate = false } = req.body;

    if (!workspaceId || !name) {
      return res.status(400).json({ error: 'Workspace ID and channel name are required' });
    }

    // Check if user is member of workspace
    const memberCheck = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND is_active = true',
      [workspaceId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this workspace' });
    }

    // Check if channel name already exists in workspace
    const existingChannel = await pool.query(
      'SELECT id FROM channels WHERE workspace_id = $1 AND name = $2',
      [workspaceId, name.toLowerCase()]
    );

    if (existingChannel.rows.length > 0) {
      return res.status(409).json({ error: 'Channel with this name already exists' });
    }

    // Create channel
    const channelResult = await pool.query(
      `INSERT INTO channels (workspace_id, name, description, is_private, creator_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [workspaceId, name.toLowerCase(), description, isPrivate, req.user.id]
    );

    const channel = channelResult.rows[0];

    // Add creator as channel member and admin
    await pool.query(
      `INSERT INTO channel_members (channel_id, user_id, is_admin)
       VALUES ($1, $2, $3)`,
      [channel.id, req.user.id, true]
    );

    res.status(201).json({
      message: 'Channel created successfully',
      channel: channel
    });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// Get workspace channels
router.get('/workspace/:workspaceId', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Check if user is member of workspace
    const memberCheck = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND is_active = true',
      [workspaceId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this workspace' });
    }

    // Get channels user has access to
    const result = await pool.query(
      `SELECT DISTINCT c.*, 
              (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count,
              (SELECT COUNT(*) FROM messages WHERE channel_id = c.id) as message_count,
              cm.joined_at, cm.is_admin, cm.last_read_at
       FROM channels c
       LEFT JOIN channel_members cm ON c.id = cm.channel_id AND cm.user_id = $1
       WHERE c.workspace_id = $2 
         AND (c.is_private = false OR cm.user_id IS NOT NULL)
       ORDER BY c.created_at ASC`,
      [req.user.id, workspaceId]
    );

    res.json({ channels: result.rows });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Failed to get channels' });
  }
});

// Get channel details
router.get('/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;

    // Check if user is member of channel
    const memberCheck = await pool.query(
      'SELECT * FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      // Check if channel is public
      const channelCheck = await pool.query(
        'SELECT is_private FROM channels WHERE id = $1',
        [channelId]
      );

      if (channelCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Channel not found' });
      }

      if (channelCheck.rows[0].is_private) {
        return res.status(403).json({ error: 'You do not have access to this private channel' });
      }
    }

    // Get channel details
    const result = await pool.query(
      `SELECT c.*, 
              (SELECT COUNT(*) FROM channel_members WHERE channel_id = c.id) as member_count,
              (SELECT COUNT(*) FROM messages WHERE channel_id = c.id) as message_count,
              u.username as created_by_username, u.full_name as created_by_name
       FROM channels c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [channelId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    res.json({ 
      channel: result.rows[0],
      isMember: memberCheck.rows.length > 0,
      memberInfo: memberCheck.rows[0] || null
    });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ error: 'Failed to get channel' });
  }
});

// Get channel members
router.get('/:channelId/members', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;

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
      return res.status(403).json({ error: 'You do not have access to this private channel' });
    }

    // Get channel members
    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.full_name, u.avatar_url,
              u.status, u.status_message, u.is_online, u.last_seen,
              cm.joined_at, cm.is_admin, cm.last_read_at
       FROM users u
       INNER JOIN channel_members cm ON u.id = cm.user_id
       WHERE cm.channel_id = $1
       ORDER BY u.full_name ASC`,
      [channelId]
    );

    res.json({ members: result.rows });
  } catch (error) {
    console.error('Get channel members error:', error);
    res.status(500).json({ error: 'Failed to get channel members' });
  }
});

// Join channel
router.post('/:channelId/join', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;

    // Check if channel exists and is public
    const channelCheck = await pool.query(
      'SELECT workspace_id, is_private FROM channels WHERE id = $1',
      [channelId]
    );

    if (channelCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    if (channelCheck.rows[0].is_private) {
      return res.status(403).json({ error: 'Cannot join private channel without invitation' });
    }

    // Check if user is member of workspace
    const workspaceMemberCheck = await pool.query(
      'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND is_active = true',
      [channelCheck.rows[0].workspace_id, req.user.id]
    );

    if (workspaceMemberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You must be a member of the workspace to join channels' });
    }

    // Check if already a member
    const memberCheck = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, req.user.id]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(409).json({ error: 'You are already a member of this channel' });
    }

    // Add user to channel
    await pool.query(
      'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
      [channelId, req.user.id]
    );

    res.json({ message: 'Successfully joined channel' });
  } catch (error) {
    console.error('Join channel error:', error);
    res.status(500).json({ error: 'Failed to join channel' });
  }
});

// Leave channel
router.post('/:channelId/leave', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;

    // Check if user is member
    const memberCheck = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(400).json({ error: 'You are not a member of this channel' });
    }

    // Check if it's general channel
    const channelCheck = await pool.query(
      'SELECT name FROM channels WHERE id = $1',
      [channelId]
    );

    if (channelCheck.rows[0].name === 'general') {
      return res.status(400).json({ error: 'Cannot leave general channel' });
    }

    // Remove user from channel
    await pool.query(
      'DELETE FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, req.user.id]
    );

    res.json({ message: 'Successfully left channel' });
  } catch (error) {
    console.error('Leave channel error:', error);
    res.status(500).json({ error: 'Failed to leave channel' });
  }
});

// Add member to channel (for private channels)
router.post('/:channelId/add-member', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if requester is admin of channel
    const adminCheck = await pool.query(
      'SELECT is_admin FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, req.user.id]
    );

    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: 'Only channel admins can add members' });
    }

    // Check if user is already a member
    const memberCheck = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(409).json({ error: 'User is already a member of this channel' });
    }

    // Add user to channel
    await pool.query(
      'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
      [channelId, userId]
    );

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Update channel
router.put('/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name, description, topic } = req.body;

    // Check if user is admin of channel
    const adminCheck = await pool.query(
      'SELECT is_admin FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, req.user.id]
    );

    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ error: 'Only channel admins can update channel' });
    }

    const result = await pool.query(
      `UPDATE channels 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           topic = COALESCE($3, topic)
       WHERE id = $4
       RETURNING *`,
      [name?.toLowerCase(), description, topic, channelId]
    );

    res.json({
      message: 'Channel updated successfully',
      channel: result.rows[0]
    });
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({ error: 'Failed to update channel' });
  }
});

// Create direct message channel
router.post('/direct', authenticateToken, async (req, res) => {
  try {
    const { workspaceId, userId } = req.body;

    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'Workspace ID and user ID are required' });
    }

    // Check if both users are members of workspace
    const memberCheck = await pool.query(
      `SELECT COUNT(*) as count FROM workspace_members 
       WHERE workspace_id = $1 AND user_id IN ($2, $3) AND is_active = true`,
      [workspaceId, req.user.id, userId]
    );

    if (memberCheck.rows[0].count < 2) {
      return res.status(403).json({ error: 'Both users must be members of the workspace' });
    }

    // Check if direct channel already exists
    const existingChannel = await pool.query(
      `SELECT c.* FROM channels c
       INNER JOIN channel_members cm1 ON c.id = cm1.channel_id AND cm1.user_id = $1
       INNER JOIN channel_members cm2 ON c.id = cm2.channel_id AND cm2.user_id = $2
       WHERE c.workspace_id = $3 AND c.is_direct = true`,
      [req.user.id, userId, workspaceId]
    );

    if (existingChannel.rows.length > 0) {
      return res.json({ channel: existingChannel.rows[0] });
    }

    // Create direct message channel
    const channelResult = await pool.query(
      `INSERT INTO channels (workspace_id, name, is_private, is_direct, creator_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [workspaceId, `dm-${req.user.id}-${userId}`, true, true, req.user.id]
    );

    const channel = channelResult.rows[0];

    // Add both users to channel
    await pool.query(
      'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2), ($1, $3)',
      [channel.id, req.user.id, userId]
    );

    res.status(201).json({
      message: 'Direct message channel created',
      channel: channel
    });
  } catch (error) {
    console.error('Create direct channel error:', error);
    res.status(500).json({ error: 'Failed to create direct message channel' });
  }
});

module.exports = router;
