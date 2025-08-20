import {
    DynamoDBClient,
    UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";

export async function deleteDiagram(
    ddbClient: DynamoDBClient,
    userId: string,
    diagramId: string
): Promise<APIGatewayProxyResult> {

    const result = await ddbClient.send(
        new UpdateItemCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
                id: { S: diagramId },
                userId: { S: userId },
            },
            UpdateExpression: "SET #deletedAt = :deletedAt",
            ExpressionAttributeNames: {
                "#deletedAt": "deletedAt",
            },
            ExpressionAttributeValues: {
                ":deletedAt": { S: new Date().toISOString() },
            },
            ReturnValues: "ALL_NEW",
        })
    );

    return {
        statusCode: 200,
        body: JSON.stringify(`Diagram with id ${diagramId} is deleted`),
    };
}
