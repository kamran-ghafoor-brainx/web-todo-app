import { authHandlers } from "@/mocks/handlers/authHandlers";
import { devHandlers } from "@/mocks/handlers/devHandlers";

export const handlers = [...authHandlers, ...devHandlers];
