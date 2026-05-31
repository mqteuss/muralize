'use client';

import { SchoolEvent, sortEvents } from './events';

const CACHE_KEY = 'muralize.events.cache.v2';
const CACHE_META_KEY = 'muralize.events.cache.meta.v2';

interface CachedEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
  isPublic: boolean;
  isPinned: boolean;
  priority: SchoolEvent['priority'];
  category?: string;
  deletedAt?: string;
  deletedBy?: string;
  duplicatedFrom?: string;
}

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isPublicCacheableEvent(event: SchoolEvent) {
  return event.isPublic === true && !event.deletedAt;
}

function serializeEvent(event: SchoolEvent): CachedEvent {
  return {
    ...event,
    date: event.date.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt?.toISOString(),
    deletedAt: event.deletedAt?.toISOString(),
  };
}

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function deserializeEvent(event: CachedEvent): SchoolEvent {
  return {
    ...event,
    date: parseDate(event.date) || new Date(),
    createdAt: parseDate(event.createdAt) || new Date(),
    updatedAt: parseDate(event.updatedAt),
    deletedAt: parseDate(event.deletedAt),
  };
}

export function saveCachedEvents(events: SchoolEvent[]) {
  if (!hasStorage()) return;

  const safeEvents = events.filter(isPublicCacheableEvent);

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(safeEvents.map(serializeEvent)));
    localStorage.setItem(CACHE_META_KEY, JSON.stringify({ savedAt: new Date().toISOString() }));
  } catch (error) {
    console.warn('Não foi possível salvar o cache local de eventos.', error);
  }
}

export function loadCachedEvents() {
  if (!hasStorage()) return [];

  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as CachedEvent[];
    const events = parsed
      .map(deserializeEvent)
      .filter(isPublicCacheableEvent);

    return sortEvents(events);
  } catch (error) {
    console.warn('Não foi possível ler o cache local de eventos.', error);
    return [];
  }
}

export function clearCachedEvents() {
  if (!hasStorage()) return;

  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_META_KEY);
  } catch (error) {
    console.warn('Não foi possível limpar o cache local de eventos.', error);
  }
}

export function getCachedEventsMeta() {
  if (!hasStorage()) return null;

  try {
    const raw = localStorage.getItem(CACHE_META_KEY);
    if (!raw) return null;
    const meta = JSON.parse(raw) as { savedAt?: string };
    return meta.savedAt ? { savedAt: new Date(meta.savedAt) } : null;
  } catch {
    return null;
  }
}
