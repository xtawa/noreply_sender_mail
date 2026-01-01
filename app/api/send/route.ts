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

        // Normalize recipients to array of objects
        let recipientList: any[] = [];

        if (Array.isArray(recipients)) {
            // Check if it's array of strings or objects
            if (recipients.length > 0 && typeof recipients[0] === 'string') {
                // Array of strings (Manual mode)
                recipientList = recipients.map((r: string) => {
                    let email = r.trim();
                    let name = '';
                    if (email.includes(',')) {
                        const parts = email.split(',');
                        email = parts[0].trim();
                        name = parts[1].trim();
                    }
                    return { email, name };
                });
            } else {
                // Array of objects (Notion mode)
                recipientList = recipients;
            }
        } else if (typeof recipients === 'string') {
            // Single string (shouldn't happen with current frontend logic but for safety)
            recipientList = [{ email: recipients.trim() }];
        }

        for (const recipient of recipientList) {
            const email = recipient.email;
            if (!email) continue;

            // Personalization replacement
            let personalizedHtml = htmlContent;
            if (typeof personalizedHtml === 'string') {
                // Replace {{key}} with value from recipient object
                // We iterate over keys in the recipient object
                for (const [key, value] of Object.entries(recipient)) {
                    const regex = new RegExp(`{{${key}}}`, 'gi'); // Case insensitive match
                    personalizedHtml = personalizedHtml.replace(regex, String(value || ''));
                }

                // Fallback for {{name}} if not explicitly in object but we have it derived
                if (!recipient.name && recipient.Name) {
                    personalizedHtml = personalizedHtml.replace(/{{name}}/gi, recipient.Name);
                }
            }

            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: email,
                    subject: subject, // We could also support {{}} in subject if needed
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
