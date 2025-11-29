const io = require('socket.io-client');
const fetch = require('node-fetch');

async function testMessaging() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('\n=== Testing Socket.io Messaging ===\n');
    
    // Step 1: Login
    console.log('Step 1: Logging in...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'admin',
            password: 'admin123'
        })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.token) {
        console.error('❌ Login failed:', loginData);
        return;
    }
    console.log('✅ Login successful');
    const token = loginData.token;
    const userId = loginData.user.id;
    
    // Step 2: Connect socket
    console.log('\nStep 2: Connecting socket...');
    const socket = io(baseUrl, {
        auth: { token }
    });
    
    socket.on('connect', () => {
        console.log('✅ Socket connected! Socket ID:', socket.id);
        
        // Step 3: Try to send a message
        console.log('\nStep 3: Sending test message...');
        socket.emit('private_message', {
            toUserId: 1,
            content: 'Test message from script',
            type: 'text'
        });
        console.log('Message emitted');
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
    });
    
    socket.on('message_sent', (message) => {
        console.log('✅ Message sent confirmation:', message);
        socket.disconnect();
        process.exit(0);
    });
    
    socket.on('new_message', (message) => {
        console.log('📨 New message received:', message);
    });
    
    socket.on('error', (err) => {
        console.error('❌ Socket error:', err);
        socket.disconnect();
        process.exit(1);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
        console.error('❌ Timeout - no response received');
        socket.disconnect();
        process.exit(1);
    }, 10000);
}

testMessaging().catch(console.error);
