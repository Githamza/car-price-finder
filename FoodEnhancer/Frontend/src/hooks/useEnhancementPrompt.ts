import { useState } from "react";

/**
 * Custom hook for managing enhancement prompts
 * Follows Single Responsibility Principle - only handles prompt operations
 */
export const useEnhancementPrompt = () => {
  const [enhancementPrompt, setEnhancementPrompt] = useState("");

  const getDefaultPrompt = () => {
    return "Make this food photo look professional and appetizing with better lighting, enhanced colors, professional composition, and restaurant-quality aesthetics";
  };

  const getEffectivePrompt = () => {
    return enhancementPrompt.trim() || getDefaultPrompt();
  };

  const clearPrompt = () => {
    setEnhancementPrompt("");
  };

  return {
    enhancementPrompt,
    setEnhancementPrompt,
    getDefaultPrompt,
    getEffectivePrompt,
    clearPrompt,
  };
};
