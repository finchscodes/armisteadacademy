"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const OUTPUT_SIZE = 512; // px, square

type Point = { x: number; y: number };

/**
 * A minimal square cropper: drag to pan, slider to zoom, confirm to bake
 * the crop into a new image file via canvas. No external dependency —
 * this is a simple enough interaction to hand-roll.
 */
export function ImageCropper({
  file,
  onCancel,
  onConfirm,
}: {
  file: File;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}) {
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const dragRef = useRef<{ start: Point; startOffset: Point } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const FRAME_SIZE = 280; // px, on-screen crop viewport (square)

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = imageUrl;
    return () => URL.revokeObjectURL(imageUrl);
    // imageUrl is derived once from the file this component was mounted
    // with (lazy useState initializer) and never changes for this instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Minimum zoom that still fully covers the square frame.
  const minZoom = imgSize ? FRAME_SIZE / Math.min(imgSize.width, imgSize.height) : 1;
  const effectiveZoom = Math.max(zoom, minZoom);

  const clampOffset = useCallback(
    (next: Point, zoomLevel: number) => {
      if (!imgSize) return next;
      const displayW = imgSize.width * zoomLevel;
      const displayH = imgSize.height * zoomLevel;
      const maxX = Math.max(0, (displayW - FRAME_SIZE) / 2);
      const maxY = Math.max(0, (displayH - FRAME_SIZE) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [imgSize]
  );

  function handlePointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { start: { x: e.clientX, y: e.clientY }, startOffset: offset };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.start.x;
    const dy = e.clientY - dragRef.current.start.y;
    setOffset(
      clampOffset(
        { x: dragRef.current.startOffset.x + dx, y: dragRef.current.startOffset.y + dy },
        effectiveZoom
      )
    );
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function handleZoomChange(next: number) {
    setZoom(next);
    setOffset((prev) => clampOffset(prev, Math.max(next, minZoom)));
  }

  function handleConfirm() {
    if (!imgSize || !imageUrl) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Map the visible FRAME_SIZE-square window (in on-screen px) back to
      // source-image pixels, then draw just that region scaled up to the
      // output size.
      const displayW = imgSize.width * effectiveZoom;
      const displayH = imgSize.height * effectiveZoom;
      const frameLeftOnDisplay = (displayW - FRAME_SIZE) / 2 - offset.x;
      const frameTopOnDisplay = (displayH - FRAME_SIZE) / 2 - offset.y;
      const srcX = frameLeftOnDisplay / effectiveZoom;
      const srcY = frameTopOnDisplay / effectiveZoom;
      const srcSize = FRAME_SIZE / effectiveZoom;

      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const ext = file.type === "image/png" ? "png" : "jpg";
          const cropped = new File([blob], `cropped.${ext}`, { type: blob.type });
          onConfirm(cropped);
        },
        file.type === "image/png" ? "image/png" : "image/jpeg",
        0.92
      );
    };
    img.src = imageUrl;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-ink-900 border border-ink-700 rounded-lg shadow-2xl shadow-black/50 p-5 w-full max-w-sm">
        <p className="text-sm text-parchment-100 font-medium mb-3">Crop image</p>

        <div
          ref={frameRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative mx-auto overflow-hidden rounded-md border border-ink-600 bg-ink-950 cursor-grab active:cursor-grabbing touch-none"
          style={{ width: FRAME_SIZE, height: FRAME_SIZE }}
        >
          {imageUrl && imgSize && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Crop preview"
              draggable={false}
              className="absolute top-1/2 left-1/2 select-none pointer-events-none"
              style={{
                width: imgSize.width * effectiveZoom,
                height: imgSize.height * effectiveZoom,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <span className="text-xs text-ink-400 shrink-0">Zoom</span>
          <input
            type="range"
            min={minZoom}
            max={minZoom * 4}
            step={0.01}
            value={effectiveZoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="w-full accent-brass-500"
          />
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm px-4 py-2 rounded-md border border-ink-600 text-ink-300 hover:border-brass-500/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!imgSize}
            className="text-sm px-4 py-2 rounded-md bg-brass-500 text-ink-950 font-medium hover:bg-brass-400 transition-colors disabled:opacity-60"
          >
            Use this crop
          </button>
        </div>
      </div>
    </div>
  );
}
