// VersoRefuerzo — Desktop screens (web responsive view)

function DesktopFrame({ children, dark }) {
  return (
    <div style={{
      width: 1280, height: 800, borderRadius: 16, overflow: 'hidden',
      background: dark ? VR.c.ink : VR.c.bg,
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08)',
      position: 'relative',
    }}>
      {/* Browser chrome */}
      <div style={{
        height: 36, background: '#E8E6F2', borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F57' }}/>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FEBC2E' }}/>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28C840' }}/>
        </div>
        <div style={{
          flex: 1, height: 22, background: '#fff', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: VR.font.sans, fontSize: 11, color: VR.c.muted, gap: 5,
          maxWidth: 360, margin: '0 auto',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}/>
          versorefuerzo.app
        </div>
      </div>
      <div style={{ height: 'calc(100% - 36px)', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

function DesktopSidebar({ active = 'home', lang = 'es' }) {
  const t = T[lang];
  const items = [
    { id: 'home', icon: 'home', label: t.home },
    { id: 'practice', icon: 'play', label: t.practice, badge: 4 },
    { id: 'library', icon: 'library', label: t.library },
    { id: 'collections', icon: 'folder', label: t.collections },
    { id: 'stats', icon: 'chart', label: lang === 'es' ? 'Progreso' : 'Progress' },
  ];
  return (
    <div style={{
      width: 240, height: '100%', background: '#fff',
      borderRight: `1px solid ${VR.c.line}`,
      padding: '20px 12px', display: 'flex', flexDirection: 'column',
      fontFamily: VR.font.sans,
    }}>
      <div style={{ padding: '8px 12px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #FBBF24, #F472B6 60%, #A855F7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(168,85,247,0.3)',
        }}>
          <Ic.bible size={20} color="#fff" strokeWidth={2.3}/>
        </div>
        <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 17, color: VR.c.text, letterSpacing: -0.4 }}>VersoRefuerzo</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((it) => {
          const Cmp = Ic[it.icon];
          const isActive = it.id === active;
          return (
            <div key={it.id} style={{
              padding: '10px 12px', borderRadius: 10,
              background: isActive ? VR.c.indigo50 : 'transparent',
              color: isActive ? VR.c.indigo700 : VR.c.text,
              display: 'flex', alignItems: 'center', gap: 12,
              fontSize: 13, fontWeight: isActive ? 700 : 500,
            }}>
              <Cmp size={18} color={isActive ? VR.c.indigo700 : VR.c.muted} strokeWidth={isActive ? 2.4 : 2}/>
              {it.label}
              {it.badge && (
                <span style={{ marginLeft: 'auto', background: VR.c.indigo600, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>{it.badge}</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, padding: '0 4px' }}>
        <Button variant="primary" size="md" full icon={<Ic.plus size={16} strokeWidth={3}/>}>
          {t.addVerse}
        </Button>
      </div>

      <div style={{ marginTop: 24, padding: '0 8px' }}>
        <div style={{ fontSize: 10, color: VR.c.muted, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>{t.collections}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {SAMPLE_COLLECTIONS.slice(0, 5).map((col) => {
            const c = VR.collectionColors[col.color];
            return (
              <div key={col.id} style={{
                padding: '7px 10px', borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 12, color: VR.c.text, fontWeight: 500,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.dot }}/>
                <span style={{ flex: 1 }}>{col.name}</span>
                <span style={{ fontSize: 10, color: VR.c.muted, fontWeight: 600 }}>{col.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* User card at bottom */}
      <div style={{
        marginTop: 'auto', padding: 10, borderRadius: 12,
        background: VR.c.cardSoft, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: VR.brand.rose, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: VR.font.display, fontWeight: 800, fontSize: 13,
        }}>M</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: VR.c.text }}>María R.</div>
          <div style={{ fontSize: 10, color: VR.c.muted }}>maria@gmail.com</div>
        </div>
        <Ic.settings size={16} color={VR.c.muted}/>
      </div>
    </div>
  );
}

function ScreenDesktopHome({ lang = 'es' }) {
  const t = T[lang];
  return (
    <div style={{ display: 'flex', height: '100%', background: VR.c.bg, fontFamily: VR.font.sans }}>
      <DesktopSidebar lang={lang} active="home"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {/* Top hero */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: VR.font.display, fontSize: 30, fontWeight: 800, color: VR.c.text, margin: 0, letterSpacing: -0.7 }}>
              {lang === 'es' ? 'Buenos días, María 🌅' : 'Good morning, María 🌅'}
            </h1>
            <p style={{ fontSize: 14, color: VR.c.muted, margin: '4px 0 0', fontWeight: 500 }}>
              {lang === 'es' ? 'Tienes 4 versos para repasar hoy. ¡Empecemos!' : 'You have 4 verses due today. Let\'s go!'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              padding: '10px 14px', background: '#fff', borderRadius: 12, boxShadow: VR.shadow.xs,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Ic.flame size={20} color={VR.c.amber500} strokeWidth={2.5}/>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: VR.c.text, lineHeight: 1, fontFamily: VR.font.display }}>14</div>
                <div style={{ fontSize: 10, color: VR.c.muted, fontWeight: 600 }}>{t.days}</div>
              </div>
            </div>
            <Button variant="primary" size="md" icon={<Ic.play size={16} strokeWidth={2.5}/>}>{t.practiceNow}</Button>
          </div>
        </div>

        {/* Three column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              {[
                { v: 36, l: lang === 'es' ? 'Versos totales' : 'Total verses', c: VR.c.indigo600, ic: 'cards' },
                { v: 24, l: t.versesMastered, c: VR.c.emerald500, ic: 'check' },
                { v: 8, l: t.versesLearning, c: VR.c.amber500, ic: 'sparkles' },
                { v: '92%', l: lang === 'es' ? 'Precisión' : 'Accuracy', c: VR.c.violet600, ic: 'target' },
              ].map((s, i) => {
                const Cmp = Ic[s.ic];
                return (
                  <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: VR.shadow.xs }}>
                    <Cmp size={18} color={s.c} strokeWidth={2.5}/>
                    <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 28, color: VR.c.text, marginTop: 8, letterSpacing: -0.5 }}>{s.v}</div>
                    <div style={{ fontSize: 12, color: VR.c.muted, fontWeight: 500 }}>{s.l}</div>
                  </div>
                );
              })}
            </div>

            {/* Recent verses grid */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: VR.shadow.xs, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontFamily: VR.font.display, fontSize: 16, fontWeight: 700, color: VR.c.text, margin: 0 }}>
                  {lang === 'es' ? 'Para repasar hoy' : 'Due today'}
                </h3>
                <span style={{ fontSize: 12, color: VR.c.indigo600, fontWeight: 600 }}>{lang === 'es' ? 'Ver todos' : 'See all'} →</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                {SAMPLE_VERSES.slice(0, 4).map((v) => <VerseCard key={v.id} verse={v} size="sm" lang={lang}/>)}
              </div>
            </div>

            {/* Activity chart placeholder */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: VR.shadow.xs }}>
              <h3 style={{ fontFamily: VR.font.display, fontSize: 16, fontWeight: 700, color: VR.c.text, margin: '0 0 16px' }}>
                {lang === 'es' ? 'Tu actividad — últimas 4 semanas' : 'Activity — last 4 weeks'}
              </h3>
              <div style={{ display: 'flex', gap: 4, height: 120, alignItems: 'flex-end' }}>
                {[3,5,2,7,8,6,9, 4,6,8,9,12,7,11, 8,10,5,12,14,9,13, 11,9,12,14,12,15,14].map((h, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: `${h * 7}px`,
                    background: i >= 21 ? VR.brand.primary : VR.c.indigo200,
                    borderRadius: '4px 4px 0 0',
                  }}/>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: VR.c.muted, fontWeight: 600 }}>
                <span>4 sem</span><span>3 sem</span><span>2 sem</span><span>{lang === 'es' ? 'Esta semana' : 'This week'}</span>
              </div>
            </div>
          </div>

          {/* Right column: practice modes */}
          <div>
            <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: VR.shadow.xs, marginBottom: 16 }}>
              <h3 style={{ fontFamily: VR.font.display, fontSize: 14, fontWeight: 700, color: VR.c.text, margin: '0 0 14px' }}>
                {lang === 'es' ? 'Modos de práctica' : 'Practice modes'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { l: t.classicMode, ic: 'cards', c: VR.brand.primary },
                  { l: t.streakChallenge, ic: 'flame', c: VR.brand.sunrise },
                  { l: t.wordScramble, ic: 'shuffle', c: VR.brand.forest },
                  { l: t.verseMatch, ic: 'grid', c: VR.brand.rose },
                  { l: t.fillTheGap, ic: 'edit', c: VR.brand.sky },
                ].map((m, i) => {
                  const Cmp = Ic[m.ic];
                  return (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: 10,
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: VR.c.cardSoft,
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Cmp size={16} color="#fff" strokeWidth={2.4}/>
                      </div>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: VR.c.text }}>{m.l}</div>
                      <Ic.forward size={14} color={VR.c.muted}/>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Daily verse */}
            <div style={{
              background: VR.brand.night, borderRadius: 16, padding: 20,
              color: '#fff', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.4), transparent 70%)' }}/>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                {lang === 'es' ? 'Verso del día' : 'Verse of the day'}
              </div>
              <div style={{ fontFamily: VR.font.display, fontSize: 22, fontWeight: 800, marginTop: 8, letterSpacing: -0.4 }}>Romanos 8:28</div>
              <div style={{ fontFamily: VR.font.serif, fontSize: 13, lineHeight: 1.5, marginTop: 10, opacity: 0.9, fontStyle: 'italic' }}>
                {lang === 'es' ? '"Y sabemos que para los que aman a Dios, todas las cosas cooperan para bien…"' : '"And we know that God causes all things to work together for good to those who love God…"'}
              </div>
              <Button variant="dark" size="sm" style={{ marginTop: 14, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }} icon={<Ic.play size={12} strokeWidth={2.5}/>}>
                {lang === 'es' ? 'Practicar ahora' : 'Practice now'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DesktopFrame, ScreenDesktopHome });
