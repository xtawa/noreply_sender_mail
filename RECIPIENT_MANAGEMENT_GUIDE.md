# 收件人管理功能实现指南

## 需要添加的代码

### 1. 在状态变量部分(第61行后)添加:

```typescript
const [notionRecipients, setNotionRecipients] = useState<any[]>([]);
const [newRecipientEmail, setNewRecipientEmail] = useState('');
const [newRecipientName, setNewRecipientName] = useState('');
```

### 2. 在toggleRole函数后(约第200行)添加两个新函数:

```typescript
const removeRecipient = (index: number) => {
    setNotionRecipients(prev => prev.filter((_, i) => i !== index));
};

const addManualRecipient = () => {
    if (!newRecipientEmail.trim()) return;
    const newRecipient = {
        email: newRecipientEmail.trim(),
        name: newRecipientName.trim() || 'Manual Entry'
    };
    setNotionRecipients(prev => [...prev, newRecipient]);
    setNewRecipientEmail('');
    setNewRecipientName('');
};
```

### 3. 修改收件人列表显示部分(约第545-560行):

将:
```tsx
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
```

替换为:
```tsx
<div
    key={idx}
    style={{
        padding: '8px 12px',
        borderBottom: idx < notionRecipients.length - 1 ? '1px solid var(--border)' : 'none',
        fontSize: '0.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }}
>
    <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
            {recipient.name || 'No Name'}
        </div>
        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
            {recipient.email}
        </div>
    </div>
    <button
        onClick={() => removeRecipient(idx)}
        style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--error)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.6,
            transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
        title="Remove recipient"
    >
        <XCircle size={16} />
    </button>
</div>
```

### 4. 在收件人列表容器结束标签后(约第562行),在 `</div></div>)}` 之前添加:

```tsx
<div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-panel)', borderRadius: '8px', border: '1px solid var(--border)' }}>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
        Add Recipient Manually:
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input
            className="text-input"
            placeholder="Email address"
            value={newRecipientEmail}
            onChange={e => setNewRecipientEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addManualRecipient()}
            style={{ fontSize: '0.75rem', padding: '6px 8px' }}
        />
        <input
            className="text-input"
            placeholder="Name (optional)"
            value={newRecipientName}
            onChange={e => setNewRecipientName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addManualRecipient()}
            style={{ fontSize: '0.75rem', padding: '6px 8px' }}
        />
        <button
            className="btn-ghost"
            onClick={addManualRecipient}
            disabled={!newRecipientEmail.trim()}
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
        >
            + Add
        </button>
    </div>
</div>
```

## 实现效果

完成后,用户将能够:
1. 点击每个收件人旁边的 X 按钮删除该收件人
2. 在列表下方的输入框中手动添加新的收件人(邮箱和姓名)
3. 按 Enter 键或点击"+ Add"按钮添加收件人
