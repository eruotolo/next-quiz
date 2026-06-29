import { z } from 'zod';

const uuid = z.string().uuid();

const titleSchema = z
    .string()
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(150, 'El título no puede superar los 150 caracteres');

const descriptionSchema = z
    .string()
    .trim()
    .max(500, 'La descripción no puede superar los 500 caracteres')
    .optional();

/** Markdown crudo que se persistirá como `LmsForumPost.body`. */
const bodySchema = z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(16_000, 'El mensaje no puede superar los 16 KB');

/** Sanitización adicional: el caller debe pasar el body por `sanitizeForumMarkdown`
 *  ANTES de enviarlo. Esta schema es la última línea defensiva, no la primera. */

export const lmsForumSchema = z.object({
    courseId: uuid,
    title: titleSchema,
    description: descriptionSchema,
});

export const updateLmsForumSchema = z.object({
    forumId: uuid,
    title: titleSchema.optional(),
    description: descriptionSchema,
    archived: z.boolean().optional(),
});

export const lmsForumThreadSchema = z.object({
    forumId: uuid,
    title: titleSchema,
    body: bodySchema,
});

export const lmsForumPostSchema = z.object({
    threadId: uuid,
    parentPostId: uuid.optional(),
    body: bodySchema,
});

export const deleteLmsForumPostSchema = z.object({
    postId: uuid,
});
