# Firestore Security Rules

## Overview
Comprehensive security rules controlling access to Firestore data in the SquarePicks application.

## Rules File Location
`firestore.rules` (project root)

## Rules Version
```
rules_version = '2';
```

## Helper Functions

### signedIn()
```javascript
function signedIn() { 
  return request.auth != null; 
}
```
**Purpose**: Check if user is authenticated

### ownerUserPath()
```javascript
function ownerUserPath() {
  return path("/databases/$(database)/documents/users/$(request.auth.uid)");
}
```
**Purpose**: Generate path to current user's document

### isSquareOwner()
```javascript
function isSquareOwner() {
  return signedIn() && (
    resource.data.userID == request.auth.uid ||
    (resource.data.userID is string && (
      resource.data.userID == request.auth.uid ||
      resource.data.userID == ('users/' + request.auth.uid)
    )) ||
    (resource.data.userID is map && resource.data.userID.id == request.auth.uid) ||
    (resource.data.userID is path && resource.data.userID == ownerUserPath())
  );
}
```
**Purpose**: Check if user owns a square (handles multiple userID formats)

**Supported formats**:
- Direct UID: `"abc123"`
- Path string: `"users/abc123"`
- Map with id: `{ id: "abc123" }`
- Document reference: `path("/databases/.../users/abc123")`

### boardIsOpen()
```javascript
function boardIsOpen(boardId) {
  let boardDoc = get(/databases/$(database)/documents/boards/$(boardId));
  return boardDoc != null && boardDoc.data.status == "open";
}
```
**Purpose**: Check if a board is currently open (public)

**Note**: Performs a document read, counts toward read quota

## Collection Rules

### /users/{userId}

#### User Document Rules
```javascript
match /users/{userId} {
  allow create: if signedIn() && request.auth.uid == userId;
  allow read, update: if signedIn() && request.auth.uid == userId;
  allow delete: if false;
}
```

**Create**:
- ✅ User can create their own document
- ❌ Cannot create document for another user

**Read/Update**:
- ✅ User can read/update their own document
- ❌ Cannot read/update other users' documents

**Delete**:
- ❌ Users cannot delete their documents
- 🔧 Use Cloud Functions for account deletion

#### User Subcollections

##### /users/{userId}/address/{document}
```javascript
allow read, create, update, delete: if signedIn() && request.auth.uid == userId;
```
**Access**: Full CRUD for document owner only

##### /users/{userId}/bets/{document}
```javascript
allow read, create, update, delete: if signedIn() && request.auth.uid == userId;
```
**Access**: Full CRUD for document owner only

##### /users/{userId}/wallet/{document}
```javascript
allow read, create, update, delete: if signedIn() && request.auth.uid == userId;
```
**Access**: Full CRUD for document owner only

##### /users/{userId}/wins/{winId}
```javascript
allow read: if signedIn() && request.auth.uid == userId;
allow create, update, delete: if false;
```
**Access**:
- ✅ Read: Document owner only
- ❌ Write: Cloud Functions only

##### /users/{userId}/fcmTokens/{tokenId}
```javascript
allow read, create, delete: if signedIn() && request.auth.uid == userId;
allow update: if false;
```
**Access**:
- ✅ Read/Create/Delete: Document owner
- ❌ Update: Prevented (tokens should be recreated, not updated)

**Purpose**: FCM tokens for push notifications

---

### /games/{gameDocId}

```javascript
allow read: if true;
allow create, update, delete: if false;
```

**Read**: ✅ Public (anyone can view games)
**Write**: ❌ Cloud Functions only

**Public read rationale**: Games are displayed in lobby to all users

---

### /sports/{sportDocId}

```javascript
allow read: if true;
allow create, update, delete: if false;
```

**Read**: ✅ Public
**Write**: ❌ Cloud Functions only

---

### /teams/{teamDocId}

```javascript
allow read: if true;
allow create, update, delete: if false;
```

**Read**: ✅ Public
**Write**: ❌ Cloud Functions only

---

### /boards/{boardId}

```javascript
allow read: if resource.data.status == "open" || 
               signedIn() || 
               request.auth.token.admin == true;
allow create: if signedIn();
allow update, delete: if false;
```

