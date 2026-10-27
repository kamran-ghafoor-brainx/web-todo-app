import { createAsyncThunk } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "@/app/store";

/** Thunks reject with a user-facing message (from `getErrorMessage`). */
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
  rejectValue: string;
}>();
