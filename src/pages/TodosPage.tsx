import { useEffect } from "react";
import { useAppDispatch } from "@/app/hooks";
import { fetchTodos, TodoList } from "@/features/todos";
import { messages } from "@/lib/messages";

export function TodosPage() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(fetchTodos());
  }, [dispatch]);

  return (
    <>
      <title>{messages.app.pageTitle(messages.todosPage.title)}</title>
      <div className="space-y-6">
        <h1>{messages.todosPage.title}</h1>
        <TodoList />
      </div>
    </>
  );
}
