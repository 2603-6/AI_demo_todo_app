import { Router, type Request, type Response, type NextFunction } from 'express';
import type { TodoGrpcClient } from '../grpc/TodoGrpcClient';

export function createTodoRoutes({
  todoGrpcClient,
  router,
}: {
  todoGrpcClient: TodoGrpcClient;
  router: Router;
}): Router {
  router.post('/todo-lists', (req: Request, res: Response, next: NextFunction): void => {
    const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    todoGrpcClient
      .generateTodoList(prompt)
      .then((list) => res.status(201).json(list))
      .catch(next);
  });

  router.get('/todo-lists', (_req: Request, res: Response, next: NextFunction): void => {
    todoGrpcClient
      .listTodoLists()
      .then((response) => res.status(200).json(response.lists))
      .catch(next);
  });

  router.get('/todo-lists/:id', (req: Request, res: Response, next: NextFunction): void => {
    const id = String(req.params['id'] ?? '');

    todoGrpcClient
      .getTodoList(id)
      .then((list) => res.status(200).json(list))
      .catch((err: unknown) => {
        const grpcErr = err as { code?: number; message?: string };
        if (grpcErr.code === 5) {
          res.status(404).json({ error: 'Todo list not found' });
          return;
        }
        next(err);
      });
  });

  router.patch('/todo-items/:id', (req: Request, res: Response, next: NextFunction): void => {
    const id = String(req.params['id'] ?? '');
    const completed = Boolean(req.body?.completed);

    todoGrpcClient
      .updateTodoItem(id, completed)
      .then((result) => res.status(200).json(result))
      .catch(next);
  });

  return router;
}
