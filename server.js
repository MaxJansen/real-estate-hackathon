require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));


app.post('/api/analyze', async (req, res) => {
    try {
        const { address, apiKey } = req.body;

        if (!address || !apiKey) {
            return res.status(400).json({
                error: 'Missing address or API key',
            });
        }

        // Set up SSE for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const systemPrompt = `You are simulating the data ingestion layer of Sandbox, an AI-native real estate development platform. The user will give you a street address in The Netherlands. Your job is to search for real, verifiable data about this address and its surroundings, then present it as a structured text overview showing what a simulation engine would automatically extract from public sources.

Search across these domains and present findings for each. Use the exact formatting below. Every data point should be real and sourced — do not fabricate numbers. If you cannot find a specific data point, omit it. Write in a mix of Dutch terminology (for official designations like bestemmingsplan, kadaster, etc.) and English explanations.

Format the output exactly like this — plain text, no boxes, no cards, no markdown headers. Just the category name in caps, a source label, and indented data points below each:

BESTEMMINGSPLAN · [Municipality name]
[Bestemming designation, e.g., Wonen, Gemengd]
[Maximum bouwhoogte in meters]
[Maximum bebouwingspercentage]
[Bouwvlak specifications if findable]
[Relevant aanduiding or dubbelbestemming, e.g., Waarde - Archeologie]

KADASTER · Kadastrale gegevens
[Kadastrale gemeente + sectie + perceel nummer]
[Perceeloppervlakte in m²]
[Current use classification]

BODEM · Bodemloket / RIVM
[Bodemkwaliteit status: verdacht / niet verdacht / onderzocht]
[Any known sanering or onderzoeksplicht]

GELUID · Geluidskaart [Municipality]
[Lden value if available]
[Geluidscategorie or noise zone designation]
[Whether geluidwering measures are indicated]

OVERSTROMINGSRISICO · Klimaateffectatlas / Risicokaart
[Flood risk zone designation]
[Waterdiepte at location for various scenarios if available]
[Proximity to primary waterkering]

INFRASTRUCTUUR · Netbeheerder + gemeente
[Electricity: netbeheerder name + capacity indication if findable]
[Gas: current status (many Dutch neighborhoods moving to gasvrij)]
[Warmtenet: available or planned?]
[Riolering: connection status]
[Glasvezel: available?]

MARKTDATA · [Submarket/neighborhood name]
[Average huurprijs per m² in this area]
[Average koopprijs per m² for nieuwbouw]
[WOZ-waarde trend if findable]
[Leegstand indication for the area]

CONCURRENTIE · Nieuwbouwprojecten in de buurt
[List 2-3 nearby new development projects with: name, number of woningen, status (in aanbouw / in verkoop / vergund), distance]
[If none found, state that]

DEMOGRAFIE · CBS / AlleCijfers
[Wijknaam + gemeentenaam]
[Aantal inwoners in the wijk]
[Population growth trend]
[Dominant household type (eenpersoons, gezinnen, etc.)]
[Gemiddeld besteedbaar inkomen if findable]

BEREIKBAARHEID · 9292 / Google Maps
[Nearest NS station + walking/cycling distance]
[Nearest bus/tram stop + distance]
[Travel time to nearest major city center by OV]
[PTAL or general accessibility rating if available]

BOUWKOSTEN · Indicatie
[Current nieuwbouw construction cost per m² BVO for this region (use BDB or Arcadis index if findable)]
[Grondprijs indicatie for the municipality if available]
[Recent grondtransacties in the area if findable]

GEMEENTE · Omgevingsvisie + Woonvisie
[Key policy direction for this area (verdichting encouraged? woningbouwambitie?)]
[Woningbouwtarget for the municipality]
[Any area-specific ontwikkelvisie or structuurvisie relevant to this address]

Present all findings as continuous text under each category. No bullet points, no dashes — just line breaks between data points. Keep it dense and factual. This is meant to look like a data feed that a machine assembled, not a report a human wrote.

At the very end, add one line: [X] data sources queried · [Y] data points extracted · Simulation ready

Where X and Y are the actual counts.`;

        const userMessage = `Address: ${address}`;

        const postData = JSON.stringify({
            model: 'claude-opus-4-6',
            max_tokens: 4096,
            stream: true,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
        });

        // Flush headers immediately so the browser starts receiving SSE
        res.flushHeaders();

        const anthropicReq = https.request({
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Length': Buffer.byteLength(postData),
            },
        }, (anthropicRes) => {
            let buffer = '';

            anthropicRes.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                            res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
                        }
                    } catch (_) {}
                }
            });

            anthropicRes.on('end', () => {
                res.write('data: [DONE]\n\n');
                res.end();
            });
        });

        anthropicReq.on('error', (err) => {
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
        });

        anthropicReq.write(postData);
        anthropicReq.end();
    } catch (error) {
        console.error('Error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message || 'Internal server error' })}\n\n`);
        res.end();
    }
});

// Local mirror of the Netlify function — used during local dev
app.post('/.netlify/functions/claude', async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.API_KEY;

    if (!prompt || !apiKey) {
        return res.status(400).json({ error: { message: 'Missing prompt or API_KEY env var' } });
    }

    const postData = JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
    });

    const anthropicReq = https.request({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(postData),
        },
    }, (anthropicRes) => {
        let body = '';
        anthropicRes.on('data', chunk => body += chunk);
        anthropicRes.on('end', () => res.json(JSON.parse(body)));
    });

    anthropicReq.on('error', err => res.status(500).json({ error: { message: err.message } }));
    anthropicReq.write(postData);
    anthropicReq.end();
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n✅ Real Estate Platform running on http://localhost:${PORT}`);
    console.log(`\nOpen your browser and go to: http://localhost:${PORT}`);
    console.log(`\nPress Ctrl+C to stop the server\n`);
});
