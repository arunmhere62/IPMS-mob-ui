
## Terms & Conditions (Legal Documents) Flow

The mobile app is the **consumer** of legal documents published by the backoffice/web app.

### Goal

- Ensure PG owners accept the latest required legal documents (Terms, Privacy, etc.) before using the app.

### Backend endpoints (reference)

- `GET /legal-documents/required/status?context=SIGNUP|LOGIN|...`
- `POST /legal-documents/:id/accept`

### Recommended client behavior

- **During Signup**
  - Fetch `required/status?context=SIGNUP`
  - If `pending.length > 0`, show a blocking Terms UI and require acceptance
  - Call `POST /legal-documents/:id/accept` for each pending required doc
  - Proceed with signup only after all required docs are accepted

- **After Login (App entry gate)**
  - Fetch `required/status?context=LOGIN`
  - If not accepted, show a blocking modal/screen until acceptance is completed

- **Audit trail**
  - Send `acceptance_context` so backend stores whether acceptance happened on SIGNUP vs LOGIN.