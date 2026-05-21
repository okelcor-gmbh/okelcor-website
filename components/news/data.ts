import type { Locale } from "@/lib/translations";

export type ArticleContent = {
  category: string;
  title: string;
  date: string;
  readTime: string;
  summary: string;
  /** HTML string (new articles) or legacy paragraph array */
  body: string | string[];
};

export type Article = ArticleContent & {
  slug: string;
  image: string;
};

type ArticleData = {
  slug: string;
  image: string;
  locales: Record<Locale, ArticleContent>;
};

// ─── Article data ─────────────────────────────────────────────────────────────

const ALL_ARTICLE_DATA: ArticleData[] = [
  {
    slug: "sourcing-tyres-at-scale-for-international-markets",
    image: "https://i.pinimg.com/1200x/04/78/57/047857ad5cade104910beeb38ee47eda.jpg",
    locales: {
      en: {
        category: "Logistics",
        title: "How to Source Tyres at Scale for International Markets",
        date: "14 March 2026",
        readTime: "5 min read",
        summary: "Scaling tyre procurement across borders requires more than a good supplier list. Here's what experienced distributors get right from day one.",
        body: [
          "Sourcing tyres at scale for international markets is a discipline that separates consistent distributors from those who struggle with stock gaps and shipment delays. The fundamentals are straightforward — find a reliable supplier, negotiate pricing, arrange logistics — but execution across multiple markets introduces layers of complexity that must be managed proactively.",
          "One of the most critical factors is understanding lead times across different shipping routes. A container moving from Germany to West Africa via ocean freight operates on a fundamentally different schedule than intra-European road freight. Distributors who treat all routes identically often find themselves managing emergency stock situations that could have been avoided with better planning. Building a 30 to 45-day buffer stock for high-velocity SKUs is considered best practice in international tyre distribution.",
          "Supplier consolidation is another key lever. Working with a single, vertically integrated supplier like Okelcor — one who handles sourcing, warehousing, and logistics coordination — reduces friction and gives buyers a single point of contact for order tracking, documentation, and claims. This simplicity compounds into significant operational efficiency over a full fiscal year.",
          "Finally, documentation accuracy cannot be understated. Export documentation errors — including incorrect HS codes, missing certificates of origin, or incomplete packing lists — are among the leading causes of customs clearance delays for tyre shipments. Partnering with suppliers experienced in REX-certified export processes significantly reduces this risk.",
        ],
      },
      de: {
        category: "Logistik",
        title: "Reifen in großem Maßstab für internationale Märkte beschaffen",
        date: "14. März 2026",
        readTime: "5 Min. Lesezeit",
        summary: "Die grenzüberschreitende Reifenbeschaffung in großem Umfang erfordert mehr als eine gute Lieferantenliste. Das machen erfahrene Händler von Anfang an richtig.",
        body: [
          "Reifen in großem Maßstab für internationale Märkte zu beschaffen ist eine Disziplin, die zuverlässige Händler von denen unterscheidet, die mit Lücken im Lagerbestand und Lieferverzögerungen zu kämpfen haben. Die Grundlagen sind einfach — einen zuverlässigen Lieferanten finden, Preise verhandeln, Logistik organisieren — aber die Umsetzung über mehrere Märkte hinweg bringt Komplexitätsebenen mit sich, die proaktiv gemanagt werden müssen.",
          "Einer der wichtigsten Faktoren ist das Verständnis der Vorlaufzeiten auf verschiedenen Versandrouten. Ein Container, der von Deutschland nach Westafrika auf dem Seeweg transportiert wird, hat grundlegend andere Zeitpläne als innereuropäischer Straßengüterverkehr. Händler, die alle Routen gleich behandeln, befinden sich oft in Notfallsituationen, die mit besserer Planung hätten vermieden werden können. Als Best Practice gilt ein Pufferbestand von 30 bis 45 Tagen für schnell drehende Artikel.",
          "Die Konsolidierung der Lieferanten ist ein weiterer wichtiger Hebel. Die Zusammenarbeit mit einem einzigen, vertikal integrierten Lieferanten wie Okelcor — der Beschaffung, Lagerung und Logistikkoordination übernimmt — reduziert Reibungsverluste und gibt den Käufern einen einzigen Ansprechpartner für Auftragsverfolgung, Dokumentation und Reklamationen. Diese Einfachheit wirkt sich über ein gesamtes Geschäftsjahr zu erheblicher operativer Effizienz aus.",
          "Schließlich kann die Genauigkeit der Dokumentation nicht genug betont werden. Fehler in der Exportdokumentation — einschließlich falscher HS-Codes, fehlender Ursprungszeugnisse oder unvollständiger Packlisten — gehören zu den häufigsten Ursachen für Zollverzögerungen bei Reifensendungen. Die Zusammenarbeit mit Lieferanten, die über REX-zertifizierte Exportprozesse verfügen, reduziert dieses Risiko erheblich.",
        ],
      },
      fr: {
        category: "Logistique",
        title: "Comment approvisionner des pneus à grande échelle pour les marchés internationaux",
        date: "14 mars 2026",
        readTime: "5 min de lecture",
        summary: "Faire évoluer l'approvisionnement en pneus à travers les frontières nécessite plus qu'une bonne liste de fournisseurs. Voici ce que les distributeurs expérimentés font correctement dès le premier jour.",
        body: [
          "L'approvisionnement en pneus à grande échelle pour les marchés internationaux est une discipline qui distingue les distributeurs constants de ceux qui luttent contre les ruptures de stock et les retards d'expédition. Les fondamentaux sont simples — trouver un fournisseur fiable, négocier les prix, organiser la logistique — mais l'exécution sur plusieurs marchés introduit des couches de complexité qui doivent être gérées de manière proactive.",
          "L'un des facteurs les plus critiques est la compréhension des délais d'approvisionnement sur différentes routes d'expédition. Un conteneur se déplaçant d'Allemagne vers l'Afrique de l'Ouest par fret maritime fonctionne sur un calendrier fondamentalement différent du transport routier intra-européen. Les distributeurs qui traitent toutes les routes de la même manière se retrouvent souvent à gérer des situations de stock d'urgence qui auraient pu être évitées. Maintenir un stock tampon de 30 à 45 jours pour les références à forte rotation est considéré comme une bonne pratique.",
          "La consolidation des fournisseurs est un autre levier clé. Travailler avec un seul fournisseur intégré verticalement comme Okelcor — qui gère l'approvisionnement, l'entreposage et la coordination logistique — réduit les frictions et donne aux acheteurs un interlocuteur unique pour le suivi des commandes, la documentation et les réclamations. Cette simplicité se traduit par une efficacité opérationnelle significative sur l'ensemble d'un exercice fiscal.",
          "Enfin, la précision de la documentation ne peut être sous-estimée. Les erreurs de documentation d'exportation — notamment les codes SH incorrects, les certificats d'origine manquants ou les listes de colisage incomplètes — sont parmi les principales causes de retards de dédouanement. Travailler avec des fournisseurs expérimentés dans les processus d'exportation certifiés REX réduit considérablement ce risque.",
        ],
      },
      es: {
        category: "Logística",
        title: "Cómo abastecer neumáticos a escala para mercados internacionales",
        date: "14 de marzo de 2026",
        readTime: "5 min de lectura",
        summary: "Escalar el abastecimiento de neumáticos a través de fronteras requiere más que una buena lista de proveedores. Esto es lo que los distribuidores experimentados hacen bien desde el primer día.",
        body: [
          "El abastecimiento de neumáticos a escala para mercados internacionales es una disciplina que separa a los distribuidores consistentes de aquellos que luchan con brechas de stock y retrasos en los envíos. Los fundamentos son simples — encontrar un proveedor fiable, negociar precios, organizar la logística — pero la ejecución en múltiples mercados introduce capas de complejidad que deben gestionarse de forma proactiva.",
          "Uno de los factores más críticos es comprender los plazos de entrega en diferentes rutas de envío. Un contenedor que va de Alemania a África Occidental por flete marítimo opera en un calendario fundamentalmente diferente al transporte por carretera dentro de Europa. Los distribuidores que tratan todas las rutas de forma idéntica a menudo se encuentran gestionando situaciones de emergencia de stock que podrían haberse evitado. Mantener un stock de reserva de 30 a 45 días para los artículos de alta rotación se considera una práctica recomendada.",
          "La consolidación de proveedores es otra palanca clave. Trabajar con un único proveedor verticalmente integrado como Okelcor — que gestiona el abastecimiento, el almacenamiento y la coordinación logística — reduce la fricción y da a los compradores un único punto de contacto para el seguimiento de pedidos, documentación y reclamaciones. Esta simplicidad se convierte en eficiencia operativa significativa a lo largo de un ejercicio fiscal completo.",
          "Finalmente, la precisión de la documentación no puede subestimarse. Los errores en la documentación de exportación — incluyendo códigos HS incorrectos, certificados de origen faltantes o listas de empaque incompletas — son una de las principales causas de retrasos en el despacho aduanero. Asociarse con proveedores experimentados en procesos de exportación certificados REX reduce significativamente este riesgo.",
        ],
      },
    },
  },

  {
    slug: "pcr-vs-tbr-choosing-the-right-tyre-category",
    image: "https://i.pinimg.com/1200x/af/41/5b/af415b9862b93c1d2b6ed52624a4d21a.jpg",
    locales: {
      en: {
        category: "Sourcing",
        title: "PCR vs TBR: Choosing the Right Category for Your Distribution Network",
        date: "28 February 2026",
        readTime: "4 min read",
        summary: "Passenger car radials and truck-bus radials serve very different markets. Understanding the distinction helps wholesalers allocate inventory more profitably.",
        body: [
          "Passenger Car Radials (PCR) and Truck-Bus Radials (TBR) represent the two dominant segments of the global tyre market, yet they operate on fundamentally different commercial dynamics. For distributors managing mixed portfolios, understanding these distinctions is essential to making sound procurement and pricing decisions.",
          "PCR tyres cater to the highest-volume segment globally — private vehicles, light vans, and compact SUVs. Demand is relatively consistent year-round, with seasonal spikes in markets with distinct winter conditions. Margins per unit are lower than TBR, but the volume potential is substantially higher. Fast-moving sizes in the 195/65R15 to 225/45R17 range typically drive the bulk of PCR revenue for regional distributors.",
          "TBR tyres operate in a more B2B-oriented sales environment. Buyers tend to be fleet operators, logistics companies, and transport authorities rather than individual consumers. The sales cycle is longer, but order values and recurring volumes per customer are considerably larger. A single fleet customer buying for a 100-truck operation creates more revenue per relationship than hundreds of individual PCR buyers.",
          "The decision of how to balance PCR and TBR in your portfolio should be driven by your customer base, storage capacity, and capital availability. TBR requires significantly more storage space per unit and ties up more working capital. PCR turns faster and is easier to liquidate in secondary markets. For new distributors entering the wholesale tyre business, a PCR-heavy portfolio with selective TBR lines for established fleet relationships is typically the most manageable starting point.",
        ],
      },
      de: {
        category: "Beschaffung",
        title: "PKW vs. LKW-Reifen: Die richtige Kategorie für Ihr Vertriebsnetzwerk wählen",
        date: "28. Februar 2026",
        readTime: "4 Min. Lesezeit",
        summary: "PKW-Reifen und LKW-Reifen bedienen sehr unterschiedliche Märkte. Das Verständnis der Unterschiede hilft Großhändlern, ihr Lager profitabler zu gestalten.",
        body: [
          "PKW-Reifen (PCR) und LKW-/Busreifen (TBR) stellen die zwei dominanten Segmente des globalen Reifenmarktes dar, funktionieren aber nach grundlegend unterschiedlichen Handelsdynamiken. Für Händler mit gemischten Portfolios ist das Verständnis dieser Unterschiede entscheidend für fundierte Beschaffungs- und Preisentscheidungen.",
          "PKW-Reifen bedienen das weltweit volumenstärkste Segment — Privatfahrzeuge, leichte Transporter und kompakte SUVs. Die Nachfrage ist ganzjährig relativ konstant, mit saisonalen Spitzen in Märkten mit ausgeprägten Winterbedingungen. Die Margen pro Einheit sind niedriger als bei TBR, aber das Volumenpotenzial ist erheblich höher. Schnell drehende Größen im Bereich 195/65R15 bis 225/45R17 treiben in der Regel den Großteil des PCR-Umsatzes für regionale Händler.",
          "LKW-Reifen funktionieren in einem stärker B2B-orientierten Vertriebsumfeld. Käufer sind eher Flottenmanager, Logistikunternehmen und Transportbehörden als Endverbraucher. Der Verkaufszyklus ist länger, aber Auftragswerte und wiederkehrende Volumina pro Kunde sind erheblich größer. Ein einziger Flottenkunde, der für 100 Fahrzeuge einkauft, generiert mehr Umsatz pro Beziehung als Hunderte einzelner PCR-Käufer.",
          "Die Entscheidung, wie PCR und TBR in Ihrem Portfolio zu balancieren sind, sollte von Ihrer Kundenbasis, Lagerkapazität und Kapitelverfügbarkeit geleitet werden. TBR erfordert deutlich mehr Lagerfläche pro Einheit und bindet mehr Betriebskapital. PCR dreht sich schneller und lässt sich im Sekundärmarkt leichter liquidieren. Für neue Händler ist ein PCR-schweres Portfolio mit selektiven TBR-Linien für etablierte Flottenbeziehungen in der Regel der überschaubarste Einstieg.",
        ],
      },
      fr: {
        category: "Approvisionnement",
        title: "PCR vs PL : Choisir la bonne catégorie pour votre réseau de distribution",
        date: "28 février 2026",
        readTime: "4 min de lecture",
        summary: "Les pneus tourisme et les pneus poids lourd servent des marchés très différents. Comprendre la distinction aide les grossistes à allouer leur inventaire plus rentablement.",
        body: [
          "Les pneus Tourisme (PCR) et les pneus Camion-Bus (TBR) représentent les deux segments dominants du marché mondial des pneus, mais fonctionnent selon des dynamiques commerciales fondamentalement différentes. Pour les distributeurs gérant des portefeuilles mixtes, comprendre ces distinctions est essentiel pour prendre des décisions d'approvisionnement et de tarification éclairées.",
          "Les pneus PCR s'adressent au segment le plus volumétrique au monde — véhicules particuliers, fourgonnettes légères et SUV compacts. La demande est relativement constante tout au long de l'année, avec des pics saisonniers dans les marchés à conditions hivernales distinctes. Les marges par unité sont inférieures à celles des TBR, mais le potentiel de volume est nettement supérieur. Les tailles à forte rotation dans la gamme 195/65R15 à 225/45R17 génèrent généralement l'essentiel des revenus PCR.",
          "Les pneus TBR opèrent dans un environnement de vente plus orienté B2B. Les acheteurs tendent à être des gestionnaires de flotte, des entreprises de logistique et des autorités de transport plutôt que des consommateurs individuels. Le cycle de vente est plus long, mais les valeurs de commande et les volumes récurrents par client sont considérablement plus importants. Un seul client de flotte pour 100 camions génère plus de revenus par relation que des centaines d'acheteurs PCR individuels.",
          "La décision d'équilibrer PCR et TBR dans votre portefeuille doit être guidée par votre base de clients, votre capacité de stockage et votre disponibilité en capital. Les TBR nécessitent beaucoup plus d'espace de stockage par unité et immobilisent davantage de fonds de roulement. Les PCR tournent plus vite et sont plus faciles à liquider sur les marchés secondaires. Pour les nouveaux distributeurs, un portefeuille à dominante PCR avec des gammes TBR sélectives est généralement le point de départ le plus gérable.",
        ],
      },
      es: {
        category: "Abastecimiento",
        title: "PCR vs TBR: Elegir la categoría correcta para su red de distribución",
        date: "28 de febrero de 2026",
        readTime: "4 min de lectura",
        summary: "Los neumáticos de turismo y los de camión-autobús sirven mercados muy diferentes. Entender la distinción ayuda a los mayoristas a asignar el inventario de forma más rentable.",
        body: [
          "Los neumáticos PCR (Passenger Car Radials) y TBR (Truck-Bus Radials) representan los dos segmentos dominantes del mercado global de neumáticos, pero operan bajo dinámicas comerciales fundamentalmente diferentes. Para los distribuidores que gestionan carteras mixtas, comprender estas distinciones es esencial para tomar decisiones de compra y fijación de precios acertadas.",
          "Los neumáticos PCR atienden al segmento de mayor volumen a nivel mundial — vehículos particulares, furgonetas ligeras y SUVs compactos. La demanda es relativamente constante durante todo el año, con picos estacionales en mercados con condiciones invernales diferenciadas. Los márgenes por unidad son menores que los TBR, pero el potencial de volumen es sustancialmente mayor. Las tallas de alta rotación entre 195/65R15 y 225/45R17 suelen representar la mayor parte de los ingresos PCR para distribuidores regionales.",
          "Los neumáticos TBR operan en un entorno de ventas más orientado al B2B. Los compradores tienden a ser operadores de flotas, empresas de logística y autoridades de transporte, no consumidores individuales. El ciclo de venta es más largo, pero los valores de pedido y los volúmenes recurrentes por cliente son considerablemente mayores. Un único cliente de flota para 100 camiones genera más ingresos por relación que cientos de compradores individuales de PCR.",
          "La decisión de cómo equilibrar PCR y TBR en su cartera debe estar guiada por su base de clientes, capacidad de almacenamiento y disponibilidad de capital. Los TBR requieren significativamente más espacio de almacenamiento por unidad y movilizan más capital de trabajo. Los PCR rotan más rápido y son más fáciles de liquidar en mercados secundarios. Para nuevos distribuidores, una cartera con predominancia PCR y líneas TBR selectivas para relaciones de flota establecidas suele ser el punto de partida más manejable.",
        ],
      },
    },
  },

  {
    slug: "okelcor-expands-supply-network-east-africa",
    image: "https://i.pinimg.com/736x/d9/e9/91/d9e991b86b261b713acb34f294ce82c2.jpg",
    locales: {
      en: {
        category: "Company News",
        title: "Okelcor Expands Supply Network Across East Africa",
        date: "10 February 2026",
        readTime: "3 min read",
        summary: "Okelcor has formalised new distribution partnerships across Kenya, Uganda, and Tanzania, extending its reach in one of the world's fastest-growing tyre markets.",
        body: [
          "Okelcor is pleased to announce the formalisation of distribution partnerships across Kenya, Uganda, and Tanzania — marking a significant expansion of the company's presence in Sub-Saharan Africa. The move responds to sustained demand growth from regional importers and fleet operators seeking reliable access to premium European tyre brands.",
          "East Africa's tyre market has grown substantially over the past five years, driven by infrastructure investment, a growing commercial vehicle fleet, and rising vehicle ownership rates in urban centres. The region presents strong demand for both PCR and TBR products, with particular appetite for all-season and all-terrain specifications suited to mixed road conditions.",
          "The new partnerships give East African buyers direct access to Okelcor's full catalogue, including PCR, TBR, LT, and Grade A used stock, supported by consolidated ocean freight departures from Hamburg on a bi-weekly schedule. Documentation support including REX-certified export paperwork is handled in-house by Okelcor's Munich team.",
          "\"East Africa has been on our roadmap for two years,\" said Okelcor's head of international sales. \"The demand is real, the logistics infrastructure has matured, and we now have the right partners on the ground to deliver a consistent supply experience. We're starting with Kenya, Uganda, and Tanzania but expect to extend into the wider region over the next 18 months.\"",
        ],
      },
      de: {
        category: "Unternehmensnews",
        title: "Okelcor erweitert Versorgungsnetzwerk in Ostafrika",
        date: "10. Februar 2026",
        readTime: "3 Min. Lesezeit",
        summary: "Okelcor hat neue Vertriebspartnerschaften in Kenia, Uganda und Tansania formalisiert und erweitert seine Präsenz auf einem der am schnellsten wachsenden Reifenmärkte der Welt.",
        body: [
          "Okelcor freut sich, die Formalisierung von Vertriebspartnerschaften in Kenia, Uganda und Tansania bekannt zu geben — ein bedeutender Ausbau der Präsenz des Unternehmens in Subsahara-Afrika. Der Schritt reagiert auf nachhaltiges Nachfragewachstum regionaler Importeure und Flottenbetreiber, die zuverlässigen Zugang zu Premium-Reifenmarken aus Europa suchen.",
          "Der ostafrikanische Reifenmarkt ist in den letzten fünf Jahren erheblich gewachsen, angetrieben durch Infrastrukturinvestitionen, einen wachsenden gewerblichen Fuhrpark und steigende Fahrzeugquoten in städtischen Zentren. Die Region zeigt starke Nachfrage nach PCR- und TBR-Produkten, mit besonderem Interesse an Ganzjahres- und Geländespezifikationen.",
          "Die neuen Partnerschaften ermöglichen ostafrikanischen Käufern direkten Zugang zum vollständigen Sortiment von Okelcor, einschließlich PKW-, LKW-, LT- und Kategorie A-Gebrauchtreifen, mit konsolidierten Seefrachtabfahrten ab Hamburg im zweiwöchentlichen Rhythmus. Die Dokumentationsunterstützung einschließlich REX-zertifizierter Exportunterlagen wird intern vom Münchner Team bearbeitet.",
          "„Ostafrika stand seit zwei Jahren auf unserer Roadmap\", sagte Okelcors Leiter des internationalen Vertriebs. „Die Nachfrage ist real, die Logistikinfrastruktur hat sich weiterentwickelt, und wir haben jetzt die richtigen Partner vor Ort. Wir beginnen mit Kenia, Uganda und Tansania, erwarten aber, uns in den nächsten 18 Monaten in der weiteren Region auszudehnen.\"",
        ],
      },
      fr: {
        category: "Actualités",
        title: "Okelcor étend son réseau d'approvisionnement en Afrique de l'Est",
        date: "10 février 2026",
        readTime: "3 min de lecture",
        summary: "Okelcor a formalisé de nouveaux partenariats de distribution au Kenya, en Ouganda et en Tanzanie, étendant sa présence sur l'un des marchés de pneus à la croissance la plus rapide au monde.",
        body: [
          "Okelcor a le plaisir d'annoncer la formalisation de partenariats de distribution au Kenya, en Ouganda et en Tanzanie — marquant une expansion significative de la présence de l'entreprise en Afrique subsaharienne. Cette démarche répond à une croissance soutenue de la demande des importateurs régionaux et des opérateurs de flotte à la recherche d'un accès fiable aux marques de pneus premium européennes.",
          "Le marché des pneus en Afrique de l'Est a connu une croissance substantielle au cours des cinq dernières années, portée par les investissements dans les infrastructures, une flotte de véhicules commerciaux en croissance et l'augmentation du taux de motorisation dans les centres urbains. La région présente une forte demande pour les produits PCR et TBR, avec un appétit particulier pour les spécifications toutes saisons et tout-terrain.",
          "Les nouveaux partenariats donnent aux acheteurs est-africains un accès direct au catalogue complet d'Okelcor, incluant PCR, TBR, LT et le stock usagé Grade A, avec des départs de fret maritime consolidés depuis Hambourg selon un calendrier bihebdomadaire. Le support documentaire, y compris les documents d'exportation certifiés REX, est géré en interne par l'équipe munichoise.",
          "\"L'Afrique de l'Est était dans notre feuille de route depuis deux ans\", a déclaré le responsable des ventes internationales d'Okelcor. \"La demande est réelle, l'infrastructure logistique a mûri, et nous avons maintenant les bons partenaires sur le terrain. Nous commençons par le Kenya, l'Ouganda et la Tanzanie, mais nous nous attendons à nous étendre dans la région au cours des 18 prochains mois.\"",
        ],
      },
      es: {
        category: "Noticias de empresa",
        title: "Okelcor amplía su red de suministro en África Oriental",
        date: "10 de febrero de 2026",
        readTime: "3 min de lectura",
        summary: "Okelcor ha formalizado nuevas asociaciones de distribución en Kenia, Uganda y Tanzania, extendiendo su presencia en uno de los mercados de neumáticos de más rápido crecimiento del mundo.",
        body: [
          "Okelcor se complace en anunciar la formalización de asociaciones de distribución en Kenia, Uganda y Tanzania — marcando una expansión significativa de la presencia de la empresa en África subsahariana. El movimiento responde al sostenido crecimiento de la demanda de importadores regionales y operadores de flotas que buscan acceso fiable a marcas europeas de neumáticos premium.",
          "El mercado de neumáticos de África Oriental ha crecido sustancialmente en los últimos cinco años, impulsado por la inversión en infraestructuras, una flota de vehículos comerciales en expansión y el aumento de la motorización en centros urbanos. La región presenta una fuerte demanda de productos PCR y TBR, con especial interés en especificaciones para todo terreno y todas las estaciones.",
          "Las nuevas asociaciones dan a los compradores de África Oriental acceso directo al catálogo completo de Okelcor, incluyendo stock PCR, TBR, LT y neumáticos usados de clase A, con salidas de flete marítimo consolidado desde Hamburgo en un calendario quincenal. El soporte de documentación, incluyendo documentación de exportación con certificación REX, es gestionado internamente por el equipo de Múnich.",
          "\"África Oriental ha estado en nuestra hoja de ruta durante dos años\", dijo el jefe de ventas internacionales de Okelcor. \"La demanda es real, la infraestructura logística ha madurado, y ahora tenemos los socios adecuados sobre el terreno. Comenzamos con Kenia, Uganda y Tanzania, pero esperamos extendernos a la región más amplia en los próximos 18 meses.\"",
        ],
      },
    },
  },

  {
    slug: "2026-tyre-market-trends-wholesale-buyers",
    image: "/images/tyre-primary.jpg",
    locales: {
      en: {
        category: "Market Trends",
        title: "2026 Tyre Market Trends Every Wholesale Buyer Should Know",
        date: "22 January 2026",
        readTime: "6 min read",
        summary: "From EV-specific compounds to shifting supply chains, the tyre market in 2026 is being shaped by forces that every serious wholesale buyer needs to understand.",
        body: [
          "The global tyre market in 2026 is navigating a convergence of structural forces that are reshaping supply dynamics, product demand, and pricing across all segments. For wholesale distributors, staying ahead of these trends is no longer optional — it is a competitive necessity.",
          "The rise of electric vehicles continues to drive demand for EV-optimised tyre compounds, characterised by higher load ratings, reduced rolling resistance, and increased durability to compensate for the additional vehicle weight. Premium brands have invested heavily in EV-specific lines, and demand is growing fastest in Western Europe and South-East Asia. Distributors serving markets with high EV adoption rates should audit their catalogues accordingly.",
          "Supply chain realignment is another defining theme. European tyre manufacturers have continued to reduce their dependence on single-region raw material sources following supply disruptions in 2022 and 2023. This has broadly stabilised premium tyre availability but has introduced pricing floors that are unlikely to reverse in the medium term. Buyers accustomed to opportunistic low-price procurement will find less room to manoeuvre in 2026.",
          "Used tyre demand is accelerating in export markets, particularly in Africa and parts of South-East Asia, where cost sensitivity makes Grade A used stock an attractive proposition. Quality-graded used tyres from European markets — typically with 4mm or more of remaining tread — represent a growing segment of Okelcor's export volume. Distributors who have not yet built a used tyre channel should consider the margin opportunity carefully.",
        ],
      },
      de: {
        category: "Markttrends",
        title: "Reifenmarkttrends 2026: Was jeder Großhandelskäufer wissen sollte",
        date: "22. Januar 2026",
        readTime: "6 Min. Lesezeit",
        summary: "Von EV-spezifischen Compounds bis zu veränderten Lieferketten — der Reifenmarkt 2026 wird von Kräften geprägt, die jeder ernsthafte Großhandelskäufer verstehen muss.",
        body: [
          "Der globale Reifenmarkt im Jahr 2026 navigiert eine Konvergenz struktureller Kräfte, die Angebotsdynamiken, Produktnachfrage und Preise in allen Segmenten neu gestalten. Für Großhandelshändler ist es nicht mehr optional, diesen Trends voraus zu sein — es ist eine Wettbewerbsnotwendigkeit.",
          "Der Aufstieg der Elektrofahrzeuge treibt weiterhin die Nachfrage nach EV-optimierten Reifenverbindungen an, die sich durch höhere Tragfähigkeiten, reduzierten Rollwiderstand und erhöhte Haltbarkeit auszeichnen. Premiummarken haben intensiv in EV-spezifische Linien investiert, und die Nachfrage wächst am schnellsten in Westeuropa und Südostasien. Händler, die Märkte mit hoher EV-Adoptionsrate bedienen, sollten ihre Sortimente entsprechend prüfen.",
          "Die Neuausrichtung der Lieferketten ist ein weiteres prägendes Thema. Europäische Reifenhersteller haben ihre Abhängigkeit von Rohstoffquellen in einer einzigen Region nach den Versorgungsunterbrechungen 2022 und 2023 weiter reduziert. Dies hat die Verfügbarkeit von Premium-Reifen stabilisiert, aber Preisniveaus eingeführt, die sich mittelfristig kaum umkehren werden.",
          "Die Nachfrage nach Gebrauchtreifen beschleunigt sich auf Exportmärkten, insbesondere in Afrika und Teilen Südostasiens. Qualitätssortierte Gebrauchtreifen aus europäischen Märkten — typischerweise mit 4 mm oder mehr verbleibender Profiltiefe — stellen ein wachsendes Segment des Exportvolumens von Okelcor dar. Händler, die noch keinen Gebrauchtreifen-Kanal aufgebaut haben, sollten die Margenopportunität sorgfältig prüfen.",
        ],
      },
      fr: {
        category: "Tendances du marché",
        title: "Tendances du marché des pneus 2026 : Ce que tout acheteur en gros doit savoir",
        date: "22 janvier 2026",
        readTime: "6 min de lecture",
        summary: "Des composés spécifiques aux VE aux chaînes d'approvisionnement en mutation, le marché des pneus en 2026 est façonné par des forces que tout acheteur en gros sérieux doit comprendre.",
        body: [
          "Le marché mondial des pneus en 2026 navigue à travers une convergence de forces structurelles qui remodèlent la dynamique d'offre, la demande de produits et les prix dans tous les segments. Pour les distributeurs grossistes, anticiper ces tendances n'est plus optionnel — c'est une nécessité concurrentielle.",
          "L'essor des véhicules électriques continue de stimuler la demande de composés de pneus optimisés pour les VE, caractérisés par des indices de charge plus élevés, une résistance au roulement réduite et une durabilité accrue. Les marques premium ont fortement investi dans des gammes spécifiques aux VE, et la demande croît le plus rapidement en Europe occidentale et en Asie du Sud-Est.",
          "Le réalignement des chaînes d'approvisionnement est un autre thème définissant. Les fabricants de pneus européens ont continué à réduire leur dépendance aux sources de matières premières d'une seule région après les perturbations de 2022 et 2023. Cela a stabilisé la disponibilité des pneus premium mais a introduit des planchers de prix qui sont peu susceptibles de s'inverser à moyen terme.",
          "La demande de pneus usagés s'accélère sur les marchés d'exportation, notamment en Afrique et en Asie du Sud-Est. Les pneus usagés de qualité provenant des marchés européens — généralement avec 4 mm ou plus de bande de roulement restante — représentent un segment croissant du volume d'exportation d'Okelcor. Les distributeurs qui n'ont pas encore développé un canal de pneus usagés devraient examiner attentivement l'opportunité de marge.",
        ],
      },
      es: {
        category: "Tendencias del mercado",
        title: "Tendencias del mercado de neumáticos 2026: Lo que todo comprador mayorista debe saber",
        date: "22 de enero de 2026",
        readTime: "6 min de lectura",
        summary: "Desde compuestos específicos para vehículos eléctricos hasta cadenas de suministro cambiantes, el mercado de neumáticos en 2026 está siendo moldeado por fuerzas que todo comprador mayorista serio necesita entender.",
        body: [
          "El mercado global de neumáticos en 2026 navega una convergencia de fuerzas estructurales que están reformando la dinámica de suministro, la demanda de productos y los precios en todos los segmentos. Para los distribuidores mayoristas, anticiparse a estas tendencias ya no es opcional — es una necesidad competitiva.",
          "El auge de los vehículos eléctricos continúa impulsando la demanda de compuestos de neumáticos optimizados para VE, caracterizados por mayores índices de carga, menor resistencia al rodamiento y mayor durabilidad. Las marcas premium han invertido intensamente en líneas específicas para VE, y la demanda crece más rápido en Europa Occidental y el Sudeste Asiático. Los distribuidores que atienden mercados con alta adopción de VE deben revisar sus catálogos en consecuencia.",
          "La realineación de la cadena de suministro es otro tema definitorio. Los fabricantes europeos de neumáticos han continuado reduciendo su dependencia de fuentes de materias primas de una sola región tras las interrupciones de 2022 y 2023. Esto ha estabilizado en términos generales la disponibilidad de neumáticos premium, pero ha introducido suelos de precios que difícilmente se revertirán a medio plazo.",
          "La demanda de neumáticos usados se acelera en los mercados de exportación, particularmente en África y partes del Sudeste Asiático. Los neumáticos usados de calidad de los mercados europeos — típicamente con 4 mm o más de banda de rodadura restante — representan un segmento creciente del volumen de exportación de Okelcor. Los distribuidores que aún no han construido un canal de neumáticos usados deben considerar detenidamente la oportunidad de margen.",
        ],
      },
    },
  },

  {
    slug: "growing-demand-grade-a-used-tyres-export-markets",
    image: "/images/tyre-truck.jpg",
    locales: {
      en: {
        category: "Market Trends",
        title: "The Growing Demand for Grade A Used Tyres in Export Markets",
        date: "5 January 2026",
        readTime: "4 min read",
        summary: "Grade A used tyres sourced from European markets are seeing record export volumes. Here's what's driving the trend and how distributors can benefit.",
        body: [
          "Grade A used tyres — typically defined as second-hand tyres with a minimum of 4mm remaining tread, no structural damage, and no sidewall deformation — are experiencing record export volumes from European supply hubs. The primary destinations are markets in West and East Africa, South-East Asia, and parts of the Middle East, where the price-to-value ratio of quality used tyres is highly compelling.",
          "The supply side of this market is uniquely tied to European vehicle replacement cycles. As European consumers upgrade to newer vehicles or switch to EVs, the volume of quality used tyres entering the secondary market has grown consistently. Professional grading and sorting operations — like those managed by Okelcor — ensure that only roadworthy stock reaches export buyers, protecting distributors from reputational risk.",
          "Margins in the used tyre segment compare favourably with new tyre distribution, particularly for buyers who can source in volume. The unit price is significantly lower, which reduces working capital requirements per container, while the margin percentage remains attractive when quality grading is properly managed. The key risk — tyre integrity — is mitigated by partnering with suppliers who apply rigorous pre-export inspection protocols.",
          "For distributors in price-sensitive markets, building a used tyre channel alongside a new tyre portfolio creates genuine competitive differentiation. It allows the business to serve a broader customer base and generates faster inventory turnover, particularly in markets where cash flow cycles are tight. Okelcor offers Grade A used PCR and TBR stock with full inspection reports available on request.",
        ],
      },
      de: {
        category: "Markttrends",
        title: "Die wachsende Nachfrage nach Kategorie A-Gebrauchtreifen auf Exportmärkten",
        date: "5. Januar 2026",
        readTime: "4 Min. Lesezeit",
        summary: "Kategorie A-Gebrauchtreifen aus europäischen Märkten verzeichnen Rekordexportvolumina. Das sind die Treiber des Trends und wie Händler davon profitieren können.",
        body: [
          "Kategorie A-Gebrauchtreifen — typischerweise definiert als Reifen mit mindestens 4 mm verbleibender Profiltiefe, ohne strukturelle Schäden und ohne Seitenwandverformung — verzeichnen Rekordexportvolumina aus europäischen Versorgungszentren. Die primären Destinationen sind Märkte in West- und Ostafrika, Südostasien und Teilen des Nahen Ostens, wo das Preis-Leistungs-Verhältnis besonders attraktiv ist.",
          "Die Angebotsseite dieses Marktes ist einzigartig mit den europäischen Fahrzeugaustauschzyklen verknüpft. Wenn europäische Verbraucher auf neuere Fahrzeuge umsteigen oder zu E-Fahrzeugen wechseln, ist das Volumen hochwertiger Gebrauchtreifen auf dem Sekundärmarkt kontinuierlich gestiegen. Professionelle Sortier- und Klassifizierungsoperationen — wie die von Okelcor verwalteten — stellen sicher, dass nur fahrtaugliche Bestände die Exportkäufer erreichen.",
          "Die Margen im Gebrauchtreifensegment sind im Vergleich zur Neurei fenverteilung günstig, besonders für Käufer, die in großem Volumen beschaffen können. Der Stückpreis ist deutlich niedriger, während der Marginenprozentsatz bei sorgfältig verwalteter Qualitätseinstufung attraktiv bleibt. Das Hauptrisiko — die Reifenintegrität — wird durch die Partnerschaft mit Lieferanten gemindert, die strenge Vorabinspektionsprotokolle anwenden.",
          "Für Händler auf preissensitiven Märkten schafft der Aufbau eines Gebrauchtreifenkanals neben einem Neureifen-Portfolio echte Wettbewerbsdifferenzierung. Es ermöglicht dem Unternehmen, eine breitere Kundenbasis zu bedienen und generiert schnellere Lagerumschläge. Okelcor bietet Kategorie A-Gebraucht-PKW- und LKW-Reifen mit auf Anfrage verfügbaren vollständigen Inspektionsberichten an.",
        ],
      },
      fr: {
        category: "Tendances du marché",
        title: "La demande croissante de pneus usagés Grade A sur les marchés d'exportation",
        date: "5 janvier 2026",
        readTime: "4 min de lecture",
        summary: "Les pneus usagés Grade A approvisionnés sur les marchés européens connaissent des volumes d'exportation records. Voici ce qui motive cette tendance et comment les distributeurs peuvent en bénéficier.",
        body: [
          "Les pneus usagés Grade A — généralement définis comme des pneus d'occasion avec un minimum de 4 mm de bande de roulement restante, sans dommages structurels et sans déformation du flanc — connaissent des volumes d'exportation records depuis les centres d'approvisionnement européens. Les principales destinations sont les marchés d'Afrique de l'Ouest et de l'Est, d'Asie du Sud-Est et du Moyen-Orient.",
          "Le côté offre de ce marché est uniquement lié aux cycles de remplacement des véhicules européens. Au fur et à mesure que les consommateurs européens passent à des véhicules plus récents ou aux VE, le volume de pneus usagés de qualité sur le marché secondaire a régulièrement augmenté. Les opérations de tri et de classification professionnelles — comme celles gérées par Okelcor — garantissent que seul le stock en état de circuler atteint les acheteurs à l'exportation.",
          "Les marges dans le segment des pneus usagés se comparent favorablement à la distribution de pneus neufs, en particulier pour les acheteurs qui peuvent s'approvisionner en volume. Le prix unitaire est significativement plus bas, tandis que le pourcentage de marge reste attrayant lorsque le classement qualité est correctement géré. Le risque clé — l'intégrité des pneus — est atténué en s'associant à des fournisseurs qui appliquent des protocoles d'inspection rigoureux.",
          "Pour les distributeurs sur des marchés sensibles aux prix, la création d'un canal de pneus usagés parallèlement à un portefeuille de pneus neufs crée une véritable différenciation concurrentielle. Cela génère une rotation des stocks plus rapide et permet de servir une base de clients plus large. Okelcor propose des pneus usagés PCR et TBR Grade A avec des rapports d'inspection complets disponibles sur demande.",
        ],
      },
      es: {
        category: "Tendencias del mercado",
        title: "La creciente demanda de neumáticos usados de clase A en mercados de exportación",
        date: "5 de enero de 2026",
        readTime: "4 min de lectura",
        summary: "Los neumáticos usados de clase A procedentes de mercados europeos están experimentando volúmenes de exportación récord. Esto es lo que impulsa la tendencia y cómo pueden beneficiarse los distribuidores.",
        body: [
          "Los neumáticos usados de clase A — típicamente definidos como neumáticos de segunda mano con un mínimo de 4 mm de banda de rodadura restante, sin daños estructurales y sin deformación de flancos — están experimentando volúmenes de exportación récord desde los centros de suministro europeos. Los principales destinos son mercados en África Occidental y Oriental, el Sudeste Asiático y partes de Oriente Medio, donde la relación calidad-precio es muy atractiva.",
          "El lado de la oferta de este mercado está vinculado de forma única a los ciclos de reemplazo de vehículos europeos. A medida que los consumidores europeos actualizan a vehículos más nuevos o cambian a VE, el volumen de neumáticos usados de calidad que ingresa al mercado secundario ha crecido de forma constante. Las operaciones de clasificación y selección profesional — como las gestionadas por Okelcor — garantizan que solo el stock en condiciones de circular llegue a los compradores de exportación.",
          "Los márgenes en el segmento de neumáticos usados se comparan favorablemente con la distribución de neumáticos nuevos, especialmente para compradores que pueden abastecerse en volumen. El precio unitario es significativamente menor, lo que reduce los requisitos de capital circulante por contenedor, mientras que el porcentaje de margen sigue siendo atractivo cuando la clasificación de calidad se gestiona correctamente.",
          "Para los distribuidores en mercados sensibles al precio, construir un canal de neumáticos usados junto a una cartera de neumáticos nuevos crea una diferenciación competitiva genuina. Permite al negocio atender a una base de clientes más amplia y genera una rotación de inventario más rápida. Okelcor ofrece stock de neumáticos usados PCR y TBR de clase A con informes de inspección completos disponibles a petición.",
        ],
      },
    },
  },

  {
    slug: "international-tyre-shipping-what-distributors-must-know",
    image: "/images/tyre-warehouse.jpg",
    locales: {
      en: {
        category: "Logistics",
        title: "International Tyre Shipping: What Every Distributor Must Know",
        date: "18 December 2025",
        readTime: "5 min read",
        summary: "Shipping tyres internationally involves specific documentation, packaging, and customs requirements. This guide covers the essentials for wholesale buyers.",
        body: [
          "Shipping tyres internationally is a process with distinct logistical and regulatory requirements that differ meaningfully from other cargo categories. Tyres are classified as a specific commodity with defined HS codes, are subject to import duties in most markets, and require specific packaging and loading arrangements to comply with carrier guidelines and destination country regulations.",
          "The most commonly used HS code for new passenger car tyres is 4011.10, while truck and bus tyres fall under 4011.20. Used tyres are typically classified under 4012.20. Incorrect HS code classification is one of the most frequent causes of customs delays and unexpected duty assessments — and the liability sits with the importer of record. Experienced exporters like Okelcor prepare full commercial invoices with verified HS codes for every shipment.",
          "For ocean freight, tyre shipments are typically containerised — either in 20-foot or 40-foot containers depending on volume. Standard PCR tyres can be stacked and loaded efficiently to maximise container utilisation, but TBR tyres require more careful loading due to their size and weight. Container weights must comply with VGM (Verified Gross Mass) regulations under SOLAS, which applies to all ocean freight globally.",
          "Insurance is an often-overlooked element of international tyre logistics. While many freight forwarders offer basic cargo insurance, the specific value and fragility characteristics of tyre shipments warrant dedicated cargo coverage. Buyers should confirm whether their supplier's FOB quotation includes insurance, or whether they need to arrange independent marine cargo insurance for each consignment.",
        ],
      },
      de: {
        category: "Logistik",
        title: "Internationaler Reifenversand: Was jeder Händler wissen muss",
        date: "18. Dezember 2025",
        readTime: "5 Min. Lesezeit",
        summary: "Der internationale Versand von Reifen erfordert spezifische Dokumentation, Verpackung und Zollanforderungen. Dieser Leitfaden behandelt die Grundlagen für Großhandelskäufer.",
        body: [
          "Der internationale Versand von Reifen ist ein Prozess mit spezifischen logistischen und regulatorischen Anforderungen, die sich bedeutend von anderen Frachtklassen unterscheiden. Reifen werden als spezifische Ware mit definierten HS-Codes klassifiziert, unterliegen in den meisten Märkten Importzöllen und erfordern spezifische Verpackungs- und Ladungsanordnungen zur Einhaltung der Vorschriften.",
          "Der am häufigsten verwendete HS-Code für neue PKW-Reifen ist 4011.10, während Lkw- und Busreifen unter 4011.20 fallen. Gebrauchtreifen werden typischerweise unter 4012.20 klassifiziert. Eine falsche HS-Code-Klassifizierung ist eine der häufigsten Ursachen für Zollverzögerungen — und die Haftung liegt beim Importeur. Erfahrene Exporteure wie Okelcor erstellen vollständige Handelsrechnungen mit verifizierten HS-Codes für jede Sendung.",
          "Für Seefracht werden Reifensendungen in der Regel in 20- oder 40-Fuß-Containern transportiert. Standard-PKW-Reifen können gestapelt und effizient geladen werden, aber TBR-Reifen erfordern aufgrund ihrer Größe und ihres Gewichts eine sorgfältigere Beladung. Containergewichte müssen den VGM-Vorschriften gemäß SOLAS entsprechen, die weltweit für alle Seefrachtgüter gilt.",
          "Versicherung ist ein oft übersehenes Element der internationalen Reifenlogistik. Während viele Spediteure eine grundlegende Frachtversicherung anbieten, erfordern die spezifischen Werteigenschaften von Reifensendungen eine dedizierte Frachtabsicherung. Käufer sollten bestätigen, ob das FOB-Angebot ihres Lieferanten eine Versicherung enthält oder ob sie eine unabhängige Seegüterversicherung benötigen.",
        ],
      },
      fr: {
        category: "Logistique",
        title: "Expédition internationale de pneus : Ce que chaque distributeur doit savoir",
        date: "18 décembre 2025",
        readTime: "5 min de lecture",
        summary: "L'expédition internationale de pneus implique des exigences spécifiques en matière de documentation, d'emballage et de douane. Ce guide couvre les essentiels pour les acheteurs en gros.",
        body: [
          "L'expédition internationale de pneus est un processus avec des exigences logistiques et réglementaires distinctes qui diffèrent significativement des autres catégories de fret. Les pneus sont classifiés comme une marchandise spécifique avec des codes SH définis, sont soumis à des droits d'importation dans la plupart des marchés, et nécessitent des arrangements d'emballage et de chargement spécifiques.",
          "Le code SH le plus couramment utilisé pour les nouveaux pneus de voitures particulières est le 4011.10, tandis que les pneus camions et bus relèvent du 4011.20. Les pneus usagés sont généralement classés sous le 4012.20. Une classification incorrecte est l'une des causes les plus fréquentes de retards douaniers — et la responsabilité incombe à l'importateur. Des exportateurs expérimentés comme Okelcor préparent des factures commerciales complètes avec des codes SH vérifiés.",
          "Pour le fret maritime, les expéditions de pneus sont généralement conteneurisées en conteneurs de 20 ou 40 pieds. Les pneus PCR standard peuvent être empilés efficacement pour maximiser l'utilisation du conteneur, mais les pneus TBR nécessitent un chargement plus soigneux. Les poids des conteneurs doivent être conformes aux réglementations VGM sous SOLAS.",
          "L'assurance est un élément souvent négligé de la logistique internationale des pneus. Bien que de nombreux transitaires offrent une assurance cargo de base, les caractéristiques de valeur des expéditions de pneus justifient une couverture cargo dédiée. Les acheteurs doivent confirmer si le devis FOB de leur fournisseur inclut une assurance, ou s'ils doivent souscrire une assurance cargo maritime indépendante.",
        ],
      },
      es: {
        category: "Logística",
        title: "Envío internacional de neumáticos: Lo que todo distribuidor debe saber",
        date: "18 de diciembre de 2025",
        readTime: "5 min de lectura",
        summary: "El envío internacional de neumáticos implica requisitos específicos de documentación, embalaje y aduanas. Esta guía cubre los aspectos esenciales para compradores mayoristas.",
        body: [
          "El envío internacional de neumáticos es un proceso con requisitos logísticos y regulatorios distintos que difieren significativamente de otras categorías de carga. Los neumáticos se clasifican como una mercancía específica con códigos HS definidos, están sujetos a aranceles de importación en la mayoría de los mercados y requieren disposiciones específicas de embalaje y carga para cumplir con las directrices de los transportistas y las regulaciones del país de destino.",
          "El código HS más utilizado para neumáticos nuevos de turismos es el 4011.10, mientras que los neumáticos de camión y autobús corresponden al 4011.20. Los neumáticos usados se clasifican habitualmente bajo el 4012.20. Una clasificación incorrecta del código HS es una de las causas más frecuentes de retrasos aduaneros y liquidaciones arancelarias inesperadas — y la responsabilidad recae sobre el importador de registro. Exportadores experimentados como Okelcor preparan facturas comerciales completas con códigos HS verificados para cada envío.",
          "Para el flete marítimo, los envíos de neumáticos se contienen generalmente en contenedores de 20 o 40 pies según el volumen. Los neumáticos PCR estándar pueden apilarse y cargarse eficientemente para maximizar el uso del contenedor, pero los neumáticos TBR requieren una carga más cuidadosa debido a su tamaño y peso. Los pesos de los contenedores deben cumplir con las regulaciones VGM (Masa Bruta Verificada) bajo el convenio SOLAS, aplicable a todo el flete marítimo a nivel mundial.",
          "El seguro es un elemento frecuentemente ignorado en la logística internacional de neumáticos. Aunque muchos transitarios ofrecen un seguro de carga básico, las características de valor específicas de los envíos de neumáticos justifican una cobertura de carga dedicada. Los compradores deben confirmar si la cotización FOB de su proveedor incluye seguro, o si necesitan contratar un seguro de carga marítima independiente para cada consignación.",
        ],
      },
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** English articles — used by server pages for generateStaticParams and generateMetadata */
export const ALL_ARTICLES: Article[] = ALL_ARTICLE_DATA.map(({ slug, image, locales }) => ({
  slug, image, ...locales.en,
}));

/** Localized articles — used by client components */
export function getLocalizedArticles(locale: Locale): Article[] {
  return ALL_ARTICLE_DATA.map(({ slug, image, locales }) => ({
    slug, image, ...locales[locale],
  }));
}

/** Single localized article by slug */
export function getLocalizedArticle(slug: string, locale: Locale): Article | undefined {
  const data = ALL_ARTICLE_DATA.find((a) => a.slug === slug);
  if (!data) return undefined;
  return { slug: data.slug, image: data.image, ...data.locales[locale] };
}

/** Related articles by slug, using original English categories for grouping */
export function getLocalizedRelatedArticles(slug: string, locale: Locale, count = 3): Article[] {
  const source = ALL_ARTICLE_DATA.find((a) => a.slug === slug);
  if (!source) return [];
  const sourceCategory = source.locales.en.category;

  const relatedSlugs = ALL_ARTICLE_DATA
    .filter((a) => a.locales.en.category === sourceCategory && a.slug !== slug)
    .concat(ALL_ARTICLE_DATA.filter((a) => a.slug !== slug))
    .filter((a, i, arr) => arr.findIndex((x) => x.slug === a.slug) === i)
    .slice(0, count)
    .map((a) => a.slug);

  return relatedSlugs
    .map((s) => getLocalizedArticle(s, locale))
    .filter(Boolean) as Article[];
}

/** Legacy helper — server usage only */
export function getArticleBySlug(slug: string): Article | undefined {
  return ALL_ARTICLES.find((a) => a.slug === slug);
}

/** Legacy helper — server usage only */
export function getRelatedArticles(article: Article, count = 3): Article[] {
  return ALL_ARTICLES.filter(
    (a) => a.category === article.category && a.slug !== article.slug
  )
    .concat(ALL_ARTICLES.filter((a) => a.slug !== article.slug))
    .filter((a, i, arr) => arr.findIndex((x) => x.slug === a.slug) === i)
    .slice(0, count);
}
