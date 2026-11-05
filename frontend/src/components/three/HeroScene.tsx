"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";

interface SceneProps {
  animate: boolean;
}

function VoiceOrb({ animate }: SceneProps) {
  const mesh = useRef<Mesh>(null);
  useFrame(({ clock, pointer }) => {
    if (!mesh.current || !animate) return;
    const t = clock.getElapsedTime();
    mesh.current.rotation.y = t * 0.14 + pointer.x * 0.35;
    mesh.current.rotation.x = pointer.y * 0.25;
    const s = 1 + Math.sin(t * 2.0) * 0.028 + Math.sin(t * 4.7) * 0.012;
    mesh.current.scale.setScalar(s);
  });

  return (
    <Float
      speed={animate ? 1.2 : 0}
      rotationIntensity={animate ? 0.25 : 0}
      floatIntensity={animate ? 0.65 : 0}
    >
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.18, 32]} />
        <MeshDistortMaterial
          color="#14b8a6"
          emissive="#0b3b3c"
          emissiveIntensity={0.65}
          roughness={0.2}
          metalness={0.35}
          distort={animate ? 0.32 : 0.12}
          speed={animate ? 1.8 : 0}
        />
      </mesh>
    </Float>
  );
}

/** Concentric acoustic rings — decorative waveform motif. */
function WaveRings({ animate }: SceneProps) {
  const group = useRef<Group>(null);
  const bars = useMemo(() => {
    const out: { angle: number; ring: number }[] = [];
    for (let ring = 0; ring < 2; ring++) {
      const count = 40 + ring * 20;
      for (let i = 0; i < count; i++) {
        out.push({ angle: (i / count) * Math.PI * 2, ring });
      }
    }
    return out;
  }, []);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g || !animate) return;
    const t = clock.getElapsedTime();
    g.rotation.z = t * 0.04;
    g.children.forEach((child, i) => {
      const { angle, ring } = bars[i];
      const h = 0.22 + Math.abs(Math.sin(angle * 4 + t * 1.8 + ring)) * 0.5;
      child.scale.y = h;
    });
  });

  return (
    <group ref={group} rotation={[Math.PI / 2.35, 0, 0]}>
      {bars.map(({ angle, ring }, i) => {
        const r = 2.05 + ring * 0.52;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[0.032, 0.032, 0.46]} />
            <meshBasicMaterial
              color={ring === 0 ? "#3fd4c0" : "#6ea8fe"}
              transparent
              opacity={ring === 0 ? 0.82 : 0.45}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function HeroScene({ animate = true }: { animate?: boolean }) {
  return (
    <Canvas
       frameloop={animate ? "always" : "demand"}
      camera={{ position: [0, 0, 6.4], fov: 44 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 3]} intensity={1.5} color="#7ee8d9" />
      <pointLight position={[-4, -2, 2]} intensity={20} color="#6ea8fe" />
      <VoiceOrb animate={animate} />
      <WaveRings animate={animate} />
      <Sparkles
        count={48}
        scale={[8, 5, 4]}
        size={1.8}
        speed={animate ? 0.28 : 0}
        color="#7ee8d9"
      />
    </Canvas>
  );
}
