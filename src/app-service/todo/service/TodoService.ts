import { randomUUID } from 'crypto';
import { createTodoList, createTodoItem, type TodoList } from '../Todo';
import type { TodoRepositoryPort } from '../TodoRepositoryPort';
import type { AIGeneratorPort } from '../AIGeneratorPort';

export class TodoService {
  constructor(
    private readonly todoRepository: TodoRepositoryPort,
    private readonly aiGenerator: AIGeneratorPort,
  ) {}

  async generateTodoList(prompt: string): Promise<TodoList> {
    const generatedItems = await this.aiGenerator.generateTodos(prompt);

    const listId = randomUUID();
    const now = new Date();

    const items = generatedItems.map((item, index) =>
      createTodoItem({
        id: randomUUID(),
        listId,
        title: item.title,
        completed: false,
        position: index,
      }),
    );

    const list = createTodoList({
      id: listId,
      prompt,
      items,
      createdAt: now,
    });

    await this.todoRepository.saveTodoList(list);
    await this.todoRepository.saveTodoItems(items);

    return list;
  }

  async getTodoList(id: string): Promise<TodoList | null> {
    return this.todoRepository.findTodoListById(id);
  }

  async listTodoLists(): Promise<TodoList[]> {
    return this.todoRepository.findAllTodoLists();
  }

  async updateTodoItem(id: string, completed: boolean): Promise<void> {
    await this.todoRepository.updateTodoItemCompletion(id, completed);
  }
}
