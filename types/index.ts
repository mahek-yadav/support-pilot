// ─── Core Types ───────────────────────────────────────────────────────────────

export type Category =
  | 'Billing'
  | 'Technical Support'
  | 'Account & Login'
  | 'Shipping/Delivery'
  | 'Refund/Return'
  | 'Product Info'
  | 'Feedback/Complaint'
  | 'Other';

export type Priority = 'Low' | 'Med' | 'High' | 'Urgent';
export type Sentiment = 'Positive' | 'Neutral' | 'Negative';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Escalated' | 'Closed';

export interface Classification {
  category: Category;
  priority: Priority;
  sentiment: Sentiment;
  confidence: number; // 0–1
}

export interface KBArticle {
  id: string;
  title: string;
  category: Category;
  content: string;
  keywords: string[];
  approved: boolean;
}

export interface Message {
  id: string;
  role: 'customer' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  classification?: Classification;
  kbSources?: string[]; // article IDs used
  confidence?: number;
  verified?: boolean;
  verificationNotes?: string;
  engine?: 'gemini' | 'demo' | 'fallback';
}

export interface Ticket {
  id: string;
  subject: string;
  body: string;
  category: Category;
  priority: Priority;
  sentiment: Sentiment;
  confidence: number;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  aiDraft?: string;
  kbSources?: string[];
  assignedAgent?: string;
  resolution?: string;
}

export interface AgentShift {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export type AgentStatus = 'available' | 'busy' | 'offline';
export type AgentSpecialty = Category;

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  specialty: AgentSpecialty;
  status: AgentStatus;
  shift: AgentShift;
  phone: string;
  email: string;
  whatsapp: string;
  bio: string;
}

// LanyardMember type for TeamLanyardRail component
export interface LanyardMember {
  id: string;
  name: string;
  role: string;
  team?: string;
  tone?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  links?: { label: string; href: string }[];
  image: string;
  drop?: number;
  bio?: string;
}

export type SupportAgent = LanyardMember & TeamMember;

export interface DraftResponse {
  text: string;
  kbSources: KBArticle[];
  confidence: number;
  shouldEscalate: boolean;
}

