// ─── Types ────────────────────────────────────────────────────────────────────

export type Locale = "en" | "de" | "fr" | "es";

export type Translations = {
  nav: {
    home: string; shop: string; news: string; about: string;
    contact: string; quote: string; help: string; account: string;
    language: string; back: string; fet: string;
  };
  lang: { panelTitle: string; en: string; de: string; fr: string; es: string };
  hero: {
    ctaPrimary: string;
    ctaSecondary: string;
  };
  categories: {
    eyebrow: string;
    heading: string;
    cards: Array<{ title: string; label: string; subtitle: string }>;
    orderNow: string;
    learnMore: string;
  };
  why: {
    card1: { title: string; body: string; button: string };
    card2: { title: string; body: string; button: string };
  };
  logistics: {
    eyebrow: string; title: string; body: string;
    getQuote: string; learnMore: string;
    flexibleSourcing: string; usedTyres: string;
    distEyebrow: string; distTitle: string; distBody: string;
    talkToSales: string;
  };
  used: {
    eyebrow: string; title: string; body: string;
    viewCatalogue: string; requestQuote: string;
  };
  tbr: { eyebrow: string; title: string; body: string; getQuote: string };
  rex: {
    eyebrow: string; title: string; body: string;
    regNumber: string; verify: string;
  };
  brands: {
    eyebrow: string; title: string; body: string;
    viewCatalogue: string; exploreSupply: string; learnMore: string;
    photoLabel: string; photoTitle: string;
  };
  footer: {
    motto: string; tagline: string; copyright: string;
    privacy: string; terms: string; imprint: string;
    col: { products: string; company: string; support: string };
    links: {
      shopCatalogue: string; pcrTyres: string; tbrTyres: string;
      usedTyres: string; requestQuote: string; aboutOkelcor: string;
      newsInsights: string; contactUs: string; locations: string;
      getHelp: string; rex: string; wholesale: string; logistics: string;
    };
  };
  shop: {
    hero: { eyebrow: string; title: string; subtitle: string };
    catalogue: {
      products: string; product: string;
      filtersBtn: string; filtersHeading: string;
      show: string; results: string; clearAll: string;
    };
    filter: { tyreType: string; brand: string; season: string };
    sort: { default: string; priceAsc: string; priceDesc: string };
    grid: { noProducts: string; noProductsHint: string };
    card: { shipping: string; viewDetails: string; quote: string };
    info: {
      quantity: string; addToCart: string; addedToCart: string;
      requestQuote: string; shipping: string; share: string;
    };
    accordion: {
      sizePattern: string; loadSpeed: string;
      returnPolicy: string; disclaimer: string;
      tyreSize: string; width: string; aspectRatio: string;
      rimDiameter: string; construction: string; constructionVal: string;
      season: string; tyreType: string; brand: string;
      specification: string; loadIndex: string; speedIndex: string;
      loadNote: string;
      returnPre: string; returnBold: string; returnPost: string;
      returnP2: string; returnP3pre: string; returnP3post: string;
      disclaimerP1: string; disclaimerP2: string; disclaimerP3: string;
    };
    related: { eyebrow: string; heading: string };
    productDetails: string;
  };
  about: {
    hero: { eyebrow: string; title: string; subtitle: string };
    story: {
      eyebrow: string; title1: string; title2: string;
      p1: string; p2: string; p3: string; workWithUs: string;
      statDaily: string; statCountries: string; statBrands: string;
    };
    services: {
      eyebrow: string; heading: string; subtitle: string;
      items: Array<{ eyebrow: string; heading: string; body: string }>;
    };
    logistics: {
      eyebrow: string; heading: string; body: string;
      partnersEyebrow: string; partnersHeading: string; partnersBody: string;
      categoryOcean: string; categoryLogistics: string; categoryBrand: string;
    };
  };
  quote: {
    hero: { eyebrow: string; title: string; subtitle: string };
    form: {
      eyebrow: string; heading: string; requiredNote: string;
      sectionBusiness: string; sectionProduct: string; sectionDelivery: string;
      labelFullName: string; labelCompany: string; labelEmail: string; labelPhone: string;
      labelCountry: string; labelBusiness: string;
      labelTyreCategory: string; labelBrand: string; labelTyreSize: string;
      labelQuantity: string; labelBudget: string; labelTimeline: string;
      labelDeliveryAddress: string; labelDeliveryCity: string; labelDeliveryPostalCode: string;
      labelDelivery: string; labelNotes: string;
      labelUpload: string; uploadComingSoon: string; uploadHint: string;
      placeholderFullName: string; placeholderCompany: string;
      placeholderEmail: string; placeholderPhone: string;
      placeholderCountry: string; placeholderBusiness: string; placeholderCategory: string;
      placeholderBrand: string; placeholderSize: string; placeholderQuantity: string;
      placeholderBudget: string; placeholderTimeline: string;
      placeholderDeliveryAddress: string; placeholderDeliveryCity: string; placeholderDeliveryPostalCode: string;
      placeholderDelivery: string; placeholderNotes: string;
      businessTypes: string[]; tyreCategories: string[]; budgetRanges: string[]; timelines: string[];
      submitting: string; submit: string; submitNote: string;
      errFullName: string; errEmail: string; errEmailInvalid: string;
      errCountry: string; errCategory: string; errQuantity: string;
      errDelivery: string; errNotes: string; errGeneric: string;
      successTitle: string; successBody: string; refLabel: string; refNote: string; successButton: string;
    };
    summary: {
      stepsEyebrow: string; stepsHeading: string;
      steps: Array<{ title: string; body: string }>;
      whyEyebrow: string; whyHeading: string; whyItems: string[];
      contactEyebrow: string; contactHeading: string;
    };
    trust: {
      blocks: Array<{ title: string; body: string }>;
      faqEyebrow: string; faqHeading: string;
      faqs: Array<{ q: string; a: string }>;
    };
  };
  contact: {
    hero: { eyebrow: string; title: string; subtitle: string };
    officeEyebrow: string; officeTagline: string;
    infoAddress: string; infoPhone: string; infoFax: string; infoEmail: string; infoHours: string;
    helpEyebrow: string; helpHeading: string; helpItems: string[];
    formEyebrow: string; formHeading: string; formTagline: string;
    labelName: string; labelEmail: string; labelSubject: string; labelInquiry: string;
    placeholderName: string; placeholderEmail: string; placeholderSelect: string; placeholderInquiry: string;
    topics: string[];
    sending: string; submit: string; responseNote: string;
    successTitle: string; successBody: string; successButton: string;
    errName: string; errEmail: string; errEmailInvalid: string; errSubject: string; errInquiry: string;
    errGeneric: string;
    mapEyebrow: string; mapHeading: string;
    mapConsentTitle: string; mapConsentBody: string; mapEnableBtn: string;
  };
  news: {
    hero: { eyebrow: string; title: string; subtitle: string };
    latestArticles: string;
    readArticle: string; readMore: string;
    breadcrumbNews: string; backToNews: string;
    continueReading: string; moreFromNews: string;
  };
  cta: { eyebrow: string; title: string; subtitle: string; button: string; button2: string };
  floating: { placeholder: string; cta: string };
  newsletter: {
    eyebrow: string; title: string; subtitle: string;
    placeholder: string; button: string; success: string;
  };
  cart: {
    title: string;
    clearAll: string;
    closeCart: string;
    removeItem: string;
    decrease: string;
    increase: string;
    emptyTitle: string;
    emptyBody: string;
    browseCatalogue: string;
    subtotal: string;
    item: string;
    items: string;
    priceNote: string;
    checkout: string;
    continueShopping: string;
  };
  auth: {
    panelHeading: string; panelSubtitle: string; trustPoints: string[]; copyright: string;
    tabSignIn: string; tabCreateAccount: string;
    headingSignIn: string; headingSignUp: string;
    subtitleSignIn: string; subtitleSignUp: string;
    labelEmail: string; labelPassword: string; labelFullName: string;
    labelCompanyName: string; labelConfirmPassword: string;
    placeholderEmail: string; placeholderPassword: string; placeholderFullName: string;
    placeholderCompanyName: string; placeholderPasswordMin: string; placeholderConfirmPassword: string;
    forgotPassword: string; showPassword: string; hidePassword: string;
    signingIn: string; signIn: string; creatingAccount: string; createAccount: string;
    continueAsGuest: string; browseCatalogue: string; or: string;
    termsNote: string; termsNoteAnd: string; termsLabel: string; privacyLabel: string;
    needHelp: string; contactTeam: string;
    signInSuccessTitle: string; signInSuccessBody: string;
    signUpSuccessTitle: string; signUpSuccessBody: string;
    errEmailRequired: string; errEmailInvalid: string; errPasswordRequired: string;
    errFullNameRequired: string; errPasswordMin: string;
    errConfirmRequired: string; errPasswordMismatch: string;
  };
  checkout: {
    breadcrumbHome: string; breadcrumbShop: string; breadcrumbCheckout: string;
    orContinueWith: string;
    sectionDelivery: string; sectionDeliveryMethod: string;
    labelName: string; labelEmail: string; labelAddress: string;
    labelCity: string; labelPostalCode: string; labelCountry: string; labelPhone: string;
    placeholderName: string; placeholderEmail: string; placeholderAddress: string;
    placeholderCity: string; placeholderPostalCode: string;
    placeholderCountry: string; placeholderPhone: string;
    shippingName: string; shippingDetail: string; shippingFree: string;
    processing: string; placeOrder: string;
    placeOrderNote: string; placeOrderNoteAnd: string; termsLabel: string; returnPolicyLabel: string;
    successTitle: string; successBody: string; orderRef: string;
    continueShopping: string; backToHome: string;
    emptyTitle: string; emptyBody: string; browseCatalogue: string;
    errName: string; errEmail: string; errEmailInvalid: string; errAddress: string;
    errCity: string; errPostalCode: string; errCountry: string; errPhone: string;
    errCardNumber: string; errCardExpiry: string; errCardCvv: string; errCardHolder: string;
    summaryTitle: string; item: string; items: string;
    subtotal: string; delivery: string; free: string;
    tax: string; taxNote: string; total: string; taxDisclaimer: string;
    qty: string; each: string;
    expressCheckout: string;
    paymentMethod: string;
    payCardLabel: string; payCardDesc: string;
    payPaypalLabel: string; payPaypalDesc: string;
    payAppleLabel: string; payAppleDesc: string;
    payKlarnaLabel: string; payKlarnaDesc: string;
    payPaypalInfo: string; payAppleInfo: string; payKlarnaInfo: string;
    labelCardNumber: string; labelExpiry: string; labelCvv: string; labelHolder: string;
    placeholderCardNumber: string; placeholderExpiry: string;
    placeholderCvv: string; placeholderHolder: string;
  };
  search: {
    placeholder: string;
    ariaLabel: string;
    noResults: string;
    noResultsHint: string;
    productsHeading: string;
    articlesHeading: string;
    close: string;
  };
  whoWeServe: {
    eyebrow: string;
    heading: string;
    business: { label: string; title: string; body: string; cta: string };
    driver: { label: string; title: string; body: string; cta: string };
  };
  fetTeaser: {
    eyebrow: string; title: string; highlight: string;
    body: string; heroSubtitle: string; cta: string;
  };
  fetMega: {
    badge: string; heading: string;
    benefits: [string, string, string];
    learnMore: string;
    labelFuelSavings: string; labelAnnualSavings: string; labelPayback: string;
    requestQuote: string;
  };
};

// ─── English ──────────────────────────────────────────────────────────────────

