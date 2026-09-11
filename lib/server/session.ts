import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "cuet_owner";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

const digest = (value: string) => createHash("sha256").update(value).digest();
const sign = (value: string, secret: string) =>
  createHmac("sha256", secret).update(value).digest("base64url");

export function passwordIsValid(value: unknown) {
  const expected = process.env.OWNER_PASSWORD;
  return Boolean(
    expected &&
    typeof value === "string" &&
    timingSafeEqual(digest(value), digest(expected)),
  );
}

export async function createOwnerSession() {
  const secret = process.env.OWNER_PASSWORD!;
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + THIRTY_DAYS }),
  ).toString("base64url");
  const token = `${payload}.${sign(payload, secret)}`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function isOwner() {
  const secret = process.env.OWNER_PASSWORD;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!secret || !token) return false;
  const [payload, signature] = token.split(".");
  if (
    !payload ||
    !signature ||
    !timingSafeEqual(digest(signature), digest(sign(payload, secret)))
  )
    return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      exp?: number;
    };
    return typeof parsed.exp === "number" && parsed.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function clearOwnerSession() {
  (await cookies()).delete(COOKIE);
}
