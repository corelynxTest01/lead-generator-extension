const language = {
    errors: {
        noActiveTab: "Error: No active tab",
        notLinkedIn: "You are not on a LinkedIn page",
        notProfilePage: "You are not on a profile page. Navigate to a profile to extract data.",
        noProfileData: "No profile data found.",
        extractionFailed: "Couldn't extract profile data. Make sure you're on a profile page.",
        notSupported: "Please navigate to a LinkedIn or Twitter profile page"
    },
    ui: {
        copySuccess: "Content copied successfully.",
        notFound: "Not found",
        notAvailable: "Not available",
    },
    console: {
        copyError: "Failed to copy text: ",
        copyFailed: "Text copied to clipboard failed",
        extractionError: "Error extracting profile data:"
    }
};


const errors = language.errors;
const ui = language.ui;
const consoleMessages = language.console;
export { errors, ui, consoleMessages };