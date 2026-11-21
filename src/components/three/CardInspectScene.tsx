"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { BlenderCardModel } from "./BlenderCardModel";
import { isMobileViewport, isWebGLAvailable, prefersReducedMotion } from "@/lib/webgl";
import type { CardOrientation } from "@/types/tarot";

interface CardInspectSceneProps {
  glbPath: string;
  orientation: CardOrientation;
}

export function CardInspectScene({
  glbPath,
  orientation,
}: CardInspectSceneProps) {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setWebgl(isWebGLAvailable());
    setMobile(isMobileViewport());
    setReduced(prefersReducedMotion());
  }, []);

  if (webgl === false) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-xs text-[var(--arcana-stone)]">
        WebGL is unavailable on this device. Viewing 2D archival scan instead.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {webgl === true && (
        <Canvas
          dpr={mobile ? [1, 1.25] : [1, 1.75]}
          camera={{ position: [0, 0, 2.35], fov: 36 }}
          gl={{ antialias: !mobile, alpha: true }}
        >
          <ambientLight intensity={1.2} color="#f5ecdc" />
          <directionalLight position={[2, 3, 4]} intensity={1.6} color="#fff5e4" />
          <pointLight position={[-2.5, -1, 2]} intensity={1.0} color="#7c68a6" />

          <Suspense fallback={null}>
            <BlenderCardModel
              glbPath={glbPath}
              orientation={orientation}
              scale={1.1}
              floatSpeed={0.8}
              floatAmplitude={0.04}
              reducedMotion={reduced}
            />
          </Suspense>

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={1.5}
            maxDistance={3.6}
            autoRotate={!reduced}
            autoRotateSpeed={0.9}
          />
        </Canvas>
      )}
    </div>
  );
}
