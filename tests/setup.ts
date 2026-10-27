import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetMockDb } from "@/mocks/db";
import { server } from "@/mocks/server";

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  server.resetHandlers();
  resetMockDb();
  localStorage.clear();
});

afterAll(() => server.close());

configure({ asyncUtilTimeout: 3000 });

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute("open");
};
