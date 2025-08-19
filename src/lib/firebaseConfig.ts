
const getRedirectUrl = () => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    // Local dev → works on ANY port
    return `${window.location.origin}/finish-signup`;
  }

  // Production (from .env)
  return `${process.env.NEXT_PUBLIC_PROD_URL}/finish-signup`;
};

export const actionCodeSettings = {
  url: getRedirectUrl(),
  handleCodeInApp: true,
};
