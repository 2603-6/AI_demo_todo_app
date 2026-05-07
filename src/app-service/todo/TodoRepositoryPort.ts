import type { TodoList, TodoItem, ConversationMessage } from './Todo';

export interface TodoRepositoryPort {
  saveTodoList(list: TodoList): Promise<void>;
  saveTodoItems(items: TodoItem[]): Promise<void>;
  findTodoListById(id: string): Promise<TodoList | null>;
  findAllTodoLists(): Promise<TodoList[]>;
  updateTodoItemCompletion(id: string, completed: boolean): Promise<void>;
  saveMessages(messages: ConversationMessage[]): Promise<void>;
  getMessages(listId: string): Promise<ConversationMessage[]>;
  replaceItems(listId: string, items: TodoItem[]): Promise<void>;
  completeTodoList(id: string, completed: boolean): Promise<void>;
}
