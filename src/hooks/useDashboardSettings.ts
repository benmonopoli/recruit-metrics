import { useState, useEffect, useCallback } from "react";

export interface DashboardSection {
  id: string;
  label: string;
  visible: boolean;
}

const DEFAULT_SECTIONS: DashboardSection[] = [
  { id: "metrics", label: "Metric Cards", visible: true },
  { id: "pipeline", label: "Pipeline Overview", visible: true },
  { id: "departments", label: "Roles by Department", visible: true },
  { id: "hires", label: "Hires by Department", visible: true },
  { id: "openRoles", label: "Open Roles Table", visible: true },
];

const STORAGE_KEY = "dashboard-settings";

interface StoredSettings {
  sections: DashboardSection[];
}

export function useDashboardSettings() {
  const [sections, setSections] = useState<DashboardSection[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredSettings = JSON.parse(stored);
        // Merge with defaults to handle new sections
        return DEFAULT_SECTIONS.map((def) => {
          const saved = parsed.sections.find((s) => s.id === def.id);
          return saved ?? def;
        });
      }
    } catch (e) {
      console.error("Error loading dashboard settings:", e);
    }
    return DEFAULT_SECTIONS;
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sections }));
    } catch (e) {
      console.error("Error saving dashboard settings:", e);
    }
  }, [sections]);

  const toggleVisibility = useCallback((id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  }, []);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setSections((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setSections(DEFAULT_SECTIONS);
  }, []);

  const isSectionVisible = useCallback(
    (id: string) => sections.find((s) => s.id === id)?.visible ?? true,
    [sections]
  );

  return {
    sections,
    toggleVisibility,
    reorderSections,
    resetToDefaults,
    isSectionVisible,
  };
}
