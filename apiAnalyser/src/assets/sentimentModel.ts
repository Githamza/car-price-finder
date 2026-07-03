// The following is a schema definition for determining the sentiment of google reviews

export interface SentimentResponse {
  sentiment: "negative" | "neutral" | "positive"; // The global sentiment of the reviews list
}
