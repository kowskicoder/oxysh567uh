
import { storage } from './storage';
import { db } from './db';
import { events } from '../shared/schema';
import { eq, lte, and } from 'drizzle-orm';

// Event lifecycle management
export class EventScheduler {
  private static instance: EventScheduler;
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): EventScheduler {
    if (!EventScheduler.instance) {
      EventScheduler.instance = new EventScheduler();
    }
    return EventScheduler.instance;
  }

  start() {
    // Check every 5 minutes for event lifecycle changes
    this.intervalId = setInterval(() => {
      this.checkEventLifecycle();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('Event scheduler started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Event scheduler stopped');
  }

  private async checkEventLifecycle() {
    try {
      const now = new Date();
      
      // Check for events that are ending in 1 hour
      const endingSoon = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const eventsEndingSoon = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.status, 'active'),
            lte(events.endDate, endingSoon)
          )
        );

      for (const event of eventsEndingSoon) {
        // Check if we've already sent ending notification
        const lastNotification = await storage.getNotifications(event.creatorId, 1);
        const hasEndingNotification = lastNotification.some(n => 
          n.type === 'event_ending' && n.data?.eventId === event.id
        );

        if (!hasEndingNotification) {
          await storage.notifyEventEnding(event.id);
          console.log(`Sent ending notification for event ${event.id}: ${event.title}`);
        }
      }

      // Check for events that have passed their end date and should be marked as pending admin review
      const overdueEvents = await db
        .select()
        .from(events)
        .where(
          and(
            eq(events.status, 'active'),
            lte(events.endDate, now)
          )
        );

      for (const event of overdueEvents) {
        // Update event status to pending admin review
        await db
          .update(events)
          .set({ 
            status: 'pending_admin',
            updatedAt: new Date()
          })
          .where(eq(events.id, event.id));

        // Notify participants that event needs admin review
        const participants = await storage.getEventParticipants(event.id);
        for (const participant of participants) {
          await storage.createNotification({
            userId: participant.userId,
            type: 'event_pending_review',
            title: '⏳ Event Awaiting Results',
            message: `The event "${event.title}" has ended and is awaiting admin review. Your funds remain safely in escrow.`,
            data: { 
              eventId: event.id,
              eventTitle: event.title,
              prediction: participant.prediction ? 'YES' : 'NO',
              amount: parseFloat(participant.amount)
            },
          });
        }

        console.log(`Event ${event.id} marked as pending admin review: ${event.title}`);
      }

    } catch (error) {
      console.error('Error in event lifecycle check:', error);
    }
  }
}

// Auto-start the scheduler
EventScheduler.getInstance().start();

export const eventScheduler = EventScheduler.getInstance();
