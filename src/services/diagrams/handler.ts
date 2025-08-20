import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { captureAWSv3Client } from "aws-xray-sdk-core";
import { addCorsHeader } from "../../Utils";
import { findDiagram, findDiagrams } from "./get-diagrams";
import { addDiagram } from "./post-diagrams";
import { updateDiagram } from "./update-diagrams";
import { MissingFieldError } from "../helpers/validation";
import { deleteDiagram } from "./delete-diagrams";

const ddbClient = captureAWSv3Client(new DynamoDBClient({}));

async function handler(
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> {
    let response: APIGatewayProxyResult;

    const claims = event.requestContext?.authorizer?.claims;
    const userId = claims?.sub;

    try {
        switch (event.httpMethod) {
            case "GET":
                if (
                    event.queryStringParameters &&
                    "id" in event.queryStringParameters
                ) {
                    const diagramId = event.queryStringParameters["id"];
                    response = await findDiagram(ddbClient, userId, diagramId);
                } else {
                    response = await findDiagrams(ddbClient, userId);
                }
                break;
            case "POST":
                const postResponse = await addDiagram(
                    ddbClient,
                    userId,
                    event.body
                );
                response = postResponse;
                break;
            case "PUT":
                const putResponse = await updateDiagram(
                    ddbClient,
                    userId,
                    event.body
                );
                response = putResponse;
                break;
            case "DELETE":
                if (
                    event.queryStringParameters &&
                    "id" in event.queryStringParameters
                ) {
                    const diagramId = event.queryStringParameters["id"];
                    response = await deleteDiagram(
                        ddbClient,
                        userId,
                        diagramId
                    );
                }
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
