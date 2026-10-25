import { getNotes } from '../../src/controllers/notes';
import NoteModel from '../../src/models/note';
import { Request, Response } from 'express';
afterEach(() => jest.restoreAllMocks());
test('forwards a database failure to error middleware', async () => {
  const error = new Error('database unavailable');
  const exec = jest.fn().mockRejectedValue(error);
  jest.spyOn(NoteModel, 'find').mockReturnValue({ exec } as any);
  const next = jest.fn();
  const res = { status: jest.fn(), json: jest.fn() };
  await getNotes(
    { session: { userId: 'owner' } } as unknown as Request,
    res as unknown as Response,
    next,
  );
  expect(NoteModel.find).toHaveBeenCalledWith({ userId: 'owner' });
  expect(next).toHaveBeenCalledWith(error);
  expect(res.json).not.toHaveBeenCalled();
});
