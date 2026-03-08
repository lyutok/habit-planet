import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetObject, HabitType } from '@/types/habits';

// ─── Planet ──────────────────────────────────────────────────────────────────

function Planet() {
  const cloudsRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = clock.elapsedTime * 0.04;
      cloudsRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.02) * 0.05;
    }
  });

  return (
    <group>
      {/* Deep ocean core */}
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshPhongMaterial color="#124e78" flatShading shininess={60} specular="#4af0ff" />
      </mesh>

      {/* Land masses — slightly larger, transparent patches */}
      <mesh receiveShadow>
        <icosahedronGeometry args={[1.52, 1]} />
        <meshPhongMaterial
          color="#2d7a3a"
          flatShading
          transparent
          opacity={0.88}
          shininess={8}
        />
      </mesh>

      {/* Highlight land variation */}
      <mesh receiveShadow>
        <icosahedronGeometry args={[1.535, 1]} />
        <meshPhongMaterial
          color="#3ea050"
          flatShading
          transparent
          opacity={0.45}
          shininess={5}
        />
      </mesh>

      {/* Wispy cloud layer */}
      <mesh ref={cloudsRef}>
        <icosahedronGeometry args={[1.60, 2]} />
        <meshPhongMaterial
          color="#d8eeff"
          flatShading
          transparent
          opacity={0.22}
          depthWrite={false}
          shininess={0}
        />
      </mesh>

      {/* Atmosphere rim glow */}
      <mesh>
        <sphereGeometry args={[1.78, 32, 32]} />
        <meshPhongMaterial
          color="#5bbfff"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
          depthWrite={false}
          shininess={0}
        />
      </mesh>
    </group>
  );
}

// ─── Surface Objects ──────────────────────────────────────────────────────────

function Tree({
  position, scale, color,
}: { position: [number, number, number]; scale: number; color: string }) {
  const dir = new THREE.Vector3(...position).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  const darkTrunk = '#6b3e1e';

  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      {/* Roots bump */}
      <mesh castShadow position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.12, 6]} />
        <meshPhongMaterial color={darkTrunk} flatShading shininess={4} />
      </mesh>
      {/* Trunk */}
      <mesh castShadow position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 0.72, 6]} />
        <meshPhongMaterial color={darkTrunk} flatShading shininess={4} />
      </mesh>
      {/* Foliage — 3 stacked cones */}
      <mesh castShadow position={[0, 0.92, 0]}>
        <coneGeometry args={[0.52, 0.72, 6]} />
        <meshPhongMaterial color={color} flatShading shininess={10} />
      </mesh>
      <mesh castShadow position={[0, 1.32, 0]}>
        <coneGeometry args={[0.38, 0.58, 6]} />
        <meshPhongMaterial color={color} flatShading shininess={10} />
      </mesh>
      <mesh castShadow position={[0, 1.65, 0]}>
        <coneGeometry args={[0.22, 0.44, 6]} />
        <meshPhongMaterial color={lightenColor(color, 0.12)} flatShading shininess={12} />
      </mesh>
    </group>
  );
}

function Flower({
  position, scale, color,
}: { position: [number, number, number]; scale: number; color: string }) {
  const dir = new THREE.Vector3(...position).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  const petalCount = 6;
  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      {/* Stem */}
      <mesh castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.56, 5]} />
        <meshPhongMaterial color="#48a048" flatShading />
      </mesh>
      {/* Leaf */}
      <mesh castShadow position={[0.14, 0.22, 0]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.22, 0.08, 0.03]} />
        <meshPhongMaterial color="#48a048" flatShading />
      </mesh>
      {/* Petals */}
      {Array.from({ length: petalCount }).map((_, i) => {
        const angle = (i / petalCount) * Math.PI * 2;
        return (
          <mesh
            key={i}
            castShadow
            position={[Math.cos(angle) * 0.22, 0.62, Math.sin(angle) * 0.22]}
          >
            <sphereGeometry args={[0.13, 5, 4]} />
            <meshPhongMaterial color={color} flatShading shininess={15} />
          </mesh>
        );
      })}
      {/* Center */}
      <mesh castShadow position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.16, 6, 5]} />
        <meshPhongMaterial color="#f7e234" flatShading shininess={30} specular="#ffee88" />
      </mesh>
    </group>
  );
}

