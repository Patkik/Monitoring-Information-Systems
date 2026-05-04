import React, { useState } from 'react';

const ApplicationForm: React.FC = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    contact: '',
    yearSection: '',
    email: '',
    program: ''
  });

  const [selectedMajor, setSelectedMajor] = useState<string>('');

  const majors = [
    'Computer Programming',
    'Web Development',
    'Database Management',
    'Networking'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submission handled by backend API in later iteration. Keep handler minimal.
  };

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-8">
      <p className="tw-text-sm tw-text-gray-600 tw-mb-6">
        Choose a major based on your area of interest. This helps us match you with the right mentor or mentee.
      </p>

      <form onSubmit={handleSubmit} className="tw-space-y-6">
        {/* Input Fields */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Firstname
            </label>
            <input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleInputChange}
              placeholder="Firstname"
              className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Lastname
            </label>
            <input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleInputChange}
              placeholder="Lastname"
              className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Contact #
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              placeholder="Contact #"
              className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Year & Section
            </label>
            <input
              type="text"
              name="yearSection"
              value={formData.yearSection}
              onChange={handleInputChange}
              placeholder="Year & Section"
              className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Institutional Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Institutional Email"
              className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Program
            </label>
            <input
              type="text"
              name="program"
              value={formData.program}
              onChange={handleInputChange}
              placeholder="Program"
              className="tw-w-full tw-px-4 tw-py-2 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary"
            />
          </div>
        </div>

        {/* Major Selection Buttons */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-3">
            Select Major
          </label>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
            {majors.map((major) => (
              <button
                key={major}
                type="button"
                onClick={() => setSelectedMajor(major)}
                className={`tw-px-4 tw-py-3 tw-border tw-rounded-lg tw-text-sm tw-font-medium tw-transition-colors ${
                  selectedMajor === major
                    ? 'tw-bg-white tw-text-black tw-border-primary tw-ring-1 tw-ring-primary/20'
                    : 'tw-bg-white tw-text-black tw-border-primary/40 hover:tw-border-primary'
                }`}
              >
                {major}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="tw-flex tw-justify-end">
          <button
            type="submit"
            className="tw-bg-primary hover:tw-bg-primary-dark tw-text-white tw-px-8 tw-py-3 tw-rounded-lg tw-font-medium tw-transition-colors"
          >
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;

