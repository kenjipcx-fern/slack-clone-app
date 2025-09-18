const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create a new workspace
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, logoUrl } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    // Check if slug already exists
    const existingWorkspace = await pool.query(
      'SELECT id FROM workspaces WHERE slug = $1',
      [slug]
    );

    if (existingWorkspace.rows.length > 0) {
      return res.status(409).json({ error: 'Workspace with this name already exists' });
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create workspace
      const workspaceResult = await client.query(
        `INSERT INTO workspaces (name, slug, owner_id, logo_url, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, slug, req.user.id, logoUrl, description]
      );

      const workspace = workspaceResult.rows[0];

      // Add owner as workspace member
      await client.query(
        `INSERT INTO workspace_members (workspace_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [workspace.id, req.user.id, 'admin']
      );

      // Create default channel
      const channelResult = await client.query(
        `INSERT INTO channels (workspace_id, name, description, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [workspace.id, 'general', 'General discussion channel', req.user.id]
      );

      // Add owner to general channel
      await client.query(
        `INSERT INTO channel_members (channel_id, user_id, is_admin)
         VALUES ($1, $2, $3)`,
        [channelResult.rows[0].id, req.user.id, true]
      );

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Workspace created successfully',
        workspace: workspace,
        defaultChannel: channelResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// Get user's workspaces
router.get('/my-workspaces', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, wm.role, wm.joined_at,
              (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count
       FROM workspaces w
       INNER JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = $1 AND wm.is_active = true
       ORDER BY wm.joined_at DESC`,
      [req.user.id]
    );

    res.json({ workspaces: result.rows });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Failed to get workspaces' });
  }
});

// Get workspace details
router.get('/:workspaceId', authenticateToken, async (req, res) => {
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

    // Get workspace details
    const workspaceResult = await pool.query(
      `SELECT w.*, 
              (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id AND is_active = true) as member_count,
              (SELECT COUNT(*) FROM channels WHERE workspace_id = w.id) as channel_count
       FROM workspaces w
       WHERE w.id = $1`,
      [workspaceId]
    );

    if (workspaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json({ 
      workspace: workspaceResult.rows[0],
      userRole: memberCheck.rows[0].role 
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Failed to get workspace' });
  }
});

// Get workspace members
router.get('/:workspaceId/members', authenticateToken, async (req, res) => {
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

    // Get members
    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.full_name, u.avatar_url, 
              u.status, u.status_message, u.is_online, u.last_seen,
              wm.role, wm.joined_at
       FROM users u
       INNER JOIN workspace_members wm ON u.id = wm.user_id
       WHERE wm.workspace_id = $1 AND wm.is_active = true
       ORDER BY u.full_name ASC`,
      [workspaceId]
    );

    res.json({ members: result.rows });
  } catch (error) {
    console.error('Get workspace members error:', error);
    res.status(500).json({ error: 'Failed to get workspace members' });
  }
});

// Invite user to workspace
router.post('/:workspaceId/invite', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if requester is admin
    const adminCheck = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND role = $3',
      [workspaceId, req.user.id, 'admin']
    );

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only admins can invite users' });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found with this email' });
    }

    const invitedUserId = userResult.rows[0].id;

    // Check if user is already a member
    const existingMember = await pool.query(
      'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, invitedUserId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(409).json({ error: 'User is already a member of this workspace' });
    }

    // Add user to workspace
    const result = await pool.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [workspaceId, invitedUserId, role]
    );

    // Add user to general channel
    const generalChannel = await pool.query(
      'SELECT id FROM channels WHERE workspace_id = $1 AND name = $2',
      [workspaceId, 'general']
    );

    if (generalChannel.rows.length > 0) {
      await pool.query(
        'INSERT INTO channel_members (channel_id, user_id) VALUES ($1, $2)',
        [generalChannel.rows[0].id, invitedUserId]
      );
    }

    res.status(201).json({
      message: 'User invited successfully',
      member: result.rows[0]
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: 'Failed to invite user' });
  }
});

// Leave workspace
router.post('/:workspaceId/leave', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Check if user is owner
    const ownerCheck = await pool.query(
      'SELECT owner_id FROM workspaces WHERE id = $1',
      [workspaceId]
    );

    if (ownerCheck.rows.length > 0 && ownerCheck.rows[0].owner_id === req.user.id) {
      return res.status(400).json({ error: 'Owner cannot leave workspace. Transfer ownership first.' });
    }

    // Remove user from workspace
    await pool.query(
      'UPDATE workspace_members SET is_active = false WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, req.user.id]
    );

    // Remove user from all channels in workspace
    await pool.query(
      `DELETE FROM channel_members 
       WHERE user_id = $1 AND channel_id IN (
         SELECT id FROM channels WHERE workspace_id = $2
       )`,
      [req.user.id, workspaceId]
    );

    res.json({ message: 'Successfully left workspace' });
  } catch (error) {
    console.error('Leave workspace error:', error);
    res.status(500).json({ error: 'Failed to leave workspace' });
  }
});

// Update workspace
router.put('/:workspaceId', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, logoUrl } = req.body;

    // Check if user is admin
    const adminCheck = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND role = $3',
      [workspaceId, req.user.id, 'admin']
    );

    if (adminCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only admins can update workspace' });
    }

    const result = await pool.query(
      `UPDATE workspaces 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           logo_url = COALESCE($3, logo_url)
       WHERE id = $4
       RETURNING *`,
      [name, description, logoUrl, workspaceId]
    );

    res.json({
      message: 'Workspace updated successfully',
      workspace: result.rows[0]
    });
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
});

module.exports = router;
