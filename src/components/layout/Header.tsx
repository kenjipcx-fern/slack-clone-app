import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  ClockIcon,
  QuestionMarkCircleIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import useStore from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, setSearchQuery, searchQuery } = useStore();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="h-11 bg-slack-purple flex items-center justify-between px-4 text-white border-b border-slack-border">
      {/* Left section - History */}
      <div className="flex items-center space-x-4">
        <button className="hover:bg-slack-hover p-1.5 rounded">
          <ClockIcon className="w-5 h-5" />
        </button>
      </div>
      
      {/* Center section - Search */}
      <div className="flex-1 max-w-3xl mx-4">
        <div className={`relative ${isSearchFocused ? 'ring-2 ring-white ring-opacity-50' : ''} rounded-md`}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search"
            className="w-full bg-slack-hover bg-opacity-50 hover:bg-opacity-100 text-white placeholder-gray-300 px-8 py-1.5 rounded-md outline-none text-sm transition"
          />
          <MagnifyingGlassIcon className="absolute left-2.5 top-2 w-4 h-4 text-gray-300" />
        </div>
      </div>
      
      {/* Right section - Help and Profile */}
      <div className="flex items-center space-x-3">
        <button className="hover:bg-slack-hover p-1.5 rounded">
          <QuestionMarkCircleIcon className="w-5 h-5" />
        </button>
        
        <Menu as="div" className="relative">
          <Menu.Button className="hover:bg-slack-hover p-1 rounded">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-7 h-7 rounded"
              />
            ) : (
              <div className="w-7 h-7 bg-gray-600 rounded flex items-center justify-center text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </Menu.Button>
          
          <Menu.Items className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700`}
                >
                  <UserCircleIcon className="w-4 h-4" />
                  <span>Profile</span>
                </button>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700`}
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                  <span>Preferences</span>
                </button>
              )}
            </Menu.Item>
            
            <div className="border-t border-gray-200">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700`}
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Menu>
      </div>
    </div>
  );
};

export default Header;
