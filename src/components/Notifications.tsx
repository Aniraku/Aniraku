import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiX } from 'react-icons/fi';
import { useAuth as useSupabaseAuth } from '../hooks/useAuth';
import { showToast } from './Toaster';
import { registerOverlayHandler } from './overlayStack';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  refreshNotifications,
  subscribeNotifications,
  type NotificationItem,
} from '../lib/sync';
import { infoPathFor } from '../utils/animePaths';
import './notifications.css';

// Export-compat shims (the badge-critical names live in lib/sync and keep
// working over the API layer; re-exported here so the contract holds from
// either import site — Wave A's Navbar imports them from lib/sync today).
export {
  fetchNotifications,
  readNotificationReadIds,
  markNotificationRead,
  markAllNotificationsRead,
} from '../lib/sync';

// ---------------------------------------------------------------------------
// Notifications drawer — port of live `wh` (overlay) + `U_` (drawer), portal
// to document.body, live hashed class names rendered verbatim (styling in
// notifications.css). Open/close is driven by the Navbar state machine:
// the bell toggles it, Shift+M dispatches global-shortcuts:open-notifications
// (toggle) alongside global-shortcuts:close-sidemenu, and route changes close
// it — same wiring as live `sv`.
//
// Guest behavior (coordinator override — user rules: "no AniList sign-in"
// anywhere + "notifications the same way Aniraku does"): the drawer renders
// for everyone; guests see the same list body with the empty state (their
// store stays empty — the 30s poll only runs on an account session), and the
// header actions surface login warning toasts gated on the SUPABASE session.
// There is no AniList login surface in this drawer.
//
// Wave B mission 2 — DATA LAYER = Aniraku's exact mechanism, drawer visuals
// unchanged:
//   - rows come from the lib/sync store fed by the 30s session poll
//     (`GET ${API_BASE}/api/v1/notifications`, Bearer — NavBar.jsx:32-55);
//   - server `read` column is the authority (the LS read-set
//     `aniraku:notifications-read` is retired — no reads/writes here);
//   - clicking an UNREAD row runs markRead → optimistic store flip + `PUT
//     /api/v1/notifications/{id}/read` (NavBar.jsx:57-70, :159), then closes
//     and routes to the title's info page when `anime_id` is present
//     (NavBar.jsx:158-160, our route = `/info/{id}`);
//   - empty payload → "No notifications yet" (NavBar.jsx:154-155).
// BLESSED EXPORT: `useNotifications()` → { notifications, unreadCount,
// markRead, refresh }. Wave A's bell badge still runs on the lib/sync shims
// (fetchNotifications / readNotificationReadIds) and can migrate to this
// hook whenever it is edited next.
// ---------------------------------------------------------------------------

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

// live `Ah` — reload icon (viewBox 0 0 512 512), path verbatim
const ReloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width="14"
    height="14"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M256 388c-72.597 0-132-59.405-132-132 0-72.601 59.403-132 132-132 36.3 0 69.299 15.4 92.406 39.601L278 234h154V80l-51.698 51.702C348.406 99.798 304.406 80 256 80c-96.797 0-176 79.203-176 176s78.094 176 176 176c81.045 0 148.287-54.134 169.401-128H378.85c-18.745 49.561-67.138 84-122.85 84z" />
  </svg>
);

/**
 * BLESSED notifications API (export contract): subscribes to the lib/sync
 * store (fed by the shared 30s session poll — one interval app-wide, not one
 * per hook instance), derives the unread count from the server `read` column,
 * exposes Aniraku's click-mark-read and a manual refresh for the drawer's
 * reload button.
 */
export interface UseNotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
  markRead: (id: string) => void;
  refresh: () => void;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    getNotifications,
  );
  useEffect(() => subscribeNotifications(setNotifications), []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );
  const markRead = useCallback((id: string) => {
    markNotificationRead(id);
  }, []);
  const refresh = useCallback(() => {
    void refreshNotifications();
  }, []);

  return { notifications, unreadCount, markRead, refresh };
}

