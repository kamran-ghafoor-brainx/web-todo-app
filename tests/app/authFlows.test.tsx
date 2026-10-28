import { screen, waitFor } from "@testing-library/react";
import { authApi } from "@/features/auth";
import { messages } from "@/lib/messages";
import { tokenStorage } from "@/lib/tokenStorage";
import { listMailbox } from "@/mocks/mailbox";
import { renderApp } from "@tests/utils/renderApp";

vi.setConfig({ testTimeout: 15_000 });

type User = ReturnType<typeof renderApp>["user"];

const heading = (name: string) => screen.getByRole("heading", { level: 1, name });
const findHeading = (name: string) => screen.findByRole("heading", { level: 1, name });

async function expectTitleFocused(name: string) {
  await waitFor(() => expect(heading(name)).toHaveFocus());
}

async function latestEmailLink(): Promise<string> {
  const [latest] = await listMailbox();
  if (!latest) throw new Error("Expected an email in the mock mailbox");
  return latest.link;
}

function tokenOf(link: string): string {
  const token = new URLSearchParams(link.split("?")[1]).get("token");
  if (!token) throw new Error(`No token in ${link}`);
  return token;
}

function travelInTime(ms: number) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.now() + ms);
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function fillSignup(user: User, email: string) {
  await user.type(screen.getByLabelText(messages.fields.name), "Ann Lee");
  await user.type(screen.getByLabelText(messages.fields.email), email);
  await user.type(screen.getByLabelText(messages.fields.password), "secret12");
  await user.type(screen.getByLabelText(messages.fields.confirmPassword), "secret12");
  await user.click(screen.getByRole("button", { name: messages.signup.submit }));
}

async function logIn(user: User, email: string, password: string) {
  await user.type(screen.getByLabelText(messages.fields.email), email);
  await user.type(screen.getByLabelText(messages.fields.password), password);
  await user.click(screen.getByRole("button", { name: messages.login.submit }));
}

async function submitNewPassword(user: User, password = "newpass12") {
  await user.type(screen.getByLabelText(messages.fields.newPassword), password);
  await user.type(screen.getByLabelText(messages.fields.confirmNewPassword), password);
  await user.click(screen.getByRole("button", { name: messages.resetPassword.submit }));
}

describe("navigation between auth pages", () => {
  it("moves between login, signup and forgot password through the links", async () => {
    const { user, path } = renderApp("/login");

    await user.click(screen.getByRole("link", { name: messages.login.signupLink }));
    expect(path()).toBe("/signup");
    expect(heading(messages.signup.title)).toBeVisible();

    await user.click(screen.getByRole("link", { name: messages.signup.loginLink }));
    await user.click(screen.getByRole("link", { name: messages.login.forgotPassword }));
    expect(path()).toBe("/forgot-password");

    await user.click(screen.getByRole("link", { name: messages.forgotPassword.loginLink }));
    expect(path()).toBe("/login");
  });

  it("shows the 404 page for an unknown address, with a way home", async () => {
    const { user, path } = renderApp("/no-such-page");

    expect(heading(messages.notFound.title)).toBeVisible();
    await user.click(screen.getByRole("link", { name: messages.notFound.homeLink }));
    expect(path()).toBe("/login");
  });
});

describe("journeys (end to end against the mock backend)", () => {
  it("signs up, verifies the email from the mailbox, logs in and out", async () => {
    const signup = renderApp("/signup");
    await fillSignup(signup.user, "new.user@example.com");
    await expectTitleFocused(messages.checkEmail.title);

    const verifyLink = await latestEmailLink();
    expect(verifyLink).toMatch(/^\/verify-email\?token=/);

    const app = renderApp(verifyLink);
    expect(await findHeading(messages.verifyEmail.verifiedTitle)).toBeVisible();

    await app.user.click(screen.getByRole("link", { name: messages.verifyEmail.goToLogin }));
    await logIn(app.user, "New.User@example.com", "secret12");

    expect(await findHeading(messages.todosPage.title)).toBeVisible();
    expect(screen.getByText("Ann Lee")).toBeVisible();
    expect(app.path()).toBe("/todos");
    expect(tokenStorage.get()).toMatch(/^mock\./);

    await app.user.click(screen.getByRole("button", { name: messages.session.logout }));
    expect(await screen.findByText(messages.auth.loggedOut)).toBeVisible();
    expect(app.path()).toBe("/login");
    expect(tokenStorage.get()).toBeNull();
  });

  it("resets a forgotten password and logs in with the new one", async () => {
    const forgot = renderApp("/forgot-password");
    await forgot.user.type(screen.getByLabelText(messages.fields.email), "demo@example.com");
    await forgot.user.click(screen.getByRole("button", { name: messages.forgotPassword.submit }));
    expect(await findHeading(messages.checkEmail.title)).toBeVisible();

    const app = renderApp(await latestEmailLink());
    await submitNewPassword(app.user, "brandNew99");

    expect(await screen.findByText(messages.auth.passwordUpdated)).toBeVisible();
    expect(app.path()).toBe("/login");

    await logIn(app.user, "demo@example.com", "brandNew99");
    expect(await findHeading(messages.todosPage.title)).toBeVisible();
  });
});

describe("signup", () => {
  it("swaps to 'Check your email' with the address and a resend cooldown", async () => {
    const { user, path } = renderApp("/signup");

    await fillSignup(user, "new.user@example.com");

    await expectTitleFocused(messages.checkEmail.title);
    expect(screen.getByRole("status")).toHaveTextContent("new.user@example.com");
    expect(screen.getByRole("button", { name: /^Resend in \d+s$/ })).toBeDisabled();
    expect(path()).toBe("/signup");
  });

  it("shows an already registered email under the email field (409, EC-07)", async () => {
    const { user } = renderApp("/signup");

    await fillSignup(user, "Demo@Example.com");

    expect(await screen.findByText(messages.auth.emailTaken)).toBeInTheDocument();
    expect(screen.getByLabelText(messages.fields.email)).toHaveFocus();
  });
});

describe("verify email (T-C06)", () => {
  async function signUpAndGetLink() {
    await authApi.signup({ name: "Ann Lee", email: "ann@example.com", password: "secret12" });
    return latestEmailLink();
  }

  it("calls the API only once, even in Strict Mode", async () => {
    const link = await signUpAndGetLink();
    const verify = vi.spyOn(authApi, "verifyEmail");

    renderApp(link, { strict: true });

    expect(await findHeading(messages.verifyEmail.verifiedTitle)).toBeVisible();
    expect(verify).toHaveBeenCalledOnce();
  });

  it("says 'already verified' when the link is opened a second time", async () => {
    const link = await signUpAndGetLink();
    await authApi.verifyEmail(tokenOf(link));

    renderApp(link);

    expect(await findHeading(messages.verifyEmail.alreadyVerifiedTitle)).toBeVisible();
  });

  it.each([
    ["without a token", "/verify-email"],
    ["with an unknown token", "/verify-email?token=not-a-real-token"],
  ])("explains an invalid link (%s) and offers a new one", async (_label, url) => {
    const { user } = renderApp(url);

    expect(await findHeading(messages.verifyEmail.invalidTitle)).toBeVisible();

    await user.type(screen.getByLabelText(messages.fields.email), "ann@example.com");
    await user.click(screen.getByRole("button", { name: messages.verifyEmail.sendNewLink }));

    expect(await findHeading(messages.checkEmail.title)).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(messages.auth.resendSent);
  });

  it("explains an expired link (older than 24 hours)", async () => {
    const link = await signUpAndGetLink();
    travelInTime(25 * 60 * 60 * 1000);

    renderApp(link);

    expect(await findHeading(messages.verifyEmail.expiredTitle)).toBeVisible();
  });
});

