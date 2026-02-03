# We Call Backend

Backend for a one-to-one audio/video calling app using MERN stack. Includes user registration/login, JWT authentication, user profiles, call logs, and WebRTC signaling with Socket.IO.

## Requirements
- Node.js 18+
- MongoDB running locally or a connection string in .env

## Setup
1. Copy .env.example to .env and update values.
2. Install dependencies: `npm install`
3. Start the server: `npm run dev`

## Scripts
- `npm run dev` - Start in development mode with nodemon
- `npm start` - Start production server

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- POST /api/auth/logout

### Users
- GET /api/users - Search users (query: query)
- GET /api/users/me - Get current user
- PATCH /api/users/me - Update profile

### Contacts
- GET /api/contacts - List contacts (query: status=accepted|pending|blocked)
- POST /api/contacts - Send contact request
- PATCH /api/contacts/:id/accept - Accept request
- PATCH /api/contacts/:id/block - Block contact
- DELETE /api/contacts/:id - Delete contact

### Notifications
- GET /api/notifications - List notifications (query: unread=true)
- PATCH /api/notifications/:id/read - Mark as read
- PATCH /api/notifications/read-all - Mark all as read
- DELETE /api/notifications/:id - Delete notification

### Calls
- GET /api/calls - List calls (query: type=audio|video, status=ongoing|ended|missed|declined, startDate, endDate, page, limit)
- POST /api/calls - Create call log
- PATCH /api/calls/:id/end - End call

### Health
- GET /api/health

## Socket Events

Client should emit `auth` with `{ token }` after connect.

### Client → Server
- `auth` - Authenticate socket with JWT token
- `call:initiate` - Start a call
- `call:answer` - Answer incoming call
- `call:ice` - Send ICE candidate
- `call:hangup` - End call
- `presence:check` - Check online status of users

### Server → Client
- `auth:ok` - Authentication successful
- `auth:error` - Authentication failed
- `call:incoming` - Incoming call notification
- `call:answer` - Call answered
- `call:ice` - ICE candidate received
- `call:hangup` - Call ended
- `call:unavailable` - User offline
- `call:error` - Call error
- `user:online` - User came online
- `user:offline` - User went offline
- `presence:status` - Online status response

## Notes
- This server is signaling-only for WebRTC. Media goes peer-to-peer.
- Add TURN/STUN servers on the frontend when you build it.
- Uses ES6 modules (import/export)
