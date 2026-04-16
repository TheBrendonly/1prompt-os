// Speed to Lead Demo Data for TBR Land Corp (Landscaping)
// Deterministic pseudo-random using simple seed

const firstNames = ['James','Michael','Robert','David','William','Richard','Joseph','Thomas','Charles','Christopher','Daniel','Matthew','Anthony','Mark','Donald','Steven','Paul','Andrew','Joshua','Kenneth','Kevin','Brian','George','Timothy','Ronald','Edward','Jason','Jeffrey','Ryan','Jacob','Gary','Nicholas','Eric','Jonathan','Stephen','Larry','Justin','Scott','Brandon','Benjamin','Samuel','Raymond','Gregory','Frank','Alexander','Patrick','Jack','Dennis','Jerry','Tyler','Aaron','Jose','Adam','Nathan','Henry','Douglas','Peter','Zachary','Kyle','Noah','Ethan','Jeremy','Walter','Christian','Keith','Roger','Terry','Austin','Sean','Gerald','Carl','Harold','Dylan','Arthur','Lawrence','Russell','Jordan','Jesse','Bryan','Billy','Bruce','Gabriel','Joe','Logan','Albert','Willie','Alan','Eugene','Vincent','Philip','Bobby','Johnny','Bradley'];
const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Turner','Phillips','Evans','Parker','Edwards','Collins','Stewart','Morris','Murphy','Cook','Rogers','Morgan','Peterson','Cooper','Reed','Bailey','Bell','Gomez','Kelly','Howard','Ward','Cox','Diaz','Richardson','Wood','Watson','Brooks','Bennett','Gray','James','Reyes','Cruz','Hughes','Price','Myers','Long','Foster','Sanders','Ross','Morales','Powell','Sullivan'];
const cities = ['Austin','Round Rock','Cedar Park','Georgetown','Pflugerville','Leander','Kyle','Buda','Lakeway','Bee Cave','Dripping Springs','Hutto','Taylor','Marble Falls','Bastrop','Elgin','Manor','Liberty Hill','Wimberley','San Marcos'];
const states = ['TX'];
const streets = ['Oak','Maple','Cedar','Pine','Elm','Willow','Birch','Cypress','Magnolia','Pecan','Mesquite','Live Oak','Sycamore','Hackberry','Juniper','Ash','Walnut','Cottonwood','Redwood','Sage'];
const streetTypes = ['Dr','Ln','Ct','Way','Blvd','Ave','St','Rd','Cir','Pl'];
const services = ['Lawn Maintenance','Landscape Design','Hardscaping','Tree Trimming','Irrigation','Sod Installation','Garden Beds','Outdoor Lighting','Fence Installation','Patio & Deck','Pool Landscaping','Commercial Landscaping','Seasonal Cleanup','Mulching','Drainage Solutions'];

function seed(s: number) {
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

const rand = seed(42);

function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min; }
function randPhone() { return `(${randInt(200,999)}) ${randInt(200,999)}-${String(randInt(1000,9999))}`; }
function randEmail(first: string, last: string) {
  const domains = ['gmail.com','yahoo.com','outlook.com','icloud.com','hotmail.com','aol.com'];
  const sep = rand() > 0.5 ? '.' : '';
  const num = rand() > 0.6 ? String(randInt(1,99)) : '';
  return `${first.toLowerCase()}${sep}${last.toLowerCase()}${num}@${pick(domains)}`;
}

export type DemoApproach = 'legacy' | 'enhanced';
export type DemoChannel = 'sms' | 'imessage' | 'whatsapp';

export interface DemoContact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  address: string;
  service_interest: string;
  approach: DemoApproach;
  channel: DemoChannel;
  replied: boolean;
  created_at: string;
  property_size?: string;
  tags: string[];
}

export interface DemoMessage {
  type: 'human' | 'assistant';
  content: string;
  timestamp: string;
}

// Generate a date between Jan 1 and Mar 24 2026
function randDate(): Date {
  const start = new Date('2026-01-01T08:00:00');
  const end = new Date('2026-03-24T20:00:00');
  const diff = end.getTime() - start.getTime();
  return new Date(start.getTime() + rand() * diff);
}

function formatDate(d: Date) { return d.toISOString(); }

