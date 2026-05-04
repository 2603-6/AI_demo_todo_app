import type { TodoList } from './types';

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
