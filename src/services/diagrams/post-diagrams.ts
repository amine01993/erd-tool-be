import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { validateErdDiagram } from "../helpers/validation";

export async function addDiagram(
    ddbClient: DynamoDBClient,
    userId: string,
    body: string
): Promise<APIGatewayProxyResult> {
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

    const item = JSON.parse(body);

    validateErdDiagram(item);

    const newItem = {
        id: item.id,
        userId: userId,
        name: item.name,
        history: item.history,
        viewport: item.viewport,
        createAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        deletedAt: item.deletedAt ? new Date().toISOString() : undefined,
    };

    const result = await ddbDocClient.send(
        new PutCommand({
            TableName: process.env.TABLE_NAME,
            Item: newItem,
        })
    );

    return {
        statusCode: 201,
        body: JSON.stringify({ id: item.id }),
    };
}
