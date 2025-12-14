// Centralized level system utilities
export const getLevelColor = (level: number) => {
  if (level >= 50) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900';  // Master
  if (level >= 30) return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';      // Expert
  if (level >= 20) return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';         // Advanced
  if (level >= 10) return 'bg-gradient-to-r from-green-400 to-green-600 text-white';       // Amateur
  if (level >= 5) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';      // Star
  return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';                          // Beginner
};

export const getLevelIcon = (level: number) => {
  if (level >= 50) return '/assets/master.svg';      // Master Badge
  if (level >= 30) return '/assets/expert.svg';      // Expert Badge
  if (level >= 20) return '/assets/advanced.svg';    // Advanced Badge
  if (level >= 10) return '/assets/amateur.svg';     // Amateur Badge
  if (level >= 5) return '/assets/star.svg';         // Star Badge
  return '/assets/Beginner.svg';                     // Beginner Badge
};

export const getLevelName = (level: number) => {
  if (level >= 50) return 'Master';
  if (level >= 30) return 'Expert';
  if (level >= 20) return 'Advanced';
  if (level >= 10) return 'Amateur';
  if (level >= 5) return 'Star';
  return 'Beginner';
};

export const getLevelThresholds = () => [
  { min: 1, max: 4, name: 'Beginner', icon: '/assets/Beginner.svg' },
  { min: 5, max: 9, name: 'Star', icon: '/assets/star.svg' },
  { min: 10, max: 19, name: 'Amateur', icon: '/assets/amateur.svg' },
  { min: 20, max: 29, name: 'Advanced', icon: '/assets/advanced.svg' },
  { min: 30, max: 49, name: 'Expert', icon: '/assets/expert.svg' },
  { min: 50, max: Infinity, name: 'Master', icon: '/assets/master.svg' }
];