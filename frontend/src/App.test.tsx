import { render, screen } from '@testing-library/react';
import NotesPageLoggedOutView from './components/NotesPageLoggedOutView';
test('explains how to access notes', () => {
  render(<NotesPageLoggedOutView />);
  expect(screen.getByText(/login/i)).toBeInTheDocument();
});
