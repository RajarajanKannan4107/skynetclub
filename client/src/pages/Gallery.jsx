import GalleryGrid from '../components/shared/GalleryGrid'

// Exactly 10 gallery slots using local asset paths.
// Photographs will be placed at client/public/gallery/photo-01.jpg through photo-10.jpg.
const GALLERY_ITEMS = [
  { slot: 1,  image_url: '/gallery/photo-01.jpg', alt_text: 'SkyNet event photo 1',  caption: '' },
  { slot: 2,  image_url: '/gallery/photo-02.jpg', alt_text: 'SkyNet event photo 2',  caption: '' },
  { slot: 3,  image_url: '/gallery/photo-03.jpg', alt_text: 'SkyNet event photo 3',  caption: '' },
  { slot: 4,  image_url: '/gallery/photo-04.jpg', alt_text: 'SkyNet event photo 4',  caption: '' },
  { slot: 5,  image_url: '/gallery/photo-05.jpg', alt_text: 'SkyNet event photo 5',  caption: '' },
  { slot: 6,  image_url: '/gallery/photo-06.jpg', alt_text: 'SkyNet event photo 6',  caption: '' },
  { slot: 7,  image_url: '/gallery/photo-07.jpg', alt_text: 'SkyNet event photo 7',  caption: '' },
  { slot: 8,  image_url: '/gallery/photo-08.jpg', alt_text: 'SkyNet event photo 8',  caption: '' },
  { slot: 9,  image_url: '/gallery/photo-09.jpg', alt_text: 'SkyNet event photo 9',  caption: '' },
  { slot: 10, image_url: '/gallery/photo-10.jpg', alt_text: 'SkyNet event photo 10', caption: '' },
]

export default function Gallery() {
  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Page header */}
        <div className="mb-12">
          <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-4">
            Gallery
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-4">
            In the moment
          </h1>
          <p className="text-text-muted text-base max-w-xl">
            A visual record of SkyNet events, workshops, and community moments
            at SRM IST Ramapuram.
          </p>
        </div>

        {/* 10-slot gallery grid with lightbox */}
        <GalleryGrid items={GALLERY_ITEMS} />

        {/* Footnote */}
        <p className="text-text-muted text-xs mt-8">
          {GALLERY_ITEMS.length} photographs · Click any image to expand
        </p>
      </div>
    </div>
  )
}
