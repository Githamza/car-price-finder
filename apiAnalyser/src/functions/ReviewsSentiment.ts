import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getSentiment } from "./typechatService";

export async function ReviewsSentiment(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const requestBody = JSON.stringify(await request.json());
  const typechatSentiment = await getSentiment(requestBody, context);
  return { body: `${typechatSentiment.data.sentiment}` };
}

app.http("ReviewsSentiment", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: ReviewsSentiment,
});
