import * as api from './notes_api';
import { UnauthorizedError, ConflictError } from '../errors/http_errors';
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => {
  global.fetch = originalFetch;
});
test('createNote sends JSON and returns the saved note', async () => {
  const saved = { _id: '1', title: 'Study' };
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => saved,
  });
  await expect(api.createNote({ title: 'Study' })).resolves.toEqual(saved);
  expect(global.fetch).toHaveBeenCalledWith('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Study' }),
  });
});
test.each([
  [401, UnauthorizedError],
  [409, ConflictError],
  [500, Error],
])('maps HTTP %s', async (status, Type) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ error: 'Rejected' }),
  });
  await expect(api.fetchNotes()).rejects.toBeInstanceOf(Type);
});
test('delete accepts a response with no JSON body', async () => {
  const json = jest.fn();
  (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 204, json });
  await api.deleteNote('1');
  expect(json).not.toHaveBeenCalled();
  expect(global.fetch).toHaveBeenCalledWith('/api/notes/1', { method: 'DELETE' });
});
