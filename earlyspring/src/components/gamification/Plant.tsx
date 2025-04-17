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
  start: Point;
  end: Point;
  thickness: number;
  level: number;
}

interface Leaf {
  x: number;
  y: number;
  size: number;
  rotation: number;
}

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

  // Clamp level between 1-6
  const clampedLevel = useMemo(() => Math.max(1, Math.min(6, level)), [level]);

  // Generate colors based on plant health
  const plantColors = useMemo(() => {
    let foliageColor: string;
    let trunkColor: string;
    const potColor = '#4B5563'; // gray-600
    const soilColor = '#92400E'; // yellow-800

    if (health < 25) {
      foliageColor = '#CA8A04'; // yellow-600
      trunkColor = '#854D0E';   // yellow-800
    } else if (health < 50) {
      foliageColor = '#FDE047'; // yellow-300
      trunkColor = '#A16207';   // yellow-700
    } else if (health > 75) {
      foliageColor = '#22C55E'; // green-500
      trunkColor = '#14532D';   // green-900
    } else {
      foliageColor = '#4ADE80'; // green-400
      trunkColor = '#166534';   // green-800
    }

    return { foliageColor, trunkColor, potColor, soilColor };
  }, [health]);

  // Generate tree structure using recursive algorithm
  const { branches, leaves } = useMemo(() => {
    const branches: Branch[] = [];
    const leaves: Leaf[] = [];

    // Starting point of the trunk
    const startX = 150;
    const startY = 240;
    const initialAngle = -Math.PI / 2; // Pointing up

    // Tree parameters based on level
    const branchLength = 3 + clampedLevel * 10;
    const initialThickness = 5 + clampedLevel * 0.5;
    const branchFactor = 0.65 + clampedLevel * 0.02;
    const angleDelta = Math.PI / 6 - (clampedLevel * 0.01);
    const maxDepth = 1 + clampedLevel; // Increase depth with level

    // Function to generate branches recursively
    const generateBranch = (
      startPoint: Point,
      angle: number,
      length: number,
      thickness: number,
      depth: number
    ) => {
      if (depth > maxDepth) return;

      // Calculate end point of the branch
      const endPoint = {
        x: startPoint.x + Math.cos(angle) * length,
        y: startPoint.y + Math.sin(angle) * length
      };

      // Add the branch
      branches.push({
        start: startPoint,
        end: endPoint,
        thickness,
        level: depth
      });

      // If we're at the max depth, add leaves
      if (depth === maxDepth || (depth >= maxDepth - 1 && Math.random() > 0.3)) {
        // Add some variation to leaf size based on health
        const leafSizeFactor = health > 75 ? 1.2 :
                              health > 50 ? 1 :
                              health > 25 ? 0.8 : 0.6;

        // Add leaves at the end of branches
        leaves.push({
          x: endPoint.x,
          y: endPoint.y,
          size: 5 * leafSizeFactor,
          rotation: Math.random() * Math.PI * 2
        });

        // Add more leaves for higher health
        if (health > 50) {
          leaves.push({
            x: endPoint.x + (Math.random() * 6 - 3),
            y: endPoint.y + (Math.random() * 6 - 3),
            size: 4 * leafSizeFactor,
            rotation: Math.random() * Math.PI * 2
          });
        }
      }

      // Early return for low health plants - fewer branches
      if (health < 25 && Math.random() > 0.7) return;

      // Reduce branch length for next iteration
      const newLength = length * branchFactor;

      // Create two branches from this endpoint
      const rightAngle = angle + angleDelta * (0.8 + Math.random() * 0.4);
      const leftAngle = angle - angleDelta * (0.8 + Math.random() * 0.4);

      // Randomize branch thickness reduction
      const thicknessReduction = 0.6 + Math.random() * 0.2;

      // Generate right branch
      generateBranch(
        endPoint,
        rightAngle,
        newLength,
        thickness * thicknessReduction,
        depth + 1
      );

      // Generate left branch
      generateBranch(
        endPoint,
        leftAngle,
        newLength,
        thickness * thicknessReduction,
        depth + 1
      );

      // Sometimes add a middle branch for more fullness
      if (depth < maxDepth - 1 && Math.random() > 0.7) {
        const midAngle = angle + (Math.random() * 0.2 - 0.1);
        generateBranch(
          endPoint,
          midAngle,
          newLength * 0.8,
          thickness * thicknessReduction * 0.8,
          depth + 1
        );
      }
    };

    // Generate the initial branch (trunk)
    const trunkPoint = { x: startX, y: startY };
    generateBranch(
      trunkPoint,
      initialAngle,
      branchLength,
      initialThickness,
      0
    );

    return { branches, leaves };
  }, [clampedLevel, health]);

  // Handle mouse/touch events
  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    // Store the mouse position for tooltip placement
    setTooltipPosition({ x: e.clientX, y: e.clientY });

    // Cancel any existing timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    // Set timer for 2 seconds before showing tooltip
    hoverTimerRef.current = setTimeout(() => {
      setShowTooltip(true);

      // Add a small delay before adding the visible class for animation
      setTimeout(() => {
        setTooltipVisible(true);
      }, 50);
    }, 2000);
  };

  // Update tooltip position when mouse moves
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (hoverTimerRef.current) {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    // Clear the hover timer if it exists
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // First make it invisible (for animation)
    setTooltipVisible(false);

    // Then hide it completely after animation completes
    setTimeout(() => {
      setShowTooltip(false);
    }, 300);
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    // Don't use preventDefault in passive events for mobile
    // e.preventDefault(); - removing this to fix the passive event listener warning

    setIsMobile(true);

    // Store the touch position
    const touch = e.touches[0];
    setTooltipPosition({ x: touch.clientX, y: touch.clientY });

    // Start the touch timer
    touchTimerRef.current = setInterval(() => {
      setTouchDuration(prev => prev + 100);
    }, 100);
  };

  const handleTouchEnd = () => {
    // Clear the touch timer
    if (touchTimerRef.current) {
      clearInterval(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    // If touch was held for at least 1 second, show tooltip
    if (touchDuration >= 1000) {
      setShowTooltip(true);

      // Animate in
      setTimeout(() => {
        setTooltipVisible(true);
      }, 50);

      // Auto-hide after 4 seconds
      tooltipTimerRef.current = setTimeout(() => {
        setTooltipVisible(false);

        setTimeout(() => {
          setShowTooltip(false);
        }, 300);
      }, 4000);
    }

    // Reset touch duration
    setTouchDuration(0);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    // Update position if touch is held
    if (touchTimerRef.current) {
      const touch = e.touches[0];
      setTooltipPosition({ x: touch.clientX, y: touch.clientY });
    } else {
      // If user moves finger without holding, cancel the touch
      if (touchTimerRef.current) {
        clearInterval(touchTimerRef.current);
        touchTimerRef.current = null;
      }
      setTouchDuration(0);
    }
  };

  // Get health status text
  const getHealthStatus = () => {
    if (health > 75) return "Thriving";
    if (health > 50) return "Healthy";
    if (health > 25) return "Needs Care";
    return "Withering";
  };

  // Get level description
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

  // Prevent context menu on the plant container
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    return false;
  };

  // Get relative position for tooltip with improved boundary checking
  const getRelativeTooltipPosition = (): React.CSSProperties => {
    if (!tooltipRef.current) return {};

    // Get container dimensions and position
    const containerRect = tooltipRef.current.parentElement?.getBoundingClientRect();
    if (!containerRect) return {};

    // Get tooltip dimensions for overflow detection
    const tooltipWidth = 256; // w-64 = 16rem = 256px
    const tooltipHeight = 170; // Approximate height

    // Calculate relative position within the container
    let relativeX = tooltipPosition.x - containerRect.left;
    let relativeY = tooltipPosition.y - containerRect.top;

    // Adjust coordinates to keep tooltip in view - clamping to container boundaries
    // Left edge boundary
    if (relativeX - tooltipWidth < 0) {
      relativeX = 10; // Add some padding
    }

    // Right edge boundary
    if (relativeX + tooltipWidth > containerRect.width) {
      relativeX = containerRect.width - tooltipWidth - 10;
    }

    // Top edge boundary
    if (relativeY - tooltipHeight < 0) {
      relativeY = 10;
    }

    // Bottom edge boundary
    if (relativeY + tooltipHeight > containerRect.height) {
      relativeY = containerRect.height - tooltipHeight - 10;
    }

    // Return fixed position that will always be within container bounds
    return {
      position: 'absolute',
      left: `${relativeX}px`,
      top: `${relativeY}px`
    };
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (touchTimerRef.current) clearInterval(touchTimerRef.current);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  return (
    <div
      className="plant-container relative w-80 h-64 flex items-center justify-center cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={handleContextMenu}
    >
      <svg viewBox="0 0 300 300" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Pot */}
        <path d="M110 240 L190 240 L200 280 L100 280 Z" fill={plantColors.potColor} />
        <ellipse cx="150" cy="240" rx="40" ry="10" fill={plantColors.soilColor} />

        {/* Draw tree branches */}
        {branches.map((branch, index) => (
          <line
            key={`branch-${index}`}
            x1={branch.start.x}
            y1={branch.start.y}
            x2={branch.end.x}
            y2={branch.end.y}
            stroke={plantColors.trunkColor}
            strokeWidth={branch.thickness}
            strokeLinecap="round"
            className={health < 25 ? 'opacity-70' : ''}
          />
        ))}

        {/* Draw leaves */}
        {leaves.map((leaf, index) => (
          <g
            key={`leaf-${index}`}
            transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.rotation * (180 / Math.PI)})`}
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

        {/* Touch indicator that appears during long touch */}
        {isMobile && touchDuration > 0 && touchDuration < 1000 && (
          <circle
            cx="150"
            cy="150"
            r={10 + (touchDuration / 100)}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeOpacity={0.5}
            className="touch-indicator"
          />
        )}
      </svg>

      {/* Tooltip - only rendered when showTooltip is true */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`absolute w-64 rounded-lg bg-gray-800 border border-gray-700 p-3 shadow-lg z-20 transition-all duration-300
            ${tooltipVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={getRelativeTooltipPosition()}
        >
          <div className="relative">
            {/* Tooltip content */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">Plant Status</span>
                <div className="flex items-center px-2 py-0.5 rounded-full bg-gray-700">
                  <span className="text-sm font-bold text-blue-300">Level {clampedLevel}</span>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-2">{getLevelDescription()}</p>

              {/* Health bar */}
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
