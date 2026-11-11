export interface HeroSlide {
  id: string;
  eyebrow: string;
  titleLines: string[];
  accentLine?: string;
  subtitle: string;
  signoff?: string;
  bgColor: string;
  themeClass: 'slide-showcase' | 'slide-cozy' | 'slide-treat' | 'slide-join' | 'slide-picnic';
  image: string;
  imageAlt: string;
  layout: 'book-showcase' | 'split' | 'centered';
  primaryCta: { label: string; href: string; action?: 'open-3d' | 'open-studio' | 'preview-book' };
  secondaryCta: { label: string; href: string; action?: 'open-3d' | 'open-studio' | 'preview-book' };
  badgeText?: string;
}

export interface BookItem {
  id: string;
  number: string;
  title: string;
  titleTop: string;
  titleEm: string;
  genre: string;
  description: string;
  previewDescription: string;
  coverImage: string;
  themeClass: 'book-picnic' | 'book-night' | 'book-garden' | 'book-space';
  keywords: string;
  fullBleedCover?: boolean;
  spineColor: string;
  spineTextColor: string;
  markerColor: string;
  stageTagline: string;
}

export interface PeekItem {
  id: 'rooftop' | 'garden' | 'rocket';
  title: string;
  description: string;
  outlineSvg: string;
  coloredSvg: string;
  alt: string;
  cardClass: string;
}

export interface CrewMember {
  name: string;
  role: string;
  species: string;
  scaleRatio: string;
  note: string;
}

export interface CrayonSwatch {
  color: string;
  label: string;
  role: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answerHtml: string;
}

