import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { marked } from 'marked';

export async function POST(request: Request) {
    try {
        const { recipients, subject, content, password } = await request.json();

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return NextResponse.json({ error: 'SMTP configuration missing' }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Convert Markdown to HTML
        const htmlContent = await marked.parse(content);

        const results = [];
        const recipientList = Array.isArray(recipients) ? recipients : [recipients];

        for (const recipient of recipientList) {
            // Handle "email, name" format if present, otherwise just email
            let email = recipient.trim();
            let name = '';

            if (email.includes(',')) {
                const parts = email.split(',');
                email = parts[0].trim();
                name = parts[1].trim();
            }

            // Simple personalization replacement
            let personalizedHtml = htmlContent;
            if (typeof personalizedHtml === 'string') {
                personalizedHtml = personalizedHtml.replace(/{{name}}/g, name || 'Customer');
                personalizedHtml = personalizedHtml.replace(/{{email}}/g, email);
            }

            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: email,
                    subject: subject,
                    html: personalizedHtml,
                });
                results.push({ email, status: 'sent' });
            } catch (error: any) {
                console.error(`Failed to send to ${email}:`, error);
                results.push({ email, status: 'failed', error: error.message });
            }
        }

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error('Error in send API:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
