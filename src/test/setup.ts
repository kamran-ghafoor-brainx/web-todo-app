import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Phase 3 adds the MSW server here (plan section 13.2):
//   beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
//   afterEach(() => { server.resetHandlers(); resetMockDb(); });
//   afterAll(() => server.close());

afterEach(() => {
  localStorage.clear();
});

// jsdom does not fully implement <dialog>; stub the two methods our Dialog uses
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.removeAttribute("open");
};
