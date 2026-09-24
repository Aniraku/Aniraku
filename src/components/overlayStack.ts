// Shared Escape-key overlay stack — port of live's `yh`/`Ch`/`Sh` handlers
// around the `_h` handler array: Escape closes ONLY the top-most registered
// overlay (so a notifications drawer stacked over the shortcuts popup closes
// the drawer first, like live). Handlers register while their overlay is open
// and unregister on close; the document listener exists only while the stack
// is non-empty.

type OverlayHandler = () => void;

const stack: OverlayHandler[] = [];
let listening = false;

const handleKeydown = (e: KeyboardEvent): void => {
  if (e.key !== 'Escape' || stack.length === 0) return;
  const top = stack[stack.length - 1];
  try {
    top();
  } catch {
    // live swallows handler errors so one broken overlay cannot strand the stack
  }
};

export function registerOverlayHandler(handler: OverlayHandler): () => void {
  stack.push(handler);
  if (!listening) {
    document.addEventListener('keydown', handleKeydown);
    listening = true;
  }
  return () => {
    const index = stack.lastIndexOf(handler);
    if (index !== -1) stack.splice(index, 1);
    if (stack.length === 0 && listening) {
      document.removeEventListener('keydown', handleKeydown);
      listening = false;
    }
  };
}
