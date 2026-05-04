import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logger from '../../shared/utils/logger';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import RecaptchaField from '../../components/common/RecaptchaField.jsx';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
const buildApiUrl = (path) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

// ── Validation helpers ──────────────────────────────────────────────────────
const LETTERS_ONLY = /^[A-Za-zÀ-ÿ\s'-]+$/;
const validateName = (value) => {
  if (!value.trim()) return 'This field is required.';
  if (!LETTERS_ONLY.test(value)) return 'Only letters, spaces, hyphens, and apostrophes are allowed.';
  return null;
};

// ── Shared sub-components ──────────────────────────────────────────────────
const SectionHeader = ({ step, title, description }) => (
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

const FieldLabel = ({ htmlFor, children, optional }) => (
    <label htmlFor={htmlFor} className="tw-block tw-mb-2 tw-text-[11px] tw-font-bold tw-tracking-[0.15em] tw-uppercase tw-text-slate-500">
        {children}
        {optional && <span className="tw-ml-1.5 tw-normal-case tw-font-medium tw-text-slate-400 tw-tracking-normal">(optional)</span>}
    </label>
);

const textInputCls = "tw-w-full tw-h-12 tw-px-4 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-[#fbfcfd] focus:tw-bg-white focus:tw-border-primary focus:tw-ring-4 focus:tw-ring-primary/15 tw-outline-none tw-transition-all tw-text-sm tw-text-gray-900 tw-placeholder-gray-400";
const errorInputCls = "tw-w-full tw-h-12 tw-px-4 tw-rounded-xl tw-border tw-border-red-300 tw-bg-[#fbfcfd] focus:tw-bg-white focus:tw-border-red-500 focus:tw-ring-4 focus:tw-ring-red-500/15 tw-outline-none tw-transition-all tw-text-sm tw-text-gray-900 tw-placeholder-gray-400";
const textareaCls = "tw-w-full tw-p-4 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-[#fbfcfd] focus:tw-bg-white focus:tw-border-primary focus:tw-ring-4 focus:tw-ring-primary/15 tw-outline-none tw-transition-all tw-text-sm tw-text-gray-900 tw-placeholder-gray-400 tw-resize-none";
const fileInputLabelCls = "tw-flex tw-items-center tw-justify-center tw-w-full tw-h-12 tw-px-4 tw-border-2 tw-border-dashed tw-border-gray-200 hover:tw-border-primary/50 tw-bg-[#fbfcfd] hover:tw-bg-primary/5 tw-rounded-xl tw-cursor-pointer tw-transition-all tw-text-sm tw-text-gray-600 tw-font-medium group";

const ChipButton = ({ selected, onClick, children }) => (
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

const Card = ({ children, className = '' }) => (
    <div className={`tw-bg-white tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow tw-duration-300 tw-p-6 md:tw-p-8 ${className}`}>
        {children}
    </div>
);

// ── Main form ──────────────────────────────────────────────────────────────
export default function MenteeApplicationForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    yearLevel: '',
    program: '',
    specificSkills: '',
    major: '',
    programmingLanguage: '',
    motivation: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [corFile, setCorFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaError, setRecaptchaError] = useState('');
  const recaptchaRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.firstname || !userData.lastname || !userData.email) {
      setError('User data missing. Please log in again.');
    } else {
      setForm(prev => ({
        ...prev,
        firstname: userData.firstname,
        lastname: userData.lastname,
        email: userData.email
      }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleNameChange = (e) => {
    const { name, value } = e.target;
    const sanitized = value.replace(/[^A-Za-zÀ-ÿ\s'-]/g, '');
    setForm(prev => ({ ...prev, [name]: sanitized }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleNameBlur = (e) => {
    const { name, value } = e.target;
    const err = validateName(value);
    setFieldErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleFileChange = (e) => {
    setCorFile(e.target.files[0]);
  };

  const handleMajorSelect = (major) => {
    setForm(prev => ({ ...prev, major, programmingLanguage: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRecaptchaError('');
    if (!recaptchaToken) {
      setRecaptchaError('Please complete the verification step.');
      return;
    }
    const firstnameErr = validateName(form.firstname);
    const lastnameErr = validateName(form.lastname);
    if (firstnameErr || lastnameErr) {
      setFieldErrors({ firstname: firstnameErr, lastname: lastnameErr });
      setError('Please fix the name fields before submitting.');
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key]) formData.append(key, form[key]);
      });
      if (corFile) formData.append('corFile', corFile);
      formData.append('recaptchaToken', recaptchaToken);

      const response = await fetch(buildApiUrl('/mentee/application/submit'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to submit application. Please try again.');
        return;
      }

      const data = await response.json().catch(() => ({}));
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...storedUser,
        applicationStatus: data?.applicationStatus || 'pending',
        applicationRole: 'mentee'
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      navigate('/mentee/pending');
    } catch (err) {
      logger.error('Mentee application submission failed:', err);
      setError('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken('');
    }
  };

  const majors = [
    'Computer Programming',
    'Web Development', 
    'Database Management',
    'Networking'
  ];
  
  const majorTechnologyOptions = {
    'Computer Programming': ['C', 'C++', 'Java', 'Python', 'C#', 'Go'],
    'Web Development': ['HTML & CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Node.js', 'Express', 'PHP', 'Laravel'],
    'Database Management': ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Oracle Database'],
    'Networking': ['Cisco IOS commands', 'MikroTik RouterOS', 'Linux networking tools', 'Firewall configuration', 'Network troubleshooting tools']
  };

  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  return (
    <DashboardLayout>
      <div className="tw-min-h-screen tw-bg-gray-50 tw-py-10">
        <div className="tw-max-w-4xl tw-mx-auto tw-px-4">
          
          {/* Header */}
          <div className="tw-mb-8 tw-pl-4 tw-border-l-4 tw-border-primary">
            <p className="tw-text-xs tw-font-bold tw-tracking-widest tw-text-primary tw-uppercase tw-mb-1">Apply</p>
            <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-tracking-tight">Mentee Application Form</h1>
            <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
              Complete your application to join the mentoring program and accelerate your growth.
            </p>
          </div>

          {/* Role hint */}
          <div className="tw-mb-6 tw-bg-primary/5 tw-border tw-border-primary/20 tw-rounded-2xl tw-p-5 tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-justify-between tw-gap-4">
            <div>
              <p className="tw-text-sm tw-font-semibold tw-text-gray-900">Not the right path?</p>
              <p className="tw-text-sm tw-text-gray-600 tw-mt-0.5">If you meant to register as a Mentor instead, you can change your role.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/role-selection')}
              className="tw-flex-shrink-0 tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-white tw-text-primary tw-border tw-border-gray-200 tw-shadow-[0_2px_0_rgba(0,0,0,0.06)] hover:tw-border-primary hover:tw-bg-gray-50 active:tw-shadow-none active:tw-translate-y-[2px] tw-px-4 tw-py-2 tw-text-sm tw-font-bold tw-transition-all"
            >
              Change Role
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="tw-space-y-6">
            {error && (
              <div className="tw-p-4 tw-bg-red-50 tw-border tw-border-red-100 tw-rounded-xl tw-text-sm tw-text-red-700 tw-font-medium">
                {error}
              </div>
            )}

            {/* 1. Personal Information */}
            <Card>
              <SectionHeader step={1} title="Personal Information" description="Verify your name and institutional email address." />
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-5">
                <div>
                  <FieldLabel htmlFor="firstname">First name</FieldLabel>
                  <input
                    id="firstname" type="text" name="firstname"
                    value={form.firstname} onChange={handleNameChange} onBlur={handleNameBlur}
                    className={fieldErrors.firstname ? errorInputCls : textInputCls}
                    required pattern="[A-Za-zÀ-ÿ\s'\-]+" title="Only letters, spaces, hyphens, and apostrophes are allowed"
                  />
                  {fieldErrors.firstname && <p className="tw-mt-1.5 tw-text-xs tw-text-red-600 tw-font-medium">{fieldErrors.firstname}</p>}
                </div>
                <div>
                  <FieldLabel htmlFor="lastname">Last name</FieldLabel>
                  <input
                    id="lastname" type="text" name="lastname"
                    value={form.lastname} onChange={handleNameChange} onBlur={handleNameBlur}
                    className={fieldErrors.lastname ? errorInputCls : textInputCls}
                    required pattern="[A-Za-zÀ-ÿ\s'\-]+" title="Only letters, spaces, hyphens, and apostrophes are allowed"
                  />
                  {fieldErrors.lastname && <p className="tw-mt-1.5 tw-text-xs tw-text-red-600 tw-font-medium">{fieldErrors.lastname}</p>}
                </div>
                <div>
                  <FieldLabel htmlFor="email">Institutional email</FieldLabel>
                  <input
                    id="email" type="email" name="email"
                    value={form.email} onChange={handleInputChange}
                    className={textInputCls} required readOnly
                  />
                </div>
              </div>
            </Card>

            {/* 2. Academic Background */}
            <Card>
              <SectionHeader step={2} title="Academic Background" description="Tell us about your learning journey." />
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-5">
                <div>
                  <FieldLabel htmlFor="yearLevel">Year Level</FieldLabel>
                  <select
                    id="yearLevel" name="yearLevel"
                    value={form.yearLevel} onChange={handleInputChange}
                    className={textInputCls} required
                  >
                    <option value="">Select Year Level</option>
                    {yearLevels.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="program">Program / Degree</FieldLabel>
                  <select
                    id="program" name="program"
                    value={form.program} onChange={handleInputChange}
                    className={textInputCls} required
                  >
                    <option value="" disabled>Select your program</option>
                    <option value="BSIT">BSIT</option>
                    <option value="BSEMC">BSEMC</option>
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="corFile">Certificate of Registration</FieldLabel>
                  <label htmlFor="corFile" className={fileInputLabelCls}>
                    <svg className="tw-w-5 tw-h-5 tw-mr-2 tw-text-slate-400 group-hover:tw-text-primary tw-transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="tw-truncate">{corFile ? corFile.name : 'Upload COR (.pdf, .jpg, .png)'}</span>
                    <input
                      id="corFile" type="file" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange} className="tw-hidden" required
                    />
                  </label>
                </div>
              </div>
            </Card>

            {/* 3. Area of Interest */}
            <Card>
              <SectionHeader step={3} title="Area of Interest" description="Choose a major based on your interest, then select your preferred technology." />
              <div className="tw-mb-6">
                <FieldLabel>Major / Field</FieldLabel>
                <div className="tw-flex tw-flex-wrap tw-gap-3">
                  {majors.map(major => (
                    <ChipButton key={major} selected={form.major === major} onClick={() => handleMajorSelect(major)}>
                      {major}
                    </ChipButton>
                  ))}
                </div>
              </div>
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-5">
                <div>
                  <FieldLabel htmlFor="programmingLanguage">Preferred Technology</FieldLabel>
                  <select
                    id="programmingLanguage" name="programmingLanguage"
                    value={form.programmingLanguage} onChange={handleInputChange}
                    className={textInputCls} required disabled={!form.major}
                  >
                    <option value="">{form.major ? 'Select technology' : 'Select a major first'}</option>
                    {(majorTechnologyOptions[form.major] || []).map((tech) => (
                      <option key={tech} value={tech}>{tech}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="specificSkills">Primary Mentoring Goal</FieldLabel>
                  <select
                    id="specificSkills" name="specificSkills"
                    value={form.specificSkills} onChange={handleInputChange}
                    className={textInputCls} required
                  >
                    <option value="">Select your goal</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Data Analysis">Data Analysis</option>
                    <option value="Database Management">Database Management</option>
                    <option value="Networking">Networking</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Game Development">Game Development</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* 4. Motivation */}
            <Card>
              <SectionHeader step={4} title="Motivation" description="Optional context to help match you with the perfect mentor." />
              <div>
                <FieldLabel htmlFor="motivation" optional>Why do you want to join this program?</FieldLabel>
                <textarea
                  id="motivation" name="motivation"
                  value={form.motivation} onChange={handleInputChange}
                  rows={4} placeholder="Tell us about your goals and what you hope to achieve..."
                  className={textareaCls}
                />
              </div>
            </Card>

            {/* Captcha & Submit */}
            <Card>
              <RecaptchaField
                ref={recaptchaRef}
                onChange={(token) => { setRecaptchaToken(token || ''); if (token) setRecaptchaError(''); }}
                onExpired={() => { setRecaptchaToken(''); setRecaptchaError('Verification expired, please try again.'); }}
              />
              {recaptchaError && <p className="tw-mt-2 tw-text-xs tw-font-medium tw-text-red-600">{recaptchaError}</p>}
              <div className="tw-flex tw-justify-end tw-pt-6 tw-mt-6 tw-border-t tw-border-gray-100">
                <button
                  type="submit" disabled={loading}
                  className="tw-px-8 tw-py-3.5 tw-bg-primary hover:tw-bg-primary/90 tw-text-white tw-font-bold tw-rounded-xl tw-transition-all tw-text-sm tw-tracking-wide tw-uppercase disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_0_4px_14px_rgba(var(--color-primary),0.3)] active:tw-shadow-none active:tw-translate-y-[3px]"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </Card>

          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

