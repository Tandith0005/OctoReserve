import dotenv from "dotenv";

dotenv.config();
interface EnvConfig {
  PORT: string;
  NODE_ENV: string;
  API_URL: string;
  APP_URL: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
}

const loadEnvVars = (): EnvConfig => {
  const requireEnvVariable = [
    "PORT",
    "NODE_ENV",
    "API_URL",
    "APP_URL",
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRES_IN",
  ];

  requireEnvVariable.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing env var ${key}`);
    }
  });

  return {
    PORT: process.env.PORT as string,
    NODE_ENV: process.env.NODE_ENV as string,
    API_URL: process.env.API_URL as string,
    APP_URL: process.env.APP_URL as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as string,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
  };
};

export const envVars = loadEnvVars();
