export interface TodoItem {
  id: string;
  listId: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface ConversationMessage {
  id: string;
  listId: string;
  role: 'user' | 'assistant';
  content: string;
  position: number;
}

export interface TodoList {
  id: string;
  prompt: string;
  items: TodoItem[];
  messages: ConversationMessage[];
  completed: boolean;
  createdAt: Date;
}

export function createTodoList(params: {
  id: string;
  prompt: string;
  items: TodoItem[];
  createdAt: Date;
  messages?: ConversationMessage[];
  completed?: boolean;
}): TodoList {
  if (!params.prompt.trim()) {
    throw new Error('Prompt must not be empty');
  }
  return {
    id: params.id,
    prompt: params.prompt.trim(),
    items: params.items,
    messages: params.messages ?? [],
    completed: params.completed ?? false,
    createdAt: params.createdAt,
  };
}

export function createTodoItem(params: {
  id: string;
  listId: string;
  title: string;
  completed: boolean;
  position: number;
}): TodoItem {
  if (!params.title.trim()) {
    throw new Error('Todo item title must not be empty');
  }
  return {
    id: params.id,
    listId: params.listId,
    title: params.title.trim(),
    completed: params.completed,
    position: params.position,
  };
}
