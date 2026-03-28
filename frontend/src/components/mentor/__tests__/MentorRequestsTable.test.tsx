import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MentorRequestsTable from '../MentorRequestsTable';
import { useMentorshipRequests } from '../../../features/mentorship/hooks/useMentorshipRequests';

jest.mock('../../../features/mentorship/hooks/useMentorshipRequests', () => ({
  useMentorshipRequests: jest.fn(),
}));

jest.mock('../MenteeProfileDrawer', () => ({
  __esModule: true,
  default: () => null,
}));

const mockUseMentorshipRequests = useMentorshipRequests as jest.Mock;

const baseRequest = {
  id: 'req-1',
  status: 'pending',
  subject: 'Web Development',
  preferredSlot: null,
  goals: null,
  notes: null,
  sessionSuggestion: null,
  mentor: { id: 'mentor-1', name: 'Mentor One', email: null },
  mentee: { id: 'mentee-1', name: 'Mentee One', email: null },
  createdAt: '2030-01-12T10:00:00.000Z',
  updatedAt: '2030-01-12T10:00:00.000Z',
  mentorResponseAt: null,
  menteeWithdrawnAt: null,
  declineReason: null,
};

const getHookValue = (overrides: Record<string, unknown> = {}) => ({
  requests: [baseRequest],
  isLoading: false,
  isRefetching: false,
  meta: { scope: 'mentor', total: 1, pending: 1 },
  acceptRequest: jest.fn().mockResolvedValue(undefined),
  declineRequest: jest.fn().mockResolvedValue(undefined),
  withdrawRequest: jest.fn(),
  refetch: jest.fn(),
  isMutating: false,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(window, 'alert').mockImplementation(() => undefined);
  jest.spyOn(window, 'prompt').mockReturnValue('');
  jest.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('MentorRequestsTable', () => {
  it('aborts decline when prompt is cancelled', () => {
    const declineRequest = jest.fn();
    mockUseMentorshipRequests.mockReturnValue(
      getHookValue({ declineRequest })
    );
    (window.prompt as jest.Mock).mockReturnValueOnce(null);

    render(<MentorRequestsTable />);

    fireEvent.click(screen.getByRole('button', { name: /decline/i }));

    expect(declineRequest).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('removes pending actions immediately after accept succeeds', async () => {
    const acceptRequest = jest.fn().mockResolvedValue(undefined);
    mockUseMentorshipRequests.mockReturnValue(
      getHookValue({ acceptRequest })
    );

    render(<MentorRequestsTable />);

    fireEvent.click(screen.getByRole('button', { name: /accept/i }));

    await waitFor(() => {
      expect(acceptRequest).toHaveBeenCalledWith('req-1', undefined);
    });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /decline/i })).not.toBeInTheDocument();
    });
  });

  it('restores pending actions when optimistic state goes stale', async () => {
    jest.useFakeTimers();
    try {
      const acceptRequest = jest.fn().mockResolvedValue(undefined);
      mockUseMentorshipRequests.mockReturnValue(
        getHookValue({ acceptRequest })
      );

      render(<MentorRequestsTable />);

      fireEvent.click(screen.getByRole('button', { name: /accept/i }));

      await act(async () => {
        await Promise.resolve();
      });

      expect(acceptRequest).toHaveBeenCalledWith('req-1', undefined);
      expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /decline/i })).not.toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getByRole('button', { name: /accept/i })).toBeEnabled();
      expect(screen.getByRole('button', { name: /decline/i })).toBeEnabled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('unlocks row and shows error alert when accept fails', async () => {
    let rejectAccept: ((reason?: unknown) => void) | undefined;
    const acceptRequest = jest.fn(
      () =>
        new Promise((_, reject) => {
          rejectAccept = reject;
        })
    );

    mockUseMentorshipRequests.mockReturnValue(
      getHookValue({ acceptRequest })
    );

    render(<MentorRequestsTable />);

    const acceptButton = screen.getByRole('button', { name: /accept/i });
    const declineButton = screen.getByRole('button', { name: /decline/i });

    fireEvent.click(acceptButton);

    expect(acceptButton).toBeDisabled();
    expect(declineButton).toBeDisabled();

    rejectAccept?.(new Error('Accept failed'));

    await waitFor(() => {
      expect(acceptButton).not.toBeDisabled();
      expect(declineButton).not.toBeDisabled();
    });

    expect(window.alert).toHaveBeenCalledWith('Unable to accept request. Please try again.');
  });

  it('aborts accept when confirmation is cancelled', () => {
    const acceptRequest = jest.fn();
    mockUseMentorshipRequests.mockReturnValue(
      getHookValue({ acceptRequest })
    );
    (window.confirm as jest.Mock).mockReturnValueOnce(false);

    render(<MentorRequestsTable />);

    fireEvent.click(screen.getByRole('button', { name: /accept/i }));

    expect(acceptRequest).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it('unlocks row and shows error alert when decline fails', async () => {
    let rejectDecline: ((reason?: unknown) => void) | undefined;
    const declineRequest = jest.fn(
      () =>
        new Promise((_, reject) => {
          rejectDecline = reject;
        })
    );

    mockUseMentorshipRequests.mockReturnValue(
      getHookValue({ declineRequest })
    );
    (window.prompt as jest.Mock).mockReturnValueOnce('Schedule conflict');

    render(<MentorRequestsTable />);

    const acceptButton = screen.getByRole('button', { name: /accept/i });
    const declineButton = screen.getByRole('button', { name: /decline/i });

    fireEvent.click(declineButton);

    expect(acceptButton).toBeDisabled();
    expect(declineButton).toBeDisabled();

    rejectDecline?.(new Error('Decline failed'));

    await waitFor(() => {
      expect(acceptButton).not.toBeDisabled();
      expect(declineButton).not.toBeDisabled();
    });

    expect(window.alert).toHaveBeenCalledWith('Unable to decline request. Please try again.');
  });
});