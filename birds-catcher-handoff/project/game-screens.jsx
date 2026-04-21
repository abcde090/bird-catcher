// Screens — title, card-reveal, results, field guide
const { useState: usS, useEffect: usE, useMemo: usM } = React;

function TitleScreen({ onPlay, onGuide, highScore, discoveries }) {
  const [birds, setBirds] = usS(() => {
    return Array.from({length:8}).map((_,i) => ({
      i,
      bird: window.BIRDS_DATA[Math.floor(Math.random()*window.BIRDS_DATA.length)],
      top: 15 + Math.random()*60,
      dur: 14 + Math.random()*10,
      delay: -Math.random()*20,
      scale: 0.4 + Math.random()*0.4,
      dir: Math.random() > 0.5 ? 1 : -1,
    }));
  });

  return (
    <div style={{position:"absolute", inset:0, overflow:"hidden"}}>
      {/* dawn sky bg */}
      <div style={{position:"absolute", inset:0, background:
        "linear-gradient(to bottom, #f5d6a0 0%, #f0a86a 30%, #d8785a 55%, #8a4a5a 80%, #3a2838 100%)"}}/>
      <div style={{position:"absolute", left:"50%", top:"35%", transform:"translate(-50%,-50%)",
        width:180, height:180, borderRadius:"50%",
        background:"radial-gradient(circle, #fde8b8 0%, #f5a85a 40%, transparent 70%)",
        boxShadow:"0 0 200px #f5a85a"}}/>

      {/* drift birds */}
      {birds.map(b => (
        <div key={b.i} style={{
          position:"absolute", top:`${b.top}%`,
          left: b.dir > 0 ? "-100px" : "calc(100% + 100px)",
          animation: `title-drift-${b.dir > 0 ? "r" : "l"} ${b.dur}s linear infinite`,
          animationDelay:`${b.delay}s`,
          transform:`scale(${b.scale})`, opacity: 0.7,
        }}>
          <BirdSVG bird={b.bird} size={80} facing={b.dir}/>
        </div>
      ))}

      {/* mountains */}
      <svg viewBox="0 0 1200 200" preserveAspectRatio="none" style={{position:"absolute", bottom:"18%", width:"100%", height:"28%", opacity:0.9}}>
        <path d="M0 200 L0 130 L100 60 L200 120 L320 70 L440 130 L560 50 L700 125 L840 80 L980 130 L1100 90 L1200 115 L1200 200 Z" fill="#1a0e1a"/>
      </svg>
      <div style={{position:"absolute", bottom:0, left:0, right:0, height:"18%", background:"linear-gradient(to bottom, #0a0510, #000)"}}/>

      {/* Content */}
      <div style={{position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:40, zIndex:10}}>
        <div style={{textAlign:"center", maxWidth:"90vw"}}>
          <div style={{fontFamily:"'JetBrains Mono', monospace", fontSize:12, letterSpacing:"0.4em",
            color:"#fde8b8", textTransform:"uppercase", marginBottom:16,
            textShadow:"0 2px 8px rgba(0,0,0,0.6)"}}>
            An Australian Field Study
          </div>
          <h1 style={{
            fontFamily:"'Fraunces', serif", fontSize:"clamp(56px, 10vw, 112px)", fontWeight:400,
            color:"#fff4e0", margin:0, lineHeight:0.95, letterSpacing:"-0.04em",
            whiteSpace:"nowrap",
            fontVariationSettings:"'opsz' 144, 'SOFT' 100",
            textShadow:"0 6px 40px rgba(0,0,0,0.5), 0 2px 0 rgba(255,255,255,0.1)",
          }}>
            Birds at
          </h1>
          <h1 style={{
            fontFamily:"'Fraunces', serif", fontSize:"clamp(56px, 10vw, 112px)", fontWeight:300,
            color:"#fde8b8", margin:0, lineHeight:0.95, letterSpacing:"-0.04em",
            fontStyle:"italic",
            whiteSpace:"nowrap",
            fontVariationSettings:"'opsz' 144",
            textShadow:"0 6px 40px rgba(0,0,0,0.5)",
          }}>
            Golden Hour
          </h1>
          <div style={{marginTop:20, fontFamily:"'Fraunces', serif", fontStyle:"italic", color:"#fff4e0cc", fontSize:18, maxWidth:520, margin:"20px auto 0", textShadow:"0 2px 8px rgba(0,0,0,0.5)"}}>
            Catch native birds as they cross the sky. Study them. Fill the journal before dusk fades to night.
          </div>
        </div>

        <div style={{display:"flex", gap:16, alignItems:"center"}}>
          <button className="btn btn-primary" onClick={onPlay}>
            <span>Begin Round</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
          <button className="btn btn-ghost" onClick={onGuide}>Field Journal</button>
        </div>

        <div style={{
          display:"flex", gap:40, fontFamily:"'JetBrains Mono', monospace",
          fontSize:11, letterSpacing:"0.2em", color:"#fff4e0cc", textTransform:"uppercase",
          textShadow:"0 2px 4px rgba(0,0,0,0.5)"
        }}>
          <div><span style={{opacity:0.6}}>Best</span> {highScore.toLocaleString()}</div>
          <div style={{opacity:0.3}}>·</div>
          <div><span style={{opacity:0.6}}>Discovered</span> {discoveries}/{window.BIRDS_DATA.length}</div>
        </div>
      </div>
    </div>
  );
}

