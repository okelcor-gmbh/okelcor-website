export type Product = {
  id: number;
  brand: string;
  name: string;
  size: string;
  spec: string;
  season: string;
  type: string;
  /** Default / base price returned by API */
  price: number;
  /** Wholesale price — shown to B2B customers */
  price_b2b?: number;
  /** Retail price — shown to B2C customers */
  price_b2c?: number;
  /** Raw relative path from API e.g. storage/products/continental_summer_primary.jpg */
  primary_image?: string;
  /** primary_image with full URL prepended — used by card/gallery as display source */
  image: string;
  /** All gallery images as full URLs — primary_image first, then additional */
  images: string[];
  /** Brand-level fallback image (full URL) — used when product has no primary_image.
   *  Backend must return brand_image on the product response for this to populate. */
  brand_image?: string;
  sku: string;
  description: string;
  in_stock?: boolean;
};

// ── Tyre image library ────────────────────────────────────────────────────────
// All images are confirmed tyre / logistics photographs.
// Each product uses a unique primary image — no duplicates on card grid.

// PCR — stacked passenger car tyres (Pinterest)
const PCR_A =
  "https://i.pinimg.com/736x/88/c6/d3/88c6d3a62244fd91324ac28b8012d8b3.jpg";

// PCR — tyre warehouse row, wide landscape (Unsplash)
const PCR_B =
  "https://i.pinimg.com/1200x/bc/5e/ec/bc5eeca579e17900e66c978f0ecb5153.jpg";

// PCR — stacked used tyres, landscape (Unsplash)
const PCR_C =
  "https://i.pinimg.com/736x/ba/2e/ac/ba2eac280966092d0a64ccb8a2cd5706.jpg";

// PCR — OTR / industrial tyre close-up (Unsplash)
const PCR_D =
  "https://i.pinimg.com/1200x/8f/90/9a/8f909a1c1c25a0f07e5a97820b85bebf.jpg";

// PCR — tyre warehouse, square entropy crop (Unsplash)
const PCR_E =
  "https://i.pinimg.com/1200x/b0/b3/f9/b0b3f9633967e81522c6828385d90c47.jpg";

// PCR — used tyre pile close-up (Pinterest)
const PCR_F =
  "https://i.pinimg.com/736x/be/a5/5c/bea55caec7788d858e74961c14aa89c2.jpg";

// TBR — commercial truck tyres, landscape (Unsplash)
const TBR_A =
  "https://i.pinimg.com/736x/42/eb/8a/42eb8ab17c80d88685115a777018d1ab.jpg";

// TBR — truck & bus radial tyres (Pinterest)
const TBR_B =
  "https://i.pinimg.com/736x/02/8f/aa/028faa90f73f8f3b210a81536a62a219.jpg";

// TBR — heavy truck wheel close-up (Pinterest)
const TBR_C =
  "https://i.pinimg.com/736x/6a/8c/00/6a8c000dc105088788a31a4f4b48107b.jpg";

// TBR — commercial tyre, square crop (Unsplash)
const TBR_D =
  "https://i.pinimg.com/1200x/39/35/83/393583702fd35f3a0a59b546887c0aa7.jpg";

// Used — flexible sourcing / bulk used tyres (Pinterest)
const USED_A =
  "https://i.pinimg.com/1200x/82/a0/95/82a095466a38545d54806f19f235f2ac.jpg";

// Used — stacked tyre pile, entropy square (Unsplash)
const USED_B =
  "https://i.pinimg.com/1200x/93/af/a6/93afa6d4c2650b69e1f8b9ff53748309.jpg";

// Used — tyre warehouse square (Unsplash)
const USED_C =
  "https://i.pinimg.com/1200x/69/81/93/69819385005ee7a7d0359caff0b8c0e8.jpg";

// ── Products ──────────────────────────────────────────────────────────────────

