import styles from './Botanical.module.css';

type BotanicalProps = {
  variant?: 'rise' | 'drape';
  className?: string;
  mirrored?: boolean;
};

type Point = { x: number; y: number };

// Stem curves in a 400 x 800 box. "rise" grows upward from the bottom edge,
// "drape" hangs down from the top edge.
const stems: Record<NonNullable<BotanicalProps['variant']>, [Point, Point, Point, Point]> = {
  rise: [
    { x: 200, y: 800 },
    { x: 90, y: 600 },
    { x: 310, y: 380 },
    { x: 190, y: 30 },
  ],
  drape: [
    { x: 60, y: -20 },
    { x: 260, y: 120 },
    { x: 60, y: 380 },
    { x: 300, y: 560 },
  ],
};

function cubicPoint([p0, p1, p2, p3]: [Point, Point, Point, Point], t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

// Tangent angle in degrees, used to orient leaves along the stem.
function cubicAngle(curve: [Point, Point, Point, Point], t: number): number {
  const before = cubicPoint(curve, Math.max(0, t - 0.01));
  const after = cubicPoint(curve, Math.min(1, t + 0.01));
  return (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI;
}

function leafPath(length: number): string {
  const width = length * 0.3;
  return `M0 0 C${length * 0.3} ${-width}, ${length * 0.7} ${-width}, ${length} 0 C${length * 0.7} ${width}, ${length * 0.3} ${width}, 0 0 Z`;
}

// Deterministic composition: leaves alternate sides and shrink toward the tip.
// Buds are placed on selected leaves to add a warm accent.
export function Botanical({ variant = 'rise', className, mirrored = false }: BotanicalProps) {
  const curve = stems[variant];
  const leafCount = 14;
  const leaves = [];
  const buds: Point[] = [];

  for (let index = 1; index <= leafCount; index += 1) {
    const t = index / (leafCount + 1);
    const point = cubicPoint(curve, t);
    const tangent = cubicAngle(curve, t);
    const side = index % 2 === 0 ? 1 : -1;
    const length = 118 - 62 * t;
    const angle = tangent + side * (48 + (index % 3) * 6);

    leaves.push(
      <path
        key={`leaf-${index}`}
        d={leafPath(length)}
        transform={`translate(${point.x.toFixed(1)} ${point.y.toFixed(1)}) rotate(${angle.toFixed(1)})`}
        fill="currentColor"
      />,
    );

    if (index % 4 === 0) {
      buds.push(cubicPoint(curve, Math.min(1, t + 0.02)));
    }
  }

  const [p0, p1, p2, p3] = curve;

  return (
    <svg
      className={[styles.botanical, mirrored ? styles.mirrored : '', className].filter(Boolean).join(' ')}
      viewBox="0 0 400 800"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={`M${p0.x} ${p0.y} C${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {leaves}
      {buds.map((bud, index) => (
        <circle
          key={`bud-${index}`}
          cx={bud.x}
          cy={bud.y}
          r="7"
          className={styles.bud}
        />
      ))}
    </svg>
  );
}
