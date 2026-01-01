'use client';

import { useState, useEffect, useRef } from 'react';
import { Mail, Users, Send, FileText, Settings, LogOut, Database, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';
import 'react-quill/dist/quill.snow.css';

interface Template {
    id?: string;
    filename: string;
    subject: string;
    body: string;
    source?: 'local' | 'notion';
    type?: string;
}

interface Log {
    email: string;
    status: 'sent' | 'failed';
    error?: string;
    timestamp: string;
}

interface NotionOption {
    id: string;
    name: string;
    color: string;
}

export default function Home() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [recipients, setRecipients] = useState('');

    const [sending, setSending] = useState(false);
    const [logs, setLogs] = useState<Log[]>([]);

    // OTP State
    const [otpRequired, setOtpRequired] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpEmail, setOtpEmail] = useState('');
    const [otpToken, setOtpToken] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);


    // Notion State
    const [sourceMode, setSourceMode] = useState<'manual' | 'notion'>('manual');
    const [notionRoles, setNotionRoles] = useState<NotionOption[]>([]);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [fetchingRecipients, setFetchingRecipients] = useState(false);
    const [notionRecipients, setNotionRecipients] = useState<any[]>([]);

    // Save Template State
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [saveType, setSaveType] = useState('General');
    const [savingTemplate, setSavingTemplate] = useState(false);

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
                setOtpToken(data.token);
                alert(`Verification code sent to ${data.otpEmail}`);
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

    const handleVerifyOtp = async () => {
        if (!otpCode || otpCode.length !== 6) {
            alert('Please enter a 6-digit code');
            return;
        }

        setVerifyingOtp(true);
        try {
            const res = await fetch('/api/auth/otp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'admin',
                    otp: otpCode,
                    token: otpToken
                })
            });

            const data = await res.json();

            if (data.valid) {
                setIsAuthenticated(true);
                fetchTemplates();
            } else {
                alert(data.error || 'Invalid code');
                setOtpCode('');
            }
        } catch (error) {
            console.error('Verify error:', error);
            alert('Verification failed, please try again');
        } finally {
            setVerifyingOtp(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            // Fetch Local
            const resLocal = await fetch('/api/templates');
            const dataLocal = await resLocal.json();
            const localTemplates = dataLocal.templates?.map((t: any) => ({ ...t, source: 'local' })) || [];

            // Fetch Notion
            const resNotion = await fetch('/api/notion/templates');
            const dataNotion = await resNotion.json();
            const notionTemplates = dataNotion.templates || [];

            setTemplates([...localTemplates, ...notionTemplates]);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveTemplate = async () => {
        if (!saveName || !subject || !content) return;
        setSavingTemplate(true);
        try {
            const res = await fetch('/api/notion/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: saveName,
                    subject,
                    body: content,
                    type: saveType
                })
            });

            if (res.ok) {
                setShowSaveModal(false);
                setSaveName('');
                fetchTemplates(); // Refresh list
                alert('Template saved to Notion!');
            } else {
                const data = await res.json();
                alert('Error: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to save template');
        } finally {
            setSavingTemplate(false);
        }
    };

    const fetchNotionRoles = async () => {
        setLoadingRoles(true);
        try {
            const res = await fetch('/api/notion/roles');
            const data = await res.json();
            if (data.options) {
                setNotionRoles(data.options);
            } else if (data.error) {
                alert('Notion Error: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to fetch Notion roles');
        } finally {
            setLoadingRoles(false);
        }
    };

    const handleFetchRecipients = async () => {
        if (selectedRoles.length === 0) return;
        setFetchingRecipients(true);
        try {
            const res = await fetch('/api/notion/recipients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roles: selectedRoles })
            });
            const data = await res.json();
            if (data.recipients) {
                setNotionRecipients(data.recipients);
            } else if (data.error) {
                alert('Notion Error: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to fetch recipients');
        } finally {
            setFetchingRecipients(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchTemplates();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (sourceMode === 'notion' && notionRoles.length === 0) {
            fetchNotionRoles();
        }
    }, [sourceMode]);

    const selectTemplate = (t: Template) => {
        setSelectedTemplate(t);
        setSubject(t.subject);
        setContent(t.body);
    };

    const toggleRole = (roleName: string) => {
        setSelectedRoles(prev =>
            prev.includes(roleName)
                ? prev.filter(r => r !== roleName)
                : [...prev, roleName]
        );
    };

    const handleSend = async () => {
        setSending(true);

        let payloadRecipients: any = [];

        if (sourceMode === 'manual') {
            payloadRecipients = recipients.split('\n').filter(r => r.trim());
        } else {
            payloadRecipients = notionRecipients;
        }

        if (payloadRecipients.length === 0) {
            alert('No recipients selected');
            setSending(false);
            return;
        }

        try {
            const res = await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: payloadRecipients,
                    subject,
                    content,
                    password
                })
            });

            if (res.status === 401) {
                alert('Invalid Password');
                setIsAuthenticated(false);
                setSending(false);
                return;
            }

            if (!res.ok) {
                const data = await res.json();
                alert('Error: ' + (data.error || 'Failed to send emails'));
                setSending(false);
                return;
            }

            // Check if response is Server-Sent Events
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('text/event-stream')) {
                // Handle streaming response
                const reader = res.body?.getReader();
                const decoder = new TextDecoder();

                if (!reader) {
                    setSending(false);
                    return;
                }

                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = JSON.parse(line.slice(6));

                            if (data.done) {
                                setSending(false);
                            } else {
                                // Add log entry in real-time
                                const newLog: Log = {
                                    email: data.email,
                                    status: data.status,
                                    error: data.error,
                                    timestamp: new Date(data.timestamp).toLocaleTimeString()
                                };
                                setLogs(prev => [newLog, ...prev]);
                            }
                        }
                    }
                }
            } else {
                // Fallback for non-streaming response (shouldn't happen with new API)
                const data = await res.json();
                if (data.results) {
                    const newLogs = data.results.map((r: any) => ({
                        ...r,
                        timestamp: new Date().toLocaleTimeString()
                    }));
                    setLogs(prev => [...newLogs, ...prev]);
                }
                setSending(false);
            }

        } catch (e) {
            console.error(e);
            alert('Error sending emails');
            setSending(false);
        }
    };

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
                        {otpRequired ? 'Please enter verification code' : 'Enter your admin password to access the dashboard'}
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
                                Verification code sent to: <strong>{otpEmail}</strong>
                            </div>
                            <div className="input-group">
                                <input
                                    type="text"
                                    placeholder="6-digit code"
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

    return (
        <div className="app-container">
            {/* Save Modal */}
            {showSaveModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ background: 'var(--bg-panel)', padding: '24px', width: '400px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h3 style={{ marginBottom: '16px' }}>Save to Notion</h3>
                        <div className="input-group">
                            <label className="input-label">Template Name</label>
                            <input className="text-input" value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="e.g. Monthly Newsletter" />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Type (Config)</label>
                            <input className="text-input" value={saveType} onChange={e => setSaveType(e.target.value)} placeholder="e.g. Marketing" />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowSaveModal(false)}>Cancel</button>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveTemplate} disabled={savingTemplate}>
                                {savingTemplate ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="header">
                <div className="logo">
                    <Mail size={20} />
                    <span>NoreplySender</span>
                </div>
                <button className="btn-ghost" onClick={() => setIsAuthenticated(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LogOut size={16} />
                    Logout
                </button>
            </header>

            <div className="main-layout">
                {/* Sidebar */}
                <div className="sidebar">
                    <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Templates</span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>Local & Notion</span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {templates.map(t => (
                            <div
                                key={t.id || t.filename}
                                className={`nav-item ${selectedTemplate?.id === t.id || selectedTemplate?.filename === t.filename ? 'active' : ''}`}
                                onClick={() => selectTemplate(t)}
                            >
                                {t.source === 'notion' ? <Database size={14} color="var(--primary)" /> : <FileText size={14} />}
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {t.filename.replace('.md', '')}
                                </div>
                                {t.type && <span style={{ fontSize: '0.6rem', background: 'var(--bg-element)', padding: '2px 4px', borderRadius: '4px' }}>{t.type}</span>}
                            </div>
                        ))}
                        {templates.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                No templates found
                            </div>
                        )}
                    </div>
                    <div className="sidebar-header" style={{ borderTop: '1px solid var(--border)' }}>
                        <Settings size={14} style={{ display: 'inline', marginRight: '5px' }} />
                        Configuration
                    </div>
                    <div style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        SMTP Host: {process.env.NEXT_PUBLIC_SMTP_HOST || 'Configured in env'}
                    </div>
                </div>

                {/* Editor */}
                <div className="editor-container">
                    <div className="editor-toolbar" style={{ justifyContent: 'space-between' }}>
                        <input
                            className="subject-input"
                            placeholder="Subject Line..."
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button className="btn-ghost" onClick={() => setShowSaveModal(true)} title="Save to Notion">
                            <Database size={18} />
                        </button>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                        />
                    </div>
                </div>

                {/* Right Panel */}
                <div className="config-panel">
                    <div className="panel-section">
                        <div className="panel-title" style={{ justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={16} />
                                Recipients
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                    className={`btn-ghost ${sourceMode === 'manual' ? 'active' : ''}`}
                                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                    onClick={() => setSourceMode('manual')}
                                >
                                    Manual
                                </button>
                                <button
                                    className={`btn-ghost ${sourceMode === 'notion' ? 'active' : ''}`}
                                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                    onClick={() => setSourceMode('notion')}
                                >
                                    Notion
                                </button>
                            </div>
                        </div>

                        {sourceMode === 'manual' ? (
                            <>
                                <textarea
                                    className="recipients-input"
                                    placeholder="user@example.com&#10;user2@example.com, Name"
                                    value={recipients}
                                    onChange={e => setRecipients(e.target.value)}
                                />
                                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    One recipient per line. Format: email or email, name
                                </div>
                            </>
                        ) : (
                            <div style={{ minHeight: '150px' }}>
                                {loadingRoles ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                        <Loader2 className="animate-spin" />
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                                            Select Roles to Fetch:
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {notionRoles.map(role => (
                                                <div
                                                    key={role.id}
                                                    onClick={() => toggleRole(role.name)}
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer',
                                                        border: `1px solid ${selectedRoles.includes(role.name) ? 'var(--primary)' : 'var(--border)'}`,
                                                        background: selectedRoles.includes(role.name) ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                        color: selectedRoles.includes(role.name) ? 'var(--primary)' : 'var(--text-secondary)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {role.name}
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            className="btn-primary"
                                            style={{ marginTop: '15px' }}
                                            onClick={handleFetchRecipients}
                                            disabled={fetchingRecipients || selectedRoles.length === 0}
                                        >
                                            {fetchingRecipients ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                                            Fetch {selectedRoles.length > 0 ? `for ${selectedRoles.length} roles` : ''}
                                        </button>
                                        {notionRecipients.length > 0 && (
                                            <div style={{ marginTop: '15px' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '10px' }}>
                                                    <CheckCircle2 size={14} />
                                                    Loaded {notionRecipients.length} recipients
                                                </div>
                                                <div style={{
                                                    maxHeight: '200px',
                                                    overflowY: 'auto',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '8px',
                                                    background: 'var(--bg-element)'
                                                }}>
                                                    {notionRecipients.map((recipient, idx) => (
                                                        <div
                                                            key={idx}
                                                            style={{
                                                                padding: '8px 12px',
                                                                borderBottom: idx < notionRecipients.length - 1 ? '1px solid var(--border)' : 'none',
                                                                fontSize: '0.75rem'
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                                                {recipient.name || 'No Name'}
                                                            </div>
                                                            <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                                                                {recipient.email}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="panel-section">
                        <button
                            className="btn-primary"
                            onClick={handleSend}
                            disabled={sending || (!recipients.trim() && notionRecipients.length === 0) || !subject.trim()}
                        >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {sending ? 'Sending...' : 'Send Emails'}
                        </button>
                    </div>

                    <div className="panel-section" style={{ borderBottom: 'none', flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
                        <div className="panel-title" style={{ padding: '24px 24px 0 24px' }}>
                            Activity Log
                        </div>
                        <div className="logs-container" style={{ marginTop: '16px' }}>
                            {logs.length === 0 && (
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '20px' }}>
                                    No activity yet
                                </div>
                            )}
                            {logs.map((log, i) => (
                                <div key={i} className="log-entry">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontWeight: 500 }}>{log.email}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                                    </div>
                                    <div className={`status-badge ${log.status === 'sent' ? 'status-sent' : 'status-failed'}`}>
                                        {log.status === 'sent' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                        <span style={{ marginLeft: '4px' }}>{log.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