**Read**:
- ✅ Public if board status is "open"
- ✅ Any authenticated user
- ✅ Service accounts with admin token

**Create**:
- ✅ Any authenticated user can create boards
- 🔧 Consider additional validation rules

**Update/Delete**:
- ❌ Cloud Functions only

#### /boards/{boardId}/squares/{squareId} (Subcollection)

```javascript
match /squares/{squareId} {
  allow read: if boardIsOpen(boardId) || 
                 isSquareOwner() || 
                 request.auth.token.admin == true;
  allow create, update, delete: if false;
}
```

**Status**: ⚠️ Not currently used (see top-level /squares collection)

**Read**:
- ✅ If board is open (public grid rendering)
- ✅ Square owner
- ✅ Service accounts

**Write**: ❌ Cloud Functions only

#### /boards/{boardId}/winners/{periodId}

```javascript
allow read: if true;
allow create, update, delete: if false;
```

**Read**: ✅ Public (anyone can see winners)
**Write**: ❌ Cloud Functions only

---

### /squares/{squareId} (Top-Level)

```javascript
match /squares/{squareId} {
  allow read: if signedIn() && (
    resource.data.userID == request.auth.uid ||
    (resource.data.userID is string && (
      resource.data.userID == request.auth.uid ||
      resource.data.userID == ('users/' + request.auth.uid)
    )) ||
    (resource.data.userID is map && resource.data.userID.id == request.auth.uid) ||
    (resource.data.userID is path && resource.data.userID == ownerUserPath())
  ) || (
    signedIn() && 
    resource.data.boardId is string && 
    boardIsOpen(resource.data.boardId)
  );
  allow create, update, delete: if false;
}
```

**Architecture Note**: Squares stored at top level for better query performance

**Read Conditions** (OR):
1. User owns the square (multiple format support)
2. Board containing square is open AND user is authenticated

**Write**: ❌ Cloud Functions only

**Query Example**:
```typescript
// Get user's squares
query(
  collection(db, 'squares'),
  where('userID', '==', userId)
)

// Get squares for open board
query(
  collection(db, 'squares'),
  where('boardId', '==', boardId)
)
```

---

### /sweepstakes/{sweepstakeDocId}

```javascript
allow read: if true;
allow create, update, delete: if false;
```

**Read**: ✅ Public
**Write**: ❌ Cloud Functions only

#### /sweepstakes/{sweepstakeDocId}/participants/{participantId}

```javascript
allow create: if signedIn() && request.resource.data.userID == request.auth.uid;
allow read: if signedIn();
allow update, delete: if false;
```

**Create**:
- ✅ User can add themselves as participant
- ❌ Cannot add other users

**Read**:
- ✅ Any authenticated user can see participants

**Update/Delete**: ❌ Cloud Functions only

---

### /transactions/{transactionId}

```javascript
allow read: if signedIn() && resource.data.userID == request.auth.uid;
allow create, update, delete: if false;
```

**Read**:
- ✅ User can read their own transactions
- ❌ Cannot read other users' transactions

**Write**: ❌ Cloud Functions only (maintain transaction integrity)

---

### /notifications/{notificationId}

```javascript
match /notifications/{notificationId} {
  allow read: if signedIn() && request.auth.uid == resource.data.userID;
  allow update: if signedIn() &&
                 request.auth.uid == resource.data.userID &&
                 request.writeFields.hasOnly(['isRead']) &&
                 request.resource.data.isRead == true;
  allow create, delete: if false;
}
```

**Read**:
- ✅ User can read their own notifications

**Update**:
- ✅ User can mark their own notifications as read
- ✅ Only `isRead` field can be updated
- ✅ Can only change `isRead` from `false` to `true`
- ❌ Cannot mark as unread
- ❌ Cannot update other fields

**Create/Delete**: ❌ Cloud Functions only

**Purpose**: Allows users to dismiss notifications without full edit access

---

## Security Patterns

### Ownership Verification
```javascript
// Direct comparison
request.auth.uid == resource.data.userID

// Or check via helper
isSquareOwner()
```

### Field-Level Updates
```javascript
// Only allow updating specific fields
request.writeFields.hasOnly(['field1', 'field2'])

// Ensure specific field value
request.resource.data.fieldName == expectedValue
```

