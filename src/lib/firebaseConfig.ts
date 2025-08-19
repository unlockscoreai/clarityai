// This utility is needed to avoid "window is not defined" error during server-side rendering.
// By wrapping the logic in a function, we ensure it's only called on the client.

export const getActionCodeSettings = () => {
    return {
        url: `${window.location.origin}/finish-signup`,
        handleCodeInApp: true,
    };
};
