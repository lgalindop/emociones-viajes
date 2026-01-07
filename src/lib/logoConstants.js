// Logo constants for Emociones Viajes

const LOGO_URL = "/emociones-logo-icon.png";

export const LOGO_CONFIG = {
  local: {
    iconUrl: LOGO_URL,
  },
};

// Get logo URL - unified function for all uses
export function getLogoUrl() {
  return LOGO_URL;
}

// Aliases for backward compatibility
export const getReceiptLogo = getLogoUrl;
export const getWebLogo = getLogoUrl;
