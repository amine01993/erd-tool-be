import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { captureAWSv3Client } from "aws-xray-sdk-core";
import { addCorsHeader } from "../../Utils";
import { addFeedback } from "./post-feedback";
import { MissingFieldError } from "../helpers/validation";

const ddbClient = captureAWSv3Client(new DynamoDBClient({}));

async function handler(
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> {
    let response: APIGatewayProxyResult;

    const claims = event.requestContext?.authorizer?.claims;
    const identity = event.requestContext?.identity;
    const userId = claims ? claims?.sub : identity.cognitoIdentityId;

    try {
        switch (event.httpMethod) {
            case "POST":
                const postResponse = await addFeedback(
                    ddbClient,
                    userId,
                    event.body,
                    process.env.FEEDBACK_TEMPLATE
                );
                response = postResponse;
                break;
            default:
                break;
        }
    } catch (error) {
        console.error(error);

        if (error instanceof MissingFieldError) {
            return {
                statusCode: 400,
                body: error.message,
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify(error.message),
        };
    }

    if (!response) {
        return {
            statusCode: 404,
            body: "Request Error",
        };
    }

    addCorsHeader(response);

    return response;
}

export { handler };
