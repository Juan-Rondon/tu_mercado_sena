import * as SecureStore from "expo-secure-store";
import { decode as atob } from "base-64";

const TOKEN_KEY = "auth_token";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getCurrentUserId(): Promise<number | null> {
  try {
    const token = await getToken();
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payloadRaw = atob(parts[1]);
    const payload = JSON.parse(payloadRaw);

    const userId = Number(
      payload?.id ??
      payload?.user_id ??
      payload?.usuario_id ??
      payload?.sub ??
      0
    );

    return Number.isFinite(userId) && userId > 0 ? userId : null;
  } catch {
    return null;
  }
}

export async function getTokenPayload(): Promise<Record<string, any> | null> {
  try {
    const token = await getToken();
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payloadRaw = atob(parts[1]);
    return JSON.parse(payloadRaw);
  } catch {
    return null;
  }
}