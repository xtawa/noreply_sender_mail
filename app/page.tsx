'use client';

import { useState, useEffect } from 'react';
import { marked } from 'marked';
import {
    Mail,
    Send,
    FileText,
    Settings,
    LogOut,
    CheckCircle2,
    XCircle,
    Loader2,
    LayoutTemplate,
    Users
} from 'lucide-react';

interface Template {
    filename: string;
    subject: string;
    body: string;
}

interface Log {
    email: string;
    status: 'sent' | 'failed';
    error?: string;
    timestamp: string;
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
    const [previewHtml, setPreviewHtml] = useState('');

    const handleLogin = async () => {
        if (!password) return;
        setIsAuthenticated(true);
        fetchTemplates();
    };

    const fetchTemplates = async () => {
        try {
            const res = await fetch('/api/templates');
            const data = await res.json();
            if (data.templates) {
                setTemplates(data.templates);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchTemplates();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const updatePreview = async () => {
            const html = await marked.parse(content);
            setPreviewHtml(html);
        };
        updatePreview();
    }, [content]);

    const selectTemplate = (t: Template) => {
        setSelectedTemplate(t);
        setSubject(t.subject);
        setContent(t.body);
    };

    const handleSend = async () => {
        setSending(true);
        const recipientList = recipients.split('\n').filter(r => r.trim());

        try {
            const res = await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: recipientList,
                    subject,
                    content,
                    password
                })
            });

            const data = await res.json();

            if (res.status === 401) {
                alert('Invalid Password');
                setIsAuthenticated(false);
                setSending(false);
                return;
            }

            if (data.results) {
                const newLogs = data.results.map((r: any) => ({
                    ...r,
                    timestamp: new Date().toLocaleTimeString()
                }));
                setLogs(prev => [...newLogs, ...prev]);
            }

        } catch (e) {
            console.error(e);
            alert('Error sending emails');
        } finally {
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
                        Enter your admin password to access the dashboard
                    </p>
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
                    <button className="btn-primary" onClick={handleLogin}>
                        Access Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
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
                    <div className="sidebar-header">Templates</div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {templates.map(t => (
                            <div
                                key={t.filename}
                                className={`nav-item ${selectedTemplate?.filename === t.filename ? 'active' : ''}`}
                                onClick={() => selectTemplate(t)}
                            >
                                <FileText size={16} />
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {t.filename.replace('.md', '')}
                                </div>
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
                    <div className="editor-toolbar">
                        <input
                            className="subject-input"
                            placeholder="Subject Line..."
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                        />
                    </div>
                    <div className="split-view">
                        <textarea
                            className="markdown-editor"
                            placeholder="# Write your email content in Markdown..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                        />
                        <div className="preview-pane">
                            <div className="prose" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="config-panel">
                    <div className="panel-section">
                        <div className="panel-title">
                            <Users size={16} />
                            Recipients
                        </div>
                        <textarea
                            className="recipients-input"
                            placeholder="user@example.com&#10;user2@example.com, Name"
                            value={recipients}
                            onChange={e => setRecipients(e.target.value)}
                        />
                        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            One recipient per line. Format: email or email, name
                        </div>
                    </div>

                    <div className="panel-section">
                        <button
                            className="btn-primary"
                            onClick={handleSend}
                            disabled={sending || !recipients.trim() || !subject.trim()}
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
