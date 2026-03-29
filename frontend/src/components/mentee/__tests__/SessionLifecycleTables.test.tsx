import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import UpcomingSessionsTable from '../UpcomingSessionsTable';
import SessionHistoryTable from '../SessionHistoryTable';
import { useMenteeSessions } from '../../../shared/hooks/useMenteeSessions';
import { useCancelSession } from '../../../shared/hooks/useSessionLifecycle';
import { useFlagSessionFeedback, useSessionFeedback, useSubmitSessionFeedback } from '../../../shared/hooks/useSessionFeedback';
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

jest.mock('../../../shared/hooks/useSessionFeedback', () => ({
  useFlagSessionFeedback: jest.fn(),
  useSessionFeedback: jest.fn(),
  useSubmitSessionFeedback: jest.fn(),
}));

const mockUseMenteeSessions = useMenteeSessions as jest.Mock;
const mockUseCancelSession = useCancelSession as jest.Mock;
const mockUseFlagSessionFeedback = useFlagSessionFeedback as jest.Mock;
const mockUseSessionFeedback = useSessionFeedback as jest.Mock;
const mockUseSubmitSessionFeedback = useSubmitSessionFeedback as jest.Mock;
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
    mockUseFlagSessionFeedback.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
    mockUseSessionFeedback.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseSubmitSessionFeedback.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
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

  it('shows edit feedback action only for rows with submitted feedback', () => {
    mockUseMenteeSessions.mockReturnValue({
      data: [
        createSession({ id: 'history-1', status: 'completed', attended: true, subject: 'Reviewed Session', feedbackSubmitted: true }),
        createSession({ id: 'history-2', status: 'completed', attended: true, subject: 'No Feedback Session', feedbackSubmitted: false }),
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<SessionHistoryTable />);

    expect(screen.getAllByRole('button', { name: /edit feedback/i })).toHaveLength(1);
  });

  it('opens edit feedback modal and submits update mutation', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    mockUseSubmitSessionFeedback.mockReturnValue({ mutateAsync, isLoading: false });
    mockUseSessionFeedback.mockReturnValue({
      data: {
        id: 'feedback-1',
        sessionId: 'history-3',
        mentorId: 'mentor-1',
        rating: 4,
        text: 'Helpful session',
        flagged: false,
        flagReason: null,
        submittedAt: '2030-05-10T10:00:00.000Z',
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseMenteeSessions.mockReturnValue({
      data: [
        createSession({ id: 'history-3', status: 'completed', attended: true, feedbackSubmitted: true, subject: 'Feedback Session' }),
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<SessionHistoryTable />);

    fireEvent.click(screen.getByRole('button', { name: /edit feedback/i }));

    expect(screen.getByRole('dialog', { name: /edit feedback/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Helpful session')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/rating \(1-5\)/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/comment/i), { target: { value: 'Updated notes' } });
    fireEvent.click(screen.getByRole('button', { name: /update feedback/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        mode: 'update',
        sessionId: 'history-3',
        rating: 5,
        text: 'Updated notes',
      });
    });
  });

  it('flags submitted feedback with required reason for admin review', async () => {
    const flagMutateAsync = jest.fn().mockResolvedValue({ success: true });
    mockUseFlagSessionFeedback.mockReturnValue({ mutateAsync: flagMutateAsync, isLoading: false });
    mockUseSessionFeedback.mockReturnValue({
      data: {
        id: 'feedback-flag-1',
        sessionId: 'history-4',
        mentorId: 'mentor-1',
        rating: 4,
        text: 'Good session',
        flagged: false,
        flagReason: null,
        submittedAt: '2030-05-10T10:00:00.000Z',
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseMenteeSessions.mockReturnValue({
      data: [
        createSession({ id: 'history-4', status: 'completed', attended: true, feedbackSubmitted: true, subject: 'Flaggable Session' }),
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<SessionHistoryTable />);

    fireEvent.click(screen.getByRole('button', { name: /flag feedback/i }));

    const flagDialog = screen.getByRole('dialog', { name: /flag feedback/i });
    expect(flagDialog).toBeInTheDocument();

    fireEvent.click(within(flagDialog).getByRole('button', { name: /^flag feedback$/i }));
    expect(flagMutateAsync).not.toHaveBeenCalled();

    fireEvent.change(within(flagDialog).getByLabelText(/reason for flagging/i), { target: { value: 'Test flag' } });
    fireEvent.click(within(flagDialog).getByRole('button', { name: /^flag feedback$/i }));

    await waitFor(() => {
      expect(flagMutateAsync).toHaveBeenCalledWith({
        feedbackId: 'feedback-flag-1',
        reason: 'Test flag',
      });
    });

    expect(screen.getByText(/feedback marked for admin review/i)).toBeInTheDocument();
  });
});
