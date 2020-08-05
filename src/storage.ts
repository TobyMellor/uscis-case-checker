import { DynamoDB } from 'aws-sdk';

const CASE_CHANGES_TABLE = 'caseChanges' as const;
const ROW_TYPE = 'caseChange' as const;

export async function upsertCaseChange(
  caseStatusHeading: string,
  caseStatusBody: string,
): Promise<void> {
  const dynamoDb = new DynamoDB.DocumentClient();
  const caseChange: DynamoDB.DocumentClient.PutItemInput = {
    TableName: CASE_CHANGES_TABLE,
    Item: {
      type: ROW_TYPE,
      statusHeading: caseStatusHeading,
      statusBody: caseStatusBody,
      updated: new Date().toISOString(),
    },
  };

  await dynamoDb.put(caseChange).promise();
}

export async function hasCaseChanged(caseStatusHeading: string): Promise<boolean> {
  const dynamoDb = new DynamoDB();
  const query: DynamoDB.DocumentClient.GetItemInput = {
    TableName: CASE_CHANGES_TABLE,
    Key: {
      type: {
        S: ROW_TYPE,
      },
    },
  };
  const caseChange = await dynamoDb.getItem(query).promise();

  return caseChange?.Item?.statusHeading?.S !== caseStatusHeading;
}
