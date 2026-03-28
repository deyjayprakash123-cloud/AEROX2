// src/chat/personality.ts
export async function sendCognitiveRequest(message: string, numPersonalities: number) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, numPersonalities })
  });
  return await response.json();
}