const en: Translations = {
  nav: {
    home: "Home", shop: "Shop", news: "News", about: "About",
    contact: "Contact", quote: "Quote", help: "Help",
    account: "Account", language: "English", back: "Back", fet: "FET",
  },
  lang: { panelTitle: "Select Language", en: "English", de: "Deutsch", fr: "Français", es: "Español" },
  hero: {
    ctaPrimary: "Request a Quote",
    ctaSecondary: "Browse Catalogue",
  },
  categories: {
    eyebrow: "Our Range",
    heading: "Tyre categories for every market",
    cards: [
      { title: "PCR Tyres", label: "Passenger Range", subtitle: "Reliable comfort and everyday road performance" },
      { title: "TBR Tyres", label: "Truck & Bus Range", subtitle: "Built for logistics, mileage, and commercial durability" },
      { title: "Used Tyres", label: "Cost-Effective Supply", subtitle: "Affordable sourcing for distributors and export buyers" },
      { title: "OTR Tyres", label: "Heavy Duty Range", subtitle: "For construction, industrial, and rugged operations" },
    ],
    orderNow: "Order Now",
    learnMore: "Learn More",
  },
  why: {
    card1: {
      title: "Why Choose Okelcor",
      body: "Premium tyre sourcing, dependable logistics, and trusted brands — serving distributors, retailers, and individual buyers worldwide.",
      button: "About Okelcor",
    },
    card2: {
      title: "Trusted Supply",
      body: "Competitive pricing, consistent availability, and flexible options for growing businesses and everyday drivers.",
      button: "Request a Quote",
    },
  },
  logistics: {
    eyebrow: "Reliable Global Supply",
    title: "International sourcing and logistics support.",
    body: "Okelcor supports wholesalers and distributors with dependable sourcing, shipping coordination, and long-term supply continuity.",
    getQuote: "Get Quote",
    learnMore: "Learn More",
    flexibleSourcing: "Flexible sourcing",
    usedTyres: "Used Tyres",
    distEyebrow: "Distribution Support",
    distTitle: "Supply planning that helps partners scale.",
    distBody: "From product selection to delivery coordination, Okelcor supports efficient tyre sourcing for growing businesses.",
    talkToSales: "Talk to Sales",
  },
  used: {
    eyebrow: "Used Tyres",
    title: "Smarter Used Tyre Supply for Global Buyers",
    body: "Carefully sourced used and retread-ready tyres for cars, trucks, and buses — balancing reliability, value, and responsible reuse for distributors worldwide.",
    viewCatalogue: "View Catalogue",
    requestQuote: "Request Quote",
  },
  tbr: {
    eyebrow: "TBR Tyres",
    title: "Brand New TBR Tyres for Global Logistics",
    body: "Top-quality TBR tyres engineered for international transport. Built for durability, safety, and performance across every route and terrain — with worldwide delivery from trusted premium brands.",
    getQuote: "Get Your Quote",
  },
  rex: {
    eyebrow: "Certification",
    title: "REX Certified Exporter",
    body: "Clients in Great Britain, Canada, and Japan can import our tyres duty free under our REX certification, reducing import tax costs.",
    regNumber: "Registration Number",
    verify: "Verify Certification",
  },
  brands: {
    eyebrow: "Trusted Global Brands",
    title: "Sourcing from brands buyers already trust.",
    body: "Okelcor sources from the world's most trusted tyre manufacturers. Our catalogue covers leading brands across PCR, TBR, and speciality ranges — giving buyers worldwide access to consistent quality and competitive pricing.",
    viewCatalogue: "View Catalogue",
    exploreSupply: "Explore Supply",
    learnMore: "Learn More",
    photoLabel: "Premium sourcing",
    photoTitle: "Built for global tyre distribution.",
  },
  footer: {
    motto: "Growing Together",
    tagline: "Munich-based global tyre supplier delivering PCR, TBR, and used tyres to wholesalers and distributors worldwide.",
    copyright: "© 2026 Okelcor GmbH. All rights reserved.",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    imprint: "Imprint",
    col: { products: "Products", company: "Company", support: "Support" },
    links: {
      shopCatalogue: "Shop Catalogue", pcrTyres: "PCR Tyres", tbrTyres: "TBR Tyres",
      usedTyres: "Used Tyres", requestQuote: "Request a Quote",
      aboutOkelcor: "About Okelcor", newsInsights: "News & Insights",
      contactUs: "Contact Us", locations: "Locations",
      getHelp: "Get Help", rex: "REX Certification",
      wholesale: "Wholesale Enquiries", logistics: "Logistics Support",
    },
  },
  about: {
    hero: {
      eyebrow: "About Okelcor",
      title: "European Wholesale Tire Distributor",
      subtitle: "Headquartered in Munich. Supplying premium PCR, TBR, LT, and used tyres to wholesalers and distributors in over 30 countries.",
    },
    story: {
      eyebrow: "Our Story",
      title1: "Munich-based.", title2: "Globally distributed.",
      p1: "Okelcor is headquartered in Munich and supplies customers worldwide with premium new and used tyres — including PCR, LT, TBR, and bus tyres — from the world's most trusted brands.",
      p2: "The company maintains an expanding catalogue of high-quality products, balancing advanced technology with cost-effective options to serve wholesale buyers and international distributors.",
      p3: "With over 500,000 tyres available daily, Okelcor ensures transparent pricing, efficient ordering, and dependable logistics — providing a full-service supply solution across Germany, Europe, and beyond.",
      workWithUs: "Work With Us",
      statDaily: "Tyres available daily", statCountries: "Countries served", statBrands: "Premium brands",
    },
    services: {
      eyebrow: "What We Offer",
      heading: "Services built around your supply needs.",
      subtitle: "From first enquiry to final delivery, Okelcor supports every stage of your tyre procurement journey.",
      items: [
        { eyebrow: "1-on-1 Consultation", heading: "Expert guidance for every order.", body: "Our team provides personalised tyre selection advice, matching your requirements across PCR, TBR, LT, and used stock. From specification to volume planning — we help you make the right call every time." },
        { eyebrow: "Logistics Handling", heading: "Global freight, end-to-end.", body: "We coordinate international shipping through trusted freight partnerships including Hapag-Lloyd and DB Schenker, ensuring tyres reach their destination efficiently and on schedule — wherever in the world you operate." },
        { eyebrow: "After Sales Support", heading: "Support that continues after delivery.", body: "Okelcor's after-sales team remains available post-delivery for claims handling, documentation follow-up, and supply continuity — giving you full confidence throughout the entire procurement process." },
      ],
    },
    logistics: {
      eyebrow: "Logistics Reach",
      heading: "Tyres delivered to any corner of the world.",
      body: "Okelcor coordinates end-to-end freight management for international tyre shipments, with full tracking and documentation support.",
      partnersEyebrow: "Trusted Partners",
      partnersHeading: "Networks built for reliability.",
      partnersBody: "From freight coordination to tyre brand supply, our trusted partners ensure quality and delivery at every step.",
      categoryOcean: "Ocean Freight", categoryLogistics: "Logistics & Transport", categoryBrand: "Tyre Brand Partner",
    },
  },
  quote: {
    hero: {
      eyebrow: "Quote Request",
      title: "Get Instant Tyre Supply Quotation",
      subtitle: "Whether you are stocking a retail tire shop or outfitting a commercial fleet, Okelcor delivers. Share your inventory requirements below to receive a custom quote and lock in your exclusive wholesale rates.",
    },
    form: {
      eyebrow: "Quote Request Form", heading: "Tell us what you need.",
      requiredNote: "Fields marked * are required.",
      sectionBusiness: "Business / Customer Information",
      sectionProduct: "Product Request Information",
      sectionDelivery: "Delivery Details",
      labelFullName: "Full Name", labelCompany: "Company Name", labelEmail: "Email Address", labelPhone: "Phone Number",
      labelCountry: "Country / Region", labelBusiness: "Business Type",
      labelTyreCategory: "Tyre Category", labelBrand: "Brand Preference", labelTyreSize: "Tyre Size / Specification",
      labelQuantity: "Quantity Needed", labelBudget: "Budget Range", labelTimeline: "Required Delivery Timeline",
      labelDeliveryAddress: "Street / Delivery Address", labelDeliveryCity: "City", labelDeliveryPostalCode: "Postal Code",
      labelDelivery: "Preferred delivery location / port", labelNotes: "Additional Notes / Inquiry",
      labelUpload: "Upload Product List / Specification Sheet",
      uploadComingSoon: "optional \u2014 coming soon",
      uploadHint: "Drag & drop or click to upload \u2014 PDF, XLS, CSV accepted",
      placeholderFullName: "John Smith", placeholderCompany: "Acme Tyres GmbH",
      placeholderEmail: "john@company.com", placeholderPhone: "+49 89 000 0000",
      placeholderCountry: "Select country", placeholderBusiness: "Select type", placeholderCategory: "Select category",
      placeholderBrand: "e.g. Michelin, Bridgestone, Any",
      placeholderSize: "e.g. 205/55R16 91H or 295/80R22.5",
      placeholderQuantity: "e.g. 500 units, 2 containers",
      placeholderBudget: "Select range", placeholderTimeline: "Select timeline",
      placeholderDeliveryAddress: "Street address", placeholderDeliveryCity: "City", placeholderDeliveryPostalCode: "Postal / ZIP code",
      placeholderDelivery: "e.g. Hamburg Port, Lagos, Dubai",
      placeholderNotes: "Describe your requirements in detail \u2014 tyre specs, intended use, volume, any other relevant information\u2026",
      businessTypes: ["Wholesaler", "Distributor", "Retailer", "Fleet Operator", "Individual Buyer", "Other"],
      tyreCategories: ["PCR Tyres", "TBR Tyres", "Used Tyres", "Mixed Request"],
      budgetRanges: ["Under \u20ac1,000", "\u20ac1,000 \u2013 \u20ac5,000", "\u20ac5,000 \u2013 \u20ac20,000", "\u20ac20,000 \u2013 \u20ac50,000", "\u20ac50,000+", "Prefer not to say"],
      timelines: ["As soon as possible", "Within 1 week", "Within 1 month", "Flexible"],
      submitting: "Submitting Request\u2026", submit: "Submit Quote Request",
      submitNote: "We respond to all requests within one business day. Your information is kept strictly confidential.",
      errFullName: "Full name is required", errEmail: "Email is required", errEmailInvalid: "Enter a valid email address",
      errCountry: "Please select a country", errCategory: "Please select a tyre category",
      errQuantity: "Quantity is required", errDelivery: "Delivery location is required",
      errNotes: "Please describe your requirements",
      errGeneric: "Something went wrong. Please try again or contact us directly at support@okelcor.com.",
      successTitle: "Quote Request Received",
      successBody: "Your quote request has been received. Our team will review your requirements and contact you with a tailored quotation within one business day.",
      refLabel: "Reference number", refNote: "Please keep this reference for any follow-up with our team.",
      successButton: "Submit Another Request",
    },
    summary: {
      stepsEyebrow: "What Happens Next", stepsHeading: "Fast, simple, and transparent.",
      steps: [
        { title: "We review your request", body: "Our sales team carefully reviews your tyre specifications, quantities, and delivery requirements." },
        { title: "We prepare your quotation", body: "You receive a tailored price sheet within one business day, including product availability and logistics costs." },
        { title: "We confirm and ship", body: "Once you approve the quote, we arrange sourcing, packaging, and international freight coordination." },
      ],
      whyEyebrow: "Why Okelcor", whyHeading: "Your direct supply partner.",
      whyItems: ["Response within 1 business day", "Tailored wholesale pricing", "International logistics support", "Trusted supply from vetted brands"],
      contactEyebrow: "Prefer to call us?", contactHeading: "Reach our sales team directly.",
    },
    trust: {
      blocks: [
        { title: "Tailored Wholesale Pricing", body: "Every quote is prepared specifically for your order volume, product mix, and destination market. No generic price lists." },
        { title: "Global Delivery Support", body: "We coordinate freight to over 30 countries through established logistics partnerships including Hapag-Lloyd and DB Schenker." },
        { title: "Dedicated Sales Assistance", body: "A named Okelcor sales contact handles your request from first enquiry through to confirmed delivery." },
      ],
      faqEyebrow: "FAQ", faqHeading: "Common questions.",
      faqs: [
        { q: "How long does it take to receive a quote?", a: "Our team aims to respond to all quote requests within one business day. For complex or high-volume requests, we may follow up within 48 hours for additional details before preparing your quotation." },
        { q: "Can I request multiple tyre types in one quote?", a: "Yes \u2014 select \u2018Mixed Request\u2019 in the Tyre Category field and describe your full requirements in the notes section. We will prepare a consolidated quotation covering all product lines." },
        { q: "Do you support international delivery?", a: "Okelcor ships to over 30 countries worldwide. We handle full export documentation, customs paperwork, and freight coordination through trusted logistics partners." },
        { q: "Can I request used and new tyres together?", a: "Absolutely. Many of our clients source a combination of premium new tyres and Grade A used tyres to optimise their procurement budget. Include both requirements in your notes and we will quote accordingly." },
      ],
    },
  },
  contact: {
    hero: {
      eyebrow: "Contact",
      title: "Talk to us about your next tyre supply order.",
      subtitle: "Reach out for catalogue access, wholesale pricing, sourcing support, and partnership discussions.",
    },
    officeEyebrow: "Our Office", officeTagline: "Global tyre supply — Munich headquarters",
    infoAddress: "Address", infoPhone: "Phone", infoFax: "Fax", infoEmail: "Email", infoHours: "Business Hours",
    helpEyebrow: "We Can Help With", helpHeading: "From enquiry to delivery.",
    helpItems: [
      "Wholesale pricing & bulk orders",
      "PCR, TBR, LT & used tyre sourcing",
      "International logistics coordination",
      "REX certified export documentation",
      "After-sales claims & support",
    ],
    formEyebrow: "Send a Message", formHeading: "Quick Inquiry",
    formTagline: "Fill in the form and we'll get back to you promptly.",
    labelName: "Full Name", labelEmail: "Email Address", labelSubject: "Subject", labelInquiry: "Inquiry Message",
    placeholderName: "John Smith", placeholderEmail: "john@company.com",
    placeholderSelect: "Select a topic",
    placeholderInquiry: "Describe your tyre supply requirements, volumes, or any questions you have\u2026",
    topics: ["Wholesale Pricing", "Tyre Sourcing", "Logistics & Shipping", "Catalogue Access", "Partnership", "After Sales Support", "Other"],
    sending: "Sending\u2026", submit: "Send Message",
    responseNote: "We typically respond within one business day.",
    successTitle: "Message Sent",
    successBody: "Thank you for reaching out. Our team will respond to your inquiry within one business day.",
    successButton: "Send Another Message",
    errName: "Name is required", errEmail: "Email is required",
    errEmailInvalid: "Enter a valid email address",
    errSubject: "Please select a subject", errInquiry: "Please describe your inquiry",
    errGeneric: "Something went wrong. Please try again or email us directly at support@okelcor.com.",
    mapEyebrow: "Our Location", mapHeading: "Find us in Munich.",
    mapConsentTitle: "Map requires cookie consent",
    mapConsentBody: "We use Google Maps to show our location. Enable functional cookies to load the map.",
    mapEnableBtn: "Enable Map",
  },
  news: {
    hero: {
      eyebrow: "News & Insights",
      title: "Insights, updates, and tyre supply knowledge.",
      subtitle: "Stay informed with practical articles and updates for distributors, partners, and international buyers.",
    },
    latestArticles: "Latest Articles",
    readArticle: "Read Article", readMore: "Read More",
    breadcrumbNews: "News", backToNews: "Back to News",
    continueReading: "Continue Reading", moreFromNews: "More from Okelcor News",
  },
  cta: {
    eyebrow: "Ready to Work With Okelcor",
    title: "Tyres for businesses. Tyres for drivers.",
    subtitle: "Whether you need bulk supply for your business or the right tyre for your car — Okelcor delivers quality, pricing, and support for every buyer.",
    button: "Request a Quote",
    button2: "Browse Catalogue",
  },
  whoWeServe: {
    eyebrow: "Who We Serve",
    heading: "Tyres for every buyer.",
    business: {
      label: "For Businesses",
      title: "Wholesale & Bulk Supply",
      body: "Distributors, wholesalers, fleet operators, and tyre retailers. Competitive bulk pricing, international logistics, and dedicated account support.",
      cta: "Request Bulk Quote",
    },
    driver: {
      label: "For Drivers",
      title: "Quality Tyres for Your Vehicle",
      body: "Individual drivers and car owners — find the right tyre for your vehicle from trusted global brands at competitive prices.",
      cta: "Shop Catalogue",
    },
  },
  floating: { placeholder: "Ask about tyre supply", cta: "Request a Quote" },
  newsletter: {
    eyebrow: "Stay Informed",
    title: "Tyre market news & trade updates.",
    subtitle: "Delivered to your inbox. Unsubscribe at any time.",
    placeholder: "your@email.com",
    button: "Subscribe",
    success: "You're subscribed. Thank you!",
  },
  cart: {
    title: "Cart",
    clearAll: "Clear all",
    closeCart: "Close cart",
    removeItem: "Remove item",
    decrease: "Decrease",
    increase: "Increase",
    emptyTitle: "Your cart is empty",
    emptyBody: "Browse the catalogue and add tyres to get started.",
    browseCatalogue: "Browse Catalogue",
    subtotal: "Subtotal",
    item: "item",
    items: "items",
    priceNote: "Price estimate · Excl. tax · Shipping calculated at checkout",
    checkout: "Proceed to Checkout",
    continueShopping: "Continue Shopping",
  },
  auth: {
    panelHeading: "Your global tyre supply partner.",
    panelSubtitle: "Access wholesale pricing, manage your orders, and stay connected with Okelcor's global supply network.",
    trustPoints: ["Access wholesale pricing and bulk stock", "Request and track tyre supply quotes", "Manage orders and delivery coordination"],
    copyright: "© 2026 Okelcor GmbH · Munich, Germany",
    tabSignIn: "Sign In", tabCreateAccount: "Create Account",
    headingSignIn: "Welcome back.", headingSignUp: "Create your account.",
    subtitleSignIn: "Sign in to access your Okelcor account.", subtitleSignUp: "Join Okelcor and start sourcing tyres globally.",
    labelEmail: "Email Address", labelPassword: "Password", labelFullName: "Full Name",
    labelCompanyName: "Company Name", labelConfirmPassword: "Confirm Password",
    placeholderEmail: "john@company.com", placeholderPassword: "Your password",
    placeholderFullName: "John Smith", placeholderCompanyName: "Acme Tyres GmbH (optional)",
    placeholderPasswordMin: "Min. 8 characters", placeholderConfirmPassword: "Repeat your password",
    forgotPassword: "Forgot password?", showPassword: "Show password", hidePassword: "Hide password",
    signingIn: "Signing in…", signIn: "Sign In", creatingAccount: "Creating account…", createAccount: "Create Account",
    continueAsGuest: "Continue as Guest", browseCatalogue: "Browse Catalogue", or: "or",
    termsNote: "By creating an account you agree to our", termsNoteAnd: "and",
    termsLabel: "Terms & Conditions", privacyLabel: "Privacy Policy",
    needHelp: "Need help?", contactTeam: "Contact our team",
    signInSuccessTitle: "Welcome back", signInSuccessBody: "You're signed in. Backend integration coming soon.",
    signUpSuccessTitle: "Account created", signUpSuccessBody: "Welcome to Okelcor. Backend integration coming soon — your account will be activated when we go live.",
    errEmailRequired: "Email is required", errEmailInvalid: "Enter a valid email address",
    errPasswordRequired: "Password is required", errFullNameRequired: "Full name is required",
    errPasswordMin: "Password must be at least 8 characters",
    errConfirmRequired: "Please confirm your password", errPasswordMismatch: "Passwords do not match",
  },
  checkout: {
    breadcrumbHome: "Home", breadcrumbShop: "Shop", breadcrumbCheckout: "Checkout",
    orContinueWith: "or continue with",
    sectionDelivery: "Delivery Details", sectionDeliveryMethod: "Delivery Method",
    labelName: "Full Name", labelEmail: "Email Address", labelAddress: "Street Address",
    labelCity: "City", labelPostalCode: "Postal Code", labelCountry: "Country", labelPhone: "Phone Number",
    placeholderName: "John Smith", placeholderEmail: "john@company.com",
    placeholderAddress: "123 Warehouse Road", placeholderCity: "Munich",
    placeholderPostalCode: "80331", placeholderCountry: "Select country", placeholderPhone: "+49 89 545583 60",
    shippingName: "Standard International Shipping", shippingDetail: "5–10 business days · Tracked delivery", shippingFree: "Free",
    processing: "Processing…", placeOrder: "Place Order",
    placeOrderNote: "By placing your order you agree to our", placeOrderNoteAnd: "and",
    termsLabel: "Terms & Conditions", returnPolicyLabel: "Return Policy",
    successTitle: "Order Request Submitted",
    successBody: "Our team will contact you within 24 hours to confirm pricing, availability, and arrange delivery.",
    orderRef: "Order reference", continueShopping: "Continue Shopping", backToHome: "Back to Home",
    emptyTitle: "Your cart is empty", emptyBody: "Add some tyres before proceeding to checkout.", browseCatalogue: "Browse Catalogue",
    errName: "Name is required", errEmail: "Email is required", errEmailInvalid: "Enter a valid email address",
    errAddress: "Address is required", errCity: "City is required", errPostalCode: "Postal code is required",
    errCountry: "Select a country", errPhone: "Phone number is required",
    errCardNumber: "Enter a valid card number", errCardExpiry: "Enter MM/YY",
    errCardCvv: "Enter CVV", errCardHolder: "Cardholder name is required",
    summaryTitle: "Order Summary", item: "item", items: "items",
    subtotal: "Subtotal (net)", delivery: "Delivery", free: "Free",
    tax: "VAT", taxNote: "VAT calculated securely before payment", total: "Total",
    taxDisclaimer: "Final gross amount — confirmed at Stripe Checkout",
    qty: "Qty", each: "each",
    expressCheckout: "Express Checkout",
    paymentMethod: "Payment Method",
    payCardLabel: "Credit / Debit Card", payCardDesc: "Visa, Mastercard, Amex",
    payPaypalLabel: "PayPal", payPaypalDesc: "Pay via your PayPal account",
    payAppleLabel: "Apple Pay", payAppleDesc: "Touch ID or Face ID",
    payKlarnaLabel: "Klarna", payKlarnaDesc: "Buy now, pay later",
    payPaypalInfo: "You will be redirected to PayPal to complete your payment securely.",
    payAppleInfo: "Complete your payment using Touch ID or Face ID on your Apple device.",
    payKlarnaInfo: "Split your order into 3 interest-free instalments. Subject to approval.",
    labelCardNumber: "Card Number", labelExpiry: "Expiry Date", labelCvv: "CVV", labelHolder: "Cardholder Name",
    placeholderCardNumber: "1234 5678 9012 3456", placeholderExpiry: "MM/YY",
    placeholderCvv: "123", placeholderHolder: "Name as it appears on the card",
  },
  search: {
    placeholder: "Search tyres, brands, articles…",
    ariaLabel: "Open search",
    noResults: "No results found",
    noResultsHint: "Try a brand name, tyre size, or article topic",
    productsHeading: "Products",
    articlesHeading: "Articles",
    close: "Close search",
  },
  shop: {
    hero: {
      eyebrow: "Our Catalogue",
      title: "Premium Tyres for Global Supply",
      subtitle: "PCR, TBR, OTR, and used tyres from the world's most trusted brands.",
    },
    catalogue: {
      products: "products", product: "product",
      filtersBtn: "Filters", filtersHeading: "Filters",
      show: "Show", results: "results", clearAll: "Clear all",
    },
    filter: { tyreType: "Tyre Type", brand: "Brand", season: "Season" },
    sort: { default: "Default", priceAsc: "Price: Low to High", priceDesc: "Price: High to Low" },
    grid: { noProducts: "No products found", noProductsHint: "Try adjusting or clearing your filters." },
    card: { shipping: "Excl. tax · Free shipping", viewDetails: "View Details", quote: "Quote" },
    info: {
      quantity: "Quantity", addToCart: "Add to Cart", addedToCart: "Added to Cart",
      requestQuote: "Request Quote", shipping: "Excluding sales tax · Free shipping", share: "Share",
    },
    accordion: {
      sizePattern: "Size and Pattern", loadSpeed: "Load / Speed Index",
      returnPolicy: "Return Policy", disclaimer: "Disclaimer",
      tyreSize: "Tyre Size", width: "Width", aspectRatio: "Aspect Ratio",
      rimDiameter: "Rim Diameter", construction: "Construction", constructionVal: "Radial (R)",
      season: "Season", tyreType: "Tyre Type", brand: "Brand",
      specification: "Specification", loadIndex: "Load Index", speedIndex: "Speed Index",
      loadNote: "The load index indicates the maximum weight each tyre can support. The speed index indicates the maximum sustained speed the tyre is rated for under full load conditions. Always observe the vehicle manufacturer's minimum requirements.",
      returnPre: "Okelcor accepts returns on unused, undamaged tyres in their original packaging within ",
      returnBold: "14 days",
      returnPost: " of delivery, subject to prior written authorisation.",
      returnP2: "Tyres that have been mounted, used, or show signs of installation are not eligible for return. Custom orders and special sourcing arrangements are non-returnable.",
      returnP3pre: "To initiate a return, contact our team at ",
      returnP3post: " with your order reference and reason for return.",
      disclaimerP1: "Product specifications, pricing, and availability are subject to change without notice. Images shown are for illustrative purposes only and may not represent the exact item supplied.",
      disclaimerP2: "It is the buyer's responsibility to ensure that tyres are suitable for their intended application, vehicle, and legal requirements in the destination country. Okelcor accepts no liability for improper installation or use outside of rated specifications.",
      disclaimerP3: "Prices are quoted excluding applicable taxes and duties unless otherwise stated. Shipping terms are agreed upon at the time of order confirmation.",
    },
    related: { eyebrow: "You May Also Like", heading: "Related products" },
    productDetails: "Product Details",
  },
  fetTeaser: {
    eyebrow: "Also Available",
    title: "Fuel Echo Tech",
    highlight: "Save Fuel. Improve Performance.",
    body: "The fuel efficiency device trusted by fleet operators across Europe. Up to 15% fuel savings.",
    heroSubtitle: "Save fuel, improve performance and reduce emissions for any vehicle or fleet.",
    cta: "Learn More",
  },
  fetMega: {
    badge: "Fuel Echo Tech",
    heading: "Save Fuel. Protect Your Engine.",
    benefits: ["Up to 13.9% fuel reduction", "ISO 9001:2015 certified", "Payback in 3–5 months"],
    learnMore: "Learn More",
    labelFuelSavings: "Fuel Savings",
    labelAnnualSavings: "Annual Savings",
    labelPayback: "Payback Period",
    requestQuote: "Request a Quote",
  },
};

