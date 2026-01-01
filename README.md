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
- **Bulk Sending**: Supports sending emails to multiple recipients.
- **Markdown Support**: Templates are written in Markdown and converted to HTML.
- **Secure Access**: Protected by an admin password.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
