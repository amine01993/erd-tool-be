import {
    DeleteItemCommand,
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
            UpdateExpression: "SET #deletedAt = :deletedAt, #ttl = :ttl",
            ExpressionAttributeNames: {
                "#deletedAt": "deletedAt",
                "#ttl": "ttl",
            },
            ExpressionAttributeValues: {
                ":deletedAt": { S: new Date().toISOString() },
                ":ttl": { N: String(Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30) }, // 30 days
            },
            ReturnValues: "ALL_NEW",
        })
    );

    return {
        statusCode: 200,
        body: JSON.stringify(`Diagram with id ${diagramId} is deleted!`),
    };
}

export async function deleteDiagramPermanently(
    ddbClient: DynamoDBClient,
    userId: string,
    diagramId: string
): Promise<APIGatewayProxyResult> {
    const result = await ddbClient.send(
        new DeleteItemCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
                id: { S: diagramId },
                userId: { S: userId },
            },
            ConditionExpression: "attribute_exists(#deletedAt)",
            ExpressionAttributeNames: {
                "#deletedAt": "deletedAt",
            },
        })
    );

    return {
        statusCode: 200,
        body: JSON.stringify(
            `Diagram with id ${diagramId} is deleted permanently!`
        ),
    };
}
