import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Workspace } from '../types';
import { authAPI, workspaceAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  selectWorkspace: (workspace: Workspace) => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      const savedWorkspace = localStorage.getItem('currentWorkspace');

      if (savedToken && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(userData);
          
          // Connect socket
          socketService.connect(savedToken);
          
          // Load workspaces
          await refreshWorkspaces();
          
          if (savedWorkspace) {
            setCurrentWorkspace(JSON.parse(savedWorkspace));
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          localStorage.clear();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const refreshWorkspaces = async () => {
    try {
      const response = await workspaceAPI.list();
      setWorkspaces(response.data);
      
      // If no current workspace, select the first one
      if (!currentWorkspace && response.data.length > 0) {
        selectWorkspace(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Connect socket
      socketService.connect(newToken);
      
      // Load workspaces
      await refreshWorkspaces();
      
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to login');
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      const response = await authAPI.register({ email, password, name: username });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Connect socket
      socketService.connect(newToken);
      
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to register');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setWorkspaces([]);
    setCurrentWorkspace(null);
    localStorage.clear();
    socketService.disconnect();
    toast.success('Logged out successfully');
  };

  const selectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        workspaces,
        currentWorkspace,
        loading,
        login,
        register,
        logout,
        selectWorkspace,
        updateProfile,
        refreshWorkspaces,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
