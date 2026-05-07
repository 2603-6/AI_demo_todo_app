import type { TodoList } from './types';

export interface IntentResponse {
  action: 'create' | 'refine' | 'complete' | 'uncomplete';
  list_id: string;
  message: string;
}

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function generateTodoList(prompt: string): Promise<TodoList> {
  const res = await fetch(`${BASE}/api/todo-lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<TodoList>;
}

export async function listTodoLists(): Promise<TodoList[]> {
  const res = await fetch(`${BASE}/api/todo-lists`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<TodoList[]>;
}

export async function getTodoList(id: string): Promise<TodoList> {
  const res = await fetch(`${BASE}/api/todo-lists/${id}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<TodoList>;
}

export async function updateTodoItem(id: string, completed: boolean): Promise<void> {
  const res = await fetch(`${BASE}/api/todo-items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
}

export async function completeTodoList(id: string, completed: boolean): Promise<TodoList> {
  const res = await fetch(`${BASE}/api/todo-lists/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<TodoList>;
}

export async function detectIntent(
  prompt: string,
  lists: { id: string; prompt: string }[],
): Promise<IntentResponse> {
  const res = await fetch(`${BASE}/api/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, lists }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<IntentResponse>;
}

export async function sendMessage(listId: string, message: string): Promise<TodoList> {
  const res = await fetch(`${BASE}/api/todo-lists/${listId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<TodoList>;
}