function CardReveal({ bird, onClose }) {
  const rarity = RARITY[bird.status];
  usE(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
  return (
    <div
      onClick={onClose}
      style={{
        position:"absolute", top: 88, right: 16, zIndex: 60,
        width: 280,
        animation:"toast-in 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        cursor:"pointer",
        pointerEvents:"auto",
      }}>
      <div style={{
        padding:"14px 16px 16px",
        background:"linear-gradient(160deg, #fdf6e8ee, #f0e2c4ee)",
        backdropFilter:"blur(6px)",
        border: `1.5px solid ${rarity.color}`, borderRadius: 4,
        boxShadow:`0 0 24px ${rarity.ring}66, 0 12px 32px rgba(0,0,0,0.35)`,
        position:"relative",
      }}>
        {/* rarity ribbon */}
        <div style={{
          position:"absolute", top:-1, left:-1, padding:"3px 10px",
          background: rarity.color, color:"#fdf6e8",
          fontFamily:"'JetBrains Mono', monospace", fontSize:8, letterSpacing:"0.25em", textTransform:"uppercase", fontWeight:600,
          borderRadius:"3px 0 3px 0",
        }}>
          ✦ New · {rarity.label}
        </div>

        <div style={{display:"flex", gap:12, alignItems:"center", marginTop:10}}>
          <div style={{
            flexShrink:0, width:68, height:68,
            background:"linear-gradient(135deg, #e8d4a8, #d4b888)",
            border:`1px solid ${rarity.color}55`, borderRadius:3,
            display:"flex", alignItems:"center", justifyContent:"center",
            overflow:"hidden",
          }}>
            <BirdSVG bird={bird} size={90} facing={1}/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <h3 style={{fontFamily:"'Fraunces', serif", fontSize:17, fontWeight:500, margin:"0 0 1px", color:"#2a1a0a", letterSpacing:"-0.01em", lineHeight:1.15}}>
              {bird.name}
            </h3>
            <div style={{fontFamily:"'Fraunces', serif", fontStyle:"italic", fontSize:11, color:"#6a4a2a", lineHeight:1.2}}>
              {bird.scientific}
            </div>
            <div style={{marginTop:6, fontFamily:"'JetBrains Mono', monospace", fontSize:8, letterSpacing:"0.2em", color:rarity.color, textTransform:"uppercase", fontWeight:600}}>
              +50 discovery bonus
            </div>
          </div>
        </div>

        <div style={{marginTop:10, paddingTop:8, borderTop:`1px dashed ${rarity.color}44`, fontSize:11, color:"#3a2a1a", fontFamily:"'Fraunces', serif", lineHeight:1.4, fontStyle:"italic"}}>
          "{bird.funFact}"
        </div>
      </div>
    </div>
  );
}

function ResultsScreen({ score, highScore, catches, newDiscoveries, onRetry, onTitle, onGuide }) {
  const isNewHigh = score > 0 && score === highScore;
  return (
    <div style={{position:"absolute", inset:0, background:"linear-gradient(to bottom, #1a1a2e, #0a0a1a)", display:"flex", alignItems:"center", justifyContent:"center"}}>
      {/* subtle stars */}
      <div style={{position:"absolute", inset:0, opacity:0.5}}>
        {Array.from({length:60}).map((_,i) => {
          const x = (i*47.3)%100, y = (i*29.1)%100, s = 0.5+((i*7)%3)*0.4;
          return <div key={i} style={{position:"absolute", left:`${x}%`, top:`${y}%`,
            width:s, height:s, background:"#fff9e0", borderRadius:"50%",
            boxShadow:"0 0 3px #fff9e0"}}/>;
        })}
      </div>

      <div className="panel" style={{width:620, maxWidth:"90vw", padding:"40px 48px", zIndex:1}}>
        <div style={{fontFamily:"'JetBrains Mono', monospace", fontSize:10, letterSpacing:"0.4em", color:"var(--ink-muted)", textTransform:"uppercase", textAlign:"center"}}>
          ◈ Round Complete ◈
        </div>
        <h2 style={{fontFamily:"'Fraunces', serif", fontSize: isNewHigh ? 32 : 40, fontWeight:500, color:"var(--ink)", textAlign:"center", margin:"12px 0 4px", letterSpacing:"-0.02em"}}>
          {isNewHigh ? "A new personal best" : "Final Tally"}
        </h2>
        {isNewHigh && <div style={{textAlign:"center", fontFamily:"'Fraunces', serif", fontStyle:"italic", color:"#c85530", marginBottom:8}}>Your sharpest field day yet.</div>}

        <div style={{fontFamily:"'Fraunces', serif", fontSize:96, fontWeight:600, color:"var(--ink)", textAlign:"center", lineHeight:1, letterSpacing:"-0.04em", margin:"12px 0", fontVariantNumeric:"tabular-nums"}}>
          {score.toLocaleString()}
        </div>

        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, margin:"24px 0"}}>
          <Stat label="Caught" value={catches.length}/>
          <Stat label="New species" value={newDiscoveries}/>
          <Stat label="Personal best" value={highScore.toLocaleString()}/>
        </div>

        {catches.length > 0 && (
          <div style={{marginTop:8, marginBottom:24}}>
            <div className="label" style={{marginBottom:10}}>Today's catch</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:8, maxHeight:140, overflowY:"auto"}}>
              {catches.slice(0,20).map((c,i) => (
                <div key={i} style={{
                  display:"flex", alignItems:"center", gap:6, padding:"4px 10px 4px 4px",
                  background:"rgba(138,94,32,0.08)", border:"1px solid rgba(138,94,32,0.2)",
                  borderRadius:20, fontSize:12, fontFamily:"'Fraunces', serif", color:"var(--ink)"
                }}>
                  <div style={{width:22, height:22, background: RARITY[c.status].color, borderRadius:"50%",
                    display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <div style={{transform:"scale(0.5)"}}><BirdSVG bird={c} size={30} facing={1}/></div>
                  </div>
                  {c.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"flex", gap:12, justifyContent:"center"}}>
          <button className="btn btn-primary" onClick={onRetry}>Play Again</button>
          <button className="btn btn-outline" onClick={onGuide}>Journal</button>
          <button className="btn btn-outline" onClick={onTitle}>Title</button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{textAlign:"center", padding:"12px 4px", background:"rgba(138,94,32,0.06)", borderRadius:4, border:"1px solid rgba(138,94,32,0.15)"}}>
      <div className="label">{label}</div>
      <div style={{fontFamily:"'Fraunces', serif", fontSize:28, fontWeight:500, color:"var(--ink)", marginTop:4, letterSpacing:"-0.02em"}}>{value}</div>
    </div>
  );
}

function FieldGuide({ discovered, onBack }) {
  const [filter, setFilter] = usS("all");
  const birds = window.BIRDS_DATA;
  const filtered = birds.filter(b => filter === "all" ? true : b.status === filter);

  return (
    <div style={{position:"absolute", inset:0, background:"linear-gradient(180deg, #f0e2c4, #e8d8b4)", overflow:"auto"}}>
      <div style={{maxWidth: 1100, margin:"0 auto", padding:"48px 32px"}}>
        <button onClick={onBack} className="btn btn-ghost" style={{marginBottom:32}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>

        <div style={{borderBottom:"1px solid rgba(138,94,32,0.3)", paddingBottom:20, marginBottom:32}}>
          <div style={{fontFamily:"'JetBrains Mono', monospace", fontSize:10, letterSpacing:"0.4em", color:"#8a5e20", textTransform:"uppercase"}}>Vol. I</div>
          <h1 style={{fontFamily:"'Fraunces', serif", fontSize:72, fontWeight:400, margin:"4px 0 0", letterSpacing:"-0.03em", color:"#2a1a0a", fontStyle:"italic"}}>Field Journal</h1>
          <div style={{fontFamily:"'Fraunces', serif", color:"#6a4a2a", marginTop:8, fontSize:16}}>
            {discovered.size} of {birds.length} species catalogued · keep watching the skies.
          </div>
        </div>

        <div style={{display:"flex", gap:8, marginBottom:24, flexWrap:"wrap"}}>
          {[["all","All"],["least_concern","Common"],["near_threatened","Uncommon"],["vulnerable","Rare"],["endangered","Epic"],["critically_endangered","Legendary"]].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)} className={"chip " + (filter===k?"chip-active":"")}>{l}</button>
          ))}
        </div>

        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))", gap:16}}>
          {filtered.map(b => {
            const known = discovered.has(b.id);
            const rarity = RARITY[b.status];
            return (
              <div key={b.id} style={{
                padding:18, background: known ? "#fdf6e8" : "#e8dabe",
                border:`1.5px solid ${known ? rarity.color+'66' : '#8a6a3e33'}`, borderRadius:4,
                opacity: known ? 1 : 0.85,
                position:"relative", overflow:"hidden",
              }}>
                <div style={{width:"100%", height:100, background:"rgba(138,94,32,0.08)", borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12,
                  filter: known ? "none" : "brightness(0) opacity(0.4)"}}>
                  <BirdSVG bird={b} size={140} facing={1}/>
                </div>
                <div style={{fontFamily:"'JetBrains Mono', monospace", fontSize:9, letterSpacing:"0.2em", color: rarity.color, textTransform:"uppercase", fontWeight:600}}>
                  {rarity.label}
                </div>
                <div style={{fontFamily:"'Fraunces', serif", fontSize:18, fontWeight:500, color:"#2a1a0a", marginTop:2}}>
                  {known ? b.name : "— unrecorded —"}
                </div>
                {known && <div style={{fontFamily:"'Fraunces', serif", fontStyle:"italic", fontSize:12, color:"#6a4a2a"}}>{b.scientific}</div>}
                {known && <div style={{marginTop:8, fontSize:12, color:"#3a2a1a", lineHeight:1.5}}>{b.funFact}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TitleScreen, CardReveal, ResultsScreen, FieldGuide, Stat });
