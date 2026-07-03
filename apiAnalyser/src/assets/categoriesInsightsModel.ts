// The following is a schema definition for getting a summary paragraph of the reviews . Act like an expert in the field of business improvement

export interface CategoriesInsights {
  responseType: "category"; // The type of the response
  categoryInsight: CategoryInsight[]; // category insight besed on the reviews if the category is not mentioned in the reviews it will not be included in the response
}
export interface CategoryInsight {
  type:
    | "🍔 Food"
    | "🎖️ Service"
    | "💰 Price"
    | "🪩 Atmosphere"
    | "🕺 Staff"
    | "📍 Location"
    | "🪥 Cleanliness"
    | "🏆 Quality"; // The possible categories of the insight, do not repeat the category type.
  categorySummary: string[]; // a  strings  table  of examples of what was said in reviews about this category. should not repeat the same example twice.
  score: number | null; // an pproximatif integer score of the category from 0 to 10. 0 is that reviews are bad and 10 is that reviews are good. null if the category is not mentioned in the reviews
}

export interface UnknownResponse {
  responseType: "unknown";
  // text typed by the user that the system did not understand
  text: string;
}
export interface CategoriesInsightsResponse {
  response: CategoriesInsights | UnknownResponse;
}
