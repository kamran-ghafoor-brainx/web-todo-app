export const messages = {
  app: {
    name: "Todo App",
    pageTitle: (page: string) => `${page} · Todo App`,
    loading: "Loading",
  },

  errors: {
    network: "Can't reach the server. Check your connection and try again.",
    server: "Something went wrong on our side. Please try again.",
    timeout: "The request took too long. Please try again.",
    rateLimited: "Too many attempts. Please try again in a minute.",
    rateLimitedFor: (seconds: number) => {
      const wait =
        seconds < 60
          ? `${seconds} ${seconds === 1 ? "second" : "seconds"}`
          : `${Math.ceil(seconds / 60)} ${Math.ceil(seconds / 60) === 1 ? "minute" : "minutes"}`;
      return `Too many attempts. Please try again in ${wait}.`;
    },
  },

  validation: {
    nameRequired: "Enter your name.",
    nameTooShort: "Name must be at least 2 characters.",
    nameTooLong: "Name must be 50 characters or fewer.",
    emailRequired: "Enter your email address.",
    emailInvalid: "Enter a valid email address, like name@example.com.",
    emailTooLong: "Email must be 254 characters or fewer.",
    passwordRequired: "Enter your password.",
    passwordTooShort: "Password must be at least 8 characters.",
    passwordTooLong: "Password must be 64 characters or fewer.",
    passwordNeedsLetterAndNumber: "Password must include at least one letter and one number.",
    confirmPasswordRequired: "Enter your password again.",
    passwordsDoNotMatch: "Passwords don't match.",
  },

  fields: {
    name: "Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    newPassword: "New password",
    confirmNewPassword: "Confirm new password",
    passwordHint: "8 to 64 characters, with at least one letter and one number.",
    showPassword: "Show password",
  },

  dialog: {
    cancel: "Cancel",
  },

  toast: {
    region: "Notifications",
    dismiss: "Dismiss notification",
  },

  auth: {
    invalidCredentials: "Email or password is incorrect.",
    emailNotVerified: "Please verify your email before logging in.",
    emailTaken: "This email is already registered.",
    checkEmail: (email: string) =>
      `We sent a verification link to ${email}. It may take a minute to arrive.`,
    resendSent: "If an account exists for that address, we sent a new link.",
    verified: "Your email is verified. You can log in now.",
    alreadyVerified: "This email is already verified.",
    linkInvalid: "This link is not valid. Please request a new one.",
    linkExpired: "This link has expired. Please request a new one.",
    forgotSent: (email: string) => `If an account exists for ${email}, we sent a reset link.`,
    passwordUpdated: "Password updated. Please log in.",
    sessionExpired: "Your session expired. Please log in again.",
    loggedOut: "You've been logged out.",
  },

  login: {
    title: "Log in",
    description: "Welcome back. Log in to manage your todos.",
    submit: "Log in",
    submitting: "Logging in…",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    signupLink: "Sign up",
  },

  signup: {
    title: "Create your account",
    description: "Sign up to start keeping track of your todos.",
    submit: "Create account",
    submitting: "Creating account…",
    haveAccount: "Already have an account?",
    loginLink: "Log in",
  },

  checkEmail: {
    title: "Check your email",
    verifyHint: "Open the link in the email to verify your account, then log in.",
    resetHint: "Open the link in the email to choose a new password. It expires in 1 hour.",
    notReceived: "Didn't get it? Check your spam folder, or send it again.",
    resend: "Resend email",
    resending: "Sending…",
    resendIn: (seconds: number) => `Resend in ${seconds}s`,
    backToLogin: "Back to log in",
  },

  forgotPassword: {
    title: "Forgot your password?",
    description: "Enter the email you signed up with and we'll send you a link to reset it.",
    submit: "Send reset link",
    submitting: "Sending…",
    remembered: "Remembered your password?",
    loginLink: "Log in",
  },

  resetPassword: {
    title: "Set a new password",
    description: "Choose a new password for your account.",
    submit: "Update password",
    submitting: "Updating…",
    invalidTitle: "Link not valid",
    expiredTitle: "Link expired",
    requestNewLink: "Request a new link",
    backToLogin: "Back to log in",
  },

  verifyEmail: {
    verifyingTitle: "Verifying your email…",
    verifyingDescription: "This only takes a moment.",
    verifiedTitle: "Email verified",
    alreadyVerifiedTitle: "Already verified",
    invalidTitle: "Link not valid",
    expiredTitle: "Link expired",
    newLinkPrompt: "Enter your email and we'll send you a new verification link.",
    sendNewLink: "Send me a new link",
    sending: "Sending…",
    failedTitle: "Couldn't verify your email",
    retry: "Try again",
    goToLogin: "Go to log in",
    backToLogin: "Back to log in",
  },

  devMailbox: {
    title: "Dev mailbox",
    description:
      "Emails the mock server has sent. Open a link to verify an account or reset a password.",
    devOnly: "Development only: this page exists only while the mock API is on.",
    loading: "Loading emails",
    empty: "No emails yet. Sign up or request a password reset, then refresh.",
    to: (email: string) => `To ${email}`,
    openLink: "Open link",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    reset: "Reset mock data",
    resetting: "Resetting…",
    resetDone: "Mock data reset. Only the test accounts remain, and the mailbox is empty.",
  },

  home: {
    loading: "Loading your account",
    loadFailedTitle: "Couldn't load your account",
    welcome: (name: string) => `Welcome, ${name}`,
    signedInAs: (email: string) => `You're logged in as ${email}.`,
    comingSoon: "Your todo list arrives in the next phase of the project.",
    logout: "Log out",
    loggingOut: "Logging out…",
  },

  notFound: {
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has moved.",
    homeLink: "Go to the home page",
  },

  routeError: {
    title: "Something went wrong",
    description: "An unexpected error stopped this page from loading. Reload to try again.",
    reload: "Reload page",
    homeLink: "Go to the home page",
  },
} as const;
