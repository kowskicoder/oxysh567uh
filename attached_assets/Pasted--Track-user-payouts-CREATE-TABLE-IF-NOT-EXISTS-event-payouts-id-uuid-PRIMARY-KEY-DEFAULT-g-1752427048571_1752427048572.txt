-- Track user payouts
CREATE TABLE IF NOT EXISTS event_payouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid REFERENCES events(id),
    user_id uuid REFERENCES auth.users(id),
    amount integer NOT NULL,
    payout_at timestamptz DEFAULT now(),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed'))
);

-- Function to distribute winnings when event completes
CREATE OR REPLACE FUNCTION distribute_event_winnings(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_pool integer;
    v_admin_fee integer;
    v_winning_prediction boolean;
    v_winner_count integer;
    v_payout_per_winner integer;
BEGIN
    -- Get event pool details
    SELECT total_amount, admin_fee 
    INTO v_total_pool, v_admin_fee
    FROM event_pools
    WHERE event_id = p_event_id;

    -- Get winning prediction from completed event
    SELECT winning_prediction INTO v_winning_prediction
    FROM events
    WHERE id = p_event_id AND status = 'completed';

    -- Count winners
    SELECT COUNT(*) INTO v_winner_count
    FROM event_participants
    WHERE event_id = p_event_id 
    AND prediction = v_winning_prediction;

    -- Calculate payout per winner (total pool minus admin fee, divided by winners)
    v_payout_per_winner := (v_total_pool - v_admin_fee) / v_winner_count;

    -- Distribute to winners
    INSERT INTO event_payouts (event_id, user_id, amount, status)
    SELECT 
        p_event_id,
        user_id,
        v_payout_per_winner,
        'processed'
    FROM event_participants
    WHERE event_id = p_event_id 
    AND prediction = v_winning_prediction;

    -- Update winner wallets
    UPDATE wallets w
    SET balance = balance + v_payout_per_winner
    FROM event_participants ep
    WHERE ep.event_id = p_event_id
    AND ep.prediction = v_winning_prediction
    AND ep.user_id = w.user_id;

    -- Collect admin fee
    PERFORM collect_admin_fee(p_event_id);
END;
$$;

-- Trigger to automatically distribute winnings when event completes
CREATE OR REPLACE FUNCTION handle_event_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        PERFORM distribute_event_winnings(NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER event_completion_trigger
    AFTER UPDATE ON events
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION handle_event_completion();