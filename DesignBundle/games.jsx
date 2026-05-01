// VersoRefuerzo — Game mode screens

// ───────────────────────────────────────────────────────────
// Practice hub — pick a mode
// ───────────────────────────────────────────────────────────
function ScreenPracticeHub({ lang = 'es' }) {
  const t = T[lang];
  const modes = [
    { id: 'classic',  title: t.classicMode,    desc: t.classicDesc,    icon: 'cards',     bg: VR.brand.primary,    badge: lang === 'es' ? 'Recomendado' : 'Recommended' },
    { id: 'streak',   title: t.streakChallenge, desc: t.streakDesc,    icon: 'flame',     bg: VR.brand.sunrise,    badge: lang === 'es' ? 'Diario' : 'Daily', live: true },
    { id: 'scramble', title: t.wordScramble,   desc: t.scrambleDesc,   icon: 'shuffle',   bg: VR.brand.forest },
    { id: 'match',    title: t.verseMatch,     desc: t.matchDesc,      icon: 'grid',      bg: VR.brand.rose },
    { id: 'gap',      title: t.fillTheGap,     desc: t.gapDesc,        icon: 'edit',      bg: VR.brand.sky },
  ];

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: VR.c.bg,
      paddingBottom: 100, fontFamily: VR.font.sans,
    }}>
      <div style={{ paddingTop: 56, paddingBottom: 12, paddingLeft: 20, paddingRight: 20 }}>
        <h1 style={{ fontFamily: VR.font.display, fontSize: 26, fontWeight: 800, color: VR.c.text, letterSpacing: -0.6, margin: 0 }}>
          {t.practice}
        </h1>
        <p style={{ fontSize: 13, color: VR.c.muted, margin: '4px 0 0', fontWeight: 500 }}>
          {lang === 'es' ? 'Elige cómo quieres practicar hoy' : 'Choose how you want to practice today'}
        </p>
      </div>

      {/* Source filter */}
      <div style={{ padding: '12px 20px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {[
          { l: lang === 'es' ? 'Todos (12 hoy)' : 'All (12 today)', sel: true },
          { l: 'Romanos · 2', sel: false },
          { l: lang === 'es' ? 'Promesas · 4' : 'Promises · 4', sel: false },
          { l: lang === 'es' ? 'Personalizar' : 'Custom', sel: false, ic: 'plus' },
        ].map((f, i) => (
          <div key={i} style={{
            padding: '8px 14px', borderRadius: VR.r.full,
            background: f.sel ? VR.c.text : '#fff',
            color: f.sel ? '#fff' : VR.c.text,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            boxShadow: f.sel ? VR.shadow.md : VR.shadow.xs,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            {f.ic && <Ic.plus size={11} strokeWidth={3}/>}
            {f.l}
          </div>
        ))}
      </div>

      {/* Mode cards */}
      <div style={{ padding: '8px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {modes.map((m, i) => {
          const IconCmp = Ic[m.icon];
          return (
            <div key={m.id} style={{
              borderRadius: VR.r['2xl'], padding: 18, position: 'relative', overflow: 'hidden',
              background: m.bg, color: '#fff',
              boxShadow: VR.shadow.lg, display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }}/>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0,
              }}>
                <IconCmp size={28} color="#fff" strokeWidth={2.2}/>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>{m.title}</div>
                  {m.badge && (
                    <span style={{
                      background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)',
                      padding: '2px 8px', borderRadius: VR.r.full, fontSize: 9,
                      fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      {m.live && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px #fff' }}/>}
                      {m.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.3 }}>{m.desc}</div>
              </div>
              <Ic.forward size={20} color="#fff" strokeWidth={2.5}/>
            </div>
          );
        })}
      </div>

      <MobileTabBar t={t} active="practice"/>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Classic flashcard practice (during a session)
// ───────────────────────────────────────────────────────────
function ScreenClassicSession({ lang = 'es' }) {
  const t = T[lang];
  const v = SAMPLE_VERSES[1];
  const palette = VR.cardColors.find((c) => c.id === v.color);
  const ref = lang === 'es' ? v.ref : v.refEn;
  const text = lang === 'es' ? v.text : v.textEn;

  return (
    <div style={{
      width: '100%', minHeight: '100%', background: VR.c.bg,
      fontFamily: VR.font.sans, position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar with progress */}
      <div style={{ paddingTop: 56, paddingBottom: 16, paddingLeft: 16, paddingRight: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: VR.shadow.xs }}>
            <Ic.close size={18} color={VR.c.text} strokeWidth={2.5}/>
          </div>
          <div style={{ flex: 1 }}>
            <ProgressBar value={5/12} color={VR.brand.primary} height={6}/>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: VR.c.text }}>5/12</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: VR.c.muted, fontWeight: 600 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Ic.flame size={12} color={VR.c.amber500} strokeWidth={2.5}/>
            {lang === 'es' ? 'Sesión: 4:23' : 'Session: 4:23'}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Ic.target size={12} strokeWidth={2.5}/>
            {lang === 'es' ? 'Repetición espaciada (SM-2)' : 'Spaced repetition (SM-2)'}
          </span>
        </div>
      </div>

      {/* Card stack — front showing reference, asks user to recall */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px', position: 'relative' }}>
        {/* peeking next card */}
        <div style={{
          position: 'absolute', width: 280, height: 360, borderRadius: VR.r['3xl'],
          background: VR.c.indigo100, opacity: 0.5,
          transform: 'translateY(-12px) scale(0.95)',
        }}/>

        <div style={{
          width: '100%', maxWidth: 320, minHeight: 360, borderRadius: VR.r['3xl'],
          background: palette.bg, boxShadow: VR.shadow.xl, padding: 28,
          color: '#fff', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}/>
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div style={{
              padding: '4px 10px', borderRadius: VR.r.full,
              background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)',
              fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
            }}>{lang === 'es' ? 'Recuerda este verso' : 'Recall this verse'}</div>
            <div style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>{v.version}</div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, position: 'relative' }}>
            <Ic.heart size={70} color="#fff" strokeWidth={1.6} style={{ opacity: 0.95 }}/>
            <div style={{
              fontFamily: VR.font.display, fontWeight: 800, fontSize: 36,
              letterSpacing: -1, textAlign: 'center', lineHeight: 1.1,
            }}>{ref}</div>
            <div style={{
              fontSize: 13, opacity: 0.85, textAlign: 'center',
              fontStyle: 'italic', maxWidth: 220, lineHeight: 1.4,
            }}>
              {lang === 'es' ? 'Cierra los ojos y recítalo en voz alta.' : 'Close your eyes and recite it aloud.'}
            </div>
          </div>

          {/* hint button */}
          <button style={{
            background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', padding: '10px 14px', borderRadius: VR.r.full,
            fontFamily: VR.font.display, fontWeight: 600, fontSize: 12,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            backdropFilter: 'blur(8px)', position: 'relative',
          }}>
            <span>💡</span> {t.showHint}
          </button>
        </div>
      </div>

      {/* Action row — SM-2 quality buttons */}
      <div style={{ padding: '20px 16px 32px' }}>
        <div style={{ fontSize: 11, color: VR.c.muted, textAlign: 'center', marginBottom: 10, fontWeight: 600 }}>
          {lang === 'es' ? '¿Qué tan bien lo recordaste?' : 'How well did you remember?'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
          {[
            { l: t.again, sub: '<1m', c: VR.c.rose500, ic: '✗' },
            { l: t.hard, sub: '6m',  c: VR.c.orange500, ic: '🤔' },
            { l: t.good, sub: '1d',  c: VR.c.indigo600, ic: '👍' },
            { l: t.easy, sub: '4d',  c: VR.c.emerald500, ic: '✨' },
          ].map((b, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: VR.r.lg, padding: '12px 4px',
              boxShadow: VR.shadow.sm, textAlign: 'center',
              borderTop: `3px solid ${b.c}`,
            }}>
              <div style={{ fontSize: 18 }}>{b.ic}</div>
              <div style={{ fontFamily: VR.font.display, fontWeight: 700, fontSize: 12, color: VR.c.text, marginTop: 4 }}>{b.l}</div>
              <div style={{ fontSize: 9, color: VR.c.muted, marginTop: 1, fontWeight: 600 }}>{b.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Word Scramble — drag to reorder
// ───────────────────────────────────────────────────────────
function ScreenWordScramble({ lang = 'es' }) {
  const t = T[lang];
  const v = SAMPLE_VERSES[3]; // Phil 4:13
  const ref = lang === 'es' ? v.ref : v.refEn;
  // shuffled word slots — show the first 3 placed correctly, rest pending
  const placed = lang === 'es'
    ? ['Todo', 'lo', 'puedo']
    : ['I', 'can', 'do'];
  const pool = lang === 'es'
    ? ['fortalece', 'me', 'que', 'Cristo', 'en']
    : ['strengthens', 'me', 'who', 'Christ', 'through', 'all', 'things'];

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: 'linear-gradient(180deg, #ECFDF5 0%, #FAF9FE 50%)',
      fontFamily: VR.font.sans, paddingBottom: 32,
    }}>
      {/* Header with score & timer */}
      <div style={{ paddingTop: 56, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: VR.shadow.xs }}>
            <Ic.close size={18} color={VR.c.text} strokeWidth={2.5}/>
          </div>
          <div style={{
            background: '#fff', padding: '8px 14px', borderRadius: VR.r.full,
            display: 'flex', alignItems: 'center', gap: 8, boxShadow: VR.shadow.xs,
          }}>
            <Ic.clock size={14} color={VR.c.amber500} strokeWidth={2.5}/>
            <span style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 14, color: VR.c.text }}>0:42</span>
          </div>
          <div style={{
            background: '#fff', padding: '8px 14px', borderRadius: VR.r.full,
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: VR.shadow.xs,
          }}>
            <Ic.starFill size={14}/>
            <span style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 14, color: VR.c.text }}>240</span>
          </div>
        </div>

        {/* Reference card */}
        <div style={{
          background: VR.brand.forest, borderRadius: VR.r.xl, padding: 14,
          color: '#fff', display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 10px 24px rgba(20,184,166,0.3)',
        }}>
          <Ic.flameSmall size={28} color="#fff" strokeWidth={2.2}/>
          <div>
            <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {lang === 'es' ? 'Ordena las palabras' : 'Arrange the words'}
            </div>
            <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>{ref}</div>
          </div>
        </div>
      </div>

      {/* Drop zone — verse being constructed */}
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{
          background: '#fff', borderRadius: VR.r.xl, padding: 14,
          boxShadow: VR.shadow.sm, minHeight: 120,
          border: `2px dashed ${VR.c.line}`,
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {placed.map((w, i) => (
              <div key={i} style={{
                padding: '8px 14px', borderRadius: VR.r.full,
                background: VR.c.emerald400, color: '#fff',
                fontFamily: VR.font.display, fontWeight: 700, fontSize: 14,
                boxShadow: '0 4px 8px rgba(16,185,129,0.3)',
                animation: i === placed.length - 1 ? 'pop .3s' : 'none',
              }}>{w}</div>
            ))}
            {/* placeholder slots */}
            {Array(pool.length).fill(0).map((_, i) => (
              <div key={`s${i}`} style={{
                padding: '8px 14px', borderRadius: VR.r.full,
                background: VR.c.cardSoft, minWidth: 50, height: 36,
                display: 'inline-block',
              }}/>
            ))}
          </div>
        </div>
      </div>

      {/* Word pool */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: 11, color: VR.c.muted, marginBottom: 10, fontWeight: 600, textAlign: 'center' }}>
          {lang === 'es' ? 'Toca o arrastra las palabras' : 'Tap or drag the words'}
        </div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
        }}>
          {pool.sort(() => 0.5 - Math.random()).map((w, i) => (
            <div key={i} style={{
              padding: '12px 18px', borderRadius: VR.r.full,
              background: '#fff', color: VR.c.text,
              fontFamily: VR.font.display, fontWeight: 700, fontSize: 15,
              boxShadow: VR.shadow.md,
              transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (Math.random() * 3)}deg)`,
            }}>{w}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 16px 0' }}>
        <Button variant="soft" size="md" full icon={<Ic.refresh size={16} strokeWidth={2.5}/>}>
          {lang === 'es' ? 'Reiniciar' : 'Reset'}
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Verse Match — pair references with text snippets
// ───────────────────────────────────────────────────────────
function ScreenVerseMatch({ lang = 'es' }) {
  const t = T[lang];
  const pairs = [
    { ref: 'Juan 14:6',     hint: 'camino, verdad, vida',  color: 'indigo',   matched: true },
    { ref: 'Salmos 23:1',   hint: 'pastor',                color: 'emerald',  matched: true },
    { ref: 'Filipenses 4:13', hint: 'fortalece',           color: 'amber',    matched: false },
    { ref: 'Romanos 8:28',  hint: 'cooperan para bien',    color: 'rose',     matched: false },
  ];

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: 'linear-gradient(180deg, #FDF2F8 0%, #FAF9FE 50%)',
      fontFamily: VR.font.sans, paddingBottom: 32,
    }}>
      <div style={{ paddingTop: 56, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: VR.shadow.xs }}>
            <Ic.close size={18} color={VR.c.text} strokeWidth={2.5}/>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3].map((i) => (
              <Ic.heart key={i} size={20} color={i <= 3 ? '#EC4899' : VR.c.line} strokeWidth={2.5} style={{ fill: i <= 3 ? '#EC4899' : 'transparent' }}/>
            ))}
          </div>
          <div style={{
            background: '#fff', padding: '8px 14px', borderRadius: VR.r.full,
            display: 'flex', alignItems: 'center', gap: 6, boxShadow: VR.shadow.xs,
          }}>
            <Ic.starFill size={14}/>
            <span style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 14, color: VR.c.text }}>120</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: VR.font.display, fontSize: 22, fontWeight: 800, color: VR.c.text, letterSpacing: -0.4 }}>
            {lang === 'es' ? 'Empareja referencia y pista' : 'Match reference & hint'}
          </div>
          <div style={{ fontSize: 12, color: VR.c.muted, marginTop: 4, fontWeight: 500 }}>
            {lang === 'es' ? '2 de 4 emparejados' : '2 of 4 matched'} · 0:34
          </div>
        </div>
      </div>

      {/* Match grid: refs on left, hints on right */}
      <div style={{ padding: '20px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pairs.map((p) => {
            const palette = VR.cardColors.find((c) => c.id === p.color);
            return (
              <div key={p.ref} style={{
                padding: '14px 12px', borderRadius: VR.r.lg,
                background: p.matched ? palette.bg : '#fff',
                color: p.matched ? '#fff' : VR.c.text,
                boxShadow: p.matched ? `0 6px 14px ${palette.solid}40` : VR.shadow.sm,
                opacity: p.matched ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
              }}>
                {p.matched && <Ic.check size={16} color="#fff" strokeWidth={3}/>}
                <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 13, letterSpacing: -0.2 }}>{p.ref}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* selected one — highlighted */}
          {[
            { hint: 'pastor', color: 'emerald', matched: true },
            { hint: 'cooperan para bien', color: 'rose', selected: true },
            { hint: 'camino, verdad, vida', color: 'indigo', matched: true },
            { hint: 'fortalece', color: 'amber' },
          ].map((p, i) => {
            const palette = VR.cardColors.find((c) => c.id === p.color);
            return (
              <div key={i} style={{
                padding: '14px 12px', borderRadius: VR.r.lg,
                background: p.matched ? palette.bg : '#fff',
                color: p.matched ? '#fff' : VR.c.text,
                boxShadow: p.selected
                  ? `0 0 0 3px ${palette.solid}, ${VR.shadow.md}`
                  : (p.matched ? `0 6px 14px ${palette.solid}40` : VR.shadow.sm),
                opacity: p.matched ? 0.5 : 1,
                fontFamily: VR.font.serif, fontStyle: 'italic', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6, position: 'relative',
                fontWeight: 500,
              }}>
                {p.matched && <Ic.check size={16} color="#fff" strokeWidth={3}/>}
                {p.hint}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tip */}
      <div style={{ padding: '20px 24px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: VR.c.muted, fontWeight: 500 }}>
          💡 {lang === 'es'
            ? 'Conecta cada referencia con su pista correspondiente'
            : 'Connect each reference to its matching hint'}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Fill the Gap — cloze deletion with keyboard input
// ───────────────────────────────────────────────────────────
function ScreenFillTheGap({ lang = 'es' }) {
  const t = T[lang];
  const v = SAMPLE_VERSES[2]; // Psalm 23:1
  const palette = VR.cardColors.find((c) => c.id === v.color);

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: 'linear-gradient(180deg, #E0F2FE 0%, #FAF9FE 50%)',
      fontFamily: VR.font.sans, paddingBottom: 32,
    }}>
      <div style={{ paddingTop: 56, paddingBottom: 12, paddingLeft: 16, paddingRight: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: VR.shadow.xs }}>
            <Ic.close size={18} color={VR.c.text} strokeWidth={2.5}/>
          </div>
          <ProgressBar value={0.4} color={VR.brand.sky} height={6}/>
          <div style={{ width: 36 }}/>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: VR.c.muted, fontWeight: 600 }}>
          {lang === 'es' ? 'VERSO 2 DE 5' : 'VERSE 2 OF 5'} · {lang === 'es' ? 'Completa el verso' : 'Fill the gap'}
        </div>
      </div>

      {/* Verse with blanks */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          background: '#fff', borderRadius: VR.r['2xl'], padding: 24,
          boxShadow: VR.shadow.md, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: palette.bg, opacity: 0.1 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, position: 'relative' }}>
            <Ic.sheep size={22} color={palette.solid} strokeWidth={2.3}/>
            <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 16, color: VR.c.text }}>{v.ref}</div>
            <div style={{ marginLeft: 'auto', fontSize: 9, color: VR.c.muted, fontWeight: 700, letterSpacing: 0.5 }}>{v.version}</div>
          </div>
          <div style={{
            fontFamily: VR.font.serif, fontSize: 21, lineHeight: 1.7,
            color: VR.c.text, textWrap: 'pretty',
          }}>
            El Señor es mi <Blank w={70} filled="pastor" correct/>,
            {' '}nada me <Blank w={75}/>.
          </div>
        </div>
      </div>

      {/* Word options */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 11, color: VR.c.muted, marginBottom: 10, fontWeight: 600, textAlign: 'center' }}>
          {lang === 'es' ? 'Escoge la palabra correcta' : 'Pick the correct word'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {['faltará', 'olvidará', 'sobrará', 'cansará'].map((w, i) => (
            <div key={i} style={{
              padding: '14px 16px', borderRadius: VR.r.lg,
              background: '#fff', color: VR.c.text,
              fontFamily: VR.font.display, fontWeight: 700, fontSize: 16,
              textAlign: 'center', boxShadow: VR.shadow.sm,
              border: `2px solid ${i === 0 ? VR.c.sky500 : 'transparent'}`,
            }}>{w}</div>
          ))}
        </div>
      </div>

      {/* Hint button */}
      <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        <button style={{
          background: 'transparent', border: 'none',
          color: VR.c.indigo600, fontWeight: 600, fontSize: 13,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          💡 {lang === 'es' ? 'Mostrar primera letra' : 'Show first letter'}
        </button>
      </div>
    </div>
  );
}

function Blank({ w = 70, filled, correct }) {
  return (
    <span style={{
      display: 'inline-block', minWidth: w,
      padding: '2px 12px', borderRadius: 8,
      background: filled ? (correct ? VR.c.emerald400 : VR.c.indigo100) : 'transparent',
      borderBottom: filled ? 'none' : `2.5px solid ${VR.c.indigo400}`,
      color: filled ? '#fff' : 'transparent',
      fontFamily: VR.font.serif, fontWeight: 700,
      fontSize: 19, textAlign: 'center',
      verticalAlign: 'middle', margin: '0 2px',
    }}>{filled || '·'}</span>
  );
}

// ───────────────────────────────────────────────────────────
// Daily Streak Challenge
// ───────────────────────────────────────────────────────────
function ScreenStreakChallenge({ lang = 'es' }) {
  const t = T[lang];
  const days = [
    { d: 'L', done: true },
    { d: 'M', done: true },
    { d: 'M', done: true },
    { d: 'J', done: true },
    { d: 'V', done: true },
    { d: 'S', done: true },
    { d: 'D', today: true },
  ];

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      background: 'linear-gradient(180deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)',
      color: '#fff', fontFamily: VR.font.sans, paddingBottom: 32,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* stars */}
      {[[40, 80], [80, 200], [300, 120], [160, 280], [340, 350]].map(([x, y], i) => (
        <div key={i} style={{
          position: 'absolute', left: x, top: y,
          width: 3, height: 3, borderRadius: '50%', background: '#fff',
          boxShadow: '0 0 8px #fff', opacity: 0.7,
        }}/>
      ))}

      {/* Header */}
      <div style={{ paddingTop: 56, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic.close size={18} color="#fff" strokeWidth={2.5}/>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Ic.flame size={16} color="#FBBF24" strokeWidth={2.5}/>
          <span style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 16 }}>14</span>
        </div>
      </div>

      {/* Big flame */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 20px 0' }}>
        <div style={{
          width: 140, height: 140, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.4), rgba(251,191,36,0) 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 8,
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: VR.brand.sunrise,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 60px rgba(251,191,36,0.6)',
          }}>
            <Ic.flame size={56} color="#fff" strokeWidth={2.2}/>
          </div>
        </div>
        <div style={{ fontFamily: VR.font.display, fontSize: 60, fontWeight: 900, letterSpacing: -2, lineHeight: 1, background: 'linear-gradient(180deg, #FBBF24, #F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          14
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
          {lang === 'es' ? 'días seguidos · récord 21' : 'day streak · record 21'}
        </div>
      </div>

      {/* Week dots */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{
          background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
          borderRadius: VR.r['2xl'], padding: 16,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {days.map((d, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 6, fontWeight: 600 }}>{d.d}</div>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: d.done ? VR.brand.sunrise
                    : d.today ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                  border: d.today ? '2px dashed rgba(251,191,36,0.6)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: d.done ? '0 4px 12px rgba(251,191,36,0.4)' : 'none',
                }}>
                  {d.done && <Ic.check size={16} color="#fff" strokeWidth={3}/>}
                  {d.today && <Ic.flame size={14} color="#FBBF24" strokeWidth={2.5}/>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's verse */}
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 8, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center' }}>
          {lang === 'es' ? 'Tu verso de hoy' : "Today's verse"}
        </div>
        <div style={{
          background: '#fff', borderRadius: VR.r['2xl'], padding: 20,
          color: VR.c.text, boxShadow: VR.shadow.lg,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: VR.brand.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Ic.heart size={22} color="#fff" strokeWidth={2.3}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 16 }}>Romanos 8:28</div>
            <div style={{ fontSize: 11, color: VR.c.muted, marginTop: 2 }}>
              {lang === 'es' ? '~2 minutos · +50 ⭐' : '~2 min · +50 ⭐'}
            </div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: VR.brand.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 12px rgba(99,102,241,0.4)',
          }}>
            <Ic.play size={16} color="#fff" strokeWidth={2.5}/>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          🔥 {lang === 'es'
            ? 'Completa hoy para extender tu racha a 15 días'
            : 'Complete today to extend your streak to 15'}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenPracticeHub, ScreenClassicSession, ScreenWordScramble, ScreenVerseMatch, ScreenFillTheGap, ScreenStreakChallenge });
