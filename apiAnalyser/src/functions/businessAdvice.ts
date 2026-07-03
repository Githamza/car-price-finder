import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getAdvices } from "./typechatService";

export async function businessAdvice(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const requestBody = JSON.stringify(await request.json());
  const advices = await getAdvices(
    JSON.stringify(JSON.parse(requestBody).reviews),
    context
  );

  return { body: `${JSON.stringify(advices.data.response)}` };
}

app.http("businessAdvice", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: businessAdvice,
});
