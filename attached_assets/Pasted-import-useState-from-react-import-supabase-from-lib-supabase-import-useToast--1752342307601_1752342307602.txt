import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface EscrowState {
  loading: boolean;
  error: string | null;
}

export const useEscrow = () => {
  const [state, setState] = useState<EscrowState>({
    loading: false,
    error: null,
  });
  const toast = useToast();

  const placeBet = async (eventId: string, amount: number) => {
    setState({ loading: true, error: null });
    try {
      const user = supabase.auth.user();
      if (!user) throw new Error('User not authenticated');

      // First check user balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (profile.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Create escrow entry
      const { error: escrowError } = await supabase
        .from('event_escrow')
        .insert({
          event_id: eventId,
          user_id: user.id,
          amount: amount,
        });

      if (escrowError) throw escrowError;

      // Deduct amount from user balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: profile.balance - amount })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.showSuccess('Bet placed successfully! Waiting for a match...');
      setState({ loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to place bet';
      setState({ loading: false, error: message });
      toast.showError(message);
    }
  };

  const withdrawUnmatchedBet = async (escrowId: string) => {
    setState({ loading: true, error: null });
    try {
      const user = supabase.auth.user();
      if (!user) throw new Error('User not authenticated');

      // Get escrow entry
      const { data: escrow, error: escrowError } = await supabase
        .from('event_escrow')
        .select('*')
        .eq('id', escrowId)
        .eq('user_id', user.id)
        .eq('status', 'pending_match')
        .single();

      if (escrowError) throw escrowError;
      if (!escrow) throw new Error('Bet not found or already matched');

      // Return amount to user balance
      const { error: updateError } = await supabase.rpc('refund_unmatched_bet', {
        escrow_id: escrowId
      });

      if (updateError) throw updateError;

      toast.showSuccess('Bet withdrawn successfully!');
      setState({ loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to withdraw bet';
      setState({ loading: false, error: message });
      toast.showError(message);
    }
  };

  const getEscrowStatus = async (eventId: string) => {
    try {
      const user = supabase.auth.user();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('event_escrow')
        .select(`
          id,
          amount,
          status,
          matched_with,
          created_at
        `)
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching escrow status:', error);
      return null;
    }
  };

  return {
    ...state,
    placeBet,
    withdrawUnmatchedBet,
    getEscrowStatus,
  };
};