import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
} from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { captureAWSv3Client } from "aws-xray-sdk-core";
import { addCorsHeader } from "../../Utils";
import { findDeletedDiagrams, findDiagram, findDiagrams } from "./get-diagrams";
import { addDiagram } from "./post-diagrams";
import { recoverDiagram, updateDiagram } from "./update-diagrams";
import { MissingFieldError } from "../helpers/validation";
import { deleteDiagram, deleteDiagramPermanently } from "./delete-diagrams";

const ddbClient = captureAWSv3Client(new DynamoDBClient({}));

async function handler(
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> {
    let response: APIGatewayProxyResult;

    const claims = event.requestContext?.authorizer?.claims;
    const identity = event.requestContext?.identity;
    // ? Authenticated userId : Guest Id
    const userId = claims ? claims?.sub : identity.cognitoIdentityId;

    try {
        switch (event.httpMethod) {
            case "GET":
                if (
                    event.queryStringParameters &&
                    "id" in event.queryStringParameters
                ) {
                    const diagramId = event.queryStringParameters["id"];
                    response = await findDiagram(ddbClient, userId, diagramId);
                } else if (
                    event.queryStringParameters &&
                    "deleted" in event.queryStringParameters
                ) {
                    response = await findDeletedDiagrams(ddbClient, userId);
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
                if (
                    event.queryStringParameters &&
                    "id" in event.queryStringParameters &&
                    "recover" in event.queryStringParameters
                ) {
                    const diagramId = event.queryStringParameters["id"];
                    response = await recoverDiagram(
                        ddbClient,
                        userId,
                        diagramId
                    );
                } else {
                    response = await updateDiagram(
                        ddbClient,
                        userId,
                        event.body
                    );
                }
                break;
            case "DELETE":
                if (
                    event.queryStringParameters &&
                    "id" in event.queryStringParameters
                ) {
                    const isPermanent =
                        "perma" in event.queryStringParameters &&
                        Boolean(event.queryStringParameters["perma"]);
                    const diagramId = event.queryStringParameters["id"];
                    response = isPermanent
                        ? await deleteDiagramPermanently(
                              ddbClient,
                              userId,
                              diagramId
                          )
                        : await deleteDiagram(ddbClient, userId, diagramId);
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
