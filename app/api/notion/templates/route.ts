import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { PageObjectResponse, PartialPageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

const notion = new Client({
    auth: process.env.NOTION_API_KEY,
    notionVersion: '2022-06-28'
});
const databaseId = process.env.NOTION_TEMPLATE_DATABASE_ID;

export async function GET() {
    if (!process.env.NOTION_API_KEY || !databaseId) {
        return NextResponse.json({ templates: [] }); // Return empty if not configured
    }

    try {
        // Use notion.request to ensure compatibility
        const response = await notion.request({
            path: `databases/${databaseId}/query`,
            method: 'post',
            body: {},
        }) as any;

        const templates = response.results.map((page: PageObjectResponse | PartialPageObjectResponse) => {
            if (!('properties' in page)) return null;
            const props = (page as PageObjectResponse).properties;

            const getName = (p: any) => {
                if (p.type === 'title') return p.title.map((t: any) => t.plain_text).join('');
                return '';
            };

            const getText = (p: any) => {
                if (p.type === 'rich_text') {
                    const html = p.rich_text.map((t: any) => {
                        let text = t.text.content;

                        if (t.annotations.bold) text = `<strong>${text}</strong>`;
                        if (t.annotations.italic) text = `<em>${text}</em>`;
                        if (t.annotations.underline) text = `<u>${text}</u>`;
                        if (t.annotations.strikethrough) text = `<strike>${text}</strike>`;
                        if (t.annotations.code) text = `<code>${text}</code>`;
                        if (t.annotations.color && t.annotations.color !== 'default') {
                            text = `<span style="color: ${t.annotations.color}">${text}</span>`;
                        }
                        if (t.href) text = `<a href="${t.href}">${text}</a>`;

                        return text;
                    }).join('');

                    // Convert newlines to paragraphs for better Quill compatibility
                    return html.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>').join('');
                }
                return '';
            };

            const getSelect = (p: any) => {
                if (p.type === 'select') return p.select?.name || '';
                return '';
            };

            // Assume properties: Name, Subject, Body, Type
            let name = '';
            let subject = '';
            let body = '';
            let type = '';

            for (const [key, prop] of Object.entries(props)) {
                const lowerKey = key.toLowerCase();
                if (prop.type === 'title') name = getName(prop);
                else if (lowerKey === 'subject') subject = getText(prop);
                else if (lowerKey === 'body' || lowerKey === 'content') body = getText(prop);
                else if (lowerKey === 'type') type = getSelect(prop);
            }

            return {
                id: page.id,
                filename: name, // Map Name to filename for frontend compatibility
                subject,
                body,
                type,
                source: 'notion'
            };
        }).filter((t: any) => t && t.filename);

        return NextResponse.json({ templates });
    } catch (error: any) {
        console.error('Notion Template Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!process.env.NOTION_API_KEY || !databaseId) {
        return NextResponse.json({ error: 'Notion Template DB not configured' }, { status: 500 });
    }

    try {
        const { name, subject, body, type } = await request.json();

        // Strip HTML tags for Notion storage to keep it clean
        const plainBody = body
            .replace(/<\/p><p>/g, '\n')
            .replace(/<p>/g, '')
            .replace(/<\/p>/g, '')
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<[^>]+>/g, '');

        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                Name: {
                    title: [
                        {
                            text: {
                                content: name,
                            },
                        },
                    ],
                },
                Subject: {
                    rich_text: [
                        {
                            text: {
                                content: subject,
                            },
                        },
                    ],
                },
                Body: {
                    rich_text: [
                        {
                            text: {
                                content: plainBody,
                            },
                        },
                    ],
                },
                Type: {
                    select: {
                        name: type || 'General',
                    },
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Notion Template Save Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
