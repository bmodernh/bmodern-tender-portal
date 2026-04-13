import { SignJWT, jwtVerify } from "jose";

const getSecret = () => {
  const secret = process.env.JWT_SECRET || "bmodern-fallback-secret-change-in-prod";
  return new TextEncoder().encode(secret);
};

export async function signJwt(payload: Record<string, unknown>, expiresIn = "7d"): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

export async function verifyJwt(token: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(token, getSecret());
  return payload as Record<string, unknown>;
}
