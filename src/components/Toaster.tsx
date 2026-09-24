import { useEffect, useSyncExternalStore } from 'react';
import { useTheme } from './ThemeContext';
import './toaster.css';

// ---------------------------------------------------------------------------
// Sonner-compatible toast host + imperative API.
//
// sonner is not a dependency of this project (no new deps allowed), so this
// ports live's sonner bundle (chunk-OB3PAWPO): the DOM shape
// (<ol data-sonner-toaster …> / <li data-sonner-toast data-styled data-mounted
// …> with [data-icon]/[data-content]/[data-title]/[data-description]), the
// type icons (dn/fn/pn/mn paths, verbatim), the live `ty` config
// (bottom-right, offset 24/16/16, gap 8, no richColors, mobileOffset) and its
// inline toast style. Positioning math is replaced by the flow-stacking shim
// in toaster.css (see that file's header). Used for NEW toasts only — other
// pages keep their inline toast implementations.
// ---------------------------------------------------------------------------

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  description?: string;
  duration?: number;
  id?: string;
  type?: ToastType;
}

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration: number;
  mounted: boolean;
  removing: boolean;
}

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

// live `ty` toastOptions.style — verbatim
const TOAST_STYLE: CSSVars = {
  fontFamily: 'var(--app-font-family)',
  backgroundColor: 'var(--global-secondary-bg)',
  color: 'var(--global-text)',
  borderColor: 'var(--global-border-color)',
  borderRadius: 'var(--global-border-radius)',
};

// live `ty` config (position bottom-right → x=right, y=bottom)
const TOASTER_OFFSET = {
  bottom: '24px',
  right: '16px',
  left: '16px',
};
const TOASTER_MOBILE_OFFSET = {
  top: '0px',
  right: '0px',
  bottom: '1.25rem',
  left: '0px',
};

let toasts: ToastItem[] = [];
let seq = 0;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();

const emit = (): void => {
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): ToastItem[] => toasts;

const scheduleRemoval = (id: string, delay: number): void => {
  const existing = timers.get(id);
  if (existing) clearTimeout(existing);
  timers.set(
    id,
    setTimeout(() => {
      dismissToast(id);
    }, delay)
  );
};

export function showToast(title: string, options: ToastOptions = {}): string {
  const id = options.id ?? `toast-${++seq}`;
  const item: ToastItem = {
    id,
    title,
    description: options.description,
    type: options.type ?? 'default',
    duration: options.duration ?? 4000,
    mounted: false,
    removing: false,
  };
  const stale = timers.get(id);
  if (stale) clearTimeout(stale);
  // sonner replaces a toast that reuses an id; the newest sits at the end of
  // the bottom-anchored stack (flex column → nearest the corner)
  toasts = [...toasts.filter((toastItem) => toastItem.id !== id), item];
  emit();
  scheduleRemoval(id, item.duration);
  return id;
}

export function dismissToast(id?: string): void {
  const targets = id
    ? toasts.filter((toastItem) => toastItem.id === id)
    : [...toasts];
  if (targets.length === 0) return;
  const targetIds = new Set(targets.map((toastItem) => toastItem.id));
  targetIds.forEach((targetId) => {
    const timer = timers.get(targetId);
    if (timer) {
      clearTimeout(timer);
      timers.delete(targetId);
    }
  });
  // data-removed + data-front triggers the raw exit transition (.4s), the
  // element unmounts when it finishes (sonner timing)
  toasts = toasts.map((toastItem) =>
    targetIds.has(toastItem.id) ? { ...toastItem, removing: true } : toastItem
  );
  emit();
  setTimeout(() => {
    toasts = toasts.filter((toastItem) => !targetIds.has(toastItem.id));
    emit();
  }, 400);
}

export const toast = Object.assign(
  (title: string, options?: ToastOptions): string => showToast(title, options),
  {
    success: (title: string, options?: Omit<ToastOptions, 'type'>): string =>
      showToast(title, { ...options, type: 'success' }),
    error: (title: string, options?: Omit<ToastOptions, 'type'>): string =>
      showToast(title, { ...options, type: 'error' }),
    warning: (title: string, options?: Omit<ToastOptions, 'type'>): string =>
      showToast(title, { ...options, type: 'warning' }),
    info: (title: string, options?: Omit<ToastOptions, 'type'>): string =>
      showToast(title, { ...options, type: 'info' }),
    dismiss: (id?: string): void => dismissToast(id),
  }
);

// ---------------------------------------------------------------------------
// Icons — verbatim from live's sonner chunk: dn (success check-circle),
// fn (warning triangle), pn (info circle-i), mn (error circle-!)
// ---------------------------------------------------------------------------
const SuccessIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    height="20"
    width="20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
    />
  </svg>
);

const WarningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    height="20"
    width="20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
    />
  </svg>
);

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    height="20"
    width="20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    height="20"
    width="20"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
    />
  </svg>
);

const ICONS = {
  success: SuccessIcon,
  warning: WarningIcon,
  info: InfoIcon,
  error: ErrorIcon,
} as const;

export function Toaster() {
  const { theme } = useTheme();
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // sonner mounts each toast closed (data-mounted=false) then flips it for
  // the CSS entry transition; the flip creates new snapshots, so this effect
  // settles once every toast is mounted
  useEffect(() => {
    if (!items.some((item) => !item.mounted)) return;
    const frame = requestAnimationFrame(() => {
      toasts = toasts.map((item) => ({ ...item, mounted: true }));
      emit();
    });
    return () => cancelAnimationFrame(frame);
  }, [items]);

  // live maps theme St.mode → sonner's data-sonner-theme:
  // system → system, light → light, dark/anilist/catppuccin → dark
  const sonnerTheme =
    theme === 'system' ? 'system' : theme === 'light' ? 'light' : 'dark';

  const toasterStyle: CSSVars = {
    '--width': '356px',
    '--gap': '8px',
    '--offset-bottom': TOASTER_OFFSET.bottom,
    '--offset-right': TOASTER_OFFSET.right,
    '--offset-left': TOASTER_OFFSET.left,
    '--mobile-offset-top': TOASTER_MOBILE_OFFSET.top,
    '--mobile-offset-right': TOASTER_MOBILE_OFFSET.right,
    '--mobile-offset-bottom': TOASTER_MOBILE_OFFSET.bottom,
    '--mobile-offset-left': TOASTER_MOBILE_OFFSET.left,
  };

  return (
    <ol
      data-sonner-toaster="true"
      dir="ltr"
      data-x-position="right"
      data-y-position="bottom"
      data-sonner-theme={sonnerTheme}
      style={toasterStyle}
    >
      {items.map((item, index) => {
        const Icon = item.type === 'default' ? null : ICONS[item.type];
        const toastStyle: CSSVars = {
          ...TOAST_STYLE,
          '--z-index': String(999999999 - index),
        };
        return (
          <li
            key={item.id}
            data-sonner-toast="true"
            data-styled="true"
            data-mounted={String(item.mounted)}
            data-removed={String(item.removing)}
            data-front="true"
            data-swipe-out="false"
            data-visible="true"
            data-y-position="bottom"
            data-x-position="right"
            data-index={index}
            data-type={item.type}
            role="status"
            aria-live={item.type === 'error' ? 'assertive' : 'polite'}
            style={toastStyle}
          >
            {Icon ? (
              <div data-icon="true">
                <Icon />
              </div>
            ) : null}
            <div data-content="true">
              <div data-title="true">{item.title}</div>
              {item.description ? (
                <div data-description="true">{item.description}</div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
