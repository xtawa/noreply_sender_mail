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
        // Workaround: notion.databases.retrieve might be returning a simplified object or hitting an issue with the client version.
        // Using notion.request to ensure we get the full database object.
        const response = await notion.request({
            path: `databases/${databaseId}`,
            method: 'get',
        });

        // Type guard or cast
        const fullResponse = response as any;

        if (!fullResponse.properties) {
            console.error('Database response missing properties:', JSON.stringify(fullResponse));
            return NextResponse.json({
                error: 'Invalid Notion response: missing properties',
                debug: fullResponse
            }, { status: 500 });
        }

        const properties = fullResponse.properties;

        // Look for 'role', 'Role', or 'Roles' property
        const roleProperty = properties['role'] || properties['Role'] || properties['Roles'];

        if (!roleProperty) {
            const availableKeys = Object.keys(properties).join(', ');
            console.error(`Property "role" not found. Available properties: ${availableKeys}`);

            let hint = '';
            if (availableKeys.includes('Type') && availableKeys.includes('Subject')) {
                hint = ' (It looks like you might be using the Template Database ID instead of the Recipient Database ID)';
            }

            return NextResponse.json({
                error: `Property "role" not found in database. Available properties: ${availableKeys}.${hint}`
            }, { status: 404 });
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
