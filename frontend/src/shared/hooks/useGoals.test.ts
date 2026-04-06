import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  goalsKey,
  progressDashboardKey,
  progressSnapshotKey,
  useCreateGoal,
  useUpdateGoalProgress,
} from './useGoals';

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../services/goalsService', () => ({
  createGoal: jest.fn(),
  listGoals: jest.fn(),
  updateGoalProgress: jest.fn(),
  fetchProgressDashboard: jest.fn(),
}));

jest.mock('../services/mentorFeedbackService', () => ({
  fetchMenteeProgressSnapshot: jest.fn(),
}));

const mockUseMutation = useMutation as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;

describe('useGoals mutation invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMutation.mockImplementation((_mutationFn: unknown, options?: { onSuccess?: () => void }) => ({
      options,
    }));
  });

  it('invalidates goals, progress snapshot, and progress dashboard on successful goal creation', () => {
    const invalidateQueries = jest.fn();
    mockUseQueryClient.mockReturnValue({ invalidateQueries });

    useCreateGoal();
    const [, options] = mockUseMutation.mock.calls[0];
    options.onSuccess();

    expect(invalidateQueries).toHaveBeenCalledWith(goalsKey);
    expect(invalidateQueries).toHaveBeenCalledWith(progressSnapshotKey);
    expect(invalidateQueries).toHaveBeenCalledWith(progressDashboardKey);
    expect(invalidateQueries).toHaveBeenCalledTimes(3);
  });

  it('invalidates goals, progress snapshot, and progress dashboard on successful goal progress update', () => {
    const invalidateQueries = jest.fn();
    mockUseQueryClient.mockReturnValue({ invalidateQueries });

    useUpdateGoalProgress();
    const [, options] = mockUseMutation.mock.calls[0];
    options.onSuccess();

    expect(invalidateQueries).toHaveBeenCalledWith(goalsKey);
    expect(invalidateQueries).toHaveBeenCalledWith(progressSnapshotKey);
    expect(invalidateQueries).toHaveBeenCalledWith(progressDashboardKey);
    expect(invalidateQueries).toHaveBeenCalledTimes(3);
  });
});