// ─── German ───────────────────────────────────────────────────────────────────

const de: Translations = {
  nav: {
    home: "Startseite", shop: "Shop", news: "Neuigkeiten", about: "Über uns",
    contact: "Kontakt", quote: "Angebot", help: "Hilfe",
    account: "Konto", language: "Deutsch", back: "Zurück", fet: "FET",
  },
  lang: { panelTitle: "Sprache wählen", en: "English", de: "Deutsch", fr: "Français", es: "Español" },
  hero: {
    ctaPrimary: "Anfrage stellen",
    ctaSecondary: "Katalog ansehen",
  },
  categories: {
    eyebrow: "Unser Sortiment",
    heading: "Reifenkategorien für jeden Markt",
    cards: [
      { title: "PKW-Reifen", label: "PKW-Sortiment", subtitle: "Zuverlässiger Komfort und alltägliche Fahrleistung" },
      { title: "LKW-Reifen", label: "LKW & Bus Sortiment", subtitle: "Gebaut für Logistik, Laufleistung und gewerbliche Haltbarkeit" },
      { title: "Gebrauchtreifen", label: "Kosteneffiziente Versorgung", subtitle: "Erschwingliche Beschaffung für Händler und Exportkäufer" },
      { title: "OTR-Reifen", label: "Schwerlastsortiment", subtitle: "Für Bau, Industrie und anspruchsvollen Einsatz" },
    ],
    orderNow: "Jetzt bestellen",
    learnMore: "Mehr erfahren",
  },
  why: {
    card1: {
      title: "Warum Okelcor wählen",
      body: "Premium-Reifenbeschaffung, zuverlässige Logistik und starke Lieferantenbeziehungen für Großhändler und Händler.",
      button: "Über Okelcor",
    },
    card2: {
      title: "Zuverlässige Versorgung",
      body: "Wettbewerbsfähige Preise, konstante Verfügbarkeit und eine langfristige Vertriebsperspektive für wachsende Reifenunternehmen.",
      button: "Angebot anfordern",
    },
  },
  logistics: {
    eyebrow: "Zuverlässige globale Versorgung",
    title: "Internationale Beschaffung und Logistikunterstützung.",
    body: "Okelcor unterstützt Großhändler und Händler mit zuverlässiger Beschaffung, Versandkoordination und langfristiger Lieferkontinuität.",
    getQuote: "Angebot holen",
    learnMore: "Mehr erfahren",
    flexibleSourcing: "Flexible Beschaffung",
    usedTyres: "Gebrauchtreifen",
    distEyebrow: "Vertriebsunterstützung",
    distTitle: "Lieferplanung, die Partnern beim Wachstum hilft.",
    distBody: "Von der Produktauswahl bis zur Lieferkoordination — Okelcor unterstützt effiziente Reifenbeschaffung für wachsende Unternehmen.",
    talkToSales: "Mit Vertrieb sprechen",
  },
  used: {
    eyebrow: "Gebrauchtreifen",
    title: "Intelligente Gebrauchtreifen-Versorgung für globale Käufer",
    body: "Sorgfältig beschaffte gebrauchte und rundlauffähige Reifen für Pkw, Lkw und Busse — für Händler weltweit.",
    viewCatalogue: "Katalog ansehen",
    requestQuote: "Angebot anfordern",
  },
  tbr: {
    eyebrow: "LKW-Reifen",
    title: "Neue LKW-Reifen für die globale Logistik",
    body: "Hochwertige LKW-Reifen für den internationalen Transport. Gebaut für Haltbarkeit, Sicherheit und Leistung auf jeder Route — mit weltweiter Lieferung von vertrauenswürdigen Marken.",
    getQuote: "Angebot anfordern",
  },
  rex: {
    eyebrow: "Zertifizierung",
    title: "REX-zertifizierter Exporteur",
    body: "Kunden in Großbritannien, Kanada und Japan können unsere Reifen zollfrei unter unserer REX-Zertifizierung importieren, was die Importsteuerkosten senkt.",
    regNumber: "Registrierungsnummer",
    verify: "Zertifizierung prüfen",
  },
  brands: {
    eyebrow: "Vertraute globale Marken",
    title: "Beschaffung von Marken, denen Käufer bereits vertrauen.",
    body: "Okelcor bezieht von den weltweit vertrauenswürdigsten Reifenherstellern. Unser Katalog umfasst führende Marken in PCR, LKW und Spezialreifen.",
    viewCatalogue: "Katalog ansehen",
    exploreSupply: "Versorgung erkunden",
    learnMore: "Mehr erfahren",
    photoLabel: "Premium-Beschaffung",
    photoTitle: "Entwickelt für den globalen Reifenhandel.",
  },
  footer: {
    motto: "Gemeinsam wachsen",
    tagline: "Münchner globaler Reifenlieferant für PKW-, LKW- und Gebrauchtreifen an Großhändler und Händler weltweit.",
    copyright: "© 2026 Okelcor GmbH. Alle Rechte vorbehalten.",
    privacy: "Datenschutz",
    terms: "AGB",
    imprint: "Impressum",
    col: { products: "Produkte", company: "Unternehmen", support: "Support" },
    links: {
      shopCatalogue: "Katalog", pcrTyres: "PKW-Reifen", tbrTyres: "LKW-Reifen",
      usedTyres: "Gebrauchtreifen", requestQuote: "Angebot anfordern",
      aboutOkelcor: "Über Okelcor", newsInsights: "Neuigkeiten & Einblicke",
      contactUs: "Kontakt", locations: "Standorte",
      getHelp: "Hilfe erhalten", rex: "REX-Zertifizierung",
      wholesale: "Großhandelsanfragen", logistics: "Logistiksupport",
    },
  },
  about: {
    hero: {
      eyebrow: "Über Okelcor",
      title: "Ihr vertrauenswürdiger globaler Reifenlieferant.",
      subtitle: "Hauptsitz in München. Versorgung mit Premium-PKW-, LKW-, LT- und Gebrauchtreifen für Großhändler und Händler in über 30 Ländern.",
    },
    story: {
      eyebrow: "Unsere Geschichte",
      title1: "München-basiert.", title2: "Global verteilt.",
      p1: "Okelcor hat seinen Hauptsitz in München und versorgt Kunden weltweit mit Premium-Neu- und Gebrauchtreifen — einschließlich PKW-, LT-, LKW- und Busreifen — von den weltweit vertrauenswürdigsten Marken.",
      p2: "Das Unternehmen pflegt einen wachsenden Katalog hochwertiger Produkte und balanciert fortschrittliche Technologie mit kosteneffizienten Optionen für Großhandelskäufer und internationale Händler.",
      p3: "Mit über 500.000 täglich verfügbaren Reifen gewährleistet Okelcor transparente Preisgestaltung, effiziente Bestellung und zuverlässige Logistik — eine Full-Service-Versorgungslösung in Deutschland, Europa und darüber hinaus.",
      workWithUs: "Mit uns arbeiten",
      statDaily: "Täglich verfügbare Reifen", statCountries: "Belieferte Länder", statBrands: "Premium-Marken",
    },
    services: {
      eyebrow: "Was wir bieten",
      heading: "Dienstleistungen rund um Ihre Versorgungsbedürfnisse.",
      subtitle: "Von der ersten Anfrage bis zur endgültigen Lieferung unterstützt Okelcor jede Phase Ihrer Reifenbeschaffung.",
      items: [
        { eyebrow: "Persönliche Beratung", heading: "Expertenführung für jede Bestellung.", body: "Unser Team bietet personalisierte Reifenauswahlberatung für PKW-, LKW-, LT- und Gebrauchtbestände. Von der Spezifikation bis zur Volumenplanung — wir helfen Ihnen, jedes Mal die richtige Entscheidung zu treffen." },
        { eyebrow: "Logistikabwicklung", heading: "Globale Fracht, von Anfang bis Ende.", body: "Wir koordinieren den internationalen Versand über vertrauenswürdige Frachtpartnerschaften wie Hapag-Lloyd und DB Schenker und stellen sicher, dass Reifen effizient und termingerecht ihr Ziel erreichen." },
        { eyebrow: "After-Sales-Support", heading: "Support, der nach der Lieferung weitergeht.", body: "Das After-Sales-Team von Okelcor steht nach der Lieferung für Reklamationsbearbeitung, Dokumentationsabwicklung und Versorgungskontinuität zur Verfügung — für vollste Sicherheit während des gesamten Beschaffungsprozesses." },
      ],
    },
    logistics: {
      eyebrow: "Logistikreichweite",
      heading: "Reifen in jeden Winkel der Welt geliefert.",
      body: "Okelcor koordiniert das durchgängige Frachtmanagement für internationale Reifensendungen mit vollständigem Tracking und Dokumentationsunterstützung.",
      partnersEyebrow: "Vertrauenswürdige Partner",
      partnersHeading: "Netzwerke für Zuverlässigkeit.",
      partnersBody: "Von der Frachtkoordination bis zur Reifenmarkenversorgung — unsere Partner gewährleisten Qualität und Lieferung auf jedem Schritt.",
      categoryOcean: "Seefracht", categoryLogistics: "Logistik & Transport", categoryBrand: "Reifenmarkenpartner",
    },
  },
  quote: {
    hero: {
      eyebrow: "Angebotsanfrage",
      title: "Reifenlieferangebot anfordern",
      subtitle: "Teilen Sie uns Ihren Bedarf mit und unser Team erstellt Ihnen ein ma\u00dfgeschneidertes Angebot.",
    },
    form: {
      eyebrow: "Angebotsanfrageformular", heading: "Teilen Sie uns Ihren Bedarf mit.",
      requiredNote: "Mit * markierte Felder sind Pflichtfelder.",
      sectionBusiness: "Gesch\u00e4fts- / Kundeninformationen",
      sectionProduct: "Produktanfrageinformationen",
      sectionDelivery: "Lieferdetails",
      labelFullName: "Vollst\u00e4ndiger Name", labelCompany: "Firmenname", labelEmail: "E-Mail-Adresse", labelPhone: "Telefonnummer",
      labelCountry: "Land / Region", labelBusiness: "Unternehmenstyp",
      labelTyreCategory: "Reifenkategorie", labelBrand: "Markenpräferenz", labelTyreSize: "Reifengr\u00f6\u00dfe / Spezifikation",
      labelQuantity: "Ben\u00f6tigte Menge", labelBudget: "Budgetrahmen", labelTimeline: "Gew\u00fcnschter Liefertermin",
      labelDeliveryAddress: "Straße / Lieferadresse", labelDeliveryCity: "Stadt", labelDeliveryPostalCode: "Postleitzahl",
      labelDelivery: "Bevorzugter Lieferort / Hafen", labelNotes: "Zus\u00e4tzliche Anmerkungen / Anfrage",
      labelUpload: "Produktliste / Spezifikationsblatt hochladen",
      uploadComingSoon: "optional \u2014 demn\u00e4chst verf\u00fcgbar",
      uploadHint: "Ziehen & ablegen oder klicken \u2014 PDF, XLS, CSV akzeptiert",
      placeholderFullName: "Max Mustermann", placeholderCompany: "Musterfirma GmbH",
      placeholderEmail: "max@firma.de", placeholderPhone: "+49 89 000 0000",
      placeholderCountry: "Land ausw\u00e4hlen", placeholderBusiness: "Typ ausw\u00e4hlen", placeholderCategory: "Kategorie ausw\u00e4hlen",
      placeholderBrand: "z.B. Michelin, Bridgestone, Beliebig",
      placeholderSize: "z.B. 205/55R16 91H oder 295/80R22.5",
      placeholderQuantity: "z.B. 500 St\u00fcck, 2 Container",
      placeholderBudget: "Bereich ausw\u00e4hlen", placeholderTimeline: "Zeitplan ausw\u00e4hlen",
      placeholderDeliveryAddress: "Stra\u00dfe und Hausnummer", placeholderDeliveryCity: "Stadt", placeholderDeliveryPostalCode: "Postleitzahl",
      placeholderDelivery: "z.B. Hamburger Hafen, Lagos, Dubai",
      placeholderNotes: "Beschreiben Sie Ihren Bedarf im Detail \u2014 Reifenspezifikationen, Verwendungszweck, Menge und weitere relevante Informationen\u2026",
      businessTypes: ["Gro\u00dfh\u00e4ndler", "H\u00e4ndler", "Einzelh\u00e4ndler", "Flottenunternehmen", "Privatk\u00e4ufer", "Sonstiges"],
      tyreCategories: ["PKW-Reifen", "LKW-Reifen", "Gebrauchtreifen", "Gemischte Anfrage"],
      budgetRanges: ["Unter \u20ac1.000", "\u20ac1.000 \u2013 \u20ac5.000", "\u20ac5.000 \u2013 \u20ac20.000", "\u20ac20.000 \u2013 \u20ac50.000", "\u20ac50.000+", "Keine Angabe"],
      timelines: ["So schnell wie m\u00f6glich", "Innerhalb 1 Woche", "Innerhalb 1 Monat", "Flexibel"],
      submitting: "Anfrage wird gesendet\u2026", submit: "Angebotsanfrage absenden",
      submitNote: "Wir antworten auf alle Anfragen innerhalb eines Werktages. Ihre Daten werden streng vertraulich behandelt.",
      errFullName: "Vollst\u00e4ndiger Name ist erforderlich", errEmail: "E-Mail ist erforderlich", errEmailInvalid: "Geben Sie eine g\u00fcltige E-Mail-Adresse ein",
      errCountry: "Bitte w\u00e4hlen Sie ein Land", errCategory: "Bitte w\u00e4hlen Sie eine Reifenkategorie",
      errQuantity: "Menge ist erforderlich", errDelivery: "Lieferort ist erforderlich",
      errNotes: "Bitte beschreiben Sie Ihren Bedarf",
      errGeneric: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt unter support@okelcor.com.",
      successTitle: "Angebotsanfrage erhalten",
      successBody: "Ihre Angebotsanfrage wurde erhalten. Unser Team wird Ihren Bedarf pr\u00fcfen und Ihnen innerhalb eines Werktages ein ma\u00dfgeschneidertes Angebot zusenden.",
      refLabel: "Referenznummer", refNote: "Bitte bewahren Sie diese Referenz f\u00fcr R\u00fcckfragen bei unserem Team auf.",
      successButton: "Weitere Anfrage senden",
    },
    summary: {
      stepsEyebrow: "Was als n\u00e4chstes passiert", stepsHeading: "Schnell, einfach und transparent.",
      steps: [
        { title: "Wir pr\u00fcfen Ihre Anfrage", body: "Unser Verkaufsteam pr\u00fcft sorgf\u00e4ltig Ihre Reifenspezifikationen, Mengen und Lieferanforderungen." },
        { title: "Wir erstellen Ihr Angebot", body: "Sie erhalten innerhalb eines Werktages eine ma\u00dfgeschneiderte Preisliste mit Produktverf\u00fcgbarkeit und Logistikkosten." },
        { title: "Wir best\u00e4tigen und versenden", body: "Nach Ihrer Angebotsbestätigung organisieren wir Beschaffung, Verpackung und internationale Frachtkoordination." },
      ],
      whyEyebrow: "Warum Okelcor", whyHeading: "Ihr direkter Versorgungspartner.",
      whyItems: ["Antwort innerhalb eines Werktages", "Ma\u00dfgeschneiderte Gro\u00dfhandelspreise", "Internationale Logistikunterunterst\u00fctzung", "Zuverl\u00e4ssige Versorgung durch gepr\u00fcfte Marken"],
      contactEyebrow: "Lieber anrufen?", contactHeading: "Erreichen Sie unser Verkaufsteam direkt.",
    },
    trust: {
      blocks: [
        { title: "Ma\u00dfgeschneiderte Gro\u00dfhandelspreise", body: "Jedes Angebot wird speziell f\u00fcr Ihr Bestellvolumen, Ihren Produktmix und Ihren Zielmarkt erstellt. Keine generischen Preislisten." },
        { title: "Globaler Lieferservice", body: "Wir koordinieren Fracht in \u00fcber 30 L\u00e4nder \u00fcber etablierte Logistikpartnerschaften wie Hapag-Lloyd und DB Schenker." },
        { title: "Dedizierte Verkaufsbetreuung", body: "Ein fester Okelcor-Ansprechpartner betreut Ihre Anfrage von der ersten Kontaktaufnahme bis zur best\u00e4tigten Lieferung." },
      ],
      faqEyebrow: "FAQ", faqHeading: "H\u00e4ufige Fragen.",
      faqs: [
        { q: "Wie lange dauert es, ein Angebot zu erhalten?", a: "Unser Team beantwortet alle Angebotsanfragen innerhalb eines Werktages. Bei komplexen oder umfangreichen Anfragen k\u00f6nnen wir innerhalb von 48 Stunden f\u00fcr weitere Details nachfragen." },
        { q: "Kann ich mehrere Reifentypen in einer Anfrage anfordern?", a: "Ja \u2014 w\u00e4hlen Sie \u2018Gemischte Anfrage\u2019 im Reifenkategoriefeld und beschreiben Sie Ihren vollst\u00e4ndigen Bedarf im Anmerkungsfeld. Wir erstellen ein konsolidiertes Angebot f\u00fcr alle Produktlinien." },
        { q: "Liefern Sie international?", a: "Okelcor liefert in \u00fcber 30 L\u00e4nder weltweit. Wir \u00fcbernehmen vollst\u00e4ndige Exportdokumentation, Zollformalit\u00e4ten und Frachtkoordination durch vertrauensw\u00fcrdige Logistikpartner." },
        { q: "Kann ich gebrauchte und neue Reifen gemeinsam anfragen?", a: "Absolut. Viele unserer Kunden kombinieren Premium-Neureifen und Gebrauchtreifen der Klasse A, um ihr Beschaffungsbudget zu optimieren. F\u00fcgen Sie beide Anforderungen in Ihre Anmerkungen ein und wir erstellen ein entsprechendes Angebot." },
      ],
    },
  },
  contact: {
    hero: {
      eyebrow: "Kontakt",
      title: "Sprechen Sie mit uns über Ihre nächste Reifen-Bestellung.",
      subtitle: "Kontaktieren Sie uns für Katalogzugang, Großhandelspreise, Beschaffungssupport und Partnerschaftsanfragen.",
    },
    officeEyebrow: "Unser Büro", officeTagline: "Globale Reifenversorgung — Hauptsitz München",
    infoAddress: "Adresse", infoPhone: "Telefon", infoFax: "Fax", infoEmail: "E-Mail", infoHours: "Geschäftszeiten",
    helpEyebrow: "Womit wir helfen", helpHeading: "Von der Anfrage bis zur Lieferung.",
    helpItems: [
      "Großhandelspreise & Mengenbestellungen",
      "PKW-, LKW-, LT- & Gebrauchtreifen-Beschaffung",
      "Internationale Logistikkoordination",
      "REX-zertifizierte Exportdokumentation",
      "After-Sales-Reklamationen & Support",
    ],
    formEyebrow: "Nachricht senden", formHeading: "Schnellanfrage",
    formTagline: "Füllen Sie das Formular aus und wir melden uns zeitnah bei Ihnen.",
    labelName: "Vollständiger Name", labelEmail: "E-Mail-Adresse", labelSubject: "Betreff", labelInquiry: "Ihre Anfrage",
    placeholderName: "Max Mustermann", placeholderEmail: "max@firma.de",
    placeholderSelect: "Thema auswählen",
    placeholderInquiry: "Beschreiben Sie Ihren Reifenbedarf, Mengen oder stellen Sie Ihre Fragen\u2026",
    topics: ["Großhandelspreise", "Reifenbeschaffung", "Logistik & Versand", "Katalogzugang", "Partnerschaft", "After-Sales-Support", "Sonstiges"],
    sending: "Wird gesendet\u2026", submit: "Nachricht senden",
    responseNote: "Wir antworten in der Regel innerhalb eines Werktages.",
    successTitle: "Nachricht gesendet",
    successBody: "Vielen Dank für Ihre Nachricht. Unser Team wird sich innerhalb eines Werktages bei Ihnen melden.",
    successButton: "Weitere Nachricht senden",
    errName: "Name ist erforderlich", errEmail: "E-Mail ist erforderlich",
    errEmailInvalid: "Geben Sie eine gültige E-Mail-Adresse ein",
    errSubject: "Bitte wählen Sie einen Betreff", errInquiry: "Bitte beschreiben Sie Ihre Anfrage",
    errGeneric: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt an support@okelcor.com.",
    mapEyebrow: "Unser Standort", mapHeading: "Finden Sie uns in München.",
    mapConsentTitle: "Karte erfordert Cookie-Zustimmung",
    mapConsentBody: "Wir verwenden Google Maps, um unseren Standort anzuzeigen. Aktivieren Sie funktionale Cookies, um die Karte zu laden.",
    mapEnableBtn: "Karte aktivieren",
  },
  news: {
    hero: {
      eyebrow: "Neuigkeiten & Einblicke",
      title: "Einblicke, Updates und Wissen zur Reifenversorgung.",
      subtitle: "Bleiben Sie informiert mit praxisnahen Artikeln und Updates für Händler, Partner und internationale Käufer.",
    },
    latestArticles: "Neueste Artikel",
    readArticle: "Artikel lesen", readMore: "Mehr lesen",
    breadcrumbNews: "Neuigkeiten", backToNews: "Zurück zu den Neuigkeiten",
    continueReading: "Weiterlesen", moreFromNews: "Mehr von Okelcor News",
  },
  cta: {
    eyebrow: "Bereit für Okelcor",
    title: "Reifen für Unternehmen. Reifen für Fahrer.",
    subtitle: "Ob Großbestellung für Ihr Unternehmen oder der richtige Reifen für Ihr Auto — Okelcor liefert Qualität, Preise und Support für jeden Käufer.",
    button: "Angebot anfordern",
    button2: "Katalog ansehen",
  },
  whoWeServe: {
    eyebrow: "Für wen wir da sind",
    heading: "Reifen für jeden Käufer.",
    business: {
      label: "Für Unternehmen",
      title: "Großhandel & Großmengen",
      body: "Händler, Großhändler, Flottenoperatoren und Reifenhändler. Wettbewerbsfähige Mengenpreise, internationale Logistik und dedizierter Account-Support.",
      cta: "Großmengen-Angebot anfragen",
    },
    driver: {
      label: "Für Fahrer",
      title: "Qualitätsreifen für Ihr Fahrzeug",
      body: "Einzelne Fahrer und Autobesitzer — finden Sie den richtigen Reifen für Ihr Fahrzeug von vertrauenswürdigen Marken zu wettbewerbsfähigen Preisen.",
      cta: "Katalog ansehen",
    },
  },
  floating: { placeholder: "Fragen zur Reifenversorgung", cta: "Angebot anfordern" },
  newsletter: {
    eyebrow: "Informiert bleiben",
    title: "Reifenmarkt-News & Handelsupdates.",
    subtitle: "Direkt in Ihr Postfach. Jederzeit abmeldbar.",
    placeholder: "ihre@email.de",
    button: "Abonnieren",
    success: "Sie haben abonniert. Vielen Dank!",
  },
  cart: {
    title: "Warenkorb",
    clearAll: "Alle löschen",
    closeCart: "Warenkorb schließen",
    removeItem: "Artikel entfernen",
    decrease: "Verringern",
    increase: "Erhöhen",
    emptyTitle: "Ihr Warenkorb ist leer",
    emptyBody: "Durchsuchen Sie den Katalog und fügen Sie Reifen hinzu.",
    browseCatalogue: "Katalog durchsuchen",
    subtotal: "Zwischensumme",
    item: "Artikel",
    items: "Artikel",
    priceNote: "Preisschätzung · Ohne MwSt. · Versand wird beim Checkout berechnet",
    checkout: "Zur Kasse",
    continueShopping: "Weiter einkaufen",
  },
  auth: {
    panelHeading: "Ihr globaler Reifenlieferpartner.",
    panelSubtitle: "Greifen Sie auf Großhandelspreise zu, verwalten Sie Ihre Bestellungen und bleiben Sie mit Okelcors globalem Versorgungsnetzwerk verbunden.",
    trustPoints: ["Zugang zu Großhandelspreisen und Großbeständen", "Reifenlieferangebote anfordern und verfolgen", "Bestellungen und Lieferkoordination verwalten"],
    copyright: "© 2026 Okelcor GmbH · München, Deutschland",
    tabSignIn: "Anmelden", tabCreateAccount: "Konto erstellen",
    headingSignIn: "Willkommen zurück.", headingSignUp: "Konto erstellen.",
    subtitleSignIn: "Melden Sie sich bei Ihrem Okelcor-Konto an.", subtitleSignUp: "Registrieren Sie sich bei Okelcor und beginnen Sie global Reifen zu beziehen.",
    labelEmail: "E-Mail-Adresse", labelPassword: "Passwort", labelFullName: "Vollständiger Name",
    labelCompanyName: "Unternehmensname", labelConfirmPassword: "Passwort bestätigen",
    placeholderEmail: "max@unternehmen.de", placeholderPassword: "Ihr Passwort",
    placeholderFullName: "Max Mustermann", placeholderCompanyName: "Musterfirma GmbH (optional)",
    placeholderPasswordMin: "Mind. 8 Zeichen", placeholderConfirmPassword: "Passwort wiederholen",
    forgotPassword: "Passwort vergessen?", showPassword: "Passwort anzeigen", hidePassword: "Passwort verbergen",
    signingIn: "Anmelden…", signIn: "Anmelden", creatingAccount: "Konto wird erstellt…", createAccount: "Konto erstellen",
    continueAsGuest: "Als Gast fortfahren", browseCatalogue: "Katalog durchsuchen", or: "oder",
    termsNote: "Mit der Kontoerstellung stimmen Sie unseren", termsNoteAnd: "und",
    termsLabel: "AGB", privacyLabel: "Datenschutzrichtlinie",
    needHelp: "Hilfe benötigt?", contactTeam: "Unser Team kontaktieren",
    signInSuccessTitle: "Willkommen zurück", signInSuccessBody: "Sie sind angemeldet. Backend-Integration folgt bald.",
    signUpSuccessTitle: "Konto erstellt", signUpSuccessBody: "Willkommen bei Okelcor. Backend-Integration folgt bald — Ihr Konto wird bei unserem Go-Live aktiviert.",
    errEmailRequired: "E-Mail ist erforderlich", errEmailInvalid: "Geben Sie eine gültige E-Mail-Adresse ein",
    errPasswordRequired: "Passwort ist erforderlich", errFullNameRequired: "Vollständiger Name ist erforderlich",
    errPasswordMin: "Passwort muss mindestens 8 Zeichen haben",
    errConfirmRequired: "Bitte bestätigen Sie Ihr Passwort", errPasswordMismatch: "Passwörter stimmen nicht überein",
  },
  checkout: {
    breadcrumbHome: "Startseite", breadcrumbShop: "Shop", breadcrumbCheckout: "Kasse",
    orContinueWith: "oder weiter mit",
    sectionDelivery: "Lieferdetails", sectionDeliveryMethod: "Versandmethode",
    labelName: "Vollständiger Name", labelEmail: "E-Mail-Adresse", labelAddress: "Straße und Hausnummer",
    labelCity: "Stadt", labelPostalCode: "Postleitzahl", labelCountry: "Land", labelPhone: "Telefonnummer",
    placeholderName: "Max Mustermann", placeholderEmail: "max@unternehmen.de",
    placeholderAddress: "Musterstraße 1", placeholderCity: "München",
    placeholderPostalCode: "80331", placeholderCountry: "Land auswählen", placeholderPhone: "+49 89 545583 60",
    shippingName: "Internationaler Standardversand", shippingDetail: "5–10 Werktage · Sendungsverfolgung inklusive", shippingFree: "Kostenlos",
    processing: "Wird verarbeitet…", placeOrder: "Bestellung aufgeben",
    placeOrderNote: "Mit Ihrer Bestellung stimmen Sie unseren", placeOrderNoteAnd: "und",
    termsLabel: "AGB", returnPolicyLabel: "Rückgaberichtlinie",
    successTitle: "Bestellanfrage eingegangen",
    successBody: "Unser Team wird Sie innerhalb von 24 Stunden kontaktieren, um Preise, Verfügbarkeit und Lieferung zu bestätigen.",
    orderRef: "Bestellnummer", continueShopping: "Weiter einkaufen", backToHome: "Zur Startseite",
    emptyTitle: "Ihr Warenkorb ist leer", emptyBody: "Fügen Sie Reifen hinzu, bevor Sie zur Kasse gehen.", browseCatalogue: "Katalog durchsuchen",
    errName: "Name ist erforderlich", errEmail: "E-Mail ist erforderlich", errEmailInvalid: "Geben Sie eine gültige E-Mail-Adresse ein",
    errAddress: "Adresse ist erforderlich", errCity: "Stadt ist erforderlich", errPostalCode: "Postleitzahl ist erforderlich",
    errCountry: "Bitte wählen Sie ein Land", errPhone: "Telefonnummer ist erforderlich",
    errCardNumber: "Geben Sie eine gültige Kartennummer ein", errCardExpiry: "MM/JJ eingeben",
    errCardCvv: "CVV eingeben", errCardHolder: "Name des Karteninhabers ist erforderlich",
    summaryTitle: "Bestellübersicht", item: "Artikel", items: "Artikel",
    subtotal: "Zwischensumme (netto)", delivery: "Versand", free: "Kostenlos",
    tax: "MwSt.", taxNote: "MwSt. wird sicher vor der Zahlung berechnet", total: "Gesamt",
    taxDisclaimer: "Endbetrag inkl. MwSt. wird beim Stripe-Checkout bestätigt",
    qty: "Menge", each: "je",
    expressCheckout: "Express-Kasse",
    paymentMethod: "Zahlungsmethode",
    payCardLabel: "Kredit- / Debitkarte", payCardDesc: "Visa, Mastercard, Amex",
    payPaypalLabel: "PayPal", payPaypalDesc: "Über Ihr PayPal-Konto bezahlen",
    payAppleLabel: "Apple Pay", payAppleDesc: "Touch ID oder Face ID",
    payKlarnaLabel: "Klarna", payKlarnaDesc: "Jetzt kaufen, später zahlen",
    payPaypalInfo: "Sie werden zu PayPal weitergeleitet, um Ihre Zahlung sicher abzuschließen.",
    payAppleInfo: "Bezahlen Sie mit Touch ID oder Face ID auf Ihrem Apple-Gerät.",
    payKlarnaInfo: "Teilen Sie Ihre Bestellung in 3 zinsfreie Raten auf. Vorbehaltlich Genehmigung.",
    labelCardNumber: "Kartennummer", labelExpiry: "Ablaufdatum", labelCvv: "CVV", labelHolder: "Name des Karteninhabers",
    placeholderCardNumber: "1234 5678 9012 3456", placeholderExpiry: "MM/JJ",
    placeholderCvv: "123", placeholderHolder: "Name wie auf der Karte angegeben",
  },
  search: {
    placeholder: "Reifen, Marken, Artikel suchen…",
    ariaLabel: "Suche öffnen",
    noResults: "Keine Ergebnisse gefunden",
    noResultsHint: "Versuchen Sie einen Markennamen, eine Reifengröße oder ein Artikelthema",
    productsHeading: "Produkte",
    articlesHeading: "Artikel",
    close: "Suche schließen",
  },
  shop: {
    hero: {
      eyebrow: "Unser Katalog",
      title: "Premium-Reifen für die weltweite Versorgung",
      subtitle: "PKW-, LKW-, OTR- und Gebrauchtreifen von den weltweit vertrauenswürdigsten Marken.",
    },
    catalogue: {
      products: "Produkte", product: "Produkt",
      filtersBtn: "Filter", filtersHeading: "Filter",
      show: "Zeige", results: "Ergebnisse", clearAll: "Alle löschen",
    },
    filter: { tyreType: "Reifentyp", brand: "Marke", season: "Saison" },
    sort: { default: "Standard", priceAsc: "Preis: aufsteigend", priceDesc: "Preis: absteigend" },
    grid: { noProducts: "Keine Produkte gefunden", noProductsHint: "Versuchen Sie, Ihre Filter anzupassen oder zu löschen." },
    card: { shipping: "Zzgl. MwSt. · Kostenloser Versand", viewDetails: "Details ansehen", quote: "Angebot" },
    info: {
      quantity: "Menge", addToCart: "In den Warenkorb", addedToCart: "Im Warenkorb",
      requestQuote: "Angebot anfordern", shipping: "Zzgl. MwSt. · Kostenloser Versand", share: "Teilen",
    },
    accordion: {
      sizePattern: "Größe und Profil", loadSpeed: "Last- / Geschwindigkeitsindex",
      returnPolicy: "Rückgaberecht", disclaimer: "Haftungsausschluss",
      tyreSize: "Reifengröße", width: "Breite", aspectRatio: "Querschnitt",
      rimDiameter: "Felgendurchmesser", construction: "Bauart", constructionVal: "Radial (R)",
      season: "Saison", tyreType: "Reifentyp", brand: "Marke",
      specification: "Spezifikation", loadIndex: "Lastindex", speedIndex: "Geschwindigkeitsindex",
      loadNote: "Der Lastindex gibt das maximale Gewicht an, das jeder Reifen tragen kann. Der Geschwindigkeitsindex gibt die maximale Dauergeschwindigkeit an, für die der Reifen unter Volllastbedingungen ausgelegt ist. Beachten Sie stets die Mindestanforderungen des Fahrzeugherstellers.",
      returnPre: "Okelcor akzeptiert Rücksendungen ungebrauchter, unbeschädigter Reifen in Originalverpackung innerhalb von ",
      returnBold: "14 Tagen",
      returnPost: " nach Lieferung, vorbehaltlich vorheriger schriftlicher Genehmigung.",
      returnP2: "Montierte, gebrauchte oder mit Installationsspuren versehene Reifen sind von der Rückgabe ausgeschlossen. Sonderbestellungen und spezielle Beschaffungsvereinbarungen sind nicht rückgabefähig.",
      returnP3pre: "Um eine Rücksendung einzuleiten, kontaktieren Sie unser Team unter ",
      returnP3post: " mit Ihrer Bestellreferenz und dem Rückgabegrund.",
      disclaimerP1: "Produktspezifikationen, Preise und Verfügbarkeit können sich ohne vorherige Ankündigung ändern. Abgebildete Bilder dienen nur zur Veranschaulichung und entsprechen möglicherweise nicht dem gelieferten Artikel.",
      disclaimerP2: "Es liegt in der Verantwortung des Käufers sicherzustellen, dass die Reifen für die beabsichtigte Anwendung, das Fahrzeug und die gesetzlichen Anforderungen im Bestimmungsland geeignet sind. Okelcor übernimmt keine Haftung für unsachgemäße Montage oder Verwendung außerhalb der angegebenen Spezifikationen.",
      disclaimerP3: "Preise verstehen sich ohne anfallende Steuern und Zölle, sofern nicht anders angegeben. Lieferbedingungen werden zum Zeitpunkt der Auftragsbestätigung vereinbart.",
    },
    related: { eyebrow: "Das könnte Ihnen auch gefallen", heading: "Ähnliche Produkte" },
    productDetails: "Produktdetails",
  },
  fetTeaser: {
    eyebrow: "Auch verfügbar",
    title: "Fuel Echo Tech",
    highlight: "Kraftstoff sparen. Leistung steigern.",
    body: "Das Kraftstoffeffizienzgerät, dem Flottenbetreiber in ganz Europa vertrauen. Bis zu 15% Kraftstoffeinsparung.",
    heroSubtitle: "Kraftstoff sparen, Leistung steigern und Emissionen reduzieren – für alle Fahrzeuge und Flotten.",
    cta: "Mehr erfahren",
  },
  fetMega: {
    badge: "Fuel Echo Tech",
    heading: "Kraftstoff sparen. Motor schützen.",
    benefits: ["Bis zu 13,9% Kraftstoffreduktion", "ISO 9001:2015 zertifiziert", "Amortisation in 3–5 Monaten"],
    learnMore: "Mehr erfahren",
    labelFuelSavings: "Kraftstoffeinsparung",
    labelAnnualSavings: "Jährliche Einsparung",
    labelPayback: "Amortisationszeit",
    requestQuote: "Angebot anfordern",
  },
};

