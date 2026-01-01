import nodemailer from 'nodemailer';
import { marked } from 'marked';

export async function POST(request: Request) {
    try {
        const { recipients, subject, content, password } = await request.json();

        if (password !== process.env.ADMIN_PASSWORD) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return new Response(JSON.stringify({ error: 'SMTP configuration missing' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
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

        // Normalize recipients to array of objects
        let recipientList: any[] = [];

        if (Array.isArray(recipients)) {
            if (recipients.length > 0 && typeof recipients[0] === 'string') {
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
                recipientList = recipients;
            }
        } else if (typeof recipients === 'string') {
            recipientList = [{ email: recipients.trim() }];
        }

        // Create a readable stream for Server-Sent Events
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                for (const recipient of recipientList) {
                    const email = recipient.email;
                    if (!email) continue;

                    // Personalization replacement
                    let personalizedHtml = htmlContent;
                    if (typeof personalizedHtml === 'string') {
                        for (const [key, value] of Object.entries(recipient)) {
                            const regex = new RegExp(`{{${key}}}`, 'gi');
                            personalizedHtml = personalizedHtml.replace(regex, String(value || ''));
                        }

                        if (!recipient.name && recipient.Name) {
                            personalizedHtml = personalizedHtml.replace(/{{name}}/gi, recipient.Name);
                        }
                    }

                    try {
                        await transporter.sendMail({
                            from: process.env.SMTP_FROM || process.env.SMTP_USER,
                            to: email,
                            subject: subject,
                            html: personalizedHtml,
                        });

                        // Send success event
                        const data = JSON.stringify({
                            email,
                            status: 'sent',
                            timestamp: new Date().toISOString()
                        });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    } catch (error: any) {
                        console.error(`Failed to send to ${email}:`, error);

                        // Send failure event
                        const data = JSON.stringify({
                            email,
                            status: 'failed',
                            error: error.message,
                            timestamp: new Date().toISOString()
                        });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }
                }

                // Send completion event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                controller.close();
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('Error in send API:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
