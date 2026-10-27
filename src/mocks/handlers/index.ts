import { authHandlers } from "@/mocks/handlers/authHandlers";
import { devHandlers } from "@/mocks/handlers/devHandlers";
import { todosHandlers } from "@/mocks/handlers/todosHandlers";

export const handlers = [...authHandlers, ...todosHandlers, ...devHandlers];
