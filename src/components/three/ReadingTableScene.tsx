"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BlenderCardModel } from "./BlenderCardModel";
import {
  isMobileViewport,
  isWebGLAvailable,
  prefersReducedMotion,
} from "@/lib/webgl";
import { withBasePath } from "@/lib/utils";
import { UI_TEXT, getLocalizedPositionLabel } from "@/lib/i18n";
import { useLocaleStore } from "@/store/locale-store";
import type { DrawnCard, SpreadConfig } from "@/types/tarot";
import type { ReadingPhase } from "@/store/reading-store";

interface ReadingTableSceneProps {
  phase: ReadingPhase;
  spread: SpreadConfig;
  drawnCards: DrawnCard[];
  selectedSlots: number[];
  shuffleCount: number;
  isShuffling: boolean;
  onSelectSlot: (slotIndex: number) => void;
  onRevealCard: (positionIndex: number) => void;
}

const FAN_COUNT = 15;

function ResponsiveCameraRig({
  phase,
  mobile,
}: {
  phase: ReadingPhase;
  mobile: boolean;
}) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = Math.max(0.5, size.width / Math.max(1, size.height));
    const vFovRad = (camera.fov * Math.PI) / 180;
    const tanHalfV = Math.tan(vFovRad / 2);
    const tanHalfH = tanHalfV * aspect;

    // Desired world-space width & height that must remain fully visible inside the frame
    let requiredWidth = 3.2;
    let requiredHeight = 1.65;
    if (phase === "select") {
      requiredWidth = mobile ? 3.9 : 5.2;
      requiredHeight = 1.9;
    } else if (phase === "reveal" || phase === "result") {
      requiredWidth = mobile ? 3.1 : 3.9;
      requiredHeight = 1.75;
    } else {
      requiredWidth = 2.4;
      requiredHeight = 1.65;
    }

    const zForWidth = requiredWidth / (2 * tanHalfH);
    const zForHeight = requiredHeight / (2 * tanHalfV);
    const targetZ = Math.max(3.35, Math.min(7.2, Math.max(zForWidth, zForHeight) * 1.12));

    camera.position.set(0, 0.1, targetZ);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, mobile, phase, size.height, size.width]);

  return null;
}

