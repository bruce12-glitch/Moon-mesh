import React, { useEffect, useRef, useState } from 'react';
import { STUDIO_PALETTE, CrayonSwatch } from '../data/moonMeshData';
import { isEraserSwatch } from '../utils/moonMeshLogic';

interface ColoringStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ColoringStudioModal: React.FC<ColoringStudioModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedSwatch, setSelectedSwatch] = useState<CrayonSwatch>(STUDIO_PALETTE[0]);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [hasColored, setHasColored] = useState<boolean>(false);
  const [svgLoaded, setSvgLoaded] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Sync dialog open/close state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Load interactive SVG coloring page
  useEffect(() => {
    if (!isOpen || !canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    if (container.querySelector('svg')) {
      setSvgLoaded(true);
      return;
    }

    let cancelled = false;
    container.textContent = 'Getting Miso’s page ready…';
    container.setAttribute('aria-busy', 'true');

    fetch('/assets/miso-moon-coloring.svg')
      .then((res) => {
        if (!res.ok) throw new Error('Coloring page unavailable');
        return res.text();
      })
      .then((svgText) => {
        if (cancelled) return;
        const parsed = new DOMParser().parseFromString(svgText, 'image/svg+xml');
        const svg = parsed.documentElement;
        if (!svg || svg.localName !== 'svg') throw new Error('Invalid SVG');
        svg.setAttribute('role', 'group');
        svg.setAttribute('aria-label', 'Miso and the Moon coloring shapes');
        svg.querySelectorAll<HTMLElement>('[data-part]').forEach((part) => {
          part.setAttribute('tabindex', '0');
          part.setAttribute('role', 'button');
          part.setAttribute('aria-label', part.dataset.part || 'Shape');
        });
        container.replaceChildren(document.importNode(svg, true));
        container.removeAttribute('aria-busy');
        setSvgLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        container.textContent =
          'The coloring page couldn’t load. Close the studio and try again, or print the blank page below.';
        container.removeAttribute('aria-busy');
        setSvgLoaded(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const colorShape = (part: HTMLElement) => {
    const partName = part.dataset.part || 'Shape';
    const eraser = isEraserSwatch(selectedSwatch.color);
    part.style.fill = selectedSwatch.color;
    part.setAttribute('aria-label', eraser ? partName : `${partName}, ${selectedSwatch.label}`);
    setStatusMessage(
      eraser
        ? `${partName} erased.`
        : `${partName} colored ${selectedSwatch.label.toLowerCase()}.`
    );
    setHasColored(true);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-part]');
    if (target) {
      colorShape(target);
    }
  };

  const handleCanvasKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-part]');
    if (target && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      colorShape(target);
    }
  };

  const handleReset = () => {
    const container = canvasContainerRef.current;
    if (!container) return;
    container.querySelectorAll<HTMLElement>('[data-part]').forEach((part) => {
      part.style.removeProperty('fill');
      part.setAttribute('aria-label', part.dataset.part || 'Shape');
    });
    setStatusMessage('Coloring page cleared.');
    setHasColored(false);
  };

  const handleDownloadPng = async () => {
    const svg = canvasContainerRef.current?.querySelector('svg');
    if (!svg) return;
    setIsDownloading(true);
    setStatusMessage('Wrapping up your page…');
    let svgUrl: string | undefined;
    try {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('width', '1040');
      clone.setAttribute('height', '1040');
      clone.removeAttribute('role');
      clone.removeAttribute('aria-label');
      clone.querySelectorAll('[role], [tabindex]').forEach((el) => {
        el.removeAttribute('role');
        el.removeAttribute('tabindex');
      });
      const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], {
        type: 'image/svg+xml;charset=utf-8',
      });
      svgUrl = URL.createObjectURL(svgBlob);
      const image = new Image();
      image.decoding = 'async';
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('Could not draw page'));
        image.src = svgUrl!;
      });

      const output = document.createElement('canvas');
      output.width = 1040;
      output.height = 1040;
      const context = output.getContext('2d');
      if (!context) throw new Error('Canvas unavailable');
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, 1040, 1040);
      context.drawImage(image, 0, 0, 1040, 1040);

      const pngBlob = await new Promise<Blob | null>((resolve) =>
        output.toBlob(resolve, 'image/png')
      );
      if (!pngBlob) throw new Error('PNG generation failed');
      const pngUrl = URL.createObjectURL(pngBlob);
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = 'miso-and-the-moon.png';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(pngUrl), 4000);
      setStatusMessage('Your page is saved as a PNG in your downloads.');
    } catch {
      setStatusMessage('The PNG couldn’t be made. You can still print the blank page below.');
    } finally {
      if (svgUrl) URL.revokeObjectURL(svgUrl);
      setIsDownloading(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id="color-dialog"
      className="dialog color-dialog"
      aria-labelledby="studio-title"
      onClose={onClose}
    >
      <div className="dialog-close">
        <button type="button" aria-label="Close coloring studio" onClick={onClose}>
          <svg className="icon" aria-hidden="true">
            <use href="#close" />
          </svg>
        </button>
      </div>
      <div className="studio-head">
        <p className="eyebrow">
          <svg className="icon" aria-hidden="true">
            <use href="#spark" />
          </svg>{' '}
          Moon Mesh Coloring Club
        </p>
        <h2 id="studio-title">Miso &amp; the Moon</h2>
        <p>Choose a crayon from our Moon Mesh palette, then tap a shape — or press Enter on it.</p>
        <p id="studio-status" className="visually-hidden" role="status">
          {statusMessage}
        </p>
      </div>
      <div className="studio-layout">
        <div
          ref={canvasContainerRef}
          id="color-canvas"
          className="color-canvas"
          onClick={handleCanvasClick}
          onKeyDown={handleCanvasKeyDown}
        />
        <div className="studio-controls">
          <fieldset className="palette-field">
            <legend>Pick a crayon</legend>
            <div className="palette" role="group" aria-label="Crayon colors">
              {STUDIO_PALETTE.map((swatch) => {
                const isSelected = selectedSwatch.color === swatch.color;
                return (
                  <button
                    key={swatch.color}
                    type="button"
                    data-color={swatch.color}
                    style={{ ['--swatch' as string]: swatch.color }}
                    aria-label={swatch.label}
                    aria-pressed={isSelected}
                    title={`${swatch.label} (${swatch.role})`}
                    onClick={() => {
                      setSelectedSwatch(swatch);
                      setStatusMessage(`${swatch.label} selected.`);
                    }}
                  />
                );
              })}
            </div>
          </fieldset>
          {svgLoaded && (
            <button
              className="button button-paper studio-action whitespace-nowrap"
              id="download-art"
              type="button"
              disabled={isDownloading}
              onClick={handleDownloadPng}
            >
              <svg className="icon" aria-hidden="true">
                <use href="#download" />
              </svg>{' '}
              Save my page
            </button>
          )}
          <button
            className="text-link studio-action"
            id="reset-color"
            type="button"
            disabled={!hasColored}
            onClick={handleReset}
          >
            Start over
          </button>
          <a
            className="text-link studio-action"
            href="/assets/miso-moon-coloring.pdf"
            download
          >
            <svg className="icon" aria-hidden="true">
              <use href="#download" />
            </svg>{' '}
            Print the blank page
          </a>
          <p className="studio-note">
            Your colors stay in this browser tab. Nothing is uploaded.
          </p>
        </div>
      </div>
    </dialog>
  );
};
