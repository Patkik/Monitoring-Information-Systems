import type { AttendanceStatus, MentorSession, SessionParticipant } from '../../../shared/services/sessionsService';

export const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
};

export const getParticipantList = (session: MentorSession): SessionParticipant[] => {
    if (session.participants && session.participants.length > 0) {
        return session.participants;
    }
    if (session.mentee) {
        return [session.mentee];
    }
    return [];
};

export const getPrimaryParticipantName = (session: MentorSession) => {
    const participants = getParticipantList(session);
    return participants[0]?.name || '';
};

export const attendanceStyleMap: Record<AttendanceStatus, { label: string; classes: string }> = {
    present: { label: 'Present', classes: 'tw-bg-green-50 tw-text-green-700' },
    late: { label: 'Late', classes: 'tw-bg-amber-50 tw-text-amber-700' },
    absent: { label: 'Absent', classes: 'tw-bg-red-50 tw-text-red-700' },
};

export const deriveAttendanceBadge = (session: MentorSession) => {
    const participants = getParticipantList(session);
    const primary = participants[0];
    const normalized = (primary?.status || '').toString().toLowerCase();
    const validStatus = (['present', 'absent', 'late'] as AttendanceStatus[]).includes(normalized as AttendanceStatus)
        ? (normalized as AttendanceStatus)
        : undefined;

    let finalStatus: AttendanceStatus | undefined = validStatus;
    if (!finalStatus && (session.status === 'completed' || session.status === 'overdue')) {
        finalStatus = session.attended ? 'present' : 'absent';
    }

    if (!finalStatus) {
        return {
            label: 'Not recorded',
            classes: 'tw-bg-gray-100 tw-text-gray-600',
            participantName: primary?.name,
        };
    }

    const style = attendanceStyleMap[finalStatus];
    return {
        label: style.label,
        classes: style.classes,
        participantName: primary?.name,
    };
};

export const canRecordAttendance = (session: MentorSession | null): boolean => {
    if (!session) {
        return false;
    }

    if (session.status === 'completed' || session.status === 'overdue') {
        return true;
    }

    const startTime = Date.parse(session.date);
    if (Number.isNaN(startTime)) {
        return false;
    }

    return Date.now() >= startTime;
};

export const canCancelSession = (session: MentorSession | null): boolean => {
    if (!session) {
        return false;
    }

    const status = session.status || (session.attended ? 'completed' : 'upcoming');
    if (status === 'cancelled' || status === 'completed' || status === 'overdue') {
        return false;
    }

    const startTime = Date.parse(session.date);
    if (Number.isNaN(startTime)) {
        return false;
    }

    return startTime > Date.now();
};

export const SESSION_CANCEL_PENALTY_HOURS = 6;

export const getHoursUntilSession = (session: MentorSession | null): number | null => {
    if (!session) {
        return null;
    }

    const startTime = Date.parse(session.date);
    if (Number.isNaN(startTime)) {
        return null;
    }

    return (startTime - Date.now()) / 3_600_000;
};

export const formatTimeUntil = (hoursUntil: number | null): string => {
    if (hoursUntil == null) {
        return 'this session starts soon';
    }

    if (hoursUntil <= 0) {
        return 'this session has started';
    }

    const totalMinutes = Math.max(1, Math.round(hoursUntil * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) {
        return `${minutes}m`;
    }

    if (minutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
};