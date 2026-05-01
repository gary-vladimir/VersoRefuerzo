// VersoRefuerzo — Sample data + shared components
// Verses, collections, mock user state for the prototype.

const SAMPLE_VERSES = [
  {
    id: 'v1',
    ref: 'Juan 14:6',
    refEn: 'John 14:6',
    text: 'Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre sino por mí.',
    textEn: 'Jesus said to him, "I am the way, the truth, and the life. No one comes to the Father except through Me."',
    version: 'NBLA',
    icon: 'cross',
    color: 'indigo',
    hint: 'camino, verdad, vida',
    collections: ['Evangelios', 'Promesas'],
    mastery: 0.82,
    streak: 7,
    nextReview: 'mañana',
    status: 'mastered',
  },
  {
    id: 'v2',
    ref: 'Romanos 8:28',
    refEn: 'Romans 8:28',
    text: 'Y sabemos que para los que aman a Dios, todas las cosas cooperan para bien, para los que son llamados conforme a Su propósito.',
    textEn: 'And we know that God causes all things to work together for good to those who love God, to those who are called according to His purpose.',
    version: 'NBLA',
    icon: 'heart',
    color: 'rose',
    hint: 'todas las cosas cooperan',
    collections: ['Romanos', 'Promesas'],
    mastery: 0.55,
    streak: 3,
    nextReview: 'hoy',
    status: 'learning',
  },
  {
    id: 'v3',
    ref: 'Salmos 23:1',
    refEn: 'Psalm 23:1',
    text: 'El Señor es mi pastor, nada me faltará.',
    textEn: 'The Lord is my shepherd, I shall not want.',
    version: 'RVR1960',
    icon: 'sheep',
    color: 'emerald',
    hint: 'pastor, nada faltará',
    collections: ['Salmos', 'Favoritos'],
    mastery: 0.95,
    streak: 21,
    nextReview: 'en 4 días',
    status: 'mastered',
  },
  {
    id: 'v4',
    ref: 'Filipenses 4:13',
    refEn: 'Philippians 4:13',
    text: 'Todo lo puedo en Cristo que me fortalece.',
    textEn: 'I can do all things through Christ who strengthens me.',
    version: 'RVR1960',
    icon: 'flameSmall',
    color: 'amber',
    hint: 'todo, Cristo, fortalece',
    collections: ['Promesas', 'Favoritos'],
    mastery: 0.88,
    streak: 12,
    nextReview: 'en 2 días',
    status: 'mastered',
  },
  {
    id: 'v5',
    ref: 'Proverbios 3:5-6',
    refEn: 'Proverbs 3:5-6',
    text: 'Confía en el Señor con todo tu corazón, y no te apoyes en tu propio entendimiento. Reconócelo en todos tus caminos, y Él enderezará tus sendas.',
    textEn: 'Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge Him, and He will make your paths straight.',
    version: 'NBLA',
    icon: 'mountain',
    color: 'sky',
    hint: 'confía, no te apoyes',
    collections: ['Proverbios', 'Mañana'],
    mastery: 0.40,
    streak: 2,
    nextReview: 'hoy',
    status: 'learning',
  },
  {
    id: 'v6',
    ref: 'Romanos 12:2',
    refEn: 'Romans 12:2',
    text: 'No se adapten a este mundo, sino transfórmense mediante la renovación de su mente.',
    textEn: 'Do not be conformed to this world, but be transformed by the renewing of your mind.',
    version: 'NVI',
    icon: 'sparkles',
    color: 'violet',
    hint: 'no se adapten, transfórmense',
    collections: ['Romanos'],
    mastery: 0.20,
    streak: 1,
    nextReview: 'hoy',
    status: 'new',
  },
  {
    id: 'v7',
    ref: 'Mateo 6:33',
    refEn: 'Matthew 6:33',
    text: 'Pero busquen primero el reino de Dios y Su justicia, y todas estas cosas les serán añadidas.',
    textEn: 'But seek first His kingdom and His righteousness, and all these things will be added to you.',
    version: 'NBLA',
    icon: 'crown',
    color: 'midnight',
    hint: 'busquen primero',
    collections: ['Evangelios', 'Mañana'],
    mastery: 0.65,
    streak: 5,
    nextReview: 'hoy',
    status: 'learning',
  },
  {
    id: 'v8',
    ref: 'Isaías 41:10',
    refEn: 'Isaiah 41:10',
    text: 'No temas, porque yo estoy contigo; no te angusties, porque yo soy tu Dios.',
    textEn: 'Do not fear, for I am with you; do not be afraid, for I am your God.',
    version: 'NVI',
    icon: 'shield',
    color: 'crimson',
    hint: 'no temas, contigo',
    collections: ['Promesas', 'Favoritos'],
    mastery: 0.72,
    streak: 9,
    nextReview: 'en 1 día',
    status: 'mastered',
  },
];

