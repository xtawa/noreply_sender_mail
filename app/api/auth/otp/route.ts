import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Store OTP codes temporarily (in production, use Redis or similar)
const otpStore = new Map<string, { code: string; expires: number }>();

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        // Check if OTP is enabled
        if (process.env.OTP_ENABLE !== '1') {
            return NextResponse.json({
                otpRequired: false,
                message: 'OTP verification is disabled'
            });
        }

        // Validate OTP email is configured
        const otpEmail = process.env.OTP_EMAIL;
        if (!otpEmail) {
            return NextResponse.json({
                error: 'OTP email not configured'
            }, { status: 500 });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with 5-minute expiration
        otpStore.set(email, {
            code: otp,
            expires: Date.now() + 5 * 60 * 1000
        });

        // Send OTP email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .otp-box { background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 8px; }
        .warning { color: #e74c3c; font-size: 14px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>登录验证码</h2>
        <p>您正在登录 NoreplySender 邮件发送系统。</p>
        <div class="otp-box">
            <p>您的验证码是:</p>
            <div class="otp-code">${otp}</div>
        </div>
        <p>此验证码将在 <strong>5分钟</strong> 后失效。</p>
        <p class="warning">⚠️ 如果这不是您的操作,请忽略此邮件。</p>
    </div>
</body>
</html>`;

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: otpEmail,
            subject: '登录验证码 - NoreplySender',
            html: emailHtml,
        });

        return NextResponse.json({
            otpRequired: true,
            message: 'OTP sent successfully',
            otpEmail: otpEmail.replace(/(.{2}).*(@.*)/, '$1***$2') // Mask email
        });

    } catch (error: any) {
        console.error('OTP send error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to send OTP'
        }, { status: 500 });
    }
}

// Verify OTP
export async function PUT(request: Request) {
    try {
        const { email, otp } = await request.json();

        const stored = otpStore.get(email);

        if (!stored) {
            return NextResponse.json({
                valid: false,
                error: 'OTP not found or expired'
            }, { status: 400 });
        }

        if (Date.now() > stored.expires) {
            otpStore.delete(email);
            return NextResponse.json({
                valid: false,
                error: 'OTP expired'
            }, { status: 400 });
        }

        if (stored.code !== otp) {
            return NextResponse.json({
                valid: false,
                error: 'Invalid OTP'
            }, { status: 400 });
        }

        // OTP is valid, remove it
        otpStore.delete(email);

        return NextResponse.json({
            valid: true,
            message: 'OTP verified successfully'
        });

    } catch (error: any) {
        console.error('OTP verify error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to verify OTP'
        }, { status: 500 });
    }
}
