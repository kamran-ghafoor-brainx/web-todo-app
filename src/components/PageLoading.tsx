import { Spinner } from "@/components/Spinner";
import { messages } from "@/lib/messages";

export function PageLoading({ label = messages.app.loading }: { label?: string }) {
  return (
    <div className="flex justify-center py-16 text-primary">
      <Spinner size="lg" label={label} />
    </div>
  );
}
