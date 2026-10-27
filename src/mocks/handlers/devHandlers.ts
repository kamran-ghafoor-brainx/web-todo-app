import { http, HttpResponse } from "msw";
import { apiUrl } from "@/mocks/config";
import { resetMockDb } from "@/mocks/db";
import { listMailbox } from "@/mocks/mailbox";

export const devHandlers = [
  http.get(apiUrl("/__dev/mailbox"), async () => HttpResponse.json(await listMailbox())),

  http.post(apiUrl("/__dev/reset"), () => {
    resetMockDb();
    return new HttpResponse(null, { status: 204 });
  }),
];
