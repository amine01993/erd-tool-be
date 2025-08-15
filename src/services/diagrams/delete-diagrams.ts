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
            },
            UpdateExpression: "SET #deletedAt = :deletedAt",
            ConditionExpression: "#userId = :userId",
            ExpressionAttributeNames: {
                "#userId": "userId",
                "#deletedAt": "deletedAt",
            },
            ExpressionAttributeValues: {
                ":userId": { S: userId },
                ":deletedAt": { S: new Date().toISOString() },
            },
            ReturnValues: "ALL_NEW",
        })
    );

    console.log("deleteDiagram", {userId, diagramId, result})

    return {
        statusCode: 200,
        body: JSON.stringify(`Diagram with id ${diagramId} is deleted`),
    };
}