// ─── French ───────────────────────────────────────────────────────────────────

const fr: Translations = {
  nav: {
    home: "Accueil", shop: "Boutique", news: "Actualités", about: "À propos",
    contact: "Contact", quote: "Devis", help: "Aide",
    account: "Compte", language: "Français", back: "Retour", fet: "FET",
  },
  lang: { panelTitle: "Choisir la langue", en: "English", de: "Deutsch", fr: "Français", es: "Español" },
  hero: {
    ctaPrimary: "Nous envoyer votre demande",
    ctaSecondary: "Voir notre catalogue",
  },
  categories: {
    eyebrow: "Notre Gamme",
    heading: "Catégories de pneus pour chaque marché",
    cards: [
      { title: "Pneus PCR", label: "Gamme Tourisme", subtitle: "Confort fiable et performance routière au quotidien" },
      { title: "Pneus PL", label: "Gamme Camion & Bus", subtitle: "Conçu pour la logistique, le kilométrage et la durabilité commerciale" },
      { title: "Pneus Usagés", label: "Approvisionnement économique", subtitle: "Sourcing abordable pour distributeurs et acheteurs à l'export" },
      { title: "Pneus OTR", label: "Gamme Poids Lourds", subtitle: "Pour la construction, l'industrie et les opérations robustes" },
    ],
    orderNow: "Commander",
    learnMore: "En savoir plus",
  },
  why: {
    card1: {
      title: "Pourquoi choisir Okelcor",
      body: "Approvisionnement en pneus premium, logistique fiable et solides relations fournisseurs conçus pour les grossistes et distributeurs.",
      button: "À propos d'Okelcor",
    },
    card2: {
      title: "Approvisionnement de confiance",
      body: "Prix compétitifs, disponibilité constante et vision à long terme de la distribution pour les entreprises de pneus en croissance.",
      button: "Demander un devis",
    },
  },
  logistics: {
    eyebrow: "Approvisionnement mondial fiable",
    title: "Sourcing international et support logistique.",
    body: "Okelcor accompagne grossistes et distributeurs avec un sourcing fiable, une coordination d'expédition et une continuité d'approvisionnement à long terme.",
    getQuote: "Obtenir un devis",
    learnMore: "En savoir plus",
    flexibleSourcing: "Sourcing flexible",
    usedTyres: "Pneus usagés",
    distEyebrow: "Support Distribution",
    distTitle: "Planification d'approvisionnement qui aide les partenaires à grandir.",
    distBody: "De la sélection des produits à la coordination des livraisons, Okelcor soutient un sourcing efficace pour les entreprises en croissance.",
    talkToSales: "Parler aux ventes",
  },
  used: {
    eyebrow: "Pneus Usagés",
    title: "Approvisionnement en pneus usagés pour les acheteurs mondiaux",
    body: "Pneus usagés et rechapage soigneusement sourcés pour voitures, camions et bus — pour les distributeurs du monde entier.",
    viewCatalogue: "Voir le catalogue",
    requestQuote: "Demander un devis",
  },
  tbr: {
    eyebrow: "Pneus Poids Lourd",
    title: "Pneus PL neufs pour la logistique mondiale",
    body: "Pneus PL de haute qualité pour le transport international. Conçus pour la durabilité, la sécurité et la performance — avec livraison mondiale depuis des marques premium.",
    getQuote: "Obtenir votre devis",
  },
  rex: {
    eyebrow: "Certification",
    title: "Exportateur certifié REX",
    body: "Les clients en Grande-Bretagne, au Canada et au Japon peuvent importer nos pneus en franchise de droits sous notre certification REX, réduisant les coûts à l'importation.",
    regNumber: "Numéro d'enregistrement",
    verify: "Vérifier la certification",
  },
  brands: {
    eyebrow: "Marques mondiales de confiance",
    title: "Approvisionnement auprès de marques auxquelles les acheteurs font déjà confiance.",
    body: "Okelcor s'approvisionne auprès des fabricants de pneus les plus fiables au monde. Notre catalogue couvre les marques leaders en PCR, PL et gammes spéciales.",
    viewCatalogue: "Voir le catalogue",
    exploreSupply: "Explorer l'offre",
    learnMore: "En savoir plus",
    photoLabel: "Sourcing premium",
    photoTitle: "Conçu pour la distribution mondiale de pneus.",
  },
  footer: {
    motto: "Grandir ensemble",
    tagline: "Fournisseur mondial de pneus basé à Munich pour PCR, PL et pneus usagés aux grossistes et distributeurs du monde entier.",
    copyright: "© 2026 Okelcor GmbH. Tous droits réservés.",
    privacy: "Politique de confidentialité",
    terms: "CGV",
    imprint: "Mentions légales",
    col: { products: "Produits", company: "Entreprise", support: "Support" },
    links: {
      shopCatalogue: "Catalogue", pcrTyres: "Pneus PCR", tbrTyres: "Pneus PL",
      usedTyres: "Pneus usagés", requestQuote: "Demander un devis",
      aboutOkelcor: "À propos d'Okelcor", newsInsights: "Actualités & Insights",
      contactUs: "Nous contacter", locations: "Localisations",
      getHelp: "Obtenir de l'aide", rex: "Certification REX",
      wholesale: "Demandes de gros", logistics: "Support logistique",
    },
  },
  about: {
    hero: {
      eyebrow: "À propos d'Okelcor",
      title: "Votre partenaire mondial de confiance pour l'approvisionnement en pneus.",
      subtitle: "Siège à Munich. Fourniture de pneus PCR, PL, LT et usagés premium aux grossistes et distributeurs dans plus de 30 pays.",
    },
    story: {
      eyebrow: "Notre histoire",
      title1: "Basé à Munich.", title2: "Distribué mondialement.",
      p1: "Okelcor a son siège social à Munich et fournit des clients du monde entier en pneus neufs et d'occasion premium — incluant PCR, LT, PL et pneus de bus — des marques les plus fiables au monde.",
      p2: "L'entreprise maintient un catalogue croissant de produits de haute qualité, équilibrant technologie avancée et options économiques pour les acheteurs en gros et les distributeurs internationaux.",
      p3: "Avec plus de 500 000 pneus disponibles chaque jour, Okelcor garantit une tarification transparente, des commandes efficaces et une logistique fiable — une solution d'approvisionnement complète en Allemagne, en Europe et au-delà.",
      workWithUs: "Travailler avec nous",
      statDaily: "Pneus disponibles chaque jour", statCountries: "Pays desservis", statBrands: "Marques premium",
    },
    services: {
      eyebrow: "Ce que nous offrons",
      heading: "Des services adaptés à vos besoins d'approvisionnement.",
      subtitle: "De la première demande à la livraison finale, Okelcor soutient chaque étape de votre processus d'approvisionnement en pneus.",
      items: [
        { eyebrow: "Consultation personnalisée", heading: "Conseils d'experts pour chaque commande.", body: "Notre équipe fournit des conseils personnalisés de sélection de pneus pour PCR, PL, LT et stock usagé. De la spécification à la planification du volume — nous vous aidons à prendre la bonne décision à chaque fois." },
        { eyebrow: "Gestion logistique", heading: "Fret mondial, de bout en bout.", body: "Nous coordonnons les expéditions internationales via des partenariats de fret de confiance incluant Hapag-Lloyd et DB Schenker, garantissant que les pneus atteignent leur destination efficacement et dans les délais." },
        { eyebrow: "Support après-vente", heading: "Un support qui continue après la livraison.", body: "L'équipe après-vente d'Okelcor reste disponible après la livraison pour la gestion des réclamations, le suivi de la documentation et la continuité de l'approvisionnement — pour une confiance totale tout au long du processus." },
      ],
    },
    logistics: {
      eyebrow: "Portée logistique",
      heading: "Des pneus livrés dans chaque coin du monde.",
      body: "Okelcor coordonne la gestion de fret de bout en bout pour les expéditions internationales de pneus, avec suivi complet et support de documentation.",
      partnersEyebrow: "Partenaires de confiance",
      partnersHeading: "Des réseaux construits pour la fiabilité.",
      partnersBody: "De la coordination du fret à la fourniture de marques de pneus, nos partenaires garantissent la qualité et la livraison à chaque étape.",
      categoryOcean: "Fret maritime", categoryLogistics: "Logistique & Transport", categoryBrand: "Partenaire de marque",
    },
  },
  quote: {
    hero: {
      eyebrow: "Demande de devis",
      title: "Demander un devis de fourniture de pneus",
      subtitle: "Dites-nous ce dont vous avez besoin et notre \u00e9quipe pr\u00e9parera un devis personnalis\u00e9 pour votre entreprise.",
    },
    form: {
      eyebrow: "Formulaire de demande de devis", heading: "Dites-nous ce dont vous avez besoin.",
      requiredNote: "Les champs marqu\u00e9s * sont obligatoires.",
      sectionBusiness: "Informations entreprise / client",
      sectionProduct: "Informations sur la demande de produit",
      sectionDelivery: "Détails de livraison",
      labelFullName: "Nom complet", labelCompany: "Nom de l'entreprise", labelEmail: "Adresse e-mail", labelPhone: "Num\u00e9ro de t\u00e9l\u00e9phone",
      labelCountry: "Pays / R\u00e9gion", labelBusiness: "Type d'entreprise",
      labelTyreCategory: "Cat\u00e9gorie de pneus", labelBrand: "Pr\u00e9f\u00e9rence de marque", labelTyreSize: "Taille / Sp\u00e9cification des pneus",
      labelQuantity: "Quantit\u00e9 n\u00e9cessaire", labelBudget: "Fourchette budg\u00e9taire", labelTimeline: "D\u00e9lai de livraison requis",
      labelDeliveryAddress: "Adresse de livraison", labelDeliveryCity: "Ville", labelDeliveryPostalCode: "Code postal",
      labelDelivery: "Lieu / port de livraison pr\u00e9f\u00e9r\u00e9", labelNotes: "Notes suppl\u00e9mentaires / Demande",
      labelUpload: "T\u00e9l\u00e9charger la liste de produits / fiche technique",
      uploadComingSoon: "optionnel \u2014 bient\u00f4t disponible",
      uploadHint: "Glisser-d\u00e9poser ou cliquer pour t\u00e9l\u00e9charger \u2014 PDF, XLS, CSV accept\u00e9s",
      placeholderFullName: "Jean Dupont", placeholderCompany: "Dupont Pneus SARL",
      placeholderEmail: "jean@entreprise.fr", placeholderPhone: "+33 1 00 00 00 00",
      placeholderCountry: "S\u00e9lectionner un pays", placeholderBusiness: "S\u00e9lectionner le type", placeholderCategory: "S\u00e9lectionner la cat\u00e9gorie",
      placeholderBrand: "ex. Michelin, Bridgestone, Indiff\u00e9rent",
      placeholderSize: "ex. 205/55R16 91H ou 295/80R22.5",
      placeholderQuantity: "ex. 500 unit\u00e9s, 2 conteneurs",
      placeholderBudget: "S\u00e9lectionner la fourchette", placeholderTimeline: "S\u00e9lectionner le d\u00e9lai",
      placeholderDeliveryAddress: "Adresse", placeholderDeliveryCity: "Ville", placeholderDeliveryPostalCode: "Code postal",
      placeholderDelivery: "ex. Port de Marseille, Lagos, Duba\u00ef",
      placeholderNotes: "D\u00e9crivez vos besoins en d\u00e9tail \u2014 sp\u00e9cifications des pneus, utilisation pr\u00e9vue, volume et toute autre information pertinente\u2026",
      businessTypes: ["Grossiste", "Distributeur", "D\u00e9taillant", "Gestionnaire de flotte", "Acheteur particulier", "Autre"],
      tyreCategories: ["Pneus PCR", "Pneus PL", "Pneus usag\u00e9s", "Demande mixte"],
      budgetRanges: ["Moins de \u20ac1\u202f000", "\u20ac1\u202f000 \u2013 \u20ac5\u202f000", "\u20ac5\u202f000 \u2013 \u20ac20\u202f000", "\u20ac20\u202f000 \u2013 \u20ac50\u202f000", "\u20ac50\u202f000+", "Pr\u00e9f\u00e8re ne pas dire"],
      timelines: ["D\u00e8s que possible", "Sous 1 semaine", "Sous 1 mois", "Flexible"],
      submitting: "Envoi de la demande\u2026", submit: "Soumettre la demande de devis",
      submitNote: "Nous r\u00e9pondons \u00e0 toutes les demandes dans un d\u00e9lai d'un jour ouvrable. Vos informations sont strictement confidentielles.",
      errFullName: "Le nom complet est requis", errEmail: "L'e-mail est requis", errEmailInvalid: "Entrez une adresse e-mail valide",
      errCountry: "Veuillez s\u00e9lectionner un pays", errCategory: "Veuillez s\u00e9lectionner une cat\u00e9gorie de pneus",
      errQuantity: "La quantit\u00e9 est requise", errDelivery: "Le lieu de livraison est requis",
      errNotes: "Veuillez d\u00e9crire vos besoins",
      errGeneric: "Une erreur s'est produite. Veuillez r\u00e9essayer ou nous contacter directement \u00e0 support@okelcor.com.",
      successTitle: "Demande de devis re\u00e7ue",
      successBody: "Votre demande de devis a \u00e9t\u00e9 re\u00e7ue. Notre \u00e9quipe examinera vos besoins et vous contactera avec un devis personnalis\u00e9 dans un d\u00e9lai d'un jour ouvrable.",
      refLabel: "Num\u00e9ro de r\u00e9f\u00e9rence", refNote: "Veuillez conserver cette r\u00e9f\u00e9rence pour tout suivi avec notre \u00e9quipe.",
      successButton: "Soumettre une autre demande",
    },
    summary: {
      stepsEyebrow: "Ce qui se passe ensuite", stepsHeading: "Rapide, simple et transparent.",
      steps: [
        { title: "Nous examinons votre demande", body: "Notre \u00e9quipe commerciale examine attentivement vos sp\u00e9cifications de pneus, quantit\u00e9s et exigences de livraison." },
        { title: "Nous pr\u00e9parons votre devis", body: "Vous recevez une fiche de prix personnalis\u00e9e dans un d\u00e9lai d'un jour ouvrable, incluant la disponibilit\u00e9 des produits et les co\u00fbts logistiques." },
        { title: "Nous confirmons et exp\u00e9dions", body: "Une fois le devis approuv\u00e9, nous organisons l'approvisionnement, l'emballage et la coordination du fret international." },
      ],
      whyEyebrow: "Pourquoi Okelcor", whyHeading: "Votre partenaire d'approvisionnement direct.",
      whyItems: ["R\u00e9ponse dans un d\u00e9lai d'un jour ouvrable", "Tarification de gros personnalis\u00e9e", "Support logistique international", "Approvisionnement fiable aupr\u00e8s de marques v\u00e9rifi\u00e9es"],
      contactEyebrow: "Pr\u00e9f\u00e9rez-vous appeler\u00a0?", contactHeading: "Contactez directement notre \u00e9quipe commerciale.",
    },
    trust: {
      blocks: [
        { title: "Tarification de gros personnalis\u00e9e", body: "Chaque devis est pr\u00e9par\u00e9 sp\u00e9cifiquement pour votre volume de commande, votre gamme de produits et votre march\u00e9 de destination. Pas de listes de prix g\u00e9n\u00e9riques." },
        { title: "Support de livraison mondial", body: "Nous coordonnons le fret vers plus de 30 pays via des partenariats logistiques \u00e9tablis incluant Hapag-Lloyd et DB Schenker." },
        { title: "Assistance commerciale d\u00e9di\u00e9e", body: "Un contact commercial Okelcor d\u00e9di\u00e9 g\u00e8re votre demande de la premi\u00e8re enqu\u00eate \u00e0 la livraison confirm\u00e9e." },
      ],
      faqEyebrow: "FAQ", faqHeading: "Questions fr\u00e9quentes.",
      faqs: [
        { q: "Combien de temps faut-il pour recevoir un devis\u00a0?", a: "Notre \u00e9quipe s'efforce de r\u00e9pondre \u00e0 toutes les demandes de devis dans un d\u00e9lai d'un jour ouvrable. Pour les demandes complexes ou \u00e0 volume \u00e9lev\u00e9, nous pouvons faire un suivi dans les 48 heures pour des d\u00e9tails suppl\u00e9mentaires." },
        { q: "Puis-je demander plusieurs types de pneus dans un seul devis\u00a0?", a: "Oui \u2014 s\u00e9lectionnez \u2018Demande mixte\u2019 dans le champ Cat\u00e9gorie de pneus et d\u00e9crivez vos besoins complets dans la section notes. Nous pr\u00e9parerons un devis consolid\u00e9 couvrant toutes les gammes de produits." },
        { q: "Proposez-vous la livraison internationale\u00a0?", a: "Okelcor livre dans plus de 30 pays dans le monde. Nous g\u00e9rons toute la documentation d'exportation, les formalit\u00e9s douani\u00e8res et la coordination du fret via des partenaires logistiques de confiance." },
        { q: "Puis-je demander des pneus usag\u00e9s et neufs ensemble\u00a0?", a: "Absolument. Beaucoup de nos clients combinent des pneus neufs premium et des pneus d'occasion de qualit\u00e9 A pour optimiser leur budget d'approvisionnement. Incluez les deux exigences dans vos notes et nous \u00e9tablirons un devis en cons\u00e9quence." },
      ],
    },
  },
  contact: {
    hero: {
      eyebrow: "Contact",
      title: "Parlez-nous de votre prochaine commande de pneus.",
      subtitle: "Contactez-nous pour l'accès au catalogue, les prix de gros, le support d'approvisionnement et les discussions de partenariat.",
    },
    officeEyebrow: "Notre bureau", officeTagline: "Approvisionnement mondial en pneus — Siège à Munich",
    infoAddress: "Adresse", infoPhone: "Téléphone", infoFax: "Fax", infoEmail: "E-mail", infoHours: "Heures d'ouverture",
    helpEyebrow: "Comment nous pouvons aider", helpHeading: "De la demande à la livraison.",
    helpItems: [
      "Prix de gros & commandes en volume",
      "Approvisionnement PCR, PL, LT & pneus usagés",
      "Coordination logistique internationale",
      "Documentation d'exportation certifiée REX",
      "Réclamations après-vente & support",
    ],
    formEyebrow: "Envoyer un message", formHeading: "Demande rapide",
    formTagline: "Remplissez le formulaire et nous vous répondrons rapidement.",
    labelName: "Nom complet", labelEmail: "Adresse e-mail", labelSubject: "Sujet", labelInquiry: "Message de demande",
    placeholderName: "Jean Dupont", placeholderEmail: "jean@entreprise.fr",
    placeholderSelect: "Sélectionner un sujet",
    placeholderInquiry: "Décrivez vos besoins en pneus, volumes ou posez vos questions\u2026",
    topics: ["Prix de gros", "Approvisionnement en pneus", "Logistique & Expédition", "Accès au catalogue", "Partenariat", "Support après-vente", "Autre"],
    sending: "Envoi en cours\u2026", submit: "Envoyer le message",
    responseNote: "Nous répondons généralement dans un délai d'un jour ouvrable.",
    successTitle: "Message envoyé",
    successBody: "Merci de nous avoir contactés. Notre équipe répondra à votre demande dans un délai d'un jour ouvrable.",
    successButton: "Envoyer un autre message",
    errName: "Le nom est requis", errEmail: "L'e-mail est requis",
    errEmailInvalid: "Entrez une adresse e-mail valide",
    errSubject: "Veuillez sélectionner un sujet", errInquiry: "Veuillez décrire votre demande",
    errGeneric: "Une erreur s'est produite. Veuillez réessayer ou nous écrire directement à support@okelcor.com.",
    mapEyebrow: "Notre emplacement", mapHeading: "Trouvez-nous à Munich.",
    mapConsentTitle: "La carte nécessite un consentement aux cookies",
    mapConsentBody: "Nous utilisons Google Maps pour afficher notre emplacement. Activez les cookies fonctionnels pour charger la carte.",
    mapEnableBtn: "Activer la carte",
  },
  news: {
    hero: {
      eyebrow: "Actualités & Insights",
      title: "Insights, mises à jour et connaissances sur l'approvisionnement en pneus.",
      subtitle: "Restez informé avec des articles pratiques et des mises à jour pour les distributeurs, partenaires et acheteurs internationaux.",
    },
    latestArticles: "Derniers articles",
    readArticle: "Lire l'article", readMore: "Lire plus",
    breadcrumbNews: "Actualités", backToNews: "Retour aux actualités",
    continueReading: "Continuer la lecture", moreFromNews: "Plus d'Okelcor News",
  },
  cta: {
    eyebrow: "Prêt à travailler avec Okelcor",
    title: "Des pneus pour les entreprises. Des pneus pour les conducteurs.",
    subtitle: "Que vous ayez besoin d'un approvisionnement en gros ou du bon pneu pour votre voiture — Okelcor propose qualité, prix et support pour chaque acheteur.",
    button: "Demander un devis",
    button2: "Parcourir le catalogue",
  },
  whoWeServe: {
    eyebrow: "Qui nous servons",
    heading: "Des pneus pour chaque acheteur.",
    business: {
      label: "Pour les entreprises",
      title: "Approvisionnement en gros",
      body: "Distributeurs, grossistes, exploitants de flottes et revendeurs de pneus. Tarifs compétitifs en volume, logistique internationale et assistance dédiée.",
      cta: "Demander un devis en gros",
    },
    driver: {
      label: "Pour les conducteurs",
      title: "Des pneus de qualité pour votre véhicule",
      body: "Conducteurs individuels et propriétaires de voiture — trouvez le bon pneu pour votre véhicule parmi les marques mondiales reconnues.",
      cta: "Parcourir le catalogue",
    },
  },
  floating: { placeholder: "Renseignements sur les pneus", cta: "Demander un devis" },
  newsletter: {
    eyebrow: "Restez informé",
    title: "Actualités pneus & mises à jour commerciales.",
    subtitle: "Livré dans votre boîte de réception. Désabonnement à tout moment.",
    placeholder: "votre@email.fr",
    button: "S'abonner",
    success: "Vous êtes abonné. Merci !",
  },
  cart: {
    title: "Panier",
    clearAll: "Tout vider",
    closeCart: "Fermer le panier",
    removeItem: "Supprimer l'article",
    decrease: "Diminuer",
    increase: "Augmenter",
    emptyTitle: "Votre panier est vide",
    emptyBody: "Parcourez le catalogue et ajoutez des pneus pour commencer.",
    browseCatalogue: "Parcourir le catalogue",
    subtotal: "Sous-total",
    item: "article",
    items: "articles",
    priceNote: "Estimation du prix · HT · Frais de port calculés à la caisse",
    checkout: "Passer à la caisse",
    continueShopping: "Continuer les achats",
  },
  auth: {
    panelHeading: "Votre partenaire mondial en fourniture de pneus.",
    panelSubtitle: "Accédez aux tarifs de gros, gérez vos commandes et restez connecté au réseau d'approvisionnement mondial d'Okelcor.",
    trustPoints: ["Accès aux tarifs de gros et aux stocks en volume", "Demander et suivre les devis d'approvisionnement", "Gérer les commandes et la coordination des livraisons"],
    copyright: "© 2026 Okelcor GmbH · Munich, Allemagne",
    tabSignIn: "Se connecter", tabCreateAccount: "Créer un compte",
    headingSignIn: "Bon retour.", headingSignUp: "Créer votre compte.",
    subtitleSignIn: "Connectez-vous à votre compte Okelcor.", subtitleSignUp: "Rejoignez Okelcor et commencez à sourcer des pneus à l'échelle mondiale.",
    labelEmail: "Adresse e-mail", labelPassword: "Mot de passe", labelFullName: "Nom complet",
    labelCompanyName: "Nom de l'entreprise", labelConfirmPassword: "Confirmer le mot de passe",
    placeholderEmail: "jean@entreprise.fr", placeholderPassword: "Votre mot de passe",
    placeholderFullName: "Jean Dupont", placeholderCompanyName: "Entreprise SA (facultatif)",
    placeholderPasswordMin: "Min. 8 caractères", placeholderConfirmPassword: "Répéter votre mot de passe",
    forgotPassword: "Mot de passe oublié ?", showPassword: "Afficher le mot de passe", hidePassword: "Masquer le mot de passe",
    signingIn: "Connexion en cours…", signIn: "Se connecter", creatingAccount: "Création du compte…", createAccount: "Créer un compte",
    continueAsGuest: "Continuer en tant qu'invité", browseCatalogue: "Parcourir le catalogue", or: "ou",
    termsNote: "En créant un compte, vous acceptez nos", termsNoteAnd: "et notre",
    termsLabel: "Conditions générales", privacyLabel: "Politique de confidentialité",
    needHelp: "Besoin d'aide ?", contactTeam: "Contacter notre équipe",
    signInSuccessTitle: "Bon retour", signInSuccessBody: "Vous êtes connecté. Intégration backend bientôt disponible.",
    signUpSuccessTitle: "Compte créé", signUpSuccessBody: "Bienvenue chez Okelcor. Intégration backend bientôt disponible — votre compte sera activé lors du lancement.",
    errEmailRequired: "L'e-mail est obligatoire", errEmailInvalid: "Saisissez une adresse e-mail valide",
    errPasswordRequired: "Le mot de passe est obligatoire", errFullNameRequired: "Le nom complet est obligatoire",
    errPasswordMin: "Le mot de passe doit contenir au moins 8 caractères",
    errConfirmRequired: "Veuillez confirmer votre mot de passe", errPasswordMismatch: "Les mots de passe ne correspondent pas",
  },
  checkout: {
    breadcrumbHome: "Accueil", breadcrumbShop: "Boutique", breadcrumbCheckout: "Caisse",
    orContinueWith: "ou continuer avec",
    sectionDelivery: "Détails de livraison", sectionDeliveryMethod: "Mode de livraison",
    labelName: "Nom complet", labelEmail: "Adresse e-mail", labelAddress: "Adresse postale",
    labelCity: "Ville", labelPostalCode: "Code postal", labelCountry: "Pays", labelPhone: "Numéro de téléphone",
    placeholderName: "Jean Dupont", placeholderEmail: "jean@entreprise.fr",
    placeholderAddress: "1 rue de l'Entrepôt", placeholderCity: "Paris",
    placeholderPostalCode: "75001", placeholderCountry: "Sélectionner un pays", placeholderPhone: "+33 1 23 45 67 89",
    shippingName: "Livraison internationale standard", shippingDetail: "5–10 jours ouvrés · Livraison suivie", shippingFree: "Gratuit",
    processing: "En cours…", placeOrder: "Passer la commande",
    placeOrderNote: "En passant votre commande, vous acceptez nos", placeOrderNoteAnd: "et notre",
    termsLabel: "Conditions générales", returnPolicyLabel: "Politique de retour",
    successTitle: "Demande de commande soumise",
    successBody: "Notre équipe vous contactera dans les 24 heures pour confirmer les prix, la disponibilité et organiser la livraison.",
    orderRef: "Référence de commande", continueShopping: "Continuer les achats", backToHome: "Retour à l'accueil",
    emptyTitle: "Votre panier est vide", emptyBody: "Ajoutez des pneus avant de procéder au paiement.", browseCatalogue: "Parcourir le catalogue",
    errName: "Le nom est obligatoire", errEmail: "L'e-mail est obligatoire", errEmailInvalid: "Saisissez une adresse e-mail valide",
    errAddress: "L'adresse est obligatoire", errCity: "La ville est obligatoire", errPostalCode: "Le code postal est obligatoire",
    errCountry: "Sélectionnez un pays", errPhone: "Le numéro de téléphone est obligatoire",
    errCardNumber: "Saisissez un numéro de carte valide", errCardExpiry: "Saisir MM/AA",
    errCardCvv: "Saisir le CVV", errCardHolder: "Le nom du titulaire est obligatoire",
    summaryTitle: "Récapitulatif de commande", item: "article", items: "articles",
    subtotal: "Sous-total (HT)", delivery: "Livraison", free: "Gratuit",
    tax: "TVA", taxNote: "TVA calculée de manière sécurisée avant paiement", total: "Total",
    taxDisclaimer: "Montant TTC confirmé lors du paiement Stripe",
    qty: "Qté", each: "l'unité",
    expressCheckout: "Paiement express",
    paymentMethod: "Mode de paiement",
    payCardLabel: "Carte de crédit / débit", payCardDesc: "Visa, Mastercard, Amex",
    payPaypalLabel: "PayPal", payPaypalDesc: "Payer via votre compte PayPal",
    payAppleLabel: "Apple Pay", payAppleDesc: "Touch ID ou Face ID",
    payKlarnaLabel: "Klarna", payKlarnaDesc: "Achetez maintenant, payez plus tard",
    payPaypalInfo: "Vous serez redirigé vers PayPal pour finaliser votre paiement en toute sécurité.",
    payAppleInfo: "Finalisez votre paiement avec Touch ID ou Face ID sur votre appareil Apple.",
    payKlarnaInfo: "Divisez votre commande en 3 versements sans intérêts. Sous réserve d'approbation.",
    labelCardNumber: "Numéro de carte", labelExpiry: "Date d'expiration", labelCvv: "CVV", labelHolder: "Nom du titulaire",
    placeholderCardNumber: "1234 5678 9012 3456", placeholderExpiry: "MM/AA",
    placeholderCvv: "123", placeholderHolder: "Nom tel qu'il apparaît sur la carte",
  },
  search: {
    placeholder: "Rechercher pneus, marques, articles…",
    ariaLabel: "Ouvrir la recherche",
    noResults: "Aucun résultat trouvé",
    noResultsHint: "Essayez un nom de marque, une taille de pneu ou un sujet d'article",
    productsHeading: "Produits",
    articlesHeading: "Articles",
    close: "Fermer la recherche",
  },
  shop: {
    hero: {
      eyebrow: "Notre Catalogue",
      title: "Pneus Premium pour l'Approvisionnement Mondial",
      subtitle: "Pneus PCR, PL, OTR et usagés des marques les plus fiables au monde.",
    },
    catalogue: {
      products: "produits", product: "produit",
      filtersBtn: "Filtres", filtersHeading: "Filtres",
      show: "Afficher", results: "résultats", clearAll: "Tout effacer",
    },
    filter: { tyreType: "Type de pneu", brand: "Marque", season: "Saison" },
    sort: { default: "Par défaut", priceAsc: "Prix : croissant", priceDesc: "Prix : décroissant" },
    grid: { noProducts: "Aucun produit trouvé", noProductsHint: "Essayez d'ajuster ou d'effacer vos filtres." },
    card: { shipping: "HT · Livraison gratuite", viewDetails: "Voir les détails", quote: "Devis" },
    info: {
      quantity: "Quantité", addToCart: "Ajouter au panier", addedToCart: "Ajouté au panier",
      requestQuote: "Demander un devis", shipping: "Hors taxes · Livraison gratuite", share: "Partager",
    },
    accordion: {
      sizePattern: "Taille et Profil", loadSpeed: "Indice de charge / vitesse",
      returnPolicy: "Politique de retour", disclaimer: "Avertissement",
      tyreSize: "Taille du pneu", width: "Largeur", aspectRatio: "Rapport d'aspect",
      rimDiameter: "Diamètre de jante", construction: "Construction", constructionVal: "Radiale (R)",
      season: "Saison", tyreType: "Type de pneu", brand: "Marque",
      specification: "Spécification", loadIndex: "Indice de charge", speedIndex: "Indice de vitesse",
      loadNote: "L'indice de charge indique le poids maximal que chaque pneu peut supporter. L'indice de vitesse indique la vitesse maximale soutenue pour laquelle le pneu est homologué en conditions de pleine charge. Respectez toujours les exigences minimales du fabricant du véhicule.",
      returnPre: "Okelcor accepte les retours de pneus non utilisés et non endommagés dans leur emballage d'origine dans un délai de ",
      returnBold: "14 jours",
      returnPost: " après livraison, sous réserve d'autorisation écrite préalable.",
      returnP2: "Les pneus montés, utilisés ou présentant des signes d'installation ne sont pas éligibles au retour. Les commandes personnalisées et les arrangements de sourcing spéciaux ne sont pas remboursables.",
      returnP3pre: "Pour initier un retour, contactez notre équipe à ",
      returnP3post: " avec votre référence de commande et le motif du retour.",
      disclaimerP1: "Les spécifications des produits, les prix et la disponibilité sont susceptibles de changer sans préavis. Les images affichées sont à titre illustratif uniquement et peuvent ne pas représenter l'article exact fourni.",
      disclaimerP2: "Il est de la responsabilité de l'acheteur de s'assurer que les pneus sont adaptés à l'application prévue, au véhicule et aux exigences légales dans le pays de destination. Okelcor n'accepte aucune responsabilité pour une installation incorrecte ou une utilisation en dehors des spécifications nominales.",
      disclaimerP3: "Les prix sont indiqués hors taxes et droits applicables, sauf indication contraire. Les conditions d'expédition sont convenues au moment de la confirmation de commande.",
    },
    related: { eyebrow: "Vous pourriez aussi aimer", heading: "Produits similaires" },
    productDetails: "Détails du produit",
  },
  fetTeaser: {
    eyebrow: "Aussi disponible",
    title: "Fuel Echo Tech",
    highlight: "Économisez du carburant. Améliorez les performances.",
    body: "Le dispositif d'efficacité énergétique approuvé par les gestionnaires de flotte à travers l'Europe. Jusqu'à 15% d'économie de carburant.",
    heroSubtitle: "Économisez du carburant, améliorez les performances et réduisez les émissions pour tout véhicule ou flotte.",
    cta: "En savoir plus",
  },
  fetMega: {
    badge: "Fuel Echo Tech",
    heading: "Économisez du carburant. Protégez votre moteur.",
    benefits: ["Jusqu'à 13,9% de réduction de carburant", "Certifié ISO 9001:2015", "Remboursement en 3–5 mois"],
    learnMore: "En savoir plus",
    labelFuelSavings: "Économies de carburant",
    labelAnnualSavings: "Économies annuelles",
    labelPayback: "Période de remboursement",
    requestQuote: "Demander un devis",
  },
};