function SharedDeckCards({
  phase,
  selectedSlots,
  isShuffling,
  mobile,
  reducedMotion,
  onSelectSlot,
}: {
  phase: ReadingPhase;
  selectedSlots: number[];
  isShuffling: boolean;
  mobile: boolean;
  reducedMotion: boolean;
  onSelectSlot: (slotIndex: number) => void;
}) {
  const backTexture = useLoader(
    THREE.TextureLoader,
    `${withBasePath("/tarot-assets/textures/card_back.png")}?v=3`
  );
  const gl = useThree((s) => s.gl);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  useEffect(() => {
    backTexture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
    backTexture.minFilter = THREE.LinearMipmapLinearFilter;
    backTexture.magFilter = THREE.LinearFilter;
    backTexture.colorSpace = THREE.SRGBColorSpace;
    backTexture.needsUpdate = true;
  }, [backTexture, gl]);

  // Gently rounded-corner Tarot card geometry (matches real Rider-Waite-Smith cards & 78 .glb models)
  const geometry = useMemo(() => {
    const w = 0.7;
    const h = 1.2;
    const r = 0.032;
    const depth = 0.008;
    const hw = w / 2;
    const hh = h / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.absarc(hw - r, -hh + r, r, -Math.PI / 2, 0, false);
    shape.lineTo(hw, hh - r);
    shape.absarc(hw - r, hh - r, r, 0, Math.PI / 2, false);
    shape.lineTo(-hw + r, hh);
    shape.absarc(-hw + r, hh - r, r, Math.PI / 2, Math.PI, false);
    shape.lineTo(-hw, -hh + r);
    shape.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5, false);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 8,
    });
    geo.translate(0, 0, -depth / 2);

    // Normalize UVs to [0, 1] across the card face so card_back.png maps cleanly edge-to-edge
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const u = (pos.getX(i) + hw) / w;
      const v = (pos.getY(i) + hh) / h;
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
    return geo;
  }, []);

  const materials = useMemo(() => {
    const faceMat = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: 0.62,
      metalness: 0.05,
    });
    const edgeMat = new THREE.MeshStandardMaterial({
      color: "#d4b475",
      metalness: 0.78,
      roughness: 0.3,
    });
    // ExtrudeGeometry group 0 = front & back caps, group 1 = extruded side rim
    return [faceMat, edgeMat];
  }, [backTexture]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      materials.forEach((m) => m.dispose());
    };
  }, [geometry, materials]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const lerpSpeed = Math.min(1, delta * (reducedMotion ? 16 : 7));

    for (let i = 0; i < FAN_COUNT; i++) {
      const grp = groupRefs.current[i];
      if (!grp) continue;

      const isPicked = selectedSlots.includes(i);
      const isHovered = hoveredSlot === i && phase === "select" && !isPicked;

      let tx = 0;
      let ty = 0;
      let tz = -i * 0.012;
      let rz = 0;
      let ry = 0;

      if (phase === "shuffle") {
        if (isShuffling && !reducedMotion) {
          const half = i % 2 === 0 ? -1 : 1;
          const wave = Math.sin(t * 7 + i * 0.45);
          tx = half * (0.45 + Math.abs(wave) * 0.45);
          ty = Math.cos(t * 6 + i * 0.35) * 0.14;
          tz = (i - FAN_COUNT / 2) * 0.015;
          rz = half * 0.12 * wave;
        } else {
          tx = Math.sin(i * 0.3) * 0.015;
          ty = 0;
          tz = -i * 0.01;
          rz = (i - FAN_COUNT / 2) * 0.004;
        }
      } else if (phase === "select") {
        const norm = (i / (FAN_COUNT - 1)) * 2 - 1; // [-1, 1]
        const arcAngle = norm * (mobile ? 0.48 : 0.62);
        tx = norm * (mobile ? 1.48 : 2.15);
        ty = -Math.pow(norm, 2) * (mobile ? 0.3 : 0.45) + (isHovered ? 0.24 : 0) + (isPicked ? 1.8 : 0);
        tz = -Math.abs(norm) * 0.3 + i * 0.006 + (isHovered ? 0.25 : 0);
        rz = -arcAngle * 0.55;
        ry = isHovered ? 0.06 : 0;
      }

      grp.position.x += (tx - grp.position.x) * lerpSpeed;
      grp.position.y += (ty - grp.position.y) * lerpSpeed;
      grp.position.z += (tz - grp.position.z) * lerpSpeed;
      grp.rotation.z += (rz - grp.rotation.z) * lerpSpeed;
      grp.rotation.y += (ry - grp.rotation.y) * lerpSpeed;
    }
  });

  if (phase !== "shuffle" && phase !== "select") return null;

  return (
    <group position={[0, -0.05, 0]}>
      {Array.from({ length: FAN_COUNT }, (_, i) => {
        const isPicked = selectedSlots.includes(i);
        return (
          <group
            key={i}
            ref={(el) => {
              groupRefs.current[i] = el;
            }}
            onClick={(e) => {
              if (phase !== "select" || isPicked) return;
              e.stopPropagation();
              onSelectSlot(i);
            }}
            onPointerOver={(e) => {
              if (phase !== "select" || isPicked) return;
              e.stopPropagation();
              document.body.style.cursor = "pointer";
              setHoveredSlot(i);
            }}
            onPointerOut={() => {
              document.body.style.cursor = "auto";
              setHoveredSlot((prev) => (prev === i ? null : prev));
            }}
          >
            <mesh geometry={geometry} material={materials} castShadow receiveShadow />
          </group>
        );
      })}
    </group>
  );
}

function ThreeCardSpread3D({
  drawnCards,
  mobile,
  reducedMotion,
  onRevealCard,
}: {
  drawnCards: DrawnCard[];
  mobile: boolean;
  reducedMotion: boolean;
  onRevealCard: (idx: number) => void;
}) {
  const spacing = mobile ? 0.92 : 1.18;
  const scale = mobile ? 0.86 : 1.04;

  return (
    <group position={[0, 0.04, 0]}>
      {drawnCards.map((item, idx) => {
        const x = (idx - 1) * spacing;
        return (
          <Suspense key={item.card.id} fallback={null}>
            <BlenderCardModel
              glbPath={item.card.glb}
              position={[x, 0, 0]}
              rotation={[0, 0, 0]}
              scale={scale}
              revealed={item.revealed}
              orientation={item.orientation}
              floatSpeed={item.revealed ? 0.65 : 0}
              floatAmplitude={item.revealed ? 0.03 : 0}
              floatOffset={idx * 1.4}
              reducedMotion={reducedMotion}
              onClick={() => {
                if (!item.revealed) onRevealCard(idx);
              }}
              onPointerOver={() => {}}
              onPointerOut={() => {}}
            />
          </Suspense>
        );
      })}
    </group>
  );
}

