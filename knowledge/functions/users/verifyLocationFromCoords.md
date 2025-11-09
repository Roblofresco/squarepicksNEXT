# verifyLocationFromCoords Function

## Overview
Verifies user's physical location using GPS coordinates from their device. Uses Google Geocoding API to reverse geocode coordinates into a state, then validates the state against allowed jurisdictions. Required for gaming compliance and state-level restrictions.

## Location
Expected: Firebase Cloud Function or Next.js API Route
Path: `functions/src/users/verifyLocationFromCoords` or similar

## Function Type
Firebase Cloud Function (Callable) or Next.js API Route

## Authentication
Requires authenticated user (Firebase Auth)

## Purpose
- Verify user is in allowed jurisdiction
- Reverse geocode GPS coordinates to state
- Update user's verified location status
- Store verified state for future reference
- Enforce geographic restrictions for gaming compliance
- Prevent VPN/location spoofing (partial)

## Request Parameters

### Input Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID (from auth context) |
| `latitude` | number | Yes | GPS latitude (-90 to 90) |
| `longitude` | number | Yes | GPS longitude (-180 to 180) |

### Example Request
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

## Response

### Success Response (Allowed State)
```json
{
  "success": true,
  "locationVerified": true,
  "verifiedState": "CA",
  "stateName": "California",
  "message": "Location verified successfully",
  "isAllowedState": true
}
```

### Success Response (Restricted State)
```json
{
  "success": false,
  "locationVerified": false,
  "verifiedState": "WA",
  "stateName": "Washington",
  "message": "Service not available in your state",
  "isAllowedState": false
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether location verification succeeded |
| `locationVerified` | boolean | Whether user is in allowed state |
| `verifiedState` | string | 2-letter state code |
| `stateName` | string | Full state name |
| `message` | string | Human-readable result message |
| `isAllowedState` | boolean | Whether state is allowed |

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

#### 400 Bad Request - Invalid Coordinates
```json
{
  "error": "Invalid coordinates. Latitude must be -90 to 90, longitude must be -180 to 180"
}
```

#### 400 Bad Request - Missing Coordinates
```json
{
  "error": "Latitude and longitude are required"
}
```

#### 500 Internal Server Error - Geocoding Failed
```json
{
  "error": "Failed to verify location. Please try again."
}
```

#### 403 Forbidden - Outside US
```json
{
  "error": "Service only available in the United States"
}
```

## Process Flow

### Step 1: Authentication
- Verify user is authenticated
- Extract user ID from auth context

### Step 2: Input Validation
- Verify latitude is between -90 and 90
- Verify longitude is between -180 and 180
- Ensure both coordinates provided

### Step 3: Reverse Geocode Coordinates
- Call Google Geocoding API
- Convert coordinates to address
- Extract state information

**API Request:**
```
GET https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={API_KEY}
```

**API Response:**
```json
{
  "results": [
    {
      "address_components": [
        {
          "long_name": "California",
          "short_name": "CA",
          "types": ["administrative_area_level_1", "political"]
        },
        {
          "long_name": "United States",
          "short_name": "US",
          "types": ["country", "political"]
        }
      ],
      "formatted_address": "San Francisco, CA, USA"
    }
  ],
  "status": "OK"
}
```

### Step 4: Parse Geocoding Result
- Extract country (must be "US")
- Extract state code from `administrative_area_level_1`
- Handle cases with no results or ambiguous results

### Step 5: Validate Country
- Verify country is United States
- If not US, return error (service not available)

### Step 6: Check State Against Allowed List
```javascript
const ALLOWED_STATES = [
  'CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI',
  // ... other allowed states
];

