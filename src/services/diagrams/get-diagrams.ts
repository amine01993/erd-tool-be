import {
    DynamoDBClient,
    GetItemCommand,
    ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";

export async function findDiagrams(
    ddbClient: DynamoDBClient,
    userId: string
): Promise<APIGatewayProxyResult> {
    const result = await ddbClient.send(
        new ScanCommand({
            TableName: process.env.TABLE_NAME,
            ProjectionExpression: "#id, #name, #viewport, #lastUpdate",
            FilterExpression: "#userId = :userId",
            ExpressionAttributeNames: {
                "#id": "id",
                "#name": "name",
                "#viewport": "viewport",
                "#lastUpdate": "lastUpdate",
            },
            ExpressionAttributeValues: {
                ":userId": {
                    S: userId,
                },
            },
        })
    );
    const unmashalledItems = result.Items?.map((item) => unmarshall(item));

    return {
        statusCode: 201,
        body: JSON.stringify(unmashalledItems),
    };
}

export async function findDiagram(
    ddbClient: DynamoDBClient,
    userId: string,
    diagramId: string
): Promise<APIGatewayProxyResult> {
    const getItemResponse = await ddbClient.send(
        new GetItemCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
                id: { S: diagramId },
                userId: { S: userId },
            },
        })
    );
    if (getItemResponse.Item) {
        const unmarshalledItem = unmarshall(getItemResponse.Item);
        return {
            statusCode: 200,
            body: JSON.stringify(unmarshalledItem),
        };
    } else {
        return {
            statusCode: 404,
            body: JSON.stringify(`Diagram with id ${diagramId} not found!`),
        };
    }
}
