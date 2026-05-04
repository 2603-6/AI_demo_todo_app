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

interface TodoListResponse {
  id: string;
  prompt: string;
  items: TodoItemMessage[];
  created_at: string;
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
  };
}

export type TodoGrpcHandlers = ReturnType<typeof createTodoGrpcHandlers>;
