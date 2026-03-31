# Anon Aadhaar Integration

## Overview

We've integrated **Anon Aadhaar** - a zero-knowledge proof system that allows users to verify their Aadhaar identity anonymously during registration. This provides privacy-preserving identity verification without exposing personal details.

## What is Anon Aadhaar?

Anon Aadhaar uses zero-knowledge proofs (ZK-SNARKs) to verify that:
- ✅ You have a valid Aadhaar card
- ✅ The document is officially signed by UIDAI (Government of India)
- ✅ You meet age requirements (18+)
- ❌ **WITHOUT** revealing your name, Aadhaar number, or any other personal details

## Features Added

### 1. **Anonymous Verification Option**
- Users can now choose "Anonymous ZK Proof" during registration
- Alternative to XML upload or demo mode
- Provides the highest level of privacy

### 2. **Zero-Knowledge Proof Generation**
- Uses cryptographic proofs to verify Aadhaar authenticity
- All computation happens client-side in the browser
- No personal data is sent to servers

### 3. **Selective Disclosure**
- Currently configured to verify:
  - Age above 18 (`revealAgeAbove18`)
- Can be extended to reveal:
  - Gender (`revealGender`)
  - State (`revealState`)
  - Pin Code (`revealPinCode`)

## How It Works

### User Flow:
1. **Registration** → User selects "Anonymous ZK Proof" option
2. **Upload** → User uploads Aadhaar QR code or PDF
3. **Generate Proof** → Browser generates zero-knowledge proof
4. **Verification** → System verifies proof without seeing personal data
5. **Complete** → User is marked as verified in the database

### Technical Flow:
```
Client Browser                          Server
     │                                     │
     │  1. Upload Aadhaar QR/PDF          │
     ├────────────────────────────────────┤
     │                                     │
     │  2. Generate ZK Proof (client-side)│
     │     • Verify UIDAI signature       │
     │     • Extract minimal claims       │
     │     • Create cryptographic proof   │
     │                                     │
     │  3. Submit Proof                   │
     ├────────────────────────────────────>
     │                                     │
     │                          4. Verify Proof
     │                             • Validate ZK proof
     │                             • Check age requirement
     │                             • Mark user as verified
     │                                     │
     │  5. Success Response               │
     <────────────────────────────────────┤
```

## Files Modified/Created

### 1. **Package Installation**
```bash
pnpm add @anon-aadhaar/react @anon-aadhaar/core
```

### 2. **Next.js Configuration** (`next.config.mjs`)
```javascript
webpack: (config) => {
  config.resolve.fallback = {
    fs: false,
    readline: false,
  }
  return config
}
```

### 3. **Provider Setup** (`components/providers/anon-aadhaar-provider.tsx`)
- Wraps the app with `AnonAadhaarProvider`
- Configured for test mode (`_useTestAadhaar={true}`)
- Change to `false` for production

### 4. **Root Layout** (`app/layout.tsx`)
- Added `AnonAadhaarProviderWrapper` to root
- Enables Anon Aadhaar hooks throughout the app

### 5. **Verification Component** (`components/auth/anon-aadhaar-verify.tsx`)
- Custom UI for Anon Aadhaar verification
- Shows real-time status (logged-out, logging-in, logged-in)
- Displays proof details after verification
- Includes "Skip for now" option

### 6. **Sign-Up Page** (`app/(auth)/sign-up/page.tsx`)
- Added "Anonymous ZK Proof" option
- Integrated `AnonAadhaarVerify` component
- Handles proof submission to backend

### 7. **API Endpoint** (`app/api/verify/anon-aadhaar/route.ts`)
- Receives and validates Anon Aadhaar proofs
- Marks user as `aadhaar_verified` in database
- Stores verification timestamp

## Configuration

### Nullifier Seed
A unique identifier for your app to prevent proof replay attacks:

```javascript
// Generated using:
const crypto = require('crypto');
const nullifierSeed = BigInt(
  parseInt(crypto.randomBytes(10).toString('hex'), 16)
).toString();

// Current seed: 224050376795949629440000
```

**⚠️ Important**: This seed is hardcoded for demo. In production:
1. Store in environment variable: `NEXT_PUBLIC_ANON_AADHAAR_NULLIFIER_SEED`
2. Use the same seed across all environments
3. Never change it after users have verified

### Test vs Production Mode

**Test Mode** (Current):
```typescript
<AnonAadhaarProvider _useTestAadhaar={true}>
```
- Uses test Aadhaar data
- Generate test QR codes at: https://documentation.anon-aadhaar.pse.dev/docs/generate-qr
- Faster for development

