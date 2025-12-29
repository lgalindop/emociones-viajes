import { useState, useEffect } from "react";
import { supabase } from "./supabase";

let cachedSettings = null;
let listeners = [];

export function useCompanySettings() {
  const [state, setState] = useState(() => ({
    settings: cachedSettings,
    loading: !cachedSettings,
  }));

  useEffect(() => {
    // If already cached, we're done
    if (cachedSettings) {
      return;
    }

    // Add this component to listeners
    const listener = (data) => {
      setState({ settings: data, loading: false });
    };
    listeners.push(listener);

    // Only fetch once globally
    if (listeners.length === 1) {
      supabase
        .from("company_settings")
        .select("*")
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching company settings:", error);
            return;
          }
          cachedSettings = data;
          // Notify all listeners
          listeners.forEach((fn) => fn(data));
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
