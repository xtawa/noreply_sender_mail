import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export async function GET() {
  const templatesDir = path.join(process.cwd(), 'templete');
  try {
    if (!fs.existsSync(templatesDir)) {
      return NextResponse.json({ templates: [] });
    }
    const files = fs.readdirSync(templatesDir);
    const templates = files.filter(file => file.endsWith('.md')).map(file => {
      const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
      const { data, content: body } = matter(content);
      return {
        filename: file,
        subject: data.subject || '',
        body,
      };
    });
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error reading templates:', error);
    return NextResponse.json({ error: 'Failed to read templates' }, { status: 500 });
  }
}
