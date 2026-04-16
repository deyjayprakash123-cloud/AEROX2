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
          "X-OpenRouter-Title": "AEROX AI"
        },
        body: JSON.stringify({
          model: "black-forest-labs/flux.2-klein-4b",
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
      if (data.choices?.[0]?.message?.images && data.choices[0].message.images.length > 0) {
          // Can be multiple images potentially
          return data.choices[0].message.images.map((img: any) => `![Generated Image](${img.image_url.url})`).join('\n\n');
      }

      return data.choices?.[0]?.message?.content || "No image response.";
    } else {
      // ---------------- TEXT INTENT (Elephant Alpha) ----------------
      // Add the user message to the history
      conversationHistory.push({
        role: 'user',
        content: userInput
      });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : 'https://aerox-ai.vercel.app',
          "X-OpenRouter-Title": "AEROX AI"
        },
        body: JSON.stringify({
          "model": "openrouter/elephant-alpha",
          "messages": conversationHistory
        })
      });

      const data = await response.json();
      if (data.error) {
        console.error("OpenRouter Text Error:", data.error);
        return `Neural pathways offline: ${data.error.message}`;
      }

      const assistantMessage = data.choices?.[0]?.message;

      if (!assistantMessage) return "No response.";

      // Preserve the assistant message exactly as it came back to keep reasoning details
      conversationHistory.push({
        role: 'assistant',
        content: assistantMessage.content
      });

      return assistantMessage.content || "No text response.";
    }
  } catch (err) {
    console.error("Network/Connection Error:", err);
    return "Neural pathways offline. Check your internet connection.";
  }
};
