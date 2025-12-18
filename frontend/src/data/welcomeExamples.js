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
      collections: {
        "Albert Kahn's Archives of the Planet": {
          title: 'A Woman and Her Child Pose for the Photographer',
          source: 'Musée départemental Albert-Kahn',
          description:
            'Photographs from Albert Kahn’s project to document everyday life with color photography in the early 20th century.',
          link:
            'https://albert-kahn.hauts-de-seine.fr/collections/en/document/une-femme-et-son-enfant-posent-pour-l-operateur/617a7a44cf8b8968b3384d52',
          image: '/welcome-examples/egy-woman-child.jpg',
        },
      },
    },
    {
      iso3: 'GRC',
      name: 'Greece',
      collections: {
        'Children in Art': {
          title: 'Peek-a-Boo',
          artist: 'Nikolaos Gyzis',
          nationality: 'Greek',
          source: 'Children in Art',
          description:
            'Artwork that depicts children from artists from each country, mostly found using WikiArt and limited by my lack of art knowledge. All categories are incomplete, but this one is especially so.',
          link: 'https://www.wikiart.org/en/nikolaos-gyzis',
          image: '/welcome-examples/grc-peek-a-boo.jpg',
        },
      },
    },
    {
      iso3: 'LVA',
      name: 'Latvia',
      collections: {
        'Met Museum': {
          title: 'Coat',
          nationality: 'Latvian',
          source: 'Metropolitan Museum of Art',
          description:
            'Art from the Metropolitan Museum of Art.',
          link: 'https://www.metmuseum.org/art/collection/search/84280',
          image: '/welcome-examples/lva-coat.jpg',
        },
      },
    },
    {
      iso3: 'DEU',
      name: 'Germany',
      collections: {
        'Public Domain Review': {
          title: 'Call of Death',
          subtitle: 'Our Mortal Waltz: The Dance of Death Across Centuries',
          artist: 'Käthe Kollwitz',
          source: 'Public Domain Review',
          description:
            'Images from The Public Domain Review, a online journal with essays on public domain works',
          link: 'https://publicdomainreview.org/essay/our-mortal-waltz-the-dance-of-death-across-centuries/',
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
  return welcomeExamples.countries.find(
    (country) => country.iso3 === iso3
  );
};
