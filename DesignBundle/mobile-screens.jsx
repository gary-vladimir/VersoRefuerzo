// VersoRefuerzo — Mobile screens (v2: verses-first, animated, hint hidden)

// ───────────────────────────────────────────────────────────
// 1) LOGIN — cinematic, with floating verse cards in background
// ───────────────────────────────────────────────────────────
function ScreenLogin({ lang = 'es' }) {
  const t = T[lang];
  const floatingVerses = [
    { ref: 'Juan 14:6',     icon: 'cross',     color: 'indigo',   x: '-15%', y: '12%',  rot: -8,  scale: 0.55, delay: 0 },
    { ref: 'Salmos 23:1',   icon: 'sheep',     color: 'emerald',  x: '70%',  y: '8%',   rot: 6,   scale: 0.5,  delay: 0.6 },
    { ref: 'Romanos 8:28',  icon: 'heart',     color: 'rose',     x: '78%',  y: '34%',  rot: -5,  scale: 0.45, delay: 1.2 },
    { ref: 'Filipenses 4:13', icon: 'flameSmall', color: 'amber', x: '-12%', y: '38%',  rot: 10,  scale: 0.45, delay: 1.8 },
  ];
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at 30% 20%, #4C1D95 0%, #1E1B4B 50%, #0F0E1A 100%)',
      color: '#fff', display: 'flex', flexDirection: 'column',
      paddingTop: 70, position: 'relative', overflow: 'hidden',
    }}>
      {/* twinkling stars */}
      {[[40,80,2,0],[80,200,3,.5],[300,120,2,1],[160,280,3,.3],[340,350,2,.8],[60,420,2,1.2],[280,460,3,.4],[200,520,2,1.5],[100,140,2,2],[320,250,2,.2]].map(([x,y,s,d], i) => (
        <div key={i} className="vr-twinkle" style={{
          position: 'absolute', left: x, top: y,
          width: s, height: s, borderRadius: '50%', background: '#fff',
          boxShadow: `0 0 ${s*3}px #fff`, animationDelay: `${d}s`,
        }}/>
      ))}

      {/* floating verse-card silhouettes orbiting */}
      {floatingVerses.map((v, i) => {
        const palette = VR.cardColors.find((c) => c.id === v.color);
        const Cmp = Ic[v.icon];
        return (
          <div key={i} className="vr-float" style={{
            position: 'absolute', left: v.x, top: v.y,
            width: 110, height: 140, borderRadius: 18,
            background: palette.bg,
            transform: `rotate(${v.rot}deg) scale(${v.scale})`,
            boxShadow: `0 20px 40px ${palette.solid}80`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            opacity: 0.55, animationDelay: `${v.delay}s`, animationDuration: '5s',
          }}>
            <Cmp size={36} color="#fff" strokeWidth={1.8} style={{ opacity: 0.9 }}/>
            <div style={{ fontSize: 9, fontFamily: VR.font.display, fontWeight: 700, marginTop: 6, opacity: 0.85 }}>{v.ref}</div>
          </div>
        );
      })}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', position: 'relative', zIndex: 2 }}>
        {/* logo mark with sparkle */}
        <div className="vr-card-rise" style={{
          width: 110, height: 110, borderRadius: 32,
          background: 'linear-gradient(135deg, #FBBF24 0%, #F472B6 50%, #A855F7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 24px 60px rgba(168,85,247,0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
          marginBottom: 28, position: 'relative',
        }}>
          <Ic.bible size={56} color="#fff" strokeWidth={2.2}/>
          <div className="vr-sparkle" style={{ position: 'absolute', top: -10, right: -10, width: 26, height: 26, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 14px rgba(168,85,247,0.4)' }}>
            <Ic.sparkles size={15} color="#A855F7" strokeWidth={2.5}/>
          </div>
          <div className="vr-sparkle" style={{ position: 'absolute', bottom: -8, left: -6, width: 18, height: 18, borderRadius: 6, background: '#FBBF24', animationDelay: '0.8s' }}/>
        </div>

        <h1 className="vr-fade-up" style={{
          fontFamily: VR.font.display, fontWeight: 800, fontSize: 40,
          letterSpacing: -1.2, margin: 0, textAlign: 'center', lineHeight: 1,
          animationDelay: '0.2s',
        }}>
          <span className="vr-shimmer-text">VersoRefuerzo</span>
        </h1>

        <p className="vr-fade-up" style={{
          fontFamily: VR.font.serif, fontSize: 16, marginTop: 18,
          color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 1.45,
          textWrap: 'pretty', maxWidth: 280, fontStyle: 'italic',
          animationDelay: '0.4s',
        }}>
          {lang === 'es'
            ? 'Memoriza la Palabra. Una tarjeta a la vez.'
            : 'Memorize the Word. One card at a time.'}
        </p>

        {/* tiny feature pills */}
        {/* feature pills — animated icon glyphs */}
        <div className="vr-stagger" style={{ display: 'flex', gap: 8, marginTop: 26, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 320 }}>
          {[
            { Icon: Ic.brain,      anim: 'vr-twinkle',     l: lang === 'es' ? 'Repetición espaciada' : 'Spaced repetition', tint: '#A78BFA' },
            { Icon: Ic.gamepad,    anim: 'vr-float',       l: lang === 'es' ? '4 minijuegos' : '4 mini-games',                tint: '#F472B6' },
            { Icon: Ic.shieldLock, anim: 'vr-sparkle',     l: lang === 'es' ? '100% privado' : '100% private',                tint: '#34D399' },
          ].map((p, i) => {
            const Cmp = p.Icon;
            return (
              <div key={i} style={{
                padding: '6px 12px 6px 8px', borderRadius: 999,
                background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.18)',
                fontSize: 11, fontWeight: 600, display: 'inline-flex', gap: 7, alignItems: 'center',
                color: 'rgba(255,255,255,0.92)', letterSpacing: 0.1,
              }}>
                <span className={p.anim} style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: `${p.tint}25`, display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center',
                  animationDelay: `${i * 0.4}s`,
                }}>
                  <Cmp size={13} color={p.tint} strokeWidth={2.4}/>
                </span>
                {p.l}
              </div>
            );
          })}
        </div>
      </div>

      <div className="vr-fade-up" style={{ padding: '0 24px 36px', position: 'relative', zIndex: 2, animationDelay: '0.6s' }}>
        <Button variant="google" size="lg" full
                icon={<Ic.google size={20} />}>
          {t.continueGoogle}
        </Button>
        <div style={{
          marginTop: 16, fontFamily: VR.font.sans, fontSize: 11,
          color: 'rgba(255,255,255,0.55)', textAlign: 'center',
        }}>
          {lang === 'es' ? 'Gratis para siempre · Sin anuncios' : 'Free forever · No ads'}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// 2) HOME — verses-first. Stats are tiny. Big focus on CARDS.
