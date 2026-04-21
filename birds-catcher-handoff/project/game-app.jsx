// Main game loop + app shell - ref-based, stable tick
const { useState: uaS, useEffect: uaE, useRef: uaR, useCallback: uaC } = React;

function PlayField({ onBirdCatch, activeBirds, catchEffects }) {
  return (
    <div style={{position:"absolute", inset:0, zIndex:20}}>
      {activeBirds.map(b => {
        const rarity = RARITY[b.species.status];
        const size = 90 * rarity.sizeScale;
        return (
          <div key={b.id}
            onClick={(e) => { e.stopPropagation(); onBirdCatch(b.id, e.clientX, e.clientY); }}
            style={{
              position:"absolute",
              left: b.x - size/2,
              top: b.y - size*0.3,
              width: size, height: size*0.6,
              cursor:"crosshair",
              transform: `rotate(${b.wobble}deg)`,
              willChange: "transform",
            }}>
            <div style={{
              position:"absolute", inset:-10, borderRadius:"50%",
              background: `radial-gradient(circle, ${rarity.ring}44 0%, transparent 70%)`,
              animation: rarity.label !== "Common" ? "bird-glow 1.5s ease-in-out infinite alternate" : undefined,
            }}/>
            <div style={{animation:`bird-flap 0.25s ease-in-out infinite alternate`}}>
              <BirdSVG bird={b.species} size={size} facing={b.direction}/>
            </div>
          </div>
        );
      })}
      {catchEffects.map(fx => (
        <div key={fx.id} style={{
          position:"absolute", left:fx.x, top:fx.y, pointerEvents:"none",
          transform:"translate(-50%,-50%)", animation:"catch-pop 0.8s ease-out forwards",
        }}>
          <div style={{fontFamily:"'Fraunces', serif", fontSize:32, fontWeight:600, color:"#fff",
            textShadow:`0 0 12px ${fx.color}, 0 3px 8px rgba(0,0,0,0.6)`}}>+{fx.points}</div>
          <div style={{fontFamily:"'JetBrains Mono', monospace", fontSize:10, letterSpacing:"0.15em", color:"#fff", textAlign:"center", marginTop:2, textTransform:"uppercase", textShadow:"0 2px 4px rgba(0,0,0,0.7)"}}>
            {fx.name}
          </div>
        </div>
      ))}
    </div>
  );
}

function MissFlash({ trigger }) {
  if (!trigger) return null;
  return <div key={trigger} style={{
    position:"absolute", inset:0, zIndex:60, pointerEvents:"none",
    boxShadow:"inset 0 0 120px 30px rgba(196,69,42,0.5)",
    animation:"miss-flash 0.4s ease-out forwards",
  }}/>;
}

