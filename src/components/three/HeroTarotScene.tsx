"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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

function HeroResponsiveCameraRig({
  isCompact,
}: {
  isCompact: boolean;
}) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = Math.max(0.55, size.width / Math.max(1, size.height));
    const vFovRad = (camera.fov * Math.PI) / 180;
    const tanHalfV = Math.tan(vFovRad / 2);
    const tanHalfH = tanHalfV * aspect;

    // Bounding envelope of the 3 tilted floating cards (left/center/right)
    // Tighter horizontal spread on phone makes the 3 cards appear noticeably larger
    // while keeping generous margin on iPad & desktop so outer card corners never clip.
    const requiredWidth = isCompact ? 2.75 : 3.45;
    const requiredHeight = isCompact ? 1.52 : 1.72;

    const zForWidth = requiredWidth / (2 * tanHalfH);
    const zForHeight = requiredHeight / (2 * tanHalfV);
    const padding = isCompact ? 1.04 : 1.1;
    const targetZ = Math.max(2.95, Math.min(5.8, Math.max(zForWidth, zForHeight) * padding));

    camera.position.set(0, 0.06, targetZ);
    camera.lookAt(0, 0.02, 0);
    camera.updateProjectionMatrix();
  }, [camera, isCompact, size.height, size.width]);

  return null;
}

export function HeroTarotScene() {
  const [webglReady, setWebglReady] = useState<boolean | null>(null);
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setWebglReady(isWebGLAvailable());
    setMobile(isMobileViewport());
    setReduced(prefersReducedMotion());

    const onResize = () => setMobile(isMobileViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (webglReady === false) {
    return <HeroFallback2D />;
  }

  const sideX = mobile ? 0.92 : 1.08;
  const sideScale = mobile ? 0.96 : 0.95;
  const centerScale = mobile ? 1.08 : 1.06;

  return (
    <div className="relative h-full w-full">
      {webglReady === true && (
        <Canvas
          className="h-full w-full"
          dpr={[1.5, 2.5]}
          camera={{ position: [0, 0.06, mobile ? 3.5 : 3.65], fov: 38 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.NoToneMapping,
          }}
          aria-label="Interactive 3D Rider-Waite-Smith Tarot cards"
        >
          <HeroResponsiveCameraRig isCompact={mobile} />
          <ambientLight intensity={1.05} color="#ffffff" />
          <directionalLight position={[2.2, 3.2, 4.5]} intensity={1.15} color="#fffaf0" />
          <pointLight position={[-3, 1.2, 2.5]} intensity={0.45} color="#8b78b8" />
          <pointLight position={[2.8, -1.5, 2]} intensity={0.35} color="#d4b475" />

          <CelestialDust count={mobile ? 45 : 110} reducedMotion={reduced} />

          <Suspense fallback={null}>
            {/* Left: The High Priestess */}
            <BlenderCardModel
              glbPath="/tarot-assets/cards/02_the_high_priestess.glb"
              position={[-sideX, -0.05, -0.32]}
              rotation={[0.04, 0.3, 0.07]}
              scale={sideScale}
              floatSpeed={0.9}
              floatAmplitude={0.06}
              floatOffset={0}
              reducedMotion={reduced}
            />
            {/* Center: The Star */}
            <BlenderCardModel
              glbPath="/tarot-assets/cards/17_the_star.glb"
              position={[0, 0.07, 0.18]}
              rotation={[-0.03, 0, 0]}
              scale={centerScale}
              floatSpeed={0.75}
              floatAmplitude={0.075}
              floatOffset={1.6}
              reducedMotion={reduced}
            />
            {/* Right: The Fool */}
            <BlenderCardModel
              glbPath="/tarot-assets/cards/00_the_fool.glb"
              position={[sideX, -0.05, -0.32]}
              rotation={[0.04, -0.3, -0.07]}
              scale={sideScale}
              floatSpeed={0.95}
              floatAmplitude={0.06}
              floatOffset={3.1}
              reducedMotion={reduced}
            />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