**Production Mode**:
```typescript
<AnonAadhaarProvider _useTestAadhaar={false}>
```
- Requires real Aadhaar cards
- Validates against official UIDAI signatures
- Use only after thorough testing

## Testing

### 1. Generate Test Aadhaar QR Code
Visit: https://documentation.anon-aadhaar.pse.dev/docs/generate-qr

### 2. Test the Flow
1. Start the dev server: `pnpm dev`
2. Navigate to `/sign-up`
3. Select "Job Seeker" or "Employee"
4. Choose "🔒 Anonymous ZK Proof"
5. Upload your test QR code
6. Wait for proof generation (~10-30 seconds)
7. Verify success message appears

### 3. Check Database
```sql
SELECT id, full_name, aadhaar_verified, aadhaar_verified_at 
FROM profiles 
WHERE aadhaar_verified = true;
```

## Security Considerations

### ✅ What's Safe
- Personal data never leaves the user's browser
- Only cryptographic proofs are transmitted
- Server cannot extract Aadhaar details from proof
- Replay attacks prevented by nullifier seed
- UIDAI signature validation ensures authenticity

### ⚠️ Considerations
- ZK proof generation is CPU-intensive (10-30s on average devices)
- Large WASM files downloaded first time (~40MB)
- Test mode should never be used in production
- Nullifier seed must remain constant

## Customization Options

### Change Fields to Reveal
In `components/auth/anon-aadhaar-verify.tsx`:

```typescript
<LogInWithAnonAadhaar 
  nullifierSeed={nullifierSeed}
  fieldsToReveal={[
    "revealAgeAbove18",  // Age verification
    "revealGender",      // Gender
    "revealState",       // State
    "revealPinCode"      // Pin code
  ]}
/>
```

### Add Signal (Additional Context)
```typescript
<LogInWithAnonAadhaar 
  nullifierSeed={nullifierSeed}
  signal="registration-2024"  // Custom signal
  fieldsToReveal={["revealAgeAbove18"]}
/>
```

### Server-Side Verification
For critical applications, add server-side proof verification:

```typescript
import { verify, init, artifactUrls, ArtifactsOrigin } from "@anon-aadhaar/core"

async function verifyProofOnServer(proof) {
  await init({
    wasmURL: artifactUrls.v2.wasm,
    zkeyURL: artifactUrls.v2.zkey,
    vkeyURL: artifactUrls.v2.vk,
    artifactsOrigin: ArtifactsOrigin.server,
  })
  
  const isValid = await verify(proof)
  return isValid
}
```

## Resources

- **Official Documentation**: https://documentation.anon-aadhaar.pse.dev/
- **GitHub Repository**: https://github.com/anon-aadhaar/anon-aadhaar
- **Generate Test QR**: https://documentation.anon-aadhaar.pse.dev/docs/generate-qr
- **Example App**: https://github.com/anon-aadhaar/quick-setup

## Troubleshooting

### Proof Generation Fails
- Ensure you're using a valid Aadhaar QR code/PDF
- Check if test mode is enabled for test data
- Clear browser cache and reload

### "Invalid Signature" Error
- Verify `_useTestAadhaar` matches your QR code type
- Test QR codes only work in test mode
- Real Aadhaar requires production mode

### Slow Proof Generation
- First load downloads ~40MB of ZK artifacts
- Subsequent loads are faster (cached)
- Low-end devices may take 30-60 seconds

### TypeScript Errors
- Ensure `@anon-aadhaar/react` and `@anon-aadhaar/core` are installed
- Check version compatibility (we're using v2.4.3)

## Future Enhancements

1. **Offline Mode**: Download ZK artifacts locally for faster proving
2. **Mobile Optimization**: Optimize for mobile devices
3. **Proof Caching**: Store proofs for re-verification
4. **Multi-Factor**: Combine with other verification methods
5. **Analytics**: Track verification success rates
6. **Custom UI**: More branded verification interface

## Deployment Notes

### Environment Variables (Vercel)
Add to Vercel project settings:
```
NEXT_PUBLIC_ANON_AADHAAR_NULLIFIER_SEED=224050376795949629440000
```

### Build Configuration
- Build time may increase due to large dependencies
- Ensure webpack configuration is deployed
- Test proof generation in production environment

### Performance
- First-time users: ~40MB download + 10-30s proof generation
- Returning users: Faster due to cached artifacts
- Consider adding loading indicators

---

**Note**: This integration is currently in **test mode**. Before production:
1. Switch to production mode
2. Test with real Aadhaar cards
3. Add proper error handling
4. Implement rate limiting
5. Monitor proof generation success rates
