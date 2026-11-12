import { useState } from 'react'
import Modal from '../ui/Modal'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'

function GalleryImage({ src, alt, caption, onClick, index }) {
  const [errored, setErrored] = useState(false)

  if (errored || !src) {
    return (
      <button
        className="relative aspect-[4/3] w-full bg-surface-2 border border-border rounded overflow-hidden
                   flex flex-col items-center justify-center gap-2 cursor-default"
        aria-label={`Gallery slot ${index + 1} — image pending`}
        tabIndex={-1}
        disabled
      >
        <ImageIcon className="w-7 h-7 text-text-muted" strokeWidth={1.5} />
        <span className="text-text-muted text-xs">Photo {index + 1}</span>
      </button>
    )
  }

  return (
    <button
      onClick={() => onClick(index)}
      className="relative aspect-[4/3] w-full bg-surface-2 border border-border rounded overflow-hidden
                 group cursor-zoom-in focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                 focus-visible:ring-offset-background"
      aria-label={alt || `Gallery photo ${index + 1}`}
    >
      <img
        src={src}
        alt={alt || `Gallery photo ${index + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        onError={() => setErrored(true)}
      />
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2
                        translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <p className="text-text-primary text-xs">{caption}</p>
        </div>
      )}
    </button>
  )
}

export default function GalleryGrid({ items }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const validItems = items.filter((item) => item.image_url && !item._errored)

  const goTo = (i) => {
    const len = validItems.length
    setLightboxIndex(((i % len) + len) % len)
  }

  const currentItem = lightboxIndex !== null ? validItems[lightboxIndex] : null

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <GalleryImage
            key={item.slot ?? i}
            src={item.image_url}
            alt={item.alt_text}
            caption={item.caption}
            index={i}
            onClick={(idx) => {
              // Map real index to validItems index
              const vi = validItems.findIndex((v) => v === item)
              if (vi !== -1) setLightboxIndex(vi)
            }}
          />
        ))}
      </div>

      {/* Lightbox */}
      <Modal
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        className="max-w-5xl w-full"
      >
        {currentItem && (
          <div className="relative">
            <img
              src={currentItem.image_url}
              alt={currentItem.alt_text || 'Gallery photo'}
              className="max-h-[80vh] max-w-full rounded object-contain mx-auto block"
            />
            {currentItem.caption && (
              <p className="text-center text-text-secondary text-sm mt-3">
                {currentItem.caption}
              </p>
            )}
            {validItems.length > 1 && (
              <>
                <button
                  onClick={() => goTo(lightboxIndex - 1)}
                  className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2
                             p-2 bg-surface/80 sm:bg-transparent rounded-full sm:rounded-none
                             text-text-secondary hover:text-text-primary transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => goTo(lightboxIndex + 1)}
                  className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2
                             p-2 bg-surface/80 sm:bg-transparent rounded-full sm:rounded-none
                             text-text-secondary hover:text-text-primary transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
