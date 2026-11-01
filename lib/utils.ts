import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Category, Priority, Sentiment } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

export function formatRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export const categoryColors: Record<Category, string> = {
  'Billing': 'chip-billing',
  'Technical Support': 'chip-technical',
  'Account & Login': 'chip-account',
  'Shipping/Delivery': 'chip-shipping',
  'Refund/Return': 'chip-refund',
  'Product Info': 'chip-product',
  'Feedback/Complaint': 'chip-feedback',
  'Other': 'chip-other',
};

export const priorityColors: Record<Priority, string> = {
  'Urgent': 'priority-urgent',
  'High': 'priority-high',
  'Med': 'priority-med',
  'Low': 'priority-low',
};

export const sentimentColors: Record<Sentiment, string> = {
  'Positive': 'text-green-400',
  'Neutral': 'text-gray-400',
  'Negative': 'text-red-400',
};

export const sentimentEmoji: Record<Sentiment, string> = {
  'Positive': '😊',
  'Neutral': '😐',
  'Negative': '😟',
};

export function confidenceColor(score: number): string {
  if (score >= 0.8) return 'text-green-400';
  if (score >= 0.5) return 'text-yellow-400';
  return 'text-red-400';
}