function ReadingFallback2D({
  phase,
  spread,
  drawnCards,
  selectedSlots,
  onSelectSlot,
  onRevealCard,
}: Omit<ReadingTableSceneProps, "shuffleCount" | "isShuffling">) {
  const { locale } = useLocaleStore();

  if (phase === "shuffle") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <img
          src={`${withBasePath("/tarot-assets/textures/card_back.png")}?v=3`}
          alt="Tarot deck back"
          className="h-44 w-auto rounded-lg border border-[rgba(212,180,117,0.45)] shadow-2xl"
        />
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--arcana-stone)]">
          {locale === "vi" ? "Đang hiển thị bộ bài 2D" : "2D Deck View Active"}
        </p>
      </div>
    );
  }

  if (phase === "select") {
    return (
      <div className="grid h-full grid-cols-4 place-items-center gap-2 overflow-y-auto px-3 pb-4 pt-14 sm:grid-cols-6 sm:gap-3 sm:px-6">
        {Array.from({ length: 12 }, (_, i) => {
          const picked = selectedSlots.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={picked}
              onClick={() => onSelectSlot(i)}
              aria-label={`Draw card ${i + 1}`}
              className={`aspect-[7/12] w-full max-w-[68px] sm:max-w-[78px] overflow-hidden rounded-lg border transition-transform cursor-pointer ${
                picked
                  ? "opacity-20 scale-90 border-white/10"
                  : "border-[rgba(212,180,117,0.4)] hover:-translate-y-1.5"
              }`}
            >
              <img
                src={`${withBasePath("/tarot-assets/textures/card_back.png")}?v=3`}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-3 items-center gap-2.5 px-3 pb-4 pt-12 sm:gap-6 sm:px-6">
      {drawnCards.map((item, idx) => (
        <button
          key={item.card.id}
          type="button"
          onClick={() => !item.revealed && onRevealCard(idx)}
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <div className="aspect-[7/12] w-full max-w-[100px] sm:max-w-[144px] overflow-hidden rounded-lg border border-[rgba(212,180,117,0.4)] bg-[#0b0d14] shadow-xl">
            <img
              src={
                item.revealed
                  ? withBasePath(item.card.image)
                  : `${withBasePath("/tarot-assets/textures/card_back.png")}?v=3`
              }
              alt={item.revealed ? item.card.name : "Unrevealed tarot card"}
              className={`h-full w-full object-cover transition-transform duration-500 ${
                item.revealed && item.orientation === "reversed" ? "rotate-180" : ""
              }`}
            />
          </div>
          <span className="text-center text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-[var(--arcana-gold-light)]">
            {getLocalizedPositionLabel(
              spread.id,
              idx,
              locale,
              spread.positions[idx]?.label ?? ""
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

export function ReadingTableScene(props: ReadingTableSceneProps) {
  const { locale } = useLocaleStore();
  const tr = UI_TEXT[locale].reading;
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [use2D, setUse2D] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setWebgl(isWebGLAvailable());
    setMobile(isMobileViewport());
    setReduced(prefersReducedMotion());

    const onResize = () => setMobile(isMobileViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const show3D = webgl === true && !use2D;

  return (
    <div className="relative min-h-[320px] h-[340px] sm:h-[420px] w-full overflow-hidden rounded-md border border-[rgba(212,180,117,0.18)] bg-[radial-gradient(ellipse_at_center,rgba(24,29,52,0.82)_0%,rgba(7,8,13,0.96)_76%)]">
      {webgl === true && (
        <button
          type="button"
          onClick={() => setUse2D((prev) => !prev)}
          className="absolute right-3 top-3 z-20 rounded-sm border border-[rgba(212,180,117,0.28)] bg-[rgba(7,8,13,0.78)] px-2.5 py-1 text-[11px] uppercase tracking-wider text-[var(--arcana-stone)] hover:text-[var(--arcana-gold-light)] cursor-pointer"
        >
          {use2D ? tr.switchTo3D : tr.mode2D}
        </button>
      )}

      {show3D ? (
        <Canvas
          className="h-full w-full"
          dpr={[1.5, 2.5]}
          camera={{ position: [0, 0.1, mobile ? 5.2 : 3.7], fov: 38 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            toneMapping: THREE.NoToneMapping,
          }}
        >
          <ResponsiveCameraRig phase={props.phase} mobile={mobile} />
          <ambientLight intensity={1.08} color="#ffffff" />
          <directionalLight position={[2, 3.5, 4.5]} intensity={1.15} color="#fffaf0" />
          <pointLight position={[-3, 1, 2.5]} intensity={0.45} color="#8b78b8" />
          <pointLight position={[3, -1, 2]} intensity={0.35} color="#d4b475" />

          <Suspense fallback={null}>
            {(props.phase === "shuffle" || props.phase === "select") && (
              <SharedDeckCards
                phase={props.phase}
                selectedSlots={props.selectedSlots}
                isShuffling={props.isShuffling}
                mobile={mobile}
                reducedMotion={reduced}
                onSelectSlot={props.onSelectSlot}
              />
            )}

            {(props.phase === "reveal" || props.phase === "result") && (
              <ThreeCardSpread3D
                drawnCards={props.drawnCards}
                mobile={mobile}
                reducedMotion={reduced}
                onRevealCard={props.onRevealCard}
              />
            )}
          </Suspense>
        </Canvas>
      ) : (
        <ReadingFallback2D
          phase={props.phase}
          spread={props.spread}
          drawnCards={props.drawnCards}
          selectedSlots={props.selectedSlots}
          onSelectSlot={props.onSelectSlot}
          onRevealCard={props.onRevealCard}
        />
      )}
    </div>
  );
}
