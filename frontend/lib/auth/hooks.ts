/**
 * 인증 관련 React Hooks
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "./api";
import type { User } from "./types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const logout = () => {
    authApi.logout();
    setUser(null);
    router.push("/login");
  };

  return { user, loading, logout };
}
