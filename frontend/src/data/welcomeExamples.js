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
        'Albert Kahn': {
          collection_type: 'Albert Kahn',
          collection_description: 'Photographs from Albert Kahn\'s project to document everyday life with color photography in the early 20th century organized by the location the photograph was taken.',
          title: 'A Woman and Her Child Pose for the Photographer',
          location: 'Cairo, Egypt',
          date: '1914',
          mission: '1914 - Egypt - Auguste Léon - (January-February)',
          page_url: 'https://collections.albert-kahn.hauts-de-seine.fr/document/une-femme-et-son-enfant-posent-pour-l-operateur/617a7a44cf8b8968b3384d52',
          filepath: '/welcome-examples/egy-woman-child.jpg',
        },
      },
    },
    {
      iso3: 'GRC',
      name: 'Greece',
      collections: {
        'Children in Art': {
          collection_type: 'Children in Art',
          collection_description: 'Artwork that depicts children from artists from each country, mostly found using WikiArt. All categories are incomplete, but this one is especially so due to my lack of art knowledge.',
          title: 'Peek-a-Boo',
          artist_name: 'Nikolaos Gyzis',
          artist_nationality: 'Greek',
          work_url: 'https://www.wikiart.org/en/nikolaos-gyzis/peek-a-boo',
          source: 'wiki commons',
          filepath: '/welcome-examples/grc-peek-a-boo.jpg',
        },
      },
    },
    {
      iso3: 'LVA',
      name: 'Latvia',
      collections: {
        'Met Museum': {
          collection_type: 'Met Museum',
          collection_description: 'Metropolitan Museum of Art collection items related to the selected country. The Met collection often includes extensive background information on the items.',
          title: 'Coat',
          culture: 'Latvian',
          object_date: '19th century',
          medium: 'Wool, silk',
          object_url: 'https://www.metmuseum.org/art/collection/search/84280',
          filepath: '/welcome-examples/lva-coat.jpg',
        },
      },
    },
    {
      iso3: 'DEU',
      name: 'Germany',
      collections: {
        'Public Domain Review': {
          collection_type: 'Public Domain Review',
          collection_description: 'Images from Public Domain Review essays that relate to selected country. The Public Domain Review is a free online journal that reviews works in the public domain.',
          title: 'Our Mortal Waltz: The Dance of Death Across Centuries',
          description: 'Call of Death by Käthe Kollwitz',
          source_link: 'https://www.kollwitz.de/en/sheet-8-call-of-death',
          source_url: 'https://publicdomainreview.org/essay/our-mortal-waltz-the-dance-of-death-across-centuries/',
          filepath: '/welcome-examples/deu-waltz.jpg',
        },
      },
    },
  ],
};
