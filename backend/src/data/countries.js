// Country data with ISO codes, neighboring countries, continents, and subregions
const countriesData = [
  { name: "United States", iso: "USA", continent: "North America", subregion: "North America", neighbors: ["CAN", "MEX"] },
  { name: "Canada", iso: "CAN", continent: "North America", subregion: "North America", neighbors: ["USA"] },
  { name: "Mexico", iso: "MEX", continent: "North America", subregion: "Central America", neighbors: ["USA", "GTM", "BLZ"] },
  { name: "Brazil", iso: "BRA", continent: "South America", subregion: "South America", neighbors: ["URY", "ARG", "PRY", "BOL", "PER", "COL", "VEN", "GUY", "SUR", "GUF"] },
  { name: "Argentina", iso: "ARG", continent: "South America", subregion: "South America", neighbors: ["CHL", "BOL", "PRY", "BRA", "URY"] },
  { name: "Chile", iso: "CHL", continent: "South America", subregion: "South America", neighbors: ["PER", "BOL", "ARG"] },
  { name: "Peru", iso: "PER", continent: "South America", subregion: "South America", neighbors: ["ECU", "COL", "BRA", "BOL", "CHL"] },
  { name: "Colombia", iso: "COL", continent: "South America", subregion: "South America", neighbors: ["PAN", "VEN", "BRA", "PER", "ECU"] },
  { name: "Venezuela", iso: "VEN", continent: "South America", subregion: "South America", neighbors: ["COL", "BRA", "GUY"] },
  { name: "Bolivia", iso: "BOL", continent: "South America", subregion: "South America", neighbors: ["PER", "BRA", "PRY", "ARG", "CHL"] },

  { name: "United Kingdom", iso: "GBR", continent: "Europe", subregion: "Western Europe", neighbors: ["IRL"] },
  { name: "France", iso: "FRA", continent: "Europe", subregion: "Western Europe", neighbors: ["ESP", "BEL", "LUX", "DEU", "CHE", "ITA", "MCO", "AND"] },
  { name: "Germany", iso: "DEU", continent: "Europe", subregion: "Western Europe", neighbors: ["DNK", "POL", "CZE", "AUT", "CHE", "FRA", "LUX", "BEL", "NLD"] },
  { name: "Spain", iso: "ESP", continent: "Europe", subregion: "Southern Europe", neighbors: ["PRT", "FRA", "AND"] },
  { name: "Portugal", iso: "PRT", continent: "Europe", subregion: "Southern Europe", neighbors: ["ESP"] },
  { name: "Italy", iso: "ITA", continent: "Europe", subregion: "Southern Europe", neighbors: ["FRA", "CHE", "AUT", "SVN", "SMR", "VAT"] },
  { name: "Poland", iso: "POL", continent: "Europe", subregion: "Eastern Europe", neighbors: ["DEU", "CZE", "SVK", "UKR", "BLR", "LTU", "RUS"] },
  { name: "Ukraine", iso: "UKR", continent: "Europe", subregion: "Eastern Europe", neighbors: ["RUS", "BLR", "POL", "SVK", "HUN", "ROU", "MDA"] },
  { name: "Russia", iso: "RUS", continent: "Europe", subregion: "Eastern Europe", neighbors: ["NOR", "FIN", "EST", "LVA", "LTU", "POL", "BLR", "UKR", "GEO", "AZE", "KAZ", "CHN", "MNG", "PRK"] },
  { name: "Norway", iso: "NOR", continent: "Europe", subregion: "Northern Europe", neighbors: ["SWE", "FIN", "RUS"] },
  { name: "Sweden", iso: "SWE", continent: "Europe", subregion: "Northern Europe", neighbors: ["NOR", "FIN"] },
  { name: "Finland", iso: "FIN", continent: "Europe", subregion: "Northern Europe", neighbors: ["NOR", "SWE", "RUS"] },

  { name: "China", iso: "CHN", continent: "Asia", subregion: "East Asia", neighbors: ["PRK", "RUS", "MNG", "KAZ", "KGZ", "TJK", "AFG", "PAK", "IND", "NPL", "BTN", "MMR", "LAO", "VNM"] },
  { name: "India", iso: "IND", continent: "Asia", subregion: "South Asia", neighbors: ["PAK", "CHN", "NPL", "BTN", "MMR", "BGD"] },
  { name: "Japan", iso: "JPN", continent: "Asia", subregion: "East Asia", neighbors: [] },
  { name: "South Korea", iso: "KOR", continent: "Asia", subregion: "East Asia", neighbors: ["PRK"] },
  { name: "North Korea", iso: "PRK", continent: "Asia", subregion: "East Asia", neighbors: ["CHN", "RUS", "KOR"] },
  { name: "Thailand", iso: "THA", continent: "Asia", subregion: "Southeast Asia", neighbors: ["MMR", "LAO", "KHM", "MYS"] },
  { name: "Vietnam", iso: "VNM", continent: "Asia", subregion: "Southeast Asia", neighbors: ["CHN", "LAO", "KHM"] },
  { name: "Indonesia", iso: "IDN", continent: "Asia", subregion: "Southeast Asia", neighbors: ["MYS", "PNG", "TLS"] },
  { name: "Australia", iso: "AUS", continent: "Oceania", subregion: "Oceania", neighbors: [] },
  { name: "New Zealand", iso: "NZL", continent: "Oceania", subregion: "Oceania", neighbors: [] },

  { name: "Egypt", iso: "EGY", continent: "Africa", subregion: "North Africa", neighbors: ["LBY", "SDN", "ISR", "PSE"] },
  { name: "South Africa", iso: "ZAF", continent: "Africa", subregion: "Southern Africa", neighbors: ["NAM", "BWA", "ZWE", "MOZ", "SWZ", "LSO"] },
  { name: "Nigeria", iso: "NGA", continent: "Africa", subregion: "West Africa", neighbors: ["BEN", "NER", "TCD", "CMR"] },
  { name: "Kenya", iso: "KEN", continent: "Africa", subregion: "East Africa", neighbors: ["ETH", "SOM", "TZA", "UGA", "SSD"] },
  { name: "Morocco", iso: "MAR", continent: "Africa", subregion: "North Africa", neighbors: ["DZA", "ESH", "ESP"] },
  { name: "Algeria", iso: "DZA", continent: "Africa", subregion: "North Africa", neighbors: ["TUN", "LBY", "NER", "MLI", "MRT", "ESH", "MAR"] },

  { name: "Turkey", iso: "TUR", continent: "Asia", subregion: "Middle East", neighbors: ["GRC", "BGR", "GEO", "ARM", "AZE", "IRN", "IRQ", "SYR"] },
  { name: "Saudi Arabia", iso: "SAU", continent: "Asia", subregion: "Middle East", neighbors: ["JOR", "IRQ", "KWT", "QAT", "ARE", "OMN", "YEM"] },
  { name: "Iran", iso: "IRN", continent: "Asia", subregion: "Middle East", neighbors: ["TUR", "ARM", "AZE", "TKM", "AFG", "PAK", "IRQ"] },
  { name: "Iraq", iso: "IRQ", continent: "Asia", subregion: "Middle East", neighbors: ["TUR", "SYR", "JOR", "SAU", "KWT", "IRN"] },

  { name: "Greece", iso: "GRC", continent: "Europe", subregion: "Southern Europe", neighbors: ["ALB", "MKD", "BGR", "TUR"] },
  { name: "Belgium", iso: "BEL", continent: "Europe", subregion: "Western Europe", neighbors: ["FRA", "LUX", "DEU", "NLD"] },
  { name: "Netherlands", iso: "NLD", continent: "Europe", subregion: "Western Europe", neighbors: ["BEL", "DEU"] },
  { name: "Switzerland", iso: "CHE", continent: "Europe", subregion: "Western Europe", neighbors: ["FRA", "DEU", "AUT", "ITA", "LIE"] },
  { name: "Austria", iso: "AUT", continent: "Europe", subregion: "Central Europe", neighbors: ["DEU", "CZE", "SVK", "HUN", "SVN", "ITA", "CHE", "LIE"] },
  { name: "Czech Republic", iso: "CZE", continent: "Europe", subregion: "Central Europe", neighbors: ["DEU", "POL", "SVK", "AUT"] },
  { name: "Hungary", iso: "HUN", continent: "Europe", subregion: "Central Europe", neighbors: ["AUT", "SVK", "UKR", "ROU", "SRB", "HRV", "SVN"] },
  { name: "Romania", iso: "ROU", continent: "Europe", subregion: "Eastern Europe", neighbors: ["UKR", "MDA", "BGR", "SRB", "HUN"] },

  { name: "Pakistan", iso: "PAK", continent: "Asia", subregion: "South Asia", neighbors: ["IRN", "AFG", "CHN", "IND"] },
  { name: "Afghanistan", iso: "AFG", continent: "Asia", subregion: "Central Asia", neighbors: ["IRN", "TKM", "UZB", "TJK", "CHN", "PAK"] },
  { name: "Kazakhstan", iso: "KAZ", continent: "Asia", subregion: "Central Asia", neighbors: ["RUS", "CHN", "KGZ", "UZB", "TKM"] },

  { name: "Cuba", iso: "CUB", continent: "North America", subregion: "Caribbean", neighbors: [] },
  { name: "Jamaica", iso: "JAM", continent: "North America", subregion: "Caribbean", neighbors: [] },
  { name: "Dominican Republic", iso: "DOM", continent: "North America", subregion: "Caribbean", neighbors: ["HTI"] },
  { name: "Haiti", iso: "HTI", continent: "North America", subregion: "Caribbean", neighbors: ["DOM"] },

  { name: "Ecuador", iso: "ECU", continent: "South America", subregion: "South America", neighbors: ["COL", "PER"] },
  { name: "Paraguay", iso: "PRY", continent: "South America", subregion: "South America", neighbors: ["ARG", "BOL", "BRA"] },
  { name: "Uruguay", iso: "URY", continent: "South America", subregion: "South America", neighbors: ["ARG", "BRA"] },

  { name: "South Sudan", iso: "SSD", continent: "Africa", subregion: "East Africa", neighbors: ["SDN", "ETH", "KEN", "UGA", "COD", "CAF"] },
  { name: "Ethiopia", iso: "ETH", continent: "Africa", subregion: "East Africa", neighbors: ["ERI", "DJI", "SOM", "KEN", "SSD", "SDN"] },
  { name: "Tanzania", iso: "TZA", continent: "Africa", subregion: "East Africa", neighbors: ["KEN", "UGA", "RWA", "BDI", "COD", "ZMB", "MWI", "MOZ"] },

  { name: "Iceland", iso: "ISL", continent: "Europe", subregion: "Northern Europe", neighbors: [] },
  { name: "Ireland", iso: "IRL", continent: "Europe", subregion: "Western Europe", neighbors: ["GBR"] },
  { name: "Denmark", iso: "DNK", continent: "Europe", subregion: "Northern Europe", neighbors: ["DEU"] },

  { name: "Malaysia", iso: "MYS", continent: "Asia", subregion: "Southeast Asia", neighbors: ["THA", "IDN", "BRN"] },
  { name: "Philippines", iso: "PHL", continent: "Asia", subregion: "Southeast Asia", neighbors: [] },
  { name: "Singapore", iso: "SGP", continent: "Asia", subregion: "Southeast Asia", neighbors: [] },
  { name: "Bangladesh", iso: "BGD", continent: "Asia", subregion: "South Asia", neighbors: ["IND", "MMR"] },
  { name: "Myanmar", iso: "MMR", continent: "Asia", subregion: "Southeast Asia", neighbors: ["BGD", "IND", "CHN", "LAO", "THA"] },

  { name: "Israel", iso: "ISR", continent: "Asia", subregion: "Middle East", neighbors: ["LBN", "SYR", "JOR", "EGY", "PSE"] },
  { name: "Jordan", iso: "JOR", continent: "Asia", subregion: "Middle East", neighbors: ["ISR", "PSE", "SYR", "IRQ", "SAU"] },
  { name: "Lebanon", iso: "LBN", continent: "Asia", subregion: "Middle East", neighbors: ["ISR", "SYR"] },
  { name: "Syria", iso: "SYR", continent: "Asia", subregion: "Middle East", neighbors: ["TUR", "IRQ", "JOR", "ISR", "LBN"] }
];

module.exports = countriesData;
