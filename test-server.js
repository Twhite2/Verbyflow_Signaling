/**
 * Test script to verify signaling server functionality
 * Run with: node test-server.js
 */

const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

console.log('🧪 Testing Verbyflow Signaling Server...\n');

// Test 1: Connection Test
console.log('Test 1: Connection Test');
const socket = io(SERVER_URL);

socket.on('connect', () => {
  console.log('✅ Connected to server\n');
  
  // Test 2: Ping-Pong Test
  console.log('Test 2: Ping-Pong Test');
  socket.emit('ping', (response) => {
    if (response === 'pong') {
      console.log('✅ Ping-Pong successful\n');
      runTests();
    } else {
      console.log('❌ Ping-Pong failed\n');
      socket.disconnect();
    }
  });
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection failed:', error.message);
  console.log('\n💡 Make sure the server is running with: npm start');
  process.exit(1);
});

function runTests() {
  const testUserId1 = 'test-user-host-' + Date.now();
  const testUserId2 = 'test-user-join-' + Date.now();
  const testMeetingId = 'TEST' + Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Test 3: User Registration
  console.log('Test 3: User Registration');
  socket.emit('register_user', { userId: testUserId1 }, (response) => {
    if (response.success) {
      console.log('✅ User registered successfully\n');
      
      // Test 4: Create Meeting
      console.log('Test 4: Create Meeting');
      socket.emit('create_meeting', {
        meetingId: testMeetingId,
        user: {
          id: testUserId1,
          preferredLanguage: 'en'
        }
      }, (response) => {
        if (response.success && response.isHost && response.initiatorLanguage === 'en') {
          console.log('✅ Meeting created successfully');
          console.log(`   Meeting ID: ${testMeetingId}`);
          console.log(`   Initiator Language: ${response.initiatorLanguage}\n`);
          
          // Test 5: Verify Meeting
          console.log('Test 5: Verify Meeting');
          socket.emit('verify_meeting', testMeetingId, (exists) => {
            if (exists === true) {
              console.log('✅ Meeting verification successful\n');
              
              // Test 6: Verify Non-existent Meeting
              console.log('Test 6: Verify Non-existent Meeting');
              socket.emit('verify_meeting', 'NONEXISTENT', (exists) => {
                if (exists === false) {
                  console.log('✅ Non-existent meeting correctly identified\n');
                  
                  // Create second socket for joining
                  testJoinMeeting(testMeetingId, testUserId2);
                } else {
                  console.log('❌ Non-existent meeting check failed\n');
                  cleanup();
                }
              });
            } else {
              console.log('❌ Meeting verification failed\n');
              cleanup();
            }
          });
        } else {
          console.log('❌ Meeting creation failed:', response);
          cleanup();
        }
      });
    } else {
      console.log('❌ User registration failed:', response);
      cleanup();
    }
  });
}

function testJoinMeeting(meetingId, userId) {
  console.log('Test 7: Join Meeting');
  
  const socket2 = io(SERVER_URL);
  
  socket2.on('connect', () => {
    socket2.emit('register_user', { userId: userId }, (response) => {
      if (response.success) {
        socket2.emit('join_meeting', {
          meetingId: meetingId,
          user: {
            id: userId,
            preferredLanguage: 'es'
          }
        }, (response) => {
          if (response.success && 
              !response.isHost && 
              response.initiatorLanguage === 'en' &&
              response.receiverLanguage === 'es') {
            console.log('✅ Join meeting successful');
            console.log(`   Host ID: ${response.hostId}`);
            console.log(`   Initiator Language: ${response.initiatorLanguage}`);
            console.log(`   Receiver Language: ${response.receiverLanguage}\n`);
            
            // Test 8: Connection Status
            console.log('Test 8: Connection Status');
            socket2.emit('connection_status', {
              meetingId: meetingId,
              fromUserId: userId,
              status: 'connected'
            });
            
            setTimeout(() => {
              console.log('✅ Connection status sent\n');
              
              // Test 9: End Meeting
              console.log('Test 9: End Meeting');
              socket2.emit('end_meeting', { meetingId: meetingId }, (response) => {
                if (response.success) {
                  console.log('✅ Meeting ended successfully\n');
                  
                  console.log('🎉 All tests passed!\n');
                  cleanup(socket2);
                } else {
                  console.log('❌ End meeting failed:', response);
                  cleanup(socket2);
                }
              });
            }, 500);
          } else {
            console.log('❌ Join meeting failed:', response);
            cleanup(socket2);
          }
        });
      }
    });
  });
}

function cleanup(additionalSocket) {
  setTimeout(() => {
    socket.disconnect();
    if (additionalSocket) {
      additionalSocket.disconnect();
    }
    process.exit(0);
  }, 1000);
}
