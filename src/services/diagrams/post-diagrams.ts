import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { v4 } from "uuid";
import { validateErdDiagram } from "../helpers/validation";

export async function addDiagram(
    ddbClient: DynamoDBClient,
    userId: string,
    body: string
): Promise<APIGatewayProxyResult> {
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

    const item = JSON.parse(body);
    item.userId = userId;

    validateErdDiagram(item);

    const result = await ddbDocClient.send(
        new PutCommand({
            TableName: process.env.TABLE_NAME,
            Item: item,
        })
    );

    return {
        statusCode: 201,
        body: JSON.stringify({ id: item.id }),
    };
}
