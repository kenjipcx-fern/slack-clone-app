import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Workspace from './components/workspace/Workspace';
import WorkspaceSetup from './components/workspace/WorkspaceSetup';
import useStore from './store/useStore';

function App() {
  const { isAuthenticated, user } = useStore();
  
  useEffect(() => {
    // Check if user is stored in localStorage on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser && !user) {
      useStore.setState({ 
        user: JSON.parse(storedUser),
        isAuthenticated: true 
      });
    }
  }, [user]);
  
  return (
    <Router>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/workspace" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to="/workspace" replace />
            ) : (
              <LoginForm />
            )
          } 
        />
        
        <Route 
          path="/register" 
          element={
            isAuthenticated ? (
              <Navigate to="/workspace/setup" replace />
            ) : (
              <RegisterForm />
            )
          } 
        />
        
        <Route 
          path="/workspace/setup" 
          element={
            isAuthenticated ? (
              <WorkspaceSetup />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route 
          path="/workspace" 
          element={
            isAuthenticated ? (
              <Workspace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
