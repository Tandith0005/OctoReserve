import { envVars } from "../config/envVars.js";



export const logger = {
  log: (...args: unknown[]) => {
    if (envVars.NODE_ENV === "development") {
      console.log(...args);
    }
  },

  error: (...args: unknown[]) => {
    if (envVars.NODE_ENV === "development") {
      console.error(...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (envVars.NODE_ENV === "development") {
      console.warn(...args);
    }
  },
};