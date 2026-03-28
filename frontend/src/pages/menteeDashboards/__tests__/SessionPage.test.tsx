import React from 'react';
import { render, screen } from '@testing-library/react';
import SessionPage from '../SessionPage';

// Mock the layout and heavy children to keep this test focused
jest.mock('../../../components/layouts/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}));

jest.mock('../../../components/mentee/SessionActionsPanel', () => ({ __esModule: true, default: () => <div>SessionActionsPanel</div> }));
jest.mock('../../../components/mentee/UpcomingSessionsTable', () => ({ __esModule: true, default: () => <div>UpcomingSessionsTable</div> }));
jest.mock('../../../components/mentee/PendingFeedbackList', () => ({ __esModule: true, default: () => <div>PendingFeedbackList</div> }));
jest.mock('../../../components/mentee/SessionHistoryTable', () => ({ __esModule: true, default: () => <div>SessionHistoryTable</div> }));

// Use a real ProgressDashboard to assert it's rendered within the page
jest.mock('../../../components/mentee/ProgressDashboard', () => ({ __esModule: true, default: () => <div>ProgressDashboard</div> }));

describe('SessionPage', () => {
  it('renders progress dashboard inside the page layout', () => {
    render(<SessionPage />);
    expect(screen.getByText('SessionActionsPanel')).toBeInTheDocument();
    expect(screen.getByText('ProgressDashboard')).toBeInTheDocument();
    expect(screen.getByText('UpcomingSessionsTable')).toBeInTheDocument();
    expect(screen.getByText('PendingFeedbackList')).toBeInTheDocument();
    expect(screen.getByText('SessionHistoryTable')).toBeInTheDocument();
  });
});
