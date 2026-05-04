export interface TodoItem {
  id: string;
  list_id: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface TodoList {
  id: string;
  prompt: string;
  items: TodoItem[];
  created_at: string;
}
