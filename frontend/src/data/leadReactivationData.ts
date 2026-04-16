// Lead Reactivation Sample Data
// Based on 22 clients over 12 months, 2,378 total positive responses

export interface MonthlyData {
  month: string;
  callsMade: number;
  callPickups: number;
  callPositive: number;
  callBookings: number;
  smsSent: number;
  smsResponses: number;
  smsPositive: number;
  smsBookings: number;
  emailsSent: number;
  emailResponses: number;
  emailPositive: number;
  emailBookings: number;
}

export interface ClientData {
  client: string;
  totalLeads: number;
  callsMade: number;
  callPickups: number;
  callPositive: number;
  callBookings: number;
  smsSent: number;
  smsResponses: number;
  smsPositive: number;
  smsBookings: number;
  emailsSent: number;
  emailResponses: number;
  emailPositive: number;
  emailBookings: number;
}

// Seeded random to keep data consistent across renders
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function distribute(total: number, buckets: number, seed: number): number[] {
  const rng = seededRandom(seed);
  const raw = Array.from({ length: buckets }, () => rng() + 0.3);
  const sum = raw.reduce((a, b) => a + b, 0);
  const distributed = raw.map(v => Math.round((v / sum) * total));
  // Fix rounding
  const diff = total - distributed.reduce((a, b) => a + b, 0);
  distributed[0] += diff;
  return distributed;
}

const months = [
  '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09',
  '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'
];

const monthLabels = [
  'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025',
  'Oct 2025', 'Nov 2025', 'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026'
];

// Totals — using non-round, realistic numbers
// Phone: 34,847 calls → 4,879 pickups (~14%) → 537 positive (~11%) → 183 bookings (~34%)
// SMS: 47,613 sent → 6,189 responses (~13%) → 1,114 positive (~18% of responses) → 189 bookings (~17%)
// Email: 221,394 sent → 8,856 responses (~4%) → 727 positive (~8.2% of responses) → 174 bookings (~23.9%)
// Total positive: 537 + 1,114 + 727 = 2,378

const callsMadePerMonth = distribute(34847, 12, 101);
const callPickupsPerMonth = distribute(4879, 12, 102);
const callPositivePerMonth = distribute(537, 12, 103);
const callBookingsPerMonth = distribute(183, 12, 104);
const smsSentPerMonth = distribute(47613, 12, 201);
const smsResponsesPerMonth = distribute(6189, 12, 202);
const smsPositivePerMonth = distribute(1114, 12, 203);
const smsBookingsPerMonth = distribute(189, 12, 204);
const emailsSentPerMonth = distribute(221394, 12, 301);
const emailResponsesPerMonth = distribute(8856, 12, 302);
const emailPositivePerMonth = distribute(727, 12, 303);
const emailBookingsPerMonth = distribute(174, 12, 304);

export const monthlyData: MonthlyData[] = months.map((m, i) => ({
  month: monthLabels[i],
  callsMade: callsMadePerMonth[i],
  callPickups: callPickupsPerMonth[i],
  callPositive: callPositivePerMonth[i],
  callBookings: callBookingsPerMonth[i],
  smsSent: smsSentPerMonth[i],
  smsResponses: smsResponsesPerMonth[i],
  smsPositive: smsPositivePerMonth[i],
  smsBookings: smsBookingsPerMonth[i],
  emailsSent: emailsSentPerMonth[i],
  emailResponses: emailResponsesPerMonth[i],
  emailPositive: emailPositivePerMonth[i],
  emailBookings: emailBookingsPerMonth[i],
}));

// Client names
const clientNames = [
  'Apex Dental Group', 'Bright Smile Orthodontics', 'Cascade Realty', 'Diamond Auto Sales',
  'Elite Fitness Club', 'Frontier Insurance', 'Green Valley Landscaping', 'Harbor View Properties',
  'Infinity Solar Solutions', 'Jade Wellness Spa', 'Keystone Law Firm', 'Liberty Home Services',
  'Metro Plumbing Co.', 'Nova Financial Advisors', 'Oakridge Medical Center', 'Premier Roofing',
  'Quest Marketing Agency', 'Ridgeline Construction', 'Summit HVAC Services', 'Titan Automotive',
  'Unity Chiropractic', 'Vertex Real Estate'
];

const totalLeadsPerClient = distribute(44738, 22, 500);
const callsMadePerClient = distribute(34847, 22, 501);
const callPickupsPerClient = distribute(4879, 22, 502);
const callPositivePerClient = distribute(537, 22, 503);
const callBookingsPerClient = distribute(183, 22, 504);
const smsSentPerClient = distribute(47613, 22, 601);
const smsResponsesPerClient = distribute(6189, 22, 602);
const smsPositivePerClient = distribute(1114, 22, 603);
const smsBookingsPerClient = distribute(189, 22, 604);
const emailsSentPerClient = distribute(221394, 22, 701);
const emailResponsesPerClient = distribute(8856, 22, 702);
const emailPositivePerClient = distribute(727, 22, 703);
const emailBookingsPerClient = distribute(174, 22, 704);

export const clientData: ClientData[] = clientNames.map((name, i) => ({
  client: name,
  totalLeads: totalLeadsPerClient[i],
  callsMade: callsMadePerClient[i],
  callPickups: callPickupsPerClient[i],
  callPositive: callPositivePerClient[i],
  callBookings: callBookingsPerClient[i],
  smsSent: smsSentPerClient[i],
  smsResponses: smsResponsesPerClient[i],
  smsPositive: smsPositivePerClient[i],
  smsBookings: smsBookingsPerClient[i],
  emailsSent: emailsSentPerClient[i],
  emailResponses: emailResponsesPerClient[i],
  emailPositive: emailPositivePerClient[i],
  emailBookings: emailBookingsPerClient[i],
}));

// Summary totals
export const totals = {
  totalLeads: 44738,
  clients: 22,
  // Phone
  callsMade: 34847,
  callPickups: 4879,
  callPickupRate: 14.0,
  callPositive: 537,
  callPositiveRate: 11.0,
  callBookings: 183,
  callBookingRate: 34.1,
  // SMS
  smsSent: 47613,
  smsResponses: 6189,
  smsResponseRate: 13.0,
  smsPositive: 1114,
  smsPositiveRate: 18.0,
  smsBookings: 189,
  smsBookingRate: 17.0,
  // Email
  emailsSent: 221394,
  emailResponses: 8856,
  emailResponseRate: 4.0,
  emailPositive: 727,
  emailPositiveRate: 8.2,
  emailBookings: 174,
  emailBookingRate: 23.9,
  // Aggregates
  totalSends: 303854,
  totalResponses: 19924,
  totalPositive: 2378,
  totalBookings: 546,
};
