import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getCategoriesInsights } from "./typechatService";

export async function categoriesInsights(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const requestBody = JSON.stringify(await request.json());
  const typechatSentiment = await getCategoriesInsights(
    JSON.stringify(JSON.parse(requestBody).reviews),
    context
  );
  return { body: `${JSON.stringify(typechatSentiment.data.response)}` };
}

app.http("categoriesInsights", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: categoriesInsights,
});
