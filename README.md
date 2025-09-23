# Verbyflow Signaling Server

A WebRTC signaling server for the Verbyflow Android application, enabling real-time voice translation calls between users.

## Features

- WebSocket-based signaling using Socket.IO
- Meeting creation and management with 6-character meeting IDs
- WebRTC offer/answer exchange
- ICE candidate exchange
- User connection tracking

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/verbyflow-signaling.git
cd verbyflow-signaling
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file:
```
PORT=3000
NODE_ENV=development
```

4. Start the server:
```
npm start
```

For development with auto-restart:
```
npm run dev
```

## Deploying to Render

1. Create a new Web Service on Render
2. Connect to your GitHub repository
3. Use the following settings:
   - Build Command: `npm install`
   - Start Command: `node src/index.js`
   - Environment Variables:
     - `NODE_ENV`: `production`
     - `PORT`: `3000`

## API Documentation

### Socket.IO Events

#### Client to Server

- `register_user`: Register a user with the server
  - Data: `{ userId: string }`
  - Response: `{ success: boolean, error?: string }`

- `create_meeting`: Create a new meeting
  - Data: `{ meetingId: string, user: { id: string, preferredLanguage: string } }`
  - Response: `{ success: boolean, isHost: boolean, error?: string }`

- `join_meeting`: Join an existing meeting
  - Data: `{ meetingId: string, user: { id: string, preferredLanguage: string } }`
  - Response: `{ success: boolean, isHost: boolean, hostId: string, sourceLanguage: string, error?: string }`

- `webrtc_offer`: Send a WebRTC offer
  - Data: `{ meetingId: string, toUserId: string, offer: RTCSessionDescription }`

- `webrtc_answer`: Send a WebRTC answer
  - Data: `{ meetingId: string, toUserId: string, answer: RTCSessionDescription }`

- `ice_candidate`: Send an ICE candidate
  - Data: `{ meetingId: string, toUserId: string, candidate: RTCIceCandidate }`

- `end_meeting`: End or leave a meeting
  - Data: `{ meetingId: string }`
  - Response: `{ success: boolean, error?: string }`

#### Server to Client

- `participant_joined`: Notifies host when a participant joins
  - Data: `{ meetingId: string, userId: string, preferredLanguage: string }`

- `participant_left`: Notifies host when a participant leaves
  - Data: `{ meetingId: string, userId: string }`

- `webrtc_offer`: Forwards a WebRTC offer to the recipient
  - Data: `{ meetingId: string, fromUserId: string, offer: RTCSessionDescription }`

- `webrtc_answer`: Forwards a WebRTC answer to the recipient
  - Data: `{ meetingId: string, fromUserId: string, answer: RTCSessionDescription }`

- `ice_candidate`: Forwards an ICE candidate to the recipient
  - Data: `{ meetingId: string, fromUserId: string, candidate: RTCIceCandidate }`

- `meeting_ended`: Notifies participants when a meeting ends
  - Data: `{ meetingId: string, reason: string }`

## License

MIT
