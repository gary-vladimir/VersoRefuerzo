// VersoRefuerzo — App entry: assembles the design canvas with all artboards.

const { useState } = React;

function App() {
  const [tw, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "lang": "es",
    "showDesktop": true,
    "accentTheme": "indigo"
  }/*EDITMODE-END*/);

  const lang = tw.lang;
  const t = T[lang];

  return (
    <>
      <DesignCanvas>
        <DCSection id="onboarding" title="① Onboarding & Login" subtitle="First-run · Google sign-in">
          <DCArtboard id="login" label="Login · Mobile" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenLogin lang={lang}/>
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection id="home" title="② Home / Dashboard" subtitle="Daily streak, due today, collections, recent verses">
          <DCArtboard id="home-mobile" label="Home · Mobile" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenHome lang={lang}/>
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="home-desktop" label="Home · Desktop / Web" width={1300} height={820}>
            <DesktopFrame>
              <ScreenDesktopHome lang={lang}/>
            </DesktopFrame>
          </DCArtboard>
        </DCSection>

        <DCSection id="verse" title="③ Verse cards & details" subtitle="The atomic unit · front, back, hint reveal">
          <DCArtboard id="card-front" label="Card · Front (recite first)" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenCardView lang={lang} state="front"/>
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="card-back" label="Card · Revealed (knew it / give up)" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenCardView lang={lang} state="flipped"/>
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="card-hint" label="Card · Hint shown after 'I give up'" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenCardView lang={lang} state="flipped-hint"/>
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="card-gallery" label="Card design system" width={760} height={460}>
            <CardGallery lang={lang}/>
          </DCArtboard>
        </DCSection>

        <DCSection id="create" title="④ Add new verse" subtitle="Reference + version + icon + color + hint + collections">
          <DCArtboard id="new-verse" label="New verse · Mobile" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenNewVerse lang={lang}/>
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection id="library" title="⑤ Library & collections" subtitle="Group verses, color-tag them, see at a glance">
          <DCArtboard id="library-mobile" label="Library · Mobile" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenLibrary lang={lang}/>
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection id="practice" title="⑥ Practice modes hub" subtitle="Pick how to study — recommended, daily, mini-games">
          <DCArtboard id="practice-hub" label="Practice hub · Mobile" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenPracticeHub lang={lang}/>
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection id="games" title="⑦ Game modes — science-based memorization" subtitle="SM-2 spaced repetition + active recall + cloze + matching">
          <DCArtboard id="classic" label="Classic flashcards (SM-2)" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenClassicSession lang={lang}/>
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="scramble" label="Word scramble" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenWordScramble lang={lang}/>
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="match" label="Verse match" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenVerseMatch lang={lang}/>
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="gap" label="Fill the gap (cloze)" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenFillTheGap lang={lang}/>
            </IOSDevice>
          </DCArtboard>
          <DCArtboard id="streak" label="Daily streak challenge" width={420} height={900}>
            <IOSDevice width={402} height={874}>
              <ScreenStreakChallenge lang={lang}/>
            </IOSDevice>
          </DCArtboard>
        </DCSection>

        <DCSection id="system" title="⑧ Visual system" subtitle="Color, type, components — what holds it all together">
          <DCArtboard id="palette" label="Card color palette" width={760} height={300}>
            <PaletteBoard/>
          </DCArtboard>
          <DCArtboard id="icons" label="Verse icon library" width={760} height={360}>
            <IconBoard/>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Language">
          <TweakRadio label="Idioma / Language" value={tw.lang} onChange={(v) => setTweak('lang', v)}
            options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

// ─── Visual system boards ───────────────────────────────────
function PaletteBoard() {
  return (
    <div style={{
      width: 760, height: 300, padding: 24, background: '#fff',
      fontFamily: VR.font.sans, color: VR.c.text,
    }}>
      <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>Card colors</div>
      <div style={{ fontSize: 11, color: VR.c.muted, marginTop: 4, marginBottom: 16 }}>
        Users pick one per verse — visual cue that aids recall.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
        {VR.cardColors.map((c) => (
          <div key={c.id}>
            <div style={{ height: 70, borderRadius: 14, background: c.bg, boxShadow: VR.shadow.sm }}/>
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 6 }}>{c.label}</div>
            <div style={{ fontSize: 9, color: VR.c.muted, fontFamily: VR.font.mono }}>{c.solid}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Object.keys(VR.collectionColors).map((k) => <Tag key={k} color={k}>{k}</Tag>)}
      </div>
    </div>
  );
}

function IconBoard() {
  const verseIcons = ['bible', 'cross', 'dove', 'sheep', 'lion', 'fishLoaves', 'crown', 'flameSmall', 'heart', 'mountain', 'water', 'sun', 'door', 'shield', 'handPray', 'anchor', 'seed', 'book'];
  return (
    <div style={{
      width: 760, height: 360, padding: 24, background: '#fff',
      fontFamily: VR.font.sans, color: VR.c.text,
    }}>
      <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>Verse icons</div>
      <div style={{ fontSize: 11, color: VR.c.muted, marginTop: 4, marginBottom: 16 }}>
        Visual cues — picked by user to make cards recognizable. Heavy stroke, line style.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 10 }}>
        {verseIcons.map((name) => {
          const Cmp = Ic[name];
          return (
            <div key={name} style={{ textAlign: 'center' }}>
              <div style={{
                aspectRatio: 1, borderRadius: 14, background: VR.c.cardSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Cmp size={28} color={VR.c.indigo700} strokeWidth={2.3}/>
              </div>
              <div style={{ fontSize: 9, color: VR.c.muted, marginTop: 4, fontFamily: VR.font.mono }}>{name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardGallery({ lang }) {
  const v = SAMPLE_VERSES[2];
  return (
    <div style={{
      width: 760, height: 460, padding: 24, background: VR.c.bg,
      fontFamily: VR.font.sans, color: VR.c.text,
    }}>
      <div style={{ fontFamily: VR.font.display, fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>Verse card sizes & states</div>
      <div style={{ fontSize: 11, color: VR.c.muted, marginTop: 4, marginBottom: 20 }}>
        sm 160×200 (grid) · md 220×280 (default) · lg 300×380 (hero)
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        <VerseCard verse={v} size="sm" lang={lang}/>
        <VerseCard verse={v} size="md" lang={lang}/>
        <VerseCard verse={v} size="md" lang={lang} showBack/>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
