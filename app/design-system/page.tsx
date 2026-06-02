'use client';

import React, { useState } from 'react';
import { Button, Typography, TextField, InlineAlert, Stack } from '@eventbrite/marmalade';
import { Badge } from '@/components/Badge';
import { FilterChip } from '@/components/FilterChip';
import { SearchField } from '@/components/SearchField';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId =
  | 'colors'
  | 'typography'
  | 'spacing'
  | 'button'
  | 'textfield'
  | 'alert'
  | 'badge'
  | 'filterchip'
  | 'searchfield'
  | 'stack';

const TABS: { id: TabId; label: string }[] = [
  { id: 'colors',      label: 'Color Tokens' },
  { id: 'typography',  label: 'Typography' },
  { id: 'spacing',     label: 'Spacing & Radius' },
  { id: 'button',      label: 'Button' },
  { id: 'textfield',   label: 'TextField' },
  { id: 'alert',       label: 'InlineAlert' },
  { id: 'badge',       label: 'Badge' },
  { id: 'filterchip',  label: 'FilterChip' },
  { id: 'searchfield', label: 'SearchField' },
  { id: 'stack',       label: 'Stack' },
];

// ─── Layout helpers ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "'Founders Grotesk R', Inter, sans-serif",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: 'var(--marm-color-fg-tertiary, #696c71)',
      margin: '0 0 16px',
    }}>
      {children}
    </p>
  );
}

function Row({ label, children, vertical = false }: {
  label: string;
  children: React.ReactNode;
  vertical?: boolean;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '180px 1fr',
      gap: 24,
      alignItems: 'start',
      marginBottom: 20,
    }}>
      <span style={{
        fontFamily: "'Founders Grotesk R', Inter, sans-serif",
        fontSize: 12,
        color: 'var(--marm-color-fg-tertiary, #696c71)',
        paddingTop: vertical ? 4 : 0,
      }}>
        {label}
      </span>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: vertical ? 'start' : 'flex-start',
        flexDirection: vertical ? 'column' : 'row',
      }}>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <hr style={{
      border: 'none',
      borderTop: '1px solid var(--marm-color-border-base, rgba(25,22,19,0.1))',
      margin: '32px 0',
    }} />
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 8,
        background: value,
        border: '1px solid rgba(25,22,19,0.12)',
      }} />
      <span style={{
        fontFamily: 'monospace',
        fontSize: 11,
        color: 'var(--marm-color-fg-tertiary, #696c71)',
        textAlign: 'center',
        maxWidth: 80,
        lineHeight: 1.4,
      }}>
        {name}
      </span>
    </div>
  );
}

function CodeNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '10px 14px',
      background: 'var(--marm-color-bg-surface, #fff)',
      borderRadius: 8,
      border: '1px solid var(--marm-color-border-base, rgba(25,22,19,0.1))',
      fontFamily: 'monospace',
      fontSize: 12,
      color: 'var(--marm-color-fg-secondary, #404040)',
      lineHeight: 1.6,
      marginTop: 8,
    }}>
      {children}
    </div>
  );
}

// ─── Tab content ─────────────────────────────────────────────────────────────

