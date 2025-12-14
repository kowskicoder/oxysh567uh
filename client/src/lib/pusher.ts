import Pusher from 'pusher-js';

// Initialize Pusher client
export const pusher = new Pusher('decd2cca5e39cf0cbcd4', {
  cluster: 'mt1',
  forceTLS: true,
});

// Export channels for different event types
export const getEventChannel = (eventId: number) => {
  return pusher.subscribe(`event-${eventId}`);
};

export const getUserChannel = (userId: string) => {
  return pusher.subscribe(`user-${userId}`);
};

export const getGlobalChannel = () => {
  return pusher.subscribe('global');
};

export default pusher;