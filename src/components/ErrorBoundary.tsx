import React from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Global crash fallback — port of Aniraku App.jsx's inline class
// ErrorBoundary (App.jsx:15-76): same `hasError`/`resetKey` shape, the
// "Something went wrong" heading and the diagnostic note copy. Deltas vs the
// reference (task-mandated):
//  - "Report this crash" replaces the GitHub-issue link and follows the
//    ReportModal.tsx mailto pattern (same maintainer inbox REPORT_EMAIL and
//    `mailto:?subject=&body=` template shape — ReportModal.tsx:118-148).
//  - Buttons are Reload (location.reload) + Report this crash; the error
//    message and React component stack sit in a collapsed mono <details>.
//  - Brand-consistent dark card (theme tokens) instead of the reference's
//    inline black-screen styles.
// ---------------------------------------------------------------------------

// Maintainer inbox — byte-identical to ReportModal.tsx REPORT_EMAIL (do not
// edit that file; this copy keeps the two mailto flows in sync).
const CRASH_REPORT_EMAIL = `sho.islam0311@proton.me`;

const Backdrop = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: min(680px, calc(100dvh - 7rem));
  padding: clamp(24px, 6vw, 56px) clamp(16px, 4vw, 32px);
  text-align: center;
`;

const Card = styled.section`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: min(100%, 34rem);
  padding: clamp(28px, 6vw, 46px);
  border: 1px solid
    color-mix(in srgb, var(--primary-accent) 24%, var(--global-border-color));
  border-radius: clamp(16px, 3vw, 26px);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--global-card-bg) 97%, transparent),
      color-mix(in srgb, var(--global-tertiary-bg) 84%, transparent)
    ),
    var(--global-card-bg);
  box-shadow: 0 28px 90px rgba(0, 0, 0, 0.32);
  color: var(--global-text);
  text-align: center;

  &::before {
    position: absolute;
    inset: 0;
    z-index: -1;
    border: 1px solid rgba(255, 255, 255, 0.025);
    border-radius: inherit;
    background-image:
      linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.018) 1px,
        transparent 1px
      ),
      linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px);
    background-size: 26px 26px;
    content: '';
    mask-image: linear-gradient(to bottom, black, transparent 88%);
  }
`;

const Title = styled.h2`
  margin: 0 0 0.5rem;
  color: var(--global-text);
  font-size: clamp(1.35rem, 4vw, 1.75rem);
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const Message = styled.p`
  max-width: 52ch;
  margin: 0 auto 0.9rem;
  color: var(--global-text-muted-strong);
  font-size: 0.9rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const Note = styled.p`
  max-width: 52ch;
  margin: 0 auto 1.25rem;
  color: var(--global-text-muted);
  font-size: 0.8rem;
  line-height: 1.55;
`;

const Details = styled.details`
  max-width: 100%;
  margin: 0 auto 1.35rem;
  text-align: start;

  summary {
    color: var(--global-text-muted);
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    user-select: none;

    &:focus-visible {
      outline: 2px solid var(--primary-accent);
      outline-offset: 2px;
    }
  }

  pre {
    max-height: 14rem;
    margin: 0.5rem 0 0;
    padding: 0.65rem 0.75rem;
    overflow: auto;
    border: 1px solid var(--global-border-color);
    border-radius: var(--global-border-radius);
    background: var(--global-primary-bg);
    color: var(--global-text-muted-strong);
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.72rem;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
`;

const CrashButton = styled.button<{ $variant?: 'primary' }>`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border: 1px solid
    ${({ $variant }) =>
      $variant === 'primary'
        ? 'var(--primary-accent)'
        : 'var(--global-border-color)'};
  border-radius: 10px;
  background: ${({ $variant }) =>
    $variant === 'primary' ? 'var(--primary-accent)' : 'transparent'};
  color: ${({ $variant }) =>
    $variant === 'primary' ? '#0f172a' : 'var(--global-text-muted-strong)'};
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease;

  &:hover {
    transform: translateY(-1px);
    color: ${({ $variant }) => ($variant === 'primary' ? '#0f172a' : 'var(--primary-accent)')};
    border-color: ${({ $variant }) =>
      $variant === 'primary' ? 'var(--primary-accent)' : 'color-mix(in srgb, var(--primary-accent) 55%, var(--global-border-color))'};
  }
  &:focus-visible {
    outline: 2px solid var(--primary-accent);
    outline-offset: 3px;
  }
`;

type ErrorBoundaryProps = {
  children?: React.ReactNode;
  /** Route key — navigating away clears a caught crash (Aniraku
   *  RouteBoundary's resetKey=pathname pattern, App.jsx:22-25 / 73-76). */
  resetKey?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
};

const INITIAL_STATE: ErrorBoundaryState = {
  hasError: false,
  error: null,
  componentStack: null,
};

function firstLine(message: string): string {
  return (message || '').split('\n')[0].trim() || 'Unknown error';
}

// ReportModal.tsx openReportEmail pattern: subject + pre-filled body through
// the visitor's mail client (no backend hop). Body carries the error message,
// JS stack, React component stack, current URL and timestamp.
function openCrashEmail(
  error: Error | null,
  componentStack: string | null,
): void {
  const message = error?.message || 'An unexpected error occurred.';
  const subject = `[Aniraku Crash] ${firstLine(message).slice(0, 120)}`;
  const lines = [
    `Error: ${message}`,
    ``,
    `JS stack:`,
    error?.stack || `-`,
    ``,
    `Component stack:`,
    componentStack || `-`,
    ``,
    `Page: ${window.location.href}`,
    `Timestamp: ${new Date().toISOString()}`,
    ``,
    `--- Add any extra notes above, then press Send. ---`,
  ];
  window.location.href = `mailto:${CRASH_REPORT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(lines.join('\n'))}`;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = INITIAL_STATE;

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, componentStack: null };
  }

  componentDidCatch(_error: Error, info: React.ErrorInfo): void {
    this.setState({ componentStack: info.componentStack ?? null });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState(INITIAL_STATE);
    }
  }

  reload = (): void => {
    window.location.reload();
  };

  report = (): void => {
    try {
      openCrashEmail(this.state.error, this.state.componentStack);
    } catch {
      // Mail client unavailable — the card stays up so the visitor can
      // retry Reload or email the maintainer manually.
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message || 'An unexpected error occurred.';
    const details = [
      message,
      this.state.componentStack
        ? `\n\nComponent stack:\n${this.state.componentStack}`
        : '',
    ].join('');

    return (
      <Backdrop role='alert' aria-live='assertive'>
        <Card>
          <Title>Something went wrong</Title>
          <Message>{firstLine(message)}</Message>
          <Note>
            No account or playback data was changed. Reload to retry, or
            report this diagnostic to the Aniraku project.
          </Note>
          <Details>
            <summary>Error details</summary>
            <pre>{details}</pre>
          </Details>
          <Actions>
            <CrashButton $variant='primary' type='button' onClick={this.reload}>
              Reload
            </CrashButton>
            <CrashButton type='button' onClick={this.report}>
              Report this crash
            </CrashButton>
          </Actions>
        </Card>
      </Backdrop>
    );
  }
}

/**
 * Router-aware wrapper mounted in App.tsx: `resetKey` is the current
 * pathname, so a navigation clears a caught crash without a reload
 * (Aniraku RouteBoundary, App.jsx:73-76). Must render inside <Router>.
 */
export function AppErrorBoundary({
  children,
}: {
  children?: React.ReactNode;
}) {
  const location = useLocation();
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
}

export default ErrorBoundary;
