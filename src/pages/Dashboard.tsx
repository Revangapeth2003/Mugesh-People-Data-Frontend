// src/pages/Dashboard.tsx - UPDATED WITH ROLE-BASED PEOPLE COUNT
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { sheetsService } from '../services/googleSheets';
import Layout from '../components/Layout/Layout';
import { Users, MessageSquare, FileText, TrendingUp, Activity } from 'lucide-react';
import { convertToMessages, convertToTemplates } from '../utils/typeHelpers';

const Dashboard: React.FC = () => {
  const { user, getAllUsers } = useAuth();
  const [stats, setStats] = useState({
    totalPeople: 0,
    totalMessages: 0,
    totalTemplates: 0,
    totalAdmins: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔍 Fetching dashboard data for user:', user?.role, user?.direction);
      
      let peopleCount = 0;
      let messagesCount = 0;
      let templatesCount = 0;
      let adminsCount = 0;

      // ✅ FETCH PEOPLE COUNT BASED ON USER ROLE
      try {
        const peopleResponse = await sheetsService.getPeople();
        
        if (peopleResponse.success && Array.isArray(peopleResponse.data)) {
          if (user?.role === 'superadmin') {
            // SuperAdmin: Show all people from all directions
            peopleCount = peopleResponse.data.length;
            console.log('👑 SuperAdmin: Showing all people count:', peopleCount);
          } else if (user?.role === 'admin' && user?.direction) {
            // Admin: Show only people from their specific direction
            const filteredPeople = peopleResponse.data.filter((person: any) => 
              person.direction === user.direction
            );
            peopleCount = filteredPeople.length;
            console.log(`👤 Admin (${user.direction}): Showing direction-specific count:`, peopleCount);
          }
        }
      } catch (error) {
        console.log('⚠️ People data not ready yet:', error);
      }

      // ✅ FETCH ADMIN COUNT (Only for SuperAdmin)
      if (user?.role === 'superadmin') {
        try {
          const usersResult = await getAllUsers();
          if (usersResult.success && usersResult.users) {
            adminsCount = usersResult.users.filter((u: any) => u.role === 'admin' && u.isActive !== false).length;
            console.log('👑 SuperAdmin: Admins count:', adminsCount);
          }
        } catch (error) {
          console.log('⚠️ Admins data not ready yet:', error);
        }
      }

      // ✅ FETCH MESSAGES COUNT (Role-based filtering)
      try {
        const messagesResponse = await sheetsService.getMessages();
        if (messagesResponse.success && Array.isArray(messagesResponse.data)) {
          const messages = convertToMessages(messagesResponse.data);
          
          if (user?.role === 'superadmin') {
            // SuperAdmin: Show all messages
            messagesCount = messages.length;
          } else if (user?.role === 'admin' && user?.direction) {
            // Admin: Show only messages from their direction
            const filteredMessages = messages.filter((message: any) => 
              message.direction === user.direction || message.direction === 'All'
            );
            messagesCount = filteredMessages.length;
          }
        }
      } catch (error) {
        console.log('⚠️ Messages sheet not ready yet:', error);
      }

      // ✅ FETCH TEMPLATES COUNT (Shared across all users)
      try {
        const templatesResponse = await sheetsService.getTemplates();
        if (templatesResponse.success && Array.isArray(templatesResponse.data)) {
          const templates = convertToTemplates(templatesResponse.data);
          templatesCount = templates.length;
        }
      } catch (error) {
        console.log('⚠️ Templates sheet not ready yet:', error);
      }

      setStats({
        totalPeople: peopleCount,
        totalMessages: messagesCount,
        totalTemplates: templatesCount,
        totalAdmins: adminsCount,
        recentActivity: peopleCount + messagesCount + templatesCount + adminsCount
      });

      console.log('✅ Dashboard stats updated:', {
        people: peopleCount,
        messages: messagesCount,
        templates: templatesCount,
        admins: adminsCount
      });

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  // ✅ DYNAMIC STAT CARDS BASED ON USER ROLE
  const getStatCards = () => {
    const baseCards = [
      {
        title: user?.role === 'superadmin' ? 'Total People (All Directions)' : `People (${user?.direction} Direction)`,
        value: stats.totalPeople,
        icon: Users,
        color: 'bg-blue-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-600'
      },
      {
        title: user?.role === 'superadmin' ? 'Messages Sent (All)' : `Messages (${user?.direction})`,
        value: stats.totalMessages,
        icon: MessageSquare,
        color: 'bg-green-500',
        bgColor: 'bg-green-50',
        textColor: 'text-green-600'
      },
      {
        title: 'Message Templates',
        value: stats.totalTemplates,
        icon: FileText,
        color: 'bg-purple-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-600'
      }
    ];

    // Add admin count card only for SuperAdmin
    if (user?.role === 'superadmin') {
      baseCards.push({
        title: 'Total Admins',
        value: stats.totalAdmins,
        icon: TrendingUp,
        color: 'bg-orange-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-600'
      });
    } else {
      // For regular admins, show total records instead
      baseCards.push({
        title: 'Total Records',
        value: stats.recentActivity,
        icon: TrendingUp,
        color: 'bg-orange-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-600'
      });
    }

    return baseCards;
  };

  const statCards = getStatCards();

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.role === 'superadmin' ? 'Super Admin' : `${user?.direction} Admin`}!
              </h1>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                {user?.role === 'superadmin' 
                  ? "Here's your complete system overview across all directions."
                  : `Here's your ${user?.direction} direction management overview.`
                }
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                user?.role === 'superadmin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {user?.role === 'superadmin' ? '👑 Super Admin' : `👤 ${user?.direction} Admin`}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                🗄️ MongoDB Database
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={`${stat.bgColor} rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-200`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">{stat.title}</p>
                    <p className="text-3xl sm:text-4xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Activity className="h-6 w-6 mr-3 text-blue-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <button
              onClick={() => window.location.href = '/people'}
              className="flex items-center p-4 sm:p-6 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors mr-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Manage People</p>
                <p className="text-gray-500 text-xs sm:text-sm">
                  {user?.role === 'superadmin' ? 'Add, edit, or view all people' : `Manage ${user?.direction} people`}
                </p>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/messages'}
              className="flex items-center p-4 sm:p-6 border-2 border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50 transition-all duration-200 group"
            >
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors mr-4">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Send Messages</p>
                <p className="text-gray-500 text-xs sm:text-sm">
                  {user?.role === 'superadmin' ? 'Communicate with all constituents' : `Message ${user?.direction} constituents`}
                </p>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/templates'}
              className="flex items-center p-4 sm:p-6 border-2 border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50 transition-all duration-200 group"
            >
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors mr-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Message Templates</p>
                <p className="text-gray-500 text-xs sm:text-sm">Create and manage templates</p>
              </div>
            </button>

            {user?.role === 'superadmin' && (
              <button
                onClick={() => window.location.href = '/admin-management'}
                className="flex items-center p-4 sm:p-6 border-2 border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition-all duration-200 group"
              >
                <div className="p-3 bg-indigo-100 rounded-xl group-hover:bg-indigo-200 transition-colors mr-4">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">Manage Admins</p>
                  <p className="text-gray-500 text-xs sm:text-sm">Add or manage admin users</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* System Status */}
        {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">System Status</h2>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-green-50 rounded-xl">
              <span className="text-gray-700 font-medium mb-2 sm:mb-0">Database Connection</span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Database Connected
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-green-50 rounded-xl">
              <span className="text-gray-700 font-medium mb-2 sm:mb-0">User Authentication</span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Active
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-green-50 rounded-xl">
              <span className="text-gray-700 font-medium mb-2 sm:mb-0">
                {user?.role === 'superadmin' ? 'System-wide Data Sync' : `${user?.direction} Data Sync`}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Up to date
              </span>
            </div>
            {user?.role === 'superadmin' && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-50 rounded-xl">
                <span className="text-gray-700 font-medium mb-2 sm:mb-0">Admin Management</span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  👑 Full Access
                </span>
              </div>
            )}
          </div>
        </div> */}

        {/* Role-specific Information Panel */}
        {user?.role === 'admin' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">📍 Your Direction Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">{stats.totalPeople}</p>
                <p className="text-blue-700 text-sm">People in {user?.direction}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">{stats.totalMessages}</p>
                <p className="text-blue-700 text-sm">Messages Sent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">{stats.totalTemplates}</p>
                <p className="text-blue-700 text-sm">Available Templates</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
