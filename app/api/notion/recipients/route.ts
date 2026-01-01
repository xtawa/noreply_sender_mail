import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export async function POST(request: Request) {
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!process.env.NOTION_API_KEY || !databaseId) {
        return NextResponse.json({ error: 'Notion configuration missing' }, { status: 500 });
    }

    try {
        const { roles } = await request.json();

        if (!roles || !Array.isArray(roles) || roles.length === 0) {
            return NextResponse.json({ recipients: [] });
        }

        // First, retrieve the database to find the correct 'role' property name
        const dbResponse = await notion.databases.retrieve({ database_id: databaseId }) as any;
        const properties = dbResponse.properties;
        const rolePropertyName = properties['role'] ? 'role' : (properties['Role'] ? 'Role' : (properties['Roles'] ? 'Roles' : null));

        if (!rolePropertyName) {
            return NextResponse.json({ error: 'Property "role" (or Role, Roles) not found in database' }, { status: 404 });
        }

        const filter = {
            or: roles.map((role: string) => ({
                property: rolePropertyName,
                multi_select: {
                    contains: role,
                },
            })),
        };

        // Workaround: notion.databases.query seems to be missing in the installed version/types
        const response = await notion.request({
            path: `databases/${databaseId}/query`,
            method: 'post',
            body: {
                filter: filter,
            },
        }) as any;

        const recipients = response.results.map((page: any) => {
            if (!('properties' in page)) return null;

            const props = (page as PageObjectResponse).properties;
            const recipientData: any = {};

            // Helper to extract text from property
            const extractValue = (prop: any) => {
                switch (prop.type) {
                    case 'title':
                        return prop.title.map((t: any) => t.plain_text).join('');
                    case 'rich_text':
                        return prop.rich_text.map((t: any) => t.plain_text).join('');
                    case 'email':
                        return prop.email;
                    case 'phone_number':
                        return prop.phone_number;
                    case 'number':
                        return prop.number;
                    case 'url':
                        return prop.url;
                    case 'select':
                        return prop.select?.name;
                    case 'multi_select':
                        return prop.multi_select.map((o: any) => o.name).join(', ');
                    case 'date':
                        return prop.date?.start;
                    case 'checkbox':
                        return prop.checkbox;
                    case 'formula':
                        if (prop.formula.type === 'string') return prop.formula.string;
                        if (prop.formula.type === 'number') return prop.formula.number;
                        return null;
                    default:
                        return null;
                }
            };

            // Iterate over all properties
            for (const [key, prop] of Object.entries(props)) {
                const value = extractValue(prop);
                if (value !== null && value !== undefined) {
                    // Normalize keys to lowercase for easier template matching {{Name}} -> {{name}}
                    // But keep original too if needed? Let's just use lowercase for the template keys.
                    recipientData[key.toLowerCase()] = value;

                    // Also keep 'name' specifically if it's the title
                    if (prop.type === 'title') {
                        recipientData['name'] = value;
                    }
                }
            }

            // Ensure we have an email
            if (!recipientData.email && recipientData.mail) {
                recipientData.email = recipientData.mail;
            }

            return recipientData.email ? recipientData : null;
        }).filter((r: any) => r !== null);

        return NextResponse.json({ recipients });
    } catch (error: any) {
        console.error('Notion Query Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
