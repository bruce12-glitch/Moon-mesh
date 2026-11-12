import React, { useEffect, useRef, useState } from 'react';
import { BOOKS, CATALOG_SECTIONS, BookItem, PeekItem } from '../data/moonMeshData';
import { filterCatalogItems } from '../utils/moonMeshLogic';

interface CatalogModalProps {
  isOpen: boolean;
  mode: 'search' | 'saved';
  savedIds: Set<string>;
  onClose: () => void;
  onSelectBook: (book: BookItem) => void;
  onOpen3DScene: () => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  mode,
  savedIds,
  onClose,
  onSelectBook,
  onOpen3DScene,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      setQuery('');
      dialog.showModal();
      if (mode === 'search') {
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen, mode]);

  const allItems = [
    ...BOOKS.map((b) => ({
      id: b.id as string | undefined,
      title: b.title,
      theme: b.genre,
      keywords: `${b.description} ${b.previewDescription} ${b.keywords}`,
      image: b.coverImage,
      href: undefined as string | undefined,
      book: b as BookItem | undefined,
    })),
    ...(mode === 'search'
      ? CATALOG_SECTIONS.map((s) => ({
          ...s,
          id: undefined as string | undefined,
          book: undefined as BookItem | undefined,
        }))
      : []),
  ];

  const results = filterCatalogItems(allItems, query, mode, savedIds);

  const statusText =
    mode === 'saved'
      ? results.length
        ? 'Saved in this browser. Tap a book to peek inside.'
        : 'Tap a heart on a book to save it here.'
      : results.length
      ? query.trim()
        ? `${results.length} ${results.length === 1 ? 'match' : 'matches'}`
        : 'Explore books, 3D scenes, free pages, and more.'
      : 'No matches. Try a word like “moon,” “space,” or “printable.”';

  return (
    <dialog
      ref={dialogRef}
      id="catalog-dialog"
      className="dialog catalog-dialog"
      aria-labelledby="catalog-title"
      onClose={onClose}
    >
      <div className="dialog-close">
        <button type="button" aria-label="Close catalog" onClick={onClose}>
          <svg className="icon" aria-hidden="true">
            <use href="#close" />
          </svg>
        </button>
      </div>
      <p className="eyebrow">
        <svg className="icon" aria-hidden="true">
          <use href="#spark" />
        </svg>{' '}
        Moon Mesh
      </p>
      <h2 id="catalog-title">{mode === 'saved' ? 'Saved books' : 'Find a book or page'}</h2>
      {mode === 'search' && (
        <label className="catalog-search">
          <svg className="icon" aria-hidden="true">
            <use href="#search" />
          </svg>
          <span className="visually-hidden">Find a book or page</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try kitten, space, 3D, or printable…"
            autoComplete="off"
          />
        </label>
      )}
      <p className="catalog-status" role="status">
        {statusText}
      </p>
      <ul className="catalog-results">
        {results.map((item) => (
          <li key={item.id || item.title}>
            {item.book ? (
              <button
                type="button"
                className="catalog-result"
                onClick={() => {
                  onClose();
                  onSelectBook(item.book!);
                }}
              >
                <span className="result-art">
                  <img src={item.image} alt="" loading="lazy" />
                </span>
                <span className="result-label">
                  <strong>{item.title}</strong>
                  <small>{item.theme}</small>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            ) : (
              <a
                href={item.href}
                className="catalog-result"
                onClick={(e) => {
                  onClose();
                  if (item.href === '#three-studio') {
                    e.preventDefault();
                    onOpen3DScene();
                  }
                }}
              >
                <span className="result-art">
                  <img src={item.image} alt="" loading="lazy" />
                </span>
                <span className="result-label">
                  <strong>{item.title}</strong>
                  <small>{item.theme}</small>
                </span>
                <span aria-hidden="true">→</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </dialog>
  );
};

interface BookPreviewModalProps {
  book: BookItem | null;
  onClose: () => void;
  onTryFreePage: () => void;
}

export const BookPreviewModal: React.FC<BookPreviewModalProps> = ({
  book,
  onClose,
  onTryFreePage,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (book && !dialog.open) {
      dialog.showModal();
    } else if (!book && dialog.open) {
      dialog.close();
    }
  }, [book]);

  return (
    <dialog
      ref={dialogRef}
      id="book-dialog"
      className="dialog book-dialog"
      aria-labelledby="preview-title"
      onClose={onClose}
    >
      <div className="dialog-close">
        <button type="button" aria-label="Close book preview" onClick={onClose}>
          <svg className="icon" aria-hidden="true">
            <use href="#close" />
          </svg>
        </button>
      </div>
      {book && (
        <>
          <div className={`preview-art cocowyo-shelf-stage ${book.themeClass}`}>
            <div className="cocowyo-shelf-curtains" aria-hidden="true" />
            <div className="cocowyo-shelf-wood" aria-hidden="true" />
            <div className="cocowyo-book-stage-group" aria-hidden="true">
              <img
                src="/assets/prop-courier-bird.webp"
                alt=""
                className="book-stage-prop prop-courier-bird"
              />
              <img
                src="/assets/prop-open-easel.webp"
                alt=""
                className="book-stage-prop prop-open-easel"
              />
              <img
                src="/assets/prop-alcohol-marker.webp"
                alt=""
                className="book-stage-prop prop-alcohol-marker"
              />
              <span className="standing-3d-book-figure">
                <img
                  src="/assets/standing-3d-book.webp"
                  width={670}
                  height={745}
                  alt=""
                  className="standing-3d-book-img"
                />
                <span className="standing-3d-book-sheen" />
              </span>
            </div>
          </div>
          <div className="preview-copy">
            <p className="eyebrow">
              <svg className="icon" aria-hidden="true">
                <use href="#spark" />
              </svg>{' '}
              {book.number} · {book.genre}
            </p>
            <h2 id="preview-title">{book.title}</h2>
            <p id="preview-description">{book.previewDescription}</p>
            <div className="dialog-actions">
              <a
                className="button button-ink preview-amazon whitespace-nowrap"
                href="https://www.amazon.com/s?k=Moon+Mesh+coloring+books"
                target="_blank"
                rel="noopener noreferrer"
              >
                Find on Amazon <span aria-hidden="true">↗</span>
              </a>
              <button
                className="text-link whitespace-nowrap"
                type="button"
                id="preview-color"
                onClick={() => {
                  onClose();
                  onTryFreePage();
                }}
              >
                Try a free page{' '}
                <svg className="icon" aria-hidden="true">
                  <use href="#arrow" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
};

interface PeekPreviewModalProps {
  peek: PeekItem | null;
  onClose: () => void;
  onColorFreePage: () => void;
}

export const PeekPreviewModal: React.FC<PeekPreviewModalProps> = ({
  peek,
  onClose,
  onColorFreePage,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (peek && !dialog.open) {
      dialog.showModal();
    } else if (!peek && dialog.open) {
      dialog.close();
    }
  }, [peek]);

  return (
    <dialog
      ref={dialogRef}
      id="peek-dialog"
      className="dialog peek-dialog"
      aria-labelledby="peek-dialog-title"
      onClose={onClose}
    >
      <div className="dialog-close">
        <button type="button" aria-label="Close page preview" onClick={onClose}>
          <svg className="icon" aria-hidden="true">
            <use href="#close" />
          </svg>
        </button>
      </div>
      {peek && (
        <>
          <div className="peek-dialog-art">
            <img
              id="peek-dialog-image"
              src={peek.coloredSvg}
              width={1254}
              height={1254}
              alt={`Colored illustration: ${peek.title}.`}
            />
          </div>
          <div className="peek-dialog-copy">
            <p className="eyebrow">
              <svg className="icon" aria-hidden="true">
                <use href="#spark" />
              </svg>{' '}
              Peek inside
            </p>
            <h2 id="peek-dialog-title">{peek.title}</h2>
            <p id="peek-dialog-description">{peek.description}</p>
            <div className="dialog-actions">
              <button
                type="button"
                className="button button-ink whitespace-nowrap"
                id="peek-dialog-cta"
                onClick={() => {
                  onClose();
                  onColorFreePage();
                }}
              >
                Color the free page{' '}
                <svg className="icon" aria-hidden="true">
                  <use href="#arrow" />
                </svg>
              </button>
              <button type="button" className="text-link whitespace-nowrap" onClick={onClose}>
                Back to the pages
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
};