export const BOOKS: BookItem[] = [
  {
    id: 'little-moon-picnic',
    number: 'No. 01',
    title: 'The Little Moon Picnic',
    titleTop: 'The Little',
    titleEm: 'Moon Picnic',
    genre: 'Story coloring book · Ages 6–9',
    description:
      'Join Miso, Plum, Pip, and Sprout for warm buns, fresh berries, and paper moons beside the crescent window.',
    previewDescription:
      'A story coloring book for kids ages 6–9. When rain taps the porch, Miso and friends spread a checkered blanket indoors, hang paper moons, and share warm buns and berries.',
    coverImage: '/assets/the-little-moon-picnic-book.png',
    themeClass: 'book-picnic',
    keywords:
      'book coloring colouring story preview amazon the little moon picnic miso plum pip sprout bun berries',
    fullBleedCover: true,
    spineColor: '#F6D056',
    spineTextColor: '#3B2314',
    markerColor: '#E86A78',
    stageTagline: 'GRAND OPENING:',
  },
  {
    id: 'midnight-kittens',
    number: 'No. 02',
    title: 'Midnight Kittens',
    titleTop: 'Midnight',
    titleEm: 'Kittens',
    genre: 'Cozy nights · Ages 4+',
    description:
      'Follow Miso over sleepy rooftops, past glowing lanterns, and up to a crescent moon.',
    previewDescription:
      'Follow Miso over sleepy rooftops, past glowing lanterns, and up to a crescent moon. A quiet adventure for the last few minutes before bedtime.',
    coverImage: '/assets/cover-midnight-cozy.webp',
    themeClass: 'book-night',
    keywords: 'book coloring colouring preview amazon midnight kittens rooftop moon lantern',
    fullBleedCover: false,
    spineColor: '#C4B0E0',
    spineTextColor: '#2E243C',
    markerColor: '#9C82C8',
    stageTagline: 'COZY NIGHTS:',
  },
  {
    id: 'starlight-garden',
    number: 'No. 03',
    title: 'Starlight Garden',
    titleTop: 'Starlight',
    titleEm: 'Garden',
    genre: 'Nature magic · Ages 4+',
    description:
      'Water flowers that look like stars, say hello to a snail, and see what grows after dark.',
    previewDescription:
      'Help Miso water flowers that look like stars, say hello to a snail, and see what else grows after the sun goes down.',
    coverImage: '/assets/cover-garden-cozy.webp',
    themeClass: 'book-garden',
    keywords: 'book coloring colouring preview amazon starlight garden flowers snail sprout nature',
    fullBleedCover: false,
    spineColor: '#AED09A',
    spineTextColor: '#293B24',
    markerColor: '#76A865',
    stageTagline: 'GARDEN CLUB:',
  },
  {
    id: 'pocket-sized-planet',
    number: 'No. 04',
    title: 'Pocket-Sized Planet',
    titleTop: 'Pocket-sized',
    titleEm: 'Planet',
    genre: 'Little space trips · Ages 4+',
    description:
      'Climb aboard Miso’s little rocket for ringed planets, twisty comets, and a crayon-powered trip through space.',
    previewDescription:
      'Climb aboard Miso’s little rocket for ringed planets, twisty comets, and a trip through space with your favorite crayons.',
    coverImage: '/assets/cover-planet-cozy.webp',
    themeClass: 'book-space',
    keywords: 'book coloring colouring preview amazon pocket-sized planet space rocket pip comet',
    fullBleedCover: false,
    spineColor: '#F0B6A2',
    spineTextColor: '#482B28',
    markerColor: '#E57A6E',
    stageTagline: 'SPACE TRIP:',
  },
];

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'book-showcase',
    eyebrow: 'Moon Mesh × Miso & Friends',
    titleLines: ['GRAND OPENING:', 'The Little Moon Picnic'],
    accentLine: 'The Little Moon Picnic',
    subtitle:
      'A Story Coloring Book for Kids Ages 6–9. Pull up a cushion at the low wooden table for warm buns, sweet berries, and cozy pages to color.',
    signoff: 'Now serving cozy moments ♡',
    bgColor: '#FBF8F3',
    themeClass: 'slide-showcase',
    image: '/assets/the-little-moon-picnic-book.png',
    imageAlt:
      'The Little Moon Picnic story coloring book standing on a warm wooden tabletop with Miso, Plum, Pip, and Sprout sharing a moonlit picnic.',
    layout: 'book-showcase',
    primaryCta: { label: 'Peek inside this book', href: '#books', action: 'preview-book' },
    secondaryCta: { label: 'Open 3D Picnic Diorama', href: '#three-studio', action: 'open-3d' },
    badgeText: 'NEW STORYBOOK',
  },
  {
    id: 'moon-color',
    eyebrow: 'A cozy little world of color',
    titleLines: ['Make the', 'moon', 'your color.'],
    subtitle:
      'For slow afternoons and “one more page” moments. Pull up a chair, pick your favorite crayon, and make a little time together.',
    signoff: 'Love, Miso & friends ♡',
    bgColor: '#FAF2E9',
    themeClass: 'slide-cozy',
    image: '/assets/color-together.webp',
    imageAlt:
      'Miso the kitten and Plum the rabbit share a coloring book at a little table beneath a moonlit window. Pip and Sprout keep them company.',
    layout: 'split',
    primaryCta: { label: 'Find your next book', href: '#books' },
    secondaryCta: { label: 'Explore 3D Moon Picnic', href: '#three-studio', action: 'open-3d' },
  },
  {
    id: 'coloring-treat',
    eyebrow: 'Bold outlines · Big cozy shapes',
    titleLines: ['READY FOR', 'a little', 'COLORiNG', 'TREAT?'],
    accentLine: 'a little',
    subtitle:
      'Plum picked fresh tulips and Miso tied a sky-blue ribbon just for you. Grab a warm mug and color a page right in your browser.',
    bgColor: '#FEDDE4',
    themeClass: 'slide-treat',
    image: '/assets/hero-coloring-treat.jpg',
    imageAlt:
      'Miso the cream kitten with a blue striped ribbon bow and Plum the lavender rabbit in a strawberry cap holding three tulips beside Sprout the snail.',
    layout: 'split',
    primaryCta: { label: 'Color a free treat', href: '#color', action: 'open-studio' },
    secondaryCta: { label: 'Peek inside the books', href: '#peek' },
  },
  {
    id: 'come-join-us',
    eyebrow: 'Moon Mesh Coloring Club',
    titleLines: ['COME', 'JOIN', 'US'],
    subtitle:
      'Pull up a cushion with Miso, Pip, Plum, and Sprout! Try our free interactive coloring page, print a sheet for the kitchen table, or hop into Moon Mail.',
    bgColor: '#FBE69C',
    themeClass: 'slide-join',
    image: '/assets/hero-come-join-us.jpg',
    imageAlt:
      'Miso, Pip, Plum, and Sprout hugging a giant coral-red heart that says Come Join Us on a warm butter-yellow raindrop background.',
    layout: 'centered',
    primaryCta: { label: 'Join the Coloring Club', href: '#color' },
    secondaryCta: { label: 'Read Moon Mail', href: '#moon-mail' },
  },
];

