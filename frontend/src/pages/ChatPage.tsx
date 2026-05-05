import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';
import ChatPanel from '../components/chat/ChatPanel';

const ChatPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="tw-max-w-7xl tw-mx-auto tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-py-8">
        <ChatPanel />
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
