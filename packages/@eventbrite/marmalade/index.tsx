/**
 * @eventbrite/marmalade — GEN3 component stubs
 * Styled to match the Marmalade GEN3 "base" theme token values.
 * All values use CSS custom properties defined in globals.css with
 * hardcoded fallbacks so the components work even without the token layer.
 */

import React from 'react';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------
export const Stack: React.FC<{
  children: React.ReactNode;
  space?: string;
  direction?: 'column' | 'row';
  align?: React.CSSProperties['alignItems'];
  justify?: React.CSSProperties['justifyContent'];
  className?: string;
  as?: string;
  style?: React.CSSProperties;
}> = ({
  children,
  space = 'spacing-md',
  direction = 'column',
  align,
  justify,
  className,
  as: As = 'div',
  style: extraStyle,
}) => {
  const spacingMap: Record<string, string> = {
    'spacing-none': '0',
    'spacing-xxs':  'var(--space-1, 4px)',
    'spacing-xs':   'var(--space-2, 8px)',
    'spacing-sm':   'var(--space-3, 12px)',
    'spacing-md':   'var(--space-4, 16px)',
    'spacing-lg':   'var(--space-6, 24px)',
    'spacing-xl':   'var(--space-8, 32px)',
    'spacing-xxl':  'var(--space-10, 40px)',
  };

  return React.createElement(
    As,
    {
      className,
      style: {
        display: 'flex',
        flexDirection: direction,
        gap: spacingMap[space] ?? space,
        alignItems: align,
        justifyContent: justify,
        ...extraStyle,
      },
    },
    children,
  );
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
type TypographyVariant =
  | 'display'
  | 'title-lg'
  | 'title-md'
  | 'title-sm'
  | 'title-xs'
  | 'body-2xl'
  | 'body-xl'
  | 'body-lg'
  | 'body-md'
  | 'body-sm'
  | 'body-xs'
  | 'signal-md'
  | 'signal-sm';

const TYPOGRAPHY_MAP: Record<TypographyVariant, { tag: string; style: React.CSSProperties }> = {
  'display':    { tag: 'h1', style: { fontSize: 'var(--font-size-body-2xl, 24px)', fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.3px', margin: 0 } },
  'title-lg':   { tag: 'h2', style: { fontSize: 'var(--font-size-body-xl, 21px)',  fontWeight: 600, lineHeight: 1.2,  letterSpacing: '-0.2px', margin: 0 } },
  'title-md':   { tag: 'h3', style: { fontSize: 'var(--font-size-body-lg, 18px)',  fontWeight: 600, lineHeight: 1.25, margin: 0 } },
  'title-sm':   { tag: 'h4', style: { fontSize: 'var(--font-size-body-md, 14px)',  fontWeight: 500, lineHeight: 1.3,  margin: 0 } },
  'title-xs':   { tag: 'h5', style: { fontSize: 'var(--font-size-body-md, 14px)',  fontWeight: 500, lineHeight: 1.3,  margin: 0 } },
  'body-2xl':   { tag: 'p',  style: { fontSize: 'var(--font-size-body-2xl, 24px)', fontWeight: 400, lineHeight: 1.333, margin: 0 } },
  'body-xl':    { tag: 'p',  style: { fontSize: 'var(--font-size-body-xl, 21px)',  fontWeight: 400, lineHeight: 1.333, margin: 0 } },
  'body-lg':    { tag: 'p',  style: { fontSize: 'var(--font-size-body-lg, 18px)',  fontWeight: 400, lineHeight: 1.333, margin: 0 } },
  'body-md':    { tag: 'p',  style: { fontSize: 'var(--font-size-body-md, 14px)',  fontWeight: 400, lineHeight: 1.333, margin: 0 } },
  'body-sm':    { tag: 'p',  style: { fontSize: 'var(--font-size-body-sm, 12px)',  fontWeight: 400, lineHeight: 1.4,  margin: 0 } },
  'body-xs':    { tag: 'p',  style: { fontSize: 'var(--font-size-body-xs, 9px)',   fontWeight: 400, lineHeight: 1.4,  margin: 0 } },
  'signal-md':  { tag: 'span', style: { fontSize: 'var(--font-size-signal-sm, 12px)', fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.2px', textTransform: 'uppercase' as const } },
  'signal-sm':  { tag: 'span', style: { fontSize: 'var(--font-size-signal-sm, 12px)', fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.2px', textTransform: 'uppercase' as const } },
};

// Backward-compatible aliases — map old variant names to GEN3 equivalents
const TYPOGRAPHY_ALIASES: Record<string, TypographyVariant> = {
  // Old heading scale → new title scale
  'heading-xl':       'display',
  'heading-lg':       'title-lg',
  'heading-md':       'title-md',
  'heading-sm':       'title-sm',
  // Bold body variants → same size but weight bump applied inline
  'body-md-bold':     'body-md',
  'body-sm-bold':     'body-sm',
  'body-lg-bold':     'body-lg',
  // Old body names without size suffix
  'body':             'body-md',
};

const COLOR_MAP: Record<string, string> = {
  'base':      'var(--marm-color-fg-base, #161719)',
  'secondary': 'var(--marm-color-fg-secondary, #404040)',
  'tertiary':  'var(--marm-color-fg-tertiary, #696c71)',
  'disabled':  'var(--marm-color-fg-disabled, #a3a3a3)',
  'on-dark':   'var(--marm-color-fg-on-dark, #ffffff)',
  // Legacy aliases kept for backward compat
  'neutral-600': 'var(--marm-color-fg-tertiary, #696c71)',
  'neutral-700': 'var(--marm-color-fg-secondary, #404040)',
};

export const Typography: React.FC<{
  children: React.ReactNode;
  variant?: TypographyVariant | string;
  color?: string;
  className?: string;
  as?: string;
  style?: React.CSSProperties;
}> = ({ children, variant = 'body-md', color, className, as, style: extraStyle }) => {
  // Resolve alias → canonical variant, then look up in map
  const canonical = (TYPOGRAPHY_ALIASES[variant] ?? variant) as TypographyVariant;
  const isBoldAlias = variant.endsWith('-bold');
  const def = TYPOGRAPHY_MAP[canonical] ?? TYPOGRAPHY_MAP['body-md'];
  const resolvedColor = color ? (COLOR_MAP[color] ?? color) : undefined;

  return React.createElement(
    as || def.tag,
    {
      className,
      style: {
        fontFamily: "'Founders Grotesk R', 'Inter', sans-serif",
        ...def.style,
        // Bold aliases bump font weight
        ...(isBoldAlias ? { fontWeight: 600 } : {}),
        ...(resolvedColor ? { color: resolvedColor } : {}),
        ...extraStyle,
      },
    },
    children,
  );
};

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize    = 'sm' | 'md' | 'lg';

const BUTTON_SIZE: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: '32px', padding: '0 var(--space-3, 12px)', fontSize: 'var(--font-size-body-sm, 12px)' },
  md: { height: '40px', padding: '0 var(--space-4, 16px)', fontSize: 'var(--font-size-body-md, 14px)' },
  lg: { height: '44px', padding: '0 var(--space-5, 20px)', fontSize: 'var(--font-size-body-md, 14px)' },
};

const BUTTON_VARIANT: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--marm-color-action-bg-base, #161719)',
    color:           'var(--marm-color-action-fg, #ffffff)',
    border:          'none',
  },
  secondary: {
    backgroundColor: 'var(--marm-color-bg-surface, #ffffff)',
    color:           'var(--marm-color-fg-base, #161719)',
    border:          '1.5px solid var(--marm-color-fg-base, #161719)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color:           'var(--marm-color-fg-base, #161719)',
    border:          '1px solid var(--marm-color-border-base, rgba(25,22,19,0.1))',
  },
};

export const Button: React.FC<{
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
}> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  type = 'button',
  className,
  style: extraStyle,
}) => {
  const baseStyle: React.CSSProperties = {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            'var(--space-2, 8px)',
    borderRadius:   'var(--radius-pill, 9999px)',
    fontFamily:     "'Founders Grotesk R', 'Inter', sans-serif",
    fontWeight:     500,
    letterSpacing:  'var(--letter-spacing-plus-1, 0.1px)',
    cursor:         disabled ? 'not-allowed' : 'pointer',
    opacity:        disabled ? 0.4 : 1,
    transition:     'background-color 0.15s ease, color 0.15s ease',
    textDecoration: 'none',
    whiteSpace:     'nowrap',
    ...BUTTON_VARIANT[variant],
    ...BUTTON_SIZE[size],
    ...extraStyle,
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} style={baseStyle}>
      {children}
    </button>
  );
};

// ---------------------------------------------------------------------------
// TextField
// ---------------------------------------------------------------------------
export const TextField: React.FC<{
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  helperText?: string;
  type?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  hasError,
  helperText,
  type = 'text',
  className,
  style: extraStyle,
}) => {
  const inputBorder = hasError
    ? '1.5px solid var(--marm-color-status-danger, #c0392b)'
    : '1px solid var(--marm-color-border-base, rgba(25,22,19,0.1))';

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1, 4px)', ...extraStyle }}>
      {label && (
        <label
          style={{
            fontFamily:  "'Founders Grotesk R', 'Inter', sans-serif",
            fontSize:    'var(--font-size-body-md, 14px)',
            fontWeight:  500,
            lineHeight:  1.3,
            color:       'var(--marm-color-fg-base, #161719)',
          }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width:           '100%',
          height:          '40px',
          padding:         '0 var(--space-3, 12px)',
          border:          inputBorder,
          borderRadius:    'var(--radius-md, 8px)',
          backgroundColor: disabled
            ? 'var(--marm-color-bg-canvas, #F5F5F0)'
            : 'var(--marm-color-bg-surface, #ffffff)',
          color:           'var(--marm-color-fg-base, #161719)',
          fontFamily:      "'Founders Grotesk R', 'Inter', sans-serif",
          fontSize:        'var(--font-size-body-md, 14px)',
          fontWeight:      400,
          outline:         'none',
          boxSizing:       'border-box' as const,
          opacity:         disabled ? 0.5 : 1,
        }}
      />
      {helperText && (
        <span
          style={{
            fontFamily: "'Founders Grotesk R', 'Inter', sans-serif",
            fontSize:   'var(--font-size-body-xs, 9px)',
            color:      hasError
              ? 'var(--marm-color-status-danger, #c0392b)'
              : 'var(--marm-color-fg-tertiary, #696c71)',
          }}
        >
          {helperText}
        </span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// InlineAlert
// ---------------------------------------------------------------------------
type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

const ALERT_STYLES: Record<AlertVariant, { bg: string; border: string; color: string }> = {
  info:    { bg: 'var(--marm-color-status-info-bg, #e8f0fe)',    border: 'var(--marm-color-status-info, #4272d7)',    color: 'var(--marm-color-status-info, #4272d7)' },
  success: { bg: 'var(--marm-color-status-success-bg, #e6f4ea)', border: 'var(--marm-color-status-success, #2e7d32)', color: 'var(--marm-color-status-success, #2e7d32)' },
  warning: { bg: 'var(--marm-color-status-warning-bg, #fff8e1)', border: 'var(--marm-color-status-warning, #f9a825)', color: 'var(--marm-color-fg-base, #161719)' },
  danger:  { bg: 'var(--marm-color-status-danger-bg, #fce8e6)',  border: 'var(--marm-color-status-danger, #c0392b)',  color: 'var(--marm-color-status-danger, #c0392b)' },
};

export const InlineAlert: React.FC<{
  variant?: AlertVariant;
  description: string;
  title?: string;
  className?: string;
}> = ({ variant = 'info', description, title, className }) => {
  const s = ALERT_STYLES[variant];

  return (
    <div
      className={className}
      style={{
        padding:         'var(--space-3, 12px) var(--space-4, 16px)',
        backgroundColor: s.bg,
        border:          `1px solid ${s.border}`,
        borderRadius:    'var(--radius-md, 8px)',
        color:           s.color,
        fontFamily:      "'Founders Grotesk R', 'Inter', sans-serif",
        fontSize:        'var(--font-size-body-sm, 12px)',
        lineHeight:      1.4,
      }}
    >
      {title && (
        <div style={{ fontWeight: 600, marginBottom: 'var(--space-1, 4px)' }}>{title}</div>
      )}
      <div style={{ fontWeight: 400 }}>{description}</div>
    </div>
  );
};
