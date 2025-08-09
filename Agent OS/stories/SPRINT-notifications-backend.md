# Story: Implement Notifications Backend Triggers

## Goal
Send user notifications for key events (board full, numbers revealed, win, deposit/withdrawal).

## Scope
- Cloud Functions in `cloud-funcs/SquarePicks/functions`
- Firestore writes to `notifications` collection per user

## Tasks
- Triggers:
  - on board status change → notify participants (full/closed, numbers revealed)
  - on win payout → notify winners
  - on deposit/withdrawal success → notify user
- Client: ensure onSnapshot in notifications panel receives and shows new items
- Knowledge: update notifications knowledge page

## Acceptance Criteria
- Notifications written with type, message, createdAt, read=false
- Clients see new notifications within seconds
- Mark-as-read updates reflect in UI 