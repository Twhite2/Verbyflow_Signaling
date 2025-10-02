# Quick Start Guide

## Testing the Updated Server

### Step 1: Start the Server
```bash
cd C:\Users\PC\AndroidStudioProjects\verbyflow-signaling
npm start
```

You should see:
```
Server running on port 3000
```

### Step 2: Run the Test Suite
Open a new terminal and run:
```bash
npm test
```

You should see all tests pass:
```
✅ Connected to server
✅ Ping-Pong successful
✅ User registered successfully
✅ Meeting created successfully
✅ Meeting verification successful
✅ Non-existent meeting correctly identified
✅ Join meeting successful
✅ Connection status sent
✅ Meeting ended successfully
🎉 All tests passed!
```

### Step 3: Test with Android App

#### Option A: Test with Emulator
1. Keep the server running locally
2. In your Android app, the server URL should be: `http://10.0.2.2:3000`
3. Build and run the app on the emulator
4. Create a meeting on one emulator instance
5. Join the meeting from another emulator instance

#### Option B: Test with Physical Device (Same Network)
1. Keep the server running locally
2. Find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.5)

3. Update Android app server URL to: `http://YOUR_IP:3000`
4. Make sure your phone is on the same WiFi network
5. Build and run the app

### Step 4: Deploy to Render

Once local testing works:

```bash
git add .
git commit -m "Sync server with Android app - add verify_meeting, connection_status handlers"
git push origin main
```

Render will automatically deploy. Wait a few minutes, then test with:
- Server URL: `https://verbyflow-signaling.onrender.com`

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Try: `netstat -ano | findstr :3000` to see what's using the port
- Kill the process or use a different port in .env

### Tests fail
- Make sure server is running before running tests
- Check server logs for error messages

### Android app can't connect
- Verify server is accessible: Open `http://localhost:3000` in browser
- For physical device: Try `http://YOUR_IP:3000` in phone browser first
- Check firewall settings
- Make sure both devices are on same network (for local testing)

### "Meeting not found" on Android
- This was the main issue we fixed
- The server now has the `verify_meeting` handler
- The Android app will retry 3 times before failing
- Check server logs to see if meeting was created successfully

## What Changed

The server now supports these additional features required by the Android app:

1. **verify_meeting**: Check if meeting exists before joining
2. **connection_status**: Broadcast WebRTC connection states
3. **ping/pong**: Connection health checks
4. **initiatorLanguage/receiverLanguage**: Proper language field names for translation
5. Better error logging and participant notifications

All changes are backward compatible with existing functionality.
