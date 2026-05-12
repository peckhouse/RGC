import {useProfile, useReferralCount} from '../api/profile';

const BASE_FREE_LIMIT = 5;
const REFERRAL_BONUS = 1;

/**
 * Free-tier console cap. A user gets +1 (5 → 6) if they're in a referral
 * relationship — either they signed up with a code (`profile.referred_by`),
 * or someone signed up with their code (`referralCount > 0`).
 */
export function useFreeConsoleLimit(): number {
  const {data: profile} = useProfile();
  const {data: referralCount = 0} = useReferralCount();

  const hasReferralRelationship =
    Boolean(profile?.referred_by) || referralCount > 0;

  return BASE_FREE_LIMIT + (hasReferralRelationship ? REFERRAL_BONUS : 0);
}
