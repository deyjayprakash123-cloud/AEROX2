'use server';
/**
 * @fileOverview This file implements a Genkit flow for combining reasoning from multiple AI personalities.
 *
 * - combinePersonalityReasoning - A function that processes user input through multiple AI personalities in parallel
 *   and synthesizes their responses into a single, comprehensive answer.
 * - CombinePersonalityReasoningInput - The input type for the combinePersonalityReasoning function.
 * - CombinePersonalityReasoningOutput - The return type for the combinePersonalityReasoning function.
 */

import { ai } from '@/ai/genkit';
import { z, type MediaPart } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai'; // Explicitly import googleAI for model access

// 1. Define Input/Output Schemas
const PersonalitySchema = z.object({
  role: z.string().describe('The distinct role or persona for this AI.'),
  systemPrompt: z.string().describe('The system prompt defining the AI personality.'),
});

const CombinePersonalityReasoningInputSchema = z.object({
  message: z.string().describe('The user\'s message or query.'),
  personalities: z.array(PersonalitySchema).describe('An array of AI personalities to consult.'),
});
export type CombinePersonalityReasoningInput = z.infer<typeof CombinePersonalityReasoningInputSchema>;

const CombinePersonalityReasoningOutputSchema = z.object({
  combinedResponse: z.string().describe('The synthesized and comprehensive response from all personalities.'),
  images: z.array(z.object({
    url: z.string().describe('Data URI of the generated image.'),
    contentType: z.string().describe('MIME type of the image.'),
  }).passthrough()).optional().describe('Optional array of generated images.'),
});
export type CombinePersonalityReasoningOutput = z.infer<typeof CombinePersonalityReasoningOutputSchema>;

// Helper to detect image request intent
function isImageGenerationRequest(message: string): boolean {
  const lowerCaseMessage = message.toLowerCase();
  return lowerCaseMessage.includes('generate image') ||
         lowerCaseMessage.includes('create a picture') ||
         lowerCaseMessage.includes('show me an image of') ||
         lowerCaseMessage.includes('draw a');
}

// 2. Implement the Genkit Flow
const combinePersonalityReasoningFlow = ai.defineFlow(
  {
    name: 'combinePersonalityReasoningFlow',
    inputSchema: CombinePersonalityReasoningInputSchema,
    outputSchema: CombinePersonalityReasoningOutputSchema,
  },
  async ({ message, personalities }) => {
    const isImageRequest = isImageGenerationRequest(message);

    let modelToUse: Parameters<typeof ai.generate>[0]['model'];
    let responseModalities: ('text' | 'image')[] | undefined;

    if (isImageRequest) {
      // Use a multimodal Google model for image generation.
      // 'google/gemini-3.1-flash-image-preview' is not a standard Genkit googleAI model identifier,
      // so 'gemini-1.5-flash-latest' is used as a robust multimodal alternative via googleAI plugin.
      modelToUse = googleAI.model('gemini-1.5-flash-latest');
      responseModalities = ['text', 'image'];
    } else {
      // Use the default text model configured in genkit.ts for text-only reasoning.
      // This defaults to 'googleai/gemini-2.5-flash' based on src/ai/genkit.ts.
      // 'openai/gpt-5.4-nano' cannot be used as only the googleAI plugin is configured.
      modelToUse = ai.model(); 
      responseModalities = undefined; // Default for text-only
    }

    const personalityResponsesPromises = personalities.map(async (personality) => {
      const promptParts: (string | MediaPart)[] = [
        { text: personality.systemPrompt }, 
        { text: message }
      ];

      const response = await ai.generate({
        model: modelToUse,
        prompt: promptParts,
        config: {
          responseModalities: responseModalities,
          // The 'reasoning: { enabled: true }' is not a standard Genkit config parameter
          // for all models. Rely on prompt engineering and model capabilities for reasoning.
        },
      });

      // Extract text and potentially image from response using 1.x syntax
      const textResponse = response.text; 
      const images = response.media || []; 

      return {
        role: personality.role,
        text: textResponse,
        images: images,
      };
    });

    const individualResponses = await Promise.all(personalityResponsesPromises);

    const allImages: MediaPart[] = individualResponses.flatMap(res => res.images || []);

    // Construct the prompt for the combiner AI to synthesize responses
    let combinerPrompt = `The user asked: "${message}"\n\n`;
    combinerPrompt += `I consulted the following AI personalities, and here are their individual responses:\n\n`;

    individualResponses.forEach((res) => {
      combinerPrompt += `--- Personality ${res.role} ---\n`;
      combinerPrompt += `${res.text}\n\n`;
    });

    combinerPrompt += `Please combine these individual responses into a single, comprehensive, coherent, and well-structured answer. Synthesize the different perspectives and avoid redundancy. If there are any images generated, make sure to mention them in the combined response as "an image has been generated showing...".\n\n`;
    combinerPrompt += `Your final combined answer should be presented directly.\n`;

    const combinedResult = await ai.generate({
      model: ai.model(), // Use the default model for combining responses
      prompt: combinerPrompt,
    });

    return {
      combinedResponse: combinedResult.text, // Use 1.x syntax
      images: allImages.length > 0 ? allImages.map(img => ({url: img.url!, contentType: img.contentType!})) : undefined,
    };
  }
);

// 3. Export the wrapper function
export async function combinePersonalityReasoning(input: CombinePersonalityReasoningInput): Promise<CombinePersonalityReasoningOutput> {
  return combinePersonalityReasoningFlow(input);
}
