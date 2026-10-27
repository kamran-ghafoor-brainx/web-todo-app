import { Spinner } from "@/components/Spinner";
import { messages } from "@/lib/messages";

export function PageLoading() {
  return (
    <div className="flex justify-center py-16 text-primary">
      <Spinner size="lg" label={messages.app.loading} />
    </div>
  );
}
