// VersoRefuerzo — Icon library
// Line-thick stroke style (matches the user's choice from the question).
// All icons are 24x24 viewBox; pass size + color via props.

const Ic = (() => {
  const wrap = (paths) => function Icon({ size = 24, color = 'currentColor', strokeWidth = 2, style }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
           stroke={color} strokeWidth={strokeWidth}
           strokeLinecap="round" strokeLinejoin="round" style={style}>
        {paths}
      </svg>
    );
  };

  return {
    // Core / nav
    home: wrap(<><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>),
    cards: wrap(<><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h14v14"/></>),
    play: wrap(<polygon points="6,4 20,12 6,20" />),
    library: wrap(<><path d="M4 4v16"/><path d="M8 4v16"/><rect x="12" y="4" width="8" height="16" rx="1.5"/></>),
    user: wrap(<><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>),
    plus: wrap(<><path d="M12 5v14"/><path d="M5 12h14"/></>),
    close: wrap(<><path d="M6 6l12 12"/><path d="M18 6L6 18"/></>),
    back: wrap(<path d="M15 5l-7 7 7 7"/>),
    forward: wrap(<path d="M9 5l7 7-7 7"/>),
    check: wrap(<path d="M5 12l5 5 9-11"/>),
    search: wrap(<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></>),
    sparkles: wrap(<><path d="M12 4l1.5 4.5L18 10l-4.5 1.5L12 16l-1.5-4.5L6 10l4.5-1.5L12 4z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/></>),
    flame: wrap(<><path d="M12 3c0 4 5 5 5 11a5 5 0 11-10 0c0-3 2-3 2-7 2 1 3 1 3-4z"/></>),
    settings: wrap(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></>),
    bell: wrap(<><path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 004 0"/></>),
    folder: wrap(<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>),
    edit: wrap(<><path d="M4 20h4l11-11-4-4L4 16v4z"/><path d="M14 6l4 4"/></>),
    trash: wrap(<><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 7l1 13a2 2 0 002 2h8a2 2 0 002-2l1-13"/><path d="M9 7V4h6v3"/></>),
    star: wrap(<polygon points="12,3 14.5,9 21,9.5 16,14 17.5,21 12,17.5 6.5,21 8,14 3,9.5 9.5,9" />),
    starFill: ({ size = 24, color = '#FBBF24', style }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <polygon points="12,3 14.5,9 21,9.5 16,14 17.5,21 12,17.5 6.5,21 8,14 3,9.5 9.5,9" fill={color} stroke={color} strokeWidth={1.5} strokeLinejoin="round"/>
      </svg>
    ),
    eye: wrap(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>),
    eyeOff: wrap(<><path d="M3 3l18 18"/><path d="M10.5 6.2A10 10 0 0112 6c6 0 10 6 10 6a17 17 0 01-3 3.5"/><path d="M6.6 6.6A17 17 0 002 12s4 6 10 6a10 10 0 005.4-1.6"/><path d="M9.5 9.5a3 3 0 005 5"/></>),
    refresh: wrap(<><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 4v5h-5"/></>),
    clock: wrap(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
    chart: wrap(<><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></>),
    target: wrap(<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></>),
    shuffle: wrap(<><path d="M16 3h5v5"/><path d="M3 21l18-18"/><path d="M16 21h5v-5"/><path d="M3 3l7 7"/><path d="M14 14l7 7"/></>),
    grid: wrap(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>),
    google: ({ size = 24, style }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" style={style}>
        <path d="M22 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.8z" fill="#4285F4"/>
        <path d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-1 .6-2.2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7C4.4 19.6 7.9 22 12 22z" fill="#34A853"/>
        <path d="M6.2 13.7a6 6 0 010-3.8V7.2H2.7a10 10 0 000 9l3.5-2.6z" fill="#FBBC04"/>
        <path d="M12 5.9c1.5 0 2.9.5 4 1.6l3-3C17.1 2.7 14.7 2 12 2 7.9 2 4.4 4.4 2.7 7.7L6.2 10c.8-2.5 3.1-4.1 5.8-4.1z" fill="#EA4335"/>
      </svg>
    ),

    // Verse iconography (the user can pick these for cards)
    bible: wrap(<><path d="M5 4a2 2 0 012-2h11v18H7a2 2 0 00-2 2V4z"/><path d="M5 20a2 2 0 002 2h11"/><path d="M12 6v8"/><path d="M9 9h6"/></>),
    cross: wrap(<><path d="M12 3v18"/><path d="M7 9h10"/></>),
    dove: wrap(<><path d="M3 13c2-1 4-1 6 0 1-3 4-5 8-5l3 1-1 2c-1 1-2 2-2 3 0 4-3 7-7 7-3 0-5-2-5-4 0-1 .5-2-2-4z"/><circle cx="18" cy="8" r=".7" fill="currentColor"/></>),
    sheep: wrap(<><circle cx="12" cy="11" r="5"/><circle cx="8" cy="9" r="2"/><circle cx="16" cy="9" r="2"/><circle cx="9" cy="14" r="1.7"/><circle cx="15" cy="14" r="1.7"/><path d="M9 17v3"/><path d="M15 17v3"/></>),
    lion: wrap(<><circle cx="12" cy="13" r="5"/><path d="M12 4l-2 3M12 4l2 3M5 8l3 1M19 8l-3 1M5 14l3-1M19 14l-3-1"/><circle cx="10" cy="12" r=".7" fill="currentColor"/><circle cx="14" cy="12" r=".7" fill="currentColor"/></>),
    fishLoaves: wrap(<><path d="M3 12c2-3 5-4 7-4s5 1 7 4-2 4-7 4-9-1-7-4z"/><path d="M19 11l3-2v6l-3-2"/><circle cx="9" cy="11" r=".7" fill="currentColor"/></>),
    crown: wrap(<><path d="M3 8l3 8h12l3-8-5 3-4-6-4 6-5-3z"/><path d="M5 19h14"/></>),
    flameSmall: wrap(<path d="M12 3c0 3 4 4 4 9a4 4 0 11-8 0c0-2 1-2 1-5 1.5.5 2 .5 3-4z"/>),
    heart: wrap(<path d="M20.8 6.6a5 5 0 00-7.1 0L12 8.3l-1.7-1.7a5 5 0 00-7.1 7.1l1.7 1.7L12 22l7.1-7.1 1.7-1.7a5 5 0 000-6.6z"/>),
    seed: wrap(<><path d="M12 3c-3 4-3 8 0 14"/><path d="M12 3c3 4 3 8 0 14"/><circle cx="12" cy="20" r="2"/></>),
    mountain: wrap(<><path d="M3 20l6-10 4 6 3-4 5 8z"/><circle cx="9" cy="6" r="1.5"/></>),
    water: wrap(<><path d="M12 3c4 5 6 8 6 11a6 6 0 11-12 0c0-3 2-6 6-11z"/></>),
    sun: wrap(<><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/></>),
    door: wrap(<><rect x="6" y="3" width="12" height="18" rx="1"/><circle cx="14" cy="12" r=".8" fill="currentColor"/></>),
    shield: wrap(<><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/></>),
    handPray: wrap(<><path d="M9 21h6l1-3-3-2v-9c0-2-2-2-2 0v6"/><path d="M9 13V8c0-2 2-2 2 0v5"/></>),
    book: wrap(<><path d="M4 5c0-1 1-2 2-2h12v18H6c-1 0-2-1-2-2V5z"/><path d="M4 19c0-1 1-2 2-2h12"/></>),
    anchor: wrap(<><circle cx="12" cy="6" r="2"/><path d="M12 8v13"/><path d="M5 13c0 5 4 8 7 8s7-3 7-8"/><path d="M8 16H4M16 16h4"/></>),

    // Feature/info icons (replaces emoji on Login)
    brain: wrap(<><path d="M9 4a3 3 0 00-3 3v1a3 3 0 00-2 3 3 3 0 002 3v1a3 3 0 003 3h.5"/><path d="M15 4a3 3 0 013 3v1a3 3 0 012 3 3 3 0 01-2 3v1a3 3 0 01-3 3h-.5"/><path d="M12 5v14"/><path d="M9 9h.01M15 9h.01M9 14h.01M15 14h.01"/></>),
    repeat: wrap(<><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 01-4 4H3"/></>),
    gamepad: wrap(<><rect x="2" y="8" width="20" height="11" rx="4"/><path d="M7 12v3M5.5 13.5h3"/><circle cx="16" cy="13" r="1" fill="currentColor"/><circle cx="18" cy="15" r="1" fill="currentColor"/></>),
    shieldLock: wrap(<><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/><rect x="9.5" y="11" width="5" height="4" rx=".7"/><path d="M10.5 11v-1.5a1.5 1.5 0 113 0V11"/></>),
  };
})();

window.Ic = Ic;