function addMinutes(d: Date, mins: number): Date {
  return new Date(d.getTime() + mins * 60000);
}

const propertySizes = ['Small (< 0.25 acre)','Medium (0.25 - 0.5 acre)','Large (0.5 - 1 acre)','Extra Large (1+ acre)'];
const budgetRanges = ['$500-$1,000','$1,000-$2,500','$2,500-$5,000','$5,000-$10,000','$10,000+'];
const timelines = ['ASAP','Within 2 weeks','This month','Next month','Just exploring'];

// AI setter qualifying conversation snippets
const qualifyingExchanges: Array<{q: string; a: string}>[] = [
  [
    { q: "Great to connect! What landscaping services are you most interested in?", a: "We're looking at getting our backyard completely redone. New sod, maybe some garden beds." },
    { q: "That sounds like a great project! How large is your property?", a: "It's about half an acre, mostly the backyard needs work" },
    { q: "Perfect. Do you have a timeline in mind for when you'd like to get started?", a: "Ideally within the next couple weeks before it gets too hot" },
    { q: "Totally makes sense! And just so I can match you with the right team member, do you have a budget range in mind?", a: "Probably around $3,000-$5,000 depending on what's included" },
    { q: "That's a great range for what you're describing. I'd love to set up a free consultation with one of our landscape designers. Would Tuesday or Thursday work better for you?", a: "Thursday afternoon would be perfect" },
    { q: "Awesome! I've got you down for Thursday at 2:00 PM. Our designer Marcus will come out, take measurements, and put together a custom proposal. You'll get it within 48 hours of the visit. Sound good?", a: "Sounds great, thanks Jessica!" },
  ],
  [
    { q: "Hey! Thanks for reaching out. What's going on with your yard that we can help with?", a: "Our irrigation system is broken and the lawn is dying" },
    { q: "Oh no, we can definitely help with that! How long has it been acting up?", a: "Maybe 2-3 weeks now. Some zones aren't working at all" },
    { q: "Got it. Is it a newer system or has it been there a while?", a: "It was installed when the house was built, about 8 years ago" },
    { q: "That's right around the time those systems need some TLC. We do a full diagnostic and repair. Usually runs $200-$400 depending on what needs fixing. Want me to schedule a tech to come take a look?", a: "Yes please, sooner the better" },
    { q: "I can get someone out there tomorrow morning between 8-10 AM. Does that work?", a: "That works, thank you!" },
  ],
  [
    { q: "Thanks for your interest! Are you looking for a one-time project or ongoing maintenance?", a: "We need regular lawn maintenance, maybe bi-weekly" },
    { q: "We do a lot of that! What all would you want included? Mowing, edging, blowing, trimming?", a: "Yeah all of that. And maybe seasonal fertilization too" },
    { q: "Great combo. For a standard residential property our bi-weekly package runs $150-$200/month depending on yard size. How big is your lot?", a: "Quarter acre, pretty standard neighborhood lot" },
    { q: "Perfect, that would be on the lower end then. Want me to set up a quick walkthrough so we can give you an exact quote?", a: "Sure, when can you come by?" },
    { q: "How about this Saturday morning? Our crew lead can swing by around 9 AM.", a: "Saturday at 9 works" },
  ],
  [
    { q: "Welcome! What kind of landscaping project do you have in mind?", a: "We want to add a patio and some outdoor lighting" },
    { q: "Love it! That's one of our specialties. Are you thinking pavers, stamped concrete, or natural stone?", a: "Pavers probably, we like the look" },
    { q: "Great choice, very durable too. What size area are you thinking?", a: "Maybe 400 sq ft, enough for a table and some lounge chairs" },
    { q: "Nice! With pavers and lighting for that size, you're typically looking at $8,000-$12,000. Does that align with your budget?", a: "Yeah that's about what we were expecting" },
    { q: "Awesome. Let me get you scheduled for a design consultation. Our hardscape specialist Jake can come out and do a 3D rendering of your space. Free of charge. How's next week look?", a: "Wednesday would be great" },
    { q: "Wednesday it is! Jake will be there around 10 AM. He'll measure everything and you'll have the 3D design within 3 days. Looking forward to making this happen for you!", a: "Can't wait, thanks!" },
  ],
  [
    { q: "Hi there! What brought you to TBR Land Corp today?", a: "My HOA sent me a warning about my yard lol" },
    { q: "Ha! We get that more than you'd think 😄 What's the main issue they flagged?", a: "Dead grass and overgrown hedges" },
    { q: "Easy fixes! We can do a same-week cleanup and get you compliant. Usually $200-$350 for a one-time rescue job. Want us to come save you from the HOA?", a: "Yes please 😂 how soon?" },
    { q: "We could have a crew out there day after tomorrow. They'll mow, edge, trim the hedges, and clean everything up. Then if you want, we can set you up on a maintenance plan so you never get another letter!", a: "That sounds perfect" },
  ],
];

