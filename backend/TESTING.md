# Testing the WeCall API with Postman

## Quick Start

### 1. Import the Collection
1. Open Postman
2. Click **Import** button
3. Select `postman_collection.json` from this directory
4. Collection "WeCall API" will appear in your workspace

### 2. Set Up Environment (Optional but Recommended)
1. Click on **Environments** in Postman
2. Create new environment named "WeCall Dev"
3. Add these variables:
   - `baseUrl` = `http://localhost:5000`
   - `token` = (leave empty, will auto-populate)
   - `userId` = (leave empty, will auto-populate)
   - `targetUserId` = (add after creating second user)
   - `contactId` = (leave empty, will auto-populate)
   - `callId` = (leave empty, will auto-populate)
   - `notificationId` = (leave empty, will auto-populate)

### 3. Test Flow

#### Step 1: Create First User
1. Go to **Auth → Register**
2. Send request
3. Token will be automatically saved to environment

#### Step 2: Create Second User (for testing contacts/calls)
1. Go to **Auth → Register**
2. Change the JSON body:
   ```json
   {
     "username": "testuser2",
     "email": "test2@example.com",
     "password": "password123",
     "displayName": "Test User 2"
   }
   ```
3. Send request
4. Copy the `user.id` from response
5. Add to environment as `targetUserId`

#### Step 3: Test User Features (Login as User 1)
1. **Auth → Login** with user1 credentials
2. **Users → Get My Profile** - View your profile
3. **Users → Update My Profile** - Change display name/status
4. **Users → Search Users** - Find other users

#### Step 4: Test Contacts
1. **Contacts → Send Contact Request** (uses `targetUserId`)
2. **Contacts → List Pending Requests** - See sent request

Now login as User 2 to accept:
1. **Auth → Login** with user2 credentials  
2. **Contacts → List Pending Requests** - See incoming request
3. Copy the `_id` of the contact request
4. Set it as `contactId` in environment
5. **Contacts → Accept Contact Request**
6. **Contacts → List Contacts (Accepted)** - See accepted contact

#### Step 5: Test Notifications
1. While logged in as User 2:
2. **Notifications → List Unread Notifications** - See contact request notification
3. **Notifications → Mark All as Read**

#### Step 6: Test Calls
1. **Calls → Create Call Log**
2. **Calls → List All Calls** - See call history
3. **Calls → End Call** (use callId from create response)
4. Test filters:
   - **List Audio Calls**
   - **List Missed Calls**
   - **List Calls with Pagination**

## Testing Without Environment

If not using environments, manually:
1. Copy token from Register/Login response
2. Paste into Authorization header: `Bearer YOUR_TOKEN_HERE`
3. Replace `{{targetUserId}}`, `{{contactId}}`, etc. with actual IDs

## Common Issues

### "Unauthorized" Error
- Ensure token is set in Authorization header
- Token format: `Bearer <token>` (note the space)
- Re-login if token expired (7 days default)

### "User not found" for Contact Request
- Make sure `targetUserId` is set in environment
- Verify user exists with Search Users endpoint

### MongoDB Connection Error
- Ensure MongoDB is running locally
- Check `.env` file has correct `MONGO_URI`

## Advanced Testing

### Date Range Filter for Calls
```
GET /api/calls?startDate=2026-01-01&endDate=2026-02-01
```

### Pagination
```
GET /api/calls?page=2&limit=5
```

### Combined Filters
```
GET /api/calls?type=video&status=ended&page=1&limit=20
```

## Socket.IO Testing

For WebSocket/Socket.IO testing, use a Socket.IO client:
1. Install Socket.IO client extension or use a tool like Socket.IO Tester
2. Connect to `http://localhost:5000`
3. Emit `auth` event with `{ token: "YOUR_JWT_TOKEN" }`
4. Listen for events: `user:online`, `user:offline`, `call:incoming`, etc.

## Auto-Generated Variables

The collection automatically saves these to environment:
- `token` - From register/login
- `userId` - From register/login
- `contactId` - From send contact request
- `callId` - From create call log

This makes testing flows seamless without manual copying!