function ColorsTab() {
  return (
    <div>
      <SectionTitle>Foreground</SectionTitle>
      <Row label="fg-base">        <Swatch name="fg-base #161719"        value="var(--marm-color-fg-base, #161719)" /></Row>
      <Row label="fg-secondary">   <Swatch name="fg-secondary #404040"   value="var(--marm-color-fg-secondary, #404040)" /></Row>
      <Row label="fg-tertiary">    <Swatch name="fg-tertiary #696c71"    value="var(--marm-color-fg-tertiary, #696c71)" /></Row>
      <Row label="fg-disabled">    <Swatch name="fg-disabled #a3a3a3"    value="var(--marm-color-fg-disabled, #a3a3a3)" /></Row>
      <Row label="fg-on-dark">     <Swatch name="fg-on-dark #ffffff"     value="var(--marm-color-fg-on-dark, #ffffff)" /></Row>

      <Divider />
      <SectionTitle>Background</SectionTitle>
      <Row label="bg-canvas">  <Swatch name="bg-canvas #F5F5F0"  value="var(--marm-color-bg-canvas, #F5F5F0)" /></Row>
      <Row label="bg-surface"> <Swatch name="bg-surface #ffffff" value="var(--marm-color-bg-surface, #ffffff)" /></Row>

      <Divider />
      <SectionTitle>Border</SectionTitle>
      <Row label="border-base">   <Swatch name="rgba(25,22,19, 0.1)"  value="var(--marm-color-border-base, rgba(25,22,19,0.1))" /></Row>
      <Row label="border-strong"> <Swatch name="rgba(25,22,19, 0.3)"  value="var(--marm-color-border-strong, rgba(25,22,19,0.3))" /></Row>

      <Divider />
      <SectionTitle>Brand secondary (lime)</SectionTitle>
      <Row label="brand-secondary">
        <Swatch name="bg #ceff58"               value="var(--marm-color-brand-secondary-bg, #ceff58)" />
        <Swatch name="border rgba(77,100,0,0.3)" value="var(--marm-color-brand-secondary-border, rgba(77,100,0,0.3))" />
        <Swatch name="fg #000000"               value="var(--marm-color-brand-secondary-fg, #000000)" />
      </Row>

      <Divider />
      <SectionTitle>Action / CTA</SectionTitle>
      <Row label="action">
        <Swatch name="bg-base #161719"   value="var(--marm-color-action-bg-base, #161719)" />
        <Swatch name="bg-hover #25272b"  value="var(--marm-color-action-bg-hover, #25272b)" />
        <Swatch name="bg-active #3d3f43" value="var(--marm-color-action-bg-active, #3d3f43)" />
        <Swatch name="fg #ffffff"        value="var(--marm-color-action-fg, #ffffff)" />
      </Row>
    </div>
  );
}

function TypographyTab() {
  const variants: [string, string][] = [
    ['display',   'Display — 24px · 700 · –0.3px'],
    ['title-lg',  'Title LG — 21px · 700 · –0.2px'],
    ['title-md',  'Title MD — 18px · 600'],
    ['title-sm',  'Title SM — 14px · 500'],
    ['title-xs',  'Title XS — 14px · 500'],
    ['body-2xl',  'Body 2XL — 24px · 400'],
    ['body-xl',   'Body XL — 21px · 400'],
    ['body-lg',   'Body LG — 18px · 400'],
    ['body-md',   'Body MD — 14px · 400  ← default'],
    ['body-sm',   'Body SM — 12px · 400'],
    ['body-xs',   'Body XS — 9px · 400'],
    ['signal-md', 'Signal MD — 12px · 700 · UPPERCASE'],
    ['signal-sm', 'Signal SM — 12px · 700 · UPPERCASE'],
  ];

  return (
    <div>
      <SectionTitle>Type scale — Founders Grotesk R</SectionTitle>
      {variants.map(([variant, desc]) => (
        <Row key={variant} label={desc}>
          <Typography variant={variant}>{desc}</Typography>
        </Row>
      ))}

      <Divider />
      <SectionTitle>Backward-compat aliases (used in existing sidebar)</SectionTitle>
      <CodeNote>
        heading-xl → display<br />
        heading-lg → title-lg<br />
        heading-md → title-md<br />
        heading-sm → title-sm<br />
        body-md-bold → body-md + fontWeight 600<br />
        body-sm-bold → body-sm + fontWeight 600
      </CodeNote>

      <Divider />
      <SectionTitle>Color variants</SectionTitle>
      <Row label="color=base">      <Typography variant="body-md" color="base">fg-base #161719</Typography></Row>
      <Row label="color=secondary"> <Typography variant="body-md" color="secondary">fg-secondary #404040</Typography></Row>
      <Row label="color=tertiary">  <Typography variant="body-md" color="tertiary">fg-tertiary #696c71</Typography></Row>
      <Row label="color=disabled">  <Typography variant="body-md" color="disabled">fg-disabled #a3a3a3</Typography></Row>
    </div>
  );
}