// ─── Spanish ──────────────────────────────────────────────────────────────────

const es: Translations = {
  nav: {
    home: "Inicio", shop: "Tienda", news: "Noticias", about: "Nosotros",
    contact: "Contacto", quote: "Cotización", help: "Ayuda",
    account: "Cuenta", language: "Español", back: "Volver", fet: "FET",
  },
  lang: { panelTitle: "Seleccionar idioma", en: "English", de: "Deutsch", fr: "Français", es: "Español" },
  hero: {
    ctaPrimary: "Solicitar Cotización",
    ctaSecondary: "Ver Catálogo",
  },
  categories: {
    eyebrow: "Nuestra Gama",
    heading: "Categorías de neumáticos para cada mercado",
    cards: [
      { title: "Neumáticos PCR", label: "Gama de Turismos", subtitle: "Confort fiable y rendimiento en carretera cotidiano" },
      { title: "Neumáticos TBR", label: "Gama Camión y Autobús", subtitle: "Diseñados para logística, kilometraje y durabilidad comercial" },
      { title: "Neumáticos Usados", label: "Suministro Económico", subtitle: "Abastecimiento asequible para distribuidores y compradores de exportación" },
      { title: "Neumáticos OTR", label: "Gama de Alta Resistencia", subtitle: "Para construcción, industria y operaciones en terreno difícil" },
    ],
    orderNow: "Pedir Ahora",
    learnMore: "Más Información",
  },
  why: {
    card1: {
      title: "Por Qué Elegir Okelcor",
      body: "Abastecimiento premium de neumáticos, logística confiable y marcas reconocidas — al servicio de distribuidores, minoristas y compradores individuales en todo el mundo.",
      button: "Sobre Okelcor",
    },
    card2: {
      title: "Suministro de Confianza",
      body: "Precios competitivos, disponibilidad constante y opciones flexibles para empresas en crecimiento y conductores del día a día.",
      button: "Solicitar Cotización",
    },
  },
  logistics: {
    eyebrow: "Suministro Global Confiable",
    title: "Abastecimiento internacional y apoyo logístico.",
    body: "Okelcor apoya a mayoristas y distribuidores con abastecimiento fiable, coordinación de envíos y continuidad de suministro a largo plazo.",
    getQuote: "Cotizar",
    learnMore: "Más Información",
    flexibleSourcing: "Abastecimiento flexible",
    usedTyres: "Neumáticos Usados",
    distEyebrow: "Apoyo a la Distribución",
    distTitle: "Planificación de suministro que ayuda a los socios a crecer.",
    distBody: "Desde la selección de productos hasta la coordinación de entregas, Okelcor apoya el abastecimiento eficiente de neumáticos para empresas en crecimiento.",
    talkToSales: "Hablar con Ventas",
  },
  used: {
    eyebrow: "Neumáticos Usados",
    title: "Suministro Inteligente de Neumáticos Usados para Compradores Globales",
    body: "Neumáticos usados y aptos para recauchutado cuidadosamente seleccionados para coches, camiones y autobuses — equilibrando fiabilidad, valor y reutilización responsable para distribuidores en todo el mundo.",
    viewCatalogue: "Ver Catálogo",
    requestQuote: "Solicitar Cotización",
  },
  tbr: {
    eyebrow: "Neumáticos TBR",
    title: "Neumáticos de Camión y Autobús para la Logística Global",
    body: "Neumáticos de alta resistencia para operaciones comerciales, flotas de transporte y logística de larga distancia — suministrados por marcas de confianza con entrega internacional.",
    getQuote: "Solicitar Cotización",
  },
  rex: {
    eyebrow: "Certificación REX",
    title: "Exportador Registrado Verificado",
    body: "Okelcor opera bajo el sistema REX de la UE, garantizando exportaciones de neumáticos transparentes, conformes y documentadas a nivel mundial.",
    regNumber: "Número de registro",
    verify: "Verificar Registro",
  },
  brands: {
    eyebrow: "Marcas de Confianza Global",
    title: "Abastecimiento de marcas en las que los compradores ya confían.",
    body: "Okelcor se abastece de los fabricantes de neumáticos más reconocidos del mundo. Nuestro catálogo incluye marcas líderes en PCR, TBR y neumáticos especiales.",
    viewCatalogue: "Ver Catálogo",
    exploreSupply: "Explorar Suministro",
    learnMore: "Más Información",
    photoLabel: "Abastecimiento premium",
    photoTitle: "Diseñado para la distribución global de neumáticos.",
  },
  footer: {
    motto: "Creciendo juntos",
    tagline: "Proveedor global de neumáticos premium para distribuidores, mayoristas y operadores de flotas.",
    copyright: "© 2025 Okelcor. Todos los derechos reservados.",
    privacy: "Privacidad",
    terms: "Términos",
    imprint: "Aviso Legal",
    col: { products: "Productos", company: "Empresa", support: "Soporte" },
    links: {
      shopCatalogue: "Catálogo", pcrTyres: "Neumáticos PCR", tbrTyres: "Neumáticos TBR",
      usedTyres: "Neumáticos Usados", requestQuote: "Solicitar Cotización",
      aboutOkelcor: "Sobre Okelcor", newsInsights: "Noticias e Información",
      contactUs: "Contáctenos", locations: "Ubicaciones",
      getHelp: "Obtener Ayuda", rex: "Certificación REX",
      wholesale: "Mayoristas", logistics: "Logística",
    },
  },
  about: {
    hero: {
      eyebrow: "Sobre Okelcor",
      title: "Su proveedor global de neumáticos de confianza.",
      subtitle: "Con sede en Múnich. Suministramos neumáticos PCR, TBR, LT y usados premium a mayoristas y distribuidores en más de 30 países.",
    },
    story: {
      eyebrow: "Nuestra Historia",
      title1: "Con sede en Múnich.", title2: "Distribución global.",
      p1: "Okelcor tiene su sede en Múnich y suministra a clientes de todo el mundo neumáticos nuevos y usados premium, incluyendo PCR, LT, TBR y de autobús, de las marcas más reconocidas del mundo.",
      p2: "La empresa mantiene un catálogo creciente de productos de alta calidad, equilibrando tecnología avanzada con opciones rentables para compradores mayoristas y distribuidores internacionales.",
      p3: "Con más de 500.000 neumáticos disponibles diariamente, Okelcor garantiza precios transparentes, pedidos eficientes y logística fiable — una solución completa de suministro en Alemania, Europa y más allá.",
      workWithUs: "Trabajar con Nosotros",
      statDaily: "Neumáticos disponibles diariamente", statCountries: "Países abastecidos", statBrands: "Marcas premium",
    },
    services: {
      eyebrow: "Lo Que Ofrecemos",
      heading: "Servicios adaptados a sus necesidades de suministro.",
      subtitle: "Desde la consulta inicial hasta la entrega final, Okelcor apoya cada etapa de su abastecimiento de neumáticos.",
      items: [
        { eyebrow: "Consulta Personalizada", heading: "Asesoramiento experto para cada pedido.", body: "Nuestro equipo ofrece asesoría personalizada para la selección de neumáticos PCR, TBR, LT y usados. Desde la especificación hasta la planificación de volumen, le ayudamos a tomar la decisión correcta cada vez." },
        { eyebrow: "Gestión Logística", heading: "Carga global, de principio a fin.", body: "Coordinamos el envío internacional a través de asociaciones logísticas de confianza como Hapag-Lloyd y DB Schenker, garantizando que los neumáticos lleguen a su destino de forma eficiente y puntual." },
        { eyebrow: "Soporte Posventa", heading: "Asistencia que continúa tras la entrega.", body: "El equipo de posventa de Okelcor está disponible después de la entrega para gestión de reclamaciones, tramitación de documentación y continuidad del suministro — total tranquilidad durante todo el proceso." },
      ],
    },
    logistics: {
      eyebrow: "Alcance Logístico",
      heading: "Neumáticos entregados a cualquier rincón del mundo.",
      body: "Okelcor coordina la gestión integral de fletes para envíos internacionales de neumáticos con seguimiento completo y soporte de documentación.",
      partnersEyebrow: "Socios de Confianza",
      partnersHeading: "Redes para la fiabilidad.",
      partnersBody: "Desde la coordinación de fletes hasta el suministro de marcas, nuestros socios garantizan calidad y entrega en cada paso.",
      categoryOcean: "Flete Marítimo", categoryLogistics: "Logística y Transporte", categoryBrand: "Socios de Marca",
    },
  },
  quote: {
    hero: {
      eyebrow: "Solicitud de Cotización",
      title: "Solicitar cotización de suministro de neumáticos",
      subtitle: "Comparta sus necesidades y nuestro equipo le enviará una propuesta personalizada.",
    },
    form: {
      eyebrow: "Formulario de Cotización", heading: "Cuéntenos sobre su necesidad.",
      requiredNote: "Los campos marcados con * son obligatorios.",
      sectionBusiness: "Información del negocio / cliente",
      sectionProduct: "Información del producto solicitado",
      sectionDelivery: "Detalles de entrega",
      labelFullName: "Nombre completo", labelCompany: "Nombre de empresa", labelEmail: "Correo electrónico", labelPhone: "Número de teléfono",
      labelCountry: "País / Región", labelBusiness: "Tipo de negocio",
      labelTyreCategory: "Categoría de neumático", labelBrand: "Preferencia de marca", labelTyreSize: "Tamaño / Especificación del neumático",
      labelQuantity: "Cantidad requerida", labelBudget: "Rango de presupuesto", labelTimeline: "Plazo de entrega deseado",
      labelDeliveryAddress: "Dirección de entrega", labelDeliveryCity: "Ciudad", labelDeliveryPostalCode: "Código postal",
      labelDelivery: "Lugar / puerto de entrega preferido", labelNotes: "Notas adicionales / Consulta",
      labelUpload: "Subir lista de productos / hoja de especificaciones",
      uploadComingSoon: "opcional — próximamente disponible",
      uploadHint: "Arrastrar y soltar o hacer clic — se aceptan PDF, XLS, CSV",
      placeholderFullName: "Juan García", placeholderCompany: "Empresa S.L.",
      placeholderEmail: "juan@empresa.es", placeholderPhone: "+34 91 000 0000",
      placeholderCountry: "Seleccionar país", placeholderBusiness: "Seleccionar tipo", placeholderCategory: "Seleccionar categoría",
      placeholderBrand: "p.ej. Michelin, Bridgestone, Sin preferencia",
      placeholderSize: "p.ej. 205/55R16 91H o 295/80R22.5",
      placeholderQuantity: "p.ej. 500 unidades, 2 contenedores",
      placeholderBudget: "Seleccionar rango", placeholderTimeline: "Seleccionar plazo",
      placeholderDeliveryAddress: "Dirección", placeholderDeliveryCity: "Ciudad", placeholderDeliveryPostalCode: "Código postal",
      placeholderDelivery: "p.ej. Puerto de Valencia, Lagos, Dubái",
      placeholderNotes: "Describa su necesidad en detalle — especificaciones del neumático, uso previsto, cantidad y cualquier otra información relevante…",
      businessTypes: ["Mayorista", "Distribuidor", "Minorista", "Empresa de flota", "Comprador particular", "Otro"],
      tyreCategories: ["Neumáticos PCR", "Neumáticos TBR", "Neumáticos usados", "Consulta mixta"],
      budgetRanges: ["Menos de €1.000", "€1.000 – €5.000", "€5.000 – €20.000", "€20.000 – €50.000", "€50.000+", "Prefiero no indicarlo"],
      timelines: ["Lo antes posible", "En 1 semana", "En 1 mes", "Flexible"],
      submitting: "Enviando solicitud…", submit: "Enviar solicitud de cotización",
      submitNote: "Respondemos a todas las consultas en un día laborable. Sus datos se tratarán con total confidencialidad.",
      errFullName: "El nombre completo es obligatorio", errEmail: "El correo electrónico es obligatorio", errEmailInvalid: "Introduzca un correo electrónico válido",
      errCountry: "Por favor seleccione un país", errCategory: "Por favor seleccione una categoría de neumático",
      errQuantity: "La cantidad es obligatoria", errDelivery: "El lugar de entrega es obligatorio",
      errNotes: "Por favor describa su necesidad",
      errGeneric: "Algo salió mal. Inténtelo de nuevo o contáctenos directamente en support@okelcor.com.",
      successTitle: "Solicitud de cotización recibida",
      successBody: "Su solicitud de cotización ha sido recibida. Nuestro equipo revisará sus necesidades y le enviará una propuesta personalizada en un día laborable.",
      refLabel: "Número de referencia", refNote: "Conserve esta referencia para cualquier consulta con nuestro equipo.",
      successButton: "Enviar otra solicitud",
    },
    summary: {
      stepsEyebrow: "Qué ocurre a continuación", stepsHeading: "Rápido, sencillo y transparente.",
      steps: [
        { title: "Revisamos su solicitud", body: "Nuestro equipo de ventas revisa cuidadosamente sus especificaciones de neumáticos, cantidades y requisitos de entrega." },
        { title: "Preparamos su oferta", body: "Recibirá una lista de precios personalizada con disponibilidad de productos y costes logísticos en un día laborable." },
        { title: "Confirmamos y enviamos", body: "Una vez aceptada la oferta, organizamos el abastecimiento, el embalaje y la coordinación del flete internacional." },
      ],
      whyEyebrow: "Por qué Okelcor", whyHeading: "Su socio de suministro directo.",
      whyItems: ["Respuesta en un día laborable", "Precios mayoristas personalizados", "Soporte logístico internacional", "Suministro fiable de marcas verificadas"],
      contactEyebrow: "¿Prefiere llamar?", contactHeading: "Contacte directamente con nuestro equipo de ventas.",
    },
    trust: {
      blocks: [
        { title: "Precios Mayoristas Personalizados", body: "Cada oferta se elabora específicamente para su volumen de pedido, combinación de productos y mercado objetivo. Sin listas de precios genéricas." },
        { title: "Servicio de Entrega Global", body: "Coordinamos flete a más de 30 países a través de asociaciones logísticas establecidas como Hapag-Lloyd y DB Schenker." },
        { title: "Atención de Ventas Dedicada", body: "Un representante fijo de Okelcor gestiona su consulta desde el primer contacto hasta la entrega confirmada." },
      ],
      faqEyebrow: "Preguntas Frecuentes", faqHeading: "Preguntas habituales.",
      faqs: [
        { q: "¿Cuánto tarda en recibir una cotización?", a: "Nuestro equipo responde a todas las solicitudes de cotización en un día laborable. Para consultas complejas o de gran volumen, podemos solicitar más detalles en un plazo de 48 horas." },
        { q: "¿Puedo solicitar varios tipos de neumáticos en una misma solicitud?", a: "Sí — seleccione 'Consulta mixta' en el campo de categoría de neumático y describa sus necesidades completas en el campo de notas. Prepararemos una oferta consolidada para todas las líneas de producto." },
        { q: "¿Realizan entregas internacionales?", a: "Okelcor realiza entregas a más de 30 países de todo el mundo. Gestionamos la documentación de exportación completa, trámites aduaneros y coordinación de flete a través de socios logísticos de confianza." },
        { q: "¿Puedo solicitar neumáticos usados y nuevos juntos?", a: "Por supuesto. Muchos de nuestros clientes combinan neumáticos nuevos premium y neumáticos usados de clase A para optimizar su presupuesto de abastecimiento. Incluya ambos requisitos en sus notas y prepararemos una oferta conjunta." },
      ],
    },
  },
  contact: {
    hero: {
      eyebrow: "Contacto",
      title: "Hable con nosotros sobre su próximo pedido de neumáticos.",
      subtitle: "Contáctenos para acceso al catálogo, precios mayoristas, soporte de abastecimiento y consultas de asociación.",
    },
    officeEyebrow: "Nuestra Oficina", officeTagline: "Suministro global de neumáticos — Sede en Múnich",
    infoAddress: "Dirección", infoPhone: "Teléfono", infoFax: "Fax", infoEmail: "Correo electrónico", infoHours: "Horario de atención",
    helpEyebrow: "En qué podemos ayudar", helpHeading: "De la consulta a la entrega.",
    helpItems: [
      "Precios mayoristas y pedidos por volumen",
      "Abastecimiento de neumáticos PCR, TBR, LT y usados",
      "Coordinación logística internacional",
      "Documentación de exportación con certificación REX",
      "Reclamaciones posventa y soporte",
    ],
    formEyebrow: "Enviar Mensaje", formHeading: "Consulta Rápida",
    formTagline: "Rellene el formulario y nos pondremos en contacto con usted a la brevedad.",
    labelName: "Nombre completo", labelEmail: "Correo electrónico", labelSubject: "Asunto", labelInquiry: "Su consulta",
    placeholderName: "Juan García", placeholderEmail: "juan@empresa.es",
    placeholderSelect: "Seleccionar tema",
    placeholderInquiry: "Describa su necesidad de neumáticos, cantidades o haga sus preguntas…",
    topics: ["Precios mayoristas", "Abastecimiento de neumáticos", "Logística y envío", "Acceso al catálogo", "Asociación", "Soporte posventa", "Otro"],
    sending: "Enviando…", submit: "Enviar mensaje",
    responseNote: "Respondemos a todos los mensajes en un día laborable.",
    successTitle: "Mensaje enviado",
    successBody: "Gracias por su mensaje. Nuestro equipo se pondrá en contacto en breve.",
    successButton: "Enviar otro mensaje",
    errName: "El nombre es obligatorio", errEmail: "El correo electrónico es obligatorio",
    errEmailInvalid: "Introduzca un correo electrónico válido", errSubject: "El asunto es obligatorio",
    errInquiry: "Por favor describa su consulta", errGeneric: "Algo salió mal. Inténtelo de nuevo.",
    mapEyebrow: "Encuéntrenos", mapHeading: "Nuestra ubicación",
    mapConsentTitle: "Ver mapa interactivo",
    mapConsentBody: "Al activar el mapa, Google Maps cargará y procesará datos de acuerdo con su política de privacidad.",
    mapEnableBtn: "Activar mapa",
  },
  news: {
    hero: { eyebrow: "Noticias e Información", title: "Perspectivas del sector del neumático.", subtitle: "Últimas noticias, tendencias y actualizaciones del mercado global de neumáticos." },
    latestArticles: "Últimos artículos",
    readArticle: "Leer artículo", readMore: "Leer más",
    breadcrumbNews: "Noticias", backToNews: "Volver a noticias",
    continueReading: "Continuar leyendo", moreFromNews: "Más noticias",
  },
  cta: {
    eyebrow: "Trabajar con Okelcor",
    title: "¿Listo para hacer su pedido de neumáticos?",
    subtitle: "Consiga precios mayoristas, apoyo logístico y entrega global para su próximo pedido de neumáticos.",
    button: "Solicitar Cotización",
    button2: "Ver Catálogo",
  },
  floating: { placeholder: "Pregunte sobre neumáticos o precios…", cta: "Solicitar Cotización" },
  newsletter: {
    eyebrow: "Noticias del sector",
    title: "Manténgase informado sobre el mercado de neumáticos",
    subtitle: "Reciba actualizaciones sobre nuevos productos, tendencias del mercado y noticias del sector de Okelcor.",
    placeholder: "Su correo electrónico",
    button: "Suscribirse",
    success: "¡Suscrito! Gracias por unirse a nuestra lista.",
  },
  cart: {
    title: "Su carrito",
    clearAll: "Vaciar todo",
    closeCart: "Cerrar carrito",
    removeItem: "Eliminar artículo",
    decrease: "Disminuir cantidad",
    increase: "Aumentar cantidad",
    emptyTitle: "Su carrito está vacío",
    emptyBody: "Explore nuestro catálogo de neumáticos y añada artículos a su carrito.",
    browseCatalogue: "Ver catálogo",
    subtotal: "Subtotal",
    item: "artículo",
    items: "artículos",
    priceNote: "Precios sin IVA. Los gastos de envío se calculan al tramitar el pedido.",
    checkout: "Tramitar pedido",
    continueShopping: "Seguir comprando",
  },
  auth: {
    panelHeading: "Bienvenido a Okelcor", panelSubtitle: "Acceda a precios mayoristas exclusivos, historial de pedidos y soporte prioritario.", trustPoints: ["Precios mayoristas exclusivos", "Gestión sencilla de pedidos", "Asistencia dedicada al cliente"], copyright: "© 2025 Okelcor. Todos los derechos reservados.",
    tabSignIn: "Iniciar sesión", tabCreateAccount: "Crear cuenta",
    headingSignIn: "Iniciar sesión", headingSignUp: "Crear cuenta",
    subtitleSignIn: "Acceda a su cuenta Okelcor", subtitleSignUp: "Únase a la red de distribuidores de Okelcor",
    labelEmail: "Correo electrónico", labelPassword: "Contraseña", labelFullName: "Nombre completo",
    labelCompanyName: "Nombre de empresa", labelConfirmPassword: "Confirmar contraseña",
    placeholderEmail: "correo@empresa.es", placeholderPassword: "Su contraseña", placeholderFullName: "Juan García",
    placeholderCompanyName: "Empresa S.L.", placeholderPasswordMin: "Mínimo 8 caracteres", placeholderConfirmPassword: "Repetir contraseña",
    forgotPassword: "¿Olvidó su contraseña?", showPassword: "Mostrar contraseña", hidePassword: "Ocultar contraseña",
    signingIn: "Iniciando sesión…", signIn: "Iniciar sesión", creatingAccount: "Creando cuenta…", createAccount: "Crear cuenta",
    continueAsGuest: "Continuar como invitado", browseCatalogue: "Ver catálogo", or: "o",
    termsNote: "Al crear una cuenta, acepta los ", termsNoteAnd: " y la ", termsLabel: "Términos de uso", privacyLabel: "Política de privacidad",
    needHelp: "¿Necesita ayuda?", contactTeam: "Contactar con el equipo",
    signInSuccessTitle: "Sesión iniciada", signInSuccessBody: "Bienvenido de nuevo a Okelcor.",
    signUpSuccessTitle: "Cuenta creada", signUpSuccessBody: "Su cuenta ha sido creada. Bienvenido a Okelcor.",
    errEmailRequired: "El correo electrónico es obligatorio", errEmailInvalid: "Introduzca un correo electrónico válido", errPasswordRequired: "La contraseña es obligatoria",
    errFullNameRequired: "El nombre completo es obligatorio", errPasswordMin: "La contraseña debe tener al menos 8 caracteres",
    errConfirmRequired: "Por favor confirme su contraseña", errPasswordMismatch: "Las contraseñas no coinciden",
  },
  checkout: {
    breadcrumbHome: "Inicio", breadcrumbShop: "Tienda", breadcrumbCheckout: "Tramitar pedido",
    orContinueWith: "o continuar con",
    sectionDelivery: "Información de entrega", sectionDeliveryMethod: "Método de entrega",
    labelName: "Nombre completo", labelEmail: "Correo electrónico", labelAddress: "Dirección",
    labelCity: "Ciudad", labelPostalCode: "Código postal", labelCountry: "País", labelPhone: "Teléfono",
    placeholderName: "Juan García", placeholderEmail: "juan@empresa.es", placeholderAddress: "Calle y número",
    placeholderCity: "Ciudad", placeholderPostalCode: "Código postal",
    placeholderCountry: "Seleccionar país", placeholderPhone: "+34 91 000 0000",
    shippingName: "Envío estándar", shippingDetail: "5–10 días laborables", shippingFree: "Gratis",
    processing: "Procesando…", placeOrder: "Realizar pedido",
    placeOrderNote: "Al realizar el pedido, acepta nuestros ", placeOrderNoteAnd: " y la ", termsLabel: "Términos de uso", returnPolicyLabel: "Política de devoluciones",
    successTitle: "¡Pedido realizado!", successBody: "Gracias por su pedido. Le enviaremos la confirmación por correo.", orderRef: "Referencia de pedido",
    continueShopping: "Seguir comprando", backToHome: "Volver al inicio",
    emptyTitle: "Su carrito está vacío", emptyBody: "Añada productos antes de tramitar el pedido.", browseCatalogue: "Ver catálogo",
    errName: "El nombre es obligatorio", errEmail: "El correo electrónico es obligatorio", errEmailInvalid: "Correo electrónico inválido", errAddress: "La dirección es obligatoria",
    errCity: "La ciudad es obligatoria", errPostalCode: "El código postal es obligatorio", errCountry: "El país es obligatorio", errPhone: "El teléfono es obligatorio",
    errCardNumber: "El número de tarjeta es obligatorio", errCardExpiry: "La fecha de vencimiento es obligatoria", errCardCvv: "El CVV es obligatorio", errCardHolder: "El nombre del titular es obligatorio",
    summaryTitle: "Resumen del pedido", item: "artículo", items: "artículos",
    subtotal: "Subtotal (neto)", delivery: "Envío", free: "Gratis",
    tax: "IVA", taxNote: "IVA calculado de forma segura antes del pago", total: "Total", taxDisclaimer: "Importe total con IVA confirmado en Stripe Checkout",
    qty: "Cant.", each: "c/u",
    expressCheckout: "Pago rápido",
    paymentMethod: "Método de pago",
    payCardLabel: "Tarjeta de crédito / débito", payCardDesc: "Visa, Mastercard, Amex",
    payPaypalLabel: "PayPal", payPaypalDesc: "Pague con su cuenta PayPal",
    payAppleLabel: "Apple Pay", payAppleDesc: "Pago rápido con Apple Pay",
    payKlarnaLabel: "Klarna", payKlarnaDesc: "Compre ahora, pague después",
    payPaypalInfo: "Será redirigido a PayPal para completar el pago.",
    payAppleInfo: "Use Face ID o Touch ID para pagar al instante.",
    payKlarnaInfo: "Financiamiento flexible disponible con Klarna.",
    labelCardNumber: "Número de tarjeta", labelExpiry: "Vencimiento", labelCvv: "CVV", labelHolder: "Nombre del titular",
    placeholderCardNumber: "1234 5678 9012 3456", placeholderExpiry: "MM/AA",
    placeholderCvv: "123", placeholderHolder: "Juan García",
  },
  search: {
    placeholder: "Buscar neumáticos, marcas, tamaños…",
    ariaLabel: "Buscar",
    noResults: "Sin resultados",
    noResultsHint: "Intente con otro término o explore el catálogo.",
    productsHeading: "Productos",
    articlesHeading: "Artículos",
    close: "Cerrar",
  },
  whoWeServe: {
    eyebrow: "A quién servimos",
    heading: "Soluciones para cada comprador",
    business: { label: "Empresas y flotas", title: "Suministro mayorista para distribuidores y flotas", body: "Precios por volumen, abastecimiento flexible y logística fiable para empresas que necesitan neumáticos de forma consistente.", cta: "Solicitar cotización mayorista" },
    driver: { label: "Conductores particulares", title: "Neumáticos de calidad para el día a día", body: "Acceso a marcas premium y neumáticos usados de calidad a precios competitivos para conductores exigentes.", cta: "Ver catálogo" },
  },
  shop: {
    hero: { eyebrow: "Catálogo de Neumáticos", title: "Explore nuestra gama", subtitle: "Neumáticos PCR, TBR y usados de marcas de confianza, disponibles para pedido directo." },
    catalogue: {
      products: "productos", product: "producto",
      filtersBtn: "Filtros", filtersHeading: "Filtrar productos",
      show: "Mostrar", results: "resultados", clearAll: "Limpiar todo",
    },
    filter: { tyreType: "Tipo de neumático", brand: "Marca", season: "Temporada" },
    sort: { default: "Relevancia", priceAsc: "Precio: menor a mayor", priceDesc: "Precio: mayor a menor" },
    grid: { noProducts: "No se encontraron productos", noProductsHint: "Intente ajustar los filtros o busque un término diferente." },
    card: { shipping: "Envío disponible", viewDetails: "Ver detalles", quote: "Cotizar" },
    info: {
      quantity: "Cantidad", addToCart: "Añadir al carrito", addedToCart: "Añadido al carrito",
      requestQuote: "Solicitar cotización", shipping: "Envío disponible", share: "Compartir",
    },
    accordion: {
      sizePattern: "Tamaño y patrón", loadSpeed: "Carga y velocidad",
      returnPolicy: "Política de devoluciones", disclaimer: "Aviso legal",
      tyreSize: "Tamaño del neumático", width: "Anchura", aspectRatio: "Relación de aspecto",
      rimDiameter: "Diámetro de llanta", construction: "Construcción", constructionVal: "Radial",
      season: "Temporada", tyreType: "Tipo de neumático", brand: "Marca",
      specification: "Especificación", loadIndex: "Índice de carga", speedIndex: "Índice de velocidad",
      loadNote: "El índice de carga indica el peso máximo que puede soportar cada neumático. El índice de velocidad indica la velocidad máxima sostenida para la que está homologado el neumático en condiciones de plena carga. Respete siempre los requisitos mínimos del fabricante del vehículo.",
      returnPre: "Okelcor acepta devoluciones de neumáticos no utilizados y sin daños en su embalaje original dentro de los ",
      returnBold: "14 días",
      returnPost: " posteriores a la entrega, previa autorización escrita.",
      returnP2: "Los neumáticos montados, usados o con señales de instalación no son elegibles para devolución. Los pedidos personalizados y los acuerdos de abastecimiento especiales no son reembolsables.",
      returnP3pre: "Para iniciar una devolución, contacte con nuestro equipo en ",
      returnP3post: " con su referencia de pedido y el motivo de la devolución.",
      disclaimerP1: "Las especificaciones del producto, los precios y la disponibilidad están sujetos a cambios sin previo aviso. Las imágenes mostradas son meramente ilustrativas y pueden no representar el artículo exacto suministrado.",
      disclaimerP2: "Es responsabilidad del comprador asegurarse de que los neumáticos son adecuados para la aplicación prevista, el vehículo y los requisitos legales en el país de destino. Okelcor no acepta responsabilidad por instalación incorrecta o uso fuera de las especificaciones nominales.",
      disclaimerP3: "Los precios se indican sin impuestos ni aranceles aplicables, salvo indicación contraria. Las condiciones de envío se acuerdan en el momento de la confirmación del pedido.",
    },
    related: { eyebrow: "También le puede interesar", heading: "Productos similares" },
    productDetails: "Detalles del producto",
  },
  fetTeaser: {
    eyebrow: "También disponible",
    title: "Fuel Echo Tech",
    highlight: "Ahorra combustible. Mejora el rendimiento.",
    body: "El dispositivo de eficiencia de combustible de confianza para operadores de flotas en toda Europa. Hasta un 15% de ahorro en combustible.",
    heroSubtitle: "Ahorra combustible, mejora el rendimiento y reduce las emisiones para cualquier vehículo o flota.",
    cta: "Más información",
  },
  fetMega: {
    badge: "Fuel Echo Tech",
    heading: "Ahorra combustible. Protege tu motor.",
    benefits: ["Hasta 13,9% de reducción de combustible", "Certificado ISO 9001:2015", "Amortización en 3–5 meses"],
    learnMore: "Más información",
    labelFuelSavings: "Ahorro de combustible",
    labelAnnualSavings: "Ahorro anual",
    labelPayback: "Período de amortización",
    requestQuote: "Solicitar presupuesto",
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const translations: Record<Locale, Translations> = { en, de, fr, es };
export const defaultLocale: Locale = "en";
