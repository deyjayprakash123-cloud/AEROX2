'use server';
/**
 * @fileOverview A Genkit flow for multi-personality AI chat interactions.
 *
 * - multiPersonalityChat - A function that handles chat requests with dynamic AI personalities.
 * - MultiPersonalityChatInput - The input type for the multiPersonalityChat function.
 * - MultiPersonalityChatOutput - The return type for the multiPersonalityChat function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const MultiPersonalityChatInputSchema = z.object({
  message: z.string().describe('The user\'s chat message.'),
  numPersonalities: z.number().min(1).max(5).describe('The number of AI personalities to engage (1-5).'),
  image: z.string().optional().describe(
    "An optional image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type MultiPersonalityChatInput = z.infer<typeof MultiPersonalityChatInputSchema>;

const MultiPersonalityChatOutputSchema = z.object({
  combinedResponse: z.string().describe('The synthesized text response from the AI personalities.'),
  imageUrl: z.string().optional().describe('Optional URL of a generated image.'),
});
export type MultiPersonalityChatOutput = z.infer<typeof MultiPersonalityChatOutputSchema>;

// Define personality types and their system prompts
const personalityDefinitions = [
  {
    name: 'Logical Analyst',
    prompt: 'You are a logical and analytical AI. Break down complex problems, identify key facts, and provide clear, structured reasoning. Focus on objectivity and evidence.',
  },
  {
    name: 'Creative Thinker',
    prompt: 'You are a creative and imaginative AI. Brainstorm novel ideas, think outside the box, and suggest innovative solutions. Encourage divergent thinking.',
  },
  {
    name: 'Critic',
    prompt: 'You are a critical and skeptical AI. Identify potential flaws, weaknesses, and biases in arguments or ideas. Provide constructive feedback and challenge assumptions.',
  },
  {
    name: 'Optimist',
    prompt: 'You are an optimistic and encouraging AI. Focus on positive aspects, potential opportunities, and solutions. Offer supportive and hopeful perspectives.',
  },
  {
    name: 'Scientist',
    prompt: 'You are a scientific AI, focused on empirical data, research, and testable hypotheses. Explain concepts with scientific accuracy and refer to established knowledge.',
  },
];

// Simple intent detection function
function detectImageRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return lowerMessage.includes('generate image') ||
         lowerMessage.includes('create image') ||
         lowerMessage.includes('show image') ||
         lowerMessage.includes('draw image') ||
         lowerMessage.includes('picture of') ||
         lowerMessage.includes('image of');
}

export async function multiPersonalityChat(input: MultiPersonalityChatInput): Promise<MultiPersonalityChatOutput> {
  return multiPersonalityChatFlow(input);
}

const multiPersonalityChatFlow = ai.defineFlow(
  {
    name: 'multiPersonalityChatFlow',
    inputSchema: MultiPersonalityChatInputSchema,
    outputSchema: MultiPersonalityChatOutputSchema,
  },
  async (input) => {
    const { message, numPersonalities, image } = input;
    let generatedImageUrl: string | undefined;
    let modelResponseTexts: { personality: string; text: string }[] = [];

    const isImageRequest = detectImageRequest(message);

    if (isImageRequest) {
      // Use the specified image generation model
      const imagePrompt = image ? [{ media: { url: image } }, { text: message }] : message;
      const { text, media } = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: imagePrompt,
        config: {
          responseModalities: ['image', 'text'],
        },
      });

      if (media?.url) {
        generatedImageUrl = media.url;
      }
      
      return {
        combinedResponse: text ?? 'Image generated successfully!',
        imageUrl: generatedImageUrl,
      };
    } else {
      // Select personalities based on the requested number
      const selectedPersonalities = personalityDefinitions.slice(0, numPersonalities);

      const personalityPromises = selectedPersonalities.map(async (personality) => {
        try {
          const promptParts: (string | { media: { url: string } })[] = [
            { text: personality.prompt + '\n\n' + message },
          ];

          if (image) {
            promptParts.unshift({ media: { url: image } });
          }

          // Use the default text generation model
          const { text } = await ai.generate({
            model: ai.model(),
            prompt: promptParts,
            config: {
              temperature: 0.7,
            },
          });
          return { personality: personality.name, text: text! };
        } catch (error) {
          console.error(`Error with ${personality.name} personality:`, error);
          return null; // Return null for failed personalities
        }
      });

      const results = await Promise.all(personalityPromises);

      // Filter out null results (failed personalities)
      const successfulResults = results.filter(r => r !== null) as { personality: string; text: string }[];

      if (successfulResults.length === 0) {
        throw new Error('All AI personalities failed to respond.');
      }

      modelResponseTexts = successfulResults;

      // Combine responses
      const combinedText = modelResponseTexts
        .map((res) => `**${res.personality}:**\n${res.text}`)
        .join('\n\n---\n\n');

      // If there's an image input but no image generation request, the image is for context.
      // In this case, no new image URL is generated.
      return {
        combinedResponse: combinedText,
        imageUrl: undefined,
      };
    }
  }
);
