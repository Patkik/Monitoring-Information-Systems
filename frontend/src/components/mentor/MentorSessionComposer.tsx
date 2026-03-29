import React, { useEffect, useMemo, useState } from 'react';
import { useCreateMentorSession } from '../../shared/hooks/useMentorSessions';
import { useMentorRoster } from '../../shared/hooks/useMentorRoster';
import type { ApiWarning, MentorSession } from '../../shared/services/sessionsService';

interface MentorSessionComposerProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated?: (session: MentorSession, warnings?: ApiWarning[]) => void;
}

const formatSessionTimeInput = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 4);
    if (!digits) {
        return '';
    }
    if (digits.length <= 2) {
        return digits;
    }
    const hours = digits.slice(0, digits.length - 2);
    const minutes = digits.slice(-2);
    return `${hours}:${minutes}`;
};

const MentorSessionComposer: React.FC<MentorSessionComposerProps> = ({ isOpen, onClose, onCreated }) => {
    const [subject, setSubject] = useState('');
    const [room, setRoom] = useState('');
    const [sessionDate, setSessionDate] = useState('');
    const [sessionTime, setSessionTime] = useState('');
    const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');
    const [durationMinutes, setDurationMinutes] = useState('60');
    const [capacity, setCapacity] = useState('5');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const rosterQuery = useMentorRoster();
    const createSession = useCreateMentorSession();

    useEffect(() => {
        if (isOpen) {
            setFormError(null);
            return;
        }

        setSubject('');
        setRoom('');
        setSessionDate('');
        setSessionTime('');
        setTimePeriod('AM');
        setDurationMinutes('60');
        setCapacity('5');
        setSelectedIds([]);
        setSearch('');
        setFormError(null);
    }, [isOpen]);

    const filteredRoster = useMemo(() => {
        const mentees = rosterQuery.data || [];
        if (!search.trim()) {
            return mentees;
        }
        const lower = search.trim().toLowerCase();
        return mentees.filter((mentee) => {
            const name = mentee.name?.toLowerCase() || '';
            const email = mentee.email?.toLowerCase() || '';
            return name.includes(lower) || email.includes(lower);
        });
    }, [rosterQuery.data, search]);

    if (!isOpen) {
        return null;
    }

    const toggleParticipant = (id: string) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((value) => value !== id);
            }
            return [...prev, id];
        });
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormError(null);

        const trimmedSubject = subject.trim();
        const trimmedRoom = room.trim();
        if (!trimmedSubject) {
            setFormError('Session subject is required.');
            return;
        }
        if (!trimmedRoom) {
            setFormError('Please provide a room or meeting link.');
            return;
        }
        if (!sessionDate) {
            setFormError('Pick a session date.');
            return;
        }
        if (!sessionTime) {
            setFormError('Enter a session start time.');
            return;
        }
        const digitsOnlyTime = sessionTime.replace(/\D/g, '');
        if (digitsOnlyTime.length < 3 || digitsOnlyTime.length > 4) {
            setFormError('Enter time as HHMM before selecting AM/PM.');
            return;
        }
        const hourDigitsLength = digitsOnlyTime.length - 2;
        const hourPartString = digitsOnlyTime.slice(0, hourDigitsLength);
        const minutePart = digitsOnlyTime.slice(-2);
        const hourPart = Number(hourPartString);
        if (!hourPart || hourPart < 1 || hourPart > 12) {
            setFormError('Hour must be between 01 and 12.');
            return;
        }
        const minuteNumber = Number(minutePart);
        if (Number.isNaN(minuteNumber) || minuteNumber > 59) {
            setFormError('Minutes must be between 00 and 59.');
            return;
        }
        if (!selectedIds.length) {
            setFormError('Invite at least one mentee.');
            return;
        }

        let hours24 = hourPart % 12;
        if (timePeriod === 'PM') {
            hours24 += 12;
        }
        const dateTimeString = `${sessionDate}T${String(hours24).padStart(2, '0')}:${minutePart}`;
        const scheduledDate = new Date(dateTimeString);
        if (Number.isNaN(scheduledDate.getTime())) {
            setFormError('Choose a valid date and time.');
            return;
        }

        const parsedDuration = Math.min(240, Math.max(15, Number(durationMinutes) || 60));
        const parsedCapacity = Math.max(selectedIds.length, Number(capacity) || selectedIds.length);
        if (selectedIds.length > parsedCapacity) {
            setFormError('Capacity must be at least the number of invitees.');
            return;
        }

        try {
                const { session, warnings } = await createSession.mutateAsync({
                subject: trimmedSubject,
                room: trimmedRoom,
                date: scheduledDate.toISOString(),
                durationMinutes: parsedDuration,
                capacity: parsedCapacity,
                participantIds: selectedIds,
            });
            setFormError(null);
                onCreated?.(session, warnings);
            onClose();
        } catch (error: any) {
            const messageFromServer = error?.response?.data?.message || error?.response?.data?.error;
            setFormError(messageFromServer || error?.message || 'Unable to schedule session right now.');
        }
    };

    return (
        <div
            className="tw-fixed tw-inset-0 tw-bg-black/40 tw-backdrop-blur-sm tw-flex tw-items-center tw-justify-center tw-z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentor-session-composer-title"
        >
            <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full tw-max-w-4xl tw-max-h-[90vh] tw-overflow-hidden">
                <div className="tw-flex tw-justify-between tw-items-start tw-border-b tw-border-gray-100 tw-p-6">
                    <div>
                        <p className="tw-text-sm tw-font-semibold tw-text-primary">Schedule session</p>
                        <h3 id="mentor-session-composer-title" className="tw-text-2xl tw-font-bold tw-text-gray-900">
                            Invite mentees to a session
                        </h3>
                        <p className="tw-text-sm tw-text-gray-500">
                            Share a topic, pick a time, and select mentees to auto-create a shared group chat.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="tw-text-gray-400 hover:tw-text-gray-600"
                        aria-label="Close scheduling form"
                    >
                        ×
                    </button>
                </div>

                <form className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-[1.1fr,0.9fr] tw-gap-0" onSubmit={handleSubmit}>
                    <div className="tw-p-6 tw-space-y-4 tw-border-b lg:tw-border-b-0 lg:tw-border-r tw-border-gray-100">
                        <div>
                            <label htmlFor="mentor-session-subject" className="tw-text-sm tw-font-medium tw-text-gray-700">
                                Session topic
                            </label>
                            <input
                                id="mentor-session-subject"
                                type="text"
                                value={subject}
                                onChange={(event) => setSubject(event.target.value)}
                                className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                                placeholder="Portfolio review, mock interview, study hall…"
                            />
                        </div>

                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                            <div>
                                <label htmlFor="mentor-session-date" className="tw-text-sm tw-font-medium tw-text-gray-700">
                                    Date
                                </label>
                                <input
                                    id="mentor-session-date"
                                    type="date"
                                    value={sessionDate}
                                    onChange={(event) => setSessionDate(event.target.value)}
                                    className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="mentor-session-time" className="tw-text-sm tw-font-medium tw-text-gray-700">
                                    Start time
                                </label>
                                <div className="tw-mt-1 tw-flex tw-border tw-border-gray-300 tw-rounded-lg tw-overflow-hidden focus-within:tw-ring-2 focus-within:tw-ring-primary">
                                    <select
                                        aria-label="AM or PM"
                                        value={timePeriod}
                                        onChange={(event) => setTimePeriod(event.target.value === 'PM' ? 'PM' : 'AM')}
                                        className="tw-bg-gray-50 tw-text-sm tw-text-gray-700 tw-px-3 tw-py-2 focus:tw-outline-none"
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                    <input
                                        id="mentor-session-time"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="HHMM"
                                        value={sessionTime}
                                        onChange={(event) => setSessionTime(formatSessionTimeInput(event.target.value))}
                                        className="tw-flex-1 tw-border-0 tw-px-3 tw-py-2 focus:tw-outline-none"
                                        maxLength={5}
                                        required
                                    />
                                </div>
                                <p className="tw-mt-1 tw-text-xs tw-text-gray-500">Pick AM/PM then type HHMM (e.g., AM 0130). We’ll add the colon automatically.</p>
                            </div>
                            <div>
                                <label htmlFor="mentor-session-duration" className="tw-text-sm tw-font-medium tw-text-gray-700">
                                    Duration (minutes)
                                </label>
                                <input
                                    id="mentor-session-duration"
                                    type="number"
                                    min="15"
                                    max="240"
                                    value={durationMinutes}
                                    onChange={(event) => setDurationMinutes(event.target.value)}
                                    className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                                />
                            </div>
                        </div>

                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                            <div>
                                <label htmlFor="mentor-session-room" className="tw-text-sm tw-font-medium tw-text-gray-700">
                                    Room or video link
                                </label>
                                <input
                                    id="mentor-session-room"
                                    type="text"
                                    value={room}
                                    onChange={(event) => setRoom(event.target.value)}
                                    className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                                    placeholder="Mentor Lab 203, Zoom link, etc."
                                />
                            </div>
                            <div>
                                <label htmlFor="mentor-session-capacity" className="tw-text-sm tw-font-medium tw-text-gray-700">
                                    Capacity
                                </label>
                                <input
                                    id="mentor-session-capacity"
                                    type="number"
                                    min={selectedIds.length || 1}
                                    value={capacity}
                                    onChange={(event) => setCapacity(event.target.value)}
                                    className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                                />
                                <p className="tw-mt-1 tw-text-xs tw-text-gray-500">Must be at least the number of invitees.</p>
                            </div>
                        </div>

                        {formError ? (
                            <div className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-text-red-700 tw-text-sm tw-px-3 tw-py-2" role="alert">
                                {formError}
                            </div>
                        ) : null}

                        <div className="tw-flex tw-justify-end tw-gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-text-gray-700 hover:tw-bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createSession.isLoading}
                                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-primary tw-text-white tw-text-sm tw-font-semibold tw-px-4 tw-py-2 hover:tw-bg-primary/90 focus:tw-ring-2 focus:tw-ring-offset-2 focus:tw-ring-primary disabled:tw-opacity-50"
                            >
                                {createSession.isLoading ? 'Creating session…' : 'Create session'}
                            </button>
                        </div>
                    </div>

                    <div className="tw-p-6 tw-space-y-4">
                        <div>
                            <label htmlFor="mentor-session-search" className="tw-text-sm tw-font-medium tw-text-gray-700">
                                Invite mentees
                            </label>
                            <input
                                id="mentor-session-search"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by name or email"
                                className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-primary focus:tw-border-transparent"
                            />
                        </div>

                        <div className="tw-flex tw-items-center tw-justify-between tw-text-sm">
                            <span className="tw-text-gray-500">Selected: {selectedIds.length}</span>
                            {selectedIds.length ? (
                                <button
                                    type="button"
                                    onClick={() => setSelectedIds([])}
                                    className="tw-text-primary tw-font-medium"
                                >
                                    Clear all
                                </button>
                            ) : null}
                        </div>

                        <div className="tw-border tw-border-gray-200 tw-rounded-xl tw-max-h-[360px] tw-overflow-y-auto">
                            {rosterQuery.isLoading ? (
                                <div className="tw-p-6 tw-text-center tw-text-sm tw-text-gray-500">Loading roster…</div>
                            ) : rosterQuery.isError ? (
                                <div className="tw-p-6 tw-text-center tw-text-sm tw-text-red-600">Unable to load mentees.</div>
                            ) : filteredRoster.length === 0 ? (
                                <div className="tw-p-6 tw-text-center tw-text-sm tw-text-gray-500">No mentees match your search.</div>
                            ) : (
                                <ul className="tw-divide-y tw-divide-gray-100">
                                    {filteredRoster.map((mentee) => {
                                        const checked = selectedIds.includes(mentee.id);
                                        return (
                                            <li key={mentee.id}>
                                                <label className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-py-3 hover:tw-bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        className="tw-rounded tw-border-gray-300 tw-text-primary focus:tw-ring-primary"
                                                        checked={checked}
                                                        onChange={() => toggleParticipant(mentee.id)}
                                                    />
                                                    <div>
                                                        <p className="tw-text-sm tw-font-semibold tw-text-gray-900">{mentee.name}</p>
                                                        <p className="tw-text-xs tw-text-gray-500">{mentee.email}</p>
                                                    </div>
                                                </label>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MentorSessionComposer;
