import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";

export async function updateDiagram(
    ddbClient: DynamoDBClient,
    userId: string,
    body: string
): Promise<APIGatewayProxyResult> {

    const item = JSON.parse(body);
    const updates = [];
    const names = {};
    const values = {};

    if (!("id" in item) || (!("viewport" in item) && !("history" in item))) {
        return {
            statusCode: 400,
            body: JSON.stringify("Incorrect arguments!"),
        };
    }

    if ("viewport" in item) {
        updates.push("#viewport = :viewport");
        names["#viewport"] = ":viewport";
        values[":viewport"] = item["viewport"];
    }
    
    if ("history" in item) {
        updates.push("#history = :history");
        names["#history"] = ":history";
        values[":history"] = item["history"];
    }

    updates.push("#lastUpdate = :lastUpdate");
    names["#lastUpdate"] = ":lastUpdate";
    values[":lastUpdate"] = new Date().toISOString();

    updates.push("#userId = :userId");
    names["#userId"] = ":userId";
    values[":userId"] = userId;

    const updateResult = await ddbClient.send(
        new UpdateCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
                id: item.id,
            },
            ConditionExpression: "#userId = :userId",
            UpdateExpression: `SET ${updates.join(", ")}`,
            ExpressionAttributeValues: values,
            ExpressionAttributeNames: names,
            ReturnValues: "UPDATED_NEW",
        })
    );

    return {
        statusCode: 200,
        body: JSON.stringify(updateResult.Attributes),
    };
}
