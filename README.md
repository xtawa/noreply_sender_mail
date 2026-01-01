# Noreply Sender Mail

This is a [Next.js](https://nextjs.org) project designed to send noreply emails using templates.

## Environment Variables

To run this project, you need to configure the following environment variables in your `.env.local` file (for local development) or in your Vercel project settings.

| Variable | Description | Example |
| :--- | :--- | :--- |
| `SMTP_HOST` | The hostname of your SMTP server. | `smtp.example.com` |
| `SMTP_PORT` | The port of your SMTP server. | `465` (SSL) or `587` (TLS) |
| `SMTP_USER` | The username for your SMTP server. | `user@example.com` |
| `SMTP_PASS` | The password for your SMTP server. | `your_password` |
| `ADMIN_PASSWORD` | The password to access the dashboard and send emails. | `secure_admin_password` |
| `SMTP_FROM` | (Optional) The email address to send from. Defaults to `SMTP_USER`. | `noreply@example.com` |
| `NOTION_API_KEY` | The integration token for Notion API. | `secret_...` |
| `NOTION_DATABASE_ID` | The ID of the Notion database containing recipients. | `32-char-id` |
| `NOTION_TEMPLATE_DATABASE_ID` | The ID of the Notion database for saving/loading templates. | `32-char-id` |
| `OTP_ENABLE` | Enable/disable two-factor authentication. `1` = enabled, `0` = disabled. | `1` |
| `OTP_EMAIL` | The email address to receive OTP verification codes. | `admin@example.com` |

## Notion Setup

1. Create a Notion Integration at [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations).
2. Share your database with the integration.
3. Ensure your database has the following properties:
    - **role** (Multi-select or Select): Defines the user roles.
    - **mail** or **Email** (Email): The recipient's email address.
    - **Name** (Title): The recipient's name.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Template Management**: Reads markdown templates from the `/templete` directory.
- **Rich Text Editor**: WYSIWYG editor for composing emails with formatting.
- **Bulk Sending**: Supports sending emails to multiple recipients.
- **Real-time Progress**: See email sending status in real-time with Server-Sent Events.
- **Notion Integration**: Fetch recipients directly from a Notion database based on roles.
- **Two-Factor Authentication**: Optional OTP verification for enhanced security.
- **Secure Access**: Protected by an admin password.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
