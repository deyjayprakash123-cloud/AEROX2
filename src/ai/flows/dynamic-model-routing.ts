'use server';
/**
 * @fileOverview This file implements a Genkit flow for dynamic AI model routing
 * based on user intent. It detects if a user's prompt is a request for image
 * generation or a text-based conversational task and routes the request to the
 * appropriate AI model.
 *
 * - dynamicModelRouting - A function that handles the dynamic model routing process.
 * - DynamicModelRoutingInput - The input type for the dynamicModelRouting function.
 * - DynamicModelRoutingOutput - The return type for the dynamicModelRouting function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Input Schema
const DynamicModelRoutingInputSchema = z.object({
  userMessage: z.string().describe('The user\'s input message.'),
});
export type DynamicModelRoutingInput = z.infer<typeof DynamicModelRoutingInputSchema>;

// Output Schema
const DynamicModelRoutingOutputSchema = z.object({
  textResponse: z.string().optional().describe('The AI\'s textual response.'),
  imageUrl: z.string().optional().describe('URL of the generated image, if applicable.'),
  modelUsed: z.string().describe('The name of the AI model used for the response.'),
});
export type DynamicModelRoutingOutput = z.infer<typeof DynamicModelRoutingOutputSchema>;

// Schema for intent detection prompt input
const ImageIntentDetectionInputSchema = z.object({
  userMessage: z.string().describe('The user\'s input message.'),
});

// Schema for intent detection prompt output
const ImageIntentDetectionOutputSchema = z.object({
  isImageRequest: z.boolean().describe('True if the user is asking to generate an image, false otherwise.'),
  imagePrompt: z.string().optional().describe('The extracted prompt for image generation, if it is an image request.'),
});

// Prompt for detecting if the user wants an image
const imageIntentDetectorPrompt = ai.definePrompt({
  name: 'imageIntentDetectorPrompt',
  input: { schema: ImageIntentDetectionInputSchema },
  output: { schema: ImageIntentDetectionOutputSchema },
  prompt: `You are an AI assistant tasked with detecting user intent.
Given the user\'s message, determine if they are asking to generate an image.

If the user is asking to generate an image:
- Set 'isImageRequest' to true.
- Extract the core subject or description for the image and set it as 'imagePrompt'.
- Examples:
  - "Generate an image of a futuristic city": {"isImageRequest": true, "imagePrompt": "a futuristic city"}
  - "Show me a picture of a cat with a hat": {"isImageRequest": true, "imagePrompt": "a cat with a hat"}
  - "Create a visual of a spaceship landing on Mars": {"isImageRequest": true, "imagePrompt": "a spaceship landing on Mars"}

If the user is NOT asking to generate an image:
- Set 'isImageRequest' to false.
- Leave 'imagePrompt' as undefined.
- Examples:
  - "What is the capital of France?": {"isImageRequest": false}
  - "Tell me a story about a brave knight.": {"isImageRequest": false}
  - "Explain quantum physics.": {"isImageRequest": false}

User message: {{{userMessage}}}`,
});

// Main flow for dynamic model routing
const dynamicModelRoutingFlow = ai.defineFlow(
  {
    name: 'dynamicModelRoutingFlow',
    inputSchema: DynamicModelRoutingInputSchema,
    outputSchema: DynamicModelRoutingOutputSchema,
  },
  async (input) => {
    // Step 1: Detect user intent
    const { output: intentOutput } = await imageIntentDetectorPrompt({
      userMessage: input.userMessage,
    });

    if (!intentOutput) {
      throw new Error('Failed to detect user intent.');
    }

    let textResponse: string | undefined;
    let imageUrl: string | undefined;
    let modelUsed: string;

    if (intentOutput.isImageRequest && intentOutput.imagePrompt) {
      // Step 2a: If it's an image request, use the image generation model
      modelUsed = 'googleai/gemini-1.5-flash-latest';
      const { output } = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: [{ text: intentOutput.imagePrompt }],
        config: {
          responseModalities: ['image', 'text'], // Request both image and text
        },
      });

      if (!output) {
          throw new Error('Image generation failed to produce output.');
      }

      // Find the image part
      const imageMediaPart = output.find(p => p.media?.contentType?.startsWith('image/'));
      if (imageMediaPart?.media?.url) {
        imageUrl = imageMediaPart.media.url;
      }

      // Find the text part
      const textPart = output.find(p => p.text);
      if (textPart?.text) {
        textResponse = textPart.text;
      } else {
          textResponse = 'Image generated successfully!'; // Default text response if model only returns image
      }

    } else {
      // Step 2b: If it's a text request, use the text-focused model
      const textModel = ai.model();
      modelUsed = textModel.name; 
      const { text } = await ai.generate({
        model: textModel,
        prompt: `You are AEROX AI, a highly intelligent and deeply reasoning AI. Provide a comprehensive and insightful answer to the user\'s query.\nUser message: ${input.userMessage}`,
        config: {
            // No direct 'reasoning: { enabled: true }' config, rely on prompt for deep reasoning
        }
      });
      textResponse = text;
    }

    return {
      textResponse,
      imageUrl,
      modelUsed,
    };
  }
);

// Exported wrapper function
export async function dynamicModelRouting(
  input: DynamicModelRoutingInput
): Promise<DynamicModelRoutingOutput> {
  return dynamicModelRoutingFlow(input);
}
