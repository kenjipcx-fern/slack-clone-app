const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Start a huddle
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { channelId, title } = req.body;

    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }

    // Check if user is member of channel
    const memberCheck = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this channel' });
    }

    // Check if there's already an active huddle in this channel
    const activeHuddle = await pool.query(
      'SELECT id FROM huddles WHERE channel_id = $1 AND is_active = true',
      [channelId]
    );

    if (activeHuddle.rows.length > 0) {
      return res.status(409).json({ 
        error: 'There is already an active huddle in this channel',
        huddleId: activeHuddle.rows[0].id
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create huddle
      const huddleResult = await client.query(
        `INSERT INTO huddles (channel_id, started_by, title)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [channelId, req.user.id, title || 'Huddle']
      );

      const huddle = huddleResult.rows[0];

      // Add creator as first participant
      await client.query(
        `INSERT INTO huddle_participants (huddle_id, user_id, is_audio_enabled)
         VALUES ($1, $2, true)`,
        [huddle.id, req.user.id]
      );

      await client.query('COMMIT');

      // Get full huddle info
      const fullHuddle = await pool.query(
        `SELECT h.*, u.username, u.full_name, u.avatar_url,
                c.name as channel_name
         FROM huddles h
         JOIN users u ON h.started_by = u.id
         JOIN channels c ON h.channel_id = c.id
         WHERE h.id = $1`,
        [huddle.id]
      );

      res.status(201).json({
        message: 'Huddle started successfully',
        huddle: fullHuddle.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Start huddle error:', error);
    res.status(500).json({ error: 'Failed to start huddle' });
  }
});

// Join a huddle
router.post('/:huddleId/join', authenticateToken, async (req, res) => {
  try {
    const { huddleId } = req.params;
    const { isVideoEnabled = false, isAudioEnabled = true } = req.body;

    // Check if huddle exists and is active
    const huddleCheck = await pool.query(
      `SELECT h.*, c.id as channel_id
       FROM huddles h
       JOIN channels c ON h.channel_id = c.id
       WHERE h.id = $1 AND h.is_active = true`,
      [huddleId]
    );

    if (huddleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Active huddle not found' });
    }

    const huddle = huddleCheck.rows[0];

    // Check if user is member of channel
    const memberCheck = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [huddle.channel_id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this channel' });
    }

    // Check if already in huddle
    const participantCheck = await pool.query(
      'SELECT id, left_at FROM huddle_participants WHERE huddle_id = $1 AND user_id = $2',
      [huddleId, req.user.id]
    );

    if (participantCheck.rows.length > 0 && !participantCheck.rows[0].left_at) {
      return res.status(409).json({ error: 'You are already in this huddle' });
    }

    if (participantCheck.rows.length > 0) {
      // Rejoin huddle
      await pool.query(
        `UPDATE huddle_participants 
         SET joined_at = CURRENT_TIMESTAMP, left_at = NULL,
             is_video_enabled = $1, is_audio_enabled = $2
         WHERE huddle_id = $3 AND user_id = $4`,
        [isVideoEnabled, isAudioEnabled, huddleId, req.user.id]
      );
    } else {
      // Join huddle for first time
      await pool.query(
        `INSERT INTO huddle_participants (huddle_id, user_id, is_video_enabled, is_audio_enabled)
         VALUES ($1, $2, $3, $4)`,
        [huddleId, req.user.id, isVideoEnabled, isAudioEnabled]
      );
    }

    // Get current participants
    const participants = await pool.query(
      `SELECT hp.*, u.username, u.full_name, u.avatar_url
       FROM huddle_participants hp
       JOIN users u ON hp.user_id = u.id
       WHERE hp.huddle_id = $1 AND hp.left_at IS NULL`,
      [huddleId]
    );

    res.json({
      message: 'Joined huddle successfully',
      participants: participants.rows
    });
  } catch (error) {
    console.error('Join huddle error:', error);
    res.status(500).json({ error: 'Failed to join huddle' });
  }
});

// Leave a huddle
router.post('/:huddleId/leave', authenticateToken, async (req, res) => {
  try {
    const { huddleId } = req.params;

    // Update participant record
    const result = await pool.query(
      `UPDATE huddle_participants 
       SET left_at = CURRENT_TIMESTAMP
       WHERE huddle_id = $1 AND user_id = $2 AND left_at IS NULL
       RETURNING id`,
      [huddleId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'You are not in this huddle' });
    }

    // Check if there are any active participants left
    const activeParticipants = await pool.query(
      'SELECT COUNT(*) as count FROM huddle_participants WHERE huddle_id = $1 AND left_at IS NULL',
      [huddleId]
    );

    // If no participants left, end the huddle
    if (activeParticipants.rows[0].count === 0) {
      await pool.query(
        'UPDATE huddles SET is_active = false, ended_at = CURRENT_TIMESTAMP WHERE id = $1',
        [huddleId]
      );
    }

    res.json({ message: 'Left huddle successfully' });
  } catch (error) {
    console.error('Leave huddle error:', error);
    res.status(500).json({ error: 'Failed to leave huddle' });
  }
});

// End a huddle (only for huddle starter or channel admin)
router.post('/:huddleId/end', authenticateToken, async (req, res) => {
  try {
    const { huddleId } = req.params;

    // Get huddle details
    const huddleResult = await pool.query(
      'SELECT started_by, channel_id FROM huddles WHERE id = $1 AND is_active = true',
      [huddleId]
    );

    if (huddleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Active huddle not found' });
    }

    const huddle = huddleResult.rows[0];

    // Check if user can end huddle (starter or channel admin)
    if (huddle.started_by !== req.user.id) {
      const adminCheck = await pool.query(
        'SELECT is_admin FROM channel_members WHERE channel_id = $1 AND user_id = $2',
        [huddle.channel_id, req.user.id]
      );

      if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
        return res.status(403).json({ error: 'Only huddle starter or channel admin can end huddle' });
      }
    }

    // End huddle
    await pool.query(
      'UPDATE huddles SET is_active = false, ended_at = CURRENT_TIMESTAMP WHERE id = $1',
      [huddleId]
    );

    // Mark all participants as left
    await pool.query(
      'UPDATE huddle_participants SET left_at = CURRENT_TIMESTAMP WHERE huddle_id = $1 AND left_at IS NULL',
      [huddleId]
    );

    res.json({ message: 'Huddle ended successfully' });
  } catch (error) {
    console.error('End huddle error:', error);
    res.status(500).json({ error: 'Failed to end huddle' });
  }
});

// Get active huddle in channel
router.get('/channel/:channelId/active', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;

    // Check if user is member of channel
    const memberCheck = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this channel' });
    }

    // Get active huddle
    const huddleResult = await pool.query(
      `SELECT h.*, u.username as starter_username, u.full_name as starter_name,
              (SELECT COUNT(*) FROM huddle_participants WHERE huddle_id = h.id AND left_at IS NULL) as participant_count
       FROM huddles h
       JOIN users u ON h.started_by = u.id
       WHERE h.channel_id = $1 AND h.is_active = true`,
      [channelId]
    );

    if (huddleResult.rows.length === 0) {
      return res.json({ huddle: null });
    }

    // Get participants
    const participants = await pool.query(
      `SELECT hp.*, u.username, u.full_name, u.avatar_url
       FROM huddle_participants hp
       JOIN users u ON hp.user_id = u.id
       WHERE hp.huddle_id = $1 AND hp.left_at IS NULL`,
      [huddleResult.rows[0].id]
    );

    res.json({
      huddle: huddleResult.rows[0],
      participants: participants.rows
    });
  } catch (error) {
    console.error('Get active huddle error:', error);
    res.status(500).json({ error: 'Failed to get active huddle' });
  }
});

// Get huddle participants
router.get('/:huddleId/participants', authenticateToken, async (req, res) => {
  try {
    const { huddleId } = req.params;

    // Check if huddle exists
    const huddleCheck = await pool.query(
      'SELECT channel_id FROM huddles WHERE id = $1',
      [huddleId]
    );

    if (huddleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Huddle not found' });
    }

    // Check if user is member of channel
    const memberCheck = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [huddleCheck.rows[0].channel_id, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this channel' });
    }

    // Get participants
    const participants = await pool.query(
      `SELECT hp.*, u.username, u.full_name, u.avatar_url, u.status
       FROM huddle_participants hp
       JOIN users u ON hp.user_id = u.id
       WHERE hp.huddle_id = $1
       ORDER BY hp.joined_at ASC`,
      [huddleId]
    );

    res.json({ participants: participants.rows });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ error: 'Failed to get huddle participants' });
  }
});

// Update participant settings (mute/unmute, video on/off, screen share)
router.put('/:huddleId/settings', authenticateToken, async (req, res) => {
  try {
    const { huddleId } = req.params;
    const { isVideoEnabled, isAudioEnabled, isScreenSharing } = req.body;

    // Check if user is in huddle
    const participantCheck = await pool.query(
      'SELECT id FROM huddle_participants WHERE huddle_id = $1 AND user_id = $2 AND left_at IS NULL',
      [huddleId, req.user.id]
    );

    if (participantCheck.rows.length === 0) {
      return res.status(404).json({ error: 'You are not in this huddle' });
    }

    // Update settings
    const result = await pool.query(
      `UPDATE huddle_participants 
       SET is_video_enabled = COALESCE($1, is_video_enabled),
           is_audio_enabled = COALESCE($2, is_audio_enabled),
           is_screen_sharing = COALESCE($3, is_screen_sharing)
       WHERE huddle_id = $4 AND user_id = $5
       RETURNING *`,
      [isVideoEnabled, isAudioEnabled, isScreenSharing, huddleId, req.user.id]
    );

    res.json({
      message: 'Settings updated successfully',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update huddle settings' });
  }
});

// Get huddle history for a channel
router.get('/channel/:channelId/history', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 10 } = req.query;

    // Check if user is member of channel
    const memberCheck = await pool.query(
      'SELECT id FROM channel_members WHERE channel_id = $1 AND user_id = $2',
      [channelId, req.user.id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this channel' });
    }

    // Get huddle history
    const huddles = await pool.query(
      `SELECT h.*, u.username as starter_username, u.full_name as starter_name,
              (SELECT COUNT(DISTINCT user_id) FROM huddle_participants WHERE huddle_id = h.id) as total_participants,
              EXTRACT(EPOCH FROM (COALESCE(h.ended_at, CURRENT_TIMESTAMP) - h.started_at)) as duration_seconds
       FROM huddles h
       JOIN users u ON h.started_by = u.id
       WHERE h.channel_id = $1
       ORDER BY h.started_at DESC
       LIMIT $2`,
      [channelId, parseInt(limit)]
    );

    res.json({ huddles: huddles.rows });
  } catch (error) {
    console.error('Get huddle history error:', error);
    res.status(500).json({ error: 'Failed to get huddle history' });
  }
});

module.exports = router;
