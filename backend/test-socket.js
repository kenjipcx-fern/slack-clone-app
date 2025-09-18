const io = require('socket.io-client');

const socket = io('http://localhost:5000');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NTlkNjFlZC1jYTU4LTQ4YmYtOTJmMS1jYmMwY2JlYjY4NTEiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJpYXQiOjE3NTgyMTAxNjgsImV4cCI6MTc1ODgxNDk2OH0.7rQM5Feym-73UBFerQYVSPJ7qiAjw2Nd_XJr_5ia4qU';

socket.on('connect', () => {
  console.log('✅ Connected to Socket.io server');
  socket.emit('authenticate', token);
});

socket.on('authenticated', (data) => {
  console.log('✅ Authenticated:', data.user);
  
  // Join a channel
  socket.emit('join_channel', 'cbc6dedd-0bf5-46b2-8a4f-8c8e256957c5');
});

socket.on('joined_channel', (data) => {
  console.log('✅ Joined channel:', data.channelId);
  
  // Send a test message
  socket.emit('send_message', {
    channelId: 'cbc6dedd-0bf5-46b2-8a4f-8c8e256957c5',
    content: 'Test message from Socket.io client!'
  });
});

socket.on('new_message', (data) => {
  console.log('📨 New message received:', data.message.content);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

// Keep the script running
setTimeout(() => {
  console.log('Test complete');
  process.exit(0);
}, 5000);
