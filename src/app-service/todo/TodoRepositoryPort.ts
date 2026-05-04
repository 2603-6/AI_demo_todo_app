import type { TodoList, TodoItem } from './Todo';

export interface TodoRepositoryPort {
  saveTodoList(list: TodoList): Promise<void>;
  saveTodoItems(items: TodoItem[]): Promise<void>;
  findTodoListById(id: string): Promise<TodoList | null>;
  findAllTodoLists(): Promise<TodoList[]>;
  updateTodoItemCompletion(id: string, completed: boolean): Promise<void>;
}
