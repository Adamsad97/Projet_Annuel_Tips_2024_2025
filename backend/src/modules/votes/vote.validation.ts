import { z } from 'zod';

export const voteSchema = z.object({
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)], {
    message: 'value must be 1 (upvote), -1 (downvote) or 0 (remove vote)',
  }),
});

export type VoteValue = z.infer<typeof voteSchema>['value'];
