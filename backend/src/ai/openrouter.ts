import { config } from '../config';

// ─── Types matching OpenAI-compatible API (which OpenRouter implements) ────────

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export type ChatCompletionResponse = {
  id: string;
  model: string;
  choices: {
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

// ─── Core OpenRouter client ───────────────────────────────────────────────────

export async function openrouterChat(params: {
  model: string;
  messages: Message[];
  tools?: ToolDefinition[];
  temperature?: number;
  max_tokens?: number;
}): Promise<ChatCompletionResponse> {
  const res = await fetch(`${config.openrouter.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openrouter.apiKey}`,
      'HTTP-Referer': 'https://afribit.africa',
      'X-Title': 'Afribit SATS',
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      tools: params.tools,
      temperature: params.temperature ?? 0.3,
      max_tokens: params.max_tokens ?? 1024,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new OpenRouterError(`OpenRouter ${res.status}: ${text}`, res.status);
  }

  return (await res.json()) as ChatCompletionResponse;
}

export class OpenRouterError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'OpenRouterError';
  }
}
