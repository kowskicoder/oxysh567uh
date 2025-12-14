// Test script to create an event and trigger Telegram broadcast
// This will be run in the browser console

const testEventData = {
  title: "🧪 TELEGRAM BROADCAST TEST",
  description: "This is a test event to demonstrate automatic Telegram broadcasting! If you see this message in your Telegram channel, the system is working perfectly. ⚡️🎯",
  category: "crypto",
  entryFee: "100",
  endDate: "2025-07-16T18:00:00.000Z",
  isPrivate: false,
  maxParticipants: "50"
};

fetch('/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify(testEventData)
})
.then(response => response.json())
.then(data => {
  console.log('Event created:', data);
  if (data.message && data.message.includes('Event created')) {
    console.log('✅ Event creation successful! Check your Telegram channel for the broadcast.');
  } else {
    console.log('❌ Event creation failed:', data);
  }
})
.catch(error => {
  console.error('Error creating event:', error);
});