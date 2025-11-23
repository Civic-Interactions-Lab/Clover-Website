/** Gets the endpoint from the .env if it is available otherwise it uses localhost */
export const BASE_ENDPOINT =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api/v1";

/* Endpoint for creating new AI suggestions */
export const AI_SUGGESTION_ENDPOINT: string = `${BASE_ENDPOINT}/suggestion`;

/* Endpoint for saving AI suggestions */
export const LOG_SUGGESTION_ENDPOINT: string = `${BASE_ENDPOINT}/logs/suggestion`;

export const USER_ENDPOINT: string = `${BASE_ENDPOINT}/users`;

/** Endpoint for logging information */
export const LOG_ENDPOINT: string = `${BASE_ENDPOINT}/logs`;

export const STAT_ENDPOINT: string = `${BASE_ENDPOINT}/status`;

export const AUTH_ENDPOINT: string = `${BASE_ENDPOINT}/auth`;

export const CLASS_ENDPOINT: string = `${BASE_ENDPOINT}/classes`;

export const IMAGE_UPLOAD_ENDPOINT = `${BASE_ENDPOINT}/images/upload`;

export const RESET_PASSWORD_REDIRECT = import.meta.env.VITE_API_URL
  ? "https://clover.nickrucinski.com/resetform"
  : "http://localhost:5173/resetform";

export const ERROR_ENDPOINT = `${BASE_ENDPOINT}/errors`;

export const CONSENT_ENDPOINT = `${BASE_ENDPOINT}/consent/`;
