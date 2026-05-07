import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const PROTO_PATH = path.resolve(__dirname, '../../../proto/todo.proto');

export interface TodoItemMessage {
  id: string;
  list_id: string;
  title: string;
  completed: boolean;
  position: number;
}

export interface ConversationMessageMessage {
  id: string;
  list_id: string;
  role: string;
  content: string;
  position: number;
}

export interface TodoListResponse {
  id: string;
  prompt: string;
  items: TodoItemMessage[];
  created_at: string;
  messages: ConversationMessageMessage[];
  completed: boolean;
}

export interface TodoListsResponse {
  lists: TodoListResponse[];
}

export interface UpdateTodoItemResponse {
  id: string;
  completed: boolean;
}

export interface DetectIntentResponse {
  action: string;
  list_id: string;
  message: string;
}

type GrpcCallback<T> = (err: grpc.ServiceError | null, response: T) => void;

interface TodoServiceClient extends grpc.Client {
  GenerateTodoList(request: { prompt: string }, callback: GrpcCallback<TodoListResponse>): grpc.ClientUnaryCall;
  GetTodoList(request: { id: string }, callback: GrpcCallback<TodoListResponse>): grpc.ClientUnaryCall;
  ListTodoLists(request: Record<string, never>, callback: GrpcCallback<TodoListsResponse>): grpc.ClientUnaryCall;
  UpdateTodoItem(request: { id: string; completed: boolean }, callback: GrpcCallback<UpdateTodoItemResponse>): grpc.ClientUnaryCall;
  SendMessage(request: { list_id: string; message: string }, callback: GrpcCallback<TodoListResponse>): grpc.ClientUnaryCall;
  CompleteTodoList(request: { id: string; completed: boolean }, callback: GrpcCallback<TodoListResponse>): grpc.ClientUnaryCall;
  DetectIntent(request: { prompt: string; lists: { id: string; prompt: string }[] }, callback: GrpcCallback<DetectIntentResponse>): grpc.ClientUnaryCall;
}

function loadClient(): TodoServiceClient {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as {
    todo: { TodoService: grpc.ServiceClientConstructor };
  };

  const appServiceUrl = process.env.APP_SERVICE_URL ?? 'localhost:50051';

  return new protoDescriptor.todo.TodoService(
    appServiceUrl,
    grpc.credentials.createInsecure(),
    {
      'grpc.service_config': JSON.stringify({
        methodConfig: [{ name: [{}], waitForReady: true }],
      }),
    },
  ) as unknown as TodoServiceClient;
}

export class TodoGrpcClient {
  private readonly client: TodoServiceClient;

  constructor() {
    this.client = loadClient();
  }

  generateTodoList(prompt: string): Promise<TodoListResponse> {
    return new Promise((resolve, reject) => {
      this.client.GenerateTodoList({ prompt }, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
  }

  getTodoList(id: string): Promise<TodoListResponse> {
    return new Promise((resolve, reject) => {
      this.client.GetTodoList({ id }, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
  }

  listTodoLists(): Promise<TodoListsResponse> {
    return new Promise((resolve, reject) => {
      this.client.ListTodoLists({}, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
  }

  updateTodoItem(id: string, completed: boolean): Promise<UpdateTodoItemResponse> {
    return new Promise((resolve, reject) => {
      this.client.UpdateTodoItem({ id, completed }, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
  }

  sendMessage(listId: string, message: string): Promise<TodoListResponse> {
    return new Promise((resolve, reject) => {
      this.client.SendMessage({ list_id: listId, message }, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
  }

  completeTodoList(id: string, completed: boolean): Promise<TodoListResponse> {
    return new Promise((resolve, reject) => {
      this.client.CompleteTodoList({ id, completed }, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
  }

  detectIntent(prompt: string, lists: { id: string; prompt: string }[]): Promise<DetectIntentResponse> {
    return new Promise((resolve, reject) => {
      this.client.DetectIntent({ prompt, lists }, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
  }
}
