import React from 'react';
import { 
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle 
} from 'lucide-react';

// NFT Status Badge Component
export const NFTStatusBadge = ({ status }) => {
  const statusConfig = {
    active: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      text: 'Active'
    },
    expired: {
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      text: 'Expired'
    },
    invalid: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      text: 'Invalid'
    },
    pending: {
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      text: 'Pending'
    }
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.invalid;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor}`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
};

// Benefit Card Component
export const BenefitCard = ({ benefit }) => {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{benefit.name}</h3>
          <p className="text-sm text-gray-500">{benefit.description}</p>
        </div>
        {benefit.isActive ? (
          <span className="px-3 py-1 bg-blue-50 text-blue-500 rounded-lg text-sm">
            {benefit.remainingUses} uses left
          </span>
        ) : (
          <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-sm">
            Expired
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>Valid until {benefit.expiryDate}</span>
      </div>
    </div>
  );
};

// Alert Component
export const Alert = ({ type, message, onClose }) => {
  const alertConfig = {
    success: {
      icon: CheckCircle,
      className: 'bg-green-50 border-green-500 text-green-700'
    },
    error: {
      icon: AlertCircle,
      className: 'bg-red-50 border-red-500 text-red-700'
    },
    warning: {
      icon: AlertCircle,
      className: 'bg-yellow-50 border-yellow-500 text-yellow-700'
    },
    info: {
      icon: Shield,
      className: 'bg-blue-50 border-blue-500 text-blue-700'
    }
  };

  const config = alertConfig[type] || alertConfig.info;
  const Icon = config.icon;

  return (
    <div className={`p-4 border rounded-lg flex items-start gap-3 ${config.className}`}>
      <Icon className="w-5 h-5" />
      <div className="flex-1">{message}</div>
      {onClose && (
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

// Loading State Component
export const LoadingState = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500">{text}</p>
    </div>
  );
};

// Empty State Component
export const EmptyState = ({ 
  icon: Icon,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      {Icon && <Icon className="w-12 h-12 text-gray-400" />}
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-gray-500">{description}</p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// Action Card Component
export const ActionCard = ({ icon: Icon, title, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 hover:bg-gray-50 transition-colors"
    >
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon className="w-8 h-8 text-blue-500" />
      </div>
      <div className="text-center">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </button>
  );
};

// Main Container Component
export const MainContainer = ({ children }) => {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
};