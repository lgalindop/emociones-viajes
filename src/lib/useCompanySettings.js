import { useState, useEffect } from "react";
import { supabase } from "./supabase";

let cachedSettings = null;
let cachedError = null;
let listeners = [];
let isFetching = false;

export function useCompanySettings() {
  const [state, setState] = useState(() => ({
    settings: cachedSettings,
    loading: !cachedSettings && !cachedError,
    error: cachedError,
  }));

  useEffect(() => {
    // If already cached (success or error), update state and return
    if (cachedSettings || cachedError) {
      setState({ settings: cachedSettings, loading: false, error: cachedError });
      return;
    }

    // Add this component to listeners
    const listener = (data, error) => {
      setState({ settings: data, loading: false, error: error });
    };
    listeners.push(listener);

    // Only fetch once globally
    if (!isFetching && listeners.length === 1) {
      isFetching = true;
      supabase
        .from("company_settings")
        .select("*")
        .single()
        .then(({ data, error }) => {
          isFetching = false;
          if (error) {
            console.error("Error fetching company settings:", error);
            cachedError = error.message;
            // Notify all listeners of the error
            listeners.forEach((fn) => fn(null, error.message));
          } else {
            cachedSettings = data;
            cachedError = null;
            // Notify all listeners of success
            listeners.forEach((fn) => fn(data, null));
          }
          listeners = [];
        })
        .catch((error) => {
          isFetching = false;
          console.error("Error fetching company settings:", error);
          cachedError = error.message;
          listeners.forEach((fn) => fn(null, error.message));
          listeners = [];
        });
    }

    // Cleanup
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return state;
}

// For use in non-React contexts (like PDF generation)
export async function getCompanySettings() {
  if (cachedSettings) return cachedSettings;

  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching company settings:", error);
    return null;
  }

  cachedSettings = data;
  return data;
}
