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
            'Photographs from Albert Kahn’s project to document everyday life with color photography in the early 20th century organized by the location the photograph was taken.',
          link:
            'https://albert-kahn.hauts-de-seine.fr/',
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
            'Artwork that depicts children from artists from each country, mostly found using WikiArt. All categories are incomplete, but this one is especially so due to my lack of art knowledge.',
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
            'Metropolitan Museum of Art collection items related to the selected country. The Met collection often includes extensive background information on the items.',
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
            'Images from Public Domain Review essays that relate to selected country. The Public Domain Review is a free online journal that reviews works in the public domain.',
          link: 'https://publicdomainreview.org/essay/our-mortal-waltz-the-dance-of-death-across-centuries/',
          image: '/welcome-examples/deu-waltz.jpg',
        },
      },
    },
  ],
};