describe("forgot password (T-C07)", () => {
  it("always confirms with the same generic message (EC-16)", async () => {
    const { user } = renderApp("/forgot-password");

    await user.type(screen.getByLabelText(messages.fields.email), "nobody@example.com");
    await user.click(screen.getByRole("button", { name: messages.forgotPassword.submit }));

    await expectTitleFocused(messages.checkEmail.title);
    expect(screen.getByRole("status")).toHaveTextContent(
      messages.auth.forgotSent("nobody@example.com"),
    );
    expect(await listMailbox()).toEqual([]);
  });

  it("shows the server's limit (1 request per 30 s) with the wait time", async () => {
    await authApi.forgotPassword("demo@example.com");
    const { user } = renderApp("/forgot-password");

    await user.type(screen.getByLabelText(messages.fields.email), "demo@example.com");
    await user.click(screen.getByRole("button", { name: messages.forgotPassword.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Please try again in \d+ seconds\./);
  });
});

describe("reset password (T-C08)", () => {
  async function requestResetLink() {
    await authApi.forgotPassword("demo@example.com");
    return latestEmailLink();
  }

  it("treats a link without a token as invalid and offers a new one", async () => {
    const { user, path } = renderApp("/reset-password");

    expect(heading(messages.resetPassword.invalidTitle)).toBeVisible();
    await user.click(screen.getByRole("link", { name: messages.resetPassword.requestNewLink }));
    expect(path()).toBe("/forgot-password");
  });

  it("explains an unknown token after submitting (EC-17)", async () => {
    const { user } = renderApp("/reset-password?token=not-a-real-token");

    await submitNewPassword(user);

    await expectTitleFocused(messages.resetPassword.invalidTitle);
  });

  it("explains an expired link (older than 1 hour, EC-17)", async () => {
    const link = await requestResetLink();
    travelInTime(61 * 60 * 1000);
    const { user } = renderApp(link);

    await submitNewPassword(user);

    await expectTitleFocused(messages.resetPassword.expiredTitle);
    expect(screen.getByText(messages.auth.linkExpired)).toBeVisible();
  });

  it("refuses a link that was already used (single-use tokens)", async () => {
    const link = await requestResetLink();
    await authApi.resetPassword({ token: tokenOf(link), password: "firstNew1" });
    const { user } = renderApp(link);

    await submitNewPassword(user);

    expect(await findHeading(messages.resetPassword.invalidTitle)).toBeVisible();
  });

  it("starts fresh when the page receives a different link without leaving it", async () => {
    const { user, router } = renderApp("/reset-password?token=not-a-real-token");
    await submitNewPassword(user);
    expect(await findHeading(messages.resetPassword.invalidTitle)).toBeVisible();

    const link = await requestResetLink();
    await router.navigate(link);

    expect(await findHeading(messages.resetPassword.title)).toBeVisible();
    expect(screen.getByLabelText(messages.fields.newPassword)).toBeVisible();
  });
});

describe("login (T-C05)", () => {
  it("logs in and shows the signed-in page with the user's name", async () => {
    const { user, path } = renderApp("/login");

    await logIn(user, "demo@example.com", "Passw0rd!");

    expect(await findHeading(messages.todosPage.title)).toBeVisible();
    expect(screen.getByRole("banner")).toHaveTextContent("Demo User");
    expect(path()).toBe("/todos");
  });

  it.each([
    ["demo@example.com", "wrong-password", messages.auth.invalidCredentials],
    ["nobody@example.com", "Passw0rd!", messages.auth.invalidCredentials],
    ["unverified@example.com", "Passw0rd!", messages.auth.emailNotVerified],
    ["locked@example.com", "Passw0rd!", messages.errors.rateLimitedFor(60)],
  ])("shows the right message for %s / %s", async (email, password, expected) => {
    const { user } = renderApp("/login");
    await logIn(user, email, password);
    expect(await screen.findByRole("alert")).toHaveTextContent(expected);
    expect(tokenStorage.get()).toBeNull();
  });

  it("sends an expired session back to login with a notice (shortlived@, 30 s)", async () => {
    const { accessToken } = await authApi.login({
      email: "shortlived@example.com",
      password: "Passw0rd!",
    });
    tokenStorage.set(accessToken);
    travelInTime(31 * 1000);

    const { path } = renderApp("/todos");

    expect(await screen.findByText(messages.auth.sessionExpired)).toBeVisible();
    expect(path()).toBe("/login");
    expect(tokenStorage.get()).toBeNull();
  });

  it("sends a visitor without a token from /todos to login, with no notice", async () => {
    const { path } = renderApp("/todos");
    await waitFor(() => expect(path()).toBe("/login"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("ignores unknown navigation state instead of showing it", () => {
    renderApp({ pathname: "/login", state: { notice: "<script>" } });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("dev mailbox (mock mode only)", () => {
  it("lists sent emails with working links, and resets the mock data", async () => {
    await authApi.signup({ name: "Ann Lee", email: "ann@example.com", password: "secret12" });
    const { user, path } = renderApp("/dev/mailbox");

    expect(await screen.findByText("Verify your email")).toBeVisible();
    expect(screen.getByText(messages.devMailbox.to("ann@example.com"))).toBeVisible();

    await user.click(screen.getByRole("button", { name: messages.devMailbox.reset }));
    expect(await screen.findByText(messages.devMailbox.resetDone)).toBeVisible();
    expect(screen.getByText(messages.devMailbox.empty)).toBeVisible();

    await expect(
      authApi.signup({ name: "Ann Lee", email: "ann@example.com", password: "secret12" }),
    ).resolves.toBeDefined();
    expect(path()).toBe("/dev/mailbox");
  });
});
