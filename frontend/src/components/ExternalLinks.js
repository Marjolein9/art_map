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
 */
const ExternalLinks = ({ externalLinks }) => {
  // Return null if no links are available
  if (!externalLinks ||
      (!externalLinks.gapminder_url?.trim() &&
       !externalLinks.tasteatlas_url?.trim() &&
       !externalLinks.extra_links?.trim())) {
    return null;
  }

  return (
    <div className="external-links-section">
      <h4 className="external-links-title">External Resources</h4>
      <div className="external-links-list">
        {externalLinks.gapminder_url?.trim() && (
          <a
            href={externalLinks.gapminder_url}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            Gapminder Dollar Street
          </a>
        )}
        {externalLinks.tasteatlas_url?.trim() && (
          <a
            href={externalLinks.tasteatlas_url}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            Food Atlas
          </a>
        )}
        {externalLinks.extra_links?.trim() && (
          <a
            href={externalLinks.extra_links}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            Additional Links
          </a>
        )}
      </div>
    </div>
  );
};

export default ExternalLinks;
