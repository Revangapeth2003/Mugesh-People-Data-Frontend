// src/components/Layout/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Users, UserPlus, MessageSquare, FileText, Settings, LogOut, LayoutDashboard, Menu, X
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'People', href: '/people', icon: Users, show: true },
    { name: 'Messages', href: '/messages', icon: MessageSquare, show: true },
    { name: 'Templates', href: '/templates', icon: FileText, show: true },
    { name: 'Admin Management', href: '/admin-management', icon: UserPlus, show: user?.role === 'superadmin' },
    { name: 'Settings', href: '/settings', icon: Settings, show: true },
  ];

  return (
    <>
      {/* Mobile Header with Hamburger */}
      <div className="lg:hidden bg-slate-900 text-white flex items-center justify-between p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">🏛️</span>
          </div>
          <h2 className="text-xl font-bold">Data Management</h2>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          className="focus:outline-none hover:bg-slate-800 p-2 rounded-lg transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        bg-slate-900 text-white w-72 min-h-screen flex flex-col shadow-2xl
        fixed lg:relative z-50 transform lg:transform-none transition-all duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">🏛️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Data Management</h2>
              {/* <p className="text-slate-400 text-sm">Government Portal</p> */}
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-slate-300 text-sm font-medium capitalize">{user?.role}</p>
            {user?.direction && (
              <p className="text-slate-400 text-xs">Direction: {user.direction}</p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-2">
            {navigation
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                      ${isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-200 w-full text-sm font-medium"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