const SAMPLE_COLLECTIONS = [
  { id: 'romanos', name: 'Romanos', count: 2, color: 'Romanos', desc: 'La epístola completa' },
  { id: 'salmos', name: 'Salmos', count: 1, color: 'Salmos', desc: 'Cánticos del corazón' },
  { id: 'evangelios', name: 'Evangelios', count: 2, color: 'Evangelios', desc: 'Palabras de Jesús' },
  { id: 'promesas', name: 'Promesas', count: 4, color: 'Promesas', desc: 'Para días difíciles' },
  { id: 'mañana', name: 'Mañana', count: 2, color: 'Mañana', desc: 'Devocional matutino' },
  { id: 'favoritos', name: 'Favoritos', count: 3, color: 'Favoritos', desc: 'Los que más amo' },
  { id: 'proverbios', name: 'Proverbios', count: 1, color: 'Proverbios', desc: 'Sabiduría diaria' },
];

window.SAMPLE_VERSES = SAMPLE_VERSES;
window.SAMPLE_COLLECTIONS = SAMPLE_COLLECTIONS;

// ───────────────────────────────────────────────────────────
// Shared UI atoms
// ───────────────────────────────────────────────────────────

function Button({ children, variant = 'primary', size = 'md', onClick, icon, full, style }) {
  const sizes = {
    sm: { padding: '8px 14px', fontSize: 13, height: 36, gap: 6 },
    md: { padding: '12px 18px', fontSize: 15, height: 46, gap: 8 },
    lg: { padding: '16px 24px', fontSize: 17, height: 56, gap: 10 },
  };
  const variants = {
    primary: { background: VR.brand.primary, color: '#fff', boxShadow: '0 8px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' },
    soft:    { background: VR.c.indigo50, color: VR.c.indigo700 },
    ghost:   { background: 'transparent', color: VR.c.text },
    outline: { background: '#fff', color: VR.c.text, boxShadow: `inset 0 0 0 1.5px ${VR.c.line}` },
    danger:  { background: VR.c.rose500, color: '#fff' },
    dark:    { background: VR.c.ink, color: '#fff' },
    google:  { background: '#fff', color: '#1F1F1F', boxShadow: `inset 0 0 0 1px ${VR.c.line}, 0 2px 8px rgba(0,0,0,0.04)` },
  };
  return (
    <button onClick={onClick} style={{
      ...sizes[size], ...variants[variant],
      border: 'none', borderRadius: VR.r['full'],
      fontFamily: VR.font.display, fontWeight: 600, letterSpacing: -0.1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', width: full ? '100%' : 'auto',
      transition: 'transform .15s ease', ...style,
    }}>
      {icon && <span style={{ display: 'flex', marginRight: sizes[size].gap }}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

function Tag({ children, color = 'Promesas', size = 'sm' }) {
  const c = VR.collectionColors[color] || VR.collectionColors.Promesas;
  const s = size === 'xs'
    ? { padding: '3px 8px', fontSize: 10, gap: 5, dot: 5 }
    : { padding: '5px 10px', fontSize: 11, gap: 6, dot: 6 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: s.gap,
      background: c.bg, color: c.fg,
      padding: s.padding, borderRadius: VR.r.full,
      fontFamily: VR.font.sans, fontWeight: 600, letterSpacing: 0.1,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: s.dot, height: s.dot, borderRadius: '50%', background: c.dot }} />
      {children}
    </span>
  );
}

// VerseCard — the central object. Modern flat with prominent icon.
function VerseCard({ verse, lang = 'es', size = 'md', onClick, showBack = false, hintRevealed = false, style }) {
  const palette = VR.cardColors.find((c) => c.id === verse.color) || VR.cardColors[0];
  const IconCmp = Ic[verse.icon] || Ic.bible;
  const sizes = {
    sm: { w: 160, h: 200, iconSize: 28, ref: 13, body: 11, p: 14, bigIcon: 56 },
    md: { w: 220, h: 280, iconSize: 36, ref: 16, body: 12, p: 18, bigIcon: 80 },
    lg: { w: 300, h: 380, iconSize: 48, ref: 20, body: 14, p: 24, bigIcon: 110 },
  };
  const s = sizes[size];
  const ref = lang === 'es' ? verse.ref : verse.refEn;

  if (showBack) {
    return (
      <div onClick={onClick} style={{
        width: s.w, height: s.h, borderRadius: VR.r['2xl'],
        background: VR.c.card, color: VR.c.text,
        boxShadow: VR.shadow.lg, padding: s.p,
        display: 'flex', flexDirection: 'column',
        fontFamily: VR.font.sans, position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default', ...style,
      }}>
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: palette.bg, opacity: 0.1,
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: palette.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <IconCmp size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: VR.font.display, fontWeight: 700, fontSize: s.ref - 2 }}>{ref}</div>
            <div style={{ fontSize: 9, color: VR.c.muted, letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 600 }}>{verse.version}</div>
          </div>
        </div>
        <div style={{
          flex: 1,
          fontFamily: VR.font.serif, fontSize: s.body + 1, lineHeight: 1.45,
          color: VR.c.text, textWrap: 'pretty', overflow: 'hidden',
        }}>
          {lang === 'es' ? verse.text : verse.textEn}
        </div>
        {hintRevealed && verse.hint && (
          <div style={{
            marginTop: 8, padding: '6px 10px', borderRadius: 10,
            background: palette.tint, color: palette.solid,
            fontSize: 10, fontWeight: 600, fontStyle: 'italic',
          }}>
            💡 {verse.hint}
          </div>
        )}
      </div>
    );
  }

  // FRONT — color-forward, prominent icon, reference and tags
  return (
    <div onClick={onClick} style={{
      width: s.w, height: s.h, borderRadius: VR.r['2xl'],
      background: palette.bg, color: '#fff',
      padding: s.p, boxShadow: VR.shadow.lg,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      fontFamily: VR.font.display, position: 'relative', overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default', ...style,
    }}>
      {/* decorative glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 140, height: 140, borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)', filter: 'blur(8px)',
      }} />
      <div style={{
        position: 'absolute', bottom: -30, left: -30,
        width: 110, height: 110, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
      }} />

      {/* Tags row */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
        {verse.collections.slice(0, 2).map((col) => (
          <span key={col} style={{
            background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)',
            padding: '3px 8px', borderRadius: VR.r.full, fontSize: 9,
            fontWeight: 600, letterSpacing: 0.3, color: '#fff',
          }}>{col}</span>
        ))}
      </div>

      {/* Icon — central focus */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 0.95,
      }}>
        <IconCmp size={s.bigIcon} color="#fff" strokeWidth={1.7} />
      </div>

      {/* Reference */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: s.ref, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.1 }}>{ref}</div>
        <div style={{
          fontSize: 10, opacity: 0.85, marginTop: 4,
          letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600,
        }}>{verse.version}</div>

        {/* mastery bar */}
        <div style={{
          marginTop: 10, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.25)', overflow: 'hidden',
        }}>
          <div style={{
            width: `${verse.mastery * 100}%`, height: '100%',
            background: '#fff', borderRadius: 2,
          }} />
        </div>
      </div>
    </div>
  );
}

