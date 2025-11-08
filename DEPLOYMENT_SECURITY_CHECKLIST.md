# Production Deployment Security Checklist

## Quick Reference Checklist

### 🔴 CRITICAL - Must Complete Before Production

- [ ] **Environment Variables**: All production credentials set (Firebase, PayPal LIVE)
- [ ] **PayPal Environment**: `PAYPAL_ENV=live` (NOT sandbox)
- [ ] **Email Verification**: Tested and enforced on all protected routes
- [ ] **CSP Headers**: Verify 'unsafe-eval' is NOT enabled in production
- [ ] **Firestore Rules**: Deployed and tested
- [ ] **App Check**: Enabled and working with production ReCAPTCHA key

### 🟡 IMPORTANT - Should Complete Before Production

- [ ] **AuthGuard Fix**: Add `user.reload()` before checking `emailVerified`
- [ ] **Password Validation**: Consider using Firebase's `validatePassword()` function
- [ ] **Protected Routes**: Verify all routes requiring auth are protected
- [ ] **Error Handling**: Test all error scenarios
- [ ] **Session Management**: Test logout and token refresh

### 🟢 RECOMMENDED - Can Complete Post-Launch

- [ ] **Email Enumeration Protection**: Enable in Firebase Console
- [ ] **MFA**: Consider adding for admin accounts
- [ ] **Monitoring**: Set up authentication metrics and alerts
- [ ] **Security Audit**: Schedule quarterly reviews

---

## Environment Variables Verification

Run this check before deployment:

```bash
# Verify these are set and correct:
echo "Firebase Project: $NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "PayPal Env: $PAYPAL_ENV"
echo "PayPal Client ID: ${PAYPAL_CLIENT_ID:0:10}..." # First 10 chars only
echo "Base URL: $NEXT_PUBLIC_BASE_URL"
```

**Expected Values:**
- `PAYPAL_ENV` should be `live` (not `sandbox`)
- `NEXT_PUBLIC_BASE_URL` should be `https://www.squarepicks.com` (or your production domain)
- All Firebase values should be from production project (not test/dev)

---

## Quick Security Test Scenarios

### 1. Email Verification Enforcement
- [ ] Try accessing `/profile` without being logged in → Should redirect to `/login`
- [ ] Login with unverified email → Should redirect to `/verify-email`
- [ ] Verify email → Should be able to access `/profile`

### 2. Authentication Flow
- [ ] Login with valid credentials → Should succeed
- [ ] Login with invalid credentials → Should show generic error
- [ ] Login with wrong password 5+ times → Should show rate limit message
- [ ] Logout → Should clear session and redirect

### 3. Protected Routes
- [ ] `/profile` → Requires auth + email verification
- [ ] `/wallet` → Requires auth + email verification  
- [ ] `/my-boards` → Requires auth
- [ ] `/lobby` → Should redirect unverified users

### 4. API Security
- [ ] Call `/api/my-boards` without auth header → Should return 401
- [ ] Call `/api/my-boards` with invalid token → Should return 401
- [ ] Call `/api/my-boards` with valid token → Should return data

---

## Code Fixes Needed

### Fix 1: AuthGuard Email Verification Check

**File**: `src/components/auth/AuthGuard.tsx`

**Current Code** (line 32):
```typescript
if (requireEmailVerification && !user.emailVerified) {
```

**Recommended Fix**:
```typescript
// Reload user to get latest verification status
await user.reload();
const freshUser = auth.currentUser;
if (requireEmailVerification && freshUser && !freshUser.emailVerified) {
```

**Why**: Ensures we check the most up-to-date email verification status, not cached value.

---

## Firebase Console Checks

Before going live, verify in Firebase Console:

1. **Authentication → Settings**
   - [ ] Email/Password provider enabled
   - [ ] Email verification enabled
   - [ ] Email enumeration protection enabled (recommended)

2. **Firestore → Rules**
   - [ ] Security rules deployed
   - [ ] Test rules in Rules Playground

3. **App Check**
   - [ ] ReCAPTCHA v3 provider enabled
   - [ ] Production site key configured
   - [ ] Enforcement enabled

4. **Project Settings**
   - [ ] Authorized domains include production domain
   - [ ] API keys restricted (if possible)

---

## PayPal Live Configuration

Verify PayPal LIVE credentials:

1. **PayPal Developer Dashboard**
   - [ ] Live app created (not sandbox)
   - [ ] Client ID and Secret copied
   - [ ] Webhooks configured (if using)

2. **Environment Variables**
   - [ ] `PAYPAL_CLIENT_ID` = Live client ID
   - [ ] `PAYPAL_CLIENT_SECRET` = Live secret
   - [ ] `PAYPAL_ENV` = `live`
   - [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID` = Live client ID
   - [ ] `NEXT_PUBLIC_PAYPAL_ENV` = `live`

3. **API Base URL**
   - [ ] Code uses `https://api-m.paypal.com` when `PAYPAL_ENV=live`
   - [ ] Test with small transaction first

---

## Post-Deployment Monitoring

### First 24 Hours
- Monitor authentication success rate
- Watch for error spikes
- Check email delivery (verification emails)
- Monitor PayPal transaction success rate

### First Week
- Review authentication metrics
- Check for unusual patterns
- Monitor failed login attempts
- Review security rule violations

---

## Emergency Rollback Plan

If critical security issue discovered:

1. **Immediate Actions**:
   - Disable sign-ups (redirect to maintenance page)
   - Review authentication logs
   - Check for unauthorized access

2. **Rollback Steps**:
   - Revert to previous deployment
   - Review environment variables
   - Check Firebase security rules

3. **Communication**:
   - Notify users if data breach suspected
   - Update status page
   - Document incident

---

## Sign-Off

**Prepared By**: AI Assistant  
**Date**: 2025-01-26  
**Status**: Ready for Review

**Next Steps**:
1. Review SECURITY_REVIEW.md for detailed analysis
2. Complete checklist items
3. Test all scenarios
4. Deploy to production

