// src/components/gamification/Plant.tsx

import React, { useMemo } from 'react';
import { PlantState } from '../../types';

interface PlantProps {
  health: number;
  level: number;
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

  // Generate leaf colors based on health
  const leafColor = useMemo(() => {
    if (plantState.status === 'dying') {
      return 'from-yellow-200 to-yellow-600';
    } else if (plantState.status === 'struggling') {
      return 'from-yellow-300 to-green-600';
    } else if (plantState.status === 'healthy') {
      return 'from-green-300 to-green-600';
    } else {
      return 'from-green-300 to-green-700';
    }
  }, [plantState.status]);

  // Generate stem color based on health
  const stemColor = useMemo(() => {
    if (plantState.status === 'dying') {
      return 'bg-yellow-800';
    } else if (plantState.status === 'struggling') {
      return 'bg-green-700';
    } else {
      return 'bg-green-800';
    }
  }, [plantState.status]);

  // Calculate number of leaves based on level
  const numLeaves = useMemo(() => {
    return Math.min(5, Math.max(2, plantState.level * 2));
  }, [plantState.level]);

  // Generate leaves based on plant level
  const renderLeaves = () => {
    const leaves = [];

    // Different leaf arrangements based on level
    if (plantState.level === 1) {
      // Level 1: 2 small leaves
      leaves.push(
        <div key="leaf-1" className={`absolute top-8 left-2 w-8 h-12 rounded-full bg-gradient-to-br ${leafColor} -rotate-12 transform-gpu`}></div>,
        <div key="leaf-2" className={`absolute top-8 right-2 w-8 h-12 rounded-full bg-gradient-to-br ${leafColor} rotate-12 transform-gpu`}></div>
      );
    } else if (plantState.level === 2) {
      // Level 2: 3 medium leaves
      leaves.push(
        <div key="leaf-1" className={`absolute top-16 left-3 w-10 h-14 rounded-full bg-gradient-to-br ${leafColor} -rotate-30 transform-gpu`}></div>,
        <div key="leaf-2" className={`absolute top-12 left-1/2 w-10 h-14 rounded-full bg-gradient-to-br ${leafColor} -translate-x-1/2 transform-gpu`}></div>,
        <div key="leaf-3" className={`absolute top-16 right-3 w-10 h-14 rounded-full bg-gradient-to-br ${leafColor} rotate-30 transform-gpu`}></div>
      );
    } else if (plantState.level === 3) {
      // Level 3: 4 varied leaves in pairs
      leaves.push(
        <div key="leaf-1" className={`absolute top-8 left-3 w-10 h-14 rounded-full bg-gradient-to-br ${leafColor} -rotate-30 transform-gpu`}></div>,
        <div key="leaf-2" className={`absolute top-10 left-2 w-12 h-16 rounded-full bg-gradient-to-br ${leafColor} -rotate-15 transform-gpu`}></div>,
        <div key="leaf-3" className={`absolute top-8 right-3 w-10 h-14 rounded-full bg-gradient-to-br ${leafColor} rotate-30 transform-gpu`}></div>,
        <div key="leaf-4" className={`absolute top-10 right-2 w-12 h-16 rounded-full bg-gradient-to-br ${leafColor} rotate-15 transform-gpu`}></div>
      );
    } else if (plantState.level === 4) {
      // Level 4: 6 varied leaves in pairs
      leaves.push(
        <div key="leaf-1" className={`absolute top-4 left-2 w-12 h-16 rounded-full bg-gradient-to-br ${leafColor} -rotate-30 transform-gpu`}></div>,
        <div key="leaf-2" className={`absolute top-12 left-1 w-14 h-18 rounded-full bg-gradient-to-br ${leafColor} -rotate-15 transform-gpu`}></div>,
        <div key="leaf-3" className={`absolute top-6 left-1/2 w-12 h-16 rounded-full bg-gradient-to-br ${leafColor} -translate-x-1/2 transform-gpu`}></div>,
        <div key="leaf-4" className={`absolute top-4 right-2 w-12 h-16 rounded-full bg-gradient-to-br ${leafColor} rotate-30 transform-gpu`}></div>,
        <div key="leaf-5" className={`absolute top-12 right-1 w-14 h-18 rounded-full bg-gradient-to-br ${leafColor} rotate-15 transform-gpu`}></div>,
        <div key="leaf-6" className={`absolute top-20 left-1/2 w-10 h-14 rounded-full bg-gradient-to-br ${leafColor} -translate-x-1/2 transform-gpu`}></div>
      );
    } else {
      // Level 5: 8 varied leaves with some animation
      leaves.push(
        <div key="leaf-1" className={`absolute top-2 left-2 w-14 h-18 rounded-full bg-gradient-to-br ${leafColor} -rotate-30 transform-gpu animate-pulse-slow`}></div>,
        <div key="leaf-2" className={`absolute top-10 left-0 w-16 h-20 rounded-full bg-gradient-to-br ${leafColor} -rotate-15 transform-gpu`}></div>,
        <div key="leaf-3" className={`absolute top-4 left-1/2 w-14 h-18 rounded-full bg-gradient-to-br ${leafColor} -translate-x-1/2 transform-gpu animate-pulse-slow`}></div>,
        <div key="leaf-4" className={`absolute top-18 left-1/2 w-12 h-16 rounded-full bg-gradient-to-br ${leafColor} -translate-x-1/2 transform-gpu`}></div>,
        <div key="leaf-5" className={`absolute top-2 right-2 w-14 h-18 rounded-full bg-gradient-to-br ${leafColor} rotate-30 transform-gpu animate-pulse-slow`}></div>,
        <div key="leaf-6" className={`absolute top-10 right-0 w-16 h-20 rounded-full bg-gradient-to-br ${leafColor} rotate-15 transform-gpu`}></div>,
        <div key="leaf-7" className={`absolute top-24 left-4 w-10 h-14 rounded-full bg-gradient-to-br ${leafColor} -rotate-10 transform-gpu`}></div>,
        <div key="leaf-8" className={`absolute top-24 right-4 w-10 h-14 rounded-full bg-gradient-to-br ${leafColor} rotate-10 transform-gpu`}></div>
      );
    }

    return leaves;
  };

  return (
    <div className="plant-container relative w-64 h-64 flex items-center justify-center">
      {/* Plant stem */}
      <div className={`${stemColor} w-3 h-32 absolute bottom-8`}></div>

      {/* Plant pot */}
      <div className="absolute bottom-0 w-24 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-b-full overflow-hidden">
        <div className="absolute bottom-0 w-full h-10 bg-gradient-to-b from-gray-800 to-gray-900 rounded-b-full"></div>
        <div className="absolute w-16 h-6 bg-gray-800 rounded-full left-1/2 transform -translate-x-1/2 top-0"></div>
      </div>

      {/* Soil in the pot */}
      <div className="absolute bottom-10 w-16 h-8 bg-gradient-to-b from-yellow-900 to-yellow-800 rounded-t-full left-1/2 transform -translate-x-1/2"></div>

      {/* Plant leaves */}
      {renderLeaves()}

      {/* Health indicator */}
      <div className="absolute bottom-20 left-4 bg-gray-200 w-4 h-16 rounded-full overflow-hidden">
        <div
          className={`w-full rounded-full ${
            health > 75 ? 'bg-green-500' : health > 50 ? 'bg-green-400' : health > 25 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ height: `${health}%`, maxHeight: '100%', transition: 'height 0.5s ease-in-out' }}
        ></div>
      </div>

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
