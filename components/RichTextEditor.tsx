'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
}

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link', 'image'
];

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            />
        </div>
    );
}
