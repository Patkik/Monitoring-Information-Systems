import React, { useEffect, useRef, useState } from 'react';
import logger from '../../shared/utils/logger';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import RecaptchaField from '../../components/common/RecaptchaField.jsx';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const buildApiUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

const expertiseOptions = [
    'Web Development', 'Mobile Development', 'Data Science', 'UI/UX Design',
    'Cloud Computing', 'Cybersecurity', 'Project Management', 'Product Strategy',
];

const mentoringTopicsOptions = [
    'Career Guidance', 'Technical Coaching', 'Soft Skills', 'Interview Preparation',
    'Leadership', 'Capstone Support', 'Entrepreneurship', 'Research Mentoring',
];

const availabilityDaysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const meetingFormatsOptions   = ['On-site', 'Virtual', 'Hybrid'];

// ── Shared sub-components ──────────────────────────────────────────────────

const SectionHeader: React.FC<{ step: number; title: string; description?: string }> = ({ step, title, description }) => (
    <div className="tw-flex tw-items-start tw-gap-4 tw-mb-6">
        <div className="tw-flex-shrink-0 tw-w-8 tw-h-8 tw-rounded-full tw-bg-primary/10 tw-flex tw-items-center tw-justify-center">
            <span className="tw-text-xs tw-font-bold tw-text-primary">{step}</span>
        </div>
        <div>
            <h2 className="tw-text-lg tw-font-bold tw-text-gray-900">{title}</h2>
            {description && <p className="tw-text-sm tw-text-gray-500 tw-mt-0.5">{description}</p>}
        </div>
    </div>
);

const FieldLabel: React.FC<{ htmlFor?: string; children: React.ReactNode; optional?: boolean }> = ({ htmlFor, children, optional }) => (
    <label htmlFor={htmlFor} className="tw-block tw-text-xs tw-font-bold tw-tracking-wide tw-uppercase tw-text-gray-500 tw-mb-1.5">
        {children}
        {optional && <span className="tw-ml-1.5 tw-normal-case tw-font-normal tw-text-gray-400">(optional)</span>}
    </label>
);

const textInputCls = "tw-w-full tw-px-3.5 tw-py-2.5 tw-border tw-border-gray-200 focus:tw-border-primary tw-rounded-lg tw-text-sm tw-text-gray-900 tw-placeholder-gray-400 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary/20 tw-transition-colors";

const ChipButton: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`tw-px-3.5 tw-py-2 tw-rounded-lg tw-text-sm tw-font-semibold tw-transition-all tw-duration-150 tw-border ${
            selected
                ? 'tw-bg-primary tw-text-white tw-border-primary tw-shadow-sm'
                : 'tw-bg-white tw-text-gray-600 tw-border-gray-200 hover:tw-border-primary/40 hover:tw-text-primary'
        }`}
    >
        {children}
    </button>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`tw-bg-white tw-rounded-xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-6 ${className}`}>
        {children}
    </div>
);

// ── Main form ──────────────────────────────────────────────────────────────

