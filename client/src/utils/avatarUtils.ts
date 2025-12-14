import { createAvatar } from '@dicebear/core';
import { notionists } from '@dicebear/collection';

export const generateAvatar = (seed: string, size: number = 128) => {
  const avatar = createAvatar(notionists, {
    seed,
    size,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    backgroundType: ['gradientLinear', 'solid'],
  });

  return avatar.toString();
};

export function getAvatarUrl(userId: string, username?: string, size: number = 128): string {
  const seed = userId || username || 'default';
  const avatar = createAvatar(notionists, {
    seed,
    size,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    backgroundType: ['gradientLinear', 'solid'],
  });
  
  const svgString = avatar.toString();
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  return `data:image/svg+xml;base64,${base64}`;
}