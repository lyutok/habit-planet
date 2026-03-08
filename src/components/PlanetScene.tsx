import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetObject, HabitType } from '@/types/habits';

// ─── Colour helpers ───────────────────────────────────────────────────────────
function tint(hex: string, d: number): string {
  try {
    const c = new THREE.Color(hex);
    c.r = Math.max(0, Math.min(1, c.r + d));
    c.g = Math.max(0, Math.min(1, c.g + d));
    c.b = Math.max(0, Math.min(1, c.b + d));
    return `#${c.getHexString()}`;
  } catch { return hex; }
}

// ─── Planet ───────────────────────────────────────────────────────────────────
function Planet() {
  const cloudRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y = clock.elapsedTime * 0.05;
      cloudRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.015) * 0.04;
    }
  });
  return (
    <group>
      {/* Deep ocean */}
      <mesh castShadow receiveShadow>
        <icosahedronGeometry args={[1.5, 3]} />
        <meshPhongMaterial color="#0f5b82" flatShading shininess={80} specular="#44ccff" />
      </mesh>
      {/* Primary land */}
      <mesh receiveShadow>
        <icosahedronGeometry args={[1.515, 2]} />
        <meshPhongMaterial color="#27763d" flatShading transparent opacity={0.9} shininess={6} />
      </mesh>
      {/* Highlight patches */}
      <mesh receiveShadow>
        <icosahedronGeometry args={[1.525, 1]} />
        <meshPhongMaterial color="#3ea050" flatShading transparent opacity={0.5} shininess={4} />
      </mesh>
      {/* Desert/sand accent */}
      <mesh receiveShadow>
        <icosahedronGeometry args={[1.528, 1]} />
        <meshPhongMaterial color="#c8a060" flatShading transparent opacity={0.18} shininess={2} />
      </mesh>
      {/* Cloud layer */}
      <mesh ref={cloudRef}>
        <icosahedronGeometry args={[1.62, 3]} />
        <meshPhongMaterial color="#cce8ff" flatShading transparent opacity={0.18} depthWrite={false} />
      </mesh>
      {/* Atmosphere */}
      <mesh>
        <sphereGeometry args={[1.82, 32, 32]} />
        <meshPhongMaterial color="#4488ff" transparent opacity={0.06} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Outer glow halo */}
      <mesh>
        <sphereGeometry args={[2.1, 32, 32]} />
        <meshPhongMaterial color="#2255cc" transparent opacity={0.025} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── Tree ─────────────────────────────────────────────────────────────────────
function Tree({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshPhongMaterial;
      mat.opacity = milestone ? 0.25 + Math.sin(clock.elapsedTime * 2) * 0.12 : 0;
    }
  });

  return (
    <group position={pos} quaternion={q} scale={scale}>
      <mesh castShadow position={[0,0.06,0]}>
        <cylinderGeometry args={[0.13,0.18,0.12,6]} />
        <meshPhongMaterial color="#5a2d0c" flatShading />
      </mesh>
      <mesh castShadow position={[0,0.46,0]}>
        <cylinderGeometry args={[0.08,0.13,0.8,6]} />
        <meshPhongMaterial color="#5a2d0c" flatShading />
      </mesh>
      <mesh castShadow position={[0,1.0,0]}>
        <coneGeometry args={[0.54,0.76,7]} />
        <meshPhongMaterial color={color} flatShading shininess={10} />
      </mesh>
      <mesh castShadow position={[0,1.44,0]}>
        <coneGeometry args={[0.38,0.60,7]} />
        <meshPhongMaterial color={tint(color,0.06)} flatShading shininess={10} />
      </mesh>
      <mesh castShadow position={[0,1.78,0]}>
        <coneGeometry args={[0.22,0.44,6]} />
        <meshPhongMaterial color={tint(color,0.14)} flatShading shininess={12} />
      </mesh>
      {/* Milestone glow */}
      {milestone && (
        <mesh ref={glowRef} position={[0,1.2,0]}>
          <sphereGeometry args={[0.7,12,8]} />
          <meshPhongMaterial color={color} transparent opacity={0.25} depthWrite={false} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

// ─── Flower ───────────────────────────────────────────────────────────────────
function Flower({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.y = clock.elapsedTime * (milestone ? 1.2 : 0.6);
  });

  const petals = milestone ? 8 : 6;
  return (
    <group position={pos} quaternion={q} scale={scale}>
      <mesh castShadow position={[0,0.3,0]}>
        <cylinderGeometry args={[0.04,0.055,0.6,5]} />
        <meshPhongMaterial color="#3d9e3d" flatShading />
      </mesh>
      <mesh castShadow position={[0.15,0.28,0]} rotation={[0,0,-0.5]}>
        <boxGeometry args={[0.2,0.06,0.03]} />
        <meshPhongMaterial color="#3d9e3d" flatShading />
      </mesh>
      <group ref={groupRef} position={[0,0.66,0]}>
        {Array.from({ length: petals }).map((_,i) => {
          const a = (i/petals) * Math.PI * 2;
          return (
            <mesh key={i} castShadow position={[Math.cos(a)*0.24, 0, Math.sin(a)*0.24]}>
              <sphereGeometry args={[0.13,5,4]} />
              <meshPhongMaterial color={color} flatShading shininess={18} emissive={milestone ? color : '#000000'} emissiveIntensity={milestone ? 0.3 : 0} />
            </mesh>
          );
        })}
        <mesh castShadow>
          <sphereGeometry args={[0.17,6,5]} />
          <meshPhongMaterial color="#f7e040" flatShading shininess={40} specular="#ffe066" />
        </mesh>
      </group>
    </group>
  );
}

// ─── Mountain ─────────────────────────────────────────────────────────────────
function Mountain({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  return (
    <group position={pos} quaternion={q} scale={scale}>
      <mesh castShadow position={[0,0.12,0]}>
        <coneGeometry args={[0.86,0.22,6]} />
        <meshPhongMaterial color={tint(color,-0.12)} flatShading />
      </mesh>
      <mesh castShadow position={[0,0.55,0]}>
        <coneGeometry args={[0.68,1.1,6]} />
        <meshPhongMaterial color={color} flatShading shininess={8} />
      </mesh>
      <mesh castShadow position={[0,1.05,0]}>
        <coneGeometry args={[0.3,0.42,6]} />
        <meshPhongMaterial color="#deeeff" flatShading shininess={40} specular="#aadeff" />
      </mesh>
      <mesh castShadow position={[0,1.28,0]}>
        <coneGeometry args={[0.1,0.22,5]} />
        <meshPhongMaterial color={milestone ? '#a0eeff' : '#f4faff'} flatShading shininess={60} emissive={milestone ? '#60ddff' : '#000000'} emissiveIntensity={milestone ? 0.5 : 0} />
      </mesh>
    </group>
  );
}

// ─── Building ─────────────────────────────────────────────────────────────────
function Building({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  const antennaRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (antennaRef.current && milestone) {
      (antennaRef.current.material as THREE.MeshPhongMaterial).emissiveIntensity =
        0.4 + Math.sin(clock.elapsedTime * 4) * 0.3;
    }
  });
  return (
    <group position={pos} quaternion={q} scale={scale}>
      <mesh castShadow position={[0,0.07,0]}>
        <boxGeometry args={[0.64,0.14,0.64]} />
        <meshPhongMaterial color={tint(color,-0.18)} flatShading />
      </mesh>
      <mesh castShadow position={[0,0.65,0]}>
        <boxGeometry args={[0.52,1.04,0.52]} />
        <meshPhongMaterial color={color} flatShading shininess={30} specular="#8888ff" />
      </mesh>
      <mesh castShadow position={[0.32,0.44,0]}>
        <boxGeometry args={[0.24,0.72,0.32]} />
        <meshPhongMaterial color={tint(color,0.08)} flatShading shininess={20} />
      </mesh>
      {milestone && (
        <mesh castShadow position={[-0.26,0.38,0]}>
          <boxGeometry args={[0.2,0.60,0.28]} />
          <meshPhongMaterial color={tint(color,0.12)} flatShading />
        </mesh>
      )}
      <mesh castShadow position={[0,1.26,0]}>
        <cylinderGeometry args={[0.025,0.025,0.36,4]} />
        <meshPhongMaterial color="#ccd8ff" flatShading />
      </mesh>
      <mesh ref={antennaRef} position={[0,1.46,0]}>
        <sphereGeometry args={[0.05,5,4]} />
        <meshPhongMaterial color={milestone ? '#ff4488' : '#ff8800'} emissive={milestone ? '#ff2266' : '#ff6600'} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0,0.58,0.27]}>
        <boxGeometry args={[0.38,0.62,0.01]} />
        <meshPhongMaterial color="#fffbe0" emissive="#ffdd80" emissiveIntensity={milestone ? 1.6 : 0.9} transparent opacity={0.92} />
      </mesh>
    </group>
  );
}

// ─── Butterfly (milestone creature at 30-day streak) ─────────────────────────
function Butterfly({ pos, index }: { pos:[number,number,number]; index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const wingRef  = useRef<THREE.Group>(null);
  const colors = ['#ff88cc','#88ccff','#ffcc44','#aaffaa','#cc88ff'];
  const col = colors[index % colors.length];

  useFrame(({ clock }) => {
    if (!groupRef.current || !wingRef.current) return;
    const t = clock.elapsedTime;
    const angle = t * 0.38 + (index / 5) * Math.PI * 2;
    const r = 2.05 + Math.sin(t * 0.7 + index) * 0.12;
    const yBob = Math.sin(t * 0.9 + index * 1.3) * 0.28;
    groupRef.current.position.set(Math.cos(angle)*r, yBob, Math.sin(angle)*r);
    groupRef.current.rotation.y = angle + Math.PI/2;
    wingRef.current.rotation.z = Math.sin(t * 9 + index) * 0.55;
  });

  return (
    <group ref={groupRef}>
      <group ref={wingRef}>
        {/* upper wings */}
        <mesh position={[0.2, 0.06, 0]} rotation={[0, 0, 0.25]}>
          <planeGeometry args={[0.32, 0.26]} />
          <meshPhongMaterial color={col} transparent opacity={0.88} side={THREE.DoubleSide} shininess={60} emissive={col} emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[-0.2, 0.06, 0]} rotation={[0, 0, -0.25]}>
          <planeGeometry args={[0.32, 0.26]} />
          <meshPhongMaterial color={col} transparent opacity={0.88} side={THREE.DoubleSide} shininess={60} emissive={col} emissiveIntensity={0.25} />
        </mesh>
        {/* lower wings */}
        <mesh position={[0.16, -0.1, 0]} rotation={[0, 0, 0.5]}>
          <planeGeometry args={[0.2, 0.16]} />
          <meshPhongMaterial color={col} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.16, -0.1, 0]} rotation={[0, 0, -0.5]}>
          <planeGeometry args={[0.2, 0.16]} />
          <meshPhongMaterial color={col} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* body */}
      <mesh>
        <capsuleGeometry args={[0.025, 0.16, 4, 6]} />
        <meshPhongMaterial color="#442200" flatShading />
      </mesh>
      {/* antennae */}
      <mesh position={[0.04, 0.14, 0]} rotation={[0, 0, 0.4]}>
        <capsuleGeometry args={[0.008, 0.1, 3, 4]} />
        <meshPhongMaterial color="#663300" flatShading />
      </mesh>
      <mesh position={[-0.04, 0.14, 0]} rotation={[0, 0, -0.4]}>
        <capsuleGeometry args={[0.008, 0.1, 3, 4]} />
        <meshPhongMaterial color="#663300" flatShading />
      </mesh>
    </group>
  );
}

// ─── Animal (deer / critter at 30-day milestone) ──────────────────────────────
function Animal({ pos, index }: { pos:[number,number,number]; index: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    // gentle idle bob
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.4 + index * 2.1) * 0.6;
  });

  const bodyColor = ['#d4a467','#b8856a','#c49a6c','#e8c49a'][index % 4];

  return (
    <group position={pos} quaternion={q} scale={0.32}>
      <group ref={groupRef}>
        {/* body */}
        <mesh castShadow position={[0, 0.38, 0]}>
          <capsuleGeometry args={[0.18, 0.38, 4, 8]} />
          <meshPhongMaterial color={bodyColor} flatShading />
        </mesh>
        {/* neck */}
        <mesh castShadow position={[0.08, 0.72, 0]} rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.1, 0.22, 4, 6]} />
          <meshPhongMaterial color={bodyColor} flatShading />
        </mesh>
        {/* head */}
        <mesh castShadow position={[0.2, 0.92, 0]}>
          <sphereGeometry args={[0.16, 6, 5]} />
          <meshPhongMaterial color={bodyColor} flatShading />
        </mesh>
        {/* snout */}
        <mesh castShadow position={[0.34, 0.88, 0]}>
          <sphereGeometry args={[0.09, 5, 4]} />
          <meshPhongMaterial color="#e8b090" flatShading />
        </mesh>
        {/* eyes */}
        <mesh position={[0.3, 0.96, 0.09]}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshPhongMaterial color="#111111" />
        </mesh>
        <mesh position={[0.3, 0.96, -0.09]}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshPhongMaterial color="#111111" />
        </mesh>
        {/* ears */}
        <mesh position={[0.15, 1.1, 0.1]} rotation={[0.2, 0, -0.5]}>
          <coneGeometry args={[0.05, 0.14, 4]} />
          <meshPhongMaterial color={bodyColor} flatShading />
        </mesh>
        <mesh position={[0.15, 1.1, -0.1]} rotation={[-0.2, 0, -0.5]}>
          <coneGeometry args={[0.05, 0.14, 4]} />
          <meshPhongMaterial color={bodyColor} flatShading />
        </mesh>
        {/* antlers (only for every other) */}
        {index % 2 === 0 && (
          <>
            <mesh position={[0.12, 1.22, 0.07]} rotation={[0.4, 0, -0.3]}>
              <cylinderGeometry args={[0.015, 0.02, 0.22, 4]} />
              <meshPhongMaterial color="#8b6340" flatShading />
            </mesh>
            <mesh position={[0.12, 1.22, -0.07]} rotation={[-0.4, 0, -0.3]}>
              <cylinderGeometry args={[0.015, 0.02, 0.22, 4]} />
              <meshPhongMaterial color="#8b6340" flatShading />
            </mesh>
          </>
        )}
        {/* legs */}
        {[[-0.12,0,-0.1],[-0.12,0,0.1],[0.12,0,-0.1],[0.12,0,0.1]].map(([x,_,z],i) => (
          <mesh key={i} castShadow position={[x, 0.1, z]}>
            <capsuleGeometry args={[0.04, 0.24, 3, 5]} />
            <meshPhongMaterial color={bodyColor} flatShading />
          </mesh>
        ))}
        {/* tail */}
        <mesh position={[-0.2, 0.44, 0]}>
          <sphereGeometry args={[0.06, 5, 4]} />
          <meshPhongMaterial color="#f5f0e8" flatShading />
        </mesh>
      </group>
    </group>
  );
}

// ─── GlowingPlant (100-day milestone) ────────────────────────────────────────
function GlowingPlant({ pos, index }: { pos:[number,number,number]; index: number }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  const petalRef = useRef<THREE.Group>(null);
  const glowRef  = useRef<THREE.Mesh>(null);

  const hues = ['#a0f0a0','#80ffcc','#c0ff80','#a8ffdd','#d0ffb0'];
  const col  = hues[index % hues.length];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + index * 1.7;
    if (petalRef.current) petalRef.current.rotation.y = t * 0.8;
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshPhongMaterial;
      mat.opacity = 0.18 + Math.sin(t * 2.2) * 0.1;
      mat.emissiveIntensity = 0.4 + Math.sin(t * 2.2) * 0.2;
    }
  });

  return (
    <group position={pos} quaternion={q} scale={0.28}>
      {/* stem */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.045, 0.06, 0.6, 5]} />
        <meshPhongMaterial color="#2db830" flatShading emissive="#50ee60" emissiveIntensity={0.3} />
      </mesh>
      {/* petals */}
      <group ref={petalRef} position={[0, 0.72, 0]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} castShadow position={[Math.cos(a)*0.28, 0, Math.sin(a)*0.28]}>
              <sphereGeometry args={[0.14, 6, 5]} />
              <meshPhongMaterial color={col} flatShading emissive={col} emissiveIntensity={0.5} shininess={40} />
            </mesh>
          );
        })}
        {/* centre */}
        <mesh castShadow>
          <sphereGeometry args={[0.2, 7, 6]} />
          <meshPhongMaterial color="#ffffaa" flatShading emissive="#ffff44" emissiveIntensity={0.8} shininess={60} />
        </mesh>
      </group>
      {/* outer glow sphere */}
      <mesh ref={glowRef} position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.6, 12, 8]} />
        <meshPhongMaterial color={col} transparent opacity={0.22} depthWrite={false} side={THREE.BackSide} emissive={col} emissiveIntensity={0.4} />
      </mesh>
      {/* ground ring glow */}
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.14, 0.48, 12]} />
        <meshPhongMaterial color={col} transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} emissive={col} emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

// ─── Sparkle particles ────────────────────────────────────────────────────────
function SparkleParticles({ position }: { position: [number,number,number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() =>
    Array.from({ length: 18 }, () => ({
      vel: new THREE.Vector3(
        (Math.random()-0.5)*2.4,
        Math.random()*2.8 + 0.6,
        (Math.random()-0.5)*2.4
      ),
      color: ['#ffe566','#ff88cc','#88ffcc','#aaddff','#ffaa44'][Math.floor(Math.random()*5)],
      size: 0.04 + Math.random()*0.06,
    })), []);

  const posRefs = useRef(particles.map(() => new THREE.Vector3(...position)));
  const ageRef  = useRef(0);

  useFrame((_, delta) => {
    ageRef.current += delta;
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const p = posRefs.current[i];
      p.addScaledVector(particles[i].vel, delta);
      particles[i].vel.y -= delta * 3; // gravity
      child.position.copy(p);
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshPhongMaterial;
      mat.opacity = Math.max(0, 1 - ageRef.current / 1.4);
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={position}>
          <octahedronGeometry args={[p.size, 0]} />
          <meshPhongMaterial color={p.color} transparent opacity={1} emissive={p.color} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Grow-in wrapper ──────────────────────────────────────────────────────────
function GrowIn({ children, active }: { children: React.ReactNode; active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const t   = useRef(active ? 0 : 1);

  useFrame((_, delta) => {
    if (!ref.current || t.current >= 1) return;
    t.current = Math.min(t.current + delta * 2.2, 1);
    // cubic ease-out with slight overshoot
    const p = t.current;
    const ease = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;
    ref.current.scale.setScalar(ease * (1 + 0.12 * Math.sin(p * Math.PI)));
  });

  return <group ref={ref} scale={active ? 0 : 1}>{children}</group>;
}

// ─── Camera zoom pulse on new object ─────────────────────────────────────────
function CameraZoomPulse({ active }: { active: boolean }) {
  const { camera } = useThree();
  const pulseRef = useRef(0);
  const baseZ    = useRef(camera.position.z);

  useEffect(() => {
    if (active) {
      pulseRef.current = 1;
      baseZ.current = camera.position.z;
    }
  }, [active, camera]);

  useFrame((_, delta) => {
    if (pulseRef.current <= 0) return;
    pulseRef.current = Math.max(0, pulseRef.current - delta * 1.8);
    const ease = Math.sin(pulseRef.current * Math.PI);
    camera.position.z = baseZ.current - ease * 0.4;
  });

  return null;
}

// ─── Floating planet group ────────────────────────────────────────────────────
function FloatingPlanet({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.48) * 0.1;
    ref.current.rotation.y += 0.0015;
  });
  return <group ref={ref}>{children}</group>;
}

// ─── Planet object dispatch ───────────────────────────────────────────────────
function PlanetObjectMesh({ obj, isNew }: { obj: PlanetObject; isNew: boolean }) {
  const props = { pos: obj.position, scale: obj.scale, color: obj.color, milestone: obj.milestone };
  const mesh = {
    tree:     <Tree     {...props} />,
    flower:   <Flower   {...props} />,
    mountain: <Mountain {...props} />,
    building: <Building {...props} />,
  } as Record<HabitType, JSX.Element>;

  return <GrowIn active={isNew}>{mesh[obj.type]}</GrowIn>;
}

// ─── Main exported scene ──────────────────────────────────────────────────────
interface PlanetSceneProps {
  planetObjects: PlanetObject[];
  newObjectId: string | null;
  sparklePos: [number,number,number] | null;
  longestStreak: number;
}

export function PlanetScene({ planetObjects, newObjectId, sparklePos, longestStreak }: PlanetSceneProps) {
  const [sparkleKey, setSparkleKey] = useState(0);

  useEffect(() => {
    if (sparklePos) setSparkleKey(k => k+1);
  }, [sparklePos]);

  // determine if butterfly milestone reached (30-day streak)
  const hasButterflyMilestone = longestStreak >= 30;
  const butterflies = useMemo(() => {
    if (!hasButterflyMilestone) return [];
    return Array.from({ length: 3 }, (_, i) => ({
      id: i,
      pos: [
        Math.cos((i/3)*Math.PI*2)*1.6,
        (Math.random()-0.5)*0.8,
        Math.sin((i/3)*Math.PI*2)*1.6,
      ] as [number,number,number],
    }));
  }, [hasButterflyMilestone]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} color="#b8d8ff" />
      <directionalLight
        position={[7, 10, 5]}
        intensity={2.2}
        color="#fff5d0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.001}
      />
      <directionalLight position={[-6,-3,-7]} intensity={0.3} color="#1833a0" />
      <directionalLight position={[0,0,-9]}   intensity={0.5} color="#5599ff" />
      <pointLight       position={[0,-5,2]}   intensity={0.5} color="#30ee80" distance={12} />

      {/* Deep space stars */}
      <Stars radius={90} depth={60} count={4000} factor={4} saturation={0.8} fade speed={0.8} />

      {/* Sparkle burst */}
      {sparklePos && <SparkleParticles key={sparkleKey} position={sparklePos} />}

      {/* Camera pulse */}
      <CameraZoomPulse active={!!newObjectId} />

      {/* Butterflies */}
      {butterflies.map(b => <Butterfly key={b.id} pos={b.pos} />)}

      <OrbitControls
        enablePan={false}
        minDistance={3.0}
        maxDistance={9}
        rotateSpeed={0.55}
        zoomSpeed={0.5}
        enableDamping
        dampingFactor={0.06}
      />

      <FloatingPlanet>
        <Planet />
        {planetObjects.map(obj => (
          <PlanetObjectMesh key={obj.id} obj={obj} isNew={obj.id === newObjectId} />
        ))}
      </FloatingPlanet>
    </>
  );
}
