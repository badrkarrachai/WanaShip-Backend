export interface JwtPayload {
  user: {
    id: string;
    role: string;
  };
  iss?: string; // Issuer
  sub?: string; // Subject (usually the user ID)
  aud?: string; // Audience
  iat?: number; // Issued at (timestamp)
  nbf?: number; // Not before (timestamp)
  jti?: string; // JWT ID (unique identifier)
}
