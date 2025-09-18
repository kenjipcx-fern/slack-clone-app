import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Main from './components/Main';
import WorkspaceSetup from './components/WorkspaceSetup';

function AppContent() {
  const { user, loading, currentWorkspace } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slack-dark">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      <Route path="/workspace-setup" element={user && !currentWorkspace ? <WorkspaceSetup /> : <Navigate to="/" />} />
      <Route path="/" element={
        user ? (
          currentWorkspace ? <Main /> : <Navigate to="/workspace-setup" />
        ) : (
          <Navigate to="/login" />
        )
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
