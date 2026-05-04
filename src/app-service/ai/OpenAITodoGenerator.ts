import OpenAI from 'openai';
import type { AIGeneratorPort, GeneratedTodoItem } from '../todo/AIGeneratorPort';

export class OpenAITodoGenerator implements AIGeneratorPort {
  private readonly client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  async generateTodos(prompt: string): Promise<GeneratedTodoItem[]> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that creates concise, actionable todo lists. ' +
            'Always respond with a JSON object containing a single key "items" whose value is an array of objects, ' +
            'each with a "title" string field. Generate between 3 and 10 items unless the user specifies otherwise.',
        },
        {
          role: 'user',
          content: `Create a todo list for: ${prompt}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response');
    }

    const parsed = JSON.parse(content) as { items?: { title?: string }[] };
    const rawItems = parsed.items ?? [];

    return rawItems
      .filter((item): item is { title: string } => typeof item.title === 'string' && item.title.trim().length > 0)
      .map((item) => ({ title: item.title.trim() }));
  }
}
