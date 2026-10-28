import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/app/hooks";
import { AddTodoForm, fetchTodos, TodoFilters, TodoList } from "@/features/todos";
import { messages } from "@/lib/messages";

export function TodosPage() {
  const dispatch = useAppDispatch();
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void dispatch(fetchTodos());
  }, [dispatch]);

  return (
    <>
      <title>{messages.app.pageTitle(messages.todosPage.title)}</title>
      <div className="space-y-6">
        <h1>{messages.todosPage.title}</h1>
        <AddTodoForm titleInputRef={titleInputRef} />
        <TodoFilters />
        <TodoList onAddFirst={() => titleInputRef.current?.focus()} />
      </div>
    </>
  );
}
