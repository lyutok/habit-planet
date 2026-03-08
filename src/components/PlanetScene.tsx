import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetObject, HabitType } from '@/types/habits';

// Low-poly planet sphere
function Planet() {
  return (
    <group>
      {/* Ocean/base layer */}
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshPhongMaterial
          color="#1a6b8a"
          flatShading
          shininess={20}
        />
      </mesh>
      {/* Grass patches */}
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[1.51, 1]} />
        <meshPhongMaterial
          color="#3a9e5a"
          flatShading
          transparent
          opacity={0.95}
          shininess={10}
        />
      </mesh>
    </group>
  );
}

// Tree object (cylinder trunk + cone leaves)
function Tree({ position, scale, color, rotation }: { position: [number, number, number]; scale: number; color: string; rotation: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const dir = new THREE.Vector3(...position).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);

  return (
    <group ref={groupRef} position={position} quaternion={quaternion} scale={scale}>
      {/* Trunk */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.6, 5]} />
        <meshPhongMaterial color="#8B5E3C" flatShading />
      </mesh>
      {/* Leaves bottom */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <coneGeometry args={[0.45, 0.7, 5]} />
        <meshPhongMaterial color={color} flatShading />
      </mesh>
      {/* Leaves top */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <coneGeometry args={[0.3, 0.55, 5]} />
        <meshPhongMaterial color={color} flatShading />
      </mesh>
    </group>
  );
}

// Flower object
function Flower({ position, scale, color }: { position: [number, number, number]; scale: number; color: string }) {
  const dir = new THREE.Vector3(...position).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);

  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      {/* Stem */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 4]} />
        <meshPhongMaterial color="#5aaa5a" flatShading />
      </mesh>
      {/* Center */}
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.13, 5, 4]} />
        <meshPhongMaterial color="#f5e642" flatShading />
      </mesh>
      {/* Petals */}
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} castShadow position={[
          Math.cos((i / 5) * Math.PI * 2) * 0.22,
          0.55,
          Math.sin((i / 5) * Math.PI * 2) * 0.22
        ]}>
          <sphereGeometry args={[0.1, 4, 3]} />
          <meshPhongMaterial color={color} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// Mountain object
function Mountain({ position, scale, color }: { position: [number, number, number]; scale: number; color: string }) {
  const dir = new THREE.Vector3(...position).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);

  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      {/* Base mountain */}
      <mesh castShadow>
        <coneGeometry args={[0.6, 1.0, 5]} />
        <meshPhongMaterial color={color} flatShading />
      </mesh>
      {/* Snow cap */}
      <mesh castShadow position={[0, 0.42, 0]}>
        <coneGeometry args={[0.2, 0.35, 5]} />
        <meshPhongMaterial color="#e8f0ff" flatShading />
      </mesh>
    </group>
  );
}

// Building object
function Building({ position, scale, color }: { position: [number, number, number]; scale: number; color: string }) {
  const dir = new THREE.Vector3(...position).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);

  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      {/* Main building */}
      <mesh castShadow>
        <boxGeometry args={[0.45, 0.9, 0.45]} />
        <meshPhongMaterial color={color} flatShading />
      </mesh>
      {/* Tower on top */}
      <mesh castShadow position={[0.1, 0.65, 0.1]}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <meshPhongMaterial color={color} flatShading />
      </mesh>
      {/* Windows as emissive dots */}
      <mesh position={[0, 0.1, 0.23]}>
        <boxGeometry args={[0.3, 0.5, 0.01]} />
        <meshPhongMaterial color="#fffbe0" emissive="#fffbe0" emissiveIntensity={0.6} flatShading />
      </mesh>
    </group>
  );
}

// Animated object wrapper that grows in
function AnimatedObject({ children, isNew }: { children: React.ReactNode; isNew: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef(isNew ? 0 : 1);
  const targetScale = 1;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (scaleRef.current < targetScale) {
      scaleRef.current = Math.min(scaleRef.current + delta * 3, targetScale);
      const ease = 1 - Math.pow(1 - scaleRef.current, 3);
      groupRef.current.scale.setScalar(ease);
    }
  });

  return <group ref={groupRef} scale={isNew ? 0 : 1}>{children}</group>;
}

function PlanetObjectMesh({ obj, isNew }: { obj: PlanetObject; isNew: boolean }) {
  const typeMap: Record<HabitType, JSX.Element> = {
    tree: <Tree position={obj.position} scale={obj.scale} color={obj.color} rotation={obj.rotation} />,
    flower: <Flower position={obj.position} scale={obj.scale} color={obj.color} />,
    mountain: <Mountain position={obj.position} scale={obj.scale} color={obj.color} />,
    building: <Building position={obj.position} scale={obj.scale} color={obj.color} />,
  };

  return (
    <AnimatedObject isNew={isNew}>
      {typeMap[obj.type]}
    </AnimatedObject>
  );
}

// Floating planet group
function FloatingPlanet({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.08;
    groupRef.current.rotation.y += 0.001;
  });

  return <group ref={groupRef}>{children}</group>;
}

// Stars background
function Stars() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pts: number[] = [];
    for (let i = 0; i < 300; i++) {
      pts.push(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return geo;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial color="#ffffff" size={0.12} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

interface PlanetSceneProps {
  planetObjects: PlanetObject[];
  newObjectId: string | null;
}

export function PlanetScene({ planetObjects, newObjectId }: PlanetSceneProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} color="#a8d8ff" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.4}
        color="#fff8e0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, -2, -5]} intensity={0.2} color="#2040a0" />

      <Stars />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={7}
        rotateSpeed={0.6}
        zoomSpeed={0.5}
        autoRotate={false}
        enableDamping
        dampingFactor={0.05}
      />

      <FloatingPlanet>
        <Planet />
        {planetObjects.map(obj => (
          <PlanetObjectMesh
            key={obj.id}
            obj={obj}
            isNew={obj.id === newObjectId}
          />
        ))}
      </FloatingPlanet>
    </>
  );
}
