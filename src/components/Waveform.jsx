import React, { useEffect, useRef } from 'react';

/**
 * Renders two waveforms side by side on a canvas:
 *  - referenceBuffer (blue): native pronunciation sample
 *  - recordedBuffer (red): user's recorded audio
 * Both are AudioBuffer objects from Web Audio API.
 */
export default function Waveform({ referenceBuffer, recordedBuffer, height = 80 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const drawBuffer = (buffer, color, yOffset, halfH) => {
      if (!buffer) return;
      const data = buffer.getChannelData(0);
      const step = Math.ceil(data.length / W);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < W; i++) {
        let min = 1, max = -1;
        for (let j = 0; j < step; j++) {
          const v = data[i * step + j] || 0;
          if (v < min) min = v;
          if (v > max) max = v;
        }
        const y1 = yOffset + (1 + min) * halfH * 0.5;
        const y2 = yOffset + (1 + max) * halfH * 0.5;
        if (i === 0) ctx.moveTo(i, (y1 + y2) / 2);
        else ctx.lineTo(i, (y1 + y2) / 2);
      }
      ctx.stroke();
    };

    const half = H / 2;
    // Reference (blue) on top half
    ctx.fillStyle = 'rgba(75,123,236,0.06)';
    ctx.fillRect(0, 0, W, half);
    drawBuffer(referenceBuffer, '#4b7bec', 0, half);

    // Divider
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, half); ctx.lineTo(W, half); ctx.stroke();

    // Recorded (red) on bottom half
    ctx.fillStyle = 'rgba(255,107,107,0.06)';
    ctx.fillRect(0, half, W, half);
    drawBuffer(recordedBuffer, '#ff6b6b', half, half);
  }, [referenceBuffer, recordedBuffer]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={340}
        height={height}
        style={{ width: '100%', height: `${height}px`, borderRadius: '12px', border: '1.5px solid rgba(0,0,0,0.08)' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', padding: '0 4px' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4b7bec' }}>🔵 Mẫu</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ff6b6b' }}>🔴 Giọng bé</span>
      </div>
    </div>
  );
}
