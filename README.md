# Sabyasachi Kumar Portfolio

A modern portfolio with a production-style contact pipeline.

## What's Included

- Responsive dashboard-style portfolio UI
- Projects with image cards + category filters
- Contact form with:
  - OTP verification
  - Honeypot anti-bot field
  - Rate limiting
  - Optional image links in submissions
- SQLite database storage for all leads
- Professional reference IDs for each request
- Branded HTML acknowledgement emails
- Admin page to view and export leads as CSV
- Newsletter subscription storage
- Right-side React + Material UI chatbot assistant

## Framework/Library Upgrade

This project now includes CDN integrations for:

- Tailwind CSS
- Bootstrap
- React
- Material UI

## Setup

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env
```

3. Update `.env`

```env
PORT=3000
ADMIN_TOKEN=change-this-admin-token

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
OWNER_EMAIL=sabyakumar2003@gmail.com
```

4. Start server

```bash
npm start
```

5. Open site

```text
http://localhost:3000
```

6. Open admin page

```text
http://localhost:3000/admin.html
```

## SMTP (What It Is)

SMTP is the email server configuration that lets your app send real emails.
Without SMTP, form data is still saved to database, but acknowledgement emails cannot be sent.

For Gmail:

- Enable 2-factor authentication
- Generate an App Password
- Use that App Password as `SMTP_PASS`

## APIs

- `POST /api/otp/request` - sends or returns dev OTP
- `POST /api/contact` - verifies OTP, saves lead, sends emails
- `POST /api/newsletter` - saves newsletter subscriber
- `GET /api/admin/leads` - admin JSON leads list (requires token)
- `GET /api/admin/leads/export.csv` - admin CSV export (requires token)
- `GET /health` - service health

## Security Notes

- Honeypot rejects bot-like submissions
- Rate limit prevents contact endpoint abuse
- Admin APIs require `ADMIN_TOKEN`

## License

MIT
