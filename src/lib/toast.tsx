// src/lib/toast.tsx - Custom styled toasts
import toast, { Toaster, ToastOptions } from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

// Custom toast configurations
const baseOptions: ToastOptions = {
  duration: 3000,
  position: 'top-center',
  style: {
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    maxWidth: '500px',
  },
};

// Success toast
export const successToast = (message: string) => {
  return toast.success(message, {
    ...baseOptions,
    icon: <CheckCircle2 className="w-5 h-5" />,
    style: {
      ...baseOptions.style,
      background: '#10b981',
      color: '#ffffff',
    },
  });
};

// Error toast
export const errorToast = (message: string) => {
  return toast.error(message, {
    ...baseOptions,
    icon: <XCircle className="w-5 h-5" />,
    style: {
      ...baseOptions.style,
      background: '#ef4444',
      color: '#ffffff',
    },
  });
};

// Warning toast
export const warningToast = (message: string) => {
  return toast(message, {
    ...baseOptions,
    icon: <AlertCircle className="w-5 h-5" />,
    style: {
      ...baseOptions.style,
      background: '#f59e0b',
      color: '#ffffff',
    },
  });
};

// Info toast
export const infoToast = (message: string) => {
  return toast(message, {
    ...baseOptions,
    icon: <Info className="w-5 h-5" />,
    style: {
      ...baseOptions.style,
      background: '#3b82f6',
      color: '#ffffff',
    },
  });
};

// Custom Toaster component with better styling
export const CustomToaster = () => {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        success: {
          duration: 3000,
          style: {
            background: '#10b981',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#10b981',
          },
        },
        error: {
          duration: 4000,
          style: {
            background: '#ef4444',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#ffffff',
            secondary: '#ef4444',
          },
        },
        loading: {
          style: {
            background: '#3b82f6',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        },
      }}
    />
  );
};

export { toast };
