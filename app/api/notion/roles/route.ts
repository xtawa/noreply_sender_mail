import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export async function GET() {
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!process.env.NOTION_API_KEY || !databaseId) {
        return NextResponse.json({ error: 'Notion configuration missing' }, { status: 500 });
    }

    try {
        const response = await notion.databases.retrieve({ database_id: databaseId });

        // Type guard or cast
        const fullResponse = response as DatabaseObjectResponse;
        const properties = fullResponse.properties;

        // Look for 'role' or 'Role' property
        const roleProperty = properties['role'] || properties['Role'];

        if (!roleProperty) {
            return NextResponse.json({ error: 'Property "role" not found in database' }, { status: 404 });
        }

        if (roleProperty.type !== 'multi_select' && roleProperty.type !== 'select') {
            return NextResponse.json({ error: 'Property "role" must be a Select or Multi-select type' }, { status: 400 });
        }

        const options = roleProperty.type === 'multi_select'
            ? roleProperty.multi_select.options
            : roleProperty.select.options;

        return NextResponse.json({ options });
    } catch (error: any) {
        console.error('Notion API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
