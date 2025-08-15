import { Stack, StackProps } from "aws-cdk-lib";
import {
    AuthorizationType,
    CognitoUserPoolsAuthorizer,
    Cors,
    LambdaIntegration,
    MethodOptions,
    ResourceOptions,
    RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { IUserPool } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

interface ApiStackProps extends StackProps {
    diagramsLambdaIntegration: LambdaIntegration;
    userPool: IUserPool;
}

export class ApiStack extends Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        const api = new RestApi(this, "DiagramsApi");

        const authorizer = new CognitoUserPoolsAuthorizer(
            this,
            "DiagramsApiAuthorizer",
            {
                cognitoUserPools: [props.userPool],
                identitySource: "method.request.header.Authorization",
            }
        );
        authorizer._attachToApi(api);

        const optionsWithAuth: MethodOptions = {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: {
                authorizerId: authorizer.authorizerId,
            },
        };

        const optionsWithCors: ResourceOptions = {
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS
            }
        }

        const diagramsResource = api.root.addResource("diagrams", optionsWithCors);
        diagramsResource.addMethod(
            "GET",
            props.diagramsLambdaIntegration,
            optionsWithAuth
        );
        diagramsResource.addMethod(
            "POST",
            props.diagramsLambdaIntegration,
            optionsWithAuth
        );
        diagramsResource.addMethod(
            "PUT",
            props.diagramsLambdaIntegration,
            optionsWithAuth
        );
        diagramsResource.addMethod(
            "DELETE",
            props.diagramsLambdaIntegration,
            optionsWithAuth
        );
    }
}