// IconBubble — colored bubble + icon (for collection cards, etc.)
function IconBubble({ icon, color = 'indigo', size = 56 }) {
  const palette = VR.cardColors.find((c) => c.id === color) || VR.cardColors[0];
  const IconCmp = Ic[icon] || Ic.bible;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: palette.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 6px 14px ${palette.solid}40`,
    }}>
      <IconCmp size={size * 0.5} color="#fff" strokeWidth={2} />
    </div>
  );
}

// Stat — number + label
function Stat({ value, label, color = VR.c.indigo600, big }) {
  return (
    <div>
      <div style={{
        fontFamily: VR.font.display, fontWeight: 800,
        fontSize: big ? 36 : 24, color,
        letterSpacing: -0.5, lineHeight: 1,
      }}>{value}</div>
      <div style={{
        fontFamily: VR.font.sans, fontSize: 11, fontWeight: 500,
        color: VR.c.muted, marginTop: 4, letterSpacing: 0.2,
      }}>{label}</div>
    </div>
  );
}

// Pretty progress bar
function ProgressBar({ value, color, height = 6, bg = VR.c.line }) {
  return (
    <div style={{ height, background: bg, borderRadius: height, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value * 100))}%`, height: '100%',
        background: color || VR.brand.primary, borderRadius: height,
        transition: 'width .4s ease',
      }} />
    </div>
  );
}

