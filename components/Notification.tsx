import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Notification as NotificationType } from '../types';

interface NotificationProps {
  notification: NotificationType;
  onClose: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const duration = notification.duration || 5000;
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-600" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-600" />;
      case 'info':
      default:
        return <Info size={20} className="text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`${getBackgroundColor()} border rounded-2xl p-4 shadow-lg flex items-start gap-3 animate-slideDown`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <p className="flex-1 text-sm font-semibold text-gray-800">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Fechar notificação"
      >
        <X size={18} />
      </button>
    </div>
  );
};

interface NotificationContainerProps {
  notifications: NotificationType[];
  onClose: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-3 max-w-md mx-auto pointer-events-none"
      aria-label="Notificações"
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Notification notification={notification} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

export default Notification;