const shortReplies = [
  "Hey yeah I'm interested",
  "Hi! Yes, tell me more",
  "Yeah what services do you offer?",
  "Hi Jessica, yes let's chat",
  "Sure, what do you need to know?",
  "Hey! Yes I'm looking for help with my yard",
  "Hi, yeah we need some work done",
  "Yes please!",
  "Hey, yeah I filled out the form. What's next?",
  "Sure thing, go ahead",
  "Yeah I've been meaning to get this done",
  "Hi! We just moved in and need everything",
];

const noReplyExcuses: string[] = []; // just no reply

export function generateContacts(): DemoContact[] {
  const contacts: DemoContact[] = [];
  
  for (let i = 0; i < 200; i++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const city = pick(cities);
    const channel: DemoChannel = pick(['sms', 'imessage', 'whatsapp'] as DemoChannel[]);
    const approach: DemoApproach = i < 100 ? 'legacy' : 'enhanced';
    
    // Reply rates based on approach and channel
    let replyChance: number;
    if (approach === 'legacy') {
      replyChance = channel === 'sms' ? 0.28 : channel === 'imessage' ? 0.35 : 0.30;
    } else {
      replyChance = channel === 'sms' ? 0.345 : channel === 'imessage' ? 0.378 : 0.381;
    }
    const replied = rand() < replyChance;

    contacts.push({
      id: `stl-${String(i + 1).padStart(4, '0')}`,
      first_name: firstName,
      last_name: lastName,
      phone: randPhone(),
      email: randEmail(firstName, lastName),
      city,
      state: 'TX',
      address: `${randInt(100, 9999)} ${pick(streets)} ${pick(streetTypes)}`,
      service_interest: pick(services),
      approach,
      channel,
      replied,
      created_at: formatDate(randDate()),
      property_size: pick(propertySizes),
      tags: [approach === 'legacy' ? 'Legacy' : 'Enhanced', channel.toUpperCase(), replied ? 'Replied' : 'No Reply'],
    });
  }
  
  // Sort by created_at descending
  contacts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return contacts;
}

export function generateConversation(contact: DemoContact): DemoMessage[] {
  const messages: DemoMessage[] = [];
  const baseTime = new Date(contact.created_at);
  
  if (contact.approach === 'legacy') {
    // Old approach: single direct message
    messages.push({
      type: 'assistant',
      content: `Hey ${contact.first_name}, how are you doing? This is Jessica, I have a few questions, can we chat here?`,
      timestamp: formatDate(addMinutes(baseTime, 0.5)),
    });
    
    if (contact.replied) {
      const replyDelay = randInt(2, 45);
      messages.push({
        type: 'human',
        content: pick(shortReplies),
        timestamp: formatDate(addMinutes(baseTime, replyDelay)),
      });
      
      // Add qualifying conversation
      const exchange = pick(qualifyingExchanges);
      let t = addMinutes(baseTime, replyDelay);
      for (const ex of exchange) {
        t = addMinutes(t, randInt(1, 3));
        messages.push({ type: 'assistant', content: ex.q, timestamp: formatDate(t) });
        t = addMinutes(t, randInt(1, 8));
        messages.push({ type: 'human', content: ex.a, timestamp: formatDate(t) });
      }
    }
  } else {
    // New approach: default message → 3 min delay → personalized message
    messages.push({
      type: 'assistant',
      content: `Hey ${contact.first_name} 👋\n\nThank you for being interested in TBR Land Corp,\n\nWe got your info and one of our team members will be with you shortly.\n\nSit tight — we'll be in touch within a few minutes! 😊`,
      timestamp: formatDate(addMinutes(baseTime, 0.1)),
    });
    
    // 3 minute delay then personalized message
    messages.push({
      type: 'assistant',
      content: `${contact.first_name}, how are you doing? This is Jessica, sorry for the default message above. I have a few questions, can we chat here?`,
      timestamp: formatDate(addMinutes(baseTime, 3.2)),
    });
    
    if (contact.replied) {
      const replyDelay = randInt(1, 20);
      messages.push({
        type: 'human',
        content: pick(shortReplies),
        timestamp: formatDate(addMinutes(baseTime, 3.2 + replyDelay)),
      });
      
      // Add qualifying conversation
      const exchange = pick(qualifyingExchanges);
      let t = addMinutes(baseTime, 3.2 + replyDelay);
      for (const ex of exchange) {
        t = addMinutes(t, randInt(1, 3));
        messages.push({ type: 'assistant', content: ex.q, timestamp: formatDate(t) });
        t = addMinutes(t, randInt(1, 8));
        messages.push({ type: 'human', content: ex.a, timestamp: formatDate(t) });
      }
    }
  }
  
  return messages;
}

