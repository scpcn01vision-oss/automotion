// === ???? ===
// DURATION: 180???????????? DURATION ?????
// ??: ??? G ???src/_fixtures/Fixtures.tsx????? G.ink / ?? G.bg / ?? G.accent
// ??: ??,??
// props: rows?? A ??????+??+?????2?5 ???detail?? B ???????+???????/???
// === ???? ===
// ????????: ???????
// ???????: ???????????????
// === ???? ===
// ? DURATION ?????? interpolate ??????????????????
// ???????(match-cut ? iris-reveal ??)??? video-shotcraft demo ?????????? + ????
// ? A??????????? left ????????????256???? 2?5 ???
// ? 0?30:? 2 ?????????? + ??????"???";
// ? 30?75:? B ? clip-path: circle(r at CX CY) ? 22px ??? 2100px(Easing.inOut(cubic)),
//   ? B ????????,??????? 22px ?? 170px???????????"??"????;
// ? 45?100:???? sweep ? 78%,???????????,?? detail ??;? 100?140 ?????(?35f)?
// ??:??????????CX/CY ????????? 2 ????????? 2?5 ???
import React from 'react';
import { useCurrentFrame, interpolate, Easing, Img, staticFile } from 'remotion';
import { G } from '../../_fixtures/Fixtures';
import { FONT_STACK } from '../../_system/typography';
import type { SceneContentData } from '../../_system/scene-content';

// ? A ???????????????? left ????????????220+36=256??
// ???????????? 220????? 1884 ? 1664???? padding 28????? 22
const PAD_T = 36; // ????? padding
const ROWS_LEFT = 256; // ?? left???? 220 + ??? padding 36????????
const ROW_PAD = 28;
const ICON_HALF = 22;
const ROW_GAP = 20;
const CONTENT_TOP = PAD_T;
const CONTENT_H = 1080 - PAD_T * 2;

export interface CircleRow {
  icon?: string;
  title?: string;
  value?: string;
}

export interface CircleMatchIrisProps {
  rows?: CircleRow[]; // ? A ????2?5 ??
  detail?: SceneContentData; // ? B ??????? + ????????????
}

// ? A????????????????+??+?????
const ListPanel: React.FC<{ rows: CircleRow[]; n: number; rowH: number }> = ({ rows, n, rowH }) => (
  <div style={{ width: 1920, height: 1080, background: G.bg, display: 'flex' }}>
    <div style={{ flex: 1, padding: '36px 256px 36px 256px', display: 'flex', flexDirection: 'column', gap: ROW_GAP, boxSizing: 'border-box' }}>
      {Array.from({ length: n }).map((_, i) => {
        const r = rows[i] ?? {};
        return (
          <div key={i} style={{ height: rowH, background: G.card, border: `2px solid ${G.border}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 24, padding: `0 ${ROW_PAD}px`, boxSizing: 'border-box' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: G.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: G.card }}>{r.icon ?? '?'}</div>
            <div style={{ fontFamily: FONT_STACK, fontSize: 26, fontWeight: 600, color: G.ink }}>{r.title ?? ''}</div>
            <div style={{ marginLeft: 'auto', fontFamily: FONT_STACK, fontSize: 24, fontWeight: 700, color: G.accent }}>{r.value ?? ''}</div>
          </div>
        );
      })}
    </div>
  </div>
);

// ? B ??????? + ?????????????????????
const DetailBlock: React.FC<{ content: SceneContentData }> = ({ content }) => {
  const { title, type = 'rows', rows, image } = content;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40, boxSizing: 'border-box', overflow: 'hidden' }}>
      {title ? (
        <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 46, color: G.card, letterSpacing: -1 }}>{title}</div>
      ) : null}
      {type === 'image' && image ? (
        <Img src={staticFile(image)} style={{ width: 760, aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 20, border: `2px solid ${G.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.35)', maxWidth: '90%' }} />
      ) : (
        <div style={{ width: 760, maxWidth: '90%', background: G.card, border: `2px solid ${G.border}`, borderRadius: 20, padding: '30px 42px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          {(rows ?? []).map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px 0', borderBottom: i < (rows ?? []).length - 1 ? `1px solid ${G.line}` : 'none' }}>
              <span style={{ fontFamily: FONT_STACK, fontSize: 26, color: G.ink, fontWeight: 600 }}>{r.label}</span>
              <span style={{ marginLeft: 'auto', fontFamily: FONT_STACK, fontSize: 28, color: G.accent, fontWeight: 800 }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const CircleMatchIris: React.FC<CircleMatchIrisProps> = ({
  rows = [
    { icon: '?', title: '???', value: '+18%' },
    { icon: '?', title: '???', value: '2.1?' },
    { icon: '?', title: '???', value: '96.4%' },
    { icon: '?', title: '???', value: '42ms' },
    { icon: '?', title: '???', value: '99.98%' },
  ],
  detail = {
    title: '????',
    type: 'rows',
    rows: [
      { label: '???', value: '+18%' },
      { label: '???', value: '2.1?' },
      { label: '???', value: '96.4%' },
    ],
  },
}) => {
  const f = useCurrentFrame();

  // ?? 2?5 ????? = ? 2 ????????????????
  const n = Math.min(5, Math.max(2, rows.length));
  const ROW_H = (CONTENT_H - (n - 1) * ROW_GAP) / n;
  const CX = ROWS_LEFT + ROW_PAD + ICON_HALF; // 306
  const CY = CONTENT_TOP + ROW_H + ROW_GAP + ROW_H / 2; // ? 2 ???
  const anchorIcon = rows[1]?.icon ?? '?';

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
      <ListPanel rows={rows.slice(0, n)} n={n} rowH={ROW_H} />
      {/* ???????????????,????????? */}
      <div style={{ position: 'absolute', left: CX - 23, top: CY - 23, width: 46, height: 46, background: G.card }} />
      <div style={{
        position: 'absolute', left: CX - 22, top: CY - 22, width: 44, height: 44,
        borderRadius: 22, background: G.mid, border: `3px solid ${G.ink}`,
        boxSizing: 'border-box', transform: `scale(${scale})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 800, color: G.card,
      }}>
        {anchorIcon}
      </div>
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
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: numOpacity,
          }}>
            <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 96, color: G.card, letterSpacing: -2 }}>
              {num}%
            </div>
          </div>
          {/* ??????? + ????????????????? */}
          <div style={{ position: 'absolute', left: 620, top: 200, width: 880, height: 720, opacity: furnitureOpacity }}>
            <DetailBlock content={detail} />
          </div>
        </div>
      )}
    </div>
  );
};
