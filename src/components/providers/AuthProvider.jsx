import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { AuthContext } from "../../contexts/AuthContext";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Prevent duplicate profile fetches
  const fetchingProfileRef = useRef(false);
  const lastFetchedUserIdRef = useRef(null);

  const fetchProfile = useCallback(async (userId) => {
    // Prevent duplicate fetches for the same user
    if (fetchingProfileRef.current && lastFetchedUserIdRef.current === userId) {
      return;
    }

    fetchingProfileRef.current = true;
    lastFetchedUserIdRef.current = userId;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      // Check if user is active
      if (!data.is_active) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setAuthError("Account is deactivated");
        return;
      }

      // Update last_login (fire and forget - don't block on this)
      supabase
        .from("profiles")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userId)
        .then(() => {});

      setProfile(data);
      setAuthError(null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
      setAuthError(error.message);
    } finally {
      setLoading(false);
      fetchingProfileRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Check active session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;

        if (error) {
          console.error("Error getting session:", error);
          setAuthError(error.message);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!mounted) return;
        console.error("Error getting session:", error);
        setAuthError(error.message);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  // Role checking functions
  const isSuperAdmin = () => profile?.role === "super_admin";
  const isAdmin = () => profile?.role === "admin";
  const isManager = () => profile?.role === "manager";
  const isAgent = () => profile?.role === "agent";
  const isViewer = () => profile?.role === "viewer";

  // Permission functions
  const canEdit = () =>
    ["super_admin", "admin", "manager", "agent"].includes(profile?.role);
  const canDelete = () =>
    ["super_admin", "admin", "manager"].includes(profile?.role);
  const canManageUsers = () => ["super_admin", "admin"].includes(profile?.role);
  const canCreateQuotes = () =>
    ["super_admin", "admin", "manager", "agent"].includes(profile?.role);

  const value = {
    user,
    profile,
    loading,
    authError,
    signOut,
    isSuperAdmin,
    isAdmin,
    isManager,
    isAgent,
    isViewer,
    canEdit,
    canDelete,
    canManageUsers,
    canCreateQuotes,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
