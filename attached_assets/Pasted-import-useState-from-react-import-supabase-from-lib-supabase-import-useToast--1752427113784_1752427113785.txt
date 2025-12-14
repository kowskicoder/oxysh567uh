import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface EscrowData {
  eventId: string;
  userId: string;
  amount: number;
}

export const useEscrowSystem = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const createEscrow = async (data: EscrowData) => {
    setIsProcessing(true);
    try {
      // Create escrow entry
      const { data: escrow, error } = await supabase
        .from('event_escrow')
        .insert({
          event_id: data.eventId,
          user_id: data.userId,
          amount: data.amount,
          status: 'pending_match'
        })
        .select()
        .single();

      if (error) throw error;
      return escrow;
    } catch (error: any) {
      console.error('Error creating escrow:', error);
      toast.showError(error.message || 'Failed to create escrow');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const getEscrowStatus = async (escrowId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_escrow')
        .select(`
          *,
          event:event_id (
            title,
            end_time,
            status
          )
        `)
        .eq('id', escrowId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching escrow status:', error);
      return null;
    }
  };

  const getMatchedOpponent = async (eventId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          opponent:event_participants(
            user_id,
            prediction,
            wager_amount
          )
        `)
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .eq('status', 'matched')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching matched opponent:', error);
      return null;
    }
  };

  return {
    createEscrow,
    getEscrowStatus,
    getMatchedOpponent,
    isProcessing
  };
};