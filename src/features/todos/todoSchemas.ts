import { z } from "zod";
import { messages } from "@/lib/messages";

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export const titleField = z
  .string()
  .trim()
  .min(1, { error: messages.validation.titleRequired })
  .max(TITLE_MAX_LENGTH, { error: messages.validation.titleTooLong });

export const descriptionField = z
  .string()
  .trim()
  .max(DESCRIPTION_MAX_LENGTH, { error: messages.validation.descriptionTooLong });

export const dueDateField = z.iso.date({ error: messages.validation.dueDateInvalid });
