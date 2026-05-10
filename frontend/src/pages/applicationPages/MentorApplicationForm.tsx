import React, { useEffect, useState } from 'react';
import logger from '../../shared/utils/logger';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../shared/config/apiClient';

const expertiseOptions = [
    'Web Development', 'Mobile Development', 'Data Science', 'UI/UX Design',
    'Cloud Computing', 'Cybersecurity', 'Project Management', 'Product Strategy',
];

// Academic-only mentoring topics
const mentoringTopicsOptions = [
    'Academic Tutoring', 'Thesis / Capstone Support', 'Study Skills',
    'Research Methodology', 'Course Guidance', 'Lab / Practicum Help',
    'Academic Writing', 'Exam Preparation',
];

const availabilityDaysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const meetingFormatsOptions   = ['On-site', 'Virtual', 'Hybrid'];

// Role dropdown options
const roleOptions = [
    { value: '', label: 'Select your role' },
    { value: 'Student Peer Mentor', label: 'Student Peer Mentor' },
    { value: 'Teaching Assistant', label: 'Teaching Assistant' },
    { value: 'Instructor', label: 'Instructor' },
    { value: 'Faculty Advisor', label: 'Faculty Advisor' },
    { value: 'Lab Facilitator', label: 'Lab Facilitator' },
    { value: 'Research Mentor', label: 'Research Mentor' },
];

// ── Validation helpers ──────────────────────────────────────────────────────
const LETTERS_ONLY = /^[A-Za-zÀ-ÿ\s'-]+$/;

const validateName = (value: string): string | null => {
    if (!value.trim()) return 'This field is required.';
    if (!LETTERS_ONLY.test(value)) return 'Only letters, spaces, hyphens, and apostrophes are allowed.';
    return null;
};

// ── Shared sub-components ──────────────────────────────────────────────────

const SectionHeader: React.FC<{ step: number; title: string; description?: string }> = ({ step, title, description }) => (
    <div className="tw-flex tw-items-start tw-gap-4 tw-mb-6">
        <div className="tw-flex-shrink-0 tw-w-10 tw-h-10 tw-rounded-2xl tw-bg-primary/10 tw-flex tw-items-center tw-justify-center tw-text-primary tw-font-bold tw-text-sm tw-shadow-sm tw-border tw-border-primary/20">
            {step}
        </div>
        <div className="tw-flex-1">
            <h2 className="tw-text-xl tw-font-bold tw-text-gray-900 tw-tracking-tight">{title}</h2>
            {description && <p className="tw-text-sm tw-text-gray-500 tw-mt-1 tw-leading-relaxed">{description}</p>}
        </div>
    </div>
);

const FieldLabel: React.FC<{ htmlFor?: string; children: React.ReactNode; optional?: boolean }> = ({ htmlFor, children, optional }) => (
    <label htmlFor={htmlFor} className="tw-block tw-mb-2 tw-text-[11px] tw-font-bold tw-tracking-[0.15em] tw-uppercase tw-text-slate-500">
        {children}
        {optional && <span className="tw-ml-1.5 tw-normal-case tw-font-medium tw-text-slate-400 tw-tracking-normal">(optional)</span>}
    </label>
);

const textInputCls = "tw-w-full tw-h-12 tw-px-4 tw-rounded-xl tw-border tw-border-gray-300 dark:tw-border-white/10 tw-bg-[#fbfcfd] dark:tw-bg-[#151226] focus:tw-bg-white dark:focus:tw-bg-[#1e1a34] focus:tw-border-primary dark:focus:tw-border-purple-400 focus:tw-ring-4 focus:tw-ring-primary/15 tw-outline-none tw-transition-all tw-text-sm tw-text-gray-900 dark:tw-text-white tw-placeholder-gray-400 dark:placeholder:tw-text-slate-500";
const errorInputCls = "tw-w-full tw-h-12 tw-px-4 tw-rounded-xl tw-border tw-border-red-400 dark:tw-border-red-500/50 tw-bg-[#fbfcfd] dark:tw-bg-[#151226] focus:tw-bg-white dark:focus:tw-bg-[#1e1a34] focus:tw-border-red-500 focus:tw-ring-4 focus:tw-ring-red-500/15 tw-outline-none tw-transition-all tw-text-sm tw-text-gray-900 dark:tw-text-white tw-placeholder-gray-400 dark:placeholder:tw-text-slate-500";

const ChipButton: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`tw-px-4 tw-py-2.5 tw-rounded-xl tw-text-sm tw-font-semibold tw-transition-all tw-duration-200 tw-border ${
            selected
                ? 'tw-bg-white tw-text-black tw-border-primary tw-ring-1 tw-ring-primary/20 tw-shadow-[0_2px_0_rgba(0,0,0,0.05)] tw-scale-[1.02] active:tw-shadow-none active:tw-translate-y-[2px]'
                : 'tw-bg-white tw-text-black tw-border-primary/40 tw-shadow-[0_2px_0_rgba(0,0,0,0.04)] hover:tw-border-primary hover:tw-bg-gray-50 active:tw-shadow-none active:tw-translate-y-[2px]'
        }`}
    >
        {children}
    </button>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`tw-bg-white dark:tw-bg-[#151226] tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-white/10 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow tw-duration-300 tw-p-6 md:tw-p-8 ${className}`}>
        {children}
    </div>
);

