import { createClient, type ClickHouseClient } from '@clickhouse/client';
import { createTodoList, createTodoItem, type TodoList, type TodoItem, type ConversationMessage } from '../Todo';
import type { TodoRepositoryPort } from '../TodoRepositoryPort';

interface TodoListRow {
  id: string;
  prompt: string;
  completed: number;
  created_at: string;
}

interface TodoItemRow {
  id: string;
  list_id: string;
  title: string;
  completed: number;
  position: number;
}

interface ConversationMessageRow {
  id: string;
  list_id: string;
  role: string;
  content: string;
  position: number;
}

export async function createClickHouseClient(): Promise<ClickHouseClient> {
  const client = createClient({
    url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
    database: process.env.CLICKHOUSE_DB ?? 'todos',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
  });
  return client;
}

async function drainExec(client: ClickHouseClient, query: string): Promise<void> {
  const result = await client.exec({ query });
  // exec() returns an HTTP response stream that must be drained to release the connection
  result.stream.resume();
  await new Promise<void>((resolve, reject) => {
    result.stream.on('end', resolve);
    result.stream.on('close', resolve);
    result.stream.on('error', reject);
  });
}

export async function initClickHouseSchema(client: ClickHouseClient): Promise<void> {
  const db = process.env.CLICKHOUSE_DB ?? 'todos';

  await drainExec(client, `CREATE DATABASE IF NOT EXISTS ${db}`);

  await drainExec(client, `
    CREATE TABLE IF NOT EXISTS ${db}.todo_lists (
      id         UUID,
      prompt     String,
      completed  UInt8 DEFAULT 0,
      created_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY (created_at, id)
  `);

  // Safe migration for existing tables that predate the completed column
  await drainExec(client, `ALTER TABLE ${db}.todo_lists ADD COLUMN IF NOT EXISTS completed UInt8 DEFAULT 0`);

  await drainExec(client, `
    CREATE TABLE IF NOT EXISTS ${db}.todo_items (
      id         UUID,
      list_id    UUID,
      title      String,
      completed  UInt8 DEFAULT 0,
      position   UInt16,
      created_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY (list_id, position, id)
  `);

  await drainExec(client, `
    CREATE TABLE IF NOT EXISTS ${db}.conversation_messages (
      id         UUID,
      list_id    UUID,
      role       String,
      content    String,
      position   UInt16,
      created_at DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    ORDER BY (list_id, position, id)
  `);
}

export class ClickHouseTodoRepository implements TodoRepositoryPort {
  constructor(private readonly client: ClickHouseClient) {}

  async saveTodoList(list: TodoList): Promise<void> {
    await this.client.insert({
      table: 'todo_lists',
      values: [
        {
          id: list.id,
          prompt: list.prompt,
          created_at: list.createdAt.toISOString().replace('T', ' ').substring(0, 19),
        },
      ],
      format: 'JSONEachRow',
    });
  }

  async saveTodoItems(items: TodoItem[]): Promise<void> {
    if (items.length === 0) return;

    await this.client.insert({
      table: 'todo_items',
      values: items.map((item) => ({
        id: item.id,
        list_id: item.listId,
        title: item.title,
        completed: item.completed ? 1 : 0,
        position: item.position,
      })),
      format: 'JSONEachRow',
    });
  }

  async saveMessages(messages: ConversationMessage[]): Promise<void> {
    if (messages.length === 0) return;

    await this.client.insert({
      table: 'conversation_messages',
      values: messages.map((msg) => ({
        id: msg.id,
        list_id: msg.listId,
        role: msg.role,
        content: msg.content,
        position: msg.position,
      })),
      format: 'JSONEachRow',
    });
  }

  async getMessages(listId: string): Promise<ConversationMessage[]> {
    const result = await this.client.query({
      query: `SELECT id, list_id, role, content, position FROM conversation_messages WHERE list_id = {listId:UUID} ORDER BY position`,
      query_params: { listId },
      format: 'JSONEachRow',
    });

    const rows = await result.json<ConversationMessageRow>();
    return rows.map((row) => ({
      id: row.id,
      listId: row.list_id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      position: row.position,
    }));
  }

  async replaceItems(listId: string, items: TodoItem[]): Promise<void> {
    const db = process.env.CLICKHOUSE_DB ?? 'todos';
    await drainExec(
      this.client,
      `ALTER TABLE ${db}.todo_items DELETE WHERE list_id = '${listId}' SETTINGS mutations_sync = 1`,
    );
    await this.saveTodoItems(items);
  }

  async completeTodoList(id: string, completed: boolean): Promise<void> {
    const db = process.env.CLICKHOUSE_DB ?? 'todos';
    const val = completed ? 1 : 0;
    await drainExec(
      this.client,
      `ALTER TABLE ${db}.todo_lists UPDATE completed = ${val} WHERE id = '${id}' SETTINGS mutations_sync = 1`,
    );
  }

  async findTodoListById(id: string): Promise<TodoList | null> {
    const listResult = await this.client.query({
      query: `SELECT id, prompt, completed, created_at FROM todo_lists WHERE id = {id:UUID} LIMIT 1`,
      query_params: { id },
      format: 'JSONEachRow',
    });

    const rows = await listResult.json<TodoListRow>();
    if (rows.length === 0) return null;

    const row = rows[0];
    const [items, messages] = await Promise.all([
      this.fetchItemsForList(id),
      this.getMessages(id),
    ]);

    return createTodoList({
      id: row.id,
      prompt: row.prompt,
      completed: row.completed === 1,
      items,
      messages,
      createdAt: new Date(row.created_at),
    });
  }

  async findAllTodoLists(): Promise<TodoList[]> {
    const listResult = await this.client.query({
      query: `SELECT id, prompt, completed, created_at FROM todo_lists ORDER BY created_at DESC`,
      format: 'JSONEachRow',
    });

    const rows = await listResult.json<TodoListRow>();

    const lists = await Promise.all(
      rows.map(async (row) => {
        const items = await this.fetchItemsForList(row.id);
        return createTodoList({
          id: row.id,
          prompt: row.prompt,
          completed: row.completed === 1,
          items,
          createdAt: new Date(row.created_at),
        });
      }),
    );

    return lists;
  }

  async updateTodoItemCompletion(id: string, completed: boolean): Promise<void> {
    const db = process.env.CLICKHOUSE_DB ?? 'todos';
    const completedVal = completed ? 1 : 0;
    await drainExec(
      this.client,
      `ALTER TABLE ${db}.todo_items UPDATE completed = ${completedVal} WHERE id = '${id}' SETTINGS mutations_sync = 1`,
    );
  }

  private async fetchItemsForList(listId: string): Promise<TodoItem[]> {
    const itemResult = await this.client.query({
      query: `SELECT id, list_id, title, completed, position FROM todo_items WHERE list_id = {listId:UUID} ORDER BY position`,
      query_params: { listId },
      format: 'JSONEachRow',
    });

    const rows = await itemResult.json<TodoItemRow>();

    return rows.map((row) =>
      createTodoItem({
        id: row.id,
        listId: row.list_id,
        title: row.title,
        completed: row.completed === 1,
        position: row.position,
      }),
    );
  }
}
