# Android App Synchronization Changes

## Summary

This document outlines the changes made to the signaling server to ensure proper synchronization with the Verbyflow Android app.

## Changes Made to `src/socket.js`

### 1. Added `verify_meeting` Event Handler
**Purpose**: Allows the Android app to verify if a meeting exists before attempting to join.

```javascript
socket.on('verify_meeting', (meetingId, callback) => {
  // Checks if meeting exists in activeSessions
  // Returns true/false via callback
});
```

**Android App Usage**: Called before joining a meeting with retry logic (3 attempts, 1.5s delay).

### 2. Updated `create_meeting` Response
**Added Fields**:
- `initiatorLanguage`: The language preference of the meeting host

**Android App Requirement**: The app expects this field to set up proper translation pipelines.

### 3. Updated `join_meeting` Response
**Modified Fields**:
- Changed `sourceLanguage` to `initiatorLanguage` for consistency
- Added `receiverLanguage` field

**Before**:
```javascript
{
  success: true,
  isHost: false,
  hostId: session.host,
  sourceLanguage: session.sourceLanguage
}
```

**After**:
```javascript
{
  success: true,
  isHost: false,
  hostId: session.host,
  initiatorLanguage: session.initiatorLanguage,
  receiverLanguage: user.preferredLanguage
}
```

### 4. Added `connection_status` Event Handler
**Purpose**: Broadcasts WebRTC connection status updates between peers.

```javascript
socket.on('connection_status', (data) => {
  // Relays connection status to other participants
  // Used for showing "connecting", "connected", "disconnected" states
});
```

**Android App Usage**: 
- Called during WebRTC peer connection state changes
- Helps synchronize UI states across devices

### 5. Added `ping` Event Handler
**Purpose**: Health check mechanism for connection testing.

```javascript
socket.on('ping', (callback) => {
  callback('pong');
});
```

**Android App Usage**: 
- Called after successful Socket.IO connection
- Verifies bidirectional communication is working

### 6. Improved Error Logging
- Added more detailed logging for troubleshooting
- Better error messages for failed operations

## Testing the Server

### 1. Start the Server Locally
```bash
cd C:\Users\PC\AndroidStudioProjects\verbyflow-signaling
npm install
npm start
```

The server should start on port 3000 (or the port specified in .env).

### 2. Verify Server is Running
Visit `http://localhost:3000` in a browser. You should see a response from the server.

### 3. Test with Android App

**For Emulator**:
- Server URL: `http://10.0.2.2:3000`

**For Physical Device on Same Network**:
- Find your computer's local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Server URL: `http://YOUR_LOCAL_IP:3000`
- Example: `http://192.168.1.5:3000`

### 4. Deploy to Render
Once tested locally, deploy to Render:
```bash
git add .
git commit -m "Sync server with Android app requirements"
git push origin main
```

Render will automatically deploy the changes.

## Expected Flow

### Meeting Creation Flow:
1. Host opens app → `register_user` called
2. Host creates meeting → `create_meeting` called
3. Server stores meeting in `activeSessions`
4. Host receives `{ success: true, isHost: true, initiatorLanguage: "en" }`

### Meeting Join Flow:
1. Joiner opens app → `register_user` called
2. Joiner enters meeting ID → `verify_meeting` called (retried up to 3 times)
3. If meeting exists → `join_meeting` called
4. Joiner receives `{ success: true, isHost: false, hostId: "...", initiatorLanguage: "en", receiverLanguage: "es" }`
5. Host receives `participant_joined` event

### WebRTC Signaling Flow:
1. Host sends offer → `webrtc_offer` relayed to joiner
2. Joiner sends answer → `webrtc_answer` relayed to host
3. Both exchange ICE candidates → `ice_candidate` relayed between peers
4. Connection status updates → `connection_status` broadcasted

## Troubleshooting

### Issue: "Meeting not found" error
**Cause**: Meeting hasn't been created yet or server restarted (in-memory storage cleared).
**Solution**: 
- Ensure host creates meeting before joiner attempts to join
- The retry mechanism should handle timing issues

### Issue: WebRTC not connecting
**Cause**: Signaling messages not being relayed properly.
**Solution**: 
- Check server logs for WebRTC signaling events
- Verify both users are in the same meeting room
- Check STUN/TURN server configuration in Android app

### Issue: Server connection errors
**Cause**: Server not accessible or wrong URL.
**Solution**:
- Verify server is running: `curl http://localhost:3000`
- Check firewall settings
- For physical devices, ensure both are on same network

## Server Logs to Monitor

When testing, you should see these logs:
```
[INFO] User registered: <userId>
[INFO] Meeting created: <meetingId> by user <userId>
[INFO] Verifying meeting: <meetingId>
[INFO] Meeting <meetingId> verification result: exists
[INFO] User <userId> joined meeting: <meetingId>
[INFO] WebRTC offer sent to <userId> in meeting <meetingId>
[INFO] WebRTC answer sent to <userId> in meeting <meetingId>
```

## Next Steps

1. Test the server locally with your Android app
2. Verify all event handlers work correctly
3. Deploy to Render
4. Update Android app server URL to point to Render deployment
5. Test with two physical devices over the internet
