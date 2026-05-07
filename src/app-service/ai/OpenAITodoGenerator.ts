import OpenAI from 'openai';
import type { AIGeneratorPort, GeneratedTodoItem, ChatMessage, ListSummary, IntentResult } from '../todo/AIGeneratorPort';

const SYSTEM_PROMPT =
  'You are a helpful assistant that creates concise, actionable todo lists. ' +
  'Always respond with a JSON object containing a single key "items" whose value is an array of objects, ' +
  'each with a "title" string field and an optional "completed" boolean field (defaults to false). ' +
  'Generate between 3 and 10 items unless the user specifies otherwise. ' +
  'When refining an existing list, replace it entirely with an improved version based on the conversation. ' +
  'Preserve the completed status of items unless the user asks you to change them. ' +
  'You may mark items as completed by setting "completed": true if the user indicates they are done.';

function parseItems(content: string): GeneratedTodoItem[] {
  const parsed = JSON.parse(content) as { items?: { title?: string; completed?: boolean }[] };
  const rawItems = parsed.items ?? [];
  return rawItems
    .filter((item): item is { title: string; completed?: boolean } => typeof item.title === 'string' && item.title.trim().length > 0)
    .map((item) => ({ title: item.title.trim(), completed: item.completed === true }));
}

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
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Create a todo list for: ${prompt}` },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned an empty response');
    return parseItems(content);
  }

  async refineTodos(messages: ChatMessage[]): Promise<GeneratedTodoItem[]> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned an empty response');
    return parseItems(content);
  }

  async detectIntent(prompt: string, lists: ListSummary[]): Promise<IntentResult> {
    const listContext = lists.length
      ? `Existing lists:\n${lists.map((l, i) => `${i + 1}. id="${l.id}" title="${l.prompt}"`).join('\n')}`
      : 'No existing lists.';

    const systemPrompt =
      'You are an intent classifier for a todo list app. ' +
      'Given the user prompt and existing lists, classify the intent and respond with a JSON object with these exact keys:\n' +
      '- "action": one of "create", "refine", "complete", "uncomplete"\n' +
      '- "list_id": the id of the target list (empty string "" for "create")\n' +
      '- "message": the cleaned-up prompt to forward to the action handler\n\n' +
      'Rules:\n' +
      '- "create": user wants a brand new todo list\n' +
      '- "refine": user wants to modify or add to an existing list\n' +
      '- "complete": user wants to mark an existing list as done/finished/completed\n' +
      '- "uncomplete": user wants to reopen/unmark a list as not done\n' +
      '- If no matching list exists for refine/complete/uncomplete, default to "create"\n' +
      '- Match lists by their title/prompt using fuzzy/semantic matching';

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${listContext}\n\nUser prompt: ${prompt}` },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned an empty response');

    const parsed = JSON.parse(content) as { action?: string; list_id?: string; message?: string };
    const action = parsed.action as IntentResult['action'] | undefined;
    const validActions: IntentResult['action'][] = ['create', 'refine', 'complete', 'uncomplete'];

    return {
      action: validActions.includes(action as IntentResult['action']) ? (action as IntentResult['action']) : 'create',
      listId: parsed.list_id ?? '',
      message: parsed.message ?? prompt,
    };
  }
}