function Mountain({
  position, scale, color,
}: { position: [number, number, number]; scale: number; color: string }) {
  const dir = new THREE.Vector3(...position).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      {/* Base skirt */}
      <mesh castShadow position={[0, 0.1, 0]}>
        <coneGeometry args={[0.82, 0.22, 6]} />
        <meshPhongMaterial color={darkenColor(color, 0.15)} flatShading shininess={4} />
      </mesh>
      {/* Main peak */}
      <mesh castShadow position={[0, 0.52, 0]}>
        <coneGeometry args={[0.66, 1.06, 6]} />
        <meshPhongMaterial color={color} flatShading shininess={8} />
      </mesh>
      {/* Snow cap */}
      <mesh castShadow position={[0, 1.02, 0]}>
        <coneGeometry args={[0.28, 0.38, 6]} />
        <meshPhongMaterial color="#deeeff" flatShading shininess={40} specular="#aaddff" />
      </mesh>
      {/* Snow tip */}
      <mesh castShadow position={[0, 1.24, 0]}>
        <coneGeometry args={[0.1, 0.2, 5]} />
        <meshPhongMaterial color="#f5faff" flatShading shininess={50} />
      </mesh>
    </group>
  );
}

function Building({
  position, scale, color,
}: { position: [number, number, number]; scale: number; color: string }) {
  const dir = new THREE.Vector3(...position).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

  return (
    <group position={position} quaternion={quaternion} scale={scale}>
      {/* Foundation */}
      <mesh castShadow position={[0, 0.06, 0]}>
        <boxGeometry args={[0.60, 0.12, 0.60]} />
        <meshPhongMaterial color={darkenColor(color, 0.2)} flatShading shininess={5} />
      </mesh>
      {/* Main tower */}
      <mesh castShadow position={[0, 0.60, 0]}>
        <boxGeometry args={[0.50, 1.0, 0.50]} />
        <meshPhongMaterial color={color} flatShading shininess={30} specular="#8888ff" />
      </mesh>
      {/* Side block */}
      <mesh castShadow position={[0.28, 0.42, 0]}>
        <boxGeometry args={[0.22, 0.72, 0.30]} />
        <meshPhongMaterial color={lightenColor(color, 0.1)} flatShading shininess={20} />
      </mesh>
      {/* Antenna */}
      <mesh castShadow position={[0, 1.20, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.32, 4]} />
        <meshPhongMaterial color="#ccddff" flatShading />
      </mesh>
      {/* Glowing windows */}
      <mesh position={[0, 0.55, 0.26]}>
        <boxGeometry args={[0.36, 0.60, 0.01]} />
        <meshPhongMaterial
          color="#fffbe0"
          emissive="#ffe090"
          emissiveIntensity={1.2}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lightenColor(hex: string, amount: number): string {
  try {
    const c = new THREE.Color(hex);
    c.r = Math.min(1, c.r + amount);
    c.g = Math.min(1, c.g + amount);
    c.b = Math.min(1, c.b + amount);
    return `#${c.getHexString()}`;
  } catch {
    return hex;
  }
}

function darkenColor(hex: string, amount: number): string {
  try {
    const c = new THREE.Color(hex);
    c.r = Math.max(0, c.r - amount);
    c.g = Math.max(0, c.g - amount);
    c.b = Math.max(0, c.b - amount);
    return `#${c.getHexString()}`;
  } catch {
    return hex;
  }
}

// ─── Animated grow-in wrapper ─────────────────────────────────────────────────

function AnimatedObject({ children, isNew }: { children: React.ReactNode; isNew: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const progressRef = useRef(isNew ? 0 : 1);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (progressRef.current < 1) {
      progressRef.current = Math.min(progressRef.current + delta * 2.5, 1);
      const t = progressRef.current;
      // Elastic-like overshoot
      const ease = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      groupRef.current.scale.setScalar(ease);
    }
  });

  return (
    <group ref={groupRef} scale={isNew ? 0 : 1}>
      {children}
    </group>
  );
}

function PlanetObjectMesh({ obj, isNew }: { obj: PlanetObject; isNew: boolean }) {
  const typeMap: Record<HabitType, JSX.Element> = {
    tree: <Tree position={obj.position} scale={obj.scale} color={obj.color} />,
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

// ─── Floating planet + slow rotation ─────────────────────────────────────────

function FloatingPlanet({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.45) * 0.1;
    groupRef.current.rotation.y += 0.0015;
  });

  return <group ref={groupRef}>{children}</group>;
}

// ─── Starfield ────────────────────────────────────────────────────────────────

function Stars() {
  const { geo, sizes } = useMemo(() => {
    const count = 500;
    const pts: number[] = [];
    const szArr: number[] = [];
    for (let i = 0; i < count; i++) {
      // uniform sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 55 + Math.random() * 30;
      pts.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
      szArr.push(0.06 + Math.random() * 0.18);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('size', new THREE.Float32BufferAttribute(szArr, 1));
    return { geo: g, sizes: szArr };
  }, []);

  return (
    <points geometry={geo}>
      <pointsMaterial color="#e8f0ff" size={0.13} transparent opacity={0.85} sizeAttenuation />
    </points>
  );
}

// ─── Distant decorative mini-moons / asteroids ───────────────────────────────

function Asteroids() {
  const asteroids = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      angle: (i / 8) * Math.PI * 2,
      radius: 3.6 + Math.random() * 0.8,
      y: (Math.random() - 0.5) * 1.2,
      scale: 0.04 + Math.random() * 0.06,
      speed: 0.12 + Math.random() * 0.08,
      color: ['#9b8b7a', '#b09080', '#887060', '#a09888'][i % 4],
    })), []);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, idx) => {
      const a = asteroids[idx];
      const t = clock.elapsedTime * a.speed + a.angle;
      child.position.set(Math.cos(t) * a.radius, a.y, Math.sin(t) * a.radius);
    });
  });

  return (
    <group ref={groupRef}>
      {asteroids.map(a => (
        <mesh key={a.id} scale={a.scale}>
          <icosahedronGeometry args={[1, 0]} />
          <meshPhongMaterial color={a.color} flatShading shininess={6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Scene root ───────────────────────────────────────────────────────────────

interface PlanetSceneProps {
  planetObjects: PlanetObject[];
  newObjectId: string | null;
}

export function PlanetScene({ planetObjects, newObjectId }: PlanetSceneProps) {
  return (
    <>
      {/* Ambient fill */}
      <ambientLight intensity={0.55} color="#b0d8ff" />

      {/* Main sun — warm key light */}
      <directionalLight
        position={[6, 9, 5]}
        intensity={2.0}
        color="#fff4d0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-bias={-0.001}
      />

      {/* Cool fill from opposite */}
      <directionalLight position={[-5, -3, -6]} intensity={0.35} color="#2050c0" />

      {/* Soft rim / atmosphere edge light */}
      <directionalLight position={[0, 0, -8]} intensity={0.5} color="#60aaff" />

      {/* Warm under-glow */}
      <pointLight position={[0, -4, 2]} intensity={0.4} color="#40ff90" distance={10} />

      <Stars />
      <Asteroids />

      <OrbitControls
        enablePan={false}
        minDistance={3.2}
        maxDistance={8}
        rotateSpeed={0.55}
        zoomSpeed={0.5}
        enableDamping
        dampingFactor={0.06}
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
