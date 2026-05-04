import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { createClickHouseClient, initClickHouseSchema, ClickHouseTodoRepository } from './todo/repository/ClickHouseTodoRepository';
import { OpenAITodoGenerator } from './ai/OpenAITodoGenerator';
import { TodoService } from './todo/service/TodoService';
import { createTodoGrpcHandlers } from './todo/grpc/TodoGrpcHandler';

const PROTO_PATH = path.resolve(__dirname, '../../proto/todo.proto');

async function bootstrap(): Promise<void> {
  const clickhouseClient = await createClickHouseClient();
  await initClickHouseSchema(clickhouseClient);

  const todoRepository = new ClickHouseTodoRepository(clickhouseClient);
  const aiGenerator = new OpenAITodoGenerator();
  const todoService = new TodoService(todoRepository, aiGenerator);
  const handlers = createTodoGrpcHandlers(todoService);

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

  const server = new grpc.Server();
  server.addService(
    (protoDescriptor.todo.TodoService as unknown as { service: grpc.ServiceDefinition }).service,
    handlers,
  );

  const port = process.env.GRPC_PORT ?? '50051';
  const address = `0.0.0.0:${port}`;

  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
    if (err) {
      console.error('Failed to start gRPC server:', err);
      process.exit(1);
    }
    console.log(`App service gRPC server listening on port ${boundPort}`);
  });
}

bootstrap().catch((err: unknown) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
