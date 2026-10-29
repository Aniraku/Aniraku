import React from 'react';
import styled from 'styled-components';
import { FaDownload, FaTimes } from 'react-icons/fa';
import {
  useDownloadTasks,
  type DownloadTask,
} from '../lib/episodeDownload';

// Floating download pills (bottom-left): progress + cancel for in-flight
// episode downloads. Deliberately NOT a modal — clicking Download starts
// the work immediately and the user keeps browsing; the finished file is
// committed to Chrome's own download stack. The site's toasts own the
// bottom-right corner, so these stack on the left.

const Stack = styled.div`
  position: fixed;
  bottom: 1rem;
  left: 1rem;
  z-index: var(--z-index-modal, 1000);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: min(21rem, calc(100vw - 2rem));

  @media (max-width: 500px) {
    bottom: 4.25rem; /* above the bottom nav */
  }
`;

const Pill = styled.div<{ $failed?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.7rem 0.8rem;
  background-color: var(--global-secondary-bg);
  color: var(--global-text);
  border: 1px solid
    ${({ $failed }) =>
      $failed ? '#ef8f8f' : 'var(--global-border-color)'};
  border-radius: var(--global-border-radius);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
  animation: popIn 0.25s ease-in-out;
`;

const PillHeader = styled.div<{ $failed?: boolean }>`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 600;

  svg {
    flex-shrink: 0;
    color: ${({ $failed }) => ($failed ? '#ef8f8f' : 'var(--primary-accent)')};
  }
  span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const CancelButton = styled.button`
  display: grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  flex-shrink: 0;
  color: var(--global-text-muted);
  background: none;
  border: none;
  border-radius: var(--global-border-radius);
  cursor: pointer;
  &:hover {
    color: var(--global-text);
    background-color: var(--global-button-hover-bg);
  }
`;

const Track = styled.div`
  height: 0.35rem;
  overflow: hidden;
  background-color: var(--global-div);
  border-radius: 999px;
`;

const Fill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => `${Math.round($pct * 100)}%`};
  background-color: var(--primary-accent);
  border-radius: 999px;
  transition: width 0.3s ease;
`;

const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.68rem;
  color: var(--global-text-muted);
`;

function formatBytes(n: number): string {
  if (n >= 1024 * 1024 * 1024) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}

const PHASE_TEXT: Record<DownloadTask['phase'], string> = {
  preparing: 'Preparing…',
  segments: 'Downloading…',
  muxing: 'Packaging MKV…',
  done: '',
};

const DownloadPill: React.FC<{ task: DownloadTask }> = ({ task }) => {
  const phaseText = task.failed
    ? 'Failed'
    : task.phase === 'done'
      ? 'Saved to Chrome downloads'
      : PHASE_TEXT[task.phase];
  return (
    <Pill $failed={task.failed} role='status'>
      <PillHeader $failed={task.failed}>
        <FaDownload size={12} aria-hidden='true' />
        <span>{task.label}</span>
        {(task.phase !== 'done' || task.failed) && (
          <CancelButton
            onClick={task.cancel}
            aria-label={task.failed ? 'Dismiss' : 'Cancel download'}
            title={task.failed ? 'Dismiss' : 'Cancel download'}
          >
            <FaTimes size={10} />
          </CancelButton>
        )}
      </PillHeader>
      {task.phase !== 'done' && (
        <>
          <Track>
            <Fill $pct={task.pct} />
          </Track>
          <Meta>
            <span>{phaseText}</span>
            <span>
              {task.phase === 'segments' && task.segmentsTotal > 0
                ? `${task.segmentsDone}/${task.segmentsTotal} · ${formatBytes(task.bytes)}`
                : task.phase === 'muxing'
                  ? `${Math.round(task.pct * 100)}%`
                  : ''}
            </span>
          </Meta>
        </>
      )}
      {task.phase === 'done' && !task.failed && (
        <Meta>
          <span>{task.fileName}</span>
        </Meta>
      )}
    </Pill>
  );
};

const DownloadStack: React.FC = () => {
  const tasks = useDownloadTasks();
  if (tasks.length === 0) return null;
  return (
    <Stack aria-label='Active downloads'>
      {tasks.map((task) => (
        <DownloadPill key={task.id} task={task} />
      ))}
    </Stack>
  );
};

export default DownloadStack;
