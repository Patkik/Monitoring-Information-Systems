import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import UpcomingSessionsTable from '../UpcomingSessionsTable';
import SessionHistoryTable from '../SessionHistoryTable';
import { useMenteeSessions } from '../../../shared/hooks/useMenteeSessions';
import { useCancelSession } from '../../../shared/hooks/useSessionLifecycle';
import { useToast } from '../../../hooks/useToast';
import type { MenteeSession } from '../../../shared/services/sessionsService';

jest.mock('../../../shared/hooks/useMenteeSessions', () => {
  const actual = jest.requireActual('../../../shared/hooks/useMenteeSessions');
  return {
    __esModule: true,
    ...actual,
    useMenteeSessions: jest.fn(),
  };
});

jest.mock('../../../shared/hooks/useSessionLifecycle', () => ({
  useCancelSession: jest.fn(),
}));

jest.mock('../../../hooks/useToast', () => ({
  useToast: jest.fn(),
}));

const mockUseMenteeSessions = useMenteeSessions as jest.Mock;
const mockUseCancelSession = useCancelSession as jest.Mock;
const mockUseToast = useToast as jest.Mock;

const createSession = (overrides: Partial<MenteeSession> = {}): MenteeSession => ({
  id: 'session-1',
  subject: 'Career Planning',
  mentor: {
    id: 'mentor-1',
    name: 'Jordan Lee',
    email: 'mentor@example.com',
  },
  date: '2030-05-10T09:00:00.000Z',
  durationMinutes: 60,
  attended: false,
  tasksCompleted: 0,
  notes: null,
  ...overrides,
});

describe('Mentee session lifecycle tables', () => {
  let showToast: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    showToast = jest.fn();
    mockUseToast.mockReturnValue({ showToast });
    mockUseCancelSession.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
  });

  it('requires a reason before confirming cancellation', () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    mockUseCancelSession.mockReturnValue({ mutateAsync, isLoading: false });
    mockUseMenteeSessions.mockReturnValue({
      data: [createSession({ id: 'pending-1', status: 'pending', subject: 'UI Coaching' })],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<UpcomingSessionsTable />);

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(screen.getByLabelText(/reason for cancellation/i)).toBeRequired();
    fireEvent.click(screen.getByRole('button', { name: /confirm cancellation/i }));

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('filters cancelled/completed from upcoming and submits cancel reason', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    mockUseCancelSession.mockReturnValue({ mutateAsync, isLoading: false });
    mockUseMenteeSessions.mockReturnValue({
      data: [
        createSession({ id: 'pending-2', status: 'pending', subject: 'Data Structures' }),
        createSession({ id: 'attended-pending-1', status: 'pending', attended: true, subject: 'Attended Pending Session' }),
        createSession({ id: 'cancelled-1', status: 'cancelled', subject: 'Cancelled Session' }),
        createSession({ id: 'completed-1', status: 'completed', attended: true, subject: 'Completed Session' }),
      ],
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<UpcomingSessionsTable />);

    expect(screen.getByText('Data Structures')).toBeInTheDocument();
  expect(screen.queryByText('Attended Pending Session')).not.toBeInTheDocument();
    expect(screen.queryByText('Cancelled Session')).not.toBeInTheDocument();
    expect(screen.queryByText('Completed Session')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    fireEvent.change(screen.getByLabelText(/reason for cancellation/i), {
      target: { value: 'Need to handle an urgent conflict.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm cancellation/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        sessionId: 'pending-2',
        payload: {
          reason: 'Need to handle an urgent conflict.',
          notify: true,
        },
      });
    });

    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'success',
      })
    );
  });

  it('shows cancelled sessions in history with cancelled status', () => {
    mockUseMenteeSessions.mockReturnValue({
      data: [
        createSession({ id: 'completed-2', status: 'completed', attended: true, subject: 'Completed Review' }),
        createSession({ id: 'cancelled-2', status: 'cancelled', subject: 'Cancelled Follow-up' }),
        createSession({ id: 'attended-pending-2', status: 'pending', attended: true, subject: 'Attended Pending Follow-up' }),
        createSession({ id: 'pending-3', status: 'pending', subject: 'Pending Session' }),
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<SessionHistoryTable />);

    expect(screen.getByText('Completed Review')).toBeInTheDocument();
    expect(screen.getByText('Cancelled Follow-up')).toBeInTheDocument();
    expect(screen.getByText('Attended Pending Follow-up')).toBeInTheDocument();
    expect(screen.queryByText('Pending Session')).not.toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });
});
