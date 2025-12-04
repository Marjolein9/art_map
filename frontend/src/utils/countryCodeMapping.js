/**
 * Utility to convert TopoJSON country properties to ISO 3-letter codes
 *
 * Our TopoJSON (from world-atlas) only contains:
 * - id: M49 numeric code (e.g., "840" for USA, "250" for France)
 * - name: Country name (e.g., "United States of America")
 *
 * We map M49 codes to ISO3 codes using the UN M49 standard.
 */

// M49 numeric code → ISO3 mapping
// Source: UN M49 standard (https://unstats.un.org/unsd/methodology/m49/)
const M49_TO_ISO3 = {
  '4': 'AFG',    // Afghanistan
  '8': 'ALB',    // Albania
  '12': 'DZA',   // Algeria
  '16': 'ASM',   // American Samoa
  '20': 'AND',   // Andorra
  '24': 'AGO',   // Angola
  '660': 'AIA',  // Anguilla
  '10': 'ATA',   // Antarctica
  '28': 'ATG',   // Antigua and Barbuda
  '32': 'ARG',   // Argentina
  '51': 'ARM',   // Armenia
  '533': 'ABW',  // Aruba
  '36': 'AUS',   // Australia
  '40': 'AUT',   // Austria
  '31': 'AZE',   // Azerbaijan
  '44': 'BHS',   // Bahamas
  '48': 'BHR',   // Bahrain
  '50': 'BGD',   // Bangladesh
  '52': 'BRB',   // Barbados
  '112': 'BLR',  // Belarus
  '56': 'BEL',   // Belgium
  '84': 'BLZ',   // Belize
  '204': 'BEN',  // Benin
  '60': 'BMU',   // Bermuda
  '64': 'BTN',   // Bhutan
  '68': 'BOL',   // Bolivia
  '535': 'BES',  // Bonaire, Sint Eustatius and Saba
  '70': 'BIH',   // Bosnia and Herzegovina
  '72': 'BWA',   // Botswana
  '74': 'BVT',   // Bouvet Island
  '76': 'BRA',   // Brazil
  '86': 'IOT',   // British Indian Ocean Territory
  '96': 'BRN',   // Brunei Darussalam
  '100': 'BGR',  // Bulgaria
  '854': 'BFA',  // Burkina Faso
  '108': 'BDI',  // Burundi
  '132': 'CPV',  // Cabo Verde
  '116': 'KHM',  // Cambodia
  '120': 'CMR',  // Cameroon
  '124': 'CAN',  // Canada
  '136': 'CYM',  // Cayman Islands
  '140': 'CAF',  // Central African Republic
  '148': 'TCD',  // Chad
  '152': 'CHL',  // Chile
  '156': 'CHN',  // China
  '162': 'CXR',  // Christmas Island
  '166': 'CCK',  // Cocos (Keeling) Islands
  '170': 'COL',  // Colombia
  '174': 'COM',  // Comoros
  '180': 'COD',  // Congo (Democratic Republic)
  '178': 'COG',  // Congo
  '184': 'COK',  // Cook Islands
  '188': 'CRI',  // Costa Rica
  '384': 'CIV',  // Côte d'Ivoire
  '191': 'HRV',  // Croatia
  '192': 'CUB',  // Cuba
  '531': 'CUW',  // Curaçao
  '196': 'CYP',  // Cyprus
  '203': 'CZE',  // Czechia
  '208': 'DNK',  // Denmark
  '262': 'DJI',  // Djibouti
  '212': 'DMA',  // Dominica
  '214': 'DOM',  // Dominican Republic
  '218': 'ECU',  // Ecuador
  '818': 'EGY',  // Egypt
  '222': 'SLV',  // El Salvador
  '226': 'GNQ',  // Equatorial Guinea
  '232': 'ERI',  // Eritrea
  '233': 'EST',  // Estonia
  '748': 'SWZ',  // Eswatini
  '231': 'ETH',  // Ethiopia
  '238': 'FLK',  // Falkland Islands
  '234': 'FRO',  // Faroe Islands
  '242': 'FJI',  // Fiji
  '246': 'FIN',  // Finland
  '250': 'FRA',  // France
  '254': 'GUF',  // French Guiana
  '258': 'PYF',  // French Polynesia
  '260': 'ATF',  // French Southern Territories
  '266': 'GAB',  // Gabon
  '270': 'GMB',  // Gambia
  '268': 'GEO',  // Georgia
  '276': 'DEU',  // Germany
  '288': 'GHA',  // Ghana
  '292': 'GIB',  // Gibraltar
  '300': 'GRC',  // Greece
  '304': 'GRL',  // Greenland
  '308': 'GRD',  // Grenada
  '312': 'GLP',  // Guadeloupe
  '316': 'GUM',  // Guam
  '320': 'GTM',  // Guatemala
  '831': 'GGY',  // Guernsey
  '324': 'GIN',  // Guinea
  '624': 'GNB',  // Guinea-Bissau
  '328': 'GUY',  // Guyana
  '332': 'HTI',  // Haiti
  '334': 'HMD',  // Heard Island and McDonald Islands
  '336': 'VAT',  // Holy See
  '340': 'HND',  // Honduras
  '344': 'HKG',  // Hong Kong
  '348': 'HUN',  // Hungary
  '352': 'ISL',  // Iceland
  '356': 'IND',  // India
  '360': 'IDN',  // Indonesia
  '364': 'IRN',  // Iran
  '368': 'IRQ',  // Iraq
  '372': 'IRL',  // Ireland
  '833': 'IMN',  // Isle of Man
  '376': 'ISR',  // Israel
  '380': 'ITA',  // Italy
  '388': 'JAM',  // Jamaica
  '392': 'JPN',  // Japan
  '832': 'JEY',  // Jersey
  '400': 'JOR',  // Jordan
  '398': 'KAZ',  // Kazakhstan
  '404': 'KEN',  // Kenya
  '296': 'KIR',  // Kiribati
  '408': 'PRK',  // Korea (North)
  '410': 'KOR',  // Korea (South)
  '414': 'KWT',  // Kuwait
  '417': 'KGZ',  // Kyrgyzstan
  '418': 'LAO',  // Laos
  '428': 'LVA',  // Latvia
  '422': 'LBN',  // Lebanon
  '426': 'LSO',  // Lesotho
  '430': 'LBR',  // Liberia
  '434': 'LBY',  // Libya
  '438': 'LIE',  // Liechtenstein
  '440': 'LTU',  // Lithuania
  '442': 'LUX',  // Luxembourg
  '446': 'MAC',  // Macao
  '450': 'MDG',  // Madagascar
  '454': 'MWI',  // Malawi
  '458': 'MYS',  // Malaysia
  '462': 'MDV',  // Maldives
  '466': 'MLI',  // Mali
  '470': 'MLT',  // Malta
  '584': 'MHL',  // Marshall Islands
  '474': 'MTQ',  // Martinique
  '478': 'MRT',  // Mauritania
  '480': 'MUS',  // Mauritius
  '175': 'MYT',  // Mayotte
  '484': 'MEX',  // Mexico
  '583': 'FSM',  // Micronesia
  '498': 'MDA',  // Moldova
  '492': 'MCO',  // Monaco
  '496': 'MNG',  // Mongolia
  '499': 'MNE',  // Montenegro
  '500': 'MSR',  // Montserrat
  '504': 'MAR',  // Morocco
  '508': 'MOZ',  // Mozambique
  '104': 'MMR',  // Myanmar
  '516': 'NAM',  // Namibia
  '520': 'NRU',  // Nauru
  '524': 'NPL',  // Nepal
  '528': 'NLD',  // Netherlands
  '540': 'NCL',  // New Caledonia
  '554': 'NZL',  // New Zealand
  '558': 'NIC',  // Nicaragua
  '562': 'NER',  // Niger
  '566': 'NGA',  // Nigeria
  '570': 'NIU',  // Niue
  '574': 'NFK',  // Norfolk Island
  '580': 'MNP',  // Northern Mariana Islands
  '578': 'NOR',  // Norway
  '512': 'OMN',  // Oman
  '586': 'PAK',  // Pakistan
  '585': 'PLW',  // Palau
  '275': 'PSE',  // Palestine
  '591': 'PAN',  // Panama
  '598': 'PNG',  // Papua New Guinea
  '600': 'PRY',  // Paraguay
  '604': 'PER',  // Peru
  '608': 'PHL',  // Philippines
  '612': 'PCN',  // Pitcairn
  '616': 'POL',  // Poland
  '620': 'PRT',  // Portugal
  '630': 'PRI',  // Puerto Rico
  '634': 'QAT',  // Qatar
  '807': 'MKD',  // Republic of North Macedonia
  '638': 'REU',  // Réunion
  '642': 'ROU',  // Romania
  '643': 'RUS',  // Russian Federation
  '646': 'RWA',  // Rwanda
  '652': 'BLM',  // Saint Barthélemy
  '654': 'SHN',  // Saint Helena
  '659': 'KNA',  // Saint Kitts and Nevis
  '662': 'LCA',  // Saint Lucia
  '663': 'MAF',  // Saint Martin (French)
  '666': 'SPM',  // Saint Pierre and Miquelon
  '670': 'VCT',  // Saint Vincent and the Grenadines
  '882': 'WSM',  // Samoa
  '674': 'SMR',  // San Marino
  '678': 'STP',  // Sao Tome and Principe
  '682': 'SAU',  // Saudi Arabia
  '686': 'SEN',  // Senegal
  '688': 'SRB',  // Serbia
  '690': 'SYC',  // Seychelles
  '694': 'SLE',  // Sierra Leone
  '702': 'SGP',  // Singapore
  '534': 'SXM',  // Sint Maarten (Dutch)
  '703': 'SVK',  // Slovakia
  '705': 'SVN',  // Slovenia
  '90': 'SLB',   // Solomon Islands
  '706': 'SOM',  // Somalia
  '710': 'ZAF',  // South Africa
  '239': 'SGS',  // South Georgia and the South Sandwich Islands
  '728': 'SSD',  // South Sudan
  '724': 'ESP',  // Spain
  '144': 'LKA',  // Sri Lanka
  '729': 'SDN',  // Sudan
  '740': 'SUR',  // Suriname
  '744': 'SJM',  // Svalbard and Jan Mayen
  '752': 'SWE',  // Sweden
  '756': 'CHE',  // Switzerland
  '760': 'SYR',  // Syrian Arab Republic
  '158': 'TWN',  // Taiwan
  '762': 'TJK',  // Tajikistan
  '834': 'TZA',  // Tanzania
  '764': 'THA',  // Thailand
  '626': 'TLS',  // Timor-Leste
  '768': 'TGO',  // Togo
  '772': 'TKL',  // Tokelau
  '776': 'TON',  // Tonga
  '780': 'TTO',  // Trinidad and Tobago
  '788': 'TUN',  // Tunisia
  '792': 'TUR',  // Turkey
  '795': 'TKM',  // Turkmenistan
  '796': 'TCA',  // Turks and Caicos Islands
  '798': 'TUV',  // Tuvalu
  '800': 'UGA',  // Uganda
  '804': 'UKR',  // Ukraine
  '784': 'ARE',  // United Arab Emirates
  '826': 'GBR',  // United Kingdom
  '581': 'UMI',  // United States Minor Outlying Islands
  '840': 'USA',  // United States of America
  '858': 'URY',  // Uruguay
  '860': 'UZB',  // Uzbekistan
  '548': 'VUT',  // Vanuatu
  '862': 'VEN',  // Venezuela
  '704': 'VNM',  // Viet Nam
  '92': 'VGB',   // Virgin Islands (British)
  '850': 'VIR',  // Virgin Islands (U.S.)
  '876': 'WLF',  // Wallis and Futuna
  '732': 'ESH',  // Western Sahara
  '887': 'YEM',  // Yemen
  '894': 'ZMB',  // Zambia
  '716': 'ZWE',  // Zimbabwe
  '248': 'ALA',  // Åland Islands
};

/**
 * Extract the correct ISO 3-letter code from TopoJSON properties
 * @param {Object} properties - The properties object from TopoJSON feature
 * @returns {string|null} - The 3-letter ISO code or null
 */
export const getCountryIsoCode = (properties) => {
  if (!properties) return null;

  // Our TopoJSON uses M49 numeric code as 'id'
  const m49Code = properties.id;

  if (m49Code && M49_TO_ISO3[m49Code]) {
    return M49_TO_ISO3[m49Code];
  }

  // No M49 code found - this shouldn't happen with our TopoJSON
  console.warn(`⚠️ No M49 mapping for country:`, properties);
  return null;
};

/**
 * Get country name from properties
 * @param {Object} properties - The properties object from TopoJSON feature
 * @returns {string} - The country name
 */
export const getCountryName = (properties) => {
  if (!properties) return 'Unknown';
  return properties.name || 'Unknown';
};
