import type { SelectedMapItem } from './types';

const STORAGE_KEY = 'survival-diary.map-favorites.v1';

export function favoriteKey(item: SelectedMapItem) {
  return `${item.kind}:${item.value.id}`;
}

export function loadMapFavorites(): Map<string, SelectedMapItem> {
  try {
    const encoded = window.localStorage.getItem(STORAGE_KEY);
    if (!encoded) return new Map();
    const decoded: unknown = JSON.parse(encoded);
    if (!Array.isArray(decoded)) return new Map();
    const items = decoded.filter(isSelectedMapItem);
    return new Map(items.map((item) => [favoriteKey(item), item]));
  } catch {
    return new Map();
  }
}

export function saveMapFavorites(favorites: Map<string, SelectedMapItem>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites.values()]));
  } catch {
    // Keep the current session usable when browser storage is unavailable or full.
  }
}

function isSelectedMapItem(value: unknown): value is SelectedMapItem {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (
    record.kind !== 'good-price' &&
    record.kind !== 'public-facility' &&
    record.kind !== 'public-parking' &&
    record.kind !== 'housing'
  ) {
    return false;
  }
  const item = record.value;
  return Boolean(
    item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string',
  );
}
