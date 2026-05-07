import { randomUUID } from 'crypto';
import { createTodoList, createTodoItem, type TodoList, type ConversationMessage } from '../Todo';
import type { TodoRepositoryPort } from '../TodoRepositoryPort';
import type { AIGeneratorPort, ListSummary, IntentResult } from '../AIGeneratorPort';
import { setScopes } from 'monocle2ai';

export class TodoService {
  constructor(
    private readonly todoRepository: TodoRepositoryPort,
    private readonly aiGenerator: AIGeneratorPort,
  ) {}

  async generateTodoList(prompt: string): Promise<TodoList> {
    const listId = randomUUID();
    const now = new Date();

    const generatedItems = await setScopes(
      { todo_list_id: listId },
      () => this.aiGenerator.generateTodos(prompt),
    );

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

  async sendMessage(listId: string, userText: string): Promise<TodoList> {
    const list = await this.todoRepository.findTodoListById(listId);
    if (!list) throw new Error('List not found');

    const existingMessages = await this.todoRepository.getMessages(listId);
    const nextPosition = existingMessages.length;

    // Build full conversation history: seed with original prompt + items, then prior follow-ups
    const seedHistory = [
      { role: 'user' as const, content: `Create a todo list for: ${list.prompt}` },
      {
        role: 'assistant' as const,
        content: JSON.stringify({ items: list.items.map((i) => ({ title: i.title, completed: i.completed })) }),
      },
    ];
    const priorMessages = existingMessages.map((m) => ({ role: m.role, content: m.content }));
    const fullHistory = [...seedHistory, ...priorMessages, { role: 'user' as const, content: userText }];

    const generatedItems = await setScopes(
      { todo_list_id: listId },
      () => this.aiGenerator.refineTodos(fullHistory),
    );

    const newItems = generatedItems.map((item, index) =>
      createTodoItem({
        id: randomUUID(),
        listId,
        title: item.title,
        completed: item.completed ?? false,
        position: index,
      }),
    );

    const userMessage: ConversationMessage = {
      id: randomUUID(),
      listId,
      role: 'user',
      content: userText,
      position: nextPosition,
    };

    const assistantMessage: ConversationMessage = {
      id: randomUUID(),
      listId,
      role: 'assistant',
      content: JSON.stringify({ items: generatedItems.map((i) => ({ title: i.title, completed: i.completed ?? false })) }),
      position: nextPosition + 1,
    };

    await this.todoRepository.replaceItems(listId, newItems);
    await this.todoRepository.saveMessages([userMessage, assistantMessage]);

    const updatedMessages = [...existingMessages, userMessage, assistantMessage];

    return {
      ...list,
      items: newItems,
      messages: updatedMessages,
    };
  }

  async completeTodoList(id: string, completed: boolean): Promise<TodoList> {
    await this.todoRepository.completeTodoList(id, completed);
    const list = await this.todoRepository.findTodoListById(id);
    if (!list) throw new Error('List not found');
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

  async detectIntent(prompt: string, lists: ListSummary[]): Promise<IntentResult> {
    return this.aiGenerator.detectIntent(prompt, lists);
  }
}
