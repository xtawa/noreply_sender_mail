import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const SECRET = process.env.ADMIN_PASSWORD || 'default-secret-key';

function signOtp(email: string, otp: string, expires: number) {
    const data = `${email}:${otp}:${expires}`;
    const signature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
    return `${data}:${signature}`; // email:otp:expires:signature
}

function verifyToken(token: string, inputOtp: string) {
    if (!token) return { valid: false, error: 'Missing token' };
    const parts = token.split(':');
    if (parts.length !== 4) return { valid: false, error: 'Invalid token format' };

    const [email, otp, expiresStr, signature] = parts;
    const expires = parseInt(expiresStr);

    if (Date.now() > expires) return { valid: false, error: 'OTP expired' };
    if (otp !== inputOtp) return { valid: false, error: 'Invalid OTP' };

    const expectedSignature = crypto.createHmac('sha256', SECRET)
        .update(`${email}:${otp}:${expires}`)
        .digest('hex');

    if (signature !== expectedSignature) return { valid: false, error: 'Invalid token signature' };

    return { valid: true, email };
}

function signSessionToken(email: string) {
    const expires = Date.now() + 3 * 24 * 60 * 60 * 1000; // 3 days
    const data = `${email}:${expires}`;
    const signature = crypto.createHmac('sha256', SECRET).update(data).digest('hex');
    return `${data}:${signature}`;
}

function verifySessionToken(token: string) {
    if (!token) return false;
    try {
        const parts = token.split(':');
        if (parts.length !== 3) return false;
        const [email, expiresStr, signature] = parts;
        const expires = parseInt(expiresStr);
        if (Date.now() > expires) return false;
        const expectedSignature = crypto.createHmac('sha256', SECRET)
            .update(`${email}:${expires}`)
            .digest('hex');
        return signature === expectedSignature;
    } catch (e) {
        return false;
    }
}

export async function POST(request: Request) {
    try {
        const { email, password, sessionToken } = await request.json();

        // Check session token first (Remember Me)
        if (sessionToken && verifySessionToken(sessionToken)) {
            return NextResponse.json({
                otpRequired: false,
                message: 'Session verified'
            });
        }

        // Verify password
        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({
                error: 'Invalid password'
            }, { status: 401 });
        }

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
        const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

        // Create signed token
        const token = signOtp(email, otp, expires);

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
        <h2>Login Verification</h2>
        <p>You are logging into NoreplySender.</p>
        <div class="otp-box">
            <p>Your verification code is:</p>
            <div class="otp-code">${otp}</div>
        </div>
        <p>This code expires in <strong>5 minutes</strong>.</p>
        <p class="warning">⚠️ If you did not request this, please ignore this email.</p>
    </div>
</body>
</html>`;

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: otpEmail,
            subject: 'Login Verification - NoreplySender',
            html: emailHtml,
        });

        return NextResponse.json({
            otpRequired: true,
            message: 'OTP sent successfully',
            otpEmail: otpEmail.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
            token: token
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
        const { email, otp, token } = await request.json();

        const result = verifyToken(token, otp);

        if (!result.valid) {
            return NextResponse.json(result, { status: 400 });
        }

        // Generate session token for "Remember Me"
        const sessionToken = signSessionToken(email);

        return NextResponse.json({
            valid: true,
            message: 'OTP verified successfully',
            sessionToken
        });

    } catch (error: any) {
        console.error('OTP verify error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to verify OTP'
        }, { status: 500 });
    }
}
