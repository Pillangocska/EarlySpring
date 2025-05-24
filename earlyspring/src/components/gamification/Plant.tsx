// src/components/gamification/Plant.tsx

import React, { useMemo, useState, useRef, useEffect, MouseEvent, TouchEvent } from 'react';

interface PlantProps {
  health: number;
  level: number;
}

interface Point {
  x: number;
  y: number;
}

interface Branch {
  points: Point[]; // Points defining the polygon for the branch segment
  level: number;   // Depth level of the branch
}

interface Leaf {
  x: number;
  y: number;
  size: number;
  rotation: number;
}

// --- Helper Functions ---
const subtractPoints = (p1: Point, p2: Point): Point => ({ x: p1.x - p2.x, y: p1.y - p2.y });
const addPoints = (p1: Point, p2: Point): Point => ({ x: p1.x + p2.x, y: p1.y + p2.y });
const scalePoint = (p: Point, s: number): Point => ({ x: p.x * s, y: p.y * s });
const normalizePoint = (p: Point): Point => {
  const len = Math.sqrt(p.x * p.x + p.y * p.y);
  if (len < 1e-9) return { x: 0, y: 0 }; // Avoid division by zero for very small vectors
  return { x: p.x / len, y: p.y / len };
};
const getPerpendicularVector = (p: Point): Point => ({ x: -p.y, y: p.x }); // Rotates +90 deg from p
const dotProduct = (p1: Point, p2: Point): number => p1.x * p2.x + p1.y * p2.y;
const lerpNumber = (a: number, b: number, t: number): number => a * (1 - t) + b * t;
const getQuadraticBezierPoint = (t: number, p0: Point, p1: Point, p2: Point): Point => {
  const mt = 1 - t;
  const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
  const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
  return { x, y };
};

interface MiterResult { normal: Point; scale: number; }
const calculateMiter = (dirIn: Point, dirOut: Point): MiterResult => {
  const perpIn = getPerpendicularVector(dirIn);
  const perpOut = getPerpendicularVector(dirOut);
  let avgPerp = normalizePoint(addPoints(perpIn, perpOut));
  let scale = 1.0;

  if (avgPerp.x === 0 && avgPerp.y === 0) { // Perps were opposite (e.g. 180 deg turn in centerline)
    avgPerp = perpIn; // Fallback to one of the perps (creates a "bevel" like join)
  } else {
    const cosHalfAngle = dotProduct(avgPerp, perpIn); // Cos of angle between miter and segment normal
    if (Math.abs(cosHalfAngle) > 1e-4) {
      scale = 1.0 / cosHalfAngle;
    } else {
      scale = 1.0 / (1e-4 * Math.sign(cosHalfAngle || 1)); // Max scale based on tiny angle
    }
    // Clamp miter scale to prevent extreme spikes, ensure positive
    scale = Math.max(1.0, Math.min(3.5, Math.abs(scale)));
  }
  return { normal: avgPerp, scale };
};


