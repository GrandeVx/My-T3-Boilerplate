import * as z from "zod"
import { Completeuser, relateduserSchema } from "./index"

export const postSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  user_id: z.string(),
  email: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface CompletePost extends z.infer<typeof postSchema> {
  User: Completeuser
}

/**
 * relatedPostSchema contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const relatedPostSchema: z.ZodSchema<CompletePost> = z.lazy(() => postSchema.extend({
  User: relateduserSchema,
}))
