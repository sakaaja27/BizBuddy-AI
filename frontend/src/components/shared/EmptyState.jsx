import React from 'react';

const EmptyState = ({ icon, title, description, actionLabel, onAction, emoji }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm animate-scale-in">
      {emoji ? (
        <div className="text-6xl mb-5">{emoji}</div>
      ) : icon ? (
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-5 text-primary">
          {icon}
        </div>
      ) : null}
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm leading-relaxed">{description}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-primary/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
