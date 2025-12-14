import React from 'react';
import { createAvatar } from '@dicebear/core';
import { notionists } from '@dicebear/collection';

interface UserAvatarProps {
  userId?: string;
  username?: string;
  size?: number;
  className?: string;
}

export function UserAvatar({ userId, username, size = 40, className = "" }: UserAvatarProps) {
  // Use userId or username as seed, fallback to 'anonymous'
  const seed = userId || username || 'anonymous';

  // Generate avatar SVG
  const avatar = createAvatar(notionists, {
    seed,
    size,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    backgroundType: ['gradientLinear', 'solid'],
  });

  const svgString = avatar.toString();
  // Convert to base64 using browser-compatible method
  const base64 = btoa(unescape(encodeURIComponent(svgString)));
  const dataUri = `data:image/svg+xml;base64,${base64}`;

  return (
    <img
      src={dataUri}
      alt={`${username || 'User'} avatar`}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
}