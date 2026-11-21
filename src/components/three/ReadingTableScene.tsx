"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
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

function SharedDeckCards({
  phase,
  selectedSlots,
  isShuffling,
  reducedMotion,
  onSelectSlot,
}: {
  phase: ReadingPhase;
  selectedSlots: number[];
  isShuffling: boolean;
  reducedMotion: boolean;
  onSelectSlot: (slotIndex: number) => void;
}) {
  const backTexture = useLoader(
    THREE.TextureLoader,
    withBasePath("/tarot-assets/textures/card_back.png")
  );
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  const geometry = useMemo(() => new THREE.BoxGeometry(0.68, 1.16, 0.01), []);
  const materials = useMemo(() => {
    const edgeMat = new THREE.MeshStandardMaterial({
      color: "#d4b475",
      metalness: 0.8,
      roughness: 0.28,
    });
    const faceMat = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: 0.45,
      metalness: 0.08,
    });
    return [edgeMat, edgeMat, edgeMat, edgeMat, faceMat, faceMat];
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
        const arcAngle = norm * 0.62;
        tx = norm * 2.15;
        ty = -Math.pow(norm, 2) * 0.45 + (isHovered ? 0.24 : 0) + (isPicked ? 1.8 : 0);
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
          src={withBasePath("/tarot-assets/textures/card_back.png")}
          alt="Tarot deck back"
          className="h-44 w-auto rounded-md border border-[rgba(212,180,117,0.45)] shadow-2xl"
        />
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--arcana-stone)]">
          {locale === "vi" ? "Đang hiển thị bộ bài 2D" : "2D Deck View Active"}
        </p>
      </div>
    );
  }

  if (phase === "select") {
    return (
      <div className="flex h-full flex-wrap items-center justify-center gap-2.5 p-4">
        {Array.from({ length: 12 }, (_, i) => {
          const picked = selectedSlots.includes(i);
          return (
            <button
              key={i}
              type="button"
              disabled={picked}
              onClick={() => onSelectSlot(i)}
              aria-label={`Draw card ${i + 1}`}
              className={`h-28 w-16 overflow-hidden rounded-sm border transition-transform cursor-pointer ${
                picked
                  ? "opacity-20 scale-90 border-white/10"
                  : "border-[rgba(212,180,117,0.4)] hover:-translate-y-2"
              }`}
            >
              <img
                src={withBasePath("/tarot-assets/textures/card_back.png")}
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
    <div className="grid h-full grid-cols-3 items-center gap-3 px-4 py-6 sm:gap-6">
      {drawnCards.map((item, idx) => (
        <button
          key={item.card.id}
          type="button"
          onClick={() => !item.revealed && onRevealCard(idx)}
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <div className="w-24 sm:w-36 overflow-hidden rounded-md border border-[rgba(212,180,117,0.4)] shadow-xl">
            <img
              src={withBasePath(
                item.revealed
                  ? item.card.image
                  : "/tarot-assets/textures/card_back.png"
              )}
              alt={item.revealed ? item.card.name : "Unrevealed tarot card"}
              className={`h-auto w-full object-cover transition-transform duration-500 ${
                item.revealed && item.orientation === "reversed" ? "rotate-180" : ""
              }`}
            />
          </div>
          <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--arcana-gold-light)]">
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
  }, []);

  const show3D = webgl === true && !use2D;

  return (
    <div className="relative h-[340px] sm:h-[420px] w-full overflow-hidden rounded-md border border-[rgba(212,180,117,0.18)] bg-[radial-gradient(ellipse_at_center,rgba(24,29,52,0.82)_0%,rgba(7,8,13,0.96)_76%)]">
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
          dpr={mobile ? [1, 1.25] : [1, 1.75]}
          camera={{ position: [0, 0.15, mobile ? 4.4 : 3.55], fov: 38 }}
          gl={{ antialias: !mobile, alpha: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={1.2} color="#f5ecdc" />
          <directionalLight position={[2, 3.5, 4]} intensity={1.65} color="#fff3dc" />
          <pointLight position={[-3, 1, 2.5]} intensity={1.3} color="#7c68a6" />
          <pointLight position={[3, -1, 2]} intensity={0.95} color="#d4b475" />

          <Suspense fallback={null}>
            {(props.phase === "shuffle" || props.phase === "select") && (
              <SharedDeckCards
                phase={props.phase}
                selectedSlots={props.selectedSlots}
                isShuffling={props.isShuffling}
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
