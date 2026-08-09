Terms & Conditions System Flow
Objective
Implement a comprehensive terms and conditions system for legal compliance across signup, login, and invoice generation.

Database Schema
Two new tables:

terms_and_conditions - Store different types of terms
user_terms_acceptances - Track user acceptances with audit trail
User Flow
1. New User Signup
Trigger: User registration
Action: Display GENERAL + PRIVACY_POLICY terms
Requirement: Must accept to proceed
Storage: Record acceptance with type=SIGNUP

2. Existing User Login
Trigger: User authentication
Action: Check for new/updated terms since last acceptance
Requirement: Accept if new terms exist
Storage: Record acceptance with type=LOGIN

3. Invoice Generation
Trigger: Admin creates invoice
Action: Check INVOICE_TERMS acceptance
Requirement: Must accept before invoice creation
Storage: Record acceptance with type=INVOICE_GENERATION

4. Payment Processing
Trigger: Payment initiation
Action: Verify PAYMENT_TERMS acceptance
Requirement: Must accept to proceed
Storage: Record acceptance with type=PAYMENT_PROCESSING

Technical Requirements

Backend API Endpoints
GET /api/terms - Get active terms by type
POST /api/terms - Create new terms (admin only)
PUT /api/terms/:id - Update terms (admin only)
POST /api/terms/accept - Record user acceptance
GET /api/terms/user/:id/status - Check user acceptance status
Frontend Components
TermsModal: Display terms for acceptance
TermsCheckbox: Integration in signup/login forms
InvoiceTermsSection: Terms display in invoice flow
Database Features
Multi-tenant: Organization-specific terms
Version control: Track terms history
Audit trail: IP, user agent, timestamps
Revocation support: Users can withdraw consent
Implementation Priority
Phase 1: Database schema + basic APIs
Phase 2: Signup/Login integration
Phase 3: Invoice/Payment terms integration
Phase 4: Admin dashboard for terms management
Compliance Features
GDPR: Right to withdraw consent
Audit Trail: Full acceptance history
Version Control: Track terms changes
Multi-context: Different terms for different actions
Success Metrics
100% terms acceptance on signup
Audit trail for all user interactions
Admin ability to manage terms versions
Legal compliance documentation