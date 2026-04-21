// Sky background — animated gradient based on phase + sun + hills + parallax clouds
const { useState: uS, useEffect: uE, useRef: uR, useMemo: uM } = React;

function Sky({ phase, timeRemaining }) {
  // phase progress = how far into the current phase (0..1)
  const progress = (phase.start - timeRemaining) / (phase.start - phase.end);
  const nextIdx = Math.min(PHASES.indexOf(phase) + 1, PHASES.length - 1);
  const next = PHASES[nextIdx];

  // Interpolate sky colors between current and next phase for smooth transitions
  const blend = Math.min(1, progress * 1.2);
  const lerpCol = (a, b, t) => {
    const pa = a.match(/\w\w/g).map(h => parseInt(h,16));
    const pb = b.match(/\w\w/g).map(h => parseInt(h,16));
    const r = pa.map((v,i) => Math.round(v + (pb[i]-v)*t));
    return `#${r.map(v => v.toString(16).padStart(2,'0')).join('')}`;
  };
  const colors = phase.sky.map((c,i) => lerpCol(c, next.sky[i] || c, blend * 0.7));

  return (
    <div style={{
      position:"absolute", inset:0, overflow:"hidden",
      background: `linear-gradient(to bottom, ${colors[0]} 0%, ${colors[1]} 35%, ${colors[2]} 65%, ${colors[3]} 100%)`,
      transition: "background 1s ease-out",
    }}>
      {/* Stars (only in night) */}
      {phase.id === "night" && (
        <div style={{position:"absolute", inset:0, opacity:0.8}}>
          {Array.from({length: 80}).map((_,i) => {
            const x = (i * 37.3) % 100, y = (i * 19.7) % 70;
            const s = 0.5 + ((i*7)%3)*0.6;
            return <div key={i} style={{
              position:"absolute", left:`${x}%`, top:`${y}%`,
              width:s, height:s, background:"#fff9e0", borderRadius:"50%",
              opacity: 0.4 + ((i*13)%7)/10,
              boxShadow:"0 0 4px #fff9e0",
              animation: `twinkle ${2+(i%4)}s ease-in-out infinite alternate`,
              animationDelay: `${(i%10)*0.3}s`,
            }}/>;
          })}
        </div>
      )}

      {/* Sun / Moon */}
      <div style={{
        position:"absolute",
        left:"50%",
        top: `${20 + progress * 30 + PHASES.indexOf(phase)*8}%`,
        transform:"translate(-50%,-50%)",
        width: 90, height: 90, borderRadius:"50%",
        background: `radial-gradient(circle, ${phase.sun} 0%, ${phase.sun}dd 40%, transparent 70%)`,
        boxShadow: `0 0 80px ${phase.sun}, 0 0 160px ${phase.sun}55`,
        opacity: phase.id === "night" ? 0.85 : 0.9,
        transition: "top 1s ease-out, background 1s",
      }}/>

      {/* Cloud layer */}
      <CloudLayer phaseId={phase.id} />

      {/* Distant mountains */}
      <svg viewBox="0 0 1200 200" preserveAspectRatio="none" style={{
        position:"absolute", bottom: "18%", left:0, width:"100%", height:"25%",
        opacity: 0.55,
      }}>
        <path d="M0 200 L0 130 L80 80 L160 110 L240 70 L340 100 L420 60 L520 90 L620 50 L720 95 L820 70 L920 105 L1020 75 L1100 100 L1200 85 L1200 200 Z"
              fill={phase.horizon} />
      </svg>
      <svg viewBox="0 0 1200 200" preserveAspectRatio="none" style={{
        position:"absolute", bottom: "14%", left:0, width:"100%", height:"22%",
        opacity: 0.8,
      }}>
        <path d="M0 200 L0 150 L100 110 L200 140 L300 100 L420 140 L540 90 L680 135 L820 100 L960 140 L1100 110 L1200 130 L1200 200 Z"
              fill={phase.horizon} style={{filter:"brightness(0.7)"}}/>
      </svg>

      {/* Ground / grass */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, height:"18%",
        background: `linear-gradient(to bottom, ${phase.horizon}dd, ${phase.horizon})`,
      }}/>
      <svg viewBox="0 0 1200 60" preserveAspectRatio="none" style={{
        position:"absolute", bottom:"18%", left:0, width:"100%", height:"8%", opacity:0.9
      }}>
        <path d="M0 60 Q 30 20, 60 40 T 120 30 T 180 45 T 240 25 T 300 40 T 360 30 T 420 50 T 480 30 T 540 40 T 600 25 T 660 45 T 720 30 T 780 40 T 840 25 T 900 45 T 960 35 T 1020 40 T 1080 30 T 1140 45 T 1200 35 L 1200 60 Z"
              fill={phase.horizon}/>
      </svg>
    </div>
  );
}

function CloudLayer({ phaseId }) {
  const clouds = uM(() => Array.from({length: 5}).map((_,i) => ({
    i, top: 10 + i*8 + Math.random()*10,
    dur: 60 + Math.random()*40,
    delay: -Math.random()*60,
    scale: 0.7 + Math.random()*0.6,
    opacity: 0.3 + Math.random()*0.3,
  })), []);
  const cloudColor = phaseId === "night" ? "#2a2a3a" : phaseId === "dusk" ? "#d89070" : "#fdfaf0";
  return (
    <div style={{position:"absolute", inset:0, pointerEvents:"none"}}>
      {clouds.map(c => (
        <div key={c.i} style={{
          position:"absolute", top:`${c.top}%`, left:"-200px",
          transform: `scale(${c.scale})`,
          opacity: c.opacity,
          animation: `cloud-drift ${c.dur}s linear infinite`,
          animationDelay: `${c.delay}s`,
        }}>
          <svg width="200" height="60" viewBox="0 0 200 60">
            <ellipse cx="40" cy="35" rx="35" ry="18" fill={cloudColor}/>
            <ellipse cx="80" cy="28" rx="40" ry="22" fill={cloudColor}/>
            <ellipse cx="130" cy="32" rx="38" ry="20" fill={cloudColor}/>
            <ellipse cx="165" cy="38" rx="28" ry="15" fill={cloudColor}/>
          </svg>
        </div>
      ))}
    </div>
  );
}

window.Sky = Sky;
