import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../layout/Header';
import Sidebar from '../layout/Sidebar';
import ChatArea from '../chat/ChatArea';
import RightSidebar from '../layout/RightSidebar';
import useStore from '../../store/useStore';
import socketService from '../../services/socket';

const Workspace: React.FC = () => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    currentWorkspace, 
    loadWorkspaces,
    isSidebarOpen,
    isRightSidebarOpen,
    token
  } = useStore();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Connect socket if not connected
    if (token && !socketService.isConnected()) {
      socketService.connect(token);
    }
    
    // Load workspaces if not loaded
    if (!currentWorkspace) {
      loadWorkspaces();
    }
  }, [isAuthenticated, currentWorkspace, navigate, loadWorkspaces, token]);
  
  if (!currentWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slack-purple mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-white">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {isSidebarOpen && <Sidebar />}
        <ChatArea />
        {isRightSidebarOpen && <RightSidebar />}
      </div>
    </div>
  );
};

export default Workspace;
