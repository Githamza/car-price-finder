// The following is a schema definition for getting advices  to improve the business score based on reviews json input. act like an expert in the field of business imropovement

export interface Advices {
  responseType: "advices"; // The type of the response
  advices: string[]; // list of advices based on reviews to improve the business
}

export interface UnknownResponse {
  actionType: "unknown";
  // text typed by the user that the system did not understand
  text: string;
}
export interface AdvicesResponse {
  response: Advices | UnknownResponse;
}