export const PEEK_PAGES: PeekItem[] = [
  {
    id: 'rooftop',
    title: 'Rooftop dreams',
    description:
      'Miso tiptoes across the rooftops under a fat yellow moon. Color the lanterns, the sleepy clouds, and the very top of the town.',
    outlineSvg: '/assets/rooftop-coloring.svg',
    coloredSvg: '/assets/rooftop-colored.svg',
    alt: 'Miso with a mug and lantern on a moonlit rooftop, ready to color.',
    cardClass: 'peek-card-a',
  },
  {
    id: 'garden',
    title: 'Midnight garden',
    description:
      'Giant flowers, a watering can, and one small snail. This is the page for every color in the crayon box — especially the loud ones.',
    outlineSvg: '/assets/garden-coloring.svg',
    coloredSvg: '/assets/garden-colored.svg',
    alt: 'Miso watering flowers beside Sprout the snail, ready to color.',
    cardClass: 'peek-card-b',
  },
  {
    id: 'rocket',
    title: 'A tiny planet',
    description:
      'A rocket, a ringed planet, and a star with somewhere to be. Buckle up and color outside the lines.',
    outlineSvg: '/assets/rocket-coloring.svg',
    coloredSvg: '/assets/rocket-colored.svg',
    alt: 'Miso and Pip in their little rocket beside a ringed planet, ready to color.',
    cardClass: 'peek-card-c',
  },
];

export const CREW_MEMBERS: CrewMember[] = [
  {
    name: 'Miso',
    role: 'the daydreamer',
    species: 'Cream kitten · Mustard scarf',
    scaleRatio: '1.00',
    note: 'Leans toward a drawing, tucks a bun into a basket, and always saves a seat.',
  },
  {
    name: 'Pip',
    role: 'the bright idea',
    species: 'Five-point star · Butter yellow',
    scaleRatio: '0.45',
    note: 'Peeks from cushions, hangs paper moons, and gets dusted with flour.',
  },
  {
    name: 'Plum',
    role: 'the kind heart',
    species: 'Lavender lop-eared friend',
    scaleRatio: '0.95',
    note: 'Makes room at the table, holds the umbrella over the wagon, and reads aloud.',
  },
  {
    name: 'Sprout',
    role: 'the slow-and-steady',
    species: 'Small snail · Leaf-green shell',
    scaleRatio: '0.30',
    note: 'Carries one very good berry on a leaf tray and notices hidden doorways.',
  },
];

