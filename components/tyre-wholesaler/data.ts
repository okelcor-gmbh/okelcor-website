// Shared content for the /tyre-wholesaler SEO landing page.
// Single source of truth so the visible FAQ accordion and the FAQPage
// JSON-LD on the server page never drift apart.

export type Faq = { q: string; a: string };

export const WHOLESALER_FAQS: Faq[] = [
  {
    q: "What is the minimum order quantity for wholesale tyres?",
    a: "Minimum order quantities depend on the tyre category, brand mix, and destination. For established partners we accommodate mixed container loads that combine PCR, TBR, and value-brand sizes. Share your target sizes, brands, and monthly volume and our Munich sales team will return a tailored wholesale quotation.",
  },
  {
    q: "Can I import duty-free using your REX certification?",
    a: "Yes. Okelcor is a REX Registered Exporter (DEREX76000242). Eligible buyers — including those in the UK and Canada — can import our tyres duty-free under applicable trade agreements, which protects your landed-cost margins. The certificate of origin is included with every qualifying shipment.",
  },
  {
    q: "Do you guarantee fresh DOT production dates?",
    a: "We supply recent DOT-coded stock and never offload stagnant inventory. Manufacturer warranties are facilitated on premium brands so you can give your customers the safety and performance they expect. Specific DOT requirements can be confirmed in your quotation.",
  },
  {
    q: "Which tyre categories and brands do you wholesale?",
    a: "We supply PCR (passenger), TBR (truck & bus), and OTR (off-the-road) tyres, plus high-margin budget and value brands. Sourcing covers all major global manufacturers — Michelin, Bridgestone, Continental, Goodyear, Pirelli, and Dunlop — alongside selected mid-range tiers depending on market availability.",
  },
  {
    q: "How long does international delivery take?",
    a: "Lead times depend on destination, Incoterms, and container availability. Sea freight to West Africa, the UK, and North America is dispatched through trusted freight partners such as Hapag-Lloyd and DB Schenker. Your quotation confirms an estimated dispatch window and full shipping documentation.",
  },
  {
    q: "Which countries do you supply?",
    a: "Okelcor ships to distributors and wholesalers in over 40 countries worldwide, with strong supply lines into the UK, Canada, and West Africa. If your market is not listed, contact us — we routinely arrange new export corridors.",
  },
];

export type CategoryCard = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export const INVENTORY_CATEGORIES: CategoryCard[] = [
  {
    title: "PCR Tyres",
    description:
      "Premium passenger car tyres engineered for everyday road performance, safety, and longevity.",
    image: "/images/pexels-mikebirdy-250307.jpg",
    imageAlt: "Stacked passenger car radial (PCR) tyres ready for wholesale dispatch",
  },
  {
    title: "TBR Tyres",
    description:
      "Heavy-duty truck and bus tyres built for commercial durability, retreadability, and high mileage.",
    image: "/images/pexels-jonathanborba-18372024.jpg",
    imageAlt: "Truck and bus radial (TBR) tyres for commercial fleets",
  },
  {
    title: "OTR Tyres",
    description:
      "Rugged, specialised tyres designed to withstand harsh conditions in construction and mining.",
    image: "/images/OTR tyres.png",
    imageAlt: "Off-the-road (OTR) tyres for construction and mining equipment",
  },
  {
    title: "Budget & Value Brands",
    description:
      "High-margin, reliable new tyres engineered for cost-conscious markets without sacrificing safety.",
    image: "/images/Used tyres.png",
    imageAlt: "Value-brand wholesale tyres stacked for export",
  },
];

export type Shipment = {
  destination: string;
  containerId: string;
  cargo: string;
  status: string;
};

export const RECENT_SHIPMENTS: Shipment[] = [
  {
    destination: "United Kingdom",
    containerId: "HLXU 8273***",
    cargo: "1× 40ft HC • Premium TBR",
    status: "Delivered (Duty-Free via REX)",
  },
  {
    destination: "West Africa",
    containerId: "MSCU 9921***",
    cargo: "2× 40ft HC • Mixed PCR",
    status: "In Transit (Sea Freight)",
  },
  {
    destination: "Canada",
    containerId: "MAEU 4518***",
    cargo: "1× 20ft • Specialised OTR",
    status: "Cleared Customs",
  },
];