const isAllowed = ALLOWED_STATES.includes(stateCode);
```

### Step 7: Update User Document
```javascript
await db.collection('users').doc(userId).update({
  locationVerified: isAllowed,
  verifiedState: stateCode,
  lastLocationCheck: FieldValue.serverTimestamp(),
  updated_time: FieldValue.serverTimestamp()
});
```

### Step 8: Return Verification Result
- Return state code and verification status
- Include user-friendly message

## Google Geocoding API Integration

### API Endpoint
```
GET https://maps.googleapis.com/maps/api/geocode/json
```

### Request Parameters
| Parameter | Value | Description |
|-----------|-------|-------------|
| `latlng` | `{lat},{lng}` | Coordinates to reverse geocode |
| `key` | API key | Google Maps API key |
| `result_type` | `administrative_area_level_1` | Filter to state-level results |

### Response Parsing
```javascript
function parseStateFromGeocoding(response) {
  if (response.status !== 'OK' || !response.results.length) {
    throw new Error('Unable to determine location');
  }
  
  const result = response.results[0];
  let country = null;
  let state = null;
  
  for (const component of result.address_components) {
    if (component.types.includes('country')) {
      country = component.short_name;
    }
    if (component.types.includes('administrative_area_level_1')) {
      state = component.short_name;
    }
  }
  
  if (country !== 'US') {
    throw new Error('Service only available in the United States');
  }
  
  if (!state) {
    throw new Error('Unable to determine state');
  }
  
  return state;
}
```

## State Restrictions

### Allowed States
List of states where service is available (example):
```javascript
const ALLOWED_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WV', 'WI', 'WY'
];
```

### Restricted States
States where service is not available (example):
```javascript
const RESTRICTED_STATES = [
  'WA',  // Washington - restrictive gaming laws
  'DC'   // District of Columbia
];
```

**Note:** Actual allowed/restricted states depend on legal requirements and licensing.

## User Document Updates

### Fields Updated
```javascript
{
  locationVerified: true | false,
  verifiedState: 'CA',
  lastLocationCheck: serverTimestamp(),
  updated_time: serverTimestamp()
}
```

### Field Descriptions
| Field | Type | Description |
|-------|------|-------------|
| `locationVerified` | boolean | True if in allowed state |
| `verifiedState` | string | 2-letter state code from verification |
| `lastLocationCheck` | Timestamp | Last time location was checked |

## Business Rules

### Verification Frequency
- Initial verification during signup/wallet setup
- Re-verification before first deposit
- Periodic re-verification (e.g., every 30 days)
- Re-verification if user travels to new state

### State Change Handling
- If user moves to restricted state, limit account features
- If user travels temporarily, allow grace period
- Admin can override location restrictions

### Location Data Retention
- Store only state code, not full coordinates
- Coordinates not persisted (privacy)
- Last check timestamp recorded

### Wallet Restrictions
- Location verification required before deposits
- Location verification required before withdrawals
- Entry to paid boards requires verified location

## Security Considerations

### VPN Detection
Current implementation vulnerable to VPN usage. Enhancements:
- IP address geolocation comparison
- Device fingerprinting
- Behavioral analysis
- Third-party VPN detection service

### GPS Spoofing
GPS coordinates can be spoofed. Mitigations:
- Cross-reference with IP geolocation
- Require multiple verification methods
- Monitor for suspicious location changes
- Flag rapid state changes

### Privacy
- Don't store precise coordinates
- Only store state-level information
- Clear user consent for location access
- Comply with privacy regulations

### API Key Security
- Google API key in environment variables
- Restrict API key to server IP addresses
- Monitor API usage for abuse
- Rate limit to prevent API exhaustion

## Error Handling

### Geocoding Failures
- Network errors: Retry with exponential backoff
- Invalid coordinates: Return validation error
- No results: Ask user to try different location or manual entry
- API quota exceeded: Queue for later retry

### Ambiguous Results
- Multiple states in results: Use most specific
- Border cases: May return nearest state
- Water/international waters: Reject as invalid

## Logging

### Logged Information
- User ID
- State code (not coordinates)
- Verification success/failure
- Timestamp

### Not Logged
- Exact coordinates (privacy)
- Google API responses (may contain PII)

## Notifications

### Verification Success
```
Title: "Location Verified"
Message: "Your location has been verified. You can now access all features."
```

### Verification Failed (Restricted State)
```
Title: "Service Not Available"
Message: "Unfortunately, SquarePicks is not currently available in your state. We're working to expand to more locations."
```

### Location Changed
```
Title: "Location Update Required"
Message: "Your location has changed. Please verify your new location to continue using SquarePicks."
```

## Environment Configuration

### Required Environment Variables
| Variable | Description |
|----------|-------------|
| `GOOGLE_MAPS_API_KEY` | Google Geocoding API key |

### Google Maps API Setup
1. Enable Geocoding API in Google Cloud Console
2. Create API key
3. Restrict key to server IP addresses
4. Set usage quotas
5. Enable billing (required for production)

## Compliance Considerations

### Gaming Regulations
- State-by-state licensing requirements
- Age and location verification required
- Audit trail for regulatory compliance
- Geo-blocking for restricted states

### Privacy Regulations
- GDPR considerations (if applicable)
- CCPA compliance (California)
- Clear disclosure of location tracking
- User consent required

## Used By
- Wallet setup flow (`src/app/wallet-setup/location/page.tsx`)
- First deposit flow
- Periodic re-verification
- Mobile app location verification

## Related Functions
- `updateUserProfile`: Updates profile after location verified
- `requestWithdrawal`: Checks location verification status

## Related Documentation
- [Data Model: Users](../../data-models/users.md)
- [Function: updateUserProfile](./updateUserProfile.md)
- [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding)

## Implementation Notes

### Coordinate Validation
```javascript
function validateCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('Coordinates must be numbers');
  }
  if (lat < -90 || lat > 90) {
    throw new Error('Invalid latitude');
  }
  if (lng < -180 || lng > 180) {
    throw new Error('Invalid longitude');
  }
}
```

### API Call with Timeout
```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(apiUrl, {
    signal: controller.signal
  });
  // ... process response
} finally {
  clearTimeout(timeout);
}
```

### Caching Results
Consider caching geocoding results:
- Cache coordinates → state mappings
- Reduce API calls
- Improve performance
- Set reasonable TTL

### Testing
- Test with coordinates in various states
- Test with coordinates in restricted states
- Test with invalid coordinates
- Test with coordinates outside US
- Test API failure scenarios
- Mock Google API in tests