const Plant: React.FC<PlantProps> = ({ health, level }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchDuration, setTouchDuration] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const clampedLevel = useMemo(() => Math.max(1, Math.min(6, level)), [level]);

  const plantColors = useMemo(() => {
    let foliageColor: string;
    const trunkColor = '#8B4513'; // SaddleBrown

    const potGradients = [
      { main: ['#1F2937', '#111827'], accent: '#3B82F6', highlight: 'rgba(59, 130, 246, 0.5)' },
      { main: ['#1F2937', '#111827'], accent: '#10B981', highlight: 'rgba(16, 185, 129, 0.5)' },
      { main: ['#1F2937', '#111827'], accent: '#8B5CF6', highlight: 'rgba(139, 92, 246, 0.5)' }
    ];
    const potStyle = potGradients[1]; // Green accent

    // Adjusted foliage colors for better contrast with glow
    if (health < 25) foliageColor = '#A16207'; // Darker yellow-brown for withering
    else if (health < 50) foliageColor = '#CA8A04'; // Yellow-brown
    else if (health > 75) foliageColor = '#16A34A'; // Darker, richer green for thriving
    else foliageColor = '#22C55E'; // Healthy green

    return { foliageColor, trunkColor, potStyle };
  }, [health]);

  const { branches, leaves } = useMemo(() => {
    const localBranches: Branch[] = [];
    const localLeaves: Leaf[] = [];

    const startX = 150;
    const startY = 250; // Trunk base starts lower in the pot
    const initialAngle = -Math.PI / 2;

    const initialTrunkBaseThickness = 25 + clampedLevel * 3.0;
    const segmentTaperFactor = 0.6;
    const childBranchStartScaleFactor = 0.9;
    const branchLength = 3 + clampedLevel * 10;
    const branchFactor = 0.65 + clampedLevel * 0.02;
    const angleDelta = Math.PI / 6 - (clampedLevel * 0.01);
    const maxDepth = 1 + clampedLevel;
    const minBranchThickness = 0.3;

    const trunkCurveFactor = 0.35;
    const branchCurveFactor = 0.2;
    const curveSubdivisions = 5;
    const minCurveLength = 10.0; // Minimum length for a branch to attempt curving

    const generateBranch = (
      currentStartPoint: Point,
      angle: number,
      length: number,
      segmentOverallStartThickness: number,
      depth: number,
      parentEndDirection?: Point // Normalized direction of parent segment at join
    ) => {
      if (depth > maxDepth || segmentOverallStartThickness < minBranchThickness) return;

      const targetEndPoint = {
        x: currentStartPoint.x + Math.cos(angle) * length,
        y: currentStartPoint.y + Math.sin(angle) * length,
      };
      const segmentOverallEndThickness = Math.max(minBranchThickness, segmentOverallStartThickness * segmentTaperFactor);

      const actualCurveFactor = depth === 0 ? trunkCurveFactor : branchCurveFactor;
      const shouldCurve = length >= minCurveLength && actualCurveFactor > 0 && curveSubdivisions > 0;

      let ownEndingDirection: Point; // To be passed to children

      if (shouldCurve) {
        const curvePoints: Point[] = [];
        const thicknessAtPoints: number[] = [];
        const midPoint = { x: (currentStartPoint.x + targetEndPoint.x) / 2, y: (currentStartPoint.y + targetEndPoint.y) / 2 };
        const d = subtractPoints(targetEndPoint, currentStartPoint);
        const perpOffset = getPerpendicularVector(d);
        const curveDirection = (depth === 0) ? ((clampedLevel % 2 === 0) ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1);
        const controlPoint = addPoints(midPoint, scalePoint(normalizePoint(perpOffset), length * actualCurveFactor * curveDirection));

        for (let i = 0; i <= curveSubdivisions; i++) {
          const t = i / curveSubdivisions;
          curvePoints.push(getQuadraticBezierPoint(t, currentStartPoint, controlPoint, targetEndPoint));
          thicknessAtPoints.push(lerpNumber(segmentOverallStartThickness, segmentOverallEndThickness, t));
        }
        ownEndingDirection = normalizePoint(subtractPoints(curvePoints[curveSubdivisions], curvePoints[curveSubdivisions - 1]));

        const miterNormals: Point[] = new Array(curveSubdivisions + 1);
        const miterScales: number[] = new Array(curveSubdivisions + 1).fill(1.0);

        for (let i = 0; i <= curveSubdivisions; i++) {
          if (i === 0) { // Start of the segment
            const dirOut = normalizePoint(subtractPoints(curvePoints[1], curvePoints[0]));
            if (parentEndDirection) { // If has a parent, miter with parent's end
              const miterResult = calculateMiter(parentEndDirection, dirOut);
              miterNormals[i] = miterResult.normal;
              miterScales[i] = miterResult.scale;
            } else { // Start of the very first trunk segment
              miterNormals[i] = getPerpendicularVector(dirOut);
            }
          } else if (i === curveSubdivisions) { // End of the segment (cap)
            const dirIn = normalizePoint(subtractPoints(curvePoints[i], curvePoints[i - 1]));
            miterNormals[i] = getPerpendicularVector(dirIn); // Simple perpendicular cap
          } else { // Mid-points of the curve
            const dirIn = normalizePoint(subtractPoints(curvePoints[i], curvePoints[i - 1]));
            const dirOut = normalizePoint(subtractPoints(curvePoints[i + 1], curvePoints[i]));
            const miterResult = calculateMiter(dirIn, dirOut);
            miterNormals[i] = miterResult.normal;
            miterScales[i] = miterResult.scale;
          }
        }

        const leftEdgePoints: Point[] = [];
        const rightEdgePoints: Point[] = [];
        for (let i = 0; i <= curveSubdivisions; i++) {
          const halfThickness = thicknessAtPoints[i] / 2;
          const scaledNormal = scalePoint(miterNormals[i], halfThickness * miterScales[i]);
          leftEdgePoints.push(addPoints(curvePoints[i], scaledNormal));
          rightEdgePoints.push(subtractPoints(curvePoints[i], scaledNormal));
        }

        for (let i = 0; i < curveSubdivisions; i++) {
          localBranches.push({
            points: [leftEdgePoints[i], rightEdgePoints[i], rightEdgePoints[i+1], leftEdgePoints[i+1]],
            level: depth
          });
        }
      } else { // Straight segment
        ownEndingDirection = normalizePoint(subtractPoints(targetEndPoint, currentStartPoint));
        let startPerp: Point, startScale = 1.0;

        if (parentEndDirection) { // Miter with parent
          const miterResult = calculateMiter(parentEndDirection, ownEndingDirection);
          startPerp = miterResult.normal;
          startScale = miterResult.scale;
        } else { // Start of trunk
          startPerp = getPerpendicularVector(ownEndingDirection);
        }
        const endPerp = getPerpendicularVector(ownEndingDirection); // End cap is always perpendicular

        const p1 = addPoints(currentStartPoint, scalePoint(startPerp, segmentOverallStartThickness / 2 * startScale));
        const p2 = subtractPoints(currentStartPoint, scalePoint(startPerp, segmentOverallStartThickness / 2 * startScale));
        const p3 = subtractPoints(targetEndPoint, scalePoint(endPerp, segmentOverallEndThickness / 2));
        const p4 = addPoints(targetEndPoint, scalePoint(endPerp, segmentOverallEndThickness / 2));
        localBranches.push({ points: [p1, p2, p3, p4], level: depth });
      }

      // Leaf Generation
      if (depth === maxDepth || (depth >= maxDepth - 1 && Math.random() > 0.3)) {
        const leafSizeFactor = health > 75 ? 1.2 : health > 50 ? 1 : health > 25 ? 0.8 : 0.6;
        localLeaves.push({ x: targetEndPoint.x, y: targetEndPoint.y, size: 5 * leafSizeFactor, rotation: Math.random() * Math.PI * 2 });
        if (health > 50) {
          localLeaves.push({
            x: targetEndPoint.x + (Math.random() * 6 - 3), y: targetEndPoint.y + (Math.random() * 6 - 3),
            size: 4 * leafSizeFactor, rotation: Math.random() * Math.PI * 2
          });
        }
      }

      if (health < 25 && Math.random() > 0.7 && depth < maxDepth) return;

      // Recursive Branching
      const newLength = length * branchFactor;
      const childBaseStartThickness = Math.max(minBranchThickness, segmentOverallEndThickness * childBranchStartScaleFactor);
      const rightAngle = angle + angleDelta * (0.8 + Math.random() * 0.4);
      const leftAngle = angle - angleDelta * (0.8 + Math.random() * 0.4);

      generateBranch(targetEndPoint, rightAngle, newLength, childBaseStartThickness, depth + 1, ownEndingDirection);
      generateBranch(targetEndPoint, leftAngle, newLength, childBaseStartThickness, depth + 1, ownEndingDirection);
      if (depth < maxDepth - 1 && Math.random() > 0.7) {
        const midAngle = angle + (Math.random() * 0.2 - 0.1);
        const midBranchStartThickness = Math.max(minBranchThickness, childBaseStartThickness * 0.9);
        generateBranch(targetEndPoint, midAngle, newLength * 0.8, midBranchStartThickness, depth + 1, ownEndingDirection);
      }
    };

    generateBranch({ x: startX, y: startY }, initialAngle, branchLength, initialTrunkBaseThickness, 0, undefined);
    return { branches: localBranches, leaves: localLeaves };
  }, [clampedLevel, health]);

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY });
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowTooltip(true);
      setTimeout(() => setTooltipVisible(true), 50);
    }, 2000);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (showTooltip) {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setTooltipVisible(false);
    setTimeout(() => setShowTooltip(false), 300);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setIsMobile(true);
    const touch = e.touches[0];
    setTooltipPosition({ x: touch.clientX, y: touch.clientY });
    if (touchTimerRef.current) clearInterval(touchTimerRef.current);
    setTouchDuration(0);
    touchTimerRef.current = setInterval(() => {
      setTouchDuration(prev => prev + 100);
    }, 100);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearInterval(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    if (touchDuration >= 1000) {
      setShowTooltip(true);
      setTimeout(() => setTooltipVisible(true), 50);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = setTimeout(() => {
        setTooltipVisible(false);
        setTimeout(() => setShowTooltip(false), 300);
      }, 4000);
    }
    setTouchDuration(0);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (touchTimerRef.current) {
      const touch = e.touches[0];
      setTooltipPosition({ x: touch.clientX, y: touch.clientY });
    }
  };

  const getHealthStatus = () => {
    if (health > 75) return "Thriving";
    if (health > 50) return "Healthy";
    if (health > 25) return "Needs Care";
    return "Withering";
  };

  const getLevelDescription = () => {
    switch (clampedLevel) {
      case 1: return "Seedling";
      case 2: return "Sprout";
      case 3: return "Young Plant";
      case 4: return "Growing Tree";
      case 5: return "Mature Tree";
      case 6: return "Ancient Tree";
      default: return "Plant";
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    return false;
  };

  const getRelativeTooltipPosition = (): React.CSSProperties => {
    if (!tooltipRef.current || !tooltipRef.current.parentElement) {
        return { position: 'absolute', left: '0px', top: '0px', visibility: 'hidden' };
    }
    const parentElement = tooltipRef.current.parentElement;
    const containerRect = parentElement.getBoundingClientRect();
    const tooltipWidth = tooltipRef.current.offsetWidth || 256;
    const tooltipHeight = tooltipRef.current.offsetHeight || 170;
    let idealX = tooltipPosition.x - containerRect.left;
    let idealY = tooltipPosition.y - containerRect.top;
    const offsetX = 15; const offsetY = 15;
    idealX += offsetX; idealY += offsetY;
    idealX = Math.max(5, Math.min(idealX, containerRect.width - tooltipWidth - 5));
    idealY = Math.max(5, Math.min(idealY, containerRect.height - tooltipHeight - 5));
    return { position: 'absolute', left: `${idealX}px`, top: `${idealY}px` };
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (touchTimerRef.current) clearInterval(touchTimerRef.current);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);


  return (
    <div
      className="plant-container relative w-80 h-64 flex items-center justify-center cursor-pointer overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={handleContextMenu}
    >
      <svg viewBox="0 0 300 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="potGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={plantColors.potStyle.main[0]} />
            <stop offset="100%" stopColor={plantColors.potStyle.main[1]} />
          </linearGradient>
          <filter id="potGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="foliageGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation={health > 75 ? "1.8" : "0.8"} result="blur" /> {/* Adjusted stdDeviation */}
            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
            <feFlood floodColor={plantColors.foliageColor} floodOpacity={health > 75 ? "0.6" : "0.4"} result="glowColor" /> {/* Adjusted opacity */}
            <feComposite in="glowColor" in2="offsetBlur" operator="in" result="coloredGlow" />
            <feMerge>
              <feMergeNode in="coloredGlow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="trunkShade" x="-30%" y="-30%" width="160%" height="160%"> {/* Increased filter area slightly */}
            <feDropShadow dx="0.6" dy="0.6" stdDeviation="0.6" floodColor="#000000" floodOpacity="0.18" result="shadowPart" /> {/* Softer, darker shadow */}
            <feDropShadow dx="-0.4" dy="-0.4" stdDeviation="0.5" floodColor="#FFFFFF" floodOpacity="0.08" result="highlightPart"/> {/* Fainter highlight */}
             <feMerge>
                <feMergeNode in="shadowPart"/>
                <feMergeNode in="highlightPart"/>
                <feMergeNode in="SourceGraphic"/> {/* Ensure source is on top of these subtle effects */}
            </feMerge>
          </filter>
        </defs>

        <g filter={clampedLevel > 1 && health > 25 ? "url(#trunkShade)" : ""}> {/* Added health condition for trunkShade */}
          {branches.map((branch, index) => (
            <polygon
              key={`branch-${index}`}
              points={branch.points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
              fill={plantColors.trunkColor}
              className={health < 25 ? 'opacity-70' : ''}
            />
          ))}
        </g>

        <g filter={health > 40 ? "url(#foliageGlow)" : ""}> {/* Adjusted health threshold for foliageGlow */}
          {leaves.map((leaf, index) => (
            <g
              key={`leaf-${index}`}
              transform={`translate(${leaf.x.toFixed(2)}, ${leaf.y.toFixed(2)}) rotate(${leaf.rotation * (180 / Math.PI)})`}
              className={health > 75 ? 'animate-pulse-slow' : ''}
            >
              <ellipse
                cx="0"
                cy="0"
                rx={leaf.size * 1.5}
                ry={leaf.size}
                fill={plantColors.foliageColor}
                opacity={health < 25 ? 0.7 : health < 50 ? 0.85 : 1}
              />
            </g>
          ))}
        </g>

        <ellipse cx="150" cy="282" rx="55" ry="8" fill="rgba(0,0,0,0.2)" filter="blur(2px)" />

        <g className="pot" filter="url(#potGlow)">
          <path
            d="M105 242 C105 242, 110 240, 150 240 C190 240, 195 242, 195 242 L205 280 C205 285, 200 287, 150 287 C100 287, 95 285, 95 280 Z"
            fill="url(#potGradient)"
          />
          <path
            d="M105 242 C105 242, 110 240, 150 240 C190 240, 195 242, 195 242 L190 248 C190 248, 170 246, 150 246 C130 246, 110 248, 110 248 Z"
            fill={plantColors.potStyle.accent} opacity="0.9"
          />
          <path
            d="M110 260 C110 260, 130 258, 150 258 C170 258, 190 260, 190 260"
            stroke={plantColors.potStyle.accent} strokeWidth="1" fill="none" opacity="0.5"
          />
          <path
            d="M115 250 Q125 252, 130 270 Q132 280, 135 282"
            stroke={plantColors.potStyle.highlight} strokeWidth="3" fill="none" opacity="0.3" strokeLinecap="round"
          />
        </g>

        {isMobile && touchDuration > 0 && touchDuration < 1000 && (
          <circle
            cx={tooltipPosition.x - (tooltipRef.current?.parentElement?.getBoundingClientRect().left || 0) }
            cy={tooltipPosition.y - (tooltipRef.current?.parentElement?.getBoundingClientRect().top || 0) }
            r={10 + (touchDuration / 1000 * 30)}
            fill="rgba(255,255,255,0.1)"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeOpacity={Math.max(0, 0.5 - (touchDuration/2000))}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`absolute w-64 rounded-lg bg-gray-800 border border-gray-700 p-3 shadow-lg z-20 transition-all duration-300
            ${tooltipVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
          style={getRelativeTooltipPosition()}
        >
          <div className="relative">
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">Plant Status</span>
                <div className="flex items-center px-2 py-0.5 rounded-full bg-gray-700">
                  <span className="text-sm font-bold text-blue-300">Level {clampedLevel}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-2">{getLevelDescription()}</p>
              <div className="mb-1 flex justify-between items-center">
                <span className="text-sm text-gray-300">Health</span>
                <span className="text-sm font-medium" style={{
                  color: health > 75 ? '#22C55E' : health > 50 ? '#4ADE80' : health > 25 ? '#EAB308' : '#EF4444'
                }}>
                  {getHealthStatus()}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${health}%`,
                    backgroundColor: health > 75 ? '#22C55E' :
                                    health > 50 ? '#4ADE80' :
                                    health > 25 ? '#EAB308' :
                                    '#EF4444'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plant;
