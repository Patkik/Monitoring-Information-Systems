import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MatchCard from '../MatchCard';
import type { MatchSuggestion } from '../../types';

const buildSuggestion = (): MatchSuggestion => ({
  id: 'match-1',
  score: 87,
  status: 'suggested',
  mentee: {
    id: 'mentee-1',
    name: 'Jamie Learner',
    education: { program: 'Computer Science' },
    expertiseAreas: ['JavaScript'],
    skills: ['React'],
    availabilitySlots: [{ day: 'mon', start: '09:00', end: '10:00' }],
  },
  scoreBreakdown: { expertise: 90, availability: 80, interactions: 70, priority: 60 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('MatchCard', () => {
  it('renders mentee info and fires accept handler', () => {
    const suggestion = buildSuggestion();
    const onAccept = jest.fn();
    const onDecline = jest.fn();

    render(<MatchCard suggestion={suggestion} onAccept={onAccept} onDecline={onDecline} />);

    expect(screen.getByText('Jamie Learner')).toBeInTheDocument();
    expect(screen.getByText('87')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /decline/i }));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it('disables accept button when capacity reached', () => {
    const suggestion = buildSuggestion();
    render(<MatchCard suggestion={suggestion} onAccept={() => {}} onDecline={() => {}} disableAccept />);

    const acceptButton = screen.getByRole('button', { name: /^full$/i });
    expect(acceptButton).toBeDisabled();
  });
});