export const STUDIO_PALETTE: CrayonSwatch[] = [
  { color: '#FFC81E', label: 'Butter yellow', role: "Miso's scarf & Pip" },
  { color: '#F5A9BC', label: 'Peach pink', role: 'Warm blossoms' },
  { color: '#B79BDD', label: 'Lavender', role: 'Plum & twilight' },
  { color: '#8FD3A8', label: 'Mint green', role: "Sprout's shell & leaves" },
  { color: '#97BDE7', label: 'Sky blue', role: 'Moonlit window' },
  { color: '#D87977', label: 'Berry coral', role: 'Picnic berry & heart' },
  { color: '#FFF4DB', label: 'Warm cream', role: 'Cozy paper & dough' },
  { color: '#FFFFFF', label: 'White eraser', role: 'Start fresh' },
];

export const CATALOG_SECTIONS = [
  {
    title: 'Interactive 3D Moon Picnic Diorama',
    theme: 'Explore Miso, Pip, Plum & Sprout in 3D',
    href: '#three-studio',
    image: '/assets/color-together.webp',
    keywords: '3d studio diorama threejs moon picnic interactive camera lighting',
  },
  {
    title: 'From the coloring table',
    theme: 'Watch a 16-second coloring clip',
    href: '#watch',
    image: '/assets/coloring-table-poster.webp',
    keywords: 'video watch clip markers puppies coloring table',
  },
  {
    title: 'Miso & the Moon',
    theme: 'Free coloring page',
    href: '#color',
    image: '/assets/miso-moon-coloring.svg',
    keywords: 'free printable print pdf color online colouring download club page miso moon studio',
  },
  {
    title: 'Peek inside the books',
    theme: 'Line-art gallery',
    href: '#peek',
    image: '/assets/rooftop-coloring.svg',
    keywords: 'peek inside pages gallery line art lineart sample interior look',
  },
  {
    title: 'Meet Miso and friends',
    theme: 'Our story',
    href: '#story',
    image: '/assets/crew-miso.svg',
    keywords: 'kitten cat rabbit snail star crew characters friends story',
  },
  {
    title: 'Frequently asked questions',
    theme: 'Good to know',
    href: '#faq',
    image: '/assets/brand-logo.webp',
    keywords: 'help parents ages printing buy purchase questions faq',
  },
  {
    title: 'Moon Mail',
    theme: 'A little letter',
    href: '#moon-mail',
    image: '/assets/brand-logo.webp',
    keywords: 'newsletter email letter subscribe updates moon mail',
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'who-for',
    question: 'Who are the books for?',
    answerHtml:
      'Our big shapes and bold outlines welcome young colorers, with the collection aimed at ages 4 to 9 (and our Little Moon Picnic series crafted especially for ages 6–9). Grown-ups are very welcome to pull up a chair, too.',
  },
  {
    id: 'how-print',
    question: 'How do I print the free page?',
    answerHtml:
      'Download the PDF, open it, and print at “Fit to page” on A4 or US Letter paper. Thicker paper is lovely, but ordinary printer paper works just fine.',
  },
  {
    id: 'where-find',
    question: 'Where can I find Moon Mesh books?',
    answerHtml:
      'You can find Moon Mesh on Amazon and Etsy. Browse Moon Mesh on Amazon or visit our Etsy shop for the current selection, printables, and delivery options.',
  },
  {
    id: 'studio-free',
    question: 'Is the online coloring studio really free?',
    answerHtml:
      'Yes. Pick a crayon color, tap a shape, and color Miso’s page right in your browser. You can download your finished page as a PNG or print a blank copy.',
  },
  {
    id: 'drawing-system',
    question: 'What makes Moon Mesh drawings feel handmade and easy to color?',
    answerHtml:
      'Every illustration follows our Moon Mesh Drawing System: confident 1.2–1.5 mm rounded felt-tip contours, closed colorable regions with at least 70% open white space, purposeful poses where Miso, Pip, Plum, and Sprout interact naturally, and zero gray shading or visual clutter.',
  },
  {
    id: 'moon-mail-faq',
    question: 'What’s Moon Mail?',
    answerHtml:
      'A little home for future studio letters and free pages. Email subscriptions are still being prepared. For now, the Coloring Club has a page ready whenever you are.',
  },
];