function App() {
  const [screen, setScreen] = uaS("title");
  const [, forceRender] = uaS(0);
  const tick_ = uaC(() => forceRender(x => x+1), []);

  // === All game state lives in refs (so tick is stable) ===
  const stateRef = uaR({
    score: 0,
    timeRemaining: ROUND_DURATION,
    misses: 0,
    combo: 0,
    lastCatchTime: 0,
    activeBirds: [],
    catchEffects: [],
    catches: [],
    newDiscoveries: 0,
    highScore: +localStorage.getItem("bc_high") || 0,
    discovered: (() => {
      try { return new Set(JSON.parse(localStorage.getItem("bc_discovered") || "[]")); }
      catch { return new Set(); }
    })(),
    revealBird: null,
    missFlashKey: 0,
  });

  const birdsRef = uaR([]);
  const rafRef = uaR(0);
  const lastFrameRef = uaR(0);
  const lastSpawnRef = uaR(0);
  const nextIdRef = uaR(0);
  const pausedRef = uaR(false);
  const screenRef = uaR("title");

  uaE(() => { screenRef.current = screen; }, [screen]);

  // === Spawn ===
  const spawnBird = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const phase = getPhase(stateRef.current.timeRemaining);
    const eligible = window.BIRDS_DATA.filter(b => phase.allowed.includes(b.status));
    if (!eligible.length) return null;
    const species = weightedPick(eligible, b => RARITY[b.status].weight);
    const direction = Math.random() > 0.5 ? 1 : -1;
    // Bias heavily to calm patterns; rare zigzag/dive
    const r = Math.random();
    const pattern = r < 0.55 ? "straight" : r < 0.85 ? "arc" : r < 0.95 ? "dive" : "zigzag";
    const startX = direction > 0 ? -120 : vw + 120;
    const endX = direction > 0 ? vw + 120 : -120;
    const baseY = 140 + Math.random() * (vh * 0.55);
    const speed = (120 + Math.random()*50) * RARITY[species.status].speed; // slower overall
    return {
      id: `b${nextIdRef.current++}`, species, pattern, direction,
      startX, endX, startY: baseY, endY: baseY + (Math.random()-0.5)*80,
      x: startX, y: baseY, progress: 0, speed,
      wobble: 0, spawnTime: performance.now()/1000,
    };
  };

  // === Stable tick ===
  const tick = (timestamp) => {
    if (screenRef.current !== "playing") return;
    if (pausedRef.current) { rafRef.current = requestAnimationFrame(tick); return; }

    const s = stateRef.current;
    const now = timestamp / 1000;
    const delta = lastFrameRef.current === 0 ? 0.016 : Math.min(0.1, now - lastFrameRef.current);
    lastFrameRef.current = now;

    // Tick time
    s.timeRemaining = Math.max(0, s.timeRemaining - delta);

    // Spawn
    const phase = getPhase(s.timeRemaining);
    const spawnRate = window.__TWEAKS?.spawnRate || 1;
    const spawnInterval = phase.spawn / spawnRate;
    if (now - lastSpawnRef.current >= spawnInterval && birdsRef.current.length < MAX_ACTIVE) {
      const nb = spawnBird();
      if (nb) { birdsRef.current.push(nb); lastSpawnRef.current = now; }
    }

    // Advance birds
    let missed = 0;
    birdsRef.current = birdsRef.current.map(b => {
      const elapsed = now - b.spawnTime;
      const totalDx = Math.abs(b.endX - b.startX);
      const duration = totalDx / b.speed;
      const progress = Math.min(1, elapsed / duration);
      const t = progress * progress * (3 - 2*progress);
      const baseX = b.startX + (b.endX - b.startX) * t;
      let y = b.startY + (b.endY - b.startY) * t;
      const bob = Math.sin(now*2.5 + b.startY) * 2.5; // gentler bob

      if (b.pattern === "arc") y += -100 * Math.sin(progress * Math.PI); // shallower arc
      else if (b.pattern === "zigzag") y += Math.sin(progress * Math.PI * 2.5) * 35; // slower, shorter zigzag
      else if (b.pattern === "dive") y = b.startY + (b.endY - b.startY) * (progress*progress);

      return { ...b, x: baseX, y: y + bob, progress, wobble: Math.sin(now*3 + b.startY)*1.5 };
    }).filter(b => {
      if (b.progress >= 1) { missed++; return false; }
      return true;
    });

    s.activeBirds = birdsRef.current;

    if (missed > 0) {
      s.misses += missed;
      s.combo = 0;
      s.missFlashKey = Date.now();
    }

    // Combo expire
    if (s.combo > 0 && Date.now() - s.lastCatchTime > 2500) {
      s.combo = 0;
    }

    // Game over?
    if (s.timeRemaining <= 0 || s.misses >= MAX_MISSES) {
      cancelAnimationFrame(rafRef.current);
      birdsRef.current = [];
      s.activeBirds = [];
      if (s.score > s.highScore) {
        s.highScore = s.score;
        localStorage.setItem("bc_high", s.score);
      }
      setScreen("results");
      tick_();
      return;
    }

    tick_(); // force render
    rafRef.current = requestAnimationFrame(tick);
  };

  uaE(() => {
    if (screen !== "playing") return;
    lastFrameRef.current = 0;
    lastSpawnRef.current = performance.now()/1000;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line
  }, [screen]);

  // === Catch ===
  const catchBird = (id, cx, cy) => {
    const s = stateRef.current;
    const bird = birdsRef.current.find(b => b.id === id);
    if (!bird) return;
    birdsRef.current = birdsRef.current.filter(b => b.id !== id);
    const rarity = RARITY[bird.species.status];
    const isNew = !s.discovered.has(bird.species.id);
    s.combo += 1;
    const mult = getComboMult(s.combo);
    const points = Math.round((rarity.points + (isNew ? 50 : 0)) * mult);

    s.score += points;
    s.lastCatchTime = Date.now();
    s.catches = [...s.catches, bird.species];
    const fxId = `fx${Date.now()}${Math.random()}`;
    s.catchEffects = [...s.catchEffects, { id: fxId, x:cx, y:cy, points, name:bird.species.name, color: rarity.ring }];
    setTimeout(() => {
      stateRef.current.catchEffects = stateRef.current.catchEffects.filter(e => e.id !== fxId);
      tick_();
    }, 800);
    s.activeBirds = birdsRef.current;

    if (isNew) {
      s.discovered = new Set([...s.discovered, bird.species.id]);
      s.newDiscoveries += 1;
      localStorage.setItem("bc_discovered", JSON.stringify([...s.discovered]));
      // Non-disruptive toast: show reveal without pausing the game
      s.revealBird = { species: bird.species, shownAt: performance.now() };
    }
    tick_();
  };

  const closeReveal = () => {
    stateRef.current.revealBird = null;
    lastFrameRef.current = 0;
    tick_();
  };

  const startRound = () => {
    const s = stateRef.current;
    const dur = window.__TWEAKS?.roundDuration || ROUND_DURATION;
    s.score = 0; s.timeRemaining = dur; s.misses = 0; s.combo = 0;
    s.activeBirds = []; s.catchEffects = []; s.catches = []; s.newDiscoveries = 0;
    s.lastCatchTime = 0; s.revealBird = null; s.missFlashKey = 0;
    birdsRef.current = []; nextIdRef.current = 0;
    setScreen("playing");
  };

  const s = stateRef.current;

  if (screen === "title") return <TitleScreen onPlay={startRound} onGuide={() => setScreen("guide")} highScore={s.highScore} discoveries={s.discovered.size}/>;
  if (screen === "guide") return <FieldGuide discovered={s.discovered} onBack={() => setScreen("title")}/>;
  if (screen === "results") return <ResultsScreen score={s.score} highScore={s.highScore} catches={s.catches} newDiscoveries={s.newDiscoveries} onRetry={startRound} onTitle={() => setScreen("title")} onGuide={() => setScreen("guide")}/>;

  const currentPhase = getPhase(s.timeRemaining);
  return (
    <div style={{position:"absolute", inset:0, overflow:"hidden", cursor:"crosshair"}}>
      <Sky phase={currentPhase} timeRemaining={s.timeRemaining}/>
      <PlayField activeBirds={s.activeBirds} catchEffects={s.catchEffects} onBirdCatch={catchBird}/>
      <HUD score={s.score} time={s.timeRemaining} misses={s.misses} combo={s.combo} phase={currentPhase} highScore={s.highScore} discoveries={s.discovered.size}/>
      <MissFlash trigger={s.missFlashKey}/>
      {s.revealBird && <CardReveal bird={s.revealBird.species} onClose={closeReveal}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