export default function MentorApplicationForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        firstname: '', lastname: '', email: '',
        currentRole: '', organization: '',
        educationRole: 'student',
        educationProgram: '', educationYearLevel: '', educationMajor: '',
        yearsOfExperience: '', mentoringGoals: '', professionalSummary: '',
        achievements: '', linkedinUrl: '', portfolioUrl: '', motivation: '',
        availabilityHoursPerWeek: '',
        expertiseAreas: [] as string[],
        mentoringTopics: [] as string[],
        availabilityDays: [] as string[],
        meetingFormats: [] as string[],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [recaptchaToken, setRecaptchaToken] = useState('');
    const [recaptchaError, setRecaptchaError] = useState('');
    const recaptchaRef = useRef<any>(null);

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
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
        setRecaptchaError('');
        if (!recaptchaToken) { setRecaptchaError('Please complete the verification step.'); return; }

        const trimmedProgram = form.educationProgram.trim();
        const trimmedYear    = form.educationYearLevel.trim();

        if (!trimmedProgram) { setError('Program / Department is required.'); return; }
        if (form.educationRole === 'student' && !trimmedYear) { setError('Year level is required for students.'); return; }

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
                    yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
                    availabilityHoursPerWeek: form.availabilityHoursPerWeek ? Number(form.availabilityHoursPerWeek) : undefined,
                    recaptchaToken,
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
            recaptchaRef.current?.reset();
            setRecaptchaToken('');
        }
    };

    return (
        <DashboardLayout>
            <div className="tw-min-h-screen tw-bg-gray-50 tw-py-10">
                <div className="tw-max-w-4xl tw-mx-auto tw-px-4">

                    {/* ── Page Header ── */}
                    <div className="tw-mb-8 tw-pl-4 tw-border-l-4 tw-border-primary">
                        <p className="tw-text-xs tw-font-bold tw-tracking-widest tw-text-primary tw-uppercase tw-mb-1">Apply</p>
                        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900">Mentor Application</h1>
                        <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                            Share your expertise to help mentees accelerate their growth.
                        </p>
                    </div>

                    {/* ── Role hint ── */}
                    <div className="tw-mb-6 tw-bg-primary/5 tw-border tw-border-primary/20 tw-rounded-xl tw-p-4 tw-flex tw-items-center tw-justify-between tw-gap-4">
                        <p className="tw-text-sm tw-text-gray-600">
                            Not the right path? If you meant to register as a Mentee instead, you can change your role.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/role-selection')}
                            className="tw-flex-shrink-0 tw-inline-flex tw-items-center tw-rounded-lg tw-bg-white tw-text-primary tw-border tw-border-primary/30 hover:tw-border-primary tw-px-3.5 tw-py-1.5 tw-text-sm tw-font-semibold tw-transition-colors"
                        >
                            Change role
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
                                {[
                                    { label: 'First name', name: 'firstname', type: 'text', required: true },
                                    { label: 'Last name',  name: 'lastname',  type: 'text', required: true },
                                    { label: 'Institutional email', name: 'email', type: 'email', required: true },
                                ].map(({ label, name, type, required }) => (
                                    <div key={name}>
                                        <FieldLabel htmlFor={name}>{label}</FieldLabel>
                                        <input
                                            id={name} type={type} name={name}
                                            value={(form as any)[name]} onChange={handleInputChange}
                                            className={textInputCls} required={required}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* 2 ── Academic Background */}
                        <Card>
                            <SectionHeader
                                step={2}
                                title="Academic / Teaching Background"
                                description="Tell us whether you currently mentor as a student peer or an instructor."
                            />
                            <fieldset className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3 tw-mb-5" aria-label="Education role">
                                <legend className="tw-sr-only">Education role</legend>
                                {(['student', 'instructor'] as const).map((role) => {
                                    const selected = form.educationRole === role;
                                    return (
                                        <label
                                            key={role}
                                            className={`tw-rounded-xl tw-border tw-p-4 tw-text-left tw-transition-all tw-cursor-pointer ${
                                                selected
                                                    ? 'tw-border-primary tw-bg-primary/5 tw-ring-1 tw-ring-primary/20'
                                                    : 'tw-border-gray-200 tw-bg-white hover:tw-border-gray-300'
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
                                            <span className={`tw-block tw-font-bold tw-text-sm tw-mb-0.5 ${selected ? 'tw-text-primary' : 'tw-text-gray-800'}`}>
                                                {role === 'student' ? 'Student mentor' : 'Instructor / Faculty'}
                                            </span>
                                            <span className="tw-text-xs tw-text-gray-500">
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
                                    <input id="educationProgram" type="text" name="educationProgram"
                                        value={form.educationProgram} onChange={handleInputChange}
                                        placeholder={form.educationRole === 'instructor' ? 'e.g., BSIT Faculty' : 'e.g., BSIT'}
                                        className={textInputCls} required />
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

                        {/* 3 ── Professional Background */}
                        <Card>
                            <SectionHeader step={3} title="Professional Background" />
                            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-5">
                                <div>
                                    <FieldLabel htmlFor="currentRole">Current role / position</FieldLabel>
                                    <input id="currentRole" type="text" name="currentRole"
                                        value={form.currentRole} onChange={handleInputChange}
                                        placeholder="e.g., Senior Software Engineer" className={textInputCls} required />
                                </div>
                                <div>
                                    <FieldLabel htmlFor="organization" optional>Organization / affiliation</FieldLabel>
                                    <input id="organization" type="text" name="organization"
                                        value={form.organization} onChange={handleInputChange}
                                        placeholder="Company, Institution, or Organization" className={textInputCls} />
                                </div>
                                <div>
                                    <FieldLabel htmlFor="yearsOfExperience">Years of experience</FieldLabel>
                                    <input id="yearsOfExperience" type="number" min="0" name="yearsOfExperience"
                                        value={form.yearsOfExperience} onChange={handleInputChange}
                                        placeholder="e.g., 5"
                                        className={textInputCls} required />
                                </div>
                                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                                    <div>
                                        <FieldLabel htmlFor="linkedinUrl" optional>LinkedIn</FieldLabel>
                                        <input id="linkedinUrl" type="url" name="linkedinUrl"
                                            value={form.linkedinUrl} onChange={handleInputChange}
                                            placeholder="https://" className={textInputCls} />
                                    </div>
                                    <div>
                                        <FieldLabel htmlFor="portfolioUrl" optional>Portfolio</FieldLabel>
                                        <input id="portfolioUrl" type="url" name="portfolioUrl"
                                            value={form.portfolioUrl} onChange={handleInputChange}
                                            placeholder="https://" className={textInputCls} />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* 4 ── Areas of Expertise */}
                        <Card>
                            <SectionHeader
                                step={4}
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

                        {/* 5 ── Mentoring Focus */}
                        <Card>
                            <SectionHeader
                                step={5}
                                title="Mentoring Focus"
                                description="Indicate the topics you are most comfortable guiding mentees through."
                            />
                            <div className="tw-flex tw-flex-wrap tw-gap-2.5">
                                {mentoringTopicsOptions.map((opt) => (
                                    <ChipButton key={opt} selected={form.mentoringTopics.includes(opt)} onClick={() => toggleSelection('mentoringTopics', opt)}>
                                        {opt}
                                    </ChipButton>
                                ))}
                            </div>
                        </Card>

                        {/* 6 ── Availability */}
                        <Card>
                            <SectionHeader step={6} title="Availability & Commitment" />
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

                        {/* 7 ── Mentorship Style */}
                        <Card>
                            <SectionHeader step={7} title="Your Mentorship Style" />
                            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-5">
                                {[
                                    { label: 'Professional summary', name: 'professionalSummary', placeholder: 'Highlight your expertise, teaching style, and mentoring philosophy.', required: true },
                                    { label: 'Notable achievements', name: 'achievements', placeholder: 'Awards, certifications, successful projects, or mentorship highlights.', optional: true },
                                    { label: 'Mentoring goals', name: 'mentoringGoals', placeholder: 'What outcomes do you hope your mentees achieve?', required: true },
                                    { label: 'Why do you want to mentor?', name: 'motivation', placeholder: 'Tell us about your motivation for joining the mentoring program.', optional: true },
                                ].map(({ label, name, placeholder, required, optional }) => (
                                    <div key={name}>
                                        <FieldLabel htmlFor={name} optional={optional}>{label}</FieldLabel>
                                        <textarea id={name} name={name}
                                            value={(form as any)[name]} onChange={handleInputChange}
                                            rows={4} placeholder={placeholder} required={required}
                                            className={`${textInputCls} tw-resize-none`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* ── Captcha & Submit ── */}
                        <Card>
                            <RecaptchaField
                                ref={recaptchaRef}
                                onChange={(token: string | null) => { setRecaptchaToken(token || ''); if (token) setRecaptchaError(''); }}
                                onExpired={() => { setRecaptchaToken(''); setRecaptchaError('Verification expired, please try again.'); }}
                            />
                            {recaptchaError && (
                                <p className="tw-mt-2 tw-text-xs tw-font-medium tw-text-red-600">{recaptchaError}</p>
                            )}
                            <div className="tw-flex tw-justify-end tw-pt-6 tw-border-t tw-border-gray-100 tw-mt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="tw-px-8 tw-py-3 tw-bg-primary hover:tw-bg-primary/90 tw-text-white tw-font-bold tw-rounded-xl tw-transition-colors tw-text-sm tw-tracking-wide tw-uppercase disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
                                >
                                    {loading ? 'Submitting…' : 'Submit Application'}
                                </button>
                            </div>
                        </Card>

                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
