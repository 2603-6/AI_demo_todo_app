import { NextFunction, Request, Response, Router } from 'express';
import { CreateUserInput, UserService } from '../service/UserService';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseCreateUserPayload(payload: unknown): CreateUserInput {
  if (!isRecord(payload)) {
    throw new Error('Invalid payload');
  }

  const { name, email } = payload;

  if (typeof name !== 'string' || typeof email !== 'string') {
    throw new Error('Invalid payload');
  }

  return { name, email };
}

export interface UserRouteProps {
  userService: UserService;
  router: Router;
}

export function createUserRoutes({ userService, router }: UserRouteProps): Router {
  router.get('/users', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.listUsers();
      res.status(200).json({ data: users });
    } catch (error: unknown) {
      next(error);
    }
  });

  router.post('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = parseCreateUserPayload(req.body);
      const user = await userService.createUser(payload);
      res.status(201).json({ data: user });
    } catch (error: unknown) {
      next(error);
    }
  });

  return router;
}
