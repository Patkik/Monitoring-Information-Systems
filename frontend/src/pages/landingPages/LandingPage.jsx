import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import PageTransition from '../../shared/ui/PageTransition';
import RoleSelectionModal from '../../components/auth/RoleSelectionModal';

const HIGHLIGHTS = [
  { title: '1,200+', description: 'Active mentees collaborating with mentors each semester.' },
  { title: '350+', description: 'Industry professionals and senior students serving as mentors.' },
  { title: '4.8/5', description: 'Average satisfaction rating from mentorship sessions.' }
];

const STEPS = [
  { title: 'Sign up', body: 'Create your account and choose whether you want to mentor or be mentored.' },
  { title: 'Match intelligently', body: 'Our matching engine pairs mentees with mentors based on goals, skills, and availability.' },
  { title: 'Grow together', body: 'Track milestones, schedule sessions, and share feedback inside the platform.' }
];

const FEATURES = [
  {
    title: 'Structured learning tracks',
    body: 'Personalized pathways keep mentees progressing with curated modules and mentor guidance.'
  },
  {
    title: 'Session planning & analytics',
    body: 'Built-in scheduling, attendance tracking, and insights help administrators keep the program on course.'
  },
  {
    title: 'Community recognition',
    body: 'Celebrate achievements with digital certificates, highlight reels, and mentor spotlights.'
  }
];

const TESTIMONIALS = [
  {
    quote: 'This platform transformed how we mentor. Scheduling, communication, and progress tracking now happen in one place.',
    name: 'Rina D.',
    role: 'Faculty Mentor'
  },
  {
    quote: 'Having a mentor who understood my career goals kept me motivated. The learning plans kept us aligned every week.',
    name: 'Jared S.',
    role: '3rd Year Mentee'
  }
];

export default function LandingPage() {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  return (
    <div className="tw-min-h-screen tw-bg-gray-50 dark:tw-bg-[#0B0914] tw-text-gray-900 dark:tw-text-white tw-flex tw-flex-col tw-font-sans tw-overflow-hidden tw-transition-colors tw-duration-300">
      <Header />

      <PageTransition>
        <RoleSelectionModal open={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} />
        <main className="tw-flex-1 tw-flex tw-flex-col tw-gap-32 tw-pb-24">
          
          {/* Hero Section */}
          <section className="tw-relative tw-pt-32 tw-pb-20 tw-px-6 lg:tw-px-12 tw-flex tw-flex-col tw-items-center tw-text-center tw-min-h-[90vh] tw-justify-center">
            {/* Abstract Background Glows */}
            <div className="tw-absolute tw-inset-0 tw-overflow-hidden tw-pointer-events-none">
              <div className="tw-absolute tw-top-[-10%] tw-left-[-10%] tw-w-[500px] tw-h-[500px] tw-bg-purple-600/10 dark:tw-bg-purple-600/30 tw-rounded-full tw-blur-[120px]" />
              <div className="tw-absolute tw-bottom-[-10%] tw-right-[-10%] tw-w-[600px] tw-h-[600px] tw-bg-indigo-600/10 dark:tw-bg-indigo-600/20 tw-rounded-full tw-blur-[150px]" />
              <div className="tw-absolute tw-top-[40%] tw-left-[50%] tw--translate-x-1/2 tw--translate-y-1/2 tw-w-[800px] tw-h-[400px] tw-bg-orange-400/10 dark:tw-bg-accent/20 tw-rounded-full tw-blur-[150px]" />
            </div>

            <div className="tw-relative tw-z-10 tw-max-w-4xl tw-mx-auto tw-space-y-8 tw-animate-fade-in-up">
              <div className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-bg-white/50 dark:tw-bg-white/5 tw-border tw-border-gray-200 dark:tw-border-white/10 tw-px-5 tw-py-2 tw-text-sm tw-font-medium tw-text-purple-600 dark:tw-text-purple-200 tw-backdrop-blur-md tw-shadow-sm dark:tw-shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <span className="tw-relative tw-flex tw-h-2 tw-w-2">
                  <span className="tw-animate-ping tw-absolute tw-inline-flex tw-h-full tw-w-full tw-rounded-full tw-bg-purple-400 tw-opacity-75"></span>
                  <span className="tw-relative tw-inline-flex tw-rounded-full tw-h-2 tw-w-2 tw-bg-purple-500"></span>
                </span>
                Mentor smarter, grow faster
              </div>
              
              <h1 className="tw-text-5xl sm:tw-text-7xl tw-font-extrabold tw-tracking-tight tw-leading-[1.1] tw-text-transparent tw-bg-clip-text tw-bg-gradient-to-r tw-from-gray-900 tw-via-purple-800 tw-to-purple-600 dark:tw-from-white dark:tw-via-purple-100 dark:tw-to-purple-300">
                A modern mentoring hub built for collaborative growth
              </h1>
              
              <p className="tw-text-lg sm:tw-text-xl tw-text-gray-600 dark:tw-text-gray-300 tw-max-w-2xl tw-mx-auto tw-leading-relaxed">
                Bring mentors, mentees, and administrators together with a unified workspace for planning sessions,
                measuring progress, and celebrating achievements.
              </p>
              
              <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-center tw-gap-5 tw-pt-6">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="tw-group tw-relative tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-purple-600 tw-text-white tw-px-8 tw-py-4 tw-text-lg tw-font-semibold tw-transition-all hover:tw-bg-purple-500 hover:tw-shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:tw--translate-y-1"
                >
                  Create an account
                  <svg className="tw-w-5 tw-h-5 tw-ml-2 tw-transition-transform group-hover:tw-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <Link
                  to="/features"
                  className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-white/50 dark:tw-bg-white/5 tw-border tw-border-gray-200 dark:tw-border-white/10 tw-text-gray-900 dark:tw-text-white tw-px-8 tw-py-4 tw-text-lg tw-font-semibold tw-backdrop-blur-sm tw-transition-all hover:tw-bg-gray-100 dark:hover:tw-bg-white/10 hover:tw-border-gray-300 dark:hover:tw-border-white/20 hover:tw--translate-y-1"
                >
                  Explore features
                </Link>
              </div>
            </div>
            
            {/* Dashboard Preview Graphic */}
            <div className="tw-relative tw-w-full tw-max-w-5xl tw-mx-auto tw-mt-24 tw-perspective-1000">
              <div className="tw-absolute tw-inset-0 tw-bg-gradient-to-t tw-from-gray-50 dark:tw-from-[#0B0914] tw-via-transparent tw-to-transparent tw-z-20" />
              <div className="tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-white/10 tw-bg-white/80 dark:tw-bg-[#151226]/80 tw-backdrop-blur-xl tw-shadow-2xl tw-overflow-hidden tw-transform tw-rotate-x-12 tw-scale-95 tw-transition-transform hover:tw-rotate-x-0 hover:tw-scale-100 tw-duration-700">
                <div className="tw-h-12 tw-border-b tw-border-gray-100 dark:tw-border-white/10 tw-bg-gray-50/50 dark:tw-bg-white/5 tw-flex tw-items-center tw-px-4 tw-gap-2">
                  <div className="tw-w-3 tw-h-3 tw-rounded-full tw-bg-red-500/80" />
                  <div className="tw-w-3 tw-h-3 tw-rounded-full tw-bg-yellow-500/80" />
                  <div className="tw-w-3 tw-h-3 tw-rounded-full tw-bg-green-500/80" />
                </div>
                <div className="tw-p-8 tw-grid tw-grid-cols-3 tw-gap-6">
                  <div className="tw-col-span-2 tw-space-y-4">
                    <div className="tw-h-8 tw-w-1/3 tw-bg-gray-200 dark:tw-bg-white/10 tw-rounded-lg tw-animate-pulse" />
                    <div className="tw-h-32 tw-w-full tw-bg-gradient-to-r tw-from-purple-100 dark:tw-from-purple-500/20 tw-to-indigo-100 dark:tw-to-indigo-500/20 tw-rounded-xl tw-border tw-border-gray-100 dark:tw-border-white/5" />
                    <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                      <div className="tw-h-24 tw-bg-gray-50 dark:tw-bg-white/5 tw-rounded-xl tw-border tw-border-gray-100 dark:tw-border-white/5" />
                      <div className="tw-h-24 tw-bg-gray-50 dark:tw-bg-white/5 tw-rounded-xl tw-border tw-border-gray-100 dark:tw-border-white/5" />
                    </div>
                  </div>
                  <div className="tw-space-y-4">
                    <div className="tw-h-64 tw-w-full tw-bg-gray-50 dark:tw-bg-white/5 tw-rounded-xl tw-border tw-border-gray-100 dark:tw-border-white/5" />
                    <div className="tw-h-16 tw-w-full tw-bg-purple-100 dark:tw-bg-purple-600/30 tw-rounded-xl tw-border tw-border-purple-200 dark:tw-border-purple-500/30" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Highlights Metrics */}
          <section className="tw-relative tw-z-10 tw-max-w-7xl tw-mx-auto tw-px-6 lg:tw-px-12">
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6">
              {HIGHLIGHTS.map((item) => (
                <div
                  key={item.title}
                  className="tw-group tw-rounded-3xl tw-bg-white/80 dark:tw-bg-white/5 tw-border tw-border-gray-100 dark:tw-border-white/10 tw-p-10 tw-backdrop-blur-md tw-transition-all hover:tw-bg-white dark:hover:tw-bg-white/10 hover:tw-border-purple-200 dark:hover:tw-border-purple-500/30 hover:tw--translate-y-2 hover:tw-shadow-[0_10px_40px_rgba(168,85,247,0.05)] dark:hover:tw-shadow-[0_10px_40px_rgba(168,85,247,0.15)]"
                >
                  <p className="tw-text-5xl tw-font-black tw-text-transparent tw-bg-clip-text tw-bg-gradient-to-br tw-from-purple-600 tw-to-purple-900 dark:tw-from-white dark:tw-to-purple-300 tw-mb-4">{item.title}</p>
                  <p className="tw-text-gray-600 dark:tw-text-gray-400 tw-text-lg tw-leading-relaxed group-hover:tw-text-gray-800 dark:group-hover:tw-text-gray-300 tw-transition-colors">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="tw-relative tw-z-10 tw-max-w-7xl tw-mx-auto tw-px-6 lg:tw-px-12">
            <div className="tw-text-center tw-mb-16 tw-space-y-4">
              <h2 className="tw-text-4xl sm:tw-text-5xl tw-font-bold tw-text-gray-900 dark:tw-text-white">Guided mentoring from onboarding to outcomes</h2>
              <p className="tw-text-xl tw-text-gray-600 dark:tw-text-gray-400 tw-max-w-3xl tw-mx-auto">
                We streamline every stage of the mentoring lifecycle so mentors can focus on coaching and mentees can focus on learning.
              </p>
            </div>
            
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-8 tw-relative">
              <div className="tw-absolute tw-top-1/2 tw-left-0 tw-w-full tw-h-px tw-bg-gradient-to-r tw-from-transparent tw-via-gray-200 dark:tw-via-white/20 tw-to-transparent tw-hidden md:tw-block tw--translate-y-1/2" />
              
              {STEPS.map((step, index) => (
                <div key={step.title} className="tw-relative tw-bg-white dark:tw-bg-[#151226] tw-rounded-2xl tw-border tw-border-gray-100 dark:tw-border-white/10 tw-p-8 tw-shadow-sm dark:tw-shadow-xl tw-transform tw-transition-all hover:tw--translate-y-2 hover:tw-border-purple-200 dark:hover:tw-border-purple-500/50 hover:tw-shadow-[0_0_30px_rgba(168,85,247,0.1)] dark:hover:tw-shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                  <div className="tw-absolute tw--top-6 tw-left-8 tw-w-12 tw-h-12 tw-rounded-full tw-bg-purple-600 tw-flex tw-items-center tw-justify-center tw-text-xl tw-font-bold tw-text-white tw-shadow-[0_0_20px_rgba(168,85,247,0.2)] dark:tw-shadow-[0_0_20px_rgba(168,85,247,0.5)] tw-border-4 tw-border-gray-50 dark:tw-border-[#0B0914] tw-transition-colors">
                    {index + 1}
                  </div>
                  <h3 className="tw-mt-4 tw-text-2xl tw-font-bold tw-text-gray-900 dark:tw-text-white tw-mb-3">{step.title}</h3>
                  <p className="tw-text-gray-600 dark:tw-text-gray-400 tw-leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Feature Grid */}
          <section className="tw-relative tw-z-10 tw-max-w-7xl tw-mx-auto tw-px-6 lg:tw-px-12">
            <div className="tw-rounded-[3rem] tw-bg-white/80 dark:tw-bg-white/5 tw-border tw-border-gray-200 dark:tw-border-white/10 tw-p-10 lg:tw-p-20 tw-backdrop-blur-lg tw-shadow-sm dark:tw-shadow-none">
              <div className="tw-mb-16 tw-space-y-4">
                <span className="tw-text-purple-600 dark:tw-text-purple-400 tw-font-semibold tw-tracking-wider tw-uppercase tw-text-sm">Platform Capabilities</span>
                <h2 className="tw-text-4xl tw-font-bold tw-text-gray-900 dark:tw-text-white">Tools that keep everyone aligned</h2>
              </div>
              
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-10">
                {FEATURES.map((feature) => (
                  <article
                    key={feature.title}
                    className="tw-group tw-space-y-5"
                  >
                    <div className="tw-w-16 tw-h-16 tw-rounded-2xl tw-bg-purple-100 dark:tw-bg-purple-500/20 tw-border tw-border-purple-200 dark:tw-border-purple-500/30 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-font-bold tw-text-purple-600 dark:tw-text-purple-300 tw-transition-transform group-hover:tw-scale-110 group-hover:tw-bg-purple-200 dark:group-hover:tw-bg-purple-500/30">
                      {feature.title.slice(0, 1)}
                    </div>
                    <h3 className="tw-text-2xl tw-font-semibold tw-text-gray-900 dark:tw-text-white">{feature.title}</h3>
                    <p className="tw-text-gray-600 dark:tw-text-gray-400 tw-leading-relaxed">{feature.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="tw-relative tw-z-10 tw-max-w-7xl tw-mx-auto tw-px-6 lg:tw-px-12">
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-8">
              {TESTIMONIALS.map((item, idx) => (
                <blockquote 
                  key={item.name} 
                  className={`tw-rounded-3xl tw-p-10 tw-space-y-6 ${idx === 0 ? 'tw-bg-gradient-to-br tw-from-purple-50 dark:tw-from-purple-900/40 tw-to-indigo-50 dark:tw-to-indigo-900/40 tw-border tw-border-purple-100 dark:tw-border-purple-500/20' : 'tw-bg-white dark:tw-bg-white/5 tw-border tw-border-gray-100 dark:tw-border-white/10'} tw-backdrop-blur-sm`}
                >
                  <div className="tw-flex tw-gap-1 tw-text-yellow-400">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} className="tw-w-5 tw-h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="tw-text-xl tw-text-gray-800 dark:tw-text-gray-200 tw-leading-relaxed">"{item.quote}"</p>
                  <footer className="tw-flex tw-items-center tw-gap-4">
                    <div className="tw-w-12 tw-h-12 tw-rounded-full tw-bg-gradient-to-tr tw-from-purple-500 tw-to-orange-400 tw-flex tw-items-center tw-justify-center tw-text-white tw-font-bold tw-shadow-sm">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="tw-font-semibold tw-text-gray-900 dark:tw-text-white">{item.name}</div>
                      <div className="tw-text-sm tw-text-purple-600 dark:tw-text-purple-300">{item.role}</div>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </section>

          {/* Call to Action */}
          <section className="tw-relative tw-z-10 tw-max-w-5xl tw-mx-auto tw-px-6 lg:tw-px-12 tw-w-full">
            <div className="tw-rounded-[2.5rem] tw-bg-gradient-to-r tw-from-purple-600 tw-to-indigo-600 tw-p-1 tw-overflow-hidden tw-relative tw-shadow-[0_20px_50px_rgba(147,51,234,0.15)] dark:tw-shadow-[0_20px_50px_rgba(147,51,234,0.3)]">
              <div className="tw-absolute tw-inset-0 tw-bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpIi8+PC9zdmc+')] tw-opacity-30" />
              <div className="tw-relative tw-bg-white dark:tw-bg-[#0B0914]/90 tw-backdrop-blur-xl tw-rounded-[2.4rem] tw-p-12 sm:tw-p-16 tw-text-center tw-space-y-8 tw-transition-colors">
                <h2 className="tw-text-4xl sm:tw-text-5xl tw-font-bold tw-text-gray-900 dark:tw-text-white">Ready to raise your program to the next level?</h2>
                <p className="tw-text-xl tw-text-gray-600 dark:tw-text-gray-300 tw-max-w-2xl tw-mx-auto">
                  Launch a structured mentorship experience that keeps everyone aligned.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-purple-600 dark:tw-bg-white tw-text-white dark:tw-text-purple-900 tw-px-10 tw-py-4 tw-text-lg tw-font-bold hover:tw-bg-purple-500 dark:hover:tw-bg-gray-100 hover:tw-shadow-[0_0_30px_rgba(168,85,247,0.3)] dark:hover:tw-shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:tw--translate-y-1 tw-transition-all"
                >
                  Get started today
                </button>
              </div>
            </div>
          </section>
        </main>
        
        <div className="tw-bg-white dark:tw-bg-[#0B0914] tw-border-t tw-border-gray-100 dark:tw-border-white/10 tw-transition-colors tw-duration-300">
          <Footer />
        </div>
      </PageTransition>
    </div>
  );
}