// ───────────────────────────────────────────────────────────
function ScreenHome({ lang = 'es' }) {
  const t = T[lang];
  const dueToday = SAMPLE_VERSES.filter((v) => v.nextReview === 'hoy');
  const recent = SAMPLE_VERSES;

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: VR.c.bg,
      paddingBottom: 100, fontFamily: VR.font.sans, position: 'relative',
    }}>
      {/* compact header — no big hero, just essentials */}
      <div style={{
        paddingTop: 56, paddingBottom: 12, paddingLeft: 20, paddingRight: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#fff',
      }}>
        <div>
          <div style={{ fontSize: 11, color: VR.c.muted, fontWeight: 600 }}>
            {lang === 'es' ? 'Hola, María' : 'Hi, María'}
          </div>
          <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 22, color: VR.c.text, letterSpacing: -0.5, marginTop: 1 }}>
            {lang === 'es' ? 'Tus versos' : 'Your verses'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            padding: '6px 12px', borderRadius: 999,
            background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 2px 8px rgba(251,191,36,0.25)',
          }}>
            <span className="vr-flame" style={{ display: 'inline-flex' }}>
              <Ic.flame size={14} color="#F59E0B" strokeWidth={2.5}/>
            </span>
            <span style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 13, color: '#92400E' }}>14</span>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: VR.brand.rose, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: VR.font.display, fontWeight: 800, fontSize: 13 }}>M</div>
        </div>
      </div>

      {/* "Practice today" hero — single emphatic card */}
      <div style={{ padding: '14px 20px 0' }}>
        <div className="vr-glow-pulse" style={{
          background: VR.brand.primary, color: '#fff',
          borderRadius: VR.r['2xl'], padding: '18px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
          position: 'relative', overflow: 'hidden', cursor: 'pointer',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }}/>
          <div style={{ position: 'absolute', bottom: -40, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>

          {/* mini card stack */}
          <div style={{ position: 'relative', width: 56, height: 64, flexShrink: 0 }}>
            {dueToday.slice(0, 3).map((v, i) => {
              const p = VR.cardColors.find((c) => c.id === v.color);
              const Cmp = Ic[v.icon];
              return (
                <div key={v.id} style={{
                  position: 'absolute', width: 44, height: 56, borderRadius: 10,
                  background: p.bg, border: '2px solid rgba(255,255,255,0.9)',
                  left: i * 6, top: i * 4,
                  transform: `rotate(${(i - 1) * 5}deg)`,
                  boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Cmp size={20} color="#fff" strokeWidth={2.2}/>
                </div>
              );
            })}
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>
              {dueToday.length} {lang === 'es' ? 'versos para hoy' : 'verses today'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              {lang === 'es' ? 'Sigue tu racha · ~5 min' : 'Keep your streak · ~5 min'}
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#fff', color: VR.c.indigo700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 14px rgba(0,0,0,0.15)', flexShrink: 0,
          }}>
            <Ic.play size={18} color={VR.c.indigo700} strokeWidth={2.5} style={{ marginLeft: 2 }}/>
          </div>
        </div>
      </div>

      {/* Collection chips — quick filters */}
      <div style={{ padding: '18px 0 6px' }}>
        <div style={{ display: 'flex', gap: 6, padding: '0 20px', overflowX: 'auto' }}>
          {[
            { l: lang === 'es' ? 'Todos' : 'All', count: 8, sel: true },
            ...SAMPLE_COLLECTIONS.slice(0, 5).map((c) => ({ l: c.name, count: c.count, color: c.color })),
          ].map((f, i) => {
            const cc = f.color ? VR.collectionColors[f.color] : null;
            return (
              <div key={i} style={{
                padding: '7px 13px', borderRadius: 999,
                background: f.sel ? VR.c.text : (cc ? cc.bg : '#fff'),
                color: f.sel ? '#fff' : (cc ? cc.fg : VR.c.text),
                fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                boxShadow: f.sel ? VR.shadow.md : VR.shadow.xs,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {cc && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cc.dot }}/>}
                {f.l}
                <span style={{
                  fontSize: 10, opacity: f.sel ? 0.7 : 0.6, fontWeight: 600,
                  padding: '1px 5px', borderRadius: 999,
                  background: f.sel ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
                }}>{f.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* THE VERSES — slim list rows. Scales to hundreds. */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: VR.c.muted, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            {lang === 'es' ? `${recent.length} versos` : `${recent.length} verses`}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <div style={{ fontSize: 11, color: VR.c.muted, fontWeight: 600, marginRight: 4 }}>
              {lang === 'es' ? 'Recientes' : 'Recent'}
            </div>
            <Ic.forward size={11} color={VR.c.muted} strokeWidth={2.5}/>
          </div>
        </div>
        <div className="vr-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recent.map((v) => (
            <VerseRow key={v.id} verse={v} lang={lang}/>
          ))}
        </div>
      </div>

      <FAB label={t.addVerse}/>
      <MobileTabBar t={t}/>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// 3) NEW VERSE — animated preview, prominent visuals
// ───────────────────────────────────────────────────────────
function ScreenNewVerse({ lang = 'es' }) {
  const t = T[lang];
  const [color, setColor] = React.useState('emerald');
  const [icon, setIcon] = React.useState('sheep');
  const [ref, setRefV] = React.useState('Salmos 23:1');
  const [version, setVersion] = React.useState('NBLA');
  const [hint, setHint] = React.useState('pastor, nada faltará');
  const [collections, setCollections] = React.useState(['Salmos', 'Favoritos']);

  const palette = VR.cardColors.find((c) => c.id === color);
  const iconChoices = ['bible', 'cross', 'dove', 'sheep', 'lion', 'fishLoaves', 'crown', 'flameSmall', 'heart', 'mountain', 'water', 'sun', 'door', 'shield', 'handPray', 'anchor'];

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: VR.c.bg,
      paddingBottom: 110, fontFamily: VR.font.sans,
    }}>
      {/* Header */}
      <div style={{
        paddingTop: 56, paddingBottom: 12, paddingLeft: 16, paddingRight: 16,
        background: '#fff', borderBottom: `1px solid ${VR.c.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: VR.c.cardSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic.close size={18} color={VR.c.text} strokeWidth={2.5}/>
        </div>
        <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 16, color: VR.c.text, letterSpacing: -0.2 }}>{t.newVerse}</div>
        <div style={{ width: 36 }}/>
      </div>

      {/* Live preview — gradient backdrop */}
      <div style={{
        padding: '24px 20px 28px', display: 'flex', justifyContent: 'center',
        background: `linear-gradient(180deg, ${palette.tint} 0%, ${VR.c.bg} 100%)`,
        transition: 'background .4s ease', position: 'relative',
      }}>
        <div key={`${color}-${icon}`} className="vr-card-rise">
          <VerseCard
            verse={{
              ref, refEn: ref,
              text: 'El Señor es mi pastor, nada me faltará.',
              textEn: 'The Lord is my shepherd, I shall not want.',
              version, icon, color, hint,
              collections, mastery: 0,
            }}
            size="md" lang={lang}
          />
        </div>
        <div style={{ position: 'absolute', bottom: 6, fontSize: 10, color: VR.c.muted, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Ic.sparkles size={11} color={VR.c.indigo500} strokeWidth={2.5}/>
          {lang === 'es' ? 'El texto se carga automáticamente al guardar' : 'Text auto-loads on save'}
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Reference + version inline */}
        <div>
          <FormLabel>{t.reference}</FormLabel>
          <div style={{
            background: '#fff', borderRadius: VR.r.lg,
            padding: '12px 14px', boxShadow: `inset 0 0 0 2px ${palette.solid}`,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'box-shadow .25s',
          }}>
            <Ic.book size={18} color={palette.solid} strokeWidth={2.2}/>
            <input value={ref} onChange={(e) => setRefV(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, fontFamily: VR.font.display, fontWeight: 700, color: VR.c.text, background: 'transparent' }}
            />
            <div className="vr-pop" key={ref} style={{
              width: 22, height: 22, borderRadius: '50%', background: VR.c.emerald500,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Ic.check size={13} color="#fff" strokeWidth={3.5}/>
            </div>
          </div>
        </div>

        {/* Version */}
        <div>
          <FormLabel>{t.version}</FormLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {['NBLA', 'NVI', 'RVR1960'].map((v) => (
              <button key={v} onClick={() => setVersion(v)} style={{
                flex: 1, padding: '11px 0', border: 'none',
                borderRadius: VR.r.md,
                background: v === version ? palette.solid : '#fff',
                color: v === version ? '#fff' : VR.c.text,
                fontFamily: VR.font.display, fontWeight: 700, fontSize: 12,
                boxShadow: v === version ? `0 4px 10px ${palette.solid}40` : `inset 0 0 0 1.5px ${VR.c.line}`,
                transition: 'all .25s', cursor: 'pointer',
              }}>{v}</button>
            ))}
          </div>
        </div>

        {/* Color picker — bigger, hero */}
        <div>
          <FormLabel hint={lang === 'es' ? 'Cue visual para recordar' : 'Visual recall cue'}>{t.color}</FormLabel>
          <div style={{ display: 'flex', gap: 8 }}>
            {VR.cardColors.map((c) => (
              <div key={c.id} onClick={() => setColor(c.id)} style={{
                flex: 1, aspectRatio: 1, borderRadius: 12,
                background: c.bg, cursor: 'pointer',
                boxShadow: c.id === color ? `0 0 0 3px #fff, 0 0 0 5px ${c.solid}, 0 8px 18px ${c.solid}50` : VR.shadow.xs,
                transform: c.id === color ? 'scale(1.06)' : 'scale(1)',
                transition: 'all .25s cubic-bezier(.2,.8,.2,1)',
              }}/>
            ))}
          </div>
        </div>

        {/* Icon picker */}
        <div>
          <FormLabel hint={lang === 'es' ? 'Asocia un símbolo al verso' : 'Associate a symbol'}>{t.icon}</FormLabel>
          <div style={{
            background: '#fff', borderRadius: VR.r.lg,
            padding: 10, boxShadow: VR.shadow.xs,
            display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6,
          }}>
            {iconChoices.map((ic) => {
              const Comp = Ic[ic];
              const isSel = ic === icon;
              return (
                <div key={ic} onClick={() => setIcon(ic)} style={{
                  aspectRatio: 1, borderRadius: 10,
                  background: isSel ? palette.bg : VR.c.cardSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isSel ? `0 4px 10px ${palette.solid}50` : 'none',
                  transform: isSel ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all .2s cubic-bezier(.2,.8,.2,1)',
                  cursor: 'pointer',
                }}>
                  <Comp size={18} color={isSel ? '#fff' : VR.c.muted} strokeWidth={2.3}/>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hint — emphasized and explained */}
        <div>
          <FormLabel hint={lang === 'es' ? 'Solo aparece si te rindes' : 'Only shows if you give up'}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              💡 {t.hint}
            </span>
          </FormLabel>
          <div style={{
            background: '#fff', borderRadius: VR.r.lg,
            padding: '12px 14px', boxShadow: `inset 0 0 0 1.5px ${VR.c.line}`,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <input value={hint} onChange={(e) => setHint(e.target.value)} placeholder={t.hintPlaceholder}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: VR.font.sans, fontStyle: 'italic', color: VR.c.text, background: 'transparent' }}
            />
          </div>
          <div style={{ fontSize: 11, color: VR.c.muted, marginTop: 6, lineHeight: 1.4, padding: '0 4px' }}>
            {lang === 'es'
              ? 'La pista permanece oculta. Si no recuerdas el verso, podrás revelarla con un toque.'
              : 'The hint stays hidden. If you can\'t recall the verse, you can reveal it with one tap.'}
          </div>
        </div>

        {/* Collections multi-select */}
        <div>
          <FormLabel hint={lang === 'es' ? 'Un verso puede estar en varias' : 'A verse can be in multiple'}>{t.collections}</FormLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.keys(VR.collectionColors).slice(0, 7).map((col) => {
              const sel = collections.includes(col);
              const c = VR.collectionColors[col];
              return (
                <div key={col} onClick={() => setCollections(sel ? collections.filter(x => x !== col) : [...collections, col])} style={{
                  padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                  background: sel ? c.bg : '#fff',
                  color: sel ? c.fg : VR.c.muted,
                  fontSize: 11, fontWeight: 700,
                  boxShadow: sel ? 'none' : `inset 0 0 0 1.5px ${VR.c.line}`,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  transition: 'all .2s',
                }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: sel ? c.dot : 'transparent',
                    boxShadow: sel ? 'none' : `inset 0 0 0 1.5px ${VR.c.soft}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {sel && <Ic.check size={9} color="#fff" strokeWidth={4}/>}
                  </span>
                  {col}
                </div>
              );
            })}
            <div style={{
              padding: '6px 12px', borderRadius: 999,
              background: VR.c.indigo50, color: VR.c.indigo700,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <Ic.plus size={11} strokeWidth={3}/> {lang === 'es' ? 'Nueva' : 'New'}
            </div>
          </div>
        </div>
      </div>

      {/* Save sticky */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px 30px',
        background: 'linear-gradient(180deg, transparent, #fff 35%)',
      }}>
        <Button variant="primary" size="lg" full icon={<Ic.sparkles size={18} strokeWidth={2.5}/>}>
          {t.save}
        </Button>
      </div>
    </div>
  );
}

function FormLabel({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: VR.c.text, letterSpacing: 0.6, textTransform: 'uppercase' }}>{children}</label>
      {hint && <span style={{ fontSize: 10, color: VR.c.muted, fontStyle: 'italic' }}>{hint}</span>}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// 4) CARD VIEW — flip with hint hidden behind "I give up"
// ───────────────────────────────────────────────────────────
function ScreenCardView({ lang = 'es', state = 'front' }) {
  // states: 'front' | 'flipped' | 'flipped-hint'
  const t = T[lang];
  const v = SAMPLE_VERSES[1]; // Romans 8:28
  const palette = VR.cardColors.find((c) => c.id === v.color);
  const IconCmp = Ic[v.icon];
  const ref = lang === 'es' ? v.ref : v.refEn;
  const text = lang === 'es' ? v.text : v.textEn;

  const showBack = state !== 'front';
  const showHint = state === 'flipped-hint';

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: `linear-gradient(180deg, ${palette.tint} 0%, ${VR.c.bg} 60%)`,
      paddingBottom: 32, fontFamily: VR.font.sans, position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        paddingTop: 56, paddingBottom: 12, paddingLeft: 16, paddingRight: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: VR.shadow.xs }}>
          <Ic.back size={18} color={VR.c.text} strokeWidth={2.5}/>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: VR.shadow.xs }}>
            <Ic.starFill size={18}/>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: VR.shadow.xs }}>
            <Ic.edit size={18} color={VR.c.text} strokeWidth={2.2}/>
          </div>
        </div>
      </div>

      {/* Hero card with flip */}
      <div style={{ padding: '12px 20px 0', display: 'flex', justifyContent: 'center' }}>
        <div className="vr-flip-host" style={{ width: 320, height: 380 }}>
          <div className={`vr-flip-card ${showBack ? 'flipped' : ''}`}>
            {/* FRONT */}
            <div className="vr-flip-face" style={{
              borderRadius: VR.r['3xl'], background: palette.bg,
              boxShadow: VR.shadow.xl, padding: 28, color: '#fff',
              position: 'absolute', inset: 0, overflow: 'hidden',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }}/>
              <div style={{ position: 'absolute', bottom: -60, left: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }}/>

              <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
                {v.collections.slice(0, 2).map((col) => (
                  <span key={col} style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: 0.4 }}>{col}</span>
                ))}
              </div>

              <div className="vr-float" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <IconCmp size={130} color="#fff" strokeWidth={1.6} style={{ opacity: 0.95 }}/>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 28, letterSpacing: -0.7 }}>{ref}</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>{v.version}</div>
              </div>
            </div>

            {/* BACK */}
            <div className="vr-flip-face vr-flip-back" style={{
              borderRadius: VR.r['3xl'], background: '#fff',
              boxShadow: VR.shadow.xl, padding: 24,
              position: 'absolute', inset: 0, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: palette.bg, opacity: 0.08 }}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconCmp size={20} color="#fff" strokeWidth={2.3}/>
                </div>
                <div>
                  <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 16, color: VR.c.text }}>{ref}</div>
                  <div style={{ fontSize: 9, color: VR.c.muted, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>{v.version}</div>
                </div>
              </div>
              <div style={{ flex: 1, fontFamily: VR.font.serif, fontSize: 17, lineHeight: 1.5, color: VR.c.text, textWrap: 'pretty' }}>
                {text}
              </div>

              {/* hint — only when showHint */}
              {showHint && (
                <div className="vr-hint-appear" style={{
                  marginTop: 12, padding: '10px 12px', borderRadius: VR.r.md,
                  background: palette.tint, display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 16 }}>💡</span>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: palette.solid, letterSpacing: 0.6, textTransform: 'uppercase' }}>{lang === 'es' ? 'Pista' : 'Hint'}</div>
                    <div style={{ fontSize: 12, color: VR.c.text, fontStyle: 'italic', marginTop: 1 }}>{v.hint}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action area below the card — different per state */}
      <div style={{ padding: '24px 20px 0' }}>
        {state === 'front' && (
          <>
            <div style={{ textAlign: 'center', fontSize: 13, color: VR.c.muted, marginBottom: 10, fontWeight: 500 }}>
              {lang === 'es' ? 'Recita el verso en voz alta. Cuando estés listo…' : 'Recite it aloud. When you\'re ready…'}
            </div>
            <Button variant="primary" size="lg" full icon={<Ic.eye size={18} strokeWidth={2.5}/>}>
              {t.revealVerse}
            </Button>
          </>
        )}
        {state === 'flipped' && (
          <>
            <div style={{ textAlign: 'center', fontSize: 12, color: VR.c.muted, marginBottom: 10, fontWeight: 500 }}>
              {lang === 'es' ? '¿Cómo te fue?' : 'How did it go?'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <Button variant="outline" size="md" icon={<span>🤔</span>}>{lang === 'es' ? 'Me rindo' : 'I give up'}</Button>
              <Button variant="primary" size="md" icon={<Ic.check size={16} strokeWidth={3}/>}>{t.iKnewIt}</Button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 11, color: VR.c.muted, fontWeight: 500 }}>
                💡 {lang === 'es' ? 'Toca "me rindo" para revelar la pista' : 'Tap "I give up" to reveal hint'}
              </span>
            </div>
          </>
        )}
        {state === 'flipped-hint' && (
          <>
            <div style={{ textAlign: 'center', fontSize: 12, color: VR.c.muted, marginBottom: 10, fontWeight: 500 }}>
              {lang === 'es' ? 'Con la pista, ¿qué tan bien lo recuerdas?' : 'With the hint, how well do you recall?'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { l: t.again, c: VR.c.rose500 },
                { l: t.hard, c: VR.c.orange500 },
                { l: t.good, c: VR.c.emerald500 },
              ].map((b, i) => (
                <button key={i} style={{
                  background: '#fff', border: 'none', padding: '14px 0',
                  borderRadius: VR.r.lg, fontFamily: VR.font.display, fontWeight: 700,
                  fontSize: 13, color: VR.c.text, boxShadow: VR.shadow.sm,
                  borderTop: `3px solid ${b.c}`, cursor: 'pointer',
                }}>{b.l}</button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Tags + small mastery hint */}
      <div style={{ padding: '20px 20px 0', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {v.collections.map((col) => <Tag key={col} color={col}>{col}</Tag>)}
        <span style={{ background: '#fff', padding: '5px 10px', borderRadius: 999, fontSize: 11, color: VR.c.muted, fontWeight: 600, boxShadow: VR.shadow.xs, display: 'inline-flex', gap: 5, alignItems: 'center' }}>
          <Ic.flame size={11} color={VR.c.amber500} strokeWidth={2.5}/> {v.streak}
        </span>
        <span style={{ background: '#fff', padding: '5px 10px', borderRadius: 999, fontSize: 11, color: VR.c.indigo700, fontWeight: 700, boxShadow: VR.shadow.xs }}>
          {Math.round(v.mastery * 100)}%
        </span>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// 5) LIBRARY — collections with verse stack visuals
// ───────────────────────────────────────────────────────────
function ScreenLibrary({ lang = 'es' }) {
  const t = T[lang];
  return (
    <div style={{
      width: '100%', minHeight: '100%', background: VR.c.bg,
      paddingBottom: 100, fontFamily: VR.font.sans,
    }}>
      <div style={{
        paddingTop: 56, paddingBottom: 14, paddingLeft: 20, paddingRight: 20,
        background: '#fff', borderBottom: `1px solid ${VR.c.line}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ fontFamily: VR.font.display, fontSize: 26, fontWeight: 800, color: VR.c.text, letterSpacing: -0.6, margin: 0 }}>
            {t.library}
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: VR.c.indigo50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic.search size={18} color={VR.c.indigo700} strokeWidth={2.3}/>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[lang === 'es' ? 'Colecciones' : 'Collections', lang === 'es' ? 'Todos los versos' : 'All verses'].map((tab, i) => (
            <div key={tab} style={{
              padding: '8px 14px', borderRadius: 999,
              background: i === 0 ? VR.c.text : 'transparent',
              color: i === 0 ? '#fff' : VR.c.muted,
              fontSize: 12, fontWeight: 700,
            }}>{tab}</div>
          ))}
          <div style={{ flex: 1 }}/>
          <div style={{
            padding: '8px 12px', borderRadius: 999,
            background: VR.c.indigo50, color: VR.c.indigo700,
            fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Ic.plus size={12} strokeWidth={3}/> {lang === 'es' ? 'Nueva' : 'New'}
          </div>
        </div>
      </div>

      <div className="vr-stagger" style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {SAMPLE_COLLECTIONS.map((col) => {
          const c = VR.collectionColors[col.color];
          const stackVerses = SAMPLE_VERSES.filter((v) => v.collections.includes(col.color)).slice(0, 3);
          return (
            <div key={col.id} style={{
              background: '#fff', borderRadius: VR.r['2xl'], padding: 14,
              boxShadow: VR.shadow.sm, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: c.bg, opacity: 0.5 }}/>

              <div style={{ display: 'flex', height: 64, position: 'relative', marginBottom: 12 }}>
                {stackVerses.map((v, i) => {
                  const p = VR.cardColors.find((c) => c.id === v.color);
                  const Cmp = Ic[v.icon];
                  return (
                    <div key={v.id} style={{
                      width: 46, height: 60, borderRadius: 10,
                      background: p.bg, position: 'absolute',
                      left: i * 20, top: i * 2,
                      transform: `rotate(${(i - 1) * 4}deg)`,
                      boxShadow: '0 6px 12px rgba(0,0,0,0.14)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #fff',
                    }}>
                      <Cmp size={20} color="#fff" strokeWidth={2.2}/>
                    </div>
                  );
                })}
              </div>

              <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 16, color: VR.c.text, position: 'relative', letterSpacing: -0.2 }}>
                {col.name}
              </div>
              <div style={{ fontSize: 11, color: VR.c.muted, marginTop: 2, position: 'relative' }}>{col.desc}</div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, position: 'relative' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: c.bg, color: c.fg,
                  padding: '3px 8px', borderRadius: 999,
                  fontSize: 10, fontWeight: 700,
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: c.dot }}/>
                  {col.count} {lang === 'es' ? 'versos' : 'verses'}
                </div>
                <Ic.forward size={14} color={VR.c.muted}/>
              </div>
            </div>
          );
        })}
      </div>

      <MobileTabBar t={t} active="library"/>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// VerseRow — slim horizontal list card. Scales to hundreds.
// ───────────────────────────────────────────────────────────
function VerseRow({ verse, lang = 'es' }) {
  const palette = VR.cardColors.find((c) => c.id === verse.color) || VR.cardColors[0];
  const IconCmp = Ic[verse.icon] || Ic.bible;
  const ref = lang === 'es' ? verse.ref : verse.refEn;
  const text = lang === 'es' ? verse.text : verse.textEn;
  const isDue = verse.nextReview === 'hoy';
  const dueLabel = lang === 'es'
    ? (isDue ? 'Hoy' : verse.nextReview)
    : (isDue ? 'Today' : verse.nextReview === 'mañana' ? 'Tomorrow'
        : verse.nextReview.replace('en ', 'in ').replace('días', 'days').replace('día', 'day'));

  return (
    <div style={{
      background: '#fff', borderRadius: VR.r.xl,
      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: VR.shadow.xs, position: 'relative', overflow: 'hidden',
      cursor: 'pointer',
    }}>
      {/* color stripe (left edge) */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 4, background: palette.bg,
      }}/>

      {/* Icon tile */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: palette.bg, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 10px ${palette.solid}30`,
      }}>
        <IconCmp size={22} color="#fff" strokeWidth={2.3}/>
      </div>

      {/* Middle — ref + text preview */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div style={{
            fontFamily: VR.font.display, fontWeight: 800, fontSize: 14,
            color: VR.c.text, letterSpacing: -0.2,
          }}>{ref}</div>
          <div style={{
            fontSize: 9, color: VR.c.muted, fontWeight: 700,
            letterSpacing: 0.6, textTransform: 'uppercase',
          }}>{verse.version}</div>
        </div>
        <div style={{
          fontFamily: VR.font.serif, fontSize: 12, color: VR.c.muted,
          marginTop: 1, lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{text}</div>
      </div>

      {/* Right — status pill (due / mastery) */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        {isDue ? (
          <div className="vr-glow-pulse" style={{
            background: VR.brand.primary, color: '#fff',
            padding: '3px 8px', borderRadius: 999,
            fontSize: 9, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase',
            animationDuration: '3s',
          }}>{dueLabel}</div>
        ) : (
          <div style={{
            fontSize: 10, color: VR.c.muted, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}>
            <Ic.clock size={10} color={VR.c.muted} strokeWidth={2.5}/>
            {dueLabel}
          </div>
        )}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize: 10, color: palette.solid, fontWeight: 700,
        }}>
          <span style={{
            display: 'inline-block', width: 22, height: 3, borderRadius: 2,
            background: VR.c.cardSoft, position: 'relative', overflow: 'hidden',
          }}>
            <span style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${verse.mastery * 100}%`, background: palette.solid, borderRadius: 2,
            }}/>
          </span>
          {Math.round(verse.mastery * 100)}%
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenLogin, ScreenHome, ScreenNewVerse, ScreenCardView, ScreenLibrary, VerseRow });
