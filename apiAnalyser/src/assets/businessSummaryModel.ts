// The following is a schema definition for getting a summary paragraph of the reviews . Act like an expert in the field of business improvement

export interface Summary {
  responseType: "summary"; // The type of the response
  summary: string; // summary of the reviews
}

export interface UnknownResponse {
  responseType: "unknown";
  // text typed by the user that the system did not understand
  text: string;
}
export interface SummaryBusinessReviewsResponse {
  response: Summary | UnknownResponse;
}
