import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getSummary } from "./typechatService";

export async function reviewsSummary(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const requestBody = JSON.stringify(await request.json());
  const summary = await getSummary(
    JSON.stringify(JSON.parse(requestBody).reviews),
    context
  );

  return { body: `${JSON.stringify(summary.data.response)}` };

  return { body: `Hello, ${name}!` };
}

app.http("reviewsSummary", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: reviewsSummary,
});
