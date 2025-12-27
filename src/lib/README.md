# Colorful Toast System

This directory contains a custom toast configuration that adds beautiful, colorful styling to your toast notifications.

## Files

- `toastConfig.ts` - Custom toast functions with inline styles
- `toastStyles.css` - CSS classes for toast styling
- `README.md` - This documentation

## Usage

### Method 1: Using Custom Toast Functions

```typescript
import { customToast } from '../lib/toastConfig';

// Basic toasts
customToast.success('Success message!');
customToast.error('Error message!');
customToast.warning('Warning message!');
customToast.info('Info message!');
customToast.loading('Loading message!');

// Custom themed toasts
customToast.primary('Primary message!');
customToast.secondary('Secondary message!');
customToast.accent('Accent message!');

// Special themed toasts
customToast.payment('Payment successful!');
customToast.network('Network restored!');
customToast.security('Security updated!');
```

### Method 2: Using CSS Classes

```typescript
import { toast } from 'sonner';

// Basic toasts with CSS classes
toast.success('Success!', { className: 'toast-success toast-animated' });
toast.error('Error!', { className: 'toast-error toast-animated' });
toast.warning('Warning!', { className: 'toast-warning toast-animated' });
toast.info('Info!', { className: 'toast-info toast-animated' });

// Special effects
toast('Glass effect!', { className: 'toast-glass toast-animated' });
toast('Neon glow!', { className: 'toast-neon toast-animated' });
toast('Rainbow!', { className: 'toast-rainbow toast-animated' });
```

## Available Toast Types

### Basic Types
- `success` - Green gradient
- `error` - Red gradient  
- `warning` - Orange gradient
- `info` - Blue gradient
- `loading` - Purple gradient

### Custom Types
- `primary` - Indigo gradient
- `secondary` - Gray gradient
- `accent` - Pink gradient

### Themed Types
- `payment` - Green gradient (for payment confirmations)
- `network` - Orange gradient (for network status)
- `security` - Cyan gradient (for security updates)

## CSS Classes Available

### Basic Classes
- `.toast-success` - Green gradient
- `.toast-error` - Red gradient
- `.toast-warning` - Orange gradient
- `.toast-info` - Blue gradient
- `.toast-loading` - Purple gradient

### Effect Classes
- `.toast-animated` - Slide-in animation
- `.toast-hover` - Hover lift effect
- `.toast-glass` - Glass morphism effect
- `.toast-neon` - Neon glow effect
- `.toast-rainbow` - Animated rainbow gradient

## Migration from Regular Toast

To migrate existing toast calls to colorful toasts:

```typescript
// Before
import { toast } from 'sonner';
toast.success('Message');

// After
import { customToast } from '../lib/toastConfig';
customToast.success('Message');
```

## Demo Component

Check out `src/components/ToastDemo.tsx` for a complete demonstration of all available toast types and effects.

## Configuration

The default Toaster configuration in `App.tsx` includes:
- Position: top-center
- Dark gradient background
- Animated entrance
- Hover effects
- Rounded corners
- Subtle shadows
