import React, { useRef } from 'react';

/**
 * Tab navigasi utama. Garis bawah emas (#f5c542) adalah satu-satunya aksen emas di layar kerja,
 * dipakai untuk menandai "di mana saya sekarang".
 * Panah kiri/kanan memindahkan tab (pola WAI-ARIA tabs).
 */
export default function TabNav({ tabs, activeId, onChange }) {
  const refs = useRef({});

  const handleKeyDown = (e, idx) => {
    let next = null;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[tabs[next].id]?.focus();
  };

  return (
    <div className="border-b border-blue-900/10 bg-white">
      <div
        role="tablist"
        aria-label="Menu utama"
        className="mx-auto flex max-w-[1540px] px-2 sm:px-8"
      >
        {tabs.map((tab, idx) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(el) => (refs.current[tab.id] = el)}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`relative flex min-h-12 flex-1 items-center justify-center gap-2 px-3 text-sm font-semibold transition-colors sm:flex-none sm:justify-start sm:px-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#098fd1] cursor-pointer ${
                active ? 'text-[#0a4ea0]' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span aria-hidden="true" className={active ? 'text-[#0a4ea0]' : 'text-slate-400'}>
                {tab.icon}
              </span>
              <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge ? (
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-amber-900">
                  {tab.badge}
                  <span className="sr-only"> perubahan presensi belum disimpan</span>
                </span>
              ) : null}
              <span
                aria-hidden="true"
                className={`absolute inset-x-3 bottom-0 h-[3px] rounded-t ${active ? 'bg-[#f5c542]' : 'bg-transparent'}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
