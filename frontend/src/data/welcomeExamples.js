/**
 * Welcome Overlay - Hardcoded Example Data
 * 
 * These are actual example images and captions from the API data,
 * stored locally to avoid backend API calls on initial load.
 * Images are stored in public/welcome-examples/
 */

export const welcomeExamples = {
  countries: [
    {
      iso3: 'EGY',
      name: 'Egypt',
      mortalityData: {
        year1990: 61.4,
        year2023: 20.5,
      },
      collections: {
        'Albert Kahn Archives of the Planet': {
          title: 'A Woman and Her Child Pose for the Photographer',
          subtitle: 'The Color of Memory',
          date: '1914',
          source: 'Musée départemental Albert-Kahn',
          link: 'https://collections.albert-kahn.hauts-de-seine.fr/document/une-femme-et-son-enfant-posent-pour-l-operateur/617a7a44cf8b8968b3384d52?filtrerParThme%5B0%5D=Etres%20humains&wm=1&filtrerParSousthme%5B0%5D=Femme&filtrerParMission%5B0%5D=1914%20-%20Egypte%20-%20Auguste%20L%C3%A9on%20%20-%20%28janvier-f%C3%A9vrier%29&pos=35&pgn=2',
          description: 'From Albert Kahn\'s groundbreaking Archives de la Planète, an ambitious global project to document and preserve the changing world through color autochrome photography. By 1940, Kahn had amassed over 72,000 autochromes, a precursor to modern color photography.',
          image: '/welcome-examples/egy-woman-child.jpg',
        },
      },
    },
    {
      iso3: 'GRC',
      name: 'Greece',
      mortalityData: {
        year1990: 8.5,
        year2023: 3.9,
      },
      collections: {
        'Children in Art': {
          title: 'Peek-a-Boo',
          subtitle: 'Likely modeled by artist\'s family',
          artist: 'Nikolaos Gyzis',
          nationality: 'Greek',
          source: 'Wikimedia Commons',
          image: '/welcome-examples/grc-peek-a-boo.jpg',
        },
      },
    },
    {
      iso3: 'LVA',
      name: 'Latvia',
      mortalityData: {
        year1990: 13.6,
        year2023: 5.4,
      },
      collections: {
        'Met Museum': {
          title: 'Coat',
          nationality: 'Latvian',
          date: 'ca. 1900',
          source: 'Metropolitan Museum of Art',
          link: 'https://www.metmuseum.org/art/collection/search/84280',
          image: '/welcome-examples/lva-coat.jpg',
        },
      },
    },
    {
      iso3: 'DEU',
      name: 'Germany',
      mortalityData: {
        year1990: 7.6,
        year2023: 3.8,
      },
      collections: {
        'Public Domain Review': {
          title: 'Call of Death',
          subtitle: 'Our Mortal Waltz: The Dance of Death Across Centuries',
          artist: 'Käthe Kollwitz',
          date: '1937',
          source: 'Public Domain Review',
          link: 'https://www.kollwitz.de/en/sheet-8-call-of-death',
          image: '/welcome-examples/deu-waltz.jpg',
        },
      },
    },
  ],
};

/**
 * Get a random welcome country example
 */
export const getRandomWelcomeExample = () => {
  const countries = welcomeExamples.countries;
  return countries[Math.floor(Math.random() * countries.length)];
};

/**
 * Get a specific welcome example by ISO3 code
 */
export const getWelcomeExampleByIso = (iso3) => {
  return welcomeExamples.countries.find(country => country.iso3 === iso3);
};
