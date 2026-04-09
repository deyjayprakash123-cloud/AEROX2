import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { prompt } = body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OpenRouter API is not configured"
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aerox-ai.vercel.app',
        'X-Title': 'AEROX AI'
      },
      body: JSON.stringify({
        model: 'sourceful/riverflow-v2-fast',
        messages: [
          {
            "role": "user",
            "content": prompt
          }
        ],
        modalities: ['image']
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Status ${response.status}`, errText);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    let imageUrls: string[] = [];

    if (result.choices) {
      const message = result.choices[0].message;
      if (message.images) {
        message.images.forEach((image: any) => {
          imageUrls.push(image.image_url.url);
        });
      } else if (message.content) {
        // Fallback if the model returns a markdown image string in content instead of structured
        imageUrls.push(message.content);
      }
    }

    return res.status(200).json({ 
      images: imageUrls
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
