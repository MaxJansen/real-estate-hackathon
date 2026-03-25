const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const API_URL = 'https://api.anthropic.com/v1/messages';

app.post('/api/analyze', async (req, res) => {
    try {
        const { address, apiKey } = req.body;

        if (!address || !apiKey) {
            return res.status(400).json({
                error: 'Missing address or API key',
            });
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

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-opus-4-6',
                max_tokens: 2048,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: userMessage,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return res.status(response.status).json({
                error: errorData.error?.message || 'API request failed',
            });
        }

        const data = await response.json();

        if (!data.content || !data.content[0]) {
            return res.status(500).json({
                error: 'Unexpected API response format',
            });
        }

        res.json({
            result: data.content[0].text,
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: error.message || 'Internal server error',
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n✅ Real Estate Platform running on http://localhost:${PORT}`);
    console.log(`\nOpen your browser and go to: http://localhost:${PORT}`);
    console.log(`\nPress Ctrl+C to stop the server\n`);
});