// Dashboard metrics generation
export interface DailyMetric {
  date: string;
  leads: number;
  replies: number;
  conversations: number;
  appointments: number;
}

export interface ChannelStats {
  channel: DemoChannel;
  label: string;
  totalLeads: number;
  replies: number;
  replyRate: number;
  appointments: number;
}

export interface ApproachStats {
  totalLeads: number;
  totalReplies: number;
  overallReplyRate: number;
  avgSpeedToLead: number;
  conversationsStarted: number;
  appointmentsBooked: number;
  channelStats: ChannelStats[];
  dailyMetrics: DailyMetric[];
}

export function computeStats(contacts: DemoContact[], approach: DemoApproach): ApproachStats {
  const filtered = contacts.filter(c => c.approach === approach);
  const totalLeads = filtered.length;
  const replied = filtered.filter(c => c.replied);
  const totalReplies = replied.length;
  
  const channels: DemoChannel[] = ['sms', 'imessage', 'whatsapp'];
  const channelStats: ChannelStats[] = channels.map(ch => {
    const chContacts = filtered.filter(c => c.channel === ch);
    const chReplies = chContacts.filter(c => c.replied);
    return {
      channel: ch,
      label: ch === 'sms' ? 'SMS' : ch === 'imessage' ? 'iMessage' : 'WhatsApp',
      totalLeads: chContacts.length,
      replies: chReplies.length,
      replyRate: chContacts.length > 0 ? Math.round((chReplies.length / chContacts.length) * 100) : 0,
      appointments: Math.round(chReplies.length * 0.6),
    };
  });
  
  // Generate daily metrics (Jan 1 - Mar 24, 2026)
  const dailyMetrics: DailyMetric[] = [];
  const start = new Date('2026-01-01');
  const end = new Date('2026-03-24');
  const cursor = new Date(start);
  
  while (cursor <= end) {
    const dateStr = cursor.toISOString().split('T')[0];
    const dayContacts = filtered.filter(c => c.created_at.startsWith(dateStr));
    const dayReplies = dayContacts.filter(c => c.replied);
    
    dailyMetrics.push({
      date: dateStr,
      leads: dayContacts.length,
      replies: dayReplies.length,
      conversations: Math.round(dayReplies.length * 0.85),
      appointments: Math.round(dayReplies.length * 0.6),
    });
    
    cursor.setDate(cursor.getDate() + 1);
  }
  
  return {
    totalLeads,
    totalReplies,
    overallReplyRate: totalLeads > 0 ? Math.round((totalReplies / totalLeads) * 100) : 0,
    avgSpeedToLead: approach === 'legacy' ? 47 : 8,
    conversationsStarted: Math.round(totalReplies * 0.85),
    appointmentsBooked: Math.round(totalReplies * 0.6),
    channelStats,
    dailyMetrics,
  };
}

// Singleton cache
let _contacts: DemoContact[] | null = null;
export function getContacts(): DemoContact[] {
  if (!_contacts) _contacts = generateContacts();
  return _contacts;
}