export const ALL_PRODUCTS: Product[] = [
  {
    id: 1,
    brand: "Michelin",
    name: "Energy Saver+",
    size: "205/55R16",
    spec: "91H",
    season: "Summer",
    type: "PCR",
    price: 89.99,
    sku: "OKL-0001",
    description:
      "A market-leading fuel-efficiency tyre for compact and mid-size passenger vehicles. Optimised tread compound delivers low rolling resistance and reliable wet braking performance across a wide range of temperatures.",
    image: PCR_A,
    images: [PCR_A, PCR_B, PCR_C],
  },
  {
    id: 2,
    brand: "Bridgestone",
    name: "Turanza T005",
    size: "225/45R17",
    spec: "94Y XL",
    season: "Summer",
    type: "PCR",
    price: 124.5,
    sku: "OKL-0002",
    description:
      "Premium touring tyre engineered for comfort and precision on both wet and dry roads. Suited to executive vehicles and high-performance saloons requiring year-round reliability.",
    image: PCR_B,
    images: [PCR_B, PCR_A, PCR_D],
  },
  {
    id: 3,
    brand: "Continental",
    name: "ContiPremiumContact 6",
    size: "215/50R18",
    spec: "92W",
    season: "Summer",
    type: "PCR",
    price: 138.0,
    sku: "OKL-0003",
    description:
      "The ContiPremiumContact 6 delivers outstanding dry and wet braking for premium segment vehicles. Designed for confident high-speed driving with noticeably reduced cabin road noise.",
    image: PCR_C,
    images: [PCR_C, PCR_B, TBR_A],
  },
  {
    id: 4,
    brand: "Pirelli",
    name: "Cinturato P7",
    size: "205/45R17",
    spec: "88Y XL",
    season: "Summer",
    type: "PCR",
    price: 109.99,
    sku: "OKL-0004",
    description:
      "Pirelli's sustainable performance tyre combining fuel efficiency with high safety standards. XL-rated for heavier vehicles needing additional load capacity without compromising handling.",
    image: PCR_D,
    images: [PCR_D, PCR_A, PCR_C],
  },
  {
    id: 5,
    brand: "Goodyear",
    name: "EfficientGrip Performance",
    size: "195/65R15",
    spec: "91V",
    season: "Summer",
    type: "PCR",
    price: 78.5,
    sku: "OKL-0005",
    description:
      "Goodyear's EfficientGrip delivers measurable fuel savings and confident braking from the first kilometre. Designed for compact family cars prioritising efficiency and everyday safety.",
    image: PCR_E,
    images: [PCR_E, PCR_B, PCR_A],
  },
  {
    id: 6,
    brand: "Goodyear",
    name: "UltraGrip Performance+",
    size: "205/55R16",
    spec: "91H",
    season: "Winter",
    type: "PCR",
    price: 96.0,
    sku: "OKL-0006",
    description:
      "Winter-rated tyre delivering exceptional ice and snow traction for northern and Alpine markets. Consistent performance in sub-zero temperatures with class-leading aquaplaning resistance.",
    image: PCR_F,
    images: [PCR_F, PCR_C, PCR_B],
  },
  {
    id: 7,
    brand: "Michelin",
    name: "X MultiWay 3D XDE",
    size: "295/80R22.5",
    spec: "152/148M",
    season: "All Season",
    type: "TBR",
    price: 389.0,
    sku: "OKL-0007",
    description:
      "Heavy-duty steer axle tyre engineered for long-haul and regional distribution trucks. Michelin 3D sipe technology ensures even wear patterns and stable handling across all load conditions.",
    image: TBR_A,
    images: [TBR_A, TBR_B, TBR_C],
  },
  {
    id: 8,
    brand: "Bridgestone",
    name: "R192 Ecopia",
    size: "315/70R22.5",
    spec: "154/150L",
    season: "All Season",
    type: "TBR",
    price: 445.0,
    sku: "OKL-0008",
    description:
      "Fuel-efficient drive axle tyre built for long-distance logistics and high-mileage commercial fleets. Low rolling resistance construction significantly reduces total fuel spend over extended routes.",
    image: TBR_B,
    images: [TBR_B, TBR_A, TBR_D],
  },
  {
    id: 9,
    brand: "Continental",
    name: "Hybrid HS3+",
    size: "315/60R22.5",
    spec: "152/148L",
    season: "All Season",
    type: "TBR",
    price: 420.0,
    sku: "OKL-0009",
    description:
      "Versatile regional and long-haul steer tyre optimised for mixed-service operations. High load capacity with excellent stability and directional precision under full payload.",
    image: TBR_C,
    images: [TBR_C, TBR_D, TBR_A],
  },
  {
    id: 10,
    brand: "Mixed Brands",
    name: "Grade A Used PCR",
    size: "205/55R16",
    spec: "Various",
    season: "Summer",
    type: "Used",
    price: 28.0,
    sku: "OKL-0010",
    description:
      "Carefully inspected and graded second-hand passenger car radial tyres. Each unit is assessed for minimum tread depth, structural integrity, and road safety compliance before dispatch.",
    image: USED_A,
    images: [USED_A, USED_B, PCR_C],
  },
  {
    id: 11,
    brand: "Mixed Brands",
    name: "Grade A Used TBR",
    size: "295/80R22.5",
    spec: "Various",
    season: "All Season",
    type: "Used",
    price: 85.0,
    sku: "OKL-0011",
    description:
      "Pre-graded used truck and bus radial tyres for cost-conscious distributors and export buyers. Suitable for secondary fleet applications where unit cost is the primary consideration.",
    image: USED_B,
    images: [USED_B, USED_A, TBR_A],
  },
  {
    id: 12,
    brand: "Dunlop",
    name: "Sport Maxx RT2",
    size: "235/40R18",
    spec: "95Y XL",
    season: "Summer",
    type: "PCR",
    price: 145.0,
    sku: "OKL-0012",
    description:
      "Ultra-high-performance summer tyre designed for sports cars and premium performance sedans. Exceptional dry grip and precise steering response at elevated speeds with short braking distances.",
    image: TBR_D,
    images: [TBR_D, PCR_A, PCR_D],
  },
];

export function getProductById(id: number): Product | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id);
}

export function getRelatedProducts(product: Product, count = 3): Product[] {
  return ALL_PRODUCTS.filter(
    (p) => p.type === product.type && p.id !== product.id
  ).slice(0, count);
}
