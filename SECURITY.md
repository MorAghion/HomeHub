# HomeHub Security Architecture & Data Protection

This document outlines the security measures, infrastructure, and custom hardening implemented in the HomeHub application to ensure data privacy, integrity, and availability.

---

## 1. Infrastructure & Cloud Provider
HomeHub leverages **Supabase**, an open-source Firebase alternative, built on top of enterprise-grade infrastructure.

* **Cloud Hosting:** All data and services are hosted on **Amazon Web Services (AWS)**.
* **Data Residency & Encryption:** * **Encryption at Rest:** All database volumes and backups are encrypted using **AES-256**.
    * **Encryption in Transit:** All communication between the client (mobile/web) and the server is forced over **HTTPS (TLS 1.3)**.
    * **Compliance:** The underlying infrastructure is **SOC2 Type II** and **ISO 27001** compliant.

---

## 2. Authentication & Identity Management
User identity is managed through Supabase Auth (GoTrue), providing a robust barrier against unauthorized access.

* **JWT (JSON Web Tokens):** Secure, short-lived tokens are used for session management.
* **Session Persistence:** Configured with `persistSession: true` and automatic token refreshing to maintain a seamless yet secure user experience.
* **Metadata-Based Scoping:** Each user is assigned a unique `household_id`, which serves as the primary key for all data isolation.

---

## 3. Database Security (Row Level Security - RLS)
The core of HomeHub's security is **PostgreSQL Row Level Security (RLS)**. This ensures that security is enforced at the database level, not just the application level.

* **Data Isolation:** Every table (`shopping_lists`, `task_lists`, `voucher_items`, etc.) is protected by RLS policies.
* **Household-Level Scoping:** A user can **only** SELECT, INSERT, UPDATE, or DELETE rows where the `household_id` matches their own verified ID.
* **Owner-Only Permissions:** Specific administrative actions (e.g., updating household settings, generating invites) are restricted to the `owner_id`.

---

## 4. Storage Security (Media & Vouchers)
Voucher images and sensitive documents are stored in **Supabase Storage** (backed by AWS S3).

* **Private Buckets:** The `voucher-images` bucket is set to **Private**. Public access is completely disabled.
* **Signed URLs:** Images are never served via public links. The app generates **Time-Limited Signed URLs**, which are only valid for authenticated users within the specific household.
* **Path-Based RLS:** Storage policies ensure that a user can only access files under the `{household_id}/` directory path.

---

## 5. Custom Security Hardening (Implemented Refinements)
Recent audits and updates have added the following specialized security layers:

* **Secure Invitation Logic:**
    * **Limited Expiry:** Invitation codes are valid for a maximum of **24 hours**.
    * **Rate Limiting:** A brute-force protection mechanism locks the "Join" functionality after 5 failed attempts (15-minute cooldown).
* **Data Integrity:**
    * **Foreign Key Constraints:** All data tables are linked to the `households` table via UUID.
    * **Cascade Deletes:** `ON DELETE CASCADE` is implemented across the entire schema. If a household is deleted by the owner, all associated data is permanently and instantly wiped.
* **Input Sanitization:** Frontend logic ensures that user-generated content (list names, items) is handled safely to prevent **XSS (Cross-Site Scripting)** attacks.
* **Admin Enforcement:** Clear separation between "Owner" and "Member" roles, preventing unauthorized users from removing members or generating new access codes.

* **Administrative Controls:** Includes a "Danger Zone" accessible only to Owners, requiring manual string verification ("DELETE") before executing a full-chain cascade deletion.