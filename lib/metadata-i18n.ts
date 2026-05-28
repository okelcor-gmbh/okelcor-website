import type { Locale } from "./translations";

export type PageKey =
  | "home"
  | "shop"
  | "quote"
  | "about"
  | "contact"
  | "news"
  | "fet";

type MetaEntry = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
};

const META: Record<PageKey, Record<Locale, MetaEntry>> = {
  // ── Home ────────────────────────────────────────────────────────────────────
  home: {
    en: {
      title: "OKELCOR TIRES - The Cheapest Tyres on the Internet",
      description: "Munich-based global tyre supplier. Premium PCR, TBR, and used tyres for businesses, fleets, and individual drivers in over 30 countries.",
      ogTitle: "OKELCOR TIRES - The Cheapest Tyres on the Internet",
      ogDescription: "Munich-based global tyre supplier. Premium PCR, TBR, and used tyres for businesses, fleets, and individual drivers in over 30 countries.",
      twitterTitle: "OKELCOR TIRES - The Cheapest Tyres on the Internet",
      twitterDescription: "Munich-based global tyre supplier. PCR, TBR, and used tyres for distributors worldwide.",
    },
    de: {
      title: "OKELCOR REIFEN – Günstige Reifen online kaufen",
      description: "Münchner globaler Reifenlieferant. Premium PKW-, LKW- und Gebrauchtreifen für Unternehmen, Flotten und Fahrer in über 30 Ländern.",
      ogTitle: "OKELCOR REIFEN – Günstige Reifen online kaufen",
      ogDescription: "Münchner globaler Reifenlieferant. Premium PKW-, LKW- und Gebrauchtreifen für Unternehmen, Flotten und Fahrer in über 30 Ländern.",
      twitterTitle: "OKELCOR REIFEN – Günstige Reifen online kaufen",
      twitterDescription: "PKW-, LKW- und Gebrauchtreifen für Händler weltweit.",
    },
    fr: {
      title: "OKELCOR PNEUS – Acheter des pneus pas chers en ligne",
      description: "Fournisseur mondial de pneus basé à Munich. Pneus PCR, TBR et occasion premium pour les entreprises, flottes et conducteurs dans plus de 30 pays.",
      ogTitle: "OKELCOR PNEUS – Acheter des pneus pas chers en ligne",
      ogDescription: "Fournisseur mondial de pneus basé à Munich. Pneus PCR, TBR et occasion premium pour les entreprises, flottes et conducteurs dans plus de 30 pays.",
      twitterTitle: "OKELCOR PNEUS – Acheter des pneus pas chers en ligne",
      twitterDescription: "Pneus PCR, TBR et d'occasion pour les distributeurs du monde entier.",
    },
    es: {
      title: "OKELCOR NEUMÁTICOS – Comprar neumáticos baratos online",
      description: "Proveedor mundial de neumáticos con sede en Múnich. Neumáticos PCR, TBR y de ocasión premium para empresas, flotas y conductores en más de 30 países.",
      ogTitle: "OKELCOR NEUMÁTICOS – Comprar neumáticos baratos online",
      ogDescription: "Proveedor mundial de neumáticos con sede en Múnich. Neumáticos PCR, TBR y de ocasión premium para empresas, flotas y conductores en más de 30 países.",
      twitterTitle: "OKELCOR NEUMÁTICOS – Comprar neumáticos baratos online",
      twitterDescription: "Neumáticos PCR, TBR y de ocasión para distribuidores de todo el mundo.",
    },
  },

  // ── Shop ────────────────────────────────────────────────────────────────────
  shop: {
    en: {
      title: "Buy Tyres Online – PCR, TBR & Used Tyres",
      description: "Browse premium PCR, TBR, OTR, and used tyres from leading global brands. Filter by brand, season, and tyre type.",
      ogTitle: "Buy Tyres Online – PCR, TBR & Used Tyres | Okelcor Tires",
      ogDescription: "PCR, TBR, OTR, and used tyres from Michelin, Bridgestone, Goodyear, Continental, Pirelli, and Dunlop. Global wholesale supply.",
      twitterTitle: "Buy Tyres Online – PCR, TBR & Used Tyres | Okelcor Tires",
      twitterDescription: "PCR, TBR, OTR, and used tyres from top global brands. Wholesale supply worldwide.",
    },
    de: {
      title: "Reifen online kaufen – PKW-, LKW- & Gebrauchtreifen",
      description: "Premium PKW-, LKW-, OTR- und Gebrauchtreifen von führenden Marken. Filtern nach Marke, Saison und Reifentyp.",
      ogTitle: "Reifen online kaufen – PKW-, LKW- & Gebrauchtreifen | Okelcor Tires",
      ogDescription: "PKW-, LKW-, OTR- und Gebrauchtreifen von Michelin, Bridgestone, Goodyear, Continental, Pirelli und Dunlop. Globaler Großhandelsvertrieb.",
      twitterTitle: "Reifen online kaufen – PKW-, LKW- & Gebrauchtreifen | Okelcor Tires",
      twitterDescription: "PKW-, LKW-, OTR- und Gebrauchtreifen von führenden Marken. Weltweiter Großhandelsvertrieb.",
    },
    fr: {
      title: "Acheter des pneus en ligne – PCR, TBR & pneus occasion",
      description: "Parcourez des pneus PCR, TBR, OTR et d'occasion premium de grandes marques mondiales. Filtrez par marque, saison et type.",
      ogTitle: "Acheter des pneus en ligne – PCR, TBR & pneus occasion | Okelcor Tires",
      ogDescription: "Pneus PCR, TBR, OTR et d'occasion de Michelin, Bridgestone, Goodyear, Continental, Pirelli et Dunlop. Distribution en gros mondiale.",
      twitterTitle: "Acheter des pneus en ligne – PCR, TBR & pneus occasion | Okelcor Tires",
      twitterDescription: "Pneus PCR, TBR, OTR et d'occasion des meilleures marques mondiales. Distribution en gros mondiale.",
    },
    es: {
      title: "Comprar neumáticos online – PCR, TBR y neumáticos de ocasión",
      description: "Explore neumáticos PCR, TBR, OTR y de ocasión premium de marcas líderes. Filtre por marca, temporada y tipo.",
      ogTitle: "Comprar neumáticos online – PCR, TBR y neumáticos de ocasión | Okelcor Tires",
      ogDescription: "Neumáticos PCR, TBR, OTR y de ocasión de Michelin, Bridgestone, Goodyear, Continental, Pirelli y Dunlop. Suministro mayorista mundial.",
      twitterTitle: "Comprar neumáticos online – PCR, TBR y neumáticos de ocasión | Okelcor Tires",
      twitterDescription: "Neumáticos PCR, TBR, OTR y de ocasión de marcas líderes. Suministro mayorista mundial.",
    },
  },

  // ── Quote ───────────────────────────────────────────────────────────────────
  quote: {
    en: {
      title: "Get Instant Tyre Supply Quotation With Competitive Prices",
      description: "Get a competitive bulk tyre supply quotation from Okelcor. We supply PCR, TBR, and used tyres at wholesale prices with international logistics to over 30 countries.",
      ogTitle: "Get Instant Tyre Supply Quotation With Competitive Prices | Okelcor",
      ogDescription: "Competitive bulk tyre supply pricing for PCR, TBR, and used tyres. Okelcor delivers globally with trusted international logistics. Response within 1 business day.",
      twitterTitle: "Get Instant Tyre Supply Quotation — Okelcor",
      twitterDescription: "Bulk PCR, TBR, and used tyre supplies at competitive prices. International logistics. Response within 1 business day.",
    },
    de: {
      title: "Sofortiges Reifenlieferangebot mit wettbewerbsfähigen Preisen",
      description: "Fordern Sie ein wettbewerbsfähiges Großmengen-Reifenlieferangebot von Okelcor an. Wir liefern PKW-, LKW- und Gebrauchtreifen zu Großhandelspreisen in über 30 Länder.",
      ogTitle: "Sofortiges Reifenlieferangebot mit wettbewerbsfähigen Preisen | Okelcor",
      ogDescription: "Wettbewerbsfähige Großmengenpreise für PKW-, LKW- und Gebrauchtreifen. Okelcor liefert weltweit mit zuverlässiger internationaler Logistik. Antwort innerhalb von 1 Werktag.",
      twitterTitle: "Sofortiges Reifenlieferangebot — Okelcor",
      twitterDescription: "Großmengen PKW-, LKW- und Gebrauchtreifen zu wettbewerbsfähigen Preisen. Internationale Logistik. Antwort innerhalb von 1 Werktag.",
    },
    fr: {
      title: "Obtenez un devis de fourniture de pneus instantané et compétitif",
      description: "Obtenez un devis compétitif pour la fourniture de pneus en vrac chez Okelcor. Nous livrons des pneus PCR, TBR et d'occasion à prix de gros dans plus de 30 pays.",
      ogTitle: "Devis de fourniture de pneus instantané et compétitif | Okelcor",
      ogDescription: "Tarifs compétitifs pour la fourniture en vrac de pneus PCR, TBR et d'occasion. Okelcor livre dans le monde entier avec une logistique fiable. Réponse sous 1 jour ouvré.",
      twitterTitle: "Devis de fourniture de pneus — Okelcor",
      twitterDescription: "Pneus PCR, TBR et d'occasion en vrac à prix compétitifs. Logistique internationale. Réponse sous 1 jour ouvré.",
    },
    es: {
      title: "Obtenga un presupuesto de suministro de neumáticos instantáneo y competitivo",
      description: "Obtenga un presupuesto competitivo de suministro masivo de neumáticos de Okelcor. Suministramos PCR, TBR y neumáticos de ocasión a precios mayoristas en más de 30 países.",
      ogTitle: "Presupuesto de suministro de neumáticos instantáneo y competitivo | Okelcor",
      ogDescription: "Precios competitivos para el suministro masivo de neumáticos PCR, TBR y de ocasión. Okelcor entrega a nivel mundial con logística de confianza. Respuesta en 1 día hábil.",
      twitterTitle: "Presupuesto de suministro de neumáticos — Okelcor",
      twitterDescription: "Neumáticos PCR, TBR y de ocasión al por mayor a precios competitivos. Logística internacional. Respuesta en 1 día hábil.",
    },
  },

  // ── About / Wholesale ───────────────────────────────────────────────────────
  about: {
    en: {
      title: "Get your tires from one of the leading European wholesale tire distributors",
      description: "Okelcor is one of Europe's leading wholesale tire distributors for PCR, TBR, and top-quality used tires at competitive rates — supplying wholesalers in over 30 countries.",
      ogTitle: "Leading European Wholesale Tire Distributors | Okelcor",
      ogDescription: "Okelcor is one of Europe's leading wholesale tire distributors — supplying PCR, TBR, and used tires to wholesalers and distributors in over 30 countries.",
      twitterTitle: "European Wholesale Tire Distributor — Okelcor",
      twitterDescription: "One of Europe's leading wholesale tire distributors for PCR, TBR, and top-quality used tires at competitive rates.",
    },
    de: {
      title: "Reifen von einem der führenden europäischen Großhandels-Reifenhändler",
      description: "Okelcor ist einer der führenden europäischen Großhandels-Reifenhändler für PKW-, LKW- und hochwertige Gebrauchtreifen zu wettbewerbsfähigen Preisen – Lieferung in über 30 Länder.",
      ogTitle: "Führende europäische Großhandels-Reifenhändler | Okelcor",
      ogDescription: "Okelcor ist einer der führenden europäischen Großhandels-Reifenhändler – Versorgung von Händlern in über 30 Ländern mit PKW-, LKW- und Gebrauchtreifen.",
      twitterTitle: "Europäischer Großhandels-Reifenhändler — Okelcor",
      twitterDescription: "Einer der führenden europäischen Großhandels-Reifenhändler für PKW-, LKW- und hochwertige Gebrauchtreifen.",
    },
    fr: {
      title: "Achetez vos pneus auprès d'un des principaux distributeurs grossistes de pneus en Europe",
      description: "Okelcor est l'un des principaux distributeurs grossistes de pneus en Europe — fournissant des pneus PCR, TBR et d'occasion de haute qualité à des tarifs compétitifs dans plus de 30 pays.",
      ogTitle: "Principaux distributeurs grossistes de pneus en Europe | Okelcor",
      ogDescription: "Okelcor est l'un des principaux distributeurs grossistes de pneus en Europe — fournissant des pneus PCR, TBR et d'occasion à des grossistes dans plus de 30 pays.",
      twitterTitle: "Distributeur grossiste de pneus européen — Okelcor",
      twitterDescription: "L'un des principaux distributeurs grossistes de pneus en Europe pour les pneus PCR, TBR et d'occasion à des tarifs compétitifs.",
    },
    es: {
      title: "Obtenga sus neumáticos de uno de los principales distribuidores mayoristas de neumáticos de Europa",
      description: "Okelcor es uno de los principales distribuidores mayoristas de neumáticos de Europa — suministrando neumáticos PCR, TBR y de ocasión de alta calidad a tarifas competitivas en más de 30 países.",
      ogTitle: "Principales distribuidores mayoristas de neumáticos de Europa | Okelcor",
      ogDescription: "Okelcor es uno de los principales distribuidores mayoristas de neumáticos de Europa — suministrando neumáticos PCR, TBR y de ocasión a mayoristas en más de 30 países.",
      twitterTitle: "Distribuidor mayorista de neumáticos europeo — Okelcor",
      twitterDescription: "Uno de los principales distribuidores mayoristas de neumáticos de Europa para neumáticos PCR, TBR y de ocasión a tarifas competitivas.",
    },
  },

  // ── Contact ─────────────────────────────────────────────────────────────────
  contact: {
    en: {
      title: "Contact Us – Wholesale & Sourcing Enquiries",
      description: "Get in touch with Okelcor for catalogue access, wholesale pricing, sourcing support, and partnership discussions.",
      ogTitle: "Contact Us – Wholesale & Sourcing Enquiries | Okelcor Tires",
      ogDescription: "Reach out for catalogue access, wholesale pricing, tyre sourcing enquiries, and global supply partnerships.",
      twitterTitle: "Contact Us – Wholesale & Sourcing Enquiries | Okelcor Tires",
      twitterDescription: "Wholesale pricing, tyre sourcing enquiries, and global supply partnerships.",
    },
    de: {
      title: "Kontakt – Großhandels- & Beschaffungsanfragen",
      description: "Kontaktieren Sie Okelcor für Katalogzugang, Großhandelspreise, Beschaffungsunterstützung und Partnerschaftsgespräche.",
      ogTitle: "Kontakt – Großhandels- & Beschaffungsanfragen | Okelcor Tires",
      ogDescription: "Erreichen Sie uns für Katalogzugang, Großhandelspreise, Reifen-Beschaffungsanfragen und globale Versorgungspartnerschaften.",
      twitterTitle: "Kontakt – Großhandels- & Beschaffungsanfragen | Okelcor Tires",
      twitterDescription: "Großhandelspreise, Reifen-Beschaffungsanfragen und globale Versorgungspartnerschaften.",
    },
    fr: {
      title: "Nous contacter – Demandes de gros et d'approvisionnement",
      description: "Contactez Okelcor pour accéder au catalogue, obtenir des prix de gros, un support d'approvisionnement et discuter de partenariats.",
      ogTitle: "Nous contacter – Demandes de gros et d'approvisionnement | Okelcor Tires",
      ogDescription: "Contactez-nous pour accéder au catalogue, obtenir des prix de gros, des demandes d'approvisionnement de pneus et des partenariats mondiaux.",
      twitterTitle: "Nous contacter – Demandes de gros et d'approvisionnement | Okelcor Tires",
      twitterDescription: "Prix de gros, demandes d'approvisionnement de pneus et partenariats d'approvisionnement mondial.",
    },
    es: {
      title: "Contacto – Consultas mayoristas y de abastecimiento",
      description: "Póngase en contacto con Okelcor para acceder al catálogo, obtener precios mayoristas, apoyo en el abastecimiento y debates sobre asociaciones.",
      ogTitle: "Contacto – Consultas mayoristas y de abastecimiento | Okelcor Tires",
      ogDescription: "Contáctenos para acceder al catálogo, obtener precios mayoristas, consultas de abastecimiento de neumáticos y asociaciones de suministro global.",
      twitterTitle: "Contacto – Consultas mayoristas y de abastecimiento | Okelcor Tires",
      twitterDescription: "Precios mayoristas, consultas de abastecimiento de neumáticos y asociaciones de suministro global.",
    },
  },

  // ── News ────────────────────────────────────────────────────────────────────
  news: {
    en: {
      title: "Tyre Industry News & Insights",
      description: "Insights, updates, and tyre supply knowledge for distributors, partners, and international buyers.",
      ogTitle: "Tyre Industry News & Insights | Okelcor Tires",
      ogDescription: "Tyre supply updates, market insights, and logistics knowledge for global distributors and buyers.",
      twitterTitle: "News & Insights – Okelcor",
      twitterDescription: "Tyre supply updates and market insights for global distributors and buyers.",
    },
    de: {
      title: "Reifenbranche Nachrichten & Einblicke",
      description: "Einblicke, Neuigkeiten und Fachwissen zur Reifenlieferung für Händler, Partner und internationale Käufer.",
      ogTitle: "Reifenbranche Nachrichten & Einblicke | Okelcor Tires",
      ogDescription: "Aktuelles zur Reifenlieferung, Markteinblicke und Logistikwissen für globale Händler und Käufer.",
      twitterTitle: "Nachrichten & Einblicke – Okelcor",
      twitterDescription: "Aktuelles zur Reifenlieferung und Markteinblicke für globale Händler und Käufer.",
    },
    fr: {
      title: "Actualités & Perspectives du secteur des pneus",
      description: "Perspectives, mises à jour et connaissances sur la fourniture de pneus pour les distributeurs, partenaires et acheteurs internationaux.",
      ogTitle: "Actualités & Perspectives du secteur des pneus | Okelcor Tires",
      ogDescription: "Mises à jour sur la fourniture de pneus, perspectives de marché et connaissances logistiques pour les distributeurs et acheteurs mondiaux.",
      twitterTitle: "Actualités & Perspectives – Okelcor",
      twitterDescription: "Mises à jour sur la fourniture de pneus et perspectives de marché pour les distributeurs et acheteurs mondiaux.",
    },
    es: {
      title: "Noticias y perspectivas del sector de neumáticos",
      description: "Perspectivas, actualizaciones y conocimiento sobre el suministro de neumáticos para distribuidores, socios y compradores internacionales.",
      ogTitle: "Noticias y perspectivas del sector de neumáticos | Okelcor Tires",
      ogDescription: "Actualizaciones sobre el suministro de neumáticos, perspectivas de mercado y conocimiento logístico para distribuidores y compradores globales.",
      twitterTitle: "Noticias y perspectivas – Okelcor",
      twitterDescription: "Actualizaciones sobre el suministro de neumáticos y perspectivas de mercado para distribuidores y compradores globales.",
    },
  },

  // ── FET ─────────────────────────────────────────────────────────────────────
  fet: {
    en: {
      title: "FET Engine Fuel Efficiency for Fleets",
      description: "FET Engine Fuel Efficiency — the fuel efficiency device trusted by fleet operators across Europe. Up to 15% fuel savings, reduced emissions, improved engine performance.",
      ogTitle: "FET Engine Fuel Efficiency – Engine Treatment for Fleets | Okelcor Tires",
      ogDescription: "FET Engine Fuel Efficiency — up to 15% fuel savings, reduced emissions, improved engine performance. Trusted by fleet operators across Europe.",
      twitterTitle: "FET Engine Fuel Efficiency – Okelcor",
      twitterDescription: "Up to 15% fuel savings, reduced emissions, improved engine performance.",
    },
    de: {
      title: "FET Motor-Kraftstoffeffizienz für Flotten",
      description: "FET Motor-Kraftstoffeffizienz — das von Flottenmanagern in ganz Europa vertraute Kraftstoffeffizienzgerät. Bis zu 15 % Kraftstoffersparnis, reduzierte Emissionen, verbesserte Motorleistung.",
      ogTitle: "FET Motor-Kraftstoffeffizienz – Motorbehandlung für Flotten | Okelcor Tires",
      ogDescription: "FET Motor-Kraftstoffeffizienz — bis zu 15 % Kraftstoffersparnis, reduzierte Emissionen, verbesserte Motorleistung. Vertrauen von Flottenmanagern in ganz Europa.",
      twitterTitle: "FET Motor-Kraftstoffeffizienz – Okelcor",
      twitterDescription: "Bis zu 15 % Kraftstoffersparnis, reduzierte Emissionen, verbesserte Motorleistung.",
    },
    fr: {
      title: "FET Efficacité moteur pour les flottes",
      description: "FET Efficacité moteur — le dispositif d'efficacité énergétique approuvé par les gestionnaires de flottes en Europe. Jusqu'à 15 % d'économies de carburant, réduction des émissions, amélioration des performances moteur.",
      ogTitle: "FET Efficacité moteur – Traitement moteur pour flottes | Okelcor Tires",
      ogDescription: "FET Efficacité moteur — jusqu'à 15 % d'économies de carburant, réduction des émissions, amélioration des performances moteur. Approuvé par les gestionnaires de flottes en Europe.",
      twitterTitle: "FET Efficacité moteur – Okelcor",
      twitterDescription: "Jusqu'à 15 % d'économies de carburant, réduction des émissions, amélioration des performances moteur.",
    },
    es: {
      title: "FET Eficiencia del motor para flotas",
      description: "FET Eficiencia del motor — el dispositivo de eficiencia de combustible de confianza de los operadores de flotas en Europa. Hasta un 15 % de ahorro de combustible, reducción de emisiones, mejora del rendimiento del motor.",
      ogTitle: "FET Eficiencia del motor – Tratamiento del motor para flotas | Okelcor Tires",
      ogDescription: "FET Eficiencia del motor — hasta un 15 % de ahorro de combustible, reducción de emisiones, mejora del rendimiento del motor. Confianza de los operadores de flotas en Europa.",
      twitterTitle: "FET Eficiencia del motor – Okelcor",
      twitterDescription: "Hasta un 15 % de ahorro de combustible, reducción de emisiones, mejora del rendimiento del motor.",
    },
  },
};

export function getPageMeta(key: PageKey, locale: Locale): MetaEntry {
  return META[key][locale] ?? META[key]["en"];
}

// Locale-aware boilerplate appended to product page descriptions.
const PRODUCT_SUFFIX: Record<Locale, string> = {
  en: "Available for wholesale order. Global delivery from Okelcor.",
  de: "Für Großbestellungen erhältlich. Weltweite Lieferung von Okelcor.",
  fr: "Disponible en commande en gros. Livraison mondiale depuis Okelcor.",
  es: "Disponible para pedido mayorista. Entrega global desde Okelcor.",
};

export function getProductMetaSuffix(locale: Locale): string {
  return PRODUCT_SUFFIX[locale] ?? PRODUCT_SUFFIX["en"];
}
