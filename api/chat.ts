import type { VercelRequest, VercelResponse } from '@vercel/node';

const PERSONALITIES = [
  { name: 'Logical Analyst', prompt: 'You are a Logical Analyst. Analyze the input logically and objectively.' },
  { name: 'Creative Thinker', prompt: 'You are a Creative Thinker. Approach the topic with imagination and innovative ideas.' },
  { name: 'Critic', prompt: 'You are a Critic. Provide a critical review, finding potential flaws and counterarguments.' },
  { name: 'Optimist', prompt: 'You are an Optimist. Highlight the positive aspects, opportunities, and benefits.' },
  { name: 'Scientist', prompt: 'You are a Scientist. Examine the prompt with empirical evidence, scientific principles, and hypotheses.' }
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { message, numPersonalities = 1 } = body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY || '';
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY is not configured' });
    }

    const isImageIntent = /image|picture|draw|generate|paint|art|create a picture/i.test(message);
    const modelUrl = "https://openrouter.ai/api/v1/chat/completions";
    
    // Fixed: Removed incorrect `Object.values` which causes TypeScript type-loss on the array
    const count = parseInt(String(numPersonalities), 10) || 1;
    const selectedPersonalities = PERSONALITIES.slice(0, Math.max(1, Math.min(count, 5)));
    
    const promises = selectedPersonalities.map(async (persona) => {
      let payload: any = {
        messages: [
          { role: 'system', content: persona.prompt },
          { role: 'user', content: message }
        ]
      };

      if (isImageIntent) {
        payload.model = "google/gemini-3.1-flash-image-preview";
        payload.modalities = ["image", "text"];
      } else {
        payload.model = "openai/gpt-5.4-nano";
        payload.reasoning = { enabled: true };
      }

      const response = await fetch(modelUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aerox-ai.vercel.app',
          'X-Title': 'AEROX AI'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Status ${response.status}`, errText);
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        personality: persona.name,
        reply: data.choices?.[0]?.message?.content || "No response."
      };
    });

    const responses = await Promise.all(promises);

    let finalAnswer = "";
    if (responses.length === 1) {
      finalAnswer = responses[0].reply;
    } else {
      finalAnswer = responses.map(r => `**[${r.personality}]**:\n${r.reply}`).join('\n\n---\n\n');
    }

    return res.status(200).json({ 
      intent: isImageIntent ? 'image' : 'text',
      personalities: responses.map(r => r.personality),
      answer: finalAnswer 
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
