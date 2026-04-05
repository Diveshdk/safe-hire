# Safe Hire: System Design & Implementation Research

This document provides a comprehensive breakdown of the features, tools, and technical workflows implemented in the **Safe Hire** platform for research paper presentations and teammate synchronization.

---

## 🚀 1. Core Features

### 🛡️ A. Privacy-Preserving Identity Verification (Aadhaar)
- **Zero-Knowledge Proofs (ZKP)**: Leverages **Anon Aadhaar** to verify a user's identity without storing or exposing sensitive PII (Personally Identifiable Information).
- **SafeHire ID**: A unique, cryptographically-linked identifier generated upon successful identity verification, acting as a "Trust Token" across the platform.

### 🏢 B. Multi-Layered Corporate Verification Engine
- **MCA Master Data Integration**: Real-time querying of 181MB+ of Maharashtra's corporate registry using high-performance streaming parsers.
- **Hybrid Search Engine**: Searches across four distinct layers:
    1. **Local CSV**: High-speed indexing of massive datasets.
    2. **Data.Gov.In API**: Real-time official government records.
    3. **OpenCorporates**: Global corporate fallback.
    4. **Mock/AI Simulation**: For demonstration and fallback for major brands.
- **Authenticity Reports**: Generates detailed legitimacy profiles for companies (Status, CIN, Date of Incorporation, Registered Address).

### 🎓 C. Cryptographic Credentialing System
- **Digital Signatures**: Institutions can issue certificates that are cryptographically signed using SHA-256 hashing.
- **Tamper-Proof Verification**: Every certificate has a unique hash stored in Supabase. Any alteration of the certificate data invalidates the verification link.
- **Automated Registry**: Certificates are automatically linked to the user's "Verified Documents" vault.

### 🤖 D. AI-Powered Resume Analysis
- **Local ATS Engine**: A custom-built analysis engine that evaluates resumes based on:
    - **Keyword Density**: Searching for technical proficiencies.
    - **Structural Integrity**: Detecting key sections (Experience, Education, Projects).
    - **Action-Oriented Language**: Identifying impact-driven verbs.
    - **Quantifiable Metrics**: Checking for data-backed achievements.
- **Rejection Analysis**: Provides actionable feedback to job seekers to improve their hiring chances.

---

## 🛠️ 2. Tech Stack & Tools

| Category | Tools & Technologies |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router), TypeScript |
| **Styling** | Tailwind CSS, Radix UI (Shadcn/UI components) |
| **Database/Storage** | Supabase (PostgreSQL, Realtime, Storage) |
| **Authentication** | Supabase Auth + Anon Aadhaar (ZKP) |
| **Data Processing** | PapaParse (Streaming CSV Parsing), Node Crypto |
| **AI/Logic** | Custom Local Analysis Engine |
| **Analytics/UI** | Recharts, Lucide Icons, Framer Motion |

---

## 🔄 3. Application Workflows (Flows)

### 🧩 A. User Onboarding & Identity Flow
1. **Registration**: User signs up via Email/Password (Supabase Auth).
2. **Identity Proof**: User initiates Aadhaar verification via Anon Aadhaar ZK-Proof.
3. **SafeHire ID Generation**: Once verified, the system generates a unique `safe_hire_id` for the profile.
4. **Trust Activation**: The profile is marked as "Verified," unlocking verified-only features.

### 🔍 B. Company Verification Flow (Job Seeker Perspective)
1. **Search**: User enters Company Name or CIN.
2. **Query Execution**: The `search-engine` concurrently queries the 181MB CSV and the Data.Gov API.
3. **Data Synthesis**: Results are deduplicated and ranked by source reliability.
4. **Report Generation**: User views the official status and incorporation details to avoid "Ghost Companies."

### 📜 C. Certificate Issuance & Verification Flow
1. **Event Creation**: An Institution creates a "Certificate Event" (e.g., Hackathon, Degree).
2. **Batch Processing**: Institution uploads a list of `safe_hire_id`s.
3. **Cryptographic Hashing**:
   - Data String: `EventID + UserID + Type + Timestamp`
   - Hash: `SHA-256(Data String)`
4. **Issuance**: Certificate record created in DB; unique hash stored.
5. **Public Verification**: A recruiter scans the QR code on the certificate -> Redirects to `/verify/certificate/[hash]` -> System confirms authenticity in real-time.

---

## 🔬 4. Research Highlights for Presentation

- **Scalability**: How we handle 180MB+ datasets in a serverless environment using streaming instead of loading into memory.
- **Security**: The transition from centralized trust to cryptographic trust using hashing and ZK-Proofs.
- **Privacy**: The "Minimum Disclosure" principle where users prove who they are without revealing their Aadhaar number.
- **Integration**: A unified ecosystem where the same "SafeHire ID" bridges the gap between academic institutions and corporate employers.
