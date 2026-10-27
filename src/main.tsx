import { createRoot } from "react-dom/client";
import { Providers } from "@/app/Providers";
import { env } from "@/lib/env";
import "@fontsource-variable/roboto";
import "./index.css";
import App from "./App.tsx";

const MOCK_START_TIMEOUT_MS = 10_000;

async function startMockApi() {
  const { worker } = await import("@/mocks/browser");
  await Promise.race([
    worker.start({ onUnhandledFrame: "bypass", quiet: true }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timed out")), MOCK_START_TIMEOUT_MS),
    ),
  ]);
}

async function start() {
  if (env.VITE_USE_MOCK) {
    try {
      await startMockApi();
    } catch (error) {
      console.error(
        "The mock API (MSW) could not start, so API requests will reach the network and fail. " +
          "Service workers may be blocked in this browser.",
        error,
      );
    }
  }

  createRoot(document.getElementById("root")!).render(
    <Providers>
      <App />
    </Providers>,
  );
}

void start();
