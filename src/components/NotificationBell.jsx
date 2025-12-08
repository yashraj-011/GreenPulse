import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { alertService } from '@services/alertService';
import toast from 'react-hot-toast';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await alertService.getUnreadAlerts();
      setNotifications(data.alerts || []);
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await alertService.markAsRead(id);
      setNotifications(notifications.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fadeIn z-50">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Notifications</h3>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
                {unreadCount} new
              </span>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-sm text-gray-800">{notif.title}</h4>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      <p className="text-sm text-gray-600">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Bell size={48} className="mx-auto mb-2 opacity-50" />
                <p>No new notifications</p>
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 bg-gray-50 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 font-semibold hover:text-blue-700"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