// Section heading inside a screen
function SectionTitle({ children, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 4px', marginBottom: 10,
    }}>
      <h3 style={{
        fontFamily: VR.font.display, fontSize: 14, fontWeight: 700,
        color: VR.c.text, letterSpacing: -0.1, margin: 0,
      }}>{children}</h3>
      {action}
    </div>
  );
}

// Bottom tab bar (mobile)
function MobileTabBar({ active = 'home', t, dark = false }) {
  const tabs = [
    { id: 'home', icon: 'home', label: t.home },
    { id: 'practice', icon: 'play', label: t.practice },
    { id: 'library', icon: 'library', label: t.library },
    { id: 'profile', icon: 'user', label: t.profile },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 28, paddingTop: 10, paddingLeft: 12, paddingRight: 12,
      background: dark ? 'rgba(15,14,26,0.85)' : 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(24px) saturate(160%)',
      borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : VR.c.line}`,
      display: 'flex', justifyContent: 'space-around', zIndex: 30,
    }}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const IconCmp = Ic[tab.icon];
        return (
          <div key={tab.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, padding: '4px 12px',
            color: isActive ? VR.c.indigo600 : (dark ? '#9D9BB5' : VR.c.muted),
          }}>
            <IconCmp size={24} color={isActive ? VR.c.indigo600 : (dark ? '#9D9BB5' : VR.c.muted)} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{
              fontFamily: VR.font.sans, fontSize: 10,
              fontWeight: isActive ? 700 : 500,
            }}>{tab.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// FAB
function FAB({ icon = 'plus', label, onClick }) {
  const IconCmp = Ic[icon];
  return (
    <button onClick={onClick} style={{
      position: 'absolute', bottom: 100, right: 18,
      height: 56,
      paddingLeft: label ? 18 : 0, paddingRight: label ? 22 : 0,
      width: label ? 'auto' : 56,
      borderRadius: 28, border: 'none',
      background: VR.brand.primary, color: '#fff',
      boxShadow: '0 14px 30px rgba(99,102,241,0.45), 0 4px 10px rgba(99,102,241,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      cursor: 'pointer', zIndex: 25,
    }}>
      <IconCmp size={26} color="#fff" strokeWidth={2.5} />
      {label && <span style={{
        fontFamily: VR.font.display, fontWeight: 700, fontSize: 15,
      }}>{label}</span>}
    </button>
  );
}

Object.assign(window, { Button, Tag, VerseCard, IconBubble, Stat, ProgressBar, SectionTitle, MobileTabBar, FAB });
