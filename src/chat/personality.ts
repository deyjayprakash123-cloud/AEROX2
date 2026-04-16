// src/chat/personality.ts

// 1. Define the response structure
interface OpenRouterChoice {
  message: {
    content: string;
    role: string;
    reasoning_details?: any; // To store grok reasoning
  };
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
  error?: {
    message: string; // OpenRouter sometimes nests the error message
  };
}

// Keep a simple conversation history to preserve reasoning across turns
let conversationHistory: any[] = [];

/**
 * AEROX AI Service
 * Handles routing between Grok (Text) and Flux (Image)
 */
const PERSONALITIES = [
  { name: 'Logical Analyst', prompt: 'You are a Logical Analyst. Analyze the input logically and objectively.' },
  { name: 'Creative Thinker', prompt: 'You are a Creative Thinker. Approach the topic with imagination and innovative ideas.' },
  { name: 'Critic', prompt: 'You are a Critic. Provide a critical review, finding potential flaws and counterarguments.' },
  { name: 'Optimist', prompt: 'You are an Optimist. Highlight the positive aspects, opportunities, and benefits.' },
  { name: 'Scientist', prompt: 'You are a Scientist. Examine the prompt with empirical evidence, scientific principles, and hypotheses.' }
];

export const askAerox = async (userInput: string, numPersonalities: number = 1): Promise<string> => {
  // Support both Vite (local) and Vercel/Node (production) env variables
  const API_KEY = "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";

  if (!API_KEY) return "Neural link error: API Key missing in environment variables.";

  const isImage = /generate|image|draw|picture|create/i.test(userInput);
  
  try {
    if (isImage) {
      // ---------------- IMAGE INTENT (GPT-5 Image) ----------------
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : 'https://aerox-ai.vercel.app',
          "X-OpenRouter-Title": "AEROX AI"
        },
        body: JSON.stringify({
          model: "openai/gpt-5-image",
          messages: [{ role: "user", content: userInput }],
          modalities: ["image", "text"]
        }),
      });

      const data = await response.json();
      if (data.error) {
        console.error("OpenRouter Image Error:", data.error);
        return `Neural pathways offline: ${data.error.message}`;
      }

      // Check if it returned an image URL directly or a markdown string
      if (data.choices?.[0]?.message?.images && data.choices[0].message.images.length > 0) {
          // Can be multiple images potentially
          return data.choices[0].message.images.map((img: any) => `![Generated Image](${img.image_url.url})`).join('\n\n');
      }

      return data.choices?.[0]?.message?.content || "No image response.";
    } else {
      // ---------------- TEXT INTENT (Elephant Alpha) ----------------
      const count = Math.max(1, Math.min(numPersonalities, 5));
      const selectedPersona = PERSONALITIES[count - 1];

      // Add the user message to the history
      conversationHistory.push({
        role: 'user',
        content: userInput
      });

      const personaMessages = [
        { role: 'system', content: selectedPersona.prompt },
        ...conversationHistory
      ];

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : 'https://aerox-ai.vercel.app',
          "X-OpenRouter-Title": "AEROX AI"
        },
        body: JSON.stringify({
          "model": "google/gemma-4-26b-a4b-it:free",
          "messages": personaMessages,
          "reasoning": {"enabled": true}
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const assistantMessage = data.choices?.[0]?.message;
      const replyContent = assistantMessage?.content || "No response.";
      
      const finalAnswer = `**[${selectedPersona.name}]**:\n${replyContent}`;

      // Preserve the combined assistant message along with reasoning_details for future context chaining
      conversationHistory.push({
        role: 'assistant',
        content: finalAnswer,
        reasoning_details: assistantMessage?.reasoning_details
      });

      return finalAnswer;
    }
  } catch (err) {
    console.error("Network/Connection Error:", err);
    return "Neural pathways offline. Check your internet connection.";
  }
};
