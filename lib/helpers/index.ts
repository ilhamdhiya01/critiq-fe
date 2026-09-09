import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";

import { DecodedToken } from "@/lib/types/auth.types";

export const getUserFromToken = async (): Promise<DecodedToken | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  try {
    const decodedToken = jwtDecode<DecodedToken>(token);
    return decodedToken;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};
