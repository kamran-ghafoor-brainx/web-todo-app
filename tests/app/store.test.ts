import { combineReducers, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { sessionEnded } from "@/app/actions";
import { makeStore, withSessionReset } from "@/app/store";
import { initialAuthState } from "@/features/auth/authSlice";

const user = { id: "u1", name: "Ada", email: "ada@example.com", isEmailVerified: true };

function makeCounterSlice(name: string) {
  return createSlice({
    name,
    initialState: { value: 0 },
    reducers: {
      set: (state, action: PayloadAction<number>) => {
        state.value = action.payload;
      },
    },
  });
}

describe("root reducer (T-U09)", () => {
  it("clears the user and marks the session as unauthenticated on sessionEnded", () => {
    const store = makeStore({
      auth: { status: "authenticated", user, bootstrapError: "old error" },
    });

    store.dispatch(sessionEnded());

    expect(store.getState().auth).toEqual({ ...initialAuthState, status: "unauthenticated" });
  });

  it("resets every slice, including ones added later, on sessionEnded", () => {
    const first = makeCounterSlice("first");
    const second = makeCounterSlice("second");
    const reducer = withSessionReset(
      combineReducers({ first: first.reducer, second: second.reducer }),
    );

    let state = reducer(undefined, first.actions.set(3));
    state = reducer(state, second.actions.set(7));
    expect(state).toEqual({ first: { value: 3 }, second: { value: 7 } });

    expect(reducer(state, sessionEnded())).toEqual({ first: { value: 0 }, second: { value: 0 } });
  });

  it("leaves state untouched for other actions", () => {
    const store = makeStore({ auth: { status: "authenticated", user, bootstrapError: null } });
    const before = store.getState();

    store.dispatch({ type: "something/else" });

    expect(store.getState()).toBe(before);
  });

  it("gives each store its own state", () => {
    const a = makeStore({ auth: { status: "authenticated", user, bootstrapError: null } });
    const b = makeStore();

    expect(a.getState().auth.status).toBe("authenticated");
    expect(b.getState().auth).toEqual(initialAuthState);
  });
});
