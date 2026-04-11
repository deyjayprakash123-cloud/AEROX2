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
export const askAerox = async (userInput: string): Promise<string> => {
  // Support both Vite (local) and Vercel/Node (production) env variables
  const API_KEY = import.meta.env?.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;

  if (!API_KEY) return "Neural link error: API Key missing in environment variables.";

  const isImage = /generate|image|draw|picture|create/i.test(userInput);
  
  try {
    if (isImage) {
      // ---------------- IMAGE INTENT (Flux) ----------------
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : 'https://aerox-ai.vercel.app',
        },
        body: JSON.stringify({
          model: "black-forest-labs/flux-1-schnell",
          messages: [{ role: "user", content: userInput }],
          modalities: ["image"]
        }),
      });

      const data = await response.json();
      if (data.error) {
        console.error("OpenRouter Image Error:", data.error);
        return `Neural pathways offline: ${data.error.message}`;
      }

      // Check if it returned an image URL directly or a markdown string
      if (data.choices[0].message.images && data.choices[0].message.images.length > 0) {
          return `![AI Image](${data.choices[0].message.images[0].image_url.url})`;
      }

      return data.choices[0].message.content;
    } else {
      // ---------------- TEXT INTENT (Grok 4.20 with Reasoning) ----------------
      // Add the user message to the history
      conversationHistory.push({
        role: 'user',
        content: userInput
      });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "x-ai/grok-4.20",
          "messages": conversationHistory,
          "reasoning": {"enabled": true}
        })
      });

      const data = await response.json();
      if (data.error) {
        console.error("OpenRouter Text Error:", data.error);
        return `Neural pathways offline: ${data.error.message}`;
      }

      const assistantMessage = data.choices[0].message;

      // Preserve the assistant message exactly as it came back to keep reasoning details
      conversationHistory.push({
        role: 'assistant',
        content: assistantMessage.content,
        reasoning_details: assistantMessage.reasoning_details
      });

      return assistantMessage.content;
    }
  } catch (err) {
    console.error("Network/Connection Error:", err);
    return "Neural pathways offline. Check your internet connection.";
  }
};
