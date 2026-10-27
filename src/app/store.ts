import {
  combineReducers,
  configureStore,
  type Reducer,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { sessionEnded } from "@/app/actions";
import { authSlice } from "@/features/auth/authSlice";
import { todosSlice } from "@/features/todos/todosSlice";

const appReducer = combineReducers({
  [authSlice.reducerPath]: authSlice.reducer,
  [todosSlice.reducerPath]: todosSlice.reducer,
});

/** Runs the wrapped reducer with `undefined` state on `sessionEnded`, so every slice resets. */
export function withSessionReset<S, P>(
  reducer: Reducer<S, UnknownAction, P>,
): Reducer<S, UnknownAction, P> {
  return (state, action) => reducer(sessionEnded.match(action) ? undefined : state, action);
}

export type RootState = ReturnType<typeof appReducer>;

export const rootReducer = withSessionReset(appReducer);

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({ reducer: rootReducer, preloadedState });
}

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];
