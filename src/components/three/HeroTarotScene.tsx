"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BlenderCardModel } from "./BlenderCardModel";
import {
  isMobileViewport,
  isWebGLAvailable,
  prefersReducedMotion,
} from "@/lib/webgl";
import { withBasePath } from "@/lib/utils";

function CelestialDust({
  count,
  reducedMotion,
}: {
  count: number;
  reducedMotion: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Deterministic golden-ratio distribution to stay pure & pleasing
      const angle = i * 2.39996;
      const radius = 1.6 + (i % 17) * 0.24;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = ((i % 23) / 23 - 0.5) * 3.6;
      positions[i * 3 + 2] = -2.2 + ((i % 11) / 11) * 2.4;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    if (reducedMotion || !pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#d4b475"
        size={0.022}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function HeroFallback2D() {
  const cards = [
    { src: "/tarot-assets/images/m02.jpg", alt: "The High Priestess", tilt: "-rotate-6 translate-y-3" },
    { src: "/tarot-assets/images/m17.jpg", alt: "The Star", tilt: "z-10 scale-105" },
    { src: "/tarot-assets/images/m00.jpg", alt: "The Fool", tilt: "rotate-6 translate-y-3" },
  ];
  return (
    <div className="flex h-full w-full items-center justify-center gap-4 px-4">
      {cards.map((c) => (
        <div
          key={c.alt}
          className={`w-28 sm:w-36 overflow-hidden rounded-md border border-[rgba(212,180,117,0.38)] bg-[#0c101d] shadow-2xl ${c.tilt}`}
        >
          <img
            src={withBasePath(c.src)}
            alt={c.alt}
            className="h-auto w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export function HeroTarotScene() {
  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setWebglReady(isWebGLAvailable());
    setMobile(isMobileViewport());
    setReduced(prefersReducedMotion());
  }, []);

  if (webglReady === false) {
    return <HeroFallback2D />;
  }

  return (
    <div className="relative h-full w-full">
      {webglReady === true && (
        <Canvas
          dpr={mobile ? [1, 1.25] : [1, 1.75]}
          camera={{ position: [0, 0.1, mobile ? 4.3 : 3.45], fov: 38 }}
          gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
          aria-label="Interactive 3D Rider-Waite-Smith Tarot cards"
        >
          <ambientLight intensity={1.15} color="#f5ecdc" />
          <directionalLight position={[2.5, 3.5, 4]} intensity={1.6} color="#fff4df" />
          <pointLight position={[-3, 1.2, 2.5]} intensity={1.4} color="#7c68a6" />
          <pointLight position={[2.8, -1.5, 2]} intensity={0.9} color="#d4b475" />

          <CelestialDust count={mobile ? 45 : 110} reducedMotion={reduced} />

          <Suspense fallback={null}>
            {/* Left: The High Priestess */}
            <BlenderCardModel
              glbPath="/tarot-assets/cards/02_the_high_priestess.glb"
              position={[-1.08, -0.06, -0.35]}
              rotation={[0.04, 0.34, 0.08]}
              scale={0.95}
              floatSpeed={0.9}
              floatAmplitude={0.07}
              floatOffset={0}
              reducedMotion={reduced}
            />
            {/* Center: The Star */}
            <BlenderCardModel
              glbPath="/tarot-assets/cards/17_the_star.glb"
              position={[0, 0.08, 0.18]}
              rotation={[-0.03, 0, 0]}
              scale={1.06}
              floatSpeed={0.75}
              floatAmplitude={0.09}
              floatOffset={1.6}
              reducedMotion={reduced}
            />
            {/* Right: The Fool */}
            <BlenderCardModel
              glbPath="/tarot-assets/cards/00_the_fool.glb"
              position={[1.08, -0.06, -0.35]}
              rotation={[0.04, -0.34, -0.08]}
              scale={0.95}
              floatSpeed={0.95}
              floatAmplitude={0.07}
              floatOffset={3.1}
              reducedMotion={reduced}
            />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
