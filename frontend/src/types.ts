export interface TodoItem {
  id: string;
  list_id: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface ConversationMessage {
  id: string;
  list_id: string;
  role: string;
  content: string;
  position: number;
}

export interface TodoList {
  id: string;
  prompt: string;
  items: TodoItem[];
  messages: ConversationMessage[];
  completed: boolean;
  created_at: string;
}
