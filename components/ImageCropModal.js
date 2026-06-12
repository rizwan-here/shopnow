'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

// Aspect ratio configs per field
const CROP_CONFIGS = {
  profilePicture: { aspect: 1, shape: 'circle', label: 'Profile Picture', hint: 'Drag to reposition · Pinch or scroll to zoom' },
  storeLogo:      { aspect: 1, shape: 'rounded', label: 'Store Logo', hint: 'Drag to reposition · Pinch or scroll to zoom' },
  storeBanner:    { aspect: 16 / 5, shape: 'rect', label: 'Store Banner', hint: 'Drag to reposition · Pinch or scroll to zoom' },
  productImage:   { aspect: 1, shape: 'rounded', label: 'Product Image', hint: 'Drag to reposition · Pinch or scroll to zoom' },
  varietyImage:   { aspect: 1, shape: 'rounded', label: 'Variety Image', hint: 'Drag to reposition · Pinch or scroll to zoom' },
};

export default function ImageCropModal({ file, field, onConfirm, onCancel }) {
  const config = CROP_CONFIGS[field] || CROP_CONFIGS.productImage;
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // offset: top-left of the image relative to crop window centre
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const lastPinchDist = useRef(null);

  // Crop window dimensions (displayed)
  const CROP_W = 320;
  const CROP_H = Math.round(CROP_W / config.aspect);

  // Load image
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Fit image inside crop window initially
      const scaleX = CROP_W / img.naturalWidth;
      const scaleY = CROP_H / img.naturalHeight;
      const fitScale = Math.max(scaleX, scaleY);
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Draw on canvas whenever state changes
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    const displayW = CROP_W;
    const displayH = CROP_H;
    canvas.width = displayW;
    canvas.height = displayH;

    // Scaled image size
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;

    // Image drawn so its centre + offset lands at crop centre
    const drawX = displayW / 2 - iw / 2 + offset.x;
    const drawY = displayH / 2 - ih / 2 + offset.y;

    ctx.clearRect(0, 0, displayW, displayH);

    // Clip shape
    ctx.save();
    if (config.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(displayW / 2, displayH / 2, Math.min(displayW, displayH) / 2, 0, Math.PI * 2);
      ctx.clip();
    } else if (config.shape === 'rounded') {
      const r = 16;
      ctx.beginPath();
      ctx.roundRect(0, 0, displayW, displayH, r);
      ctx.clip();
    }

    ctx.drawImage(img, drawX, drawY, iw, ih);
    ctx.restore();

    // Overlay dim outside circle
    if (config.shape === 'circle') {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.38)';
      ctx.fillRect(0, 0, displayW, displayH);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(displayW / 2, displayH / 2, Math.min(displayW, displayH) / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Re-draw image inside circle cleanly
      ctx.save();
      ctx.beginPath();
      ctx.arc(displayW / 2, displayH / 2, Math.min(displayW, displayH) / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, iw, ih);
      ctx.restore();

      // Thin border
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(displayW / 2, displayH / 2, Math.min(displayW, displayH) / 2 - 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }, [imageLoaded, offset, scale, config]);

  // Clamp offset so image always covers the crop area
  const clampOffset = useCallback((ox, oy, sc) => {
    if (!imgRef.current) return { x: ox, y: oy };
    const img = imgRef.current;
    const iw = img.naturalWidth * sc;
    const ih = img.naturalHeight * sc;
    const maxX = Math.max(0, (iw - CROP_W) / 2);
    const maxY = Math.max(0, (ih - CROP_H) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy))
    };
  }, [CROP_W, CROP_H]);

  // Mouse drag
  const onMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };
  const onMouseMove = useCallback((e) => {
    if (!dragging || !dragStart.current) return;
    const ox = e.clientX - dragStart.current.x;
    const oy = e.clientY - dragStart.current.y;
    setOffset(clampOffset(ox, oy, scale));
  }, [dragging, scale, clampOffset]);
  const onMouseUp = () => setDragging(false);

  // Touch drag + pinch
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      dragStart.current = { x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
    }
  };
  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragStart.current) {
      const ox = e.touches[0].clientX - dragStart.current.x;
      const oy = e.touches[0].clientY - dragStart.current.y;
      setOffset(prev => clampOffset(ox, oy, scale));
    } else if (e.touches.length === 2 && lastPinchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = dist / lastPinchDist.current;
      lastPinchDist.current = dist;
      setScale(prev => {
        const next = Math.max(0.5, Math.min(6, prev * delta));
        setOffset(o => clampOffset(o.x, o.y, next));
        return next;
      });
    }
  }, [scale, clampOffset]);

  // Scroll zoom
  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.08 : 0.93;
    setScale(prev => {
      const next = Math.max(0.5, Math.min(6, prev * delta));
      setOffset(o => clampOffset(o.x, o.y, next));
      return next;
    });
  };

  // Export cropped image as a Blob -> File
  function handleConfirm() {
    if (!imgRef.current) return;
    const img = imgRef.current;

    // Output resolution: 2× for retina
    const outW = CROP_W * 2;
    const outH = CROP_H * 2;
    const s = scale * 2;

    const iw = img.naturalWidth * s;
    const ih = img.naturalHeight * s;
    const drawX = outW / 2 - iw / 2 + offset.x * 2;
    const drawY = outH / 2 - ih / 2 + offset.y * 2;

    const out = document.createElement('canvas');
    out.width = outW;
    out.height = outH;
    const ctx = out.getContext('2d');

    if (config.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(outW / 2, outH / 2, Math.min(outW, outH) / 2, 0, Math.PI * 2);
      ctx.clip();
    } else if (config.shape === 'rounded') {
      ctx.beginPath();
      ctx.roundRect(0, 0, outW, outH, 32);
      ctx.clip();
    }

    ctx.drawImage(img, drawX, drawY, iw, ih);

    out.toBlob((blob) => {
      if (!blob) return;
      const croppedFile = new File([blob], file.name, { type: 'image/png' });
      onConfirm(croppedFile);
    }, 'image/png', 0.95);
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 200 }} onClick={onCancel}>
      <div className="centered-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-card" style={{ maxWidth: 420, padding: '1.5rem', userSelect: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{config.label}</h2>
            <button
              type="button"
              onClick={onCancel}
              style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1, padding: '0 0.25rem' }}
            >×</button>
          </div>

          {/* Crop canvas */}
          <div
            ref={containerRef}
            style={{
              width: CROP_W,
              height: CROP_H,
              margin: '0 auto',
              borderRadius: config.shape === 'circle' ? '50%' : '16px',
              overflow: 'hidden',
              background: '#1a1a2e',
              cursor: dragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              position: 'relative',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => { lastPinchDist.current = null; }}
            onWheel={onWheel}
          >
            {imageLoaded ? (
              <canvas
                ref={canvasRef}
                style={{ display: 'block', width: CROP_W, height: CROP_H }}
              />
            ) : (
              <div style={{ width: CROP_W, height: CROP_H, display: 'grid', placeItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Loading…</span>
              </div>
            )}
          </div>

          {/* Zoom slider */}
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', flexShrink: 0 }}>🔍</span>
            <input
              type="range"
              min={50}
              max={600}
              value={Math.round(scale * 100)}
              onChange={e => {
                const next = Number(e.target.value) / 100;
                setScale(next);
                setOffset(o => clampOffset(o.x, o.y, next));
              }}
              style={{ flex: 1, accentColor: 'var(--accent)' }}
            />
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted-2)', margin: '0.5rem 0 1.25rem' }}>
            {config.hint}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="soft-button-ghost" onClick={onCancel}>Cancel</button>
            <button type="button" className="soft-button" onClick={handleConfirm}>Apply crop</button>
          </div>
        </div>
      </div>
    </div>
  );
}