const Notifications = ({ isOpen, onClose }: NotificationsProps) => {
  const supabaseAuth = useSupabaseAuth();
  const accountUser = supabaseAuth?.user ?? null;
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Server-backed rows (30s poll in lib/sync) + `read` column as authority.
  const { notifications: items, markRead, refresh } = useNotifications();
  const unreadCount = items.filter((item) => !item.read).length;

  // live `yh` overlay stack: Escape closes only the top-most overlay
  useEffect(() => {
    if (!isOpen) return;
    return registerOverlayHandler(onClose);
  }, [isOpen, onClose]);

  // live `U_` outside-click via drawer ref. The full-screen overlay swallows
  // its own mousedown (and closes on its click) first, so this listener only
  // catches elements painted above the overlay — e.g. toasts.
  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose]);

  const handleReload = () => {
    if (!accountUser) {
      // account-session warning (guests never reach the API)
      showToast('Please log in to refresh notifications.', { type: 'warning' });
      return;
    }
    // logged-in refetch → GET /api/v1/notifications (session poll also runs)
    refresh();
  };

  const handleMarkAll = () => {
    if (!accountUser) {
      // account-session warning (guests never reach the API)
      showToast('Please log in to mark notifications as read.', {
        type: 'warning',
      });
      return;
    }
    // one PUT /notifications/{id}/read per currently-unread row (server `read`
    // column flips; the store notifies this drawer)
    markAllNotificationsRead(
      items.filter((item) => !item.read).map((item) => item.id),
    );
  };

  // Aniraku row interaction (NavBar.jsx:157-161): close the panel, mark read
  // ONLY when the row is unread, then open the title when it has an id.
  const handleOpenItem = (item: NotificationItem) => {
    onClose();
    if (!item.read) markRead(item.id);
    if (item.animeId !== null) navigate(infoPathFor({ id: item.animeId }));
  };

  return createPortal(
    <>
      {/* live `wh` overlay — gh.overlayContainer rules (blur backdrop); the
          only prop live passes through is the backdrop z-index. Clicking the
          overlay itself closes; mousedown is swallowed there so the drawer's
          document listener cannot double-fire */}
      <div
        className={`_overlayContainer_1bzcd_1 ${isOpen ? '_visible_1bzcd_29' : ''}`}
        style={{ zIndex: 'var(--z-index-modal-backdrop)' }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
        }}
      />
      <div className="_drawer_fb11q_1" data-open={String(isOpen)} ref={drawerRef}>
        <div className="_header_fb11q_31">
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Notifications
            {unreadCount > 0 && (
              <span className="notifCount">
                {unreadCount} new
              </span>
            )}
          </span>
          <div className="_buttonsContainer_fb11q_47">
            <button
              type="button"
              className="_iconButton_fb11q_52"
              onClick={handleReload}
              aria-label="Reload Notifications"
              tabIndex={-1}
            >
              <ReloadIcon />
            </button>
            <button
              type="button"
              className="_iconButton_fb11q_52 _markAllButton_fb11q_73"
              onClick={handleMarkAll}
            >
              <FiCheck size={12} aria-hidden="true" />
              Mark all read
            </button>
            <button
              type="button"
              className="_iconButton_fb11q_52"
              onClick={onClose}
              aria-label="Close Menu"
              tabIndex={-1}
            >
              <FiX size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="_drawerBody_fb11q_89">
          <div className="_notificationList_fb11q_80">
              {items.length === 0 ? (
                <div className="_listEmptyState_fb11q_171 notifEmpty">
                  <FiBell className="notifEmptyIcon" aria-hidden="true" />
                  <strong className="notifEmptyTitle">
                    No notifications yet
                  </strong>
                  <span className="notifEmptySub">You&apos;re all caught up.</span>
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="notifRow"
                    data-read={String(item.read)}
                    onClick={() => handleOpenItem(item)}
                  >
                    <span className="notifRowMsg">
                      {item.message}
                      {!item.read && (
                        <span className="notifNew">NEW</span>
                      )}
                    </span>
                    {item.createdAt && (
                      <span className="notifRowTime">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    )}
                  </button>
                ))
              )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default Notifications;
