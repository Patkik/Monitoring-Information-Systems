import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GoalsPage from '../GoalsPage';
import { useCreateGoal, useGoals, useGoalsProgressDashboard, useUpdateGoalProgress } from '../../../shared/hooks/useGoals';

jest.mock('../../../components/layouts/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../../shared/hooks/useGoals', () => ({
  useGoals: jest.fn(),
  useCreateGoal: jest.fn(),
  useUpdateGoalProgress: jest.fn(),
  useGoalsProgressDashboard: jest.fn(),
}));

const mockUseGoals = useGoals as jest.Mock;
const mockUseCreateGoal = useCreateGoal as jest.Mock;
const mockUseUpdateGoalProgress = useUpdateGoalProgress as jest.Mock;
const mockUseGoalsProgressDashboard = useGoalsProgressDashboard as jest.Mock;

describe('GoalsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGoals.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    mockUseCreateGoal.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ id: 'goal-1', title: 'New Goal' }),
      isLoading: false,
    });
    mockUseUpdateGoalProgress.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
    });
    mockUseGoalsProgressDashboard.mockReturnValue({
      data: {
        goalsSummary: {
          avgProgress: 0,
          totalMilestones: 0,
        },
        sessionsTrend: [],
      },
      isLoading: false,
      isError: false,
    });
  });

  it('shows progress dashboard metrics and session trends', () => {
    mockUseGoalsProgressDashboard.mockReturnValue({
      data: {
        goalsSummary: {
          avgProgress: 68,
          totalMilestones: 12,
        },
        sessionsTrend: [
          { week: '2026-W11', sessions: 2, attended: 2, tasksCompleted: 4 },
          { week: '2026-W12', sessions: 3, attended: 2, tasksCompleted: 5 },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(<GoalsPage />);

    expect(screen.getByText('Progress Dashboard')).toBeInTheDocument();
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByText('2026-W11')).toBeInTheDocument();
    expect(screen.getByText('2026-W12')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('submits title, generated milestones, and target date', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({ id: 'goal-1', title: 'Launch Goal' });
    mockUseCreateGoal.mockReturnValue({ mutateAsync, isLoading: false });

    render(<GoalsPage />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Launch Goal' } });
    fireEvent.change(screen.getByLabelText(/milestones \(count number\)/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/target date/i), { target: { value: '2030-05-20' } });

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        title: 'Launch Goal',
        targetDate: '2030-05-20',
        milestones: [
          { label: 'Milestone 1' },
          { label: 'Milestone 2' },
          { label: 'Milestone 3' },
        ],
      });
    });

    expect(screen.getByText(/goal created successfully/i)).toBeInTheDocument();
  });

  it('marks unachieved milestone with goal id and milestone label payload', () => {
    const mutate = jest.fn();
    mockUseUpdateGoalProgress.mockReturnValue({ mutate, isLoading: false });

    mockUseGoals.mockReturnValue({
      data: [
        {
          id: 'goal-2',
          title: 'Build Portfolio',
          description: null,
          targetDate: '2030-06-01T00:00:00.000Z',
          status: 'active',
          milestones: [
            { label: 'Milestone 1', achieved: false, achievedAt: null },
            { label: 'Milestone 2', achieved: true, achievedAt: '2030-05-01T12:30:00.000Z' },
          ],
          progressPercent: 25,
          createdAt: '2030-01-01T00:00:00.000Z',
          updatedAt: '2030-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(<GoalsPage />);

    fireEvent.click(screen.getByRole('button', { name: /mark milestone 1 as achieved/i }));

    expect(mutate).toHaveBeenCalledWith({
      id: 'goal-2',
      milestoneLabel: 'Milestone 1',
    }, expect.objectContaining({ onSettled: expect.any(Function) }));
    expect(screen.getByText('25% progress')).toBeInTheDocument();
  });

  it('applies mark achieved mutation and shows refreshed 25% progress with deterministic achieved timestamp', () => {
    const mutate = jest.fn();
    mockUseUpdateGoalProgress.mockReturnValue({ mutate, isLoading: false });

    const initialGoals = {
      data: [
        {
          id: 'goal-3',
          title: 'Learn Node.js',
          description: null,
          targetDate: '2030-08-01T00:00:00.000Z',
          status: 'active',
          milestones: [
            { label: 'Milestone 1', achieved: false, achievedAt: null },
            { label: 'Milestone 2', achieved: false, achievedAt: null },
            { label: 'Milestone 3', achieved: false, achievedAt: null },
            { label: 'Milestone 4', achieved: false, achievedAt: null },
          ],
          progressPercent: 0,
          createdAt: '2030-01-01T00:00:00.000Z',
          updatedAt: '2030-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    };

    const updatedGoals = {
      data: [
        {
          id: 'goal-3',
          title: 'Learn Node.js',
          description: null,
          targetDate: '2030-08-01T00:00:00.000Z',
          status: 'active',
          milestones: [
            { label: 'Milestone 1', achieved: true, achievedAt: '2030-04-01T10:00:00.000Z' },
            { label: 'Milestone 2', achieved: false, achievedAt: null },
            { label: 'Milestone 3', achieved: false, achievedAt: null },
            { label: 'Milestone 4', achieved: false, achievedAt: null },
          ],
          progressPercent: 25,
          createdAt: '2030-01-01T00:00:00.000Z',
          updatedAt: '2030-01-02T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    };

    mockUseGoals.mockReturnValue(updatedGoals).mockReturnValueOnce(initialGoals);

    const { rerender } = render(<GoalsPage />);

    expect(screen.getByText('0% progress')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /mark milestone 1 as achieved/i }));

    expect(mutate).toHaveBeenCalledWith({
      id: 'goal-3',
      milestoneLabel: 'Milestone 1',
    }, expect.objectContaining({ onSettled: expect.any(Function) }));

    rerender(<GoalsPage />);

    expect(screen.getByText('25% progress')).toBeInTheDocument();
    expect(screen.getByText('Achieved: 2030-04-01 10:00 UTC')).toBeInTheDocument();
  });

  it('shows deterministic achieved timestamp and fallback when achievedAt is missing', () => {
    mockUseGoals.mockReturnValue({
      data: [
        {
          id: 'goal-4',
          title: 'Ship capstone',
          description: null,
          targetDate: '2030-06-01T00:00:00.000Z',
          status: 'active',
          milestones: [
            { label: 'Milestone 1', achieved: true, achievedAt: '2030-05-01T12:30:00.000Z' },
            { label: 'Milestone 2', achieved: true, achievedAt: null },
          ],
          progressPercent: 100,
          createdAt: '2030-01-01T00:00:00.000Z',
          updatedAt: '2030-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(<GoalsPage />);

    expect(screen.getByText('Ship capstone')).toBeInTheDocument();
    expect(screen.getByText('Achieved: 2030-05-01 12:30 UTC')).toBeInTheDocument();
    expect(screen.getByText('Achieved: Date unavailable')).toBeInTheDocument();
    expect(screen.getByText(/100% progress/i)).toBeInTheDocument();
  });
});