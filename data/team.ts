import { TeamMember, SupportAgent } from '@/types';
import { getTimeInZone } from '@/lib/timezone';

// Helper: compute real-time status from shift + status field in APP_TIMEZONE
export function getAgentStatus(
  agent: TeamMember,
  now: Date = new Date(),
  timeZone: string = process.env.APP_TIMEZONE || 'Asia/Kolkata'
): { label: string; color: 'green' | 'yellow' | 'gray' } {
  if (agent.status === 'offline') return { label: 'Offline', color: 'gray' };

  const [startH, startM] = agent.shift.start.split(':').map(Number);
  const [endH, endM] = agent.shift.end.split(':').map(Number);
  
  const { hours, minutes } = getTimeInZone(timeZone, now);
  const currentMinutes = hours * 60 + minutes;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const inShift = currentMinutes >= startMinutes && currentMinutes < endMinutes;
  if (!inShift) return { label: 'Offline', color: 'gray' };
  if (agent.status === 'busy') {
    const nextH = (hours + 1) % 24;
    const h12 = nextH % 12 || 12;
    const ampm = nextH >= 12 ? 'PM' : 'AM';
    return { label: `Busy till ${h12} ${ampm}`, color: 'yellow' };
  }
  return { label: 'Available', color: 'green' };
}

// Exactly 6 team members (1 per primary specialty) with short, punchy copy
export const teamMembers: TeamMember[] = [
  {
    id: 'agent-001',
    name: 'Priya Sharma',
    role: 'Billing Specialist',
    avatar: '/team/priya.jpg',
    specialty: 'Billing',
    status: 'available',
    shift: { start: '09:00', end: '18:00' },
    phone: 'tel:+11234567890',
    email: 'mailto:priya@supportpilot.com',
    whatsapp: 'https://wa.me/11234567890',
    bio: 'Resolves billing and subscription issues on first contact.',
  },
  {
    id: 'agent-002',
    name: 'Marcus Chen',
    role: 'Tech Support Engineer',
    avatar: '/team/marcus.jpg',
    specialty: 'Technical Support',
    status: 'available',
    shift: { start: '08:00', end: '17:00' },
    phone: 'tel:+11234567891',
    email: 'mailto:marcus@supportpilot.com',
    whatsapp: 'https://wa.me/11234567891',
    bio: 'Fixes API and app bugs fast. Ex full-stack developer.',
  },
  {
    id: 'agent-003',
    name: 'Sofia Reyes',
    role: 'Account Security Lead',
    avatar: '/team/sofia.jpg',
    specialty: 'Account & Login',
    status: 'busy',
    shift: { start: '10:00', end: '19:00' },
    phone: 'tel:+11234567892',
    email: 'mailto:sofia@supportpilot.com',
    whatsapp: 'https://wa.me/11234567892',
    bio: 'Manages 2FA, logins, and account recovery with top privacy.',
  },
  {
    id: 'agent-004',
    name: 'James Okafor',
    role: 'Logistics Specialist',
    avatar: '/team/james.jpg',
    specialty: 'Shipping/Delivery',
    status: 'available',
    shift: { start: '07:00', end: '16:00' },
    phone: 'tel:+11234567893',
    email: 'mailto:james@supportpilot.com',
    whatsapp: 'https://wa.me/11234567893',
    bio: 'Tracks lost shipments and solves global delivery delays.',
  },
  {
    id: 'agent-005',
    name: 'Aiko Tanaka',
    role: 'Refunds Specialist',
    avatar: '/team/aiko.jpg',
    specialty: 'Refund/Return',
    status: 'available',
    shift: { start: '09:00', end: '18:00' },
    phone: 'tel:+11234567894',
    email: 'mailto:aiko@supportpilot.com',
    whatsapp: 'https://wa.me/11234567894',
    bio: 'Processes swift returns and refunds with empathy.',
  },
  {
    id: 'agent-006',
    name: 'Ryan Patel',
    role: 'Product Advisor',
    avatar: '/team/ryan.jpg',
    specialty: 'Product Info',
    status: 'offline',
    shift: { start: '12:00', end: '21:00' },
    phone: 'tel:+11234567895',
    email: 'mailto:ryan@supportpilot.com',
    whatsapp: 'https://wa.me/11234567895',
    bio: 'Helps customers choose the right plan and feature set.',
  },
];

const shortSpecialtyMap: Record<string, string> = {
  'Billing': 'Billing',
  'Technical Support': 'Tech',
  'Account & Login': 'Account',
  'Shipping/Delivery': 'Shipping',
  'Refund/Return': 'Refunds',
  'Product Info': 'Product',
  'Feedback/Complaint': 'Feedback',
  'Other': 'General',
};

const shortTeamMap: Record<string, string> = {
  'Billing': 'Support · Billing',
  'Technical Support': 'Support · Tech',
  'Account & Login': 'Support · Account',
  'Shipping/Delivery': 'Support · Shipping',
  'Refund/Return': 'Support · Refunds',
  'Product Info': 'Support · Product',
  'Feedback/Complaint': 'Support · Feedback',
  'Other': 'Support · General',
};

const toneMap: Record<string, 1 | 2 | 3 | 4 | 5> = {
  'Billing': 4,
  'Technical Support': 2,
  'Account & Login': 1,
  'Shipping/Delivery': 3,
  'Refund/Return': 5,
  'Product Info': 2,
};

// Convert TeamMember to SupportAgent (LanyardMember-compatible)
export function toSupportAgent(member: TeamMember, now: Date = new Date()): SupportAgent {
  const statusInfo = getAgentStatus(member, now);

  return {
    ...member,
    image: member.avatar,
    team: shortTeamMap[member.specialty] ?? `Support · ${member.specialty}`,
    tone: toneMap[member.specialty] ?? 3,
    tags: [
      statusInfo.label,
      shortSpecialtyMap[member.specialty] ?? member.specialty,
    ],
    links: [
      { label: 'Call', href: member.phone },
      { label: 'Email', href: member.email },
      { label: 'WhatsApp', href: member.whatsapp },
    ],
    drop: (member.id.charCodeAt(member.id.length - 1) * 5) % 23,
  };
}

export function findAvailableAgent(
  category: string,
  now: Date = new Date(),
  timeZone: string = process.env.APP_TIMEZONE || 'Asia/Kolkata'
): TeamMember | null {
  // First try specialty match + available
  const specialtyMatch = teamMembers.find(
    (a) => a.specialty === category && getAgentStatus(a, now, timeZone).color === 'green'
  );
  if (specialtyMatch) return specialtyMatch;

  // Fall back to any available agent
  const anyAvailable = teamMembers.find(
    (a) => getAgentStatus(a, now, timeZone).color === 'green'
  );
  return anyAvailable ?? teamMembers[0] ?? null;
}