// ── Main form ──────────────────────────────────────────────────────────────

export default function MentorApplicationForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstname: '', lastname: '', email: '',
        currentRole: '',
        educationRole: 'student',
        educationProgram: '', educationYearLevel: '', educationMajor: '',
        mentoringGoals: '', motivation: '',
        availabilityHoursPerWeek: '',
        expertiseAreas: [] as string[],
        mentoringTopics: [] as string[],
        availabilityDays: [] as string[],
        meetingFormats: [] as string[],
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData.firstname || !userData.lastname || !userData.email) {
            setError('User data missing. Please log in again.');
        } else {
            setForm((prev) => ({
                ...prev,
                firstname: userData.firstname,
                lastname: userData.lastname,
                email: userData.email,
                educationRole: userData.profile?.education?.role || prev.educationRole,
                educationProgram: userData.profile?.education?.program || prev.educationProgram,
                educationYearLevel: userData.profile?.education?.yearLevel || prev.educationYearLevel,
                educationMajor: userData.profile?.education?.major || prev.educationMajor,
            }));
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));

        // Clear field error on change
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Allow only letters, spaces, hyphens, apostrophes
        const sanitized = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, '');
        setForm((prev) => ({ ...prev, [name]: sanitized }));

        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const err = validateName(value);
        setFieldErrors((prev) => ({ ...prev, [name]: err }));
    };

    const toggleSelection = (key: string, value: string) => {
        setForm((prev) => {
            const current = (prev as any)[key] as string[];
            return { ...prev, [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate names
        const firstnameErr = validateName(form.firstname);
        const lastnameErr = validateName(form.lastname);
        if (firstnameErr || lastnameErr) {
            setFieldErrors({ firstname: firstnameErr, lastname: lastnameErr });
            setError('Please fix the name fields before submitting.');
            return;
        }

        const trimmedProgram = form.educationProgram.trim();
        const trimmedYear    = form.educationYearLevel.trim();

        if (!trimmedProgram) { setError('Program / Department is required.'); return; }
        if (form.educationRole === 'student' && !trimmedYear) { setError('Year level is required for students.'); return; }
        if (!form.currentRole) { setError('Please select your role.'); return; }

        setLoading(true);
        try {
            const response = await fetch(buildApiUrl('/mentor/application/submit'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    educationProgram: trimmedProgram,
                    educationYearLevel: trimmedYear,
                    educationMajor: form.educationMajor.trim(),
                    availabilityHoursPerWeek: form.availabilityHoursPerWeek ? Number(form.availabilityHoursPerWeek) : undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                setError((errorData as any).message || 'Failed to submit application. Please try again.');
                return;
            }

            const data = await response.json().catch(() => ({}));
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...storedUser, applicationStatus: (data as any)?.applicationStatus || 'pending', applicationRole: 'mentor' }));
            navigate('/mentor/pending');
        } catch (err) {
            logger.error('Mentor application submission failed:', err);
            setError('Failed to submit application. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tw-min-h-screen tw-bg-gray-50 dark:tw-bg-[#0b0a10] tw-py-10">
            <div className="tw-max-w-4xl tw-mx-auto tw-px-4">

                    {/* ── Page Header ── */}
                    <div className="tw-mb-8 tw-pl-4 tw-border-l-4 tw-border-primary">
                        <p className="tw-text-xs tw-font-bold tw-tracking-widest tw-text-primary tw-uppercase tw-mb-1">Apply</p>
                        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 dark:tw-text-white tw-tracking-tight">Mentor Application Form</h1>
                        <p className="tw-text-sm tw-text-gray-500 dark:tw-text-slate-400 tw-mt-1">
                            Share your expertise to help mentees accelerate their growth.
                        </p>
                    </div>

                    {/* Role hint */}
                    <div className="tw-mb-6 tw-bg-primary/5 dark:tw-bg-primary/20 tw-border tw-border-primary/20 tw-rounded-2xl tw-p-5 tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-gap-4">
                        <div>
                            <p className="tw-text-sm tw-font-semibold tw-text-gray-900 dark:tw-text-white">Not the right path?</p>
                            <p className="tw-text-sm tw-text-gray-600 dark:tw-text-slate-400 tw-mt-0.5">If you meant to register as a Mentee instead, you can change your role.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/role-selection')}
                            className="tw-flex-shrink-0 tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-white dark:tw-bg-[#151226] tw-text-primary dark:tw-text-purple-400 tw-border tw-border-gray-200 dark:tw-border-white/10 tw-shadow-[0_2px_0_rgba(0,0,0,0.06)] hover:tw-border-primary hover:tw-bg-gray-50 dark:hover:tw-bg-white/5 active:tw-shadow-none active:tw-translate-y-[2px] tw-px-4 tw-py-2 tw-text-sm tw-font-bold tw-transition-all"
                        >
                            Change Role
                        </button>
                    </div>

                    {/* ── Form ── */}
                    <form onSubmit={handleSubmit} className="tw-space-y-5">

                        {error && (
                            <div className="tw-p-4 tw-bg-red-50 tw-border tw-border-red-100 tw-rounded-xl tw-text-sm tw-text-red-700 tw-font-medium">
                                {error}
                            </div>
                        )}

                        {/* 1 ── Personal Information */}
                        <Card>
                            <SectionHeader step={1} title="Personal Information" />
                            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-5">
                                <div>
                                    <FieldLabel htmlFor="firstname">First name</FieldLabel>
                                    <input
                                        id="firstname" type="text" name="firstname"
                                        value={form.firstname} onChange={handleNameChange}
                                        onBlur={handleNameBlur}
                                        className={fieldErrors.firstname ? errorInputCls : textInputCls}
                                        required
                                        pattern="[A-Za-zÀ-ÿ\s'\-]+"
                                        title="Only letters, spaces, hyphens, and apostrophes are allowed"
                                    />
                                    {fieldErrors.firstname && (
                                        <p className="tw-mt-1 tw-text-xs tw-text-red-600">{fieldErrors.firstname}</p>
                                    )}
                                </div>
                                <div>
                                    <FieldLabel htmlFor="lastname">Last name</FieldLabel>
                                    <input
                                        id="lastname" type="text" name="lastname"
                                        value={form.lastname} onChange={handleNameChange}
                                        onBlur={handleNameBlur}
                                        className={fieldErrors.lastname ? errorInputCls : textInputCls}
                                        required
                                        pattern="[A-Za-zÀ-ÿ\s'\-]+"
                                        title="Only letters, spaces, hyphens, and apostrophes are allowed"
                                    />
                                    {fieldErrors.lastname && (
                                        <p className="tw-mt-1 tw-text-xs tw-text-red-600">{fieldErrors.lastname}</p>
                                    )}
                                </div>
                                <div>
                                    <FieldLabel htmlFor="email">Institutional email</FieldLabel>
                                    <input
                                        id="email" type="email" name="email"
                                        value={form.email} onChange={handleInputChange}
                                        className={textInputCls} required
                                        placeholder="name@student.buksu.edu.ph"
                                        aria-label="Institutional email"
                                        title="Institutional email"
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* 2 ── Academic Background */}
                        <Card>
                            <SectionHeader
                                step={2}
                                title="Academic / Teaching Background"
                                description="Tell us whether you currently mentor as a student peer or an instructor."
                            />

                            {/* Role Dropdown */}
                            <div className="tw-mb-5">
                                <FieldLabel htmlFor="currentRole">Your Role</FieldLabel>
                                <select
                                    id="currentRole"
                                    name="currentRole"
                                    value={form.currentRole}
                                    onChange={handleInputChange}
                                    className={textInputCls}
                                    aria-label="Your role"
                                    title="Your role"
                                    required
                                >
                                    {roleOptions.map(opt => (
                                        <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <fieldset className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3 tw-mb-5" aria-label="Education role">
                                <legend className="tw-sr-only">Education role</legend>
                                {(['student', 'instructor'] as const).map((role) => {
                                    const selected = form.educationRole === role;
                                    return (
                                        <label
                                            key={role}
                                            className={`tw-rounded-xl tw-border tw-p-4 tw-text-left tw-transition-all tw-cursor-pointer ${
                                                selected
                                                    ? 'tw-border-primary tw-bg-primary/5 dark:tw-bg-primary/20 tw-ring-1 tw-ring-primary/20'
                                                    : 'tw-border-gray-200 dark:tw-border-white/10 tw-bg-white dark:tw-bg-[#151226] hover:tw-border-gray-300 dark:hover:tw-border-gray-500'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="educationRole"
                                                value={role}
                                                checked={selected}
                                                onChange={() => setForm((p) => ({ ...p, educationRole: role }))}
                                                className="tw-sr-only"
                                            />
                                            <span className={`tw-block tw-font-bold tw-text-sm tw-mb-0.5 ${selected ? 'tw-text-primary dark:tw-text-purple-400' : 'tw-text-gray-800 dark:tw-text-white'}`}>
                                                {role === 'student' ? 'Student mentor' : 'Instructor / Faculty'}
                                            </span>
                                            <span className="tw-text-xs tw-text-gray-500 dark:tw-text-slate-400">
                                                {role === 'student'
                                                    ? 'Currently enrolled student offering peer mentorship.'
                                                    : 'Faculty member, instructor, or teaching assistant mentoring students.'}
                                            </span>
                                        </label>
                                    );
                                })}
                            </fieldset>
                            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-5">
                                <div>
                                    <FieldLabel htmlFor="educationProgram">
                                        {form.educationRole === 'instructor' ? 'Program / Department' : 'Program'}
                                    </FieldLabel>
                                    <select id="educationProgram" name="educationProgram"
                                        value={form.educationProgram} onChange={handleInputChange}
                                        className={textInputCls} required
                                        aria-label="Program"
                                        title="Program"
                                    >
                                        <option value="" disabled>Select your program</option>
                                        <option value="BSIT">BSIT</option>
                                        <option value="BSEMC">BSEMC</option>
                                    </select>
                                </div>
                                <div>
                                    <FieldLabel htmlFor="educationYearLevel">
                                        {form.educationRole === 'instructor' ? 'Teaching year / note' : 'Year level'}
                                    </FieldLabel>
                                    <input id="educationYearLevel" type="text" name="educationYearLevel"
                                        value={form.educationYearLevel} onChange={handleInputChange}
                                        placeholder={form.educationRole === 'instructor' ? 'e.g., 3rd year sections' : 'e.g., 3rd year'}
                                        className={textInputCls} required={form.educationRole === 'student'} />
                                </div>
                                <div>
                                    <FieldLabel htmlFor="educationMajor" optional>
                                        {form.educationRole === 'instructor' ? 'Specialization / track' : 'Major'}
                                    </FieldLabel>
                                    <input id="educationMajor" type="text" name="educationMajor"
                                        value={form.educationMajor} onChange={handleInputChange}
                                        placeholder={form.educationRole === 'instructor' ? 'e.g., Advanced Databases' : 'e.g., Network Security'}
                                        className={textInputCls} />
                                </div>
                            </div>
                        </Card>

                        {/* 3 ── Areas of Expertise */}
                        <Card>
                            <SectionHeader
                                step={3}
                                title="Areas of Expertise"
                                description="Select the domains where you can provide the most value. Choose all that apply."
                            />
                            <div className="tw-flex tw-flex-wrap tw-gap-2.5">
                                {expertiseOptions.map((opt) => (
                                    <ChipButton key={opt} selected={form.expertiseAreas.includes(opt)} onClick={() => toggleSelection('expertiseAreas', opt)}>
                                        {opt}
                                    </ChipButton>
                                ))}
                            </div>
                        </Card>

                        {/* 4 ── Mentoring Focus (Academic Only) */}
                        <Card>
                            <SectionHeader
                                step={4}
                                title="Mentoring Focus"
                                description="Indicate the academic topics you are most comfortable guiding mentees through."
                            />
                            <div className="tw-flex tw-flex-wrap tw-gap-2.5">
                                {mentoringTopicsOptions.map((opt) => (
                                    <ChipButton key={opt} selected={form.mentoringTopics.includes(opt)} onClick={() => toggleSelection('mentoringTopics', opt)}>
                                        {opt}
                                    </ChipButton>
                                ))}
                            </div>
                        </Card>

                        {/* 5 ── Availability */}
                        <Card>
                            <SectionHeader step={5} title="Availability & Commitment" />
                            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-8">
                                <div>
                                    <FieldLabel>Preferred days</FieldLabel>
                                    <div className="tw-flex tw-flex-wrap tw-gap-2">
                                        {availabilityDaysOptions.map((day) => (
                                            <ChipButton key={day} selected={form.availabilityDays.includes(day)} onClick={() => toggleSelection('availabilityDays', day)}>
                                                {day}
                                            </ChipButton>
                                        ))}
                                    </div>
                                </div>
                                <div className="tw-space-y-5">
                                    <div>
                                        <FieldLabel htmlFor="availabilityHoursPerWeek" optional>Hours per week</FieldLabel>
                                        <input id="availabilityHoursPerWeek" type="number" min="1" name="availabilityHoursPerWeek"
                                            value={form.availabilityHoursPerWeek} onChange={handleInputChange}
                                            placeholder="e.g., 3" className={textInputCls} />
                                    </div>
                                    <div>
                                        <FieldLabel>Session format</FieldLabel>
                                        <div className="tw-flex tw-flex-wrap tw-gap-2">
                                            {meetingFormatsOptions.map((fmt) => (
                                                <ChipButton key={fmt} selected={form.meetingFormats.includes(fmt)} onClick={() => toggleSelection('meetingFormats', fmt)}>
                                                    {fmt}
                                                </ChipButton>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 6 ── Mentorship Style */}
                        <Card>
                            <SectionHeader step={6} title="Your Mentorship Style" />
                            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-5">
                                <div>
                                    <FieldLabel htmlFor="mentoringGoals">Mentoring goals</FieldLabel>
                                    <textarea id="mentoringGoals" name="mentoringGoals"
                                        value={form.mentoringGoals} onChange={handleInputChange}
                                        rows={4} placeholder="What outcomes do you hope your mentees achieve?" required
                                        className={`${textInputCls} tw-resize-none`}
                                    />
                                </div>
                                <div>
                                    <FieldLabel htmlFor="motivation" optional>Why do you want to mentor?</FieldLabel>
                                    <textarea id="motivation" name="motivation"
                                        value={form.motivation} onChange={handleInputChange}
                                        rows={4} placeholder="Tell us about your motivation for joining the mentoring program."
                                        className={`${textInputCls} tw-resize-none`}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* ── Submit ── */}
                        <Card>
                            <div className="tw-flex tw-justify-end tw-pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="tw-px-8 tw-py-3.5 tw-bg-primary hover:tw-bg-primary/90 tw-text-white tw-font-bold tw-rounded-xl tw-transition-all tw-text-sm tw-tracking-wide tw-uppercase disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_0_4px_14px_rgba(var(--color-primary),0.3)] active:tw-shadow-none active:tw-translate-y-[3px]"
                                >
                                    {loading ? 'Submitting…' : 'Submit Application'}
                                </button>
                            </div>
                        </Card>

                    </form>
                </div>
            </div>
        </div>
    );
}
