/* ============================================================
   TradeOS v4.0 — components/sync-button
   Small "Refresh" button that triggers Sync.runOnce() and
   mirrors the global sync state. Use anywhere a module wants
   a per-page manual sync affordance. The topbar pill is the
   primary affordance; this is a secondary one for context.
   ============================================================ */

import { t } from '../js/i18n.js';
import * as Sync from '../js/sync.js';

/**
 * Render a button element into `host` (or replace its innerHTML if it's
 * already a button). Returns an unsubscribe fn that cleans up listeners.
 */
export function mountSyncButton(host) {
  if (!host) return () => {};

  host.innerHTML = `
    <button type="button" class="btn sm ghost sync-btn" data-state="idle" title="">
      <span class="ind"></span>
      <span class="lbl">${t('sync_now_btn')}</span>
    </button>`;
  const btn = host.querySelector('.sync-btn');
  const lbl = btn.querySelector('.lbl');

  const onClick = () => Sync.runOnce();
  btn.addEventListener('click', onClick);

  const unsub = Sync.subscribe(snap => {
    btn.dataset.state = snap.state;
    switch (snap.state) {
      case Sync.STATES.SYNCING:      lbl.textContent = t('sync_syncing'); break;
      case Sync.STATES.ERROR:        lbl.textContent = t('sync_error');   break;
      case Sync.STATES.OFFLINE:      lbl.textContent = t('sync_offline'); break;
      case Sync.STATES.UNCONFIGURED: lbl.textContent = t('sync_unconfigured'); break;
      case Sync.STATES.OK:           lbl.textContent = t('sync_now_btn'); break;
      default:                       lbl.textContent = t('sync_now_btn');
    }
    btn.title = snap.lastError ? snap.lastError : t('sync_now_btn');
  });

  return () => {
    btn.removeEventListener('click', onClick);
    unsub();
  };
}
