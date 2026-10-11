# Image credits and sourcing — `public/images/`

Every image served by the site is listed below with its source, the licence it is
used under, and the place(s) it appears. Nothing in `public/images/` carries a
watermark, and nothing is hot-linked: all assets are self-hosted so the preview
and the deployed site behave identically.

## How this set was sourced

The brief's first preference was Pexels (free tier, no watermark). Pexels was
attempted first, but **direct download from `images.pexels.com` is blocked in
this build environment** (every request returns HTTP 000 — see the errors log in
`DESIGN-INVENTORY.md` §14), so Pexels could not be used for the shipped assets.

The shipped set is therefore **rendered for this project** with the image
generation tool, which is the second option the brief allows. There are no
third-party rights, no attribution obligations and no watermarks attached to any
generated file — but they are illustrative assets, not photographs of real
artworks, and the catalogue descriptions are sample content (see
"Representative content" below). If the house later replaces them with Pexels
photography, use the swap table at the end of this document and keep the credit
line for each image.

## Shipped assets

All files are JPEG, progressive, quality 84–88, sRGB.

| File | Dimensions | Rendered prompt, in short | Used by |
| --- | --- | --- | --- |
| `hero-gallery.jpg` | 1584×672 | Warm-lit Nairobi gallery interior, framed East African paintings on a sand-coloured wall, concrete floor | Home hero (EFFECT-18 gradient band), `/sell` supporting image |
| `lot-painting-01.jpg` | 1024×1024 | Large ochre and earth abstract on linen, scraped-back layers, single sweeping gesture | Lot 001 *Ground Truth No. 7*, Wanjiru Kamau — home featured rail, `/lots` grid |
| `lot-painting-02.jpg` | 1024×1024 | Deep indigo and charcoal gestural canvas, heavy impasto, gallery-lit | Lot 002, Hassan Mwinyi — catalogue, artist card |
| `lot-painting-03.jpg` | 928×1152 | Vertical figurative painting, two figures in warm light, broad brushwork | Lot 003, Achieng' Odhiambo — catalogue, artist card |
| `lot-painting-04.jpg` | 1200×896 | Market scene in saturated primary colour, flat planes, mid-century East African modernism | Lot 004, Hassan Mwinyi — catalogue, artist card |
| `lot-painting-05.jpg` | 1024×1024 | Portrait head study, terracotta and umber, textured ground | Lot 005, Achieng' Odhiambo — catalogue, artist card |
| `lot-painting-06.jpg` | 1200×896 | Minimal abstract, two ochre fields on raw linen, visible weave | Lot 006, Wanjiru Kamau — catalogue, artist card |
| `lot-sculpture-01.jpg` | 928×1152 | Carved ebony vertical form on an integral base, oiled, raking gallery light | Lot 007 *Heartwood I*, Joseph Kimathi |
| `lot-sculpture-02.jpg` | 1024×1024 | Soapstone torso, matte finish, on a plinth against a warm grey wall | Lot 008, Nakato Nabirye |
| `lot-sculpture-03.jpg` | 1024×1024 | Cast bronze figurative form, green-brown patina, dark background | Lot 009, Nakato Nabirye |

### Category images — **interim, to be replaced**

Image generation is capped at ten images per pass and that budget was already
spent on the ten files above when these nine filenames were reached. They are
present so that no lot card, gallery tile or OG image resolves to a 404, and they
are **cropped derivatives of the generated set above, not purpose-rendered
photography**. They will be overwritten, in place and under the same filenames,
with proper catalogue photography — a street photograph and a portrait for the
photography lots, a hand-woven indigo cloth for the textiles, a wood-fired vessel
and charger for the ceramics, and a beaded collar and brass torque for the
jewellery.

| File | Dimensions | Interim source | Destination lot(s) |
| --- | --- | --- | --- |
| `lot-photography-01.jpg` | 900×909 | crop of `hero-gallery.jpg` | Selam Tesfaye photography lots |
| `lot-photography-02.jpg` | 900×908 | crop of `hero-gallery.jpg` | Selam Tesfaye photography lots |
| `lot-photography-03.jpg` | 1200×896 | crop of `lot-painting-06.jpg` | Selam Tesfaye photography lots |
| `lot-textiles-01.jpg` | 1200×762 | crop of `lot-painting-06.jpg` | Zawadi Mushi textile lots |
| `lot-textiles-02.jpg` | 1200×761 | crop of `lot-painting-04.jpg` | Zawadi Mushi textile lots |
| `lot-ceramics-01.jpg` | 1024×1024 | crop of `lot-sculpture-02.jpg` | Baraka Otieno ceramic lots |
| `lot-ceramics-02.jpg` | 1024×820 | crop of `lot-sculpture-02.jpg` | Baraka Otieno ceramic lots |
| `lot-jewellery-01.jpg` | 1024×1024 | crop of `lot-sculpture-03.jpg` | Amara Nkemdirim jewellery lots |
| `lot-jewellery-02.jpg` | 1024×819 | crop of `lot-sculpture-03.jpg` | Amara Nkemdirim jewellery lots |

## Pexels swap table

These are the best of the ten supplied queries, captured into `image-search/`
during research (that folder is not shipped — `outputFileTracingExcludes` keeps
it out of the build). Sizes are the real pixel dimensions of each capture. Before
any of them is promoted into `public/images/`, record its Pexels photo URL and
photographer here, because the Pexels licence requires credit.

| Query | Best candidate in `image-search/` | Dimensions | Suggested use |
| --- | --- | --- | --- |
| `nairobi art gallery interior` | `nairobi-art-gallery-interior-1.jpg` | 5153×3111 | Future hero/OG background |
| `nairobi art gallery interior` | `nairobi-art-gallery-interior-3.jpg` | 1000×562 | Supporting image, `/sell` |
| `east african art exhibition` | `east-african-art-exhibition-2.jpg` | 2640×1650 | Auction cover, `/upcoming-lots` |
| `african textile art weaving` | `african-textile-art-weaving-1.jpg` | 1200×800 | Textile lot swap |
| `african photographer camera artist` | `african-photographer-camera-artist-3.jpg` | 1200×690 | Photography lot swap |
| `kenyan craft market beadwork` | `kenyan-craft-market-beadwork-1.jpg` | 800×445 | Outdoors/craft-market strip |
| `kenyan craft market beadwork` | `kenyan-craft-market-beadwork-3.jpg` | 900×413 | Outdoors/craft-market strip |
| `african jewellery handmade` | `african-jewellery-handmade-4.jpg` | 600×600 | Jewellery lot swap (thumbnail only) |
| `african artist portrait studio working` | `african-artist-portrait-studio-working-3.jpg` | 612×408 | Editorial only — too small for a hero |

Rejected as below usable resolution for a commerce page: `african-woman-artist-painting-1/3`
(340×270), `east-african-wood-carving-craft-2/3` (300×300, 240×240),
`african-jewellery-handmade-1` (300×300), and `african-woman-artist-painting-4.png`,
which is a 1×1 placeholder file (68 bytes) and must never be copied.

## Representative content

Artist names, biographies, exhibition histories, lot descriptions, provenance,
condition reports and hammer prices are **representative sample content** written
for this build. They are internally consistent and plausible for the East African
market, but they are not records of real sales, and no real collector, gallery or
institution is named as a consignor. Replace the `src/data/` files with the
house's real catalogue before the site goes live, and re-check every image credit
above at the same time.
