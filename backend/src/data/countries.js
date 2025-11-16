// Country data with ISO codes, neighboring countries, and continents
const countriesData = [
  { name: "United States", iso: "USA", continent: "North America", neighbors: ["CAN", "MEX"] },
  { name: "Canada", iso: "CAN", continent: "North America", neighbors: ["USA"] },
  { name: "Mexico", iso: "MEX", continent: "North America", neighbors: ["USA", "GTM", "BLZ"] },
  { name: "Brazil", iso: "BRA", continent: "South America", neighbors: ["URY", "ARG", "PRY", "BOL", "PER", "COL", "VEN", "GUY", "SUR", "GUF"] },
  { name: "Argentina", iso: "ARG", continent: "South America", neighbors: ["CHL", "BOL", "PRY", "BRA", "URY"] },
  { name: "Chile", iso: "CHL", continent: "South America", neighbors: ["PER", "BOL", "ARG"] },
  { name: "Peru", iso: "PER", continent: "South America", neighbors: ["ECU", "COL", "BRA", "BOL", "CHL"] },
  { name: "Colombia", iso: "COL", continent: "South America", neighbors: ["PAN", "VEN", "BRA", "PER", "ECU"] },
  { name: "Venezuela", iso: "VEN", continent: "South America", neighbors: ["COL", "BRA", "GUY"] },
  { name: "Bolivia", iso: "BOL", continent: "South America", neighbors: ["PER", "BRA", "PRY", "ARG", "CHL"] },

  { name: "United Kingdom", iso: "GBR", continent: "Europe", neighbors: ["IRL"] },
  { name: "France", iso: "FRA", continent: "Europe", neighbors: ["ESP", "BEL", "LUX", "DEU", "CHE", "ITA", "MCO", "AND"] },
  { name: "Germany", iso: "DEU", continent: "Europe", neighbors: ["DNK", "POL", "CZE", "AUT", "CHE", "FRA", "LUX", "BEL", "NLD"] },
  { name: "Spain", iso: "ESP", continent: "Europe", neighbors: ["PRT", "FRA", "AND"] },
  { name: "Portugal", iso: "PRT", continent: "Europe", neighbors: ["ESP"] },
  { name: "Italy", iso: "ITA", continent: "Europe", neighbors: ["FRA", "CHE", "AUT", "SVN", "SMR", "VAT"] },
  { name: "Poland", iso: "POL", continent: "Europe", neighbors: ["DEU", "CZE", "SVK", "UKR", "BLR", "LTU", "RUS"] },
  { name: "Ukraine", iso: "UKR", continent: "Europe", neighbors: ["RUS", "BLR", "POL", "SVK", "HUN", "ROU", "MDA"] },
  { name: "Russia", iso: "RUS", continent: "Europe", neighbors: ["NOR", "FIN", "EST", "LVA", "LTU", "POL", "BLR", "UKR", "GEO", "AZE", "KAZ", "CHN", "MNG", "PRK"] },
  { name: "Norway", iso: "NOR", continent: "Europe", neighbors: ["SWE", "FIN", "RUS"] },
  { name: "Sweden", iso: "SWE", continent: "Europe", neighbors: ["NOR", "FIN"] },
  { name: "Finland", iso: "FIN", continent: "Europe", neighbors: ["NOR", "SWE", "RUS"] },

  { name: "China", iso: "CHN", continent: "Asia", neighbors: ["PRK", "RUS", "MNG", "KAZ", "KGZ", "TJK", "AFG", "PAK", "IND", "NPL", "BTN", "MMR", "LAO", "VNM"] },
  { name: "India", iso: "IND", continent: "Asia", neighbors: ["PAK", "CHN", "NPL", "BTN", "MMR", "BGD"] },
  { name: "Japan", iso: "JPN", continent: "Asia", neighbors: [] },
  { name: "South Korea", iso: "KOR", continent: "Asia", neighbors: ["PRK"] },
  { name: "North Korea", iso: "PRK", continent: "Asia", neighbors: ["CHN", "RUS", "KOR"] },
  { name: "Thailand", iso: "THA", continent: "Asia", neighbors: ["MMR", "LAO", "KHM", "MYS"] },
  { name: "Vietnam", iso: "VNM", continent: "Asia", neighbors: ["CHN", "LAO", "KHM"] },
  { name: "Indonesia", iso: "IDN", continent: "Asia", neighbors: ["MYS", "PNG", "TLS"] },
  { name: "Australia", iso: "AUS", continent: "Oceania", neighbors: [] },
  { name: "New Zealand", iso: "NZL", continent: "Oceania", neighbors: [] },

  { name: "Egypt", iso: "EGY", continent: "Africa", neighbors: ["LBY", "SDN", "ISR", "PSE"] },
  { name: "South Africa", iso: "ZAF", continent: "Africa", neighbors: ["NAM", "BWA", "ZWE", "MOZ", "SWZ", "LSO"] },
  { name: "Nigeria", iso: "NGA", continent: "Africa", neighbors: ["BEN", "NER", "TCD", "CMR"] },
  { name: "Kenya", iso: "KEN", continent: "Africa", neighbors: ["ETH", "SOM", "TZA", "UGA", "SSD"] },
  { name: "Morocco", iso: "MAR", continent: "Africa", neighbors: ["DZA", "ESH", "ESP"] },
  { name: "Algeria", iso: "DZA", continent: "Africa", neighbors: ["TUN", "LBY", "NER", "MLI", "MRT", "ESH", "MAR"] },

  { name: "Turkey", iso: "TUR", continent: "Asia", neighbors: ["GRC", "BGR", "GEO", "ARM", "AZE", "IRN", "IRQ", "SYR"] },
  { name: "Saudi Arabia", iso: "SAU", continent: "Asia", neighbors: ["JOR", "IRQ", "KWT", "QAT", "ARE", "OMN", "YEM"] },
  { name: "Iran", iso: "IRN", continent: "Asia", neighbors: ["TUR", "ARM", "AZE", "TKM", "AFG", "PAK", "IRQ"] },
  { name: "Iraq", iso: "IRQ", continent: "Asia", neighbors: ["TUR", "SYR", "JOR", "SAU", "KWT", "IRN"] },

  { name: "Greece", iso: "GRC", continent: "Europe", neighbors: ["ALB", "MKD", "BGR", "TUR"] },
  { name: "Belgium", iso: "BEL", continent: "Europe", neighbors: ["FRA", "LUX", "DEU", "NLD"] },
  { name: "Netherlands", iso: "NLD", continent: "Europe", neighbors: ["BEL", "DEU"] },
  { name: "Switzerland", iso: "CHE", continent: "Europe", neighbors: ["FRA", "DEU", "AUT", "ITA", "LIE"] },
  { name: "Austria", iso: "AUT", continent: "Europe", neighbors: ["DEU", "CZE", "SVK", "HUN", "SVN", "ITA", "CHE", "LIE"] },
  { name: "Czech Republic", iso: "CZE", continent: "Europe", neighbors: ["DEU", "POL", "SVK", "AUT"] },
  { name: "Hungary", iso: "HUN", continent: "Europe", neighbors: ["AUT", "SVK", "UKR", "ROU", "SRB", "HRV", "SVN"] },
  { name: "Romania", iso: "ROU", continent: "Europe", neighbors: ["UKR", "MDA", "BGR", "SRB", "HUN"] },

  { name: "Pakistan", iso: "PAK", continent: "Asia", neighbors: ["IRN", "AFG", "CHN", "IND"] },
  { name: "Afghanistan", iso: "AFG", continent: "Asia", neighbors: ["IRN", "TKM", "UZB", "TJK", "CHN", "PAK"] },
  { name: "Kazakhstan", iso: "KAZ", continent: "Asia", neighbors: ["RUS", "CHN", "KGZ", "UZB", "TKM"] },

  { name: "Cuba", iso: "CUB", continent: "North America", neighbors: [] },
  { name: "Jamaica", iso: "JAM", continent: "North America", neighbors: [] },
  { name: "Dominican Republic", iso: "DOM", continent: "North America", neighbors: ["HTI"] },
  { name: "Haiti", iso: "HTI", continent: "North America", neighbors: ["DOM"] },

  { name: "Ecuador", iso: "ECU", continent: "South America", neighbors: ["COL", "PER"] },
  { name: "Paraguay", iso: "PRY", continent: "South America", neighbors: ["ARG", "BOL", "BRA"] },
  { name: "Uruguay", iso: "URY", continent: "South America", neighbors: ["ARG", "BRA"] },

  { name: "South Sudan", iso: "SSD", continent: "Africa", neighbors: ["SDN", "ETH", "KEN", "UGA", "COD", "CAF"] },
  { name: "Ethiopia", iso: "ETH", continent: "Africa", neighbors: ["ERI", "DJI", "SOM", "KEN", "SSD", "SDN"] },
  { name: "Tanzania", iso: "TZA", continent: "Africa", neighbors: ["KEN", "UGA", "RWA", "BDI", "COD", "ZMB", "MWI", "MOZ"] },

  { name: "Iceland", iso: "ISL", continent: "Europe", neighbors: [] },
  { name: "Ireland", iso: "IRL", continent: "Europe", neighbors: ["GBR"] },
  { name: "Denmark", iso: "DNK", continent: "Europe", neighbors: ["DEU"] },

  { name: "Malaysia", iso: "MYS", continent: "Asia", neighbors: ["THA", "IDN", "BRN"] },
  { name: "Philippines", iso: "PHL", continent: "Asia", neighbors: [] },
  { name: "Singapore", iso: "SGP", continent: "Asia", neighbors: [] },
  { name: "Bangladesh", iso: "BGD", continent: "Asia", neighbors: ["IND", "MMR"] },
  { name: "Myanmar", iso: "MMR", continent: "Asia", neighbors: ["BGD", "IND", "CHN", "LAO", "THA"] },

  { name: "Israel", iso: "ISR", continent: "Asia", neighbors: ["LBN", "SYR", "JOR", "EGY", "PSE"] },
  { name: "Jordan", iso: "JOR", continent: "Asia", neighbors: ["ISR", "PSE", "SYR", "IRQ", "SAU"] },
  { name: "Lebanon", iso: "LBN", continent: "Asia", neighbors: ["ISR", "SYR"] },
  { name: "Syria", iso: "SYR", continent: "Asia", neighbors: ["TUR", "IRQ", "JOR", "ISR", "LBN"] }
];

module.exports = countriesData;
