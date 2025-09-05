import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyResult } from "aws-lambda";
import { validateFeedback } from "../helpers/validation";
import { sendFeedbackNotification } from "../emails/feedback-notification";

export async function addFeedback(
    ddbClient: DynamoDBClient,
    userId: string,
    body: string,
    template: string
): Promise<APIGatewayProxyResult> {
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

    const item = JSON.parse(body);

    validateFeedback(item);

    const newItem = {
        id: item.id,
        userId: userId,
        name: item.name,
        email: item.email,
        message: item.message,
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
    };

    const result = await ddbDocClient.send(
        new PutCommand({
            TableName: process.env.TABLE_NAME,
            Item: newItem,
        })
    );

    try {
        await sendFeedbackNotification({ feedback: newItem, template });
    }
    catch (error) {
        console.error("Error sending feedback notification email:", error);
    }


    return {
        statusCode: 201,
        body: JSON.stringify({ id: item.id }),
    };
}
