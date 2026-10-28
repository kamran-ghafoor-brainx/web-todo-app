import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/app/store";

export const selectTodoItems = (state: RootState) => state.todos.items;
export const selectTodosStatus = (state: RootState) => state.todos.status;
export const selectTodosError = (state: RootState) => state.todos.error;
export const selectPendingById = (state: RootState) => state.todos.pendingById;

export const selectTodoCounts = createSelector([selectTodoItems], (items) => {
  const completed = items.filter((todo) => todo.isCompleted).length;
  return { all: items.length, active: items.length - completed, completed };
});
