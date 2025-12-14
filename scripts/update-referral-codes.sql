
-- Update referral codes for existing users to use their username
UPDATE users 
SET referral_code = username, updated_at = NOW()
WHERE username IS NOT NULL 
  AND (referral_code IS NULL OR referral_code != username);

-- For users without username, ensure they have a referral code
UPDATE users 
SET referral_code = SUBSTRING(MD5(RANDOM()::text), 1, 8), updated_at = NOW()
WHERE referral_code IS NULL;
