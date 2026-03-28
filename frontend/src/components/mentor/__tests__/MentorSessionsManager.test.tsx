import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import MentorSessionsManager, { ATTENDANCE_LOCKOUT_MESSAGE } from '../MentorSessionsManager';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMentorSessions, useCompleteMentorSession } from '../../../shared/hooks/useMentorSessions';
import { useMentorFeedbackForSession, useCreateMentorFeedback, useUpdateMentorFeedback } from '../../../shared/hooks/useMentorFeedback';

jest.mock('../../../shared/hooks/useMentorSessions', () => ({
    useMentorSessions: jest.fn(),
    useCompleteMentorSession: jest.fn(),
}));

jest.mock('../../../shared/hooks/useSessionLifecycle', () => ({
    useRecordSessionAttendance: jest.fn(),
    useCancelSession: jest.fn(),
}));

// The composer is a small child component that uses many other hooks. Stub it out for these tests.
jest.mock('../../mentor/MentorSessionComposer', () => ({
    __esModule: true,
    default: () => null,
}));

// Stub the ProgressDashboard so unit-tests don't render the full component.
jest.mock('../../mentee/ProgressDashboard', () => ({ __esModule: true, default: () => <div>ProgressDashboardStub</div> }));

jest.mock('../../../shared/hooks/useMentorFeedback', () => ({
    useMentorFeedbackForSession: jest.fn(),
    useCreateMentorFeedback: jest.fn(),
    useUpdateMentorFeedback: jest.fn(),
    useMenteeProgressSnapshot: jest.fn(),
}));

const mockUseMentorSessions = useMentorSessions as jest.Mock;
const mockUseCompleteMentorSession = useCompleteMentorSession as jest.Mock;
const mockUseMentorFeedbackForSession = useMentorFeedbackForSession as jest.Mock;
const mockUseCreateMentorFeedback = useCreateMentorFeedback as jest.Mock;
const mockUseUpdateMentorFeedback = useUpdateMentorFeedback as jest.Mock;
import { useMenteeProgressSnapshot } from '../../../shared/hooks/useMentorFeedback';
import { useRecordSessionAttendance, useCancelSession } from '../../../shared/hooks/useSessionLifecycle';

const mockUseMenteeProgressSnapshot = useMenteeProgressSnapshot as jest.Mock;
const mockUseRecordAttendance = useRecordSessionAttendance as jest.Mock;
const mockUseCancelSession = useCancelSession as jest.Mock;

function baseSession(overrides: Record<string, any> = {}) {
    return {
        id: 's1',
        subject: 'Portfolio Review',
        mentee: { id: 'm1', name: 'Student One' },
        date: '2030-01-12T10:00:00.000Z',
        attended: true,
        tasksCompleted: 0,
        notes: '',
        status: 'completed',
        feedbackDue: false,
        participants: [{ id: 'm1', name: 'Student One' }],
        ...overrides,
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    mockUseMentorSessions.mockReturnValue({ data: [baseSession()], isLoading: false, isError: false, refetch: jest.fn(), isFetching: false });
    mockUseCompleteMentorSession.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
    mockUseRecordAttendance.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
    mockUseCancelSession.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
    mockUseMentorFeedbackForSession.mockReturnValue({ data: null, isLoading: false });
    mockUseMenteeProgressSnapshot.mockReturnValue({ data: null, isLoading: false });
    mockUseCreateMentorFeedback.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
    mockUseUpdateMentorFeedback.mockReturnValue({ mutateAsync: jest.fn(), isLoading: false });
});

describe('MentorSessionsManager', () => {
    it('shows a Give feedback button for completed sessions and opens modal', () => {
        const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={qc}>
                <MemoryRouter>
                    <MentorSessionsManager />
                </MemoryRouter>
            </QueryClientProvider>
        );

        // The default filter is 'upcoming'. Switch to all so our completed session shows.
        fireEvent.change(screen.getByLabelText(/Filter sessions by status/i), { target: { value: 'all' } });
        const table = screen.getByRole('table');
        const row = within(table).getByText('Portfolio Review').closest('tr');
        expect(row).toBeTruthy();

        // Click View details to open the right-side details panel
        const viewBtn = within(row as HTMLElement).getByRole('button', { name: /view details/i });
        expect(viewBtn).toBeInTheDocument();
        fireEvent.click(viewBtn);

        // The panel should show the session subject and the Attendance badge for primary participant
        const menteeEls = screen.getAllByText(/mentee:\s*student one/i);
        const panelEl = menteeEls.find((el) => el.closest('aside'));
        expect(panelEl).toBeTruthy();
        const panelAside = panelEl!.closest('aside') as HTMLElement;
        expect(within(panelAside).getByText(/present/i)).toBeInTheDocument();

        // The action buttons should be shown in the right-side panel now
        const giveFeedbackBtn = screen.getByRole('button', { name: /give feedback/i });
        expect(giveFeedbackBtn).toBeInTheDocument();

        // Row should no longer contain action buttons (they live in the right-side panel)
        expect(within(row as HTMLElement).queryByRole('button', { name: /attendance/i })).toBeNull();

        // Click the Attendance button in the right panel (not the row)
        const attendanceBtnInPanel = screen.getByRole('button', { name: /attendance/i });
        expect(attendanceBtnInPanel).toBeInTheDocument();
        fireEvent.click(attendanceBtnInPanel);

        // The attendance modal should appear
        expect(screen.getByText(/Record attendance/i)).toBeInTheDocument();

        // Close the attendance modal (click close) and then open feedback from panel
        // Locate the attendance dialog and close it explicitly
        const attendanceDialogHeading = screen.getByText(/Record attendance/i);
        const attendanceDialog = attendanceDialogHeading.closest('[role="dialog"]') as HTMLElement;
        const closeBtn = within(attendanceDialog).getByRole('button', { name: /close/i });
        fireEvent.click(closeBtn);

        fireEvent.click(giveFeedbackBtn);

        // Mentor feedback modal should appear with title
        expect(screen.getByText('Mentor feedback')).toBeInTheDocument();
    });

    it('prevents attendance submissions before the session ends', () => {
        const upcoming = baseSession({ id: 's2', subject: 'Upcoming UX Jam', date: '2099-01-12T10:00:00.000Z', attended: false, status: 'upcoming' });
        const hookValue = { data: [upcoming], isLoading: false, isError: false, refetch: jest.fn(), isFetching: false };
        mockUseMentorSessions.mockReturnValueOnce(hookValue);

        const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        render(
            <QueryClientProvider client={qc}>
                <MemoryRouter>
                    <MentorSessionsManager />
                </MemoryRouter>
            </QueryClientProvider>
        );

        const table = screen.getByRole('table');
        const row = within(table).getByText('Upcoming UX Jam').closest('tr');
        expect(row).toBeTruthy();
        const viewBtn = within(row as HTMLElement).getByRole('button', { name: /view details/i });
        fireEvent.click(viewBtn);

        const attendanceBtn = screen.getByRole('button', { name: /attendance/i });
        fireEvent.click(attendanceBtn);

        expect(screen.getAllByText(ATTENDANCE_LOCKOUT_MESSAGE)[0]).toBeInTheDocument();
        expect(screen.queryByText(/Record attendance/i)).not.toBeInTheDocument();
    });
});
