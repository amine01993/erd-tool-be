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

    if (
        !("id" in item) ||
        (!("name" in item) && !("viewport" in item) && !("history" in item))
    ) {
        return {
            statusCode: 400,
            body: JSON.stringify("Incorrect arguments!"),
        };
    }

    if ("name" in item) {
        updates.push("#name = :name");
        names["#name"] = "name";
        values[":name"] = item["name"];
    }

    if ("viewport" in item) {
        updates.push("#viewport = :viewport");
        names["#viewport"] = "viewport";
        values[":viewport"] = item["viewport"];
    }

    if ("history" in item) {
        updates.push("#history = :history");
        names["#history"] = "history";
        values[":history"] = item["history"];
    }

    updates.push("#lastUpdate = :lastUpdate");
    names["#lastUpdate"] = "lastUpdate";
    values[":lastUpdate"] = new Date().toISOString();

    names["#deletedAt"] = "deletedAt";

    const updateResult = await ddbClient.send(
        new UpdateCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
                id: item.id,
                userId,
            },
            UpdateExpression: `SET ${updates.join(", ")}`,
            ConditionExpression: "attribute_not_exists(#deletedAt)",
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

export async function recoverDiagram(
    ddbClient: DynamoDBClient,
    userId: string,
    id: string
): Promise<APIGatewayProxyResult> {
    const updateResult = await ddbClient.send(
        new UpdateCommand({
            TableName: process.env.TABLE_NAME,
            Key: {
                id,
                userId,
            },
            UpdateExpression: `REMOVE #deletedAt`,
            ExpressionAttributeNames: {
                "#deletedAt": "deletedAt",
            },
        })
    );

    return {
        statusCode: 200,
        body: JSON.stringify(updateResult.Attributes),
    };
}
