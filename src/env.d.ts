declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      MONGODB_DATABASE_URL: string;
      POSTGRES_DATABASE_URL: string;
      ACCESS_JWT_SECRET: string; 
      REFRESH_JWT_SECRET: string;
      FASTAPI_URL:string;
    }
  }
}

export {};