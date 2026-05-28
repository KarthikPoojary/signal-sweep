import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';

export type LLMProvider = 'groq' | 'anthropic';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const ANTHROPIC_MODEL = 'claude-opus-4-7';

export function detectProvider(key: string): LLMProvider {
  if (key.startsWith('sk-ant-')) return 'anthropic';
  return 'groq'; // gsk_... and anything else defaults to Groq
}

export async function llmCall({
  key,
  system,
  user,
  maxTokens = 2048,
}: {
  key: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const provider = detectProvider(key);

  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    });
    return (msg.content[0] as { type: string; text: string }).text;
  }

  // Groq (OpenAI-compatible)
  const client = new Groq({ apiKey: key });
  const msg = await client.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return msg.choices[0]?.message?.content ?? '';
}
