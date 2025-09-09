# Email Verification Service Setup Instructions

## 1. Database Setup

1. Go to your Supabase dashboard → SQL Editor
2. Copy and paste the contents of `database_setup.sql`
3. Run the SQL to create the email_verifications table and policies

## 2. Edge Functions Setup

1. Go to your Supabase dashboard → Edge Functions
2. Create two new functions:

### Function 1: `verify-emails`
- Copy the code from `supabase/functions/verify-emails/index.ts`
- This function handles email verification logic

### Function 2: `get-email-results`  
- Copy the code from `supabase/functions/get-email-results/index.ts`
- This function retrieves verification results

## 3. Environment Variables

Add these to your project's `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in:
Supabase Dashboard → Settings → API

## 4. Authentication Setup

The app uses Supabase Auth with email/password. Users need to:
1. Sign up with email/password
2. Confirm their email (check spam folder)
3. Sign in to access the email verification service

## 5. Features Included

### ✅ Email Upload
- Single email or bulk upload via CSV/TXT
- Paste emails directly in textarea
- Support for multiple email formats (comma, semicolon, newline separated)

### ✅ Email Verification
- **Syntax Check**: Validates email format using regex
- **Domain Check**: Verifies domain exists via DNS lookup
- **MX Record Check**: Ensures domain has mail servers
- **Disposable Email Detection**: Identifies temporary email services

### ✅ Results Management  
- Real-time status tracking (PENDING → VALID/INVALID/DISPOSABLE)
- Detailed verification results with reason codes
- Statistics dashboard showing verification counts
- Filter results by status
- Export results as CSV or JSON

### ✅ Security
- Row Level Security (RLS) policies
- User isolation (users only see their own data)
- Secure API endpoints with authentication

## 6. API Endpoints

Once deployed, your Edge Functions will be available at:

- `POST /verify-emails` - Upload and verify emails
- `GET /get-email-results?status=VALID&format=csv` - Download results

## 7. Database Schema

```sql
email_verifications:
- id (UUID, Primary Key)
- email (TEXT)
- status (ENUM: PENDING, VALID, INVALID, DISPOSABLE, UNKNOWN)
- reason (TEXT)  
- syntax_valid (BOOLEAN)
- domain_exists (BOOLEAN)  
- mx_records_exist (BOOLEAN)
- created_at (TIMESTAMP)
- verified_at (TIMESTAMP)
- user_id (UUID, Foreign Key to auth.users)
```

## 8. Testing

1. Create an account and sign in
2. Upload a test list of emails (mix of valid/invalid)
3. Watch real-time verification progress
4. Export results to verify data accuracy

The service will validate emails against real DNS records and MX servers for accurate results.