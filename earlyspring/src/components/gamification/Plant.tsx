// src/components/gamification/Plant.tsx

import React, { useMemo } from 'react';
import { PlantState } from '../../types';

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
  // Determine plant state based on health and level
  const plantState: PlantState = useMemo(() => {
    let status: PlantState['status'] = 'healthy';

    if (health < 25) {
      status = 'dying';
    } else if (health < 50) {
      status = 'struggling';
    } else if (health > 75) {
      status = 'thriving';
    }

    return {
      health,
      level: Math.max(1, Math.min(5, level)), // Clamp between 1-5
      status
    };
  }, [health, level]);

  // Generate colors based on plant health
  const plantColors = useMemo(() => {
    let foliageColor = '';
    let trunkColor = '';
    let potColor = '#4B5563'; // gray-600
    let soilColor = '#92400E'; // yellow-800

    if (plantState.status === 'dying') {
      foliageColor = '#CA8A04'; // yellow-600
      trunkColor = '#854D0E';   // yellow-800
    } else if (plantState.status === 'struggling') {
      foliageColor = '#FDE047'; // yellow-300
      trunkColor = '#A16207';   // yellow-700
    } else if (plantState.status === 'healthy') {
      foliageColor = '#4ADE80'; // green-400
      trunkColor = '#166534';   // green-800
    } else {
      // thriving
      foliageColor = '#22C55E'; // green-500
      trunkColor = '#14532D';   // green-900
    }

    return { foliageColor, trunkColor, potColor, soilColor };
  }, [plantState.status]);

  // Generate tree structure using recursive algorithm
  const { branches, leaves } = useMemo(() => {
    const branches: Branch[] = [];
    const leaves: Leaf[] = [];

    // Starting point of the trunk
    const startX = 150;
    const startY = 240;
    const initialAngle = -Math.PI / 2; // Pointing up

    // Tree parameters based on level
    const branchLength = 30 + plantState.level * 10;
    const initialThickness = 5 + plantState.level * 0.5;
    const branchFactor = 0.65 + plantState.level * 0.02;
    const angleDelta = Math.PI / 6 - (plantState.level * 0.01);
    const maxDepth = 1 + plantState.level; // Increase depth with level

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
        const leafSizeFactor = plantState.status === 'thriving' ? 1.2 :
                              plantState.status === 'healthy' ? 1 :
                              plantState.status === 'struggling' ? 0.8 : 0.6;

        // Add leaves at the end of branches
        leaves.push({
          x: endPoint.x,
          y: endPoint.y,
          size: 5 * leafSizeFactor,
          rotation: Math.random() * Math.PI * 2
        });

        // Add more leaves for higher health
        if (plantState.status === 'thriving' || plantState.status === 'healthy') {
          leaves.push({
            x: endPoint.x + (Math.random() * 6 - 3),
            y: endPoint.y + (Math.random() * 6 - 3),
            size: 4 * leafSizeFactor,
            rotation: Math.random() * Math.PI * 2
          });
        }
      }

      // Early return for dying plants - fewer branches
      if (plantState.status === 'dying' && Math.random() > 0.7) return;

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
  }, [plantState.level, plantState.status]);

  return (
    <div className="plant-container relative w-64 h-64 flex items-center justify-center">
      <svg viewBox="0 0 300 300" className="w-full h-full">
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
            className={plantState.status === 'dying' ? 'opacity-70' : ''}
          />
        ))}

        {/* Draw leaves */}
        {leaves.map((leaf, index) => (
          <g
            key={`leaf-${index}`}
            transform={`translate(${leaf.x}, ${leaf.y}) rotate(${leaf.rotation * (180 / Math.PI)})`}
            className={plantState.status === 'thriving' ? 'animate-pulse-slow' : ''}
          >
            <ellipse
              cx="0"
              cy="0"
              rx={leaf.size * 1.5}
              ry={leaf.size}
              fill={plantColors.foliageColor}
              opacity={plantState.status === 'dying' ? 0.7 : plantState.status === 'struggling' ? 0.85 : 1}
            />
          </g>
        ))}

        {/* Health bar */}
        <rect x="90" y="230" width="10" height="40" rx="5" fill="#1F2937" />
        <rect
          x="90"
          y={230 + (40 - (health / 100 * 40))}
          width="10"
          height={health / 100 * 40}
          rx="5"
          fill={
            health > 75 ? '#22C55E' :
            health > 50 ? '#4ADE80' :
            health > 25 ? '#EAB308' :
            '#EF4444'
          }
        />

        {/* Level indicator */}
        <circle cx="210" cy="230" r="15" fill="#3B82F6" />
        <text
          x="210"
          y="235"
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="white"
        >
          {plantState.level}
        </text>
      </svg>

      {/* Plant status message */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className={`text-sm font-medium ${
          plantState.status === 'dying' ? 'text-red-500' :
          plantState.status === 'struggling' ? 'text-yellow-500' :
          plantState.status === 'thriving' ? 'text-green-500' :
          'text-green-400'
        }`}>
          {plantState.status === 'dying' ? 'Dying!' :
           plantState.status === 'struggling' ? 'Struggling' :
           plantState.status === 'thriving' ? 'Thriving!' :
           'Healthy'}
        </p>
      </div>
    </div>
  );
};

export default Plant;
