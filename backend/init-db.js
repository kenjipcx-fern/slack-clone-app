const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon') ? {
    rejectUnauthorized: false
  } : false
});

async function initDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Database schema created successfully');
    
    // Create default test data (optional)
    const testDataEnabled = process.env.CREATE_TEST_DATA === 'true';
    
    if (testDataEnabled) {
      console.log('🔄 Creating test data...');
      
      // Create test users
      const testUsers = [
        { email: 'john@example.com', username: 'john', fullName: 'John Doe', password: 'password123' },
        { email: 'jane@example.com', username: 'jane', fullName: 'Jane Smith', password: 'password123' },
        { email: 'bob@example.com', username: 'bob', fullName: 'Bob Johnson', password: 'password123' }
      ];
      
      const bcrypt = require('bcryptjs');
      const userIds = [];
      
      for (const user of testUsers) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(user.password, salt);
        
        const result = await pool.query(
          `INSERT INTO users (email, username, password_hash, full_name, avatar_url, is_online)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (email) DO NOTHING
           RETURNING id`,
          [user.email, user.username, passwordHash, user.fullName,
           `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`,
           false]
        );
        
        if (result.rows.length > 0) {
          userIds.push(result.rows[0].id);
          console.log(`✅ Created user: ${user.username}`);
        }
      }
      
      if (userIds.length >= 3) {
        // Create test workspace
        const workspaceResult = await pool.query(
          `INSERT INTO workspaces (name, slug, owner_id, description)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (slug) DO NOTHING
           RETURNING id`,
          ['Test Workspace', 'test-workspace', userIds[0], 'A test workspace for development']
        );
        
        if (workspaceResult.rows.length > 0) {
          const workspaceId = workspaceResult.rows[0].id;
          console.log('✅ Created test workspace');
          
          // Add users to workspace
          for (const userId of userIds) {
            await pool.query(
              `INSERT INTO workspace_members (workspace_id, user_id, role)
               VALUES ($1, $2, $3)
               ON CONFLICT DO NOTHING`,
              [workspaceId, userId, userId === userIds[0] ? 'admin' : 'member']
            );
          }
          
          // Create channels
          const channels = [
            { name: 'general', description: 'General discussion' },
            { name: 'random', description: 'Random chat' },
            { name: 'announcements', description: 'Important announcements' }
          ];
          
          for (const channel of channels) {
            const channelResult = await pool.query(
              `INSERT INTO channels (workspace_id, name, description, created_by)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (workspace_id, name) DO NOTHING
               RETURNING id`,
              [workspaceId, channel.name, channel.description, userIds[0]]
            );
            
            if (channelResult.rows.length > 0) {
              // Add all users to channel
              for (const userId of userIds) {
                await pool.query(
                  `INSERT INTO channel_members (channel_id, user_id, is_admin)
                   VALUES ($1, $2, $3)
                   ON CONFLICT DO NOTHING`,
                  [channelResult.rows[0].id, userId, userId === userIds[0]]
                );
              }
              console.log(`✅ Created channel: ${channel.name}`);
            }
          }
        }
      }
      
      console.log('✅ Test data created successfully');
    }
    
    console.log('✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
