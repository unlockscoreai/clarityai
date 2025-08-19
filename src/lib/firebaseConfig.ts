// This utility is needed to avoid "window is not defined" error during server-side rendering,
// and to dynamically set the redirect URL based on the environment.

/**
 * Returns the action code settings for Firebase email link authentication.
 * It dynamically determines the redirect URL based on the environment.
 * In a browser environment (client-side), it uses the current window's origin.
 */
export const getActionCodeSettings = () => {
    // This URL must be whitelisted in the Firebase Console.
    // The use of window.location.origin makes this dynamic.
    const url = `${window.location.origin}/finish-signup`;

    return {
        url: url,
        handleCodeInApp: true,
    };
};
