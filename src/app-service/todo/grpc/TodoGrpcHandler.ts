import type { ServerUnaryCall, sendUnaryData, ServiceDefinition } from '@grpc/grpc-js';
import { status as GrpcStatus } from '@grpc/grpc-js';
import type { TodoService } from '../service/TodoService';
import type { TodoList } from '../Todo';

interface GenerateRequest {
  prompt: string;
}

interface GetTodoListRequest {
  id: string;
}

interface ListTodoListsRequest {}

interface SendMessageRequest {
  list_id: string;
  message: string;
}

interface ListSummaryMessage {
  id: string;
  prompt: string;
}

interface DetectIntentRequest {
  prompt: string;
  lists: ListSummaryMessage[];
}

interface DetectIntentResponse {
  action: string;
  list_id: string;
  message: string;
}

interface CompleteTodoListRequest {
  id: string;
  completed: boolean;
}

interface UpdateTodoItemRequest {
  id: string;
  completed: boolean;
}

interface UpdateTodoItemResponse {
  id: string;
  completed: boolean;
}

interface TodoItemMessage {
  id: string;
  list_id: string;
  title: string;
  completed: boolean;
  position: number;
}

interface ConversationMessageMessage {
  id: string;
  list_id: string;
  role: string;
  content: string;
  position: number;
}

interface TodoListResponse {
  id: string;
  prompt: string;
  items: TodoItemMessage[];
  created_at: string;
  messages: ConversationMessageMessage[];
  completed: boolean;
}

interface TodoListsResponse {
  lists: TodoListResponse[];
}

function toTodoListResponse(list: TodoList): TodoListResponse {
  return {
    id: list.id,
    prompt: list.prompt,
    items: list.items.map((item) => ({
      id: item.id,
      list_id: item.listId,
      title: item.title,
      completed: item.completed,
      position: item.position,
    })),
    created_at: list.createdAt.toISOString(),
    messages: list.messages.map((msg) => ({
      id: msg.id,
      list_id: msg.listId,
      role: msg.role,
      content: msg.content,
      position: msg.position,
    })),
    completed: list.completed,
  };
}

export function createTodoGrpcHandlers(todoService: TodoService) {
  return {
    GenerateTodoList(
      call: ServerUnaryCall<GenerateRequest, TodoListResponse>,
      callback: sendUnaryData<TodoListResponse>,
    ): void {
      todoService
        .generateTodoList(call.request.prompt)
        .then((list) => callback(null, toTodoListResponse(list)))
        .catch((err: unknown) => {
          callback({
            code: GrpcStatus.INTERNAL,
            message: err instanceof Error ? err.message : 'Internal error',
          });
        });
    },

    GetTodoList(
      call: ServerUnaryCall<GetTodoListRequest, TodoListResponse>,
      callback: sendUnaryData<TodoListResponse>,
    ): void {
      todoService
        .getTodoList(call.request.id)
        .then((list) => {
          if (!list) {
            return callback({ code: GrpcStatus.NOT_FOUND, message: 'Todo list not found' });
          }
          callback(null, toTodoListResponse(list));
        })
        .catch((err: unknown) => {
          callback({
            code: GrpcStatus.INTERNAL,
            message: err instanceof Error ? err.message : 'Internal error',
          });
        });
    },

    ListTodoLists(
      _call: ServerUnaryCall<ListTodoListsRequest, TodoListsResponse>,
      callback: sendUnaryData<TodoListsResponse>,
    ): void {
      todoService
        .listTodoLists()
        .then((lists) => callback(null, { lists: lists.map(toTodoListResponse) }))
        .catch((err: unknown) => {
          callback({
            code: GrpcStatus.INTERNAL,
            message: err instanceof Error ? err.message : 'Internal error',
          });
        });
    },

    UpdateTodoItem(
      call: ServerUnaryCall<UpdateTodoItemRequest, UpdateTodoItemResponse>,
      callback: sendUnaryData<UpdateTodoItemResponse>,
    ): void {
      todoService
        .updateTodoItem(call.request.id, call.request.completed)
        .then(() => callback(null, { id: call.request.id, completed: call.request.completed }))
        .catch((err: unknown) => {
          callback({
            code: GrpcStatus.INTERNAL,
            message: err instanceof Error ? err.message : 'Internal error',
          });
        });
    },

    SendMessage(
      call: ServerUnaryCall<SendMessageRequest, TodoListResponse>,
      callback: sendUnaryData<TodoListResponse>,
    ): void {
      todoService
        .sendMessage(call.request.list_id, call.request.message)
        .then((list) => callback(null, toTodoListResponse(list)))
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Internal error';
          const code = message === 'List not found' ? GrpcStatus.NOT_FOUND : GrpcStatus.INTERNAL;
          callback({ code, message });
        });
    },

    CompleteTodoList(
      call: ServerUnaryCall<CompleteTodoListRequest, TodoListResponse>,
      callback: sendUnaryData<TodoListResponse>,
    ): void {
      todoService
        .completeTodoList(call.request.id, call.request.completed)
        .then((list) => callback(null, toTodoListResponse(list)))
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Internal error';
          const code = message === 'List not found' ? GrpcStatus.NOT_FOUND : GrpcStatus.INTERNAL;
          callback({ code, message });
        });
    },

    DetectIntent(
      call: ServerUnaryCall<DetectIntentRequest, DetectIntentResponse>,
      callback: sendUnaryData<DetectIntentResponse>,
    ): void {
      todoService
        .detectIntent(call.request.prompt, call.request.lists)
        .then((result) =>
          callback(null, { action: result.action, list_id: result.listId, message: result.message }),
        )
        .catch((err: unknown) => {
          callback({
            code: GrpcStatus.INTERNAL,
            message: err instanceof Error ? err.message : 'Internal error',
          });
        });
    },
  };
}

export type TodoGrpcHandlers = ReturnType<typeof createTodoGrpcHandlers>;
