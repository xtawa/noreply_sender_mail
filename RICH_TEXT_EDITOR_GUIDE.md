# 富文本编辑器集成指南

## 已完成的工作

1. ✅ 安装了 `react-quill` 富文本编辑器库
2. ✅ 创建了 `components/RichTextEditor.tsx` 组件
3. ✅ 修改了 `app/api/send/route.ts`,移除了Markdown解析,直接使用HTML

## 需要在 app/page.tsx 中进行的修改

### 1. 导入富文本编辑器组件(在文件顶部)

```typescript
import RichTextEditor from '../components/RichTextEditor';
import 'react-quill/dist/quill.snow.css';
```

### 2. 移除 marked 相关代码

删除这些行:
```typescript
import { marked } from 'marked';
const [previewHtml, setPreviewHtml] = useState('');

useEffect(() => {
    const updatePreview = async () => {
        const html = await marked.parse(content);
        setPreviewHtml(html);
    };
    updatePreview();
}, [content]);
```

### 3. 替换编辑器部分(约第375-385行)

将:
```tsx
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
```

替换为:
```tsx
<div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}>
    <RichTextEditor
        value={content}
        onChange={setContent}
    />
</div>
```

## 富文本编辑器功能

集成后,用户可以使用以下功能:
- ✨ 标题(H1, H2, H3)
- **粗体**, *斜体*, <u>下划线</u>, ~~删除线~~
- 🎨 文字颜色和背景色
- 📝 有序列表和无序列表
- 🔗 插入链接
- 🖼️ 插入图片
- ↔️ 文本对齐
- 🧹 清除格式

## 样式调整(可选)

如果需要调整富文本编辑器的样式,可以在 `app/globals.css` 中添加:

```css
/* Rich Text Editor Customization */
.ql-container {
    font-size: 14px;
    font-family: inherit;
}

.ql-editor {
    min-height: 300px;
}

.ql-toolbar {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    background-color: var(--bg-element);
}

.ql-container {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
}
```

## 注意事项

1. 富文本编辑器生成的是HTML,不再是Markdown
2. 邮件发送时会直接使用HTML内容
3. 预览功能已内置在富文本编辑器中,不需要单独的预览面板
4. 所有格式化功能都通过工具栏按钮完成
