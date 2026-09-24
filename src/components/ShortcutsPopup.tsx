import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { useTheme } from './ThemeContext';
import { registerOverlayHandler } from './overlayStack';

interface ShortcutsPopupProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const ShortcutsPopup: React.FC<ShortcutsPopupProps> = ({
  isOpen,
  onClose: onCloseProp,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showShortcuts, setShowShortcuts] = useState(true);
  const [internalOpen, setInternalOpen] = useState(false);

  // uncontrolled by default (App renders <ShortcutsPopup />); controlled
  // isOpen/onClose stay supported for compatibility
  const controlled = isOpen !== undefined;
  const open = isOpen ?? internalOpen;

  // the body keeps referencing `onClose`; it forwards to a controlled
  // onClose when supplied and otherwise closes internal state
  const onClose = React.useCallback(() => {
    onCloseProp?.();
    if (!controlled) setInternalOpen(false);
  }, [controlled, onCloseProp]);

  // live `Hh` tab-aware toggle for global-shortcuts:toggle-shortcuts-popup
  // (dispatched by useGlobalShortcuts for Shift+?, including the Settings
  // row's synthetic window keydown): closed → open on the Shortcuts tab;
  // open on the Settings tab → jump to Shortcuts; open on Shortcuts → close.
  useEffect(() => {
    const toggle = () => {
      if (!open) {
        setShowShortcuts(true);
        setInternalOpen(true);
      } else if (!showShortcuts) {
        setShowShortcuts(true);
      } else {
        onClose();
      }
    };
    window.addEventListener('global-shortcuts:toggle-shortcuts-popup', toggle);
    return () =>
      window.removeEventListener('global-shortcuts:toggle-shortcuts-popup', toggle);
  }, [open, showShortcuts, onClose]);

  // live overlay stack: Escape closes only the top-most overlay (a
  // notifications drawer stacked above this popup wins the Escape)
  useEffect(() => {
    if (!open) return;
    return registerOverlayHandler(onClose);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="shortcutsPopup" onClick={onClose}>
      <div className="shortcutsContent" onClick={(e) => e.stopPropagation()}>
        <button className="closeButton" onClick={onClose}>
          <FiX />
        </button>

        <div className="popupHeader">
          <h2>Aniraku</h2>
          <span className="subtitle">Free Anime Streaming</span>
        </div>

        <div className="popupTabs">
          <button
            className={`tab ${!showShortcuts ? 'active' : ''}`}
            onClick={() => setShowShortcuts(false)}
          >
            Settings
          </button>
          <button
            className={`tab ${showShortcuts ? 'active' : ''}`}
            onClick={() => setShowShortcuts(true)}
          >
            Shortcuts
          </button>
        </div>

        {showShortcuts ? (
          <div className="shortcutsList">
            <div className="shortcutCategory">
              <h3>Global / App</h3>
              <div className="shortcutRows">
              <div className="shortcutItem">
                <span className="shortcutDescription">Open Shortcuts</span>
                <div className="shortcutKeys">
                  <kbd>Shift</kbd>
                  <span>+</span>
                  <kbd>?</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Open Settings</span>
                <div className="shortcutKeys">
                  <kbd>⌃</kbd>
                  <span>or</span>
                  <kbd>⌘</kbd>
                  <span>or</span>
                  <kbd>⇧</kbd>
                  <span>+</span>
                  <kbd>,</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Focus Search</span>
                <div className="shortcutKeys">
                  <kbd>/</kbd>
                  <span>/</span>
                  <kbd>⌃</kbd>
                  <span>or</span>
                  <kbd>⌘</kbd>
                  <span>+</span>
                  <kbd>S</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Open Notifications</span>
                <div className="shortcutKeys">
                  <kbd>Shift</kbd>
                  <span>+</span>
                  <kbd>M</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Open Side Menu</span>
                <div className="shortcutKeys">
                  <kbd>Shift</kbd>
                  <span>+</span>
                  <kbd>T</kbd>
                  <span>or</span>
                  <kbd>V</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Toggle Theme</span>
                <div className="shortcutKeys">
                  <kbd>Shift</kbd>
                  <span>+</span>
                  <kbd>D</kbd>
                </div>
              </div>
              </div>
            </div>

            <div className="shortcutCategory">
              <h3>Watching / Episodes</h3>
              <div className="shortcutRows">
              <div className="shortcutItem">
                <span className="shortcutDescription">Previous Episode</span>
                <div className="shortcutKeys">
                  <kbd>Shift</kbd>
                  <span>+</span>
                  <kbd>P</kbd>
                  <span>or</span>
                  <kbd>B</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Next Episode</span>
                <div className="shortcutKeys">
                  <kbd>Shift</kbd>
                  <span>+</span>
                  <kbd>N</kbd>
                </div>
              </div>
              </div>
            </div>

            <div className="shortcutCategory">
              <h3>Player Controls</h3>
              <div className="shortcutRows">
              <div className="shortcutItem">
                <span className="shortcutDescription">Play/Pause Toggle</span>
                <div className="shortcutKeys">
                  <kbd>K</kbd>
                  <span>/</span>
                  <kbd>Space</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Seek Backward 10 Seconds</span>
                <div className="shortcutKeys">
                  <kbd>J</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Seek Forward 10 Seconds</span>
                <div className="shortcutKeys">
                  <kbd>L</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Toggle Fullscreen</span>
                <div className="shortcutKeys">
                  <kbd>F</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Toggle Theater Mode</span>
                <div className="shortcutKeys">
                  <kbd>T</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Toggle Mute</span>
                <div className="shortcutKeys">
                  <kbd>M</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Screenshot Player</span>
                <div className="shortcutKeys">
                  <kbd>Shift</kbd>
                  <span>+</span>
                  <kbd>S</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Skip Intro/Outro (otherwise skip 85s)</span>
                <div className="shortcutKeys">
                  <kbd>Shift</kbd>
                  <span>+</span>
                  <kbd>⏎</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Increase Volume</span>
                <div className="shortcutKeys">
                  <kbd>↑</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Decrease Volume</span>
                <div className="shortcutKeys">
                  <kbd>↓</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Seek Forward 5 Seconds</span>
                <div className="shortcutKeys">
                  <kbd>→</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Seek Backward 5 Seconds</span>
                <div className="shortcutKeys">
                  <kbd>←</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Increase Playback Speed</span>
                <div className="shortcutKeys">
                  <kbd>,</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Decrease Playback Speed</span>
                <div className="shortcutKeys">
                  <kbd>.</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">2× Speed (hold)</span>
                <div className="shortcutKeys">
                  <kbd>Hold Space</kbd>
                  <span>/</span>
                  <kbd>Hold Player</kbd>
                </div>
              </div>
              <div className="shortcutItem">
                <span className="shortcutDescription">Jump to Percentage (0-90%)</span>
                <div className="shortcutKeys">
                  <kbd>0-9</kbd>
                </div>
              </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="settingsPanel">
            <div className="popupRows">
            <div className="settingItem">
              <div className="settingInfo">
                <span className="settingLabel">Theme</span>
                <span className="settingDescription">
                  Current: {theme}
                </span>
              </div>
              <button className="themeToggleBtn" onClick={toggleTheme}>
                {theme === 'light' ? '🌙' : theme === 'dark' ? '🐱' : '🎨'}
              </button>
            </div>

            <div className="settingItem">
              <div className="settingInfo">
                <span className="settingLabel">Watchlist</span>
                <span className="settingDescription">
                  Manage your anime list
                </span>
              </div>
              <Link to="/profile" className="settingLink" onClick={onClose}>
                Open
              </Link>
            </div>

            <div className="settingItem">
              <div className="settingInfo">
                <span className="settingLabel">Watch History</span>
                <span className="settingDescription">
                  View your watch history
                </span>
              </div>
              <Link to="/history" className="settingLink" onClick={onClose}>
                Open
              </Link>
            </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortcutsPopup;
