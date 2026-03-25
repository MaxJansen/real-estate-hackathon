// Netlify Function: Handles real estate data analysis requests
// This replaces the Express server for Netlify deployment

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { address, apiKey } = JSON.parse(event.body);

        if (!address || !apiKey) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing address or API key' })
            };
        }

        const systemPrompt = `You are a real estate data analyst specializing in Dutch and German real estate markets.
When given an address, research and provide comprehensive real estate data including:
- Kadaster registration (Netherlands) or land registry information
- WOZ-waarde (Waardering Onroerende Zaken) for Dutch properties
- Property surface area and plot size
- Zoning rights and building permits
- Environmental considerations and restrictions
- Legal status and any liens or mortgages if publicly available
- Recent market trends for the area

Format the response clearly with headers and bullet points for easy reading.`;

        const userMessage = `Please research comprehensive real estate data for this address: ${address}

Provide information about Kadaster/land registry data, property values, zoning, surface area, environmental factors, and legal considerations.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-opus-4-6',
                max_tokens: 2048,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: userMessage
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: errorData.error?.message || 'API request failed'
                })
            };
        }

        const data = await response.json();

        if (!data.content || !data.content[0]) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Unexpected API response format' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                result: data.content[0].text
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message || 'Internal server error'
            })
        };
    }
};
