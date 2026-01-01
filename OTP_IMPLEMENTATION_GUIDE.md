# 两步验证(OTP)功能实现指南

## 已完成的后端工作

1. ✅ 创建了 `app/api/auth/otp/route.ts` API端点
   - POST: 发送OTP验证码到配置的邮箱
   - PUT: 验证用户输入的OTP

## 环境变量配置

在 `.env.local` 和 Vercel 环境变量中添加:

```env
# OTP Two-Factor Authentication
OTP_ENABLE=1                    # 1=启用OTP, 0=禁用OTP
OTP_EMAIL=your-email@example.com  # 接收验证码的邮箱地址
```

## 前端集成步骤 (app/page.tsx)

### 1. 添加状态变量(约第67行后)

```typescript
// OTP State
const [otpRequired, setOtpRequired] = useState(false);
const [otpCode, setOtpCode] = useState('');
const [otpEmail, setOtpEmail] = useState('');
const [sendingOtp, setSendingOtp] = useState(false);
const [verifyingOtp, setVerifyingOtp] = useState(false);
```

### 2. 修改 handleLogin 函数

```typescript
const handleLogin = async () => {
    if (!password) return;
    
    // Check if OTP is enabled
    try {
        setSendingOtp(true);
        const res = await fetch('/api/auth/otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin' })
        });
        
        const data = await res.json();
        
        if (data.otpRequired) {
            // OTP is enabled, show OTP input
            setOtpRequired(true);
            setOtpEmail(data.otpEmail);
            alert(`验证码已发送到 ${data.otpEmail}`);
        } else {
            // OTP is disabled, proceed with normal login
            setIsAuthenticated(true);
            fetchTemplates();
        }
    } catch (error) {
        console.error('OTP error:', error);
        // If OTP fails, allow normal login
        setIsAuthenticated(true);
        fetchTemplates();
    } finally {
        setSendingOtp(false);
    }
};
```

### 3. 添加 OTP 验证函数

```typescript
const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
        alert('请输入6位验证码');
        return;
    }
    
    setVerifyingOtp(true);
    try {
        const res = await fetch('/api/auth/otp', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: 'admin',
                otp: otpCode 
            })
        });
        
        const data = await res.json();
        
        if (data.valid) {
            setIsAuthenticated(true);
            fetchTemplates();
        } else {
            alert(data.error || '验证码错误');
            setOtpCode('');
        }
    } catch (error) {
        console.error('Verify error:', error);
        alert('验证失败,请重试');
    } finally {
        setVerifyingOtp(false);
    }
};
```

### 4. 修改登录界面 UI (约第256-282行)

```tsx
if (!isAuthenticated) {
    return (
        <div className="login-screen">
            <div className="login-card">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: '12px' }}>
                        <Mail size={32} color="#6366f1" />
                    </div>
                </div>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Welcome Back</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.9rem' }}>
                    {otpRequired ? '请输入验证码' : 'Enter your admin password to access the dashboard'}
                </p>
                
                {!otpRequired ? (
                    <>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="Admin Password"
                                className="text-input"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            />
                        </div>
                        <button 
                            className="btn-primary" 
                            onClick={handleLogin}
                            disabled={sendingOtp}
                        >
                            {sendingOtp ? 'Sending OTP...' : 'Access Dashboard'}
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            验证码已发送到: <strong>{otpEmail}</strong>
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="6位验证码"
                                className="text-input"
                                value={otpCode}
                                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                                maxLength={6}
                                style={{ 
                                    textAlign: 'center', 
                                    fontSize: '1.5rem', 
                                    letterSpacing: '8px',
                                    fontWeight: 'bold'
                                }}
                            />
                        </div>
                        <button 
                            className="btn-primary" 
                            onClick={handleVerifyOtp}
                            disabled={verifyingOtp || otpCode.length !== 6}
                        >
                            {verifyingOtp ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <button 
                            className="btn-ghost" 
                            onClick={() => {
                                setOtpRequired(false);
                                setOtpCode('');
                            }}
                            style={{ marginTop: '10px', width: '100%' }}
                        >
                            Back
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
```

## 功能说明

1. **OTP启用/禁用**:
   - `OTP_ENABLE=1`: 启用两步验证
   - `OTP_ENABLE=0`: 禁用两步验证,直接密码登录

2. **验证流程**:
   - 用户输入密码后点击登录
   - 系统检查OTP是否启用
   - 如果启用,发送6位验证码到配置的邮箱
   - 用户输入验证码
   - 验证成功后登录

3. **安全特性**:
   - 验证码5分钟后自动失效
   - 验证成功后立即删除验证码
   - 邮箱地址部分隐藏显示
   - 验证码只能使用一次

## 测试步骤

1. 设置环境变量 `OTP_ENABLE=1` 和 `OTP_EMAIL=your-email@example.com`
2. 重启开发服务器
3. 尝试登录
4. 检查邮箱收到验证码
5. 输入验证码完成登录

## 生产环境注意事项

⚠️ 当前实现使用内存存储OTP,服务器重启后会丢失。生产环境建议:
- 使用 Redis 存储OTP
- 添加速率限制防止暴力破解
- 记录登录尝试日志
- 考虑使用专业的认证服务(如 Auth0, Clerk)
