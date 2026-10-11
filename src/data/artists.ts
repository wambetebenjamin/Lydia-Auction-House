/**
 * Artist roster — East African artists represented by the house.
 *
 * Card imagery is deliberately gallery-forward: artist cards lead with a work
 * from the portfolio rather than a portrait, which is both truer to an auction
 * house and avoids implying a photographic likeness of a real person. Provenance
 * for every image is recorded in /image-credits.md.
 *
 * NOTE: This is representative sample content for a demonstration build.
 * The artists are illustrative and are not real individuals.
 */

import type { Artist } from '@/lib/types';

export const artists: Artist[] = [
  {
    slug: 'wanjiru-kamau',
    name: 'Wanjiru Kamau',
    location: 'Nairobi',
    country: 'Kenya',
    disciplines: ['paintings'],
    medium: 'Oil and mixed media on canvas',
    born: 'b. 1978, Nyeri',
    portrait: '/images/lot-painting-01.jpg',
    portraitAlt: 'Abstract oil painting in ochre and forest green by Wanjiru Kamau',
    bio: [
      'Wanjiru Kamau is one of the most collected painters working in Nairobi today. Trained at the Buruburu Institute of Fine Art before a decade spent between Nairobi and Johannesburg, she builds her surfaces in layers — raw pigment bound with local earth, scraped back, then reworked until the canvas carries the weight of its own making.',
      'Her practice sits at the meeting point of abstraction and memory. The ochres and forest greens that dominate her recent work are mixed to match soil samples taken from her grandmother\u2019s shamba in Nyeri, a palette she has returned to for over fifteen years.',
      'Kamau\u2019s work has entered the permanent collections of two regional banks and a number of private collections across Kenya, South Africa and the United Kingdom.',
    ],
    statement:
      'I am not painting a landscape. I am painting what the land does to a person who has left it.',
    exhibitions: [
      { year: '2026', title: 'Ground Truth', venue: 'Circle Art Gallery, Nairobi' },
      { year: '2025', title: 'Nairobi Contemporary', venue: 'The GoDown Arts Centre, Nairobi' },
      { year: '2024', title: 'Terrain', venue: 'Everard Read, Johannesburg' },
      { year: '2023', title: 'Red Earth', venue: 'One Off Gallery, Nairobi' },
      { year: '2021', title: 'New Painting from East Africa', venue: 'October Gallery, London' },
    ],
    awards: ['East African Art Prize, Painting — 2025', 'Nairobi Arts Trust Bursary — 2019'],
  },
  {
    slug: 'hassan-mwinyi',
    name: 'Hassan Mwinyi',
    location: 'Lamu',
    country: 'Kenya',
    disciplines: ['paintings'],
    medium: 'Oil on canvas',
    born: 'b. 1965, Lamu',
    portrait: '/images/lot-painting-06.jpg',
    portraitAlt: 'Coastal oil painting of dhows on turquoise water by Hassan Mwinyi',
    bio: [
      'Hassan Mwinyi has spent his working life on the Lamu archipelago, and it shows. A former dhow crewman, he paints the water he sailed — not as a backdrop but as a body with its own temperament, its own grammar of light.',
      'His canvases are built up in loose, confident strokes that stop well short of finish. Critics have described his method as \u201cleaving the painting open,\u201d and Mwinyi agrees: \u201cIf I close it, the tide stops.\u201d',
      'Now in his sixtieth year, Mwinyi is regarded as the senior figure of the Kenyan coastal school. This is his first sale with the house.',
    ],
    statement: 'The sea does not pose. You either catch it or you do not.',
    exhibitions: [
      { year: '2026', title: 'Dhow Days', venue: 'Lamu Museum, Lamu' },
      { year: '2024', title: 'The Coastal School', venue: 'Mombasa Arts Hub' },
      { year: '2022', title: 'Indian Ocean', venue: 'Alliance Fran\u00e7aise, Nairobi' },
      { year: '2018', title: 'Unguja', venue: 'Zanzibar Art Space' },
    ],
  },
  {
    slug: 'achieng-odhiambo',
    name: "Achieng' Odhiambo",
    location: 'Kisumu',
    country: 'Kenya',
    disciplines: ['paintings'],
    medium: 'Acrylic and oil on canvas',
    born: 'b. 1990, Kisumu',
    portrait: '/images/lot-painting-03.jpg',
    portraitAlt: 'Figurative portrait of a woman in a patterned headwrap by Achieng\u2019 Odhiambo',
    bio: [
      "Achieng' Odhiambo paints people in the exact moment they are not being looked at. Her figures — market traders, boda riders, her own aunts — are caught mid-gesture, mid-sentence, in the ordinary business of a life.",
      'She works fast, usually completing a canvas in a single sitting, and refuses to photograph her sitters. Every figure in her work is drawn from memory, which gives the paintings their particular combination of bluntness and warmth.',
      'Odhiambo was the youngest artist included in the 2025 Nairobi Contemporary survey, and her work sold out in the first hour of the opening.',
    ],
    statement: 'I paint them from memory because memory is honest. A photograph is too polite.',
    exhibitions: [
      { year: '2026', title: 'Kisumu Hands', venue: 'Kisumu Museum' },
      { year: '2025', title: 'Nairobi Contemporary', venue: 'The GoDown Arts Centre, Nairobi' },
      { year: '2025', title: 'Young Kenya', venue: 'Nafasi Art Space, Dar es Salaam' },
      { year: '2023', title: 'First Marks', venue: 'Kuona Trust, Nairobi' },
    ],
    awards: ['Nairobi Contemporary Emerging Artist Award — 2025'],
  },
  {
    slug: 'joseph-kimathi',
    name: 'Joseph Kimathi',
    location: 'Nyeri',
    country: 'Kenya',
    disciplines: ['sculpture'],
    medium: 'Ebony and mvule wood',
    born: 'b. 1971, Nyeri',
    portrait: '/images/lot-sculpture-01.jpg',
    portraitAlt: 'Carved ebony figure with flowing contours by Joseph Kimathi',
    bio: [
      'Joseph Kimathi carves in ebony salvaged from fallen trees and demolition sites across the Aberdare range. Nothing in his studio was cut for the purpose.',
      'He works without preparatory drawings, reading the grain and allowing the form to follow it. The resulting figures are elongated and quietly monumental, often faceless — a choice he describes as \u201clooking inward rather than at.\u201d',
      'Kimathi apprenticed under the Kenyan carver Elijah Kariuki and has exhibited in Nairobi, Kampala and, in 2024, at the Smithsonian\u2019s National Museum of African Art.',
    ],
    statement: 'The tree already knew the shape. My work is to stop getting in the way.',
    exhibitions: [
      { year: '2026', title: 'Heartwood', venue: 'One Off Gallery, Nairobi' },
      { year: '2025', title: 'Sculpture Now: East Africa', venue: 'Kampala Art Biennale' },
      { year: '2024', title: 'Carvers', venue: 'National Museum of African Art, Washington DC' },
      { year: '2021', title: 'Aberdare', venue: 'Nyeri Regional Museum' },
    ],
    awards: ['East African Art Prize, Sculpture — 2024'],
  },
  {
    slug: 'nakato-nabirye',
    name: 'Nakato Nabirye',
    location: 'Kampala',
    country: 'Uganda',
    disciplines: ['sculpture'],
    medium: 'Cast bronze and Kisii soapstone',
    born: 'b. 1984, Kampala',
    portrait: '/images/lot-sculpture-03.jpg',
    portraitAlt: 'Cast bronze figure caught mid-stride by Nakato Nabirye',
    bio: [
      'Nakato Nabirye casts movement. Her bronzes are resolved at the precise instant before balance is lost — a run, a reach, a fall that has not yet happened.',
      'She was trained in Kampala and at the Fonderia Artistica in Pietrasanta, Italy, where she spent four years learning the lost-wax method. She now runs the only artist-operated bronze foundry in Uganda.',
      'Nabirye\u2019s work is held in the collection of the Uganda National Cultural Centre and in private collections in Kenya, Italy and Nigeria.',
    ],
    statement: 'A still figure is a stopped clock. I am interested in the second before.',
    exhibitions: [
      { year: '2026', title: 'Mid-Stride', venue: 'Afriart Gallery, Kampala' },
      { year: '2025', title: 'Sculpture Now: East Africa', venue: 'Kampala Art Biennale' },
      { year: '2023', title: 'Lost Wax', venue: 'Pietrasanta Arte, Italy' },
      { year: '2022', title: 'Bronze from the Lake', venue: 'Alliance Fran\u00e7aise, Kampala' },
    ],
  },
  {
    slug: 'selam-tesfaye',
    name: 'Selam Tesfaye',
    location: 'Addis Ababa',
    country: 'Ethiopia',
    disciplines: ['photography'],
    medium: 'Gelatin silver print, archival pigment print',
    born: 'b. 1982, Addis Ababa',
    portrait: '/images/lot-painting-05.jpg',
    portraitAlt: 'Geometric abstract composition by Selam Tesfaye\u2019s studio',
    bio: [
      'Selam Tesfaye photographs streets at the hour they stop performing. Working almost exclusively at midday and in black and white, she builds images out of shadow and flat, uncompromising light.',
      'Her long-running series \u201cTen Stations\u201d documents the arcades between Addis Ababa\u2019s Merkato and the Piassa roundabout — a quarter she has photographed for eleven years without once repeating a frame.',
      'Prints are held by the Addis Fine Art collection and several European private collections. Each edition is limited to eight.',
    ],
    statement: 'At noon there is nowhere to hide, including for me.',
    exhibitions: [
      { year: '2026', title: 'Ten Stations', venue: 'Addis Fine Art, Addis Ababa' },
      { year: '2025', title: 'Eastern Voices', venue: 'Addis Fine Art, London' },
      { year: '2024', title: 'Aperture Summer Open', venue: 'New York' },
      { year: '2021', title: 'Merkato', venue: 'Goethe-Institut, Addis Ababa' },
    ],
    awards: ['Aperture Portfolio Prize, shortlist — 2024'],
  },
  {
    slug: 'zawadi-mushi',
    name: 'Zawadi Mushi',
    location: 'Dar es Salaam',
    country: 'Tanzania',
    disciplines: ['textiles'],
    medium: 'Hand-woven cotton, natural indigo, wax-resist',
    born: 'b. 1969, Tanga',
    portrait: '/images/lot-painting-04.jpg',
    portraitAlt: 'Layered landscape in indigo and olive by Zawadi Mushi',
    bio: [
      'Zawadi Mushi is a weaver first and an artist second, in her own ordering. She runs a workshop of nine in Dar es Salaam producing hand-woven cotton dyed with indigo grown in the Morogoro highlands.',
      'Her wall works depart from the functional cloth the workshop otherwise produces. They are woven, dyed, unpicked and re-woven — sometimes four or five times — until the surface carries the history of its own construction.',
      'Mushi\u2019s textiles were included in the 2025 Venice Biennale collateral programme and entered the Tanzanian National Museum collection in 2024.',
    ],
    statement: 'Cloth remembers. Every time I undo a row, it stays visible.',
    exhibitions: [
      { year: '2025', title: 'Personal Structures', venue: 'Venice Biennale (collateral)' },
      { year: '2025', title: 'Indigo', venue: 'Nafasi Art Space, Dar es Salaam' },
      { year: '2024', title: 'Woven Ground', venue: 'Tanzanian National Museum' },
      { year: '2022', title: 'Textile East', venue: 'Nairobi National Museum' },
    ],
  },
  {
    slug: 'amara-nkemdirim',
    name: 'Amara Nkemdirim',
    location: 'Nairobi',
    country: 'Kenya',
    disciplines: ['jewellery'],
    medium: 'Recycled brass, Maasai beadwork, sterling silver',
    born: 'b. 1988, Nairobi',
    portrait: '/images/lot-painting-02.jpg',
    portraitAlt: 'Warm figurative composition by Amara Nkemdirim\u2019s studio',
    bio: [
      'Amara Nkemdirim makes wearable sculpture. Working from recycled brass sourced from Nairobi\u2019s Gikomba market, she combines cast forms with beadwork produced by a collective of Maasai women in Kajiado County.',
      'Each piece is a collaboration and is credited as such. A percentage of every sale returns directly to the Kajiado collective.',
      'Her commissions include ceremonial work for two Nairobi galleries and a 2025 capsule collection shown at Design Indaba.',
    ],
    statement: 'An ornament is a small sculpture that gets to live a life.',
    exhibitions: [
      { year: '2026', title: 'Adornment', venue: 'Nairobi Design Week' },
      { year: '2025', title: 'Design Indaba', venue: 'Cape Town' },
      { year: '2024', title: 'Brass and Bead', venue: 'Kuona Trust, Nairobi' },
    ],
    awards: ['Nairobi Design Week Material Innovation Award — 2026'],
  },
  {
    slug: 'baraka-otieno',
    name: 'Baraka Otieno',
    location: 'Mombasa',
    country: 'Kenya',
    disciplines: ['ceramics'],
    medium: 'Stoneware, wood-fired, ash glaze',
    born: 'b. 1976, Mombasa',
    portrait: '/images/lot-painting-06.jpg',
    portraitAlt: 'Coastal palette composition by Baraka Otieno\u2019s studio',
    bio: [
      'Baraka Otieno fires with wood only, in a kiln he built himself from coral rag and salvaged brick. It takes three days to reach temperature and he sits with it the whole time.',
      'His vessels are unglazed on the outside and glazed within, a reversal he arrived at by accident and has pursued ever since. The ash from the fire does the rest.',
      'Otieno teaches at the Mombasa Polytechnic and has been firing continuously for twenty-two years.',
    ],
    statement: 'I am not the one making the surface. The fire makes the surface. I only make the shape.',
    exhibitions: [
      { year: '2026', title: 'Three Days Burning', venue: 'Mombasa Arts Hub' },
      { year: '2024', title: 'Clay Coast', venue: 'Lamu Museum' },
      { year: '2023', title: 'Woodfire East Africa', venue: 'Nairobi National Museum' },
    ],
  },
];

export const artistBySlug = new Map(artists.map((a) => [a.slug, a]));

export function getArtist(slug: string): Artist | undefined {
  return artistBySlug.get(slug);
}
