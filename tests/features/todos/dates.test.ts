import { formatDate, isOverdue, parseDateOnly, toDateOnly } from "@/features/todos/dates";

describe("parseDateOnly (T-U04)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("gives local midnight on the same calendar day", () => {
    const date = parseDateOnly("2026-10-27");
    expect([date?.getFullYear(), date?.getMonth(), date?.getDate(), date?.getHours()]).toEqual([
      2026, 9, 27, 0,
    ]);
  });

  it.each(["America/Los_Angeles", "Pacific/Kiritimati", "Asia/Karachi"])(
    'never shifts the day in %s, unlike new Date("YYYY-MM-DD")',
    (timeZone) => {
      vi.stubEnv("TZ", timeZone);
      expect(parseDateOnly("2026-10-27")?.getDate()).toBe(27);
      expect(toDateOnly(parseDateOnly("2026-10-27") as Date)).toBe("2026-10-27");
    },
  );

  it("shows the bug it avoids: new Date() reads a date-only string as UTC", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    expect(new Date("2026-10-27").getDate()).toBe(26);
  });

  it.each(["2026-02-29", "2026-04-31", "2026-13-01", "2026-1-5", "27/10/2026", ""])(
    "returns null for %j",
    (value) => {
      expect(parseDateOnly(value)).toBeNull();
    },
  );

  it("accepts 29 February in a leap year", () => {
    expect(parseDateOnly("2028-02-29")?.getDate()).toBe(29);
  });
});

describe("toDateOnly", () => {
  it("formats the local calendar date with zero padding", () => {
    expect(toDateOnly(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});

describe("isOverdue (T-U04)", () => {
  const today = "2026-10-27";

  it("is true for an active todo due before today", () => {
    expect(isOverdue({ dueDate: "2026-10-26", isCompleted: false }, today)).toBe(true);
    expect(isOverdue({ dueDate: "2025-12-31", isCompleted: false }, today)).toBe(true);
  });

  it("is false when due today or later", () => {
    expect(isOverdue({ dueDate: today, isCompleted: false }, today)).toBe(false);
    expect(isOverdue({ dueDate: "2026-11-01", isCompleted: false }, today)).toBe(false);
  });

  it("is false for a completed todo or one with no due date", () => {
    expect(isOverdue({ dueDate: "2026-10-01", isCompleted: true }, today)).toBe(false);
    expect(isOverdue({ dueDate: null, isCompleted: false }, today)).toBe(false);
  });

  it("uses the local date for today by default", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 27, 0, 30));

    expect(isOverdue({ dueDate: "2026-10-26", isCompleted: false })).toBe(true);
    expect(isOverdue({ dueDate: "2026-10-27", isCompleted: false })).toBe(false);
    vi.useRealTimers();
  });
});

describe("formatDate (T-U04)", () => {
  it("shows a short, readable date", () => {
    expect(formatDate("2026-10-27")).toBe("27 Oct 2026");
    expect(formatDate("2027-01-01")).toBe("1 Jan 2027");
  });

  it("returns the text unchanged if it is not a valid date", () => {
    expect(formatDate("not a date")).toBe("not a date");
  });
});
