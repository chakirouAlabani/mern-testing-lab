import { requiresAuth } from '../../src/middleware/auth';
import { Request, Response, NextFunction } from 'express';
test.each([undefined, 'user-id'])('auth with userId %s', (userId) => {
  const next = jest.fn();
  requiresAuth(
    { session: { userId } } as unknown as Request,
    {} as Response,
    next as NextFunction,
  );
  if (userId) expect(next).toHaveBeenCalledWith();
  else
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ status: 401, message: 'User not authenticated' }),
    );
});
