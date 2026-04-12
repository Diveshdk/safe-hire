# SafeHire Identity Protocol - Compliance & Technical Audit Report
**Compiled**: 2026-04-12  
**Purpose**: Documentation of data minimization and identity privacy controls for DPDPA 2023.

---

## 1. Executive Summary
SafeHire is a verification-first professional platform designed with "Privacy by Design" as its core principle. The system balances the need for high-trust identity verification with the legal mandates of the **Indian Aadhaar Act** and the **Digital Personal Data Protection Act (DPDPA) 2023**.

## 2. Technical Architecture of Privacy
### 2.1 Zero-Persistence Policy
- **Aadhaar Images**: The platform does NOT store Aadhaar card images or PDFs. Documents are processed in-memory via OCR and immediately discarded.
- **Full Numbers**: Full 12-digit Aadhaar numbers are never persisted to any database or log file.

### 2.2 Reversible Identity Tokenization (The Hashing Protocol)
To prevent duplicate accounts (identity fraud) without storing actual Aadhaar numbers, SafeHire uses a one-way cryptographic protocol:
1. **Extraction**: The system extracts only the **Full Name** and the **Last 4 Digits** from the card.
2. **Normalization**: Data is normalized (lowercased, punctuation removed) to ensure consistency.
3. **Salting**: A server-side secret SALT is appended.
4. **SHA-256 Hashing**: The resulting string is hashed using SHA-256.
   - *Result*: `df2e3...09a` (A 64-character hash that cannot be reversed to reveal the original name or digits).
5. **Storage**: Only this hash is stored in the `aadhaar_number` field of the `profiles` table.

## 3. Compliance Roadmap
### 3.1 DPDPA 2023 (Informed Consent)
- **Notice & Consent**: The signup flow enforces a **Mandatory Scroll-to-Accept** UI for Rules & Regulations, ensuring "Informed Consent" per Section 6 of the Act.
- **Right to Erasure**: Users can permanently delete their personal identity metadata via the Settings dashboard.
- **Blacklisting**: To satisfy "Prevention of Fraud," erased identity hashes are moved to a blacklist to block re-registration with the same card, while all PII (Name) is purged.

### 3.2 Aadhaar Act (Section 29)
- **Compliance**: By not storing the 12-digit number, SafeHire avoids being classified as an "AUA/KUA," removing the requirement for complex localized hardware security modules while remaining compliant with restrictions on private entities holding Aadhaar data.

## 4. Liability Disclaimers
SafeHire implements "Best-Effort OCR Verification." 
- **Disclaimer**: All verified profiles carry a disclaimer that the platform is a verification-assistance tool and not an official government database link.
- **Contractual Shield**: Users agree to cross-verify all identity data through official channels in the signed Terms of Service.

---
**SafeHire Engineering Team**  
*Hardened for Production Delivery*
