import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AddEditNoteDialog from './AddEditNoteDialog';
import * as api from '../network/notes_api';
jest.mock('../network/notes_api');
beforeEach(() => jest.clearAllMocks());
test('requires a title before calling the API', async () => {
  render(<AddEditNoteDialog onDismiss={jest.fn()} onNoteSaved={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByText('Required')).toBeInTheDocument();
  expect(api.createNote).not.toHaveBeenCalled();
});
test('saves a note and reports the server result', async () => {
  const saved = {
    _id: '1',
    title: 'Study',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };
  (api.createNote as jest.Mock).mockResolvedValue(saved);
  const onSaved = jest.fn();
  render(<AddEditNoteDialog onDismiss={jest.fn()} onNoteSaved={onSaved} />);
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Study' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
  expect(api.createNote).toHaveBeenCalledWith({ title: 'Study', text: '' });
});
