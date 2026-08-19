/**
 * Compact US airport table: IATA → { name, lat, lon, tz }.
 * Coordinates are public FAA / OurAirports values, not estimates.
 * Dallas-area defaults: DFW, DAL.
 */
export const AIRPORTS = {
  DFW: { name: "Dallas/Fort Worth International", lat: 32.89748, lon: -97.040443, tz: "America/Chicago" },
  DAL: { name: "Dallas Love Field", lat: 32.847111, lon: -96.851778, tz: "America/Chicago" },
  AUS: { name: "Austin-Bergstrom International", lat: 30.194528, lon: -97.669889, tz: "America/Chicago" },
  IAH: { name: "George Bush Intercontinental", lat: 29.984433, lon: -95.341442, tz: "America/Chicago" },
  HOU: { name: "William P. Hobby", lat: 29.645419, lon: -95.278889, tz: "America/Chicago" },
  SAT: { name: "San Antonio International", lat: 29.533694, lon: -98.469778, tz: "America/Chicago" },
  ELP: { name: "El Paso International", lat: 31.80725, lon: -106.377583, tz: "America/Denver" },
  ATL: { name: "Hartsfield-Jackson Atlanta", lat: 33.6367, lon: -84.428101, tz: "America/New_York" },
  ORD: { name: "Chicago O'Hare International", lat: 41.9786, lon: -87.9048, tz: "America/Chicago" },
  MDW: { name: "Chicago Midway", lat: 41.786, lon: -87.7524, tz: "America/Chicago" },
  LAX: { name: "Los Angeles International", lat: 33.942501, lon: -118.407997, tz: "America/Los_Angeles" },
  JFK: { name: "John F. Kennedy International", lat: 40.639801, lon: -73.7789, tz: "America/New_York" },
  LGA: { name: "LaGuardia", lat: 40.777199, lon: -73.872597, tz: "America/New_York" },
  EWR: { name: "Newark Liberty International", lat: 40.692501, lon: -74.168701, tz: "America/New_York" },
  DEN: { name: "Denver International", lat: 39.861698, lon: -104.672997, tz: "America/Denver" },
  SFO: { name: "San Francisco International", lat: 37.618999, lon: -122.375, tz: "America/Los_Angeles" },
  SJC: { name: "Norman Y. Mineta San José", lat: 37.362598, lon: -121.929001, tz: "America/Los_Angeles" },
  OAK: { name: "Oakland International", lat: 37.721298, lon: -122.221001, tz: "America/Los_Angeles" },
  SEA: { name: "Seattle-Tacoma International", lat: 47.449001, lon: -122.308998, tz: "America/Los_Angeles" },
  LAS: { name: "Harry Reid International", lat: 36.080101, lon: -115.152, tz: "America/Los_Angeles" },
  PHX: { name: "Phoenix Sky Harbor", lat: 33.434299, lon: -112.012001, tz: "America/Phoenix" },
  MIA: { name: "Miami International", lat: 25.7932, lon: -80.290604, tz: "America/New_York" },
  FLL: { name: "Fort Lauderdale-Hollywood", lat: 26.072599, lon: -80.152702, tz: "America/New_York" },
  MCO: { name: "Orlando International", lat: 28.429399, lon: -81.308998, tz: "America/New_York" },
  TPA: { name: "Tampa International", lat: 27.9755, lon: -82.533203, tz: "America/New_York" },
  CLT: { name: "Charlotte Douglas International", lat: 35.214001, lon: -80.9431, tz: "America/New_York" },
  BOS: { name: "Boston Logan International", lat: 42.3643, lon: -71.005203, tz: "America/New_York" },
  MSP: { name: "Minneapolis-St Paul International", lat: 44.882, lon: -93.221802, tz: "America/Chicago" },
  DTW: { name: "Detroit Metropolitan Wayne County", lat: 42.212399, lon: -83.353401, tz: "America/New_York" },
  PHL: { name: "Philadelphia International", lat: 39.871899, lon: -75.241096, tz: "America/New_York" },
  BWI: { name: "Baltimore/Washington International", lat: 39.1754, lon: -76.668297, tz: "America/New_York" },
  DCA: { name: "Ronald Reagan Washington National", lat: 38.8521, lon: -77.037697, tz: "America/New_York" },
  IAD: { name: "Washington Dulles International", lat: 38.9445, lon: -77.455803, tz: "America/New_York" },
  SAN: { name: "San Diego International", lat: 32.733601, lon: -117.190002, tz: "America/Los_Angeles" },
  SNA: { name: "John Wayne / Orange County", lat: 33.675701, lon: -117.867996, tz: "America/Los_Angeles" },
  BUR: { name: "Hollywood Burbank", lat: 34.200699, lon: -118.359001, tz: "America/Los_Angeles" },
  ONT: { name: "Ontario International", lat: 34.056, lon: -117.601002, tz: "America/Los_Angeles" },
  SLC: { name: "Salt Lake City International", lat: 40.788399, lon: -111.977997, tz: "America/Denver" },
  PDX: { name: "Portland International", lat: 45.588699, lon: -122.597999, tz: "America/Los_Angeles" },
  HNL: { name: "Daniel K. Inouye International", lat: 21.318701, lon: -157.921997, tz: "Pacific/Honolulu" },
  ANC: { name: "Ted Stevens Anchorage", lat: 61.1744, lon: -149.996002, tz: "America/Anchorage" },
  STL: { name: "St. Louis Lambert International", lat: 38.748697, lon: -90.370003, tz: "America/Chicago" },
  MCI: { name: "Kansas City International", lat: 39.2976, lon: -94.713898, tz: "America/Chicago" },
  BNA: { name: "Nashville International", lat: 36.1245, lon: -86.6782, tz: "America/Chicago" },
  MEM: { name: "Memphis International", lat: 35.0424, lon: -89.9767, tz: "America/Chicago" },
  MSY: { name: "Louis Armstrong New Orleans", lat: 29.9934, lon: -90.258027, tz: "America/Chicago" },
  RDU: { name: "Raleigh-Durham International", lat: 35.8776, lon: -78.7875, tz: "America/New_York" },
  PIT: { name: "Pittsburgh International", lat: 40.491467, lon: -80.232872, tz: "America/New_York" },
  CLE: { name: "Cleveland Hopkins International", lat: 41.411689, lon: -81.849794, tz: "America/New_York" },
  CVG: { name: "Cincinnati/Northern Kentucky", lat: 39.048836, lon: -84.667822, tz: "America/New_York" },
  IND: { name: "Indianapolis International", lat: 39.7173, lon: -86.294403, tz: "America/Indiana/Indianapolis" },
  CMH: { name: "John Glenn Columbus", lat: 39.998001, lon: -82.891899, tz: "America/New_York" },
  MKE: { name: "Milwaukee Mitchell International", lat: 42.947201, lon: -87.896599, tz: "America/Chicago" },
  SMF: { name: "Sacramento International", lat: 38.6954, lon: -121.590996, tz: "America/Los_Angeles" },
  RNO: { name: "Reno-Tahoe International", lat: 39.4991, lon: -119.768097, tz: "America/Los_Angeles" },
  ABQ: { name: "Albuquerque International Sunport", lat: 35.040199, lon: -106.609001, tz: "America/Denver" },
  OKC: { name: "Will Rogers World", lat: 35.393101, lon: -97.6007, tz: "America/Chicago" },
  TUL: { name: "Tulsa International", lat: 36.198399, lon: -95.8881, tz: "America/Chicago" },
  LIT: { name: "Bill and Hillary Clinton National", lat: 34.7294, lon: -92.224297, tz: "America/Chicago" },
  JAX: { name: "Jacksonville International", lat: 30.494056, lon: -81.687861, tz: "America/New_York" },
  RSW: { name: "Southwest Florida International", lat: 26.536167, lon: -81.755167, tz: "America/New_York" },
  PBI: { name: "Palm Beach International", lat: 26.683161, lon: -80.095589, tz: "America/New_York" },
  RIC: { name: "Richmond International", lat: 37.505199, lon: -77.319702, tz: "America/New_York" },
  ORF: { name: "Norfolk International", lat: 36.894611, lon: -76.201222, tz: "America/New_York" },
  BDL: { name: "Bradley International", lat: 41.938889, lon: -72.683222, tz: "America/New_York" },
  BUF: { name: "Buffalo Niagara International", lat: 42.940525, lon: -78.730194, tz: "America/New_York" },
  ROC: { name: "Greater Rochester International", lat: 43.118866, lon: -77.672384, tz: "America/New_York" },
  SYR: { name: "Syracuse Hancock International", lat: 43.111198, lon: -76.1063, tz: "America/New_York" },
  ALB: { name: "Albany International", lat: 42.748267, lon: -73.801692, tz: "America/New_York" },
  PWM: { name: "Portland International Jetport", lat: 43.646161, lon: -70.30875, tz: "America/New_York" },
  BTV: { name: "Burlington International", lat: 44.471901, lon: -73.153297, tz: "America/New_York" },
  GSO: { name: "Piedmont Triad International", lat: 36.097801, lon: -79.937302, tz: "America/New_York" },
  CHS: { name: "Charleston International", lat: 32.898647, lon: -80.040528, tz: "America/New_York" },
  SAV: { name: "Savannah/Hilton Head International", lat: 32.127583, lon: -81.202139, tz: "America/New_York" },
  BHM: { name: "Birmingham-Shuttlesworth", lat: 33.562942, lon: -86.75355, tz: "America/Chicago" },
  SDF: { name: "Louisville Muhammad Ali", lat: 38.174086, lon: -85.736498, tz: "America/Kentucky/Louisville" },
  OMA: { name: "Eppley Airfield", lat: 41.303167, lon: -95.894056, tz: "America/Chicago" },
  DSM: { name: "Des Moines International", lat: 41.533972, lon: -93.663083, tz: "America/Chicago" },
  MSN: { name: "Dane County Regional", lat: 43.139858, lon: -89.337514, tz: "America/Chicago" },
  GRR: { name: "Gerald R. Ford International", lat: 42.880833, lon: -85.522806, tz: "America/Detroit" },
  TUS: { name: "Tucson International", lat: 32.116083, lon: -110.941028, tz: "America/Phoenix" },
  BOI: { name: "Boise Air Terminal", lat: 43.564361, lon: -116.222861, tz: "America/Boise" },
  GEG: { name: "Spokane International", lat: 47.619861, lon: -117.533833, tz: "America/Los_Angeles" },
  OGG: { name: "Kahului", lat: 20.89865, lon: -156.430458, tz: "Pacific/Honolulu" },
  KOA: { name: "Ellison Onizuka Kona", lat: 19.738767, lon: -156.045631, tz: "Pacific/Honolulu" },
  LIH: { name: "Lihue", lat: 21.975983, lon: -159.338958, tz: "Pacific/Honolulu" },
  SJU: { name: "Luis Muñoz Marín International", lat: 18.439417, lon: -66.001833, tz: "America/Puerto_Rico" },
};

export const AIRLINE_NAMES = {
  AA: "American Airlines",
  WN: "Southwest Airlines",
  DL: "Delta Air Lines",
  UA: "United Airlines",
  NK: "Spirit Airlines",
  F9: "Frontier Airlines",
  B6: "JetBlue",
  AS: "Alaska Airlines",
  HA: "Hawaiian Airlines",
  G4: "Allegiant Air",
  SY: "Sun Country",
  MX: "Breeze Airways",
};

export function getAirport(iata) {
  if (!iata) return null;
  return AIRPORTS[String(iata).trim().toUpperCase()] || null;
}

export function isKnownUsAirport(iata) {
  return Boolean(getAirport(iata));
}

export function parseFlightNumber(raw) {
  if (!raw) return null;
  const cleaned = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = cleaned.match(/^([A-Z]{2}|[A-Z][0-9])(\d{1,4}[A-Z]?)$/);
  if (!match) return null;
  return { airline: match[1], number: match[2], iata: `${match[1]}${match[2]}` };
}

export function appleMapsDirectionsUrl(lat, lon) {
  return `https://maps.apple.com/?daddr=${lat},${lon}&dirflg=d`;
}
