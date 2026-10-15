/** Flat SVG version of the process flow, shown behind the content when WebGL is unavailable. */
export default function StaticDiagram() {
  const nodes = [
    { x: 120, y: 520 },
    { x: 420, y: 430 },
    { x: 720, y: 500 },
    { x: 1020, y: 400 },
    { x: 1320, y: 450 },
  ];
  const path = `M -40 600 C 60 560, 80 530, ${nodes[0].x} ${nodes[0].y} S 320 420, ${nodes[1].x} ${nodes[1].y} S 640 520, ${nodes[2].x} ${nodes[2].y} S 940 390, ${nodes[3].x} ${nodes[3].y} S 1240 470, ${nodes[4].x} ${nodes[4].y} S 1500 430, 1560 420`;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-60">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <path d={path} fill="none" stroke="#5ce1e6" strokeOpacity="0.55" strokeWidth="3" />
        <path d={path} fill="none" stroke="#ffb547" strokeWidth="3" strokeDasharray="6 60" />
        {nodes.map((n, i) => (
          <g key={i} transform={`translate(${n.x} ${n.y})`}>
            <circle r="26" fill="none" stroke="#5ce1e6" strokeOpacity="0.7" strokeWidth="2" />
            <rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" fill="#5ce1e6" />
            <text y="-42" textAnchor="middle" fill="#7f93b2" fontFamily="monospace" fontSize="14">
              {i < 4 ? `node 0${i + 1}` : "output"}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
