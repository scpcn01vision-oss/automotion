// === ???? ===
// DURATION: 180???????????? DURATION ?????
// ??: ??? G ???src/_fixtures/Fixtures.tsx????? G.ink / ?? G.bg / ?? G.accent
// ??: ??,??
// props: ???????????? video-shotcraft ?????????????
// === ???? ===
// ????????: ???????
// ???????: ???????????????
// === ???? ===
// ? DURATION ?????? interpolate ??????????????????
// ???????(match-cut ? iris-reveal ??)??? video-shotcraft demo ?????????????
// ? 0?30:? A(????)hold,? 2 ? 44px ????????? + ??????"???";
// ? 30?75:? B ? clip-path: circle(r at CX CY) ? 22px ??? 2100px(Easing.inOut(cubic)),
//   ? B ????????,??????? 22px ?? 170px???????????"??"????;
// ? 45?100:???? sweep ? 78%,???????????;? 100?140 ???????(?35f)?
// ??:??????????CX/CY ???? A ??? 2 ???????????
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';

// ? A ??? 2 ??? 44px ????????????????? FakeDashboard B?
const CX = 308;
const CY = 384.8;

// ? A??????????? FakeDashboard B??? G ????????
const ListPanel: React.FC = () => (
  <div style={{ width: 1920, height: 1080, background: G.bg, display: 'flex' }}>
    <div style={{ width: 220, background: G.side, padding: '28px 22px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: G.sideBar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: G.side }}>?</div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} style={{ height: 12, width: `${60 + ((i * 29) % 35)}%`, background: G.sideBar, borderRadius: 6 }} />
      ))}
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 72, background: G.panel, borderBottom: `2px solid ${G.line}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 20, boxSizing: 'border-box' }}>
        <div style={{ height: 18, width: 180, background: G.bar, borderRadius: 9 }} />
        <div style={{ marginLeft: 'auto', height: 36, width: 320, background: G.card, border: `2px solid ${G.line}`, borderRadius: 18, boxSizing: 'border-box' }} />
        <div style={{ width: 36, height: 36, borderRadius: 18, background: G.mid }} />
      </div>
      <div style={{ flex: 1, padding: 36, display: 'flex', flexDirection: 'column', gap: 20, boxSizing: 'border-box' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ flex: 1, background: G.card, border: `2px solid ${G.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 24, padding: '0 28px', boxSizing: 'border-box' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: G.mid }} />
            <div style={{ height: 14, width: `${30 + ((i * 23) % 25)}%`, background: G.bar, borderRadius: 7 }} />
            <div style={{ marginLeft: 'auto', height: 12, width: 120, background: G.line, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export interface CircleMatchIrisProps {
}

export const CircleMatchIris: React.FC<CircleMatchIrisProps> = () => {
  const f = useCurrentFrame();

  // ---- ? A:????(? 0?30,????) ----
  const pulseT = Math.min(f, 30) / 30;
  const scale = f < 30 ? 1 + 0.45 * Math.abs(Math.sin(pulseT * Math.PI * 2)) : 1;
  // ??????
  const waves = [0, 14].map((start) => {
    const p = interpolate(f, [start, start + 16], [0, 1], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
    return { r: 22 + p * 40, o: f < start + 16 ? 0.85 * (1 - p) : 0 };
  });

  // ---- ??:? B ??????? ----
  const irisR = interpolate(f, [30, 75], [22, 2100], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  // ---- ? B ??:??? 22 ?? 170,"??"???? ----
  const ringR = interpolate(f, [30, 70], [22, 170], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const ringW = interpolate(f, [30, 70], [12, 40], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  // ?? sweep ? 78%
  const sweep = interpolate(f, [45, 100], [0, 0.78], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const circ = 2 * Math.PI * ringR;
  const num = Math.round(sweep * 100);
  const numOpacity = interpolate(f, [68, 88], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });
  const furnitureOpacity = interpolate(f, [60, 85], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative', overflow: 'hidden', background: G.bg }}>
      {/* ===== ? A:???? ===== */}
      <ListPanel />
      {/* ???????????????,????????? */}
      <div style={{ position: 'absolute', left: CX - 23, top: CY - 23, width: 46, height: 46, background: G.card }} />
      <div style={{
        position: 'absolute', left: CX - 22, top: CY - 22, width: 44, height: 44,
        borderRadius: 22, background: G.mid, border: `3px solid ${G.ink}`,
        boxSizing: 'border-box', transform: `scale(${scale})`,
      }} />
      {/* ?????? */}
      <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
        {waves.map((w, i) => (
          <circle key={i} cx={CX} cy={CY} r={w.r} fill="none" stroke={G.ink} strokeWidth={4} opacity={w.o} />
        ))}
      </svg>

      {/* ===== ? B:???????,?????????? ===== */}
      {f >= 30 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, width: 1920, height: 1080,
          background: G.ink,
          clipPath: `circle(${irisR}px at ${CX}px ${CY}px)`,
        }}>
          {/* ?? donut:????????? */}
          <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
            {/* ?? */}
            <circle cx={CX} cy={CY} r={ringR} fill="none" stroke={G.sideBar} strokeWidth={ringW} />
            {/* sweep ?,????? */}
            <circle
              cx={CX} cy={CY} r={ringR} fill="none" stroke={G.bg}
              strokeWidth={ringW} strokeLinecap="round"
              strokeDasharray={`${sweep * circ} ${circ}`}
              transform={`rotate(-90 ${CX} ${CY})`}
            />
          </svg>
          {/* ????? */}
          <div style={{
            position: 'absolute', left: CX - 150, top: CY - 80, width: 300, height: 160,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            opacity: numOpacity,
          }}>
            <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 96, color: G.card, letterSpacing: -2 }}>
              {num}%
            </div>
            <div style={{ marginTop: 6, height: 12, width: 130, background: G.mid, borderRadius: 6 }} />
          </div>
          {/* ??????:?? + ???,??????? */}
          <div style={{ position: 'absolute', left: 680, top: 260, opacity: furnitureOpacity, display: 'flex', flexDirection: 'column', gap: 30 }}>
            <div style={{ height: 34, width: 520, background: G.bar, borderRadius: 10 }} />
            <div style={{ height: 16, width: 780, background: G.sideBar, borderRadius: 8 }} />
            <div style={{ height: 16, width: 640, background: G.sideBar, borderRadius: 8 }} />
            <div style={{ height: 16, width: 700, background: G.sideBar, borderRadius: 8 }} />
            <div style={{ display: 'flex', gap: 28, marginTop: 24 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 240, height: 150, background: G.side, border: `2px solid ${G.sideBar}`, borderRadius: 14, padding: 20, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ height: 12, width: `${55 + i * 12}%`, background: G.mid, borderRadius: 6 }} />
                  <div style={{ height: 30, width: '45%', background: G.bar, borderRadius: 8, marginTop: 'auto' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
