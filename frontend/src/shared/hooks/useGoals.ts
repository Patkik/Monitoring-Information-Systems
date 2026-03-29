import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createGoal, listGoals, updateGoalProgress, GoalItem, fetchProgressDashboard, ProgressDashboardData } from '../services/goalsService';
import { fetchMenteeProgressSnapshot, MenteeProgressSnapshot } from '../services/mentorFeedbackService';

export const goalsKey = ['goals'];
export const progressSnapshotKey = ['progressSnapshot'];
export const progressDashboardKey = ['progress-dashboard'];

export function useGoals() {
  return useQuery<GoalItem[]>(goalsKey, listGoals, { staleTime: 60 * 1000 });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation(createGoal, {
    onSuccess: () => {
      qc.invalidateQueries(goalsKey);
      qc.invalidateQueries(progressSnapshotKey);
      qc.invalidateQueries(progressDashboardKey);
    },
  });
}

export function useUpdateGoalProgress() {
  const qc = useQueryClient();
  return useMutation(({ id, value, milestoneLabel }: { id: string; value?: number; milestoneLabel?: string }) => updateGoalProgress(id, { value, milestoneLabel }), {
    onSuccess: () => {
      qc.invalidateQueries(goalsKey);
      qc.invalidateQueries(progressSnapshotKey);
      qc.invalidateQueries(progressDashboardKey);
    },
  });
}

export function useProgressDashboard() {
  return useQuery<MenteeProgressSnapshot>(progressSnapshotKey, fetchMenteeProgressSnapshot, {
    refetchInterval: 120 * 1000,
  });
}

export function useGoalsProgressDashboard() {
  return useQuery<ProgressDashboardData>(progressDashboardKey, fetchProgressDashboard, {
    staleTime: 60 * 1000,
  });
}
