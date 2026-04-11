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
  // Use a guard to ensure the key exists
  const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!API_KEY) {
    throw new Error("AEROX_CONFIG_ERROR: VITE_OPENROUTER_API_KEY is missing from .env");
  }

  // Detect intent
  const isImageRequest = /generate|image|draw|picture|create/i.test(userInput);
  
  // Set specific models based on your setup
  const selectedModel = isImageRequest 
    ? "google/riverflow-v2-fast" 
    : "meta-llama/llama-3-8b-instruct";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, // Required by some OpenRouter models
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "user", content: userInput }],
      }),
    });

    const data: OpenRouterResponse = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Unknown error from OpenRouter");
    }

    if (!data.choices || data.choices.length === 0) {
      throw new Error("OpenRouter API returned no choices");
    }

    return data.choices[0].message.content;
  } catch (error: any) {
    console.error("Aerox API Error:", error);
    return `Sorry, I encountered an error connecting to the Neural Link: ${error.message}`;
  }
};
