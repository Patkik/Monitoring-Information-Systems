import React, { FormEvent, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useCreateGoal, useGoals, useGoalsProgressDashboard, useUpdateGoalProgress } from '../../shared/hooks/useGoals';

const formatDeterministicTimestamp = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const isoString = parsedDate.toISOString();
  return `${isoString.slice(0, 16).replace('T', ' ')} UTC`;
};

const GoalsPage: React.FC = () => {
  const { data: goals = [], isLoading, isError } = useGoals();
  const {
    data: progressDashboard,
    isLoading: isProgressDashboardLoading,
    isError: isProgressDashboardError,
  } = useGoalsProgressDashboard();
  const { mutateAsync, isLoading: isSaving } = useCreateGoal();
  const { mutate: updateGoalProgressMutation } = useUpdateGoalProgress();
  const [title, setTitle] = useState('');
  const [milestonesCount, setMilestonesCount] = useState(1);
  const [targetDate, setTargetDate] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingMilestoneKeys, setPendingMilestoneKeys] = useState<Record<string, true>>({});

  const hasGoals = goals.length > 0;

  const minTargetDate = useMemo(() => {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localDate.toISOString().split('T')[0];
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const normalizedCount = Number.isFinite(milestonesCount)
      ? Math.max(1, Math.floor(milestonesCount))
      : 1;

    const milestones = Array.from({ length: normalizedCount }, (_, index) => ({
      label: `Milestone ${index + 1}`,
    }));

    try {
      await mutateAsync({
        title: title.trim(),
        targetDate,
        milestones,
      });
      setTitle('');
      setMilestonesCount(1);
      setTargetDate('');
      setSuccessMessage('Goal created successfully.');
    } catch (error) {
      setErrorMessage('Unable to create goal. Please try again.');
    }
  };

  const handleMarkAchieved = (goalId: string, milestoneLabel: string) => {
    const milestoneKey = `${goalId}:${milestoneLabel}`;
    setPendingMilestoneKeys((previous) => ({ ...previous, [milestoneKey]: true }));

    updateGoalProgressMutation(
      {
        id: goalId,
        milestoneLabel,
      },
      {
        onSettled: () => {
          setPendingMilestoneKeys((previous) => {
            const { [milestoneKey]: _, ...rest } = previous;
            return rest;
          });
        },
      },
    );
  };

  return (
    <DashboardLayout>
      <div className="tw-max-w-5xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8 tw-space-y-6">
        <header>
          <p className="tw-text-xs tw-font-semibold tw-text-primary tw-uppercase">Goals</p>
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Create and track your goals</h1>
          <p className="tw-text-sm tw-text-gray-600">
            Add a goal with milestones, then follow your progress as sessions are completed.
          </p>
        </header>

        <section className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm tw-p-5" aria-label="Progress Dashboard">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Progress Dashboard</h2>

          {isProgressDashboardLoading && (
            <p className="tw-mt-3 tw-text-sm tw-text-gray-500">Loading progress dashboard...</p>
          )}

          {isProgressDashboardError && (
            <p className="tw-mt-3 tw-text-sm tw-text-red-700">Unable to load progress dashboard.</p>
          )}

          {!isProgressDashboardLoading && !isProgressDashboardError && progressDashboard && (
            <div className="tw-mt-4 tw-space-y-4">
              <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3">
                <div className="tw-rounded-md tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-4">
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-500">Average Progress</p>
                  <p className="tw-mt-1 tw-text-2xl tw-font-bold tw-text-gray-900">
                    {progressDashboard.goalsSummary.avgProgress}%
                  </p>
                </div>
                <div className="tw-rounded-md tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-4">
                  <p className="tw-text-xs tw-font-semibold tw-uppercase tw-text-gray-500">Total Milestones</p>
                  <p className="tw-mt-1 tw-text-2xl tw-font-bold tw-text-gray-900">
                    {progressDashboard.goalsSummary.totalMilestones}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="tw-text-sm tw-font-semibold tw-text-gray-800">Session Trends</h3>
                {progressDashboard.sessionsTrend.length === 0 ? (
                  <p className="tw-mt-2 tw-text-sm tw-text-gray-500">No recent session trend data.</p>
                ) : (
                  <div className="tw-mt-2 tw-overflow-x-auto">
                    <table className="tw-min-w-full tw-border-collapse">
                      <thead>
                        <tr className="tw-border-b tw-border-gray-200">
                          <th scope="col" className="tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-600">Week</th>
                          <th scope="col" className="tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-600">Sessions</th>
                          <th scope="col" className="tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-600">Attended</th>
                          <th scope="col" className="tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-text-gray-600">Tasks Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {progressDashboard.sessionsTrend.map((trend) => (
                          <tr key={trend.week} className="tw-border-b tw-border-gray-100 last:tw-border-b-0">
                            <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-700">{trend.week}</td>
                            <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-700">{trend.sessions}</td>
                            <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-700">{trend.attended}</td>
                            <td className="tw-px-3 tw-py-2 tw-text-sm tw-text-gray-700">{trend.tasksCompleted}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm tw-p-5">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">New Goal</h2>
          <form className="tw-mt-4 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4" onSubmit={handleSubmit}>
            <div className="md:tw-col-span-2">
              <label htmlFor="goal-title" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Title
              </label>
              <input
                id="goal-title"
                type="text"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="tw-w-full tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/30 focus:tw-border-primary"
                placeholder="e.g., Complete React fundamentals"
              />
            </div>

            <div>
              <label htmlFor="goal-milestones" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Milestones (count number)
              </label>
              <input
                id="goal-milestones"
                type="number"
                min={1}
                required
                value={milestonesCount}
                onChange={(event) => setMilestonesCount(Number(event.target.value))}
                className="tw-w-full tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/30 focus:tw-border-primary"
              />
            </div>

            <div>
              <label htmlFor="goal-target-date" className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Target Date
              </label>
              <input
                id="goal-target-date"
                type="date"
                required
                min={minTargetDate}
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                className="tw-w-full tw-rounded-md tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/30 focus:tw-border-primary"
              />
            </div>

            <div className="md:tw-col-span-2 tw-flex tw-items-center tw-gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-bg-primary tw-text-white tw-font-medium tw-px-4 tw-py-2 hover:tw-opacity-95 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              {successMessage && (
                <p role="status" aria-live="polite" aria-atomic="true" className="tw-text-sm tw-text-green-700">
                  {successMessage}
                </p>
              )}
              {errorMessage && (
                <p role="alert" aria-live="assertive" aria-atomic="true" className="tw-text-sm tw-text-red-700">
                  {errorMessage}
                </p>
              )}
            </div>
          </form>
        </section>

        <section className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm tw-p-5">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">Your Goals</h2>

          {isLoading && <p className="tw-mt-3 tw-text-sm tw-text-gray-500">Loading goals...</p>}
          {isError && <p className="tw-mt-3 tw-text-sm tw-text-red-700">Unable to load goals.</p>}

          {!isLoading && !isError && !hasGoals && (
            <p className="tw-mt-3 tw-text-sm tw-text-gray-500">No goals yet. Create your first goal above.</p>
          )}

          {!isLoading && !isError && hasGoals && (
            <ul className="tw-mt-4 tw-space-y-3">
              {goals.map((goal) => {
                const targetDateLabel = goal.targetDate
                  ? new Date(goal.targetDate).toLocaleDateString()
                  : 'No target date';

                return (
                  <li key={goal.id} className="tw-rounded-md tw-border tw-border-gray-200 tw-p-4 tw-bg-gray-50">
                    <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-start sm:tw-justify-between tw-gap-2">
                      <div>
                        <h3 className="tw-text-base tw-font-semibold tw-text-gray-900">{goal.title}</h3>
                        <p className="tw-text-sm tw-text-gray-600">Target Date: {targetDateLabel}</p>
                      </div>
                      <div className="tw-text-sm tw-text-gray-700">
                        <p>Status: {goal.status}</p>
                        <p>{goal.progressPercent}% progress</p>
                      </div>
                    </div>

                    {goal.milestones.length > 0 && (
                      <ul className="tw-mt-3 tw-space-y-2" aria-label={`${goal.title} milestones`}>
                        {goal.milestones.map((milestone) => {
                          const achievedLabel = formatDeterministicTimestamp(milestone.achievedAt);
                          const milestoneKey = `${goal.id}:${milestone.label}`;
                          const isMilestonePending = Boolean(pendingMilestoneKeys[milestoneKey]);

                          return (
                            <li
                              key={`${goal.id}-${milestone.label}`}
                              className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-2 tw-rounded-md tw-bg-white tw-border tw-border-gray-200 tw-p-3"
                            >
                              <div>
                                <p className="tw-text-sm tw-font-medium tw-text-gray-900">{milestone.label}</p>
                                {milestone.achieved && (
                                  <p className="tw-text-xs tw-text-gray-600">
                                    Achieved: {achievedLabel ?? 'Date unavailable'}
                                  </p>
                                )}
                              </div>

                              {milestone.achieved ? (
                                <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-green-100 tw-text-green-800 tw-text-xs tw-font-medium tw-px-2.5 tw-py-1">
                                  Achieved
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMarkAchieved(goal.id, milestone.label)}
                                  disabled={isMilestonePending}
                                  className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-primary tw-text-primary tw-font-medium tw-text-sm tw-px-3 tw-py-1.5 hover:tw-bg-primary/5 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
                                  aria-label={`Mark ${milestone.label} as achieved`}
                                >
                                  Mark achieved
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default GoalsPage;