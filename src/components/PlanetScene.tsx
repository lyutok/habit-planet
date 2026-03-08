import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { PlanetObject } from '@/types/habits';

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

// ═══════════════════════════════════════════════════════════════════
// TREE VARIANTS
// ═══════════════════════════════════════════════════════════════════

// ─── Pine (default conifer — original Tree) ───────────────────────
function Pine({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
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
      {milestone && (
        <mesh ref={glowRef} position={[0,1.2,0]}>
          <sphereGeometry args={[0.7,12,8]} />
          <meshPhongMaterial color={color} transparent opacity={0.25} depthWrite={false} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

// ─── Palm (🎓 — learning/graduation) ──────────────────────────────
function Palm({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  return (
    <group position={pos} quaternion={q} scale={scale}>
      {/* trunk — curved via a tilted cylinder stack */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.6, 7]} />
        <meshPhongMaterial color="#8b5e2a" flatShading />
      </mesh>
      <mesh castShadow position={[0.06, 0.9, 0]} rotation={[0,0,0.07]}>
        <cylinderGeometry args={[0.085, 0.1, 0.65, 7]} />
        <meshPhongMaterial color="#9b6e35" flatShading />
      </mesh>
      <mesh castShadow position={[0.12, 1.5, 0]} rotation={[0,0,0.14]}>
        <cylinderGeometry args={[0.065, 0.085, 0.65, 7]} />
        <meshPhongMaterial color="#9b6e35" flatShading />
      </mesh>
      {/* fronds */}
      {Array.from({length:6}).map((_,i) => {
        const a = (i/6)*Math.PI*2;
        return (
          <mesh key={i} castShadow position={[0.14+Math.cos(a)*0.35, 1.82, Math.sin(a)*0.35]} rotation={[Math.cos(a)*0.7, a, Math.sin(a)*0.5]}>
            <boxGeometry args={[0.48, 0.05, 0.1]} />
            <meshPhongMaterial color={milestone ? tint(color,0.2) : color} flatShading shininess={18} />
          </mesh>
        );
      })}
      {/* coconuts */}
      {[0.05, 0.18, -0.1].map((x,i) => (
        <mesh key={i} castShadow position={[0.14+x, 1.68, i*0.08-0.06]}>
          <sphereGeometry args={[0.09, 5, 4]} />
          <meshPhongMaterial color="#5a3010" flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ─── Oak (📖/🔬 — round canopy) ────────────────────────────────────
function Oak({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (glowRef.current && milestone) {
      (glowRef.current.material as THREE.MeshPhongMaterial).opacity = 0.18 + Math.sin(clock.elapsedTime*1.5)*0.09;
    }
  });
  return (
    <group position={pos} quaternion={q} scale={scale}>
      <mesh castShadow position={[0,0.06,0]}>
        <cylinderGeometry args={[0.15,0.2,0.12,6]} />
        <meshPhongMaterial color="#5a2d0c" flatShading />
      </mesh>
      <mesh castShadow position={[0,0.7,0]}>
        <cylinderGeometry args={[0.1,0.15,1.2,6]} />
        <meshPhongMaterial color="#6b3510" flatShading />
      </mesh>
      {/* round canopy clusters */}
      {[
        [0,1.55,0,0.62],[-0.3,1.35,0.2,0.42],[0.3,1.35,-0.15,0.44],
        [-0.25,1.6,-0.2,0.38],[0.2,1.65,0.25,0.36],[0,1.8,0,0.32],
      ].map(([x,y,z,r],i) => (
        <mesh key={i} castShadow position={[x,y,z]}>
          <sphereGeometry args={[r,6,5]} />
          <meshPhongMaterial color={i%2===0?color:tint(color,0.08)} flatShading shininess={8} />
        </mesh>
      ))}
      {milestone && (
        <mesh ref={glowRef} position={[0,1.6,0]}>
          <sphereGeometry args={[0.85,10,8]} />
          <meshPhongMaterial color={color} transparent opacity={0.18} depthWrite={false} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

// ─── Cactus (🧠 — resilience) ──────────────────────────────────────
function Cactus({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  return (
    <group position={pos} quaternion={q} scale={scale}>
      {/* main trunk */}
      <mesh castShadow position={[0,0.7,0]}>
        <cylinderGeometry args={[0.2,0.22,1.4,8]} />
        <meshPhongMaterial color={color} flatShading shininess={12} />
      </mesh>
      {/* top rounded cap */}
      <mesh castShadow position={[0,1.42,0]}>
        <sphereGeometry args={[0.21,7,6]} />
        <meshPhongMaterial color={tint(color,0.1)} flatShading />
      </mesh>
      {/* left arm */}
      <mesh castShadow position={[-0.38,0.9,0]} rotation={[0,0,-Math.PI/2.2]}>
        <cylinderGeometry args={[0.12,0.14,0.55,7]} />
        <meshPhongMaterial color={color} flatShading />
      </mesh>
      <mesh castShadow position={[-0.6,1.08,0]}>
        <cylinderGeometry args={[0.11,0.12,0.4,7]} />
        <meshPhongMaterial color={tint(color,0.06)} flatShading />
      </mesh>
      {/* right arm */}
      <mesh castShadow position={[0.38,1.05,0]} rotation={[0,0,Math.PI/2.4]}>
        <cylinderGeometry args={[0.12,0.13,0.45,7]} />
        <meshPhongMaterial color={color} flatShading />
      </mesh>
      <mesh castShadow position={[0.58,1.22,0]}>
        <cylinderGeometry args={[0.1,0.12,0.35,7]} />
        <meshPhongMaterial color={tint(color,0.06)} flatShading />
      </mesh>
      {milestone && (
        <mesh castShadow position={[0,1.62,0]}>
          <sphereGeometry args={[0.16,6,5]} />
          <meshPhongMaterial color="#ff88bb" flatShading emissive="#ff44aa" emissiveIntensity={0.6} />
        </mesh>
      )}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FLOWER VARIANTS
// ═══════════════════════════════════════════════════════════════════

// ─── Daisy (default — original Flower) ───────────────────────────
function Daisy({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
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

// ─── Tulip (💆/💜 — cup-shaped) ────────────────────────────────────
function Tulip({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  return (
    <group position={pos} quaternion={q} scale={scale}>
      {/* stem */}
      <mesh castShadow position={[0,0.45,0]}>
        <cylinderGeometry args={[0.04,0.05,0.9,6]} />
        <meshPhongMaterial color="#2d8a40" flatShading />
      </mesh>
      {/* leaf */}
      <mesh castShadow position={[-0.18,0.36,0]} rotation={[0,0,0.6]}>
        <boxGeometry args={[0.28,0.06,0.04]} />
        <meshPhongMaterial color="#38a050" flatShading />
      </mesh>
      {/* cup petals */}
      {Array.from({length:5}).map((_,i) => {
        const a = (i/5)*Math.PI*2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a)*0.18, 1.05, Math.sin(a)*0.18]}>
            <capsuleGeometry args={[0.1, 0.28, 4, 7]} />
            <meshPhongMaterial color={i%2===0?color:tint(color,0.1)} flatShading shininess={22}
              emissive={milestone?color:'#000'} emissiveIntensity={milestone?0.35:0} />
          </mesh>
        );
      })}
      {/* inner center */}
      <mesh castShadow position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.14, 6, 5]} />
        <meshPhongMaterial color={tint(color,-0.1)} flatShading />
      </mesh>
    </group>
  );
}

// ─── Lotus (🧘/🫁 — floating pad) ─────────────────────────────────
function Lotus({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  const spinRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (spinRef.current) spinRef.current.rotation.y = clock.elapsedTime * 0.4;
  });
  return (
    <group position={pos} quaternion={q} scale={scale}>
      {/* pad */}
      <mesh castShadow position={[0,0.04,0]}>
        <cylinderGeometry args={[0.52,0.5,0.06,10]} />
        <meshPhongMaterial color="#2d8a40" flatShading />
      </mesh>
      <group ref={spinRef} position={[0, 0.28, 0]}>
        {/* outer petals */}
        {Array.from({length:8}).map((_,i) => {
          const a = (i/8)*Math.PI*2;
          return (
            <mesh key={i} castShadow position={[Math.cos(a)*0.32, 0, Math.sin(a)*0.32]}>
              <capsuleGeometry args={[0.08, 0.26, 3, 6]} />
              <meshPhongMaterial color={color} flatShading shininess={28}
                emissive={milestone?color:'#000'} emissiveIntensity={milestone?0.4:0} />
            </mesh>
          );
        })}
        {/* inner petals */}
        {Array.from({length:5}).map((_,i) => {
          const a = (i/5)*Math.PI*2 + 0.3;
          return (
            <mesh key={i} castShadow position={[Math.cos(a)*0.16, 0.14, Math.sin(a)*0.16]}>
              <capsuleGeometry args={[0.07, 0.18, 3, 5]} />
              <meshPhongMaterial color={tint(color,0.12)} flatShading shininess={30} />
            </mesh>
          );
        })}
        {/* stamen */}
        <mesh castShadow position={[0,0.26,0]}>
          <sphereGeometry args={[0.1,6,5]} />
          <meshPhongMaterial color="#ffe060" flatShading emissive="#ffcc00" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Sunflower (🕯️ — tall with big head) ──────────────────────────
function Sunflower({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  return (
    <group position={pos} quaternion={q} scale={scale}>
      {/* tall stem */}
      <mesh castShadow position={[0,0.75,0]}>
        <cylinderGeometry args={[0.055,0.07,1.5,7]} />
        <meshPhongMaterial color="#3d9e3d" flatShading />
      </mesh>
      {/* leaves */}
      {[0.5,0.9].map((y,i) => (
        <mesh key={i} castShadow position={[i%2===0?0.22:-0.22, y, 0]} rotation={[0,0,i%2===0?0.7:-0.7]}>
          <boxGeometry args={[0.3,0.07,0.05]} />
          <meshPhongMaterial color="#38a050" flatShading />
        </mesh>
      ))}
      {/* ray petals */}
      {Array.from({length:12}).map((_,i) => {
        const a = (i/12)*Math.PI*2;
        return (
          <mesh key={i} castShadow position={[Math.cos(a)*0.4, 1.58, Math.sin(a)*0.4]}>
            <capsuleGeometry args={[0.07,0.22,3,5]} />
            <meshPhongMaterial color="#ffcc00" flatShading shininess={30}
              emissive={milestone?'#ffaa00':'#000'} emissiveIntensity={milestone?0.5:0} />
          </mesh>
        );
      })}
      {/* disk */}
      <mesh castShadow position={[0,1.58,0]}>
        <cylinderGeometry args={[0.24,0.24,0.1,10]} />
        <meshPhongMaterial color="#5a2d0c" flatShading />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MOUNTAIN VARIANTS
// ═══════════════════════════════════════════════════════════════════

// ─── Peak (🏃 — classic snowy mountain, original Mountain) ────────
function Peak({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
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
        <meshPhongMaterial color={milestone ? '#a0eeff' : '#f4faff'} flatShading shininess={60}
          emissive={milestone ? '#60ddff' : '#000000'} emissiveIntensity={milestone ? 0.5 : 0} />
      </mesh>
    </group>
  );
}

// ─── Hill (🚴/⚽ — gentle rolling hill) ────────────────────────────
function Hill({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  return (
    <group position={pos} quaternion={q} scale={scale}>
      {/* wide base */}
      <mesh castShadow position={[0,0.2,0]}>
        <sphereGeometry args={[0.82,8,5]} />
        <meshPhongMaterial color={tint(color,-0.08)} flatShading />
      </mesh>
      {/* main hill */}
      <mesh castShadow position={[0,0.52,0]}>
        <sphereGeometry args={[0.62,8,6]} />
        <meshPhongMaterial color={color} flatShading shininess={10} />
      </mesh>
      {/* top rounded cap */}
      <mesh castShadow position={[0,0.9,0]}>
        <sphereGeometry args={[0.32,7,5]} />
        <meshPhongMaterial color={tint(color,0.1)} flatShading />
      </mesh>
      {/* little tree on top if milestone */}
      {milestone && (
        <mesh castShadow position={[0,1.28,0]}>
          <coneGeometry args={[0.18,0.4,6]} />
          <meshPhongMaterial color="#2d8a4e" flatShading emissive="#3da85f" emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  );
}

// ─── Glacier (🏊 — swimming/ice) ───────────────────────────────────
function Glacier({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  const shimRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (shimRef.current) {
      (shimRef.current.material as THREE.MeshPhongMaterial).opacity =
        0.35 + Math.sin(clock.elapsedTime * 1.8) * 0.12;
    }
  });
  return (
    <group position={pos} quaternion={q} scale={scale}>
      {/* base ice shelf */}
      <mesh castShadow position={[0,0.08,0]}>
        <boxGeometry args={[1.1,0.16,0.8]} />
        <meshPhongMaterial color="#a8ddf8" flatShading shininess={60} specular="#ffffff" />
      </mesh>
      {/* main iceberg */}
      <mesh castShadow position={[0,0.55,0]}>
        <octahedronGeometry args={[0.58,1]} />
        <meshPhongMaterial color="#c8eeff" flatShading shininess={80} specular="#ffffff" />
      </mesh>
      {/* smaller spire */}
      <mesh castShadow position={[0.3,0.72,0.1]}>
        <octahedronGeometry args={[0.3,0]} />
        <meshPhongMaterial color="#ddf4ff" flatShading shininess={80} />
      </mesh>
      {/* shimmer overlay */}
      <mesh ref={shimRef} position={[0,0.55,0]}>
        <sphereGeometry args={[0.65,10,8]} />
        <meshPhongMaterial color="#ffffff" transparent opacity={0.35} depthWrite={false}
          side={THREE.FrontSide} shininess={100}
          emissive={milestone?'#88ccff':'#44aaff'} emissiveIntensity={milestone?0.5:0.2} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// BUILDING VARIANTS
// ═══════════════════════════════════════════════════════════════════

// ─── Tower (💻/🚀 — original Building) ─────────────────────────────
function Tower({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
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

// ─── Skyscraper (🎯/📊 — tall glass tower) ─────────────────────────
function Skyscraper({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  const tipRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (tipRef.current) {
      (tipRef.current.material as THREE.MeshPhongMaterial).emissiveIntensity =
        0.5 + Math.sin(clock.elapsedTime*3)*0.3;
    }
  });
  return (
    <group position={pos} quaternion={q} scale={scale}>
      {/* wide base */}
      <mesh castShadow position={[0,0.08,0]}>
        <boxGeometry args={[0.7,0.16,0.7]} />
        <meshPhongMaterial color={tint(color,-0.2)} flatShading />
      </mesh>
      {/* mid section */}
      <mesh castShadow position={[0,0.6,0]}>
        <boxGeometry args={[0.56,0.96,0.56]} />
        <meshPhongMaterial color={color} flatShading shininess={50} specular="#aaaaff" />
      </mesh>
      {/* upper section */}
      <mesh castShadow position={[0,1.22,0]}>
        <boxGeometry args={[0.4,0.56,0.4]} />
        <meshPhongMaterial color={tint(color,0.1)} flatShading shininess={60} specular="#ccccff" />
      </mesh>
      {/* glass facade */}
      <mesh position={[0,0.6,0.285]}>
        <boxGeometry args={[0.48,0.88,0.01]} />
        <meshPhongMaterial color="#aaddff" emissive="#88ccff" emissiveIntensity={milestone?1.4:0.7} transparent opacity={0.85} />
      </mesh>
      {/* spire */}
      <mesh castShadow position={[0,1.58,0]}>
        <coneGeometry args={[0.06,0.42,5]} />
        <meshPhongMaterial color="#ccd8ff" flatShading />
      </mesh>
      <mesh ref={tipRef} position={[0,1.82,0]}>
        <sphereGeometry args={[0.04,5,4]} />
        <meshPhongMaterial color={milestone?'#ff44aa':'#ff8844'} emissive={milestone?'#ff22aa':'#ff6622'} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ─── Dome (🎨 — creative/art) ───────────────────────────────────────
function Dome({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (glowRef.current && milestone) {
      (glowRef.current.material as THREE.MeshPhongMaterial).opacity =
        0.25 + Math.sin(clock.elapsedTime*1.6)*0.12;
    }
  });
  return (
    <group position={pos} quaternion={q} scale={scale}>
      {/* base cylinder */}
      <mesh castShadow position={[0,0.2,0]}>
        <cylinderGeometry args={[0.55,0.58,0.4,10]} />
        <meshPhongMaterial color={tint(color,-0.15)} flatShading />
      </mesh>
      {/* dome */}
      <mesh castShadow position={[0,0.56,0]}>
        <sphereGeometry args={[0.55,10,8,0,Math.PI*2,0,Math.PI/2]} />
        <meshPhongMaterial color={color} flatShading shininess={50} specular="#ccaaff" />
      </mesh>
      {/* windows ring */}
      {Array.from({length:6}).map((_,i) => {
        const a = (i/6)*Math.PI*2;
        return (
          <mesh key={i} position={[Math.cos(a)*0.56,0.22,Math.sin(a)*0.56]}>
            <boxGeometry args={[0.1,0.2,0.02]} />
            <meshPhongMaterial color="#fffbe0" emissive="#ffdd88"
              emissiveIntensity={milestone?1.8:1.0} transparent opacity={0.9} />
          </mesh>
        );
      })}
      {/* golden top */}
      <mesh castShadow position={[0,1.1,0]}>
        <sphereGeometry args={[0.1,6,5]} />
        <meshPhongMaterial color="#f0c040" flatShading emissive="#ffaa00" emissiveIntensity={0.5} />
      </mesh>
      {milestone && (
        <mesh ref={glowRef} position={[0,0.56,0]}>
          <sphereGeometry args={[0.7,10,8]} />
          <meshPhongMaterial color={color} transparent opacity={0.25} depthWrite={false} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
}

// ─── Cabin (🔧 — hands-on/maker) ────────────────────────────────────
function Cabin({ pos, scale, color, milestone }: { pos:[number,number,number]; scale:number; color:string; milestone?:boolean }) {
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0,1,0), new THREE.Vector3(...pos).normalize()
  ), [pos]);
  return (
    <group position={pos} quaternion={q} scale={scale}>
      {/* body */}
      <mesh castShadow position={[0,0.36,0]}>
        <boxGeometry args={[0.76,0.72,0.64]} />
        <meshPhongMaterial color="#8b5e2a" flatShading />
      </mesh>
      {/* roof */}
      <mesh castShadow position={[0,0.84,0]}>
        <coneGeometry args={[0.6,0.5,4]} />
        <meshPhongMaterial color={color} flatShading shininess={8} />
      </mesh>
      {/* door */}
      <mesh position={[0,0.24,0.33]}>
        <boxGeometry args={[0.18,0.32,0.01]} />
        <meshPhongMaterial color="#5a2d0c" flatShading />
      </mesh>
      {/* window */}
      <mesh position={[0.24,0.42,0.33]}>
        <boxGeometry args={[0.16,0.16,0.01]} />
        <meshPhongMaterial color="#fffbe0" emissive="#ffdd80"
          emissiveIntensity={milestone?1.8:0.8} transparent opacity={0.9} />
      </mesh>
      {/* chimney */}
      <mesh castShadow position={[0.22,1.12,0]}>
        <boxGeometry args={[0.14,0.32,0.14]} />
        <meshPhongMaterial color="#7a4030" flatShading />
      </mesh>
      {milestone && (
        <mesh position={[0.22,1.3,0]}>
          <sphereGeometry args={[0.08,5,4]} />
          <meshPhongMaterial color="#ff8840" emissive="#ff5500" emissiveIntensity={1.0} />
        </mesh>
      )}
    </group>
  );
}

// ─── Butterfly (milestone creature at 30-day streak) ─────────────────────────
// Wing shape built from multiple overlapping ellipsoids for an organic silhouette
function ButterflyWing({ side, col, spotCol }: { side: 1 | -1; col: string; spotCol: string }) {
  const s = side;
  return (
    <group>
      {/* large upper lobe */}
      <mesh position={[s * 0.22, 0.05, 0]} rotation={[0, 0, s * 0.18]} scale={[1, 0.72, 0.08]}>
        <sphereGeometry args={[0.28, 8, 6]} />
        <meshPhongMaterial color={col} transparent opacity={0.92} side={THREE.DoubleSide}
          shininess={80} specular="#ffffff" emissive={col} emissiveIntensity={0.18} depthWrite={false} />
      </mesh>
      {/* secondary upper lobe (forward sweep) */}
      <mesh position={[s * 0.32, 0.14, 0]} rotation={[0, 0, s * 0.5]} scale={[0.7, 0.5, 0.07]}>
        <sphereGeometry args={[0.22, 7, 5]} />
        <meshPhongMaterial color={col} transparent opacity={0.80} side={THREE.DoubleSide}
          shininess={60} depthWrite={false} />
      </mesh>
      {/* lower hind-wing lobe */}
      <mesh position={[s * 0.18, -0.14, 0]} rotation={[0, 0, s * -0.22]} scale={[0.9, 0.65, 0.07]}>
        <sphereGeometry args={[0.2, 7, 5]} />
        <meshPhongMaterial color={col} transparent opacity={0.82} side={THREE.DoubleSide}
          shininess={50} depthWrite={false} />
      </mesh>
      {/* tail curl on lower wing */}
      <mesh position={[s * 0.28, -0.22, 0]} rotation={[0, 0, s * -0.55]} scale={[0.55, 0.38, 0.06]}>
        <sphereGeometry args={[0.14, 6, 4]} />
        <meshPhongMaterial color={col} transparent opacity={0.72} side={THREE.DoubleSide}
          depthWrite={false} />
      </mesh>
      {/* wing spot — inner circle */}
      <mesh position={[s * 0.24, 0.06, 0.01]} scale={[1, 0.75, 0.06]}>
        <sphereGeometry args={[0.09, 6, 5]} />
        <meshPhongMaterial color={spotCol} transparent opacity={0.85} side={THREE.DoubleSide}
          emissive={spotCol} emissiveIntensity={0.6} depthWrite={false} />
      </mesh>
      {/* wing spot — tiny outer dot */}
      <mesh position={[s * 0.34, 0.12, 0.01]} scale={[1, 0.75, 0.06]}>
        <sphereGeometry args={[0.045, 5, 4]} />
        <meshPhongMaterial color={spotCol} transparent opacity={0.7} side={THREE.DoubleSide}
          emissive={spotCol} emissiveIntensity={0.5} depthWrite={false} />
      </mesh>
      {/* veins — thin dark lines on upper wing */}
      <mesh position={[s * 0.18, 0.02, 0.005]} rotation={[0, 0, s * 0.25]} scale={[1, 0.06, 0.04]}>
        <sphereGeometry args={[0.22, 5, 3]} />
        <meshPhongMaterial color="#220011" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Butterfly({ pos, index }: { pos:[number,number,number]; index: number }) {
  const groupRef  = useRef<THREE.Group>(null);
  const wingRef   = useRef<THREE.Group>(null);
  const trailRef  = useRef<THREE.Mesh>(null);

  const palettes = [
    { wing: '#ff77bb', spot: '#ffe0f5', body: '#550033' },
    { wing: '#66bbff', spot: '#ddf4ff', body: '#002244' },
    { wing: '#ffcc33', spot: '#fffbcc', body: '#443300' },
    { wing: '#88ff99', spot: '#ddffee', body: '#004422' },
    { wing: '#cc88ff', spot: '#f0e0ff', body: '#330055' },
  ];
  const { wing: col, spot: spotCol, body: bodyCol } = palettes[index % palettes.length];

  useFrame(({ clock }) => {
    if (!groupRef.current || !wingRef.current) return;
    const t = clock.elapsedTime;
    // Orbital path — fixed radius, up-and-down bobbing movement
    const speed  = 0.28 + index * 0.04;
    const angle  = t * speed + (index / 5) * Math.PI * 2;
    const r      = 2.12 + Math.sin(t * 0.55 + index * 1.7) * 0.18;
    const yBob   = Math.sin(t * 0.9 + index * 1.4) * 0.65 + Math.sin(t * 0.3 + index) * 0.25;
    groupRef.current.position.set(Math.cos(angle) * r, yBob, Math.sin(angle) * r);
    // Face forward along orbit
    groupRef.current.rotation.y = angle + Math.PI / 2;
    // Gentle pitch following up-down motion
    groupRef.current.rotation.x = Math.sin(t * 0.9 + index * 1.4) * 0.22;
    // Wing flap — slowed by 50%
    const flapSpeed = 5.5 + Math.sin(t * 0.3 + index) * 1.5;
    const flapAmp   = 0.62 + Math.sin(t * 0.25 + index * 0.7) * 0.12;
    wingRef.current.rotation.z = Math.sin(t * flapSpeed + index) * flapAmp;
    // Subtle shimmer on trail
    if (trailRef.current) {
      (trailRef.current.material as THREE.MeshPhongMaterial).opacity =
        0.12 + Math.sin(t * 4 + index) * 0.06;
    }
  });

  return (
    <group ref={groupRef} scale={0.65}>
      {/* wing flap pivot */}
      <group ref={wingRef}>
        <ButterflyWing side={1}  col={col} spotCol={spotCol} />
        <ButterflyWing side={-1} col={col} spotCol={spotCol} />
      </group>

      {/* thorax */}
      <mesh position={[0, 0.04, 0]} rotation={[Math.PI/2, 0, 0]}>
        <capsuleGeometry args={[0.038, 0.10, 4, 7]} />
        <meshPhongMaterial color={bodyCol} shininess={40} />
      </mesh>
      {/* abdomen */}
      <mesh position={[0, -0.10, 0]} rotation={[Math.PI/2, 0, 0]}>
        <capsuleGeometry args={[0.028, 0.14, 4, 7]} />
        <meshPhongMaterial color={bodyCol} shininess={20} />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.038, 6, 5]} />
        <meshPhongMaterial color={bodyCol} />
      </mesh>
      {/* eyes */}
      <mesh position={[0.025, 0.135, 0.025]}>
        <sphereGeometry args={[0.012, 4, 4]} />
        <meshPhongMaterial color="#ffeeaa" emissive="#ffdd44" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.025, 0.135, 0.025]}>
        <sphereGeometry args={[0.012, 4, 4]} />
        <meshPhongMaterial color="#ffeeaa" emissive="#ffdd44" emissiveIntensity={0.8} />
      </mesh>
      {/* antennae with ball tips */}
      <mesh position={[0.03, 0.175, 0.01]} rotation={[0.1, 0, 0.45]}>
        <capsuleGeometry args={[0.006, 0.12, 3, 4]} />
        <meshPhongMaterial color={bodyCol} />
      </mesh>
      <mesh position={[0.07, 0.27, 0.01]}>
        <sphereGeometry args={[0.014, 4, 4]} />
        <meshPhongMaterial color={col} emissive={col} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.03, 0.175, 0.01]} rotation={[0.1, 0, -0.45]}>
        <capsuleGeometry args={[0.006, 0.12, 3, 4]} />
        <meshPhongMaterial color={bodyCol} />
      </mesh>
      <mesh position={[-0.07, 0.27, 0.01]}>
        <sphereGeometry args={[0.014, 4, 4]} />
        <meshPhongMaterial color={col} emissive={col} emissiveIntensity={0.5} />
      </mesh>
      {/* pixie dust shimmer trail */}
      <mesh ref={trailRef} position={[0, -0.08, -0.04]}>
        <sphereGeometry args={[0.08, 5, 4]} />
        <meshPhongMaterial color={spotCol} transparent opacity={0.14} emissive={col} emissiveIntensity={0.4} depthWrite={false} />
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
  const sub = obj.subType;

  let mesh: JSX.Element;
  if (obj.type === 'tree') {
    if (sub === 'palm')    mesh = <Palm    {...props} />;
    else if (sub === 'oak')    mesh = <Oak     {...props} />;
    else if (sub === 'cactus') mesh = <Cactus  {...props} />;
    else                       mesh = <Pine    {...props} />;
  } else if (obj.type === 'flower') {
    if (sub === 'tulip')     mesh = <Tulip    {...props} />;
    else if (sub === 'lotus')    mesh = <Lotus    {...props} />;
    else if (sub === 'sunflower') mesh = <Sunflower {...props} />;
    else                         mesh = <Daisy    {...props} />;
  } else if (obj.type === 'mountain') {
    if (sub === 'hill')         mesh = <Hill     {...props} />;
    else if (sub === 'glacier') mesh = <Glacier  {...props} />;
    else                        mesh = <Peak     {...props} />;
  } else {
    if (sub === 'skyscraper') mesh = <Skyscraper {...props} />;
    else if (sub === 'dome')    mesh = <Dome       {...props} />;
    else if (sub === 'cabin')   mesh = <Cabin      {...props} />;
    else                        mesh = <Tower      {...props} />;
  }

  return <GrowIn active={isNew}>{mesh}</GrowIn>;
}

// ─── Main exported scene ──────────────────────────────────────────────────────
interface PlanetSceneProps {
  planetObjects: PlanetObject[];
  newObjectId: string | null;
  sparklePos: [number,number,number] | null;
  longestStreak: number;
}

// Fixed positions for milestone creatures/plants so they don't re-randomize
const BUTTERFLY_POSITIONS: [number,number,number][] = [
  [1.8,  0.3,  0.6],
  [-1.4, 0.1,  1.6],
  [0.6, -0.4, -1.9],
  [-1.9, 0.5, -0.4],
  [1.2,  0.8, -1.5],
];
const ANIMAL_POSITIONS: [number,number,number][] = [
  [ 0.6,  1.4,  0.7],
  [-0.8,  1.1, -0.9],
  [ 1.3, -0.7,  0.6],
  [-0.5, -1.3, -0.8],
];
const GLOW_PLANT_POSITIONS: [number,number,number][] = [
  [ 0.9,  1.2,  0.5],
  [-1.1,  0.8,  0.9],
  [ 0.4, -1.4,  0.7],
  [-0.7,  0.6, -1.4],
  [ 1.4,  0.4, -0.8],
  [-0.3, -1.0,  1.1],
];

export function PlanetScene({ planetObjects, newObjectId, sparklePos, longestStreak }: PlanetSceneProps) {
  const [sparkleKey, setSparkleKey] = useState(0);

  useEffect(() => {
    if (sparklePos) setSparkleKey(k => k+1);
  }, [sparklePos]);

  const hasAnimalMilestone    = longestStreak >= 30;
  const hasGlowPlantMilestone = longestStreak >= 100;
  const hasButterflies        = longestStreak >= 30;

  // How many butterflies/animals/plants to show scales with streak
  const butterflyCount = hasButterflies     ? Math.min(5, 1 + Math.floor((longestStreak - 30) / 20)) : 0;
  const animalCount    = hasAnimalMilestone ? Math.min(4, 1 + Math.floor((longestStreak - 30) / 25)) : 0;
  const glowCount      = hasGlowPlantMilestone ? Math.min(6, 1 + Math.floor((longestStreak - 100) / 15)) : 0;

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
      {/* Extra glow at 100-day */}
      {hasGlowPlantMilestone && (
        <pointLight position={[0,0,0]} intensity={0.8} color="#80ff80" distance={5} />
      )}

      {/* Deep space stars */}
      <Stars radius={90} depth={60} count={4000} factor={4} saturation={0.8} fade speed={0.8} />

      {/* Sparkle burst */}
      {sparklePos && <SparkleParticles key={sparkleKey} position={sparklePos} />}

      {/* Camera pulse */}
      <CameraZoomPulse active={!!newObjectId} />

      {/* 30-day milestone: Butterflies orbit the planet */}
      {Array.from({ length: butterflyCount }, (_, i) => (
        <Butterfly key={i} pos={BUTTERFLY_POSITIONS[i]} index={i} />
      ))}

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

        {/* Habit-spawned objects */}
        {planetObjects.map(obj => (
          <PlanetObjectMesh key={obj.id} obj={obj} isNew={obj.id === newObjectId} />
        ))}

        {/* 30-day milestone: Animals on the surface */}
        {Array.from({ length: animalCount }, (_, i) => (
          <Animal key={i} pos={ANIMAL_POSITIONS[i]} index={i} />
        ))}

        {/* 100-day milestone: Glowing plants */}
        {Array.from({ length: glowCount }, (_, i) => (
          <GlowingPlant key={i} pos={GLOW_PLANT_POSITIONS[i]} index={i} />
        ))}
      </FloatingPlanet>
    </>
  );
}
