import React from 'react';

// Mock Container component
export const Container: React.FC<{
  children: React.ReactNode;
  tokens?: Record<string, string>;
  className?: string;
  as?: string;
}> = ({ children, tokens, className, as: As = 'div' }) => {
  const style: React.CSSProperties = {
    maxWidth: tokens?.['--ContainerMaxWidth'] || '100%',
    padding: tokens?.['--ContainerPadding'] || '0',
    backgroundColor: tokens?.['--ContainerBgColor'] || 'transparent',
    border: tokens?.['--ContainerBorder'] || 'none',
    borderRadius: tokens?.['--ContainerBorderRadius'] || '0',
    boxShadow: tokens?.['--ContainerElevation'] || 'none',
  };

  return React.createElement(As, { className, style }, children);
};

// Mock Stack component
export const Stack: React.FC<{
  children: React.ReactNode;
  space?: string;
  className?: string;
  as?: string;
}> = ({ children, space = 'spacing-md', className, as: As = 'div' }) => {
  const spacingMap: Record<string, string> = {
    'spacing-none': '0',
    'spacing-xxs': '4px',
    'spacing-xs': '8px',
    'spacing-sm': '12px',
    'spacing-md': '16px',
    'spacing-lg': '24px',
    'spacing-xl': '32px',
    'spacing-xxl': '40px',
  };

  const gap = spacingMap[space] || spacingMap['spacing-md'];

  return React.createElement(As, {
    className,
    style: { display: 'flex', flexDirection: 'column', gap }
  }, children);
};

// Mock Typography component
export const Typography: React.FC<{
  children: React.ReactNode;
  variant?: string;
  color?: string;
  className?: string;
  as?: string;
}> = ({ children, variant = 'body-md', color, className, as }) => {
  const variantMap: Record<string, { tag: string; style: React.CSSProperties }> = {
    'heading-xl': { tag: 'h1', style: { fontSize: '2.5rem', fontWeight: 700, margin: 0 } },
    'heading-lg': { tag: 'h2', style: { fontSize: '2rem', fontWeight: 700, margin: 0 } },
    'heading-md': { tag: 'h3', style: { fontSize: '1.5rem', fontWeight: 600, margin: 0 } },
    'heading-sm': { tag: 'h4', style: { fontSize: '1.25rem', fontWeight: 600, margin: 0 } },
    'body-lg': { tag: 'p', style: { fontSize: '1.125rem', margin: 0 } },
    'body-md': { tag: 'p', style: { fontSize: '1rem', margin: 0 } },
    'body-sm': { tag: 'p', style: { fontSize: '0.875rem', margin: 0 } },
  };

  const { tag, style } = variantMap[variant] || variantMap['body-md'];
  const colorMap: Record<string, string> = {
    'neutral-600': '#6b7280',
    'neutral-700': '#374151',
  };

  const finalStyle = {
    ...style,
    color: color ? (colorMap[color] || color) : undefined,
  };

  return React.createElement(as || tag, { className, style: finalStyle }, children);
};

// Mock Button component
export const Button: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}> = ({ children, variant = 'primary', onClick, disabled, type = 'button', className }) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
    },
    secondary: {
      backgroundColor: '#6b7280',
      color: 'white',
      border: 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#2563eb',
      border: '1px solid #e5e7eb',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...variantStyles[variant],
        padding: '8px 16px',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: '1rem',
        fontWeight: 500,
      }}
    >
      {children}
    </button>
  );
};

// Mock TextField component
export const TextField: React.FC<{
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  helperText?: string;
  className?: string;
}> = ({ label, value, onChange, placeholder, disabled, hasError, helperText, className }) => {
  return (
    <div className={className} style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.875rem', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '4px',
          fontSize: '1rem',
        }}
      />
      {helperText && (
        <div style={{ marginTop: '4px', fontSize: '0.75rem', color: hasError ? '#ef4444' : '#6b7280' }}>
          {helperText}
        </div>
      )}
    </div>
  );
};

// Mock InlineAlert component
export const InlineAlert: React.FC<{
  variant?: 'info' | 'success' | 'warning' | 'danger';
  description: string;
  title?: string;
  className?: string;
}> = ({ variant = 'info', description, title, className }) => {
  const variantStyles: Record<string, { bg: string; border: string; text: string }> = {
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
    success: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    danger: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={className}
      style={{
        padding: '12px 16px',
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        borderRadius: '4px',
        color: styles.text,
        marginBottom: '16px',
      }}
    >
      {title && <div style={{ fontWeight: 600, marginBottom: '4px' }}>{title}</div>}
      <div>{description}</div>
    </div>
  );
};
