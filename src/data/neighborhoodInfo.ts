export interface NeighborhoodInfo {
  blurb: string;
  facts: string[];
  faqs: { q: string; a: string }[];
}

const REGION_LABELS: Record<string, string> = {
  greater_accra: "Greater Accra Region",
  ashanti: "Ashanti Region",
  central: "Central Region",
  ahafo: "Ahafo Region",
  bono: "Bono Region",
  bono_east: "Bono East Region",
  eastern: "Eastern Region",
  north_east: "North East Region",
  northern: "Northern Region",
  oti: "Oti Region",
  savannah: "Savannah Region",
  upper_east: "Upper East Region",
  upper_west: "Upper West Region",
  volta: "Volta Region",
  western: "Western Region",
  western_north: "Western North Region",
};

export function getRegionDisplay(region: string | undefined): string {
  if (!region) return '';
  const key = region.trim().toLowerCase().replace(/\s+/g, '_');
  if (REGION_LABELS[key]) return REGION_LABELS[key];
  return key
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const NEIGHBORHOOD_INFO: Record<string, Record<string, NeighborhoodInfo>> = {
  greater_accra: {
    'East Legon': {
      blurb:
        "East Legon is one of Accra's most established upscale residential neighbourhoods, popular with professionals, families and students. It sits a short drive from the University of Ghana at Legon and hosts a mix of standalone houses, apartment blocks, embassies and corporate offices. The area is known for its tree-lined streets, proximity to the airport and a growing selection of restaurants, shops and entertainment venues, including the A&C Mall and the commercial strip around Cota Gardens.",
      facts: [
        'Sits alongside the University of Ghana at Legon and its surrounding satellite areas.',
        'Home to the A&C Mall, one of Accra\u2019s early modern shopping centres.',
        'Contains several embassies and international schools, giving it a strong diplomatic and expatriate presence.',
        'Well served by the Airport bypass road and the main Legon arterial routes.',
      ],
      faqs: [
        {
          q: 'What is the character of East Legon?',
          a: "East Legon is a well-established, largely residential suburb with an upscale feel. It is popular with families, professionals and students because of its relative calm, leafy streets and the convenience of nearby shops, schools and the university.",
        },
        {
          q: 'Is East Legon well-connected?',
          a: "Yes. East Legon sits close to the airport, the University of Ghana and the main Accra\u2013Legon roads, with frequent trotro routes and easy taxi access to the city centre and surrounding districts.",
        },
        {
          q: 'What kind of properties are common in East Legon?',
          a: 'You will find a wide mix of detached houses, townhouses and purpose-built apartment blocks, alongside guest houses and commercial premises. Options range from compact flats to larger family homes with gardens.',
        },
      ],
    },
    Cantonments: {
      blurb:
        "Cantonments is one of Accra's oldest and most prestigious residential districts, long associated with the diplomatic community. Its quiet, tree-shaded streets are lined with embassies, high commissions and grand colonial-era and modern residences. The area borders Osu to the south and is a short drive from both the city centre and the airport, which keeps it a highly sought-after location for those who value privacy and convenience.",
      facts: [
        'Contains a high concentration of foreign embassies and high commissions.',
        'Borders Osu and Ringway Central, minutes from Accra\u2019s central business district.',
        'Known for generous plot sizes and mature trees along its streets.',
        'Close to landmarks such as the Accra International Conference Centre.',
      ],
      faqs: [
        {
          q: 'What is the character of Cantonments?',
          a: "Cantonments is a quiet, upmarket residential district with a strong diplomatic presence. Streets are generally calm and well maintained, making it popular with expatriates, senior professionals and families.",
        },
        {
          q: 'How close is Cantonments to the centre of Accra?',
          a: "Cantonments sits within about ten minutes' drive of the central business district, with Osu and the airport both nearby.",
        },
        {
          q: 'What type of housing is available in Cantonments?',
          a: 'The area is dominated by detached and semi-detached houses, many with large compounds, plus a number of modern apartment developments and embassy annexes.',
        },
      ],
    },
    Labone: {
      blurb:
        "Labone is a central Accra suburb that blends quiet residential streets with a growing café and restaurant scene. Located between Osu and Cantonments, it offers easy access to the city centre, the coast and the airport. The area is home to several embassies and diplomatic residences, as well as modern apartment blocks and older single-storey homes, giving it a friendly, established neighbourhood feel.",
      facts: [
        'Bordered by Osu, Cantonments and the Ring Road corridor.',
        'Hosts a mix of diplomatic residences and popular local cafés and eateries.',
        'A short walk from Osu\u2019s Oxford Street commercial strip.',
        'Well positioned for the Accra Polo Club and Labone Senior High School landmarks.',
      ],
      faqs: [
        {
          q: 'What is the character of Labone?',
          a: 'Labone is a central, family-oriented suburb with a mix of older homes and modern apartments. It feels established and walkable, with a cluster of cafés, restaurants and small shops nearby.',
        },
        {
          q: 'Is Labone convenient for daily life in Accra?',
          a: "Very. Labone sits close to Osu, Cantonments and the Ring Road, so most of Accra's central workplaces, schools and amenities are within a short drive.",
        },
        {
          q: 'What kinds of properties can be found in Labone?',
          a: 'Properties range from older detached houses on sizeable plots to newer low- and mid-rise apartment buildings, plus some commercial and mixed-use premises.',
        },
      ],
    },
    Osu: {
      blurb:
        "Osu is one of Accra's most vibrant and historic neighbourhoods, best known for Oxford Street and its lively mix of shops, restaurants, nightlife and offices. It combines commercial energy with residential pockets that include everything from compact flats to older family homes. Its central position between the central business district, Cantonments and the coast makes it one of the city's busiest and most connected areas.",
      facts: [
        "Oxford Street is Accra's most famous shopping and entertainment strip.",
        'Home to historic sites including the Osu Castle.',
        'A dense mix of retail, dining, hotels, offices and residential accommodation.',
        'Served by numerous trotro routes and close to the central business district.',
      ],
      faqs: [
        {
          q: 'What is the character of Osu?',
          a: "Osu is energetic and densely developed, with a strong commercial and social scene around Oxford Street. Away from the main strip, quieter residential streets offer flats and houses within walking distance of the action.",
        },
        {
          q: 'Is Osu well-connected?',
          a: "Yes \u2014 Osu is one of the most connected parts of Accra, with frequent public transport, easy taxi access and short drives to the city centre, Cantonments, Labone and the airport.",
        },
        {
          q: 'What kind of properties are available in Osu?',
          a: 'Mostly apartments and flats, along with townhouses and a smaller number of detached houses. It suits renters who value being close to work and entertainment.',
        },
      ],
    },
    Spintex: {
      blurb:
        "Spintex Road is a long commercial and residential corridor stretching from Accra towards Tema, and the surrounding neighbourhoods have grown rapidly into popular commuter areas. Communities such as Community 25 and Adjiriganor offer a wide range of apartment living, from single rooms to two- and three-bedroom flats. The corridor is lined with shops, offices and schools, and provides direct road access to both Accra's business districts and the industrial city of Tema.",
      facts: [
        'Runs directly between Accra and Tema, with easy access to the Tema Motorway.',
        'Hosts a dense mix of residential compounds, flats and gated developments.',
        'Well served by schools, shops, banks and restaurants along the corridor.',
        'Popular with young professionals who work in Accra but prefer newer housing.',
      ],
      faqs: [
        {
          q: 'What is the character of the Spintex area?',
          a: "Spintex is a busy, fast-growing corridor mixing residential communities with commercial activity. It is especially popular with young professionals and families looking for newer, more affordable apartments than those closer to the city centre.",
        },
        {
          q: 'Is Spintex well-connected?',
          a: "Yes. Spintex Road links Accra directly to Tema and the Tema Motorway, and frequent trotros and taxis run along the corridor throughout the day.",
        },
        {
          q: 'What types of properties are common around Spintex?',
          a: 'Self-contained apartments, compound houses and some gated communities dominate, ranging from single rooms to larger family flats.',
        },
      ],
    },
    'Airport Residential Area': {
      blurb:
        "The Airport Residential Area is an upscale Accra neighbourhood that wraps around Kotoka International Airport. It is home to embassies, corporate offices, hotels and a mix of large detached houses and modern apartment blocks. Its central location, quiet streets and proximity to the airport, the city centre and major shopping destinations such as the Accra Mall make it one of the capital's most desirable addresses.",
      facts: [
        "Adjacent to Kotoka International Airport, Accra's main gateway.",
        'Contains numerous embassies, international organisations and corporate offices.',
        "Close to the Accra Mall, one of the country's largest shopping centres.",
        'Notable for generous plots, mature trees and an established upmarket character.',
      ],
      faqs: [
        {
          q: 'What is the character of the Airport Residential Area?',
          a: "It is an established, upscale suburb known for quiet streets, large houses and a strong presence of embassies and businesses. It is popular with executives, diplomats and families.",
        },
        {
          q: 'How well located is the Airport Residential Area?',
          a: 'Extremely well. The airport is next door, the central business district is roughly fifteen minutes away, and the Accra Mall and major arterial roads are all close by.',
        },
        {
          q: 'What kind of properties are found there?',
          a: 'Primarily large detached houses with gardens, plus modern apartment blocks and serviced developments. Both rental and sale stock tends toward the premium end of the market.',
        },
      ],
    },
    Dzorwulu: {
      blurb:
        "Dzorwulu is a residential suburb in north-western Accra, lying between the Achimota area and the Kanda highway. It is a quieter, leafy alternative to the busier central districts, popular with families and professionals. The area is well served by schools, churches and small commercial strips, and its proximity to the Kanda\u2013Dzorwulu junction provides convenient links towards the city centre and the Accra\u2013Nsawam road.",
      facts: [
        'Located between Achimota, New Town and the Kanda\u2013Dzorwulu highway junction.',
        'Hosts a mix of detached houses, compound houses and apartment blocks.',
        'Home to several reputable schools and churches in the surrounding area.',
        'Provides good access to the Accra\u2013Nsawam road and central Accra.',
      ],
      faqs: [
        {
          q: 'What is the character of Dzorwulu?',
          a: 'Dzorwulu is a comparatively calm, residential suburb with an established community feel. It mixes older family houses with newer apartment buildings and is popular with those seeking space away from the busiest parts of the city.',
        },
        {
          q: 'Is Dzorwulu well-connected?',
          a: 'Reasonably so. It sits along the Kanda\u2013Dzorwulu highway with easy access to Achimota, the Nsawam road and central Accra, though peak-hour traffic on nearby arterials can be heavy.',
        },
        {
          q: 'What type of properties can you find in Dzorwulu?',
          a: 'Detached and semi-detached houses on moderate plots, plus an increasing number of flats and purpose-built apartments.',
        },
      ],
    },
    Madina: {
      blurb:
        "Madina is a large, densely populated suburb in the north-eastern part of Accra, directly across from the University of Ghana at Legon. It is one of the city's busiest commercial hubs, centred on the Madina Market and the Zongo Junction area, while also offering substantial residential stock of compound houses, apartments and self-contained units. Its location along the Accra\u2013Aburi road and its proximity to the university make it a vibrant and affordable place to live.",
      facts: [
        'Borders the University of Ghana at Legon and Adenta to the north.',
        'Home to the large Madina Market and the busy Zongo Junction interchange.',
        'Well served by the Accra\u2013Aburi road and numerous trotro routes.',
        "One of Accra's most populous and commercially active suburbs.",
      ],
      faqs: [
        {
          q: 'What is the character of Madina?',
          a: 'Madina is lively, densely populated and strongly commercial, centred on the market and major junctions. Residential life revolves around compound houses and self-contained apartments, with everything from groceries to transport within easy reach.',
        },
        {
          q: 'Is Madina well-connected?',
          a: 'Yes. Madina sits on the Accra\u2013Aburi road with frequent public transport into central Accra, and it is adjacent to the University of Ghana and the Adenta\u2013Madina corridor.',
        },
        {
          q: 'What kind of housing is typical in Madina?',
          a: 'Mostly compound houses with single-room or self-contained units, plus some apartments and newer detached homes in the surrounding residential areas.',
        },
      ],
    },
    Tema: {
      blurb:
        "Tema is Ghana's principal port city, situated on the coast about 25 kilometres east of Accra along the Tema Motorway. It is a planned city whose numbered communities \u2014 from Tema Community 1 to Community 25 \u2014 are laid out around the port, industrial zones and residential estates. Tema is a major employment centre thanks to its harbour, factories and the adjacent free-zone enclave, while its residential areas range from older bungalow communities to newer estates.",
      facts: [
        "Home to Tema Harbour, Ghana's main seaport, and the Tema Industrial Area.",
        'A planned city with numbered communities, from Community 1 through Community 25.',
        'Linked to Accra by the Tema Motorway and the Accra\u2013Tema railway line.',
        'Serves as headquarters for many shipping, manufacturing and energy companies.',
      ],
      faqs: [
        {
          q: 'What is the character of Tema?',
          a: 'Tema is a planned industrial and port city with a strong employment base. Its numbered residential communities each have their own character, generally offering more space and lower density than central Accra.',
        },
        {
          q: 'Is Tema well-connected to Accra?',
          a: 'Yes. The Tema Motorway and the Accra\u2013Tema railway link the city to Accra in about half an hour by car, and frequent public transport runs along the corridor.',
        },
        {
          q: 'What types of properties are available in Tema?',
          a: 'A wide range, from bungalows and compound houses in the older communities to modern estates, flats and purpose-built apartments in the newer ones.',
        },
      ],
    },
  },
  ashanti: {
    Kumasi: {
      blurb:
        "Kumasi is the capital of the Ashanti Region and Ghana's second-largest city, often called the Garden City for its lush greenery. It is the country's historic and cultural heart, home to the Manhyia Palace, the Kejetia Market and the wider Asante traditional area. As a major commercial and educational centre, with institutions such as the Kwame Nkrumah University of Science and Technology, Kumasi offers a broad spectrum of residential areas, from central neighbourhoods like Adum and Asokwa to quieter suburbs such as Nhyiaeso and Ahodwo.",
      facts: [
        "Ghana's second-largest city and the seat of the Asantehene at Manhyia Palace.",
        "Hosts the Kejetia Market, one of West Africa's largest open-air markets.",
        'Home to the Kwame Nkrumah University of Science and Technology (KNUST).',
        'A major hub for trade, manufacturing and higher education.',
      ],
      faqs: [
        {
          q: 'What is the character of Kumasi?',
          a: 'Kumasi is a busy, culturally rich commercial city. Central areas are lively and market-driven, while its suburbs are greener and more residential, giving residents a wide choice of living environments.',
        },
        {
          q: 'Is Kumasi well-connected?',
          a: 'Yes. The city is linked to Accra and the rest of the country by road, rail and air, and has an extensive internal public transport network built around its central markets.',
        },
        {
          q: 'What kinds of properties are common in Kumasi?',
          a: 'Everything from compound houses and self-contained rooms in central areas to detached houses, bungalows and apartments in the residential suburbs.',
        },
      ],
    },
  },
  central: {
    Kasoa: {
      blurb:
        "Kasoa is a fast-growing peri-urban town on the Accra\u2013Cape Coast highway, just west of the Greater Accra boundary. Over the past two decades it has expanded rapidly, with wave after wave of new self-contained houses, apartments and gated developments transforming the area. Kasoa is popular with people who work in Accra but want more affordable accommodation, and its position on the main western corridor keeps it well connected to both the capital and the Central Region.",
      facts: [
        'Sits on the Accra\u2013Cape Coast highway, roughly 30 kilometres west of Accra.',
        "One of Ghana's fastest-growing settlements in recent decades.",
        'Characterised by a large stock of new self-contained houses and apartments.',
        'Well served by trotros and shared taxis running into Accra and Winneba.',
      ],
      faqs: [
        {
          q: 'What is the character of Kasoa?',
          a: 'Kasoa is a rapidly developing town combining older settlements with large areas of new housing. It has a lively commercial centre along the highway and a strong commuter population.',
        },
        {
          q: 'Is Kasoa well-connected to Accra?',
          a: 'Yes. Kasoa lies directly on the Accra\u2013Cape Coast highway and is served by frequent trotros and shared taxis, though peak-hour traffic towards Accra can be heavy.',
        },
        {
          q: 'What kind of properties are available in Kasoa?',
          a: 'Mostly new self-contained houses and apartments, including gated compounds, with options ranging from single rooms to multi-bedroom family homes.',
        },
      ],
    },
  },
  western: {
    Takoradi: {
      blurb:
        "Takoradi, together with its twin city Sekondi, forms the Sekondi\u2013Takoradi metropolis on Ghana's western coast. It is the capital of the Western Region and the country's oil and gas hub, with the Takoradi Port and industries ranging from logistics to energy anchoring the local economy. The city has seen significant growth in recent years, with new residential estates, apartments and commercial developments accompanying its industrial expansion.",
      facts: [
        "Capital of the Western Region and the centre of Ghana's oil and gas industry.",
        'Takoradi Harbour serves as a major commercial and fishing port.',
        'Twin city of Sekondi, with the metropolis often treated as one urban area.',
        'Fast-growing skyline of hotels, offices and new residential developments.',
      ],
      faqs: [
        {
          q: 'What is the character of Takoradi?',
          a: 'Takoradi is an energetic coastal city built around the port and the energy industry. It combines older residential quarters with newer estates and a growing service sector.',
        },
        {
          q: 'Is Takoradi well-connected?',
          a: 'Yes. The city has an airport, the Takoradi Harbour and road links along the coast to Accra and inland to the mining areas of the Western and Central regions.',
        },
        {
          q: 'What types of properties can be found in Takoradi?',
          a: 'A mix of bungalows, compound houses, modern detached homes and apartments, with newer developments concentrated around the expanding residential estates.',
        },
      ],
    },
  },
};

function normalizeRegionKey(region: string | undefined): string {
  return (region || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function normalizeName(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

export function getNeighborhoodInfo(
  region: string | undefined,
  neighborhood: string | undefined
): NeighborhoodInfo | null {
  const regionKey = normalizeRegionKey(region);
  const hoodKey = normalizeName(neighborhood);
  if (!regionKey || !hoodKey) return null;
  const areaMap = NEIGHBORHOOD_INFO[regionKey];
  if (!areaMap) return null;
  return areaMap[hoodKey] ?? null;
}

export function getNeighborhoodFallback(
  region: string | undefined,
  neighborhood: string | undefined
): NeighborhoodInfo {
  const regionName = getRegionDisplay(region);
  const area = neighborhood || regionName || 'This area';
  return {
    blurb: `${area} is part of ${regionName || 'Ghana'}'s active property market. Demand, property types and pricing can change quickly, so the current listings on Property Hub GH are the best way to see what is available right now.`,
    facts: [
      'Property types, prices and availability vary widely within this area.',
      'The most reliable way to gauge the market here is to review live listings on Property Hub GH.',
    ],
    faqs: [
      {
        q: `What is the character of ${area}?`,
        a: `${area} is part of ${regionName || 'Ghana'}'s active property market, with a range of residential and commercial options available to renters and buyers.`,
      },
      {
        q: `How can I find out what is available in ${area}?`,
        a: 'Browse the current listings on Property Hub GH for the latest properties, prices and contact details, and message the lister directly through the listing page.',
      },
    ],
  };
}
