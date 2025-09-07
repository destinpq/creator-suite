/**
 * Model name mapping utility for displaying user-friendly model names
 */

export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'minimax/hailuo-02': 'Video-Gen-High',
  'minimax/video-01': 'Video-Gen-Max',
  'google/veo-3': 'Video-Gen-ULTRA',
  'google/imagen-4-ultra': 'Imagen-4-ULTRA',
};

/**
 * Maps internal model names to user-friendly display names
 * @param modelName - The internal model name from the API
 * @returns The display name for the model, or the original name if no mapping exists
 */
export const getModelDisplayName = (modelName: string): string => {
  return MODEL_DISPLAY_NAMES[modelName] || modelName;
};

/**
 * Maps display names back to internal model names (for reverse lookup if needed)
 * @param displayName - The display name shown to users
 * @returns The internal model name, or the original display name if no mapping exists
 */
export const getInternalModelName = (displayName: string): string => {
  const entry = Object.entries(MODEL_DISPLAY_NAMES).find(([_, display]) => display === displayName);
  return entry ? entry[0] : displayName;
};

/**
 * Gets all available display names
 * @returns Array of all display names
 */
export const getAllDisplayNames = (): string[] => {
  return Object.values(MODEL_DISPLAY_NAMES);
};

/**
 * Gets all internal model names
 * @returns Array of all internal model names
 */
export const getAllInternalNames = (): string[] => {
  return Object.keys(MODEL_DISPLAY_NAMES);
};