function SpacingTab() {
  return (
    <div>
      <SectionTitle>Spacing scale</SectionTitle>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 40 }}>
        {([1,2,3,4,5,6,8,10,12] as const).map((n) => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: `var(--space-${n}, ${n * 4}px)`,
              height: `var(--space-${n}, ${n * 4}px)`,
              background: 'var(--marm-color-fg-base, #161719)',
              borderRadius: 2,
              minWidth: 4,
            }} />
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--marm-color-fg-tertiary,#696c71)', textAlign: 'center', lineHeight: 1.5 }}>
              --space-{n}<br />{n * 4}px
            </span>
          </div>
        ))}
      </div>

      <Divider />
      <SectionTitle>Border radius</SectionTitle>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {([
          ['sm',   4,    'badge'],
          ['md',   8,    'inputs, chips'],
          ['lg',   12,   'cards'],
          ['xl',   16,   'large cards'],
          ['pill', 9999, 'buttons'],
        ] as [string, number, string][]).map(([name, px, usage]) => (
          <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 72,
              height: 44,
              background: 'var(--marm-color-fg-base, #161719)',
              borderRadius: `var(--radius-${name}, ${px}px)`,
            }} />
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--marm-color-fg-tertiary,#696c71)', textAlign: 'center', lineHeight: 1.5 }}>
              --radius-{name}<br />{px === 9999 ? '9999px' : `${px}px`}<br />
              <span style={{ color: 'var(--marm-color-fg-disabled,#a3a3a3)' }}>{usage}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ButtonTab() {
  return (
    <div>
      <SectionTitle>Size SM — height 32px</SectionTitle>
      <Row label="primary">   <Button variant="primary"   size="sm">Primary</Button></Row>
      <Row label="secondary"> <Button variant="secondary" size="sm">Secondary</Button></Row>
      <Row label="ghost">     <Button variant="ghost"     size="sm">Ghost</Button></Row>
      <Row label="disabled">  <Button variant="primary"   size="sm" disabled>Disabled</Button></Row>

      <Divider />
      <SectionTitle>Size MD — height 40px (default)</SectionTitle>
      <Row label="primary">   <Button variant="primary"  >Primary</Button></Row>
      <Row label="secondary"> <Button variant="secondary">Secondary</Button></Row>
      <Row label="ghost">     <Button variant="ghost"    >Ghost</Button></Row>
      <Row label="disabled">  <Button variant="primary"   disabled>Disabled</Button></Row>

      <Divider />
      <SectionTitle>Size LG — height 44px</SectionTitle>
      <Row label="primary">   <Button variant="primary"   size="lg">Primary</Button></Row>
      <Row label="secondary"> <Button variant="secondary" size="lg">Secondary</Button></Row>
      <Row label="ghost">     <Button variant="ghost"     size="lg">Ghost</Button></Row>
      <Row label="disabled">  <Button variant="primary"   size="lg" disabled>Disabled</Button></Row>

      <Divider />
      <SectionTitle>With icon</SectionTitle>
      <Row label="primary + icon (lg)">
        <Button variant="primary" size="lg">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13.333 4L6 11.333L2.667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Publish
        </Button>
      </Row>
      <Row label="secondary + icon (lg)">
        <Button variant="secondary" size="lg">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add event
        </Button>
      </Row>
      <Row label="ghost + icon (md)">
        <Button variant="ghost">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </Button>
      </Row>
    </div>
  );
}

function TextFieldTab() {
  const [v, setV] = useState('');
  return (
    <div style={{ maxWidth: 400 }}>
      <SectionTitle>States</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--marm-color-fg-tertiary,#696c71)', margin: '0 0 8px' }}>default</p>
          <TextField label="Event Title" placeholder="Enter event title" value={v} onChange={setV} />
        </div>
        <div>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--marm-color-fg-tertiary,#696c71)', margin: '0 0 8px' }}>with helper text</p>
          <TextField label="Venue" placeholder="Enter venue name" value="" onChange={() => {}} helperText="Building name, city, or address" />
        </div>
        <div>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--marm-color-fg-tertiary,#696c71)', margin: '0 0 8px' }}>error state</p>
          <TextField label="Email" placeholder="you@example.com" value="not-an-email" onChange={() => {}} hasError helperText="Please enter a valid email address" />
        </div>
        <div>
          <p style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--marm-color-fg-tertiary,#696c71)', margin: '0 0 8px' }}>disabled</p>
          <TextField label="Read only" value="Cannot be edited" onChange={() => {}} disabled />
        </div>
      </div>
    </div>
  );
}

function AlertTab() {
  return (
    <div style={{ maxWidth: 560 }}>
      <SectionTitle>Variants</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <InlineAlert variant="info"    title="Heads up"  description="Your event will go live after review." />
        <InlineAlert variant="success" title="Done!"     description="Event published successfully." />
        <InlineAlert variant="warning" title="Warning"   description="You have unsaved changes." />
        <InlineAlert variant="danger"  title="Error"     description="Something went wrong. Please try again." />
        <InlineAlert variant="info"    description="No title — just a short notice." />
      </div>
    </div>
  );
}

function BadgeTab() {
  return (
    <div>
      <SectionTitle>Variants</SectionTitle>
      <Row label="all variants">
        <Badge variant="secondary">Going Fast</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="opportunity">Opportunity</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="bold">Bold</Badge>
      </Row>

      <Divider />
      <SectionTitle>With icon</SectionTitle>
      <Row label="icon + label">
        <Badge variant="secondary" icon="⚡">Going Fast</Badge>
        <Badge variant="danger"    icon="🔥">Selling out</Badge>
        <Badge variant="info"      icon="📣">New</Badge>
      </Row>

      <Divider />
      <SectionTitle>No border</SectionTitle>
      <Row label="bordered=false">
        <Badge variant="secondary" bordered={false}>Going Fast</Badge>
        <Badge variant="info"      bordered={false}>Info</Badge>
      </Row>

      <Divider />
      <SectionTitle>Custom color</SectionTitle>
      <Row label="variant=custom">
        <Badge variant="custom" style={{ backgroundColor: '#e11d48', color: '#fff', borderColor: 'transparent' }}>Sold Out</Badge>
        <Badge variant="custom" style={{ backgroundColor: '#161719', color: '#ceff58', borderColor: 'transparent' }}>Free</Badge>
      </Row>
    </div>
  );
}

function FilterChipTab() {
  const [active, setActive] = useState('today');
  return (
    <div>
      <SectionTitle>Interactive — click to select</SectionTitle>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        {[
          { id: 'today',        label: 'Today' },
          { id: 'this-weekend', label: 'This weekend' },
          { id: 'free',         label: 'Free' },
          { id: 'music',        label: 'Music' },
          { id: 'food',         label: 'Food & Drink' },
        ].map(({ id, label }) => (
          <FilterChip key={id} active={active === id} onClick={() => setActive(id)}>
            {label}
          </FilterChip>
        ))}
      </div>

      <Divider />
      <SectionTitle>Static states</SectionTitle>
      <Row label="inactive">  <FilterChip active={false} onClick={() => {}}>Inactive</FilterChip></Row>
      <Row label="active">    <FilterChip active={true}  onClick={() => {}}>Active</FilterChip></Row>
    </div>
  );
}

function SearchFieldTab() {
  const [v, setV] = useState('');
  return (
    <div style={{ maxWidth: 440 }}>
      <SectionTitle>With filter button</SectionTitle>
      <SearchField value={v} onChange={setV} placeholder="Find things to do" onFilterClick={() => alert('Filters')} />

      <Divider />
      <SectionTitle>Without filter button</SectionTitle>
      <SearchField value="" onChange={() => {}} placeholder="Search events..." showFilterButton={false} />
    </div>
  );
}

function StackTab() {
  const box = (w = 80) => (
    <div style={{ background: 'var(--marm-color-brand-secondary-bg,#ceff58)', height: 24, width: w, borderRadius: 4 }} />
  );
  return (
    <div>
      <SectionTitle>Column (default direction)</SectionTitle>
      {(['spacing-xs', 'spacing-sm', 'spacing-md', 'spacing-lg'] as const).map((space) => (
        <Row key={space} label={`space="${space}"`}>
          <Stack space={space} style={{ background: 'var(--marm-color-bg-surface,#fff)', padding: 12, borderRadius: 8, border: '1px solid var(--marm-color-border-base,rgba(25,22,19,0.1))' }}>
            {box(80)}{box(60)}{box(100)}
          </Stack>
        </Row>
      ))}

      <Divider />
      <SectionTitle>Row</SectionTitle>
      {(['spacing-xs', 'spacing-sm', 'spacing-md', 'spacing-lg'] as const).map((space) => (
        <Row key={space} label={`direction="row" space="${space}"`}>
          <Stack direction="row" space={space} align="center" style={{ background: 'var(--marm-color-bg-surface,#fff)', padding: 12, borderRadius: 8, border: '1px solid var(--marm-color-border-base,rgba(25,22,19,0.1))' }}>
            {box(40)}{box(40)}{box(40)}
          </Stack>
        </Row>
      ))}
    </div>
  );
}

const TAB_CONTENT: Record<TabId, React.ReactNode> = {
  colors:      <ColorsTab />,
  typography:  <TypographyTab />,
  spacing:     <SpacingTab />,
  button:      <ButtonTab />,
  textfield:   <TextFieldTab />,
  alert:       <AlertTab />,
  badge:       <BadgeTab />,
  filterchip:  <FilterChipTab />,
  searchfield: <SearchFieldTab />,
  stack:       <StackTab />,
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  const [activeTab, setActiveTab] = useState<TabId>('colors');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--marm-color-bg-canvas, #F5F5F0)',
      fontFamily: "'Founders Grotesk R', Inter, sans-serif",
    }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{
        padding: '24px 40px 0',
        background: 'var(--marm-color-bg-surface, #ffffff)',
        borderBottom: '1px solid var(--marm-color-border-base, rgba(25,22,19,0.1))',
        flexShrink: 0,
      }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--marm-color-fg-tertiary, #696c71)',
            margin: '0 0 4px',
          }}>
            Marmalade · GEN3 · base theme
          </p>
          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--marm-color-fg-base, #161719)',
            margin: 0,
            letterSpacing: '-0.2px',
          }}>
            Design System Overview
          </h1>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────── */}
        <style>{`.ds-tabbar::-webkit-scrollbar{display:none}`}</style>
        <div className="ds-tabbar" style={{
          display: 'flex',
          gap: 0,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive
                    ? '2px solid var(--marm-color-fg-base, #161719)'
                    : '2px solid transparent',
                  color: isActive
                    ? 'var(--marm-color-fg-base, #161719)'
                    : 'var(--marm-color-fg-tertiary, #696c71)',
                  fontFamily: "'Founders Grotesk R', Inter, sans-serif",
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                  marginBottom: -1,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        width: '100%',
      }}>
      <div style={{ padding: '36px 40px', maxWidth: 900 }}>
        {TAB_CONTENT[activeTab]}

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--marm-color-border-base,rgba(25,22,19,0.1))',
          paddingTop: 20,
          marginTop: 48,
        }}>
          <p style={{
            fontSize: 12,
            color: 'var(--marm-color-fg-tertiary, #696c71)',
            margin: 0,
          }}>
            Figma: <code style={{ fontFamily: 'monospace' }}>tAXj2iJZlp0B4JZufx9EGE</code> + <code style={{ fontFamily: 'monospace' }}>bMbnylfOWFK9jaISGAM8Xu</code>
            &nbsp;·&nbsp;
            <a href="/" style={{ color: 'var(--marm-color-fg-base,#161719)' }}>← Back to tool</a>
          </p>
        </div>
      </div>{/* inner max-width wrapper */}
      </div>{/* scrollable content */}
    </div>
  );
}
