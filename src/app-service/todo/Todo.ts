export interface TodoItem {
  id: string;
  listId: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface TodoList {
  id: string;
  prompt: string;
  items: TodoItem[];
  createdAt: Date;
}

export function createTodoList(params: {
  id: string;
  prompt: string;
  items: TodoItem[];
  createdAt: Date;
}): TodoList {
  if (!params.prompt.trim()) {
    throw new Error('Prompt must not be empty');
  }
  return {
    id: params.id,
    prompt: params.prompt.trim(),
    items: params.items,
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