### Public Read with Protected Write
```javascript
allow read: if true;
allow write: if false;
```
Use for: games, sports, teams, sweepstakes

### Owner-Only Access
```javascript
allow read, write: if request.auth.uid == userId;
```
Use for: user documents and subcollections

### Conditional Public Access
```javascript
allow read: if resource.data.status == "open" || signedIn();
```
Use for: boards (public when open, auth-only when closed)

## Common Issues & Solutions

### Issue: User can't read their squares
**Cause**: Board is not open and ownership check failing

**Solution**:
1. Verify userID format matches one of supported formats
2. Check board status
3. Ensure user is authenticated

### Issue: Permission denied on board read
**Cause**: Board is closed and user not authenticated

**Solution**:
- Ensure user is logged in
- Check board status field

### Issue: Can't update notification
**Cause**: Trying to update fields other than `isRead`

**Solution**:
- Only update `isRead` field
- Ensure setting to `true`, not `false`

### Issue: Can't query squares by boardId
**Cause**: Firestore indexes not created

**Solution**:
Create composite index for:
- Collection: `squares`
- Fields: `boardId` (Ascending), `userID` (Ascending)

## Testing Rules

### Firebase Emulator
```bash
firebase emulators:start --only firestore
```

### Rules Playground
Use Firebase Console → Firestore → Rules → Playground

### Test Cases

#### Test Read Own User Document
```javascript
// Should succeed
auth.uid = "user123"
get(/databases/$(database)/documents/users/user123)

// Should fail
auth.uid = "user123"
get(/databases/$(database)/documents/users/user456)
```

#### Test Read Open Board
```javascript
// Should succeed (board is open)
auth = null
get(/databases/$(database)/documents/boards/board123)
// where boards/board123.status == "open"

// Should fail (board is closed)
auth = null
get(/databases/$(database)/documents/boards/board456)
// where boards/board456.status == "closed"
```

#### Test Square Ownership
```javascript
// Should succeed (user owns square)
auth.uid = "user123"
get(/databases/$(database)/documents/squares/square123)
// where squares/square123.userID == "user123"

// Should fail (user doesn't own square)
auth.uid = "user123"
get(/databases/$(database)/documents/squares/square456)
// where squares/square456.userID == "user456"
```

## Performance Considerations

### Document Reads in Rules
```javascript
function boardIsOpen(boardId) {
  let boardDoc = get(/databases/$(database)/documents/boards/$(boardId));
  return boardDoc != null && boardDoc.data.status == "open";
}
```

**Impact**: Each rule evaluation performs a document read
**Cost**: Counts toward Firestore read quota
**Optimization**: Cache board status client-side when possible

### Multiple Condition Checks
```javascript
allow read: if condition1() || condition2() || condition3();
```

**Behavior**: Conditions evaluated left-to-right, stops on first `true`
**Optimization**: Place most likely conditions first

## Best Practices

1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Server-Side Operations**: Use Cloud Functions for complex writes
3. **Field Validation**: Validate data types and required fields
4. **Defensive Checks**: Handle null/undefined values
5. **Test Thoroughly**: Test all access patterns before deploying
6. **Document Changes**: Comment complex rules
7. **Regular Audits**: Review rules periodically
8. **Monitor Access**: Use Firestore audit logs

## Deployment

### Test Rules
```bash
firebase deploy --only firestore:rules --project=project-id-staging
```

### Deploy to Production
```bash
firebase deploy --only firestore:rules --project=project-id-production
```

### Verify Deployment
Check Firebase Console → Firestore → Rules → View deployed rules

## Related Documentation

- [Firestore Security Rules Reference](https://firebase.google.com/docs/firestore/security/get-started)
- [Rules Language](https://firebase.google.com/docs/rules/rules-language)
- [Testing Rules](https://firebase.google.com/docs/rules/unit-tests)

## Future Enhancements

- Add field-level validation (email format, phone format, etc.)
- Implement role-based access control (admin, moderator, etc.)
- Add rate limiting rules
- Implement data validation for required fields
- Add rules for document size limits
- Consider migrating squares to board subcollection for better data locality

