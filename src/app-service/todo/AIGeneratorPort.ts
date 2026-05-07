export interface GeneratedTodoItem {
  title: string;
  completed?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ListSummary {
  id: string;
  prompt: string;
}

export interface IntentResult {
  action: 'create' | 'refine' | 'complete' | 'uncomplete';
  listId: string;
  message: string;
}

export interface AIGeneratorPort {
  generateTodos(prompt: string): Promise<GeneratedTodoItem[]>;
  refineTodos(messages: ChatMessage[]): Promise<GeneratedTodoItem[]>;
  detectIntent(prompt: string, lists: ListSummary[]): Promise<IntentResult>;
}
