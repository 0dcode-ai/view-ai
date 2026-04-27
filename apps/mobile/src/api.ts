import { ApiClient } from "@interview/shared";
import { supabase } from "./supabase";

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000/v1";

export const api = new ApiClient({
  baseUrl,
  async getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
});
