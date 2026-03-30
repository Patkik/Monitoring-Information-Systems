import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/landingPages/LandingPage';
import AboutPage from './pages/landingPages/AboutPage';
import HowItWorksPage from './pages/landingPages/HowItWorksPage';
import FeaturesPage from './pages/landingPages/FeaturesPage';
import ContactPage from './pages/landingPages/ContactPage';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import VerifyEmailPage from './features/auth/pages/VerifyEmailPage.jsx';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import AdminDashboard from './components/dashboards/AdminDashboard';
import MentorDashboard from './components/dashboards/MentorDashboard';
import MenteeDashboard from './components/dashboards/MenteeDashboard';
import MaterialsUploadPage from './pages/mentorDashboards/MaterialsUploadPage';
import MentorSessionsPage from './pages/mentorDashboards/MentorSessionsPage';
import MentorAvailabilityPage from './pages/mentorDashboards/MentorAvailabilityPage';
import MentorRecognitionPage from './pages/mentorDashboards/MentorRecognitionPage';
import MyMentorPage from './pages/menteeDashboards/MyMentorPage';
import SessionPage from './pages/menteeDashboards/SessionPage';
import ApplyPage from './pages/menteeDashboards/ApplyPage';
import AnnouncementsPage from './pages/menteeDashboards/AnnouncementsPage';
import MenteeApplicationForm from './pages/applicationPages/MenteeApplicationForm';
import PendingApprovalPage from './pages/PendingApprovalPage';
import MentorApplicationForm from './pages/applicationPages/MentorApplicationForm';
import MentorPendingPage from './pages/MentorPendingPage';
import AdminPendingPage from './pages/AdminPendingPage';
import AdminRecognitionPage from './pages/admin/AdminRecognitionPage';
import MatchingPage from './pages/admin/MatchingPage';
import AdminApplicationsPage from './pages/admin/ApplicationsPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminAnnouncementsPage from './pages/admin/AnnouncementsPage';
import AdminSessionsPage from './pages/admin/SessionsPage';
import AdminFeedbackPage from './pages/admin/FeedbackPage';
import AdminReportsPage from './pages/admin/ReportsPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import ProfilePage from './pages/menteeDashboards/ProfilePage';
import RecognitionPage from './pages/menteeDashboards/RecognitionPage';
import MentorAnnouncementsPage from './pages/mentorDashboards/AnnouncementsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SetPasswordPage from './features/auth/pages/SetPasswordPage.jsx';
import ProfileSettings from './features/profile/pages/ProfileSettings.jsx';
import ChatPage from './pages/ChatPage';
import MentorProfileEditor from './components/mentor/MentorProfileEditor';
import GoogleCalendarCallbackPage from './features/integrations/pages/GoogleCalendarCallback.jsx';
import MentorMatchSuggestionsPage from './features/matchmaking/pages/MentorMatchSuggestionsPage';
import MenteeMatchSuggestionsPage from './features/matchmaking/pages/MenteeMatchSuggestionsPage';

// Wrapper components for better TypeScript support
const AdminRoute = () => <ProtectedRoute requiredRole="admin" children={<AdminDashboard />} />;
const AdminRecognitionRoute = () => <ProtectedRoute requiredRole="admin" children={<AdminRecognitionPage />} />;
const AdminApplicationsRoute = () => <ProtectedRoute requiredRole="admin" children={<AdminApplicationsPage />} />;
const AdminMatchingRoute = () => <ProtectedRoute requiredRole="admin" children={<MatchingPage />} />;
const AdminUsersRoute = () => <ProtectedRoute requiredRole="admin" children={<AdminUsersPage />} />;
const AdminAnnouncementsRoute = () => <ProtectedRoute requiredRole="admin" children={<AdminAnnouncementsPage />} />;
const AdminSessionsRoute = () => <ProtectedRoute requiredRole="admin" children={<AdminSessionsPage />} />;
const AdminFeedbackRoute = () => <ProtectedRoute requiredRole="admin" children={<AdminFeedbackPage />} />;
const AdminReportsRoute = () => <ProtectedRoute requiredRole="admin" children={<AdminReportsPage />} />;
const MentorRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorDashboard />} />;
const MentorAnnouncementsRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorAnnouncementsPage />} />;
const MenteeRoute = () => <ProtectedRoute requiredRole="mentee" children={<MenteeDashboard />} />;
const MyMentorRoute = () => <ProtectedRoute requiredRole="mentee" children={<MyMentorPage />} />;
const SessionRoute = () => <ProtectedRoute requiredRole="mentee" children={<SessionPage />} />;
const ApplyRoute = () => <ProtectedRoute requiredRole="mentee" children={<ApplyPage />} />;
const AnnouncementsRoute = () => <ProtectedRoute requiredRole="mentee" children={<AnnouncementsPage />} />;
const RecognitionRoute = () => <ProtectedRoute requiredRole="mentee" children={<RecognitionPage />} />;
const ApplicationRoute = () => <ProtectedRoute requiredRole="mentee" children={<MenteeApplicationForm />} />;
const PendingRoute = () => <ProtectedRoute requiredRole="mentee" children={<PendingApprovalPage />} />;
const MentorApplicationRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorApplicationForm />} />;
const MentorPendingRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorPendingPage />} />;
const AdminPendingRoute = () => <ProtectedRoute requiredRole="admin" children={<AdminPendingPage />} />;
const ProfileRoute = () => <ProtectedRoute requiredRole={undefined} children={<ProfilePage />} />;
const ProfileSettingsRoute = () => <ProtectedRoute requiredRole={["mentee", "mentor"]} children={<ProfileSettings />} />;
const SetPasswordRoute = () => <ProtectedRoute requiredRole={undefined} children={<SetPasswordPage />} />;
const MentorChatRoute = () => <ProtectedRoute requiredRole="mentor" children={<ChatPage />} />;
const MenteeChatRoute = () => <ProtectedRoute requiredRole="mentee" children={<ChatPage />} />;
const MentorProfileEditRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorProfileEditor />} />;
const MentorMaterialsUploadRoute = () => <ProtectedRoute requiredRole="mentor" children={<MaterialsUploadPage />} />;
const MentorSessionsRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorSessionsPage />} />;
const MentorAvailabilityRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorAvailabilityPage />} />;
const MentorRecognitionRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorRecognitionPage />} />;
const MentorMatchesRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorMatchSuggestionsPage />} />;
const MenteeMatchesRoute = () => <ProtectedRoute requiredRole="mentee" children={<MenteeMatchSuggestionsPage />} />;

const App = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="sync" initial={false}>
            <Routes location={location} key={location.pathname}>
                {/* Public Pages */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* Auth Pages */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                <Route path="/role-selection" element={<RoleSelectionPage />} />
                <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                <Route path="/integrations/google-calendar/callback" element={<GoogleCalendarCallbackPage />} />
                <Route path="/set-password" element={<SetPasswordRoute />} />

                {/* Dashboard Routes */}
                <Route path="/admin/dashboard" element={<AdminRoute />} />
                <Route path="/admin/matching" element={<AdminMatchingRoute />} />
                <Route path="/admin/applications" element={<AdminApplicationsRoute />} />
                <Route path="/admin/users" element={<AdminUsersRoute />} />
                <Route path="/admin/sessions" element={<AdminSessionsRoute />} />
                <Route path="/admin/feedback" element={<AdminFeedbackRoute />} />
                <Route path="/admin/reports" element={<AdminReportsRoute />} />
                <Route path="/admin/announcements" element={<AdminAnnouncementsRoute />} />
                <Route path="/admin/recognition" element={<AdminRecognitionRoute />} />
                <Route path="/mentor/dashboard" element={<MentorRoute />} />
                <Route path="/mentor/announcements" element={<MentorAnnouncementsRoute />} />
                <Route path="/mentor/chat" element={<MentorChatRoute />} />
                <Route path="/mentor/materials/upload" element={<MentorMaterialsUploadRoute />} />
                <Route path="/mentor/sessions" element={<MentorSessionsRoute />} />
                <Route path="/mentor/availability" element={<MentorAvailabilityRoute />} />
                <Route path="/mentor/recognition" element={<MentorRecognitionRoute />} />
                <Route path="/mentor/matches" element={<MentorMatchesRoute />} />
                <Route path="/mentor/profile/edit" element={<MentorProfileEditRoute />} />
                <Route path="/mentee/dashboard" element={<MenteeRoute />} />
                <Route path="/mentee/chat" element={<MenteeChatRoute />} />
                <Route path="/mentee/my-mentor" element={<MyMentorRoute />} />
                <Route path="/mentee/session" element={<SessionRoute />} />
                <Route path="/mentee/apply" element={<ApplyRoute />} />
                <Route path="/mentee/announcements" element={<AnnouncementsRoute />} />
                <Route path="/mentee/recognition" element={<RecognitionRoute />} />
                <Route path="/mentee/matches" element={<MenteeMatchesRoute />} />

                {/* Application Routes */}
                <Route path="/mentee/application" element={<ApplicationRoute />} />
                <Route path="/mentee/pending" element={<PendingRoute />} />
                <Route path="/mentor/application" element={<MentorApplicationRoute />} />
                <Route path="/mentor/pending" element={<MentorPendingRoute />} />
                <Route path="/admin/pending" element={<AdminPendingRoute />} />
                <Route path="/profile" element={<ProfileRoute />} />
                <Route path="/profile/settings" element={<ProfileSettingsRoute />} />
            </Routes>
        </AnimatePresence>
    );
};

export default App;


