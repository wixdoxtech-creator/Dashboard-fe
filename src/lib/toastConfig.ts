import { toast } from 'sonner';

// Custom toast functions with colors
export const customToast = {
  success: (message: string, options?: any) => {  
    return toast.success(message, {
      style: {
        background: 'linear-gradient(135deg,rgb(21, 196, 59),rgb(39, 192, 30))',
        color: 'white',
        border: '1px solid rgb(8, 168, 35)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
      },
      ...options,
    });
  },

  error: (message: string, options?: any) => {
    return toast.error(message, {
      style: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        border: '1px solid #dc2626',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
      },
      ...options,
    });
  },

  warning: (message: string, options?: any) => {
    return toast.warning(message, {
      style: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        border: '1px solid #d97706',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
      },
      ...options,
    });
  },

  info: (message: string, options?: any) => {
    return toast.info(message, {
      style: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: 'white',
        border: '1px solid #2563eb',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      },
      ...options,
    });
  },

  loading: (message: string, options?: any) => {
    return toast.loading(message, {
      style: {
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        color: 'white',
        border: '1px solid #7c3aed',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
      },
      ...options,
    });
  },

  // Custom colorful toasts
  primary: (message: string, options?: any) => {
    return toast(message, {
      style: {
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        color: 'white',
        border: '1px solid #4f46e5',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
      },
      ...options,
    });
  },

  secondary: (message: string, options?: any) => {
    return toast(message, {
      style: {
        background: 'linear-gradient(135deg, #6b7280, #4b5563)',
        color: 'white',
        border: '1px solid #4b5563',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
      },
      ...options,
    });
  },

  accent: (message: string, options?: any) => {
    return toast(message, {
      style: {
        background: 'linear-gradient(135deg, #ec4899, #db2777)',
        color: 'white',
        border: '1px solid #db2777',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
      },
      ...options,
    });
  },

  // Special themed toasts
  payment: (message: string, options?: any) => {
    return toast.success(message, {
      style: {
        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
        color: 'white',
        border: '1px solid #16a34a',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
      },
      ...options,
    });
  },

  network: (message: string, options?: any) => {
    return toast.warning(message, {
      style: {
        background: 'linear-gradient(135deg, #f97316, #ea580c)',
        color: 'white',
        border: '1px solid #ea580c',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
      },
      ...options,
    });
  },

  security: (message: string, options?: any) => {
    return toast.info(message, {
      style: {
        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
        color: 'white',
        border: '1px solid #0891b2',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
      },
      ...options,
    });
  },
};

// Export the original toast for backward compatibility
export { toast };
