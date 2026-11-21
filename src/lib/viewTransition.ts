'use client';
/**
 * Shared-element page transitions (View Transitions API) for client-side navigation.
 * The source element carries `view-transition-name: <name>`; the destination renders an element
 * with the same name and `data-vt="<name>"`. Unsupported browsers / reduced motion: plain push.
 */
let active = false;
/** True while the incoming page is being rendered inside a shared transition (skip entrance masks). */
export const viaSharedTransition = () => active;

type VTDoc = Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } };

export function navigateShared(push: (href: string) => void, href: string, name: string) {
  const d = document as VTDoc;
  if (!d.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { push(href); return; }
  active = true;
  const t = d.startViewTransition(() => new Promise<void>(resolve => {
    push(href);
    const t0 = performance.now();
    // Rendering is paused during the update callback, so poll with timers, not rAF.
    const tick = () => (document.querySelector(`[data-vt="${name}"]`) || performance.now() - t0 > 2500) ? resolve() : void setTimeout(tick, 16);
    setTimeout(tick, 16);
  }));
  t.finished.finally(() => { active = false; });
}
