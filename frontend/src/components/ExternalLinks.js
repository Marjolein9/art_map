/**
 * ExternalLinks Component
 *
 * Displays external resource links for a country.
 * Handles Gapminder Dollar Street, Food Atlas, and other external links.
 *
 * @param {Object} externalLinks - External links data object
 * @param {string} externalLinks.gapminder_url - Gapminder Dollar Street URL
 * @param {string} externalLinks.tasteatlas_url - TasteAtlas URL
 * @param {string} externalLinks.extra_links - Additional external links
 * @param {string} countryName - Name of the country
 */
const ExternalLinks = ({ externalLinks, countryName }) => {
  // Return null if no links are available
  if (!externalLinks ||
      (!externalLinks.gapminder_url?.trim() &&
       !externalLinks.tasteatlas_url?.trim() &&
       !externalLinks.extra_links?.trim())) {
    return null;
  }

  return (
    <div className="external-links-section">
      <h4 className="section-header section-header--external">External Resources</h4>
      <div className="external-links-list">
        {externalLinks.gapminder_url?.trim() && (
          <div className="card-item card-item--padded">
            <a
              href={externalLinks.gapminder_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Gapminder's Dollar Street
            </a>
            : How people live in {countryName || 'this country'}
          </div>
        )}
        {externalLinks.tasteatlas_url?.trim() && (
          <div className="card-item card-item--padded">
            <a
              href={externalLinks.tasteatlas_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              TasteAtlas
            </a>
            : Food from {countryName || 'this country'}
          </div>
        )}
        {externalLinks.extra_links?.trim() && (
          <a
            href={externalLinks.extra_links}
            target="_blank"
            rel="noopener noreferrer"
            className="card-item card-item--padded"
          >
            Additional Links
          </a>
        )}
      </div>
    </div>
  );
};

export default ExternalLinks;
