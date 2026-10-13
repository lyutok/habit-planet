import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { PlanetScene } from '@/components/PlanetScene';
import type { PlanetObject } from '@/types/habits';

interface PlanetCanvasProps {
  isMobile: boolean;
  planetObjects: PlanetObject[];
  newObjectId: string | null;
  sparklePos: [number, number, number] | null;
  longestStreak: number;
  planetStyle: 'earth' | 'classic';
}

export default function PlanetCanvas({
  isMobile,
  planetObjects,
  newObjectId,
  sparklePos,
  longestStreak,
  planetStyle,
}: PlanetCanvasProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.5, isMobile ? 7.5 : 5.8], fov: 46 }}
      shadows
      style={{ background: 'transparent' }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        preserveDrawingBuffer: true,
      }}
    >
      <Suspense fallback={null}>
        <PlanetScene
          planetObjects={planetObjects}
          newObjectId={newObjectId}
          sparklePos={sparklePos}
          longestStreak={longestStreak}
          planetStyle={planetStyle}
        />
      </Suspense>
    </Canvas>
  );
}
