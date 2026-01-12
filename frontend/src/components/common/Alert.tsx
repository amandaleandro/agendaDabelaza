import React from 'react';
import clsx from 'clsx';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  return (
    <div
      className={clsx(
        'px-4 py-3 rounded-lg flex justify-between items-center',
        {
          'bg-green-100 text-green-800 border border-green-300': type === 'success',
          'bg-red-100 text-red-800 border border-red-300': type === 'error',
          'bg-yellow-100 text-yellow-800 border border-yellow-300': type === 'warning',
          'bg-blue-100 text-blue-800 border border-blue-300': type === 'info',
        },
      )}
    >
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="ml-4 font-bold">
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;

