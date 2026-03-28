import { config } from 'dotenv';
config();

import '@/ai/flows/image-generation-flow.ts';
import '@/ai/flows/multi-personality-chat.ts';
import '@/ai/flows/dynamic-model-routing.ts';
import '@/ai/flows/combine-personality-reasoning.ts';