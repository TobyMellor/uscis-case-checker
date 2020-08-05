import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import * as storage from './storage';
import * as crawler from './crawler';
import * as notifier from './notifier';

export async function checkCaseHandler(
  _event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const { headingText, bodyText } = await crawler.getCaseStatus(process.env.USCIS_RECEIPT_NUMBER);
  const caseChanged = await storage.hasCaseChanged(headingText);

  if (!caseChanged) {
    return {
      statusCode: 200,
      body: 'The case has not been changed since the last check…',
    };
  }

  await storage.upsertCaseChange(headingText, bodyText);
  await notifier.sendNotifications(headingText, bodyText);

  return {
    statusCode: 200,
    body: 'The case has changed since the last check!',
  };
}
