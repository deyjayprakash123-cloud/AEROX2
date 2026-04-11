// src/chat/personality.ts

// 1. Define the response structure
interface OpenRouterChoice {
  message: {
    content: string;
    role: string;
  };
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
  error?: {
    message: string; // OpenRouter sometimes nests the error message
  };
}

/**
 * AEROX AI Service
 * Handles routing between Llama 3 (Text) and Riverflow V2 (Image)
 */
export const askAerox = async (userInput: string): Promise<string> => {
  const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!API_KEY) return "Neural link error: API Key missing in .env";

  const isImage = /generate|image|draw/i.test(userInput);
  const model = isImage ? "google/riverflow-v2-fast" : "meta-llama/llama-3-8b-instruct";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: userInput }],
      }),
    });

    const data = await response.json();

    // This checks if OpenRouter returned an API error (like 402 No Credits or 401 Invalid Key)
    if (data.error) {
      console.error("OpenRouter Error Details:", data.error);
      return `Neural pathways offline: ${data.error.message}`;
    }

    return data.choices[0].message.content;
  } catch (err) {
    console.error("Network/Connection Error:", err);
    return "Neural pathways offline. Check your internet connection.";
  }
};
