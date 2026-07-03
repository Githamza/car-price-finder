import { createLanguageModel, createJsonTranslator, Success } from "typechat";
import * as fs from "fs";
import * as path from "path";
import { InvocationContext } from "@azure/functions";
import { SentimentResponse } from "../assets/sentimentModel";
import { AdvicesResponse } from "../assets/advicesModel";
import { SummaryBusinessReviewsResponse } from "../assets/businessSummaryModel";
import { CategoriesInsightsResponse } from "../assets/categoriesInsightsModel";

const model = createLanguageModel(process.env);
export const getSentiment = async (
  mails: string,
  context: InvocationContext,
  replyText?: boolean
): Promise<Success<SentimentResponse>> => {
  let schema;
  schema = fs.readFileSync(
    path.join(__dirname, "../assets/sentimentModel.ts"),
    "utf8"
  );
  let translator;
  translator = createJsonTranslator<SentimentResponse>(
    model,
    schema,
    "SentimentResponse"
  );

  context.log("typechat");
  return new Promise(async (resolve, reject) => {
    let response;
    try {
      response = await translator.translate(`${mails}`);
      context.log("response typechat", response);
    } catch (error) {
      context.log("response typechat error");
      context.log({ error });
      return reject(error);
    }
    if (!response.success) {
      context.log(response);
      return reject(response);
    }
    context.log({ response });
    const summarizedMail = response.data;
    context.log(JSON.stringify(summarizedMail, undefined, 2));
    context.log("resolve");
    resolve(response);
  });
};

export const getAdvices = async (
  reviews: string,
  context: InvocationContext
): Promise<Success<AdvicesResponse>> => {
  let schema;
  schema = fs.readFileSync(
    path.join(__dirname, "../assets/advicesModel.ts"),
    "utf8"
  );
  let translator;
  translator = createJsonTranslator<AdvicesResponse>(
    model,
    schema,
    "AdvicesResponse"
  );

  return new Promise(async (resolve, reject) => {
    let response;
    try {
      response = await translator.translate(`${reviews}`);
      context.log("response typechat", response);
    } catch (error) {
      context.log("response typechat error");
      context.log({ error });
      return reject(error);
    }
    if (!response.success) {
      context.log(response);
      return reject(response);
    }
    context.log({ response });
    const advices = response.data;
    context.log(JSON.stringify(advices, undefined, 2));
    context.log("resolve");
    resolve(response);
  });
};
export const getSummary = async (
  reviews: string,
  context: InvocationContext
): Promise<Success<SummaryBusinessReviewsResponse>> => {
  let schema;
  schema = fs.readFileSync(
    path.join(__dirname, "../assets/businessSummaryModel.ts"),
    "utf8"
  );
  let translator;
  translator = createJsonTranslator<SummaryBusinessReviewsResponse>(
    model,
    schema,
    "SummaryBusinessReviewsResponse"
  );

  return new Promise(async (resolve, reject) => {
    let response;
    try {
      JSON.parse(reviews).shift();
      response = await translator.translate(`${JSON.stringify(reviews)}`);
      context.log("response typechat", response);
    } catch (error) {
      context.log("response typechat error");
      context.log({ error });
      return reject(error);
    }
    if (!response.success) {
      context.log(response);
      return reject(response);
    }
    context.log({ response });
    const summary = response.data;
    context.log(JSON.stringify(summary, undefined, 2));
    context.log("resolve");
    resolve(response);
  });
};
export const getCategoriesInsights = async (
  reviews: string,
  context: InvocationContext
): Promise<Success<CategoriesInsightsResponse>> => {
  let schema;
  schema = fs.readFileSync(
    path.join(__dirname, "../assets/categoriesInsightsModel.ts"),
    "utf8"
  );
  let translator;
  translator = createJsonTranslator<CategoriesInsightsResponse>(
    model,
    schema,
    "CategoriesInsightsResponse"
  );

  return new Promise(async (resolve, reject) => {
    let response;
    try {
      JSON.parse(reviews).shift();
      response = await translator.translate(`${JSON.stringify(reviews)}`);
      context.log("response typechat", response);
    } catch (error) {
      context.log("response typechat error");
      context.log({ error });
      return reject(error);
    }
    if (!response.success) {
      context.log(response);
      return reject(response);
    }
    context.log({ response });
    const summary = response.data;
    context.log(JSON.stringify(summary, undefined, 2));
    context.log("resolve");
    resolve(response);
  });
};
