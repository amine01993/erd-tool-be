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
import {
    CfnIdentityPool,
    CfnIdentityPoolRoleAttachment,
    IUserPool,
} from "aws-cdk-lib/aws-cognito";
import {
    Effect,
    FederatedPrincipal,
    PolicyStatement,
    Role,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface ApiStackProps extends StackProps {
    diagramsLambdaIntegration: LambdaIntegration;
    diagramsFeedbackLambdaIntegration: LambdaIntegration;
    userPool: IUserPool;
    identityPool: CfnIdentityPool;
}

export class ApiStack extends Stack {
    public api: RestApi;
    public feedbackApi: RestApi;
    public unAuthenticatedRole: Role;
    public authenticatedRole: Role;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        this.createAndAttachRoles(props);

        this.api = new RestApi(this, "DiagramsApi");

        const authorizer = new CognitoUserPoolsAuthorizer(
            this,
            "DiagramsApiAuthorizer",
            {
                cognitoUserPools: [props.userPool],
                identitySource: "method.request.header.Authorization",
            }
        );
        authorizer._attachToApi(this.api);

        this.addResources(props, authorizer);

        const apiArn = `arn:aws:execute-api:${this.region}:${this.account}:${this.api.restApiId}`;

        this.unAuthenticatedRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["execute-api:Invoke"],
                resources: [
                    `${apiArn}/*/GET/diagramsForGuests`,
                    `${apiArn}/*/POST/diagramsForGuests`,
                    `${apiArn}/*/PUT/diagramsForGuests`,
                    `${apiArn}/*/DELETE/diagramsForGuests`,
                    `${apiArn}/*/OPTIONS/*`,
                ],
            })
        );

        this.feedbackApi = new RestApi(this, "DiagramsFeedbackApi");

        const feedbackAuthorizer = new CognitoUserPoolsAuthorizer(
            this,
            "DiagramsFeedbackApiAuthorizer",
            {
                cognitoUserPools: [props.userPool],
                identitySource: "method.request.header.Authorization",
            }
        );
        feedbackAuthorizer._attachToApi(this.feedbackApi);

        this.addFeedbackResources(props, feedbackAuthorizer);

        const feedbackApiArn = `arn:aws:execute-api:${this.region}:${this.account}:${this.feedbackApi.restApiId}`;

        this.unAuthenticatedRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["execute-api:Invoke"],
                resources: [
                    `${feedbackApiArn}/*/POST/feedbackForGuests`,
                    `${feedbackApiArn}/*/OPTIONS/*`,
                ],
            })
        );
    }

    createAndAttachRoles(props: ApiStackProps) {
        this.unAuthenticatedRole = new Role(
            this,
            "CognitoDefaultUnauthenticatedRole",
            {
                assumedBy: new FederatedPrincipal(
                    "cognito-identity.amazonaws.com",
                    {
                        StringEquals: {
                            "cognito-identity.amazonaws.com:aud":
                                props.identityPool.ref,
                        },
                        "ForAnyValue:StringLike": {
                            "cognito-identity.amazonaws.com:amr":
                                "unauthenticated",
                        },
                    },
                    "sts:AssumeRoleWithWebIdentity"
                ),
            }
        );

        this.authenticatedRole = new Role(
            this,
            "CognitoDefaultAuthenticatedRole",
            {
                assumedBy: new FederatedPrincipal(
                    "cognito-identity.amazonaws.com",
                    {
                        StringEquals: {
                            "cognito-identity.amazonaws.com:aud":
                                props.identityPool.ref,
                        },
                        "ForAnyValue:StringLike": {
                            "cognito-identity.amazonaws.com:amr":
                                "authenticated",
                        },
                    },
                    "sts:AssumeRoleWithWebIdentity"
                ),
            }
        );

        new CfnIdentityPoolRoleAttachment(this, "DiagramsRolesAttachment", {
            identityPoolId: props.identityPool.ref,
            roles: {
                authenticated: this.authenticatedRole.roleArn,
                unauthenticated: this.unAuthenticatedRole.roleArn,
            },
        });
    }

    addResources(props: ApiStackProps, authorizer: CognitoUserPoolsAuthorizer) {
        const optionsWithAuth: MethodOptions = {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: {
                authorizerId: authorizer.authorizerId,
            },
        };

        const optionsWithCors: ResourceOptions = {
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS,
                allowHeaders: [
                    "Content-Type",
                    "Authorization",
                    "X-Amz-Content-Sha256",
                    "X-Amz-Date",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                    "Access-Control-Allow-Origin",
                ],
            },
        };
        const diagramsResource = this.api.root.addResource(
            "diagrams",
            optionsWithCors
        );
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

        const diagramsResourceForGuests = this.api.root.addResource(
            "diagramsForGuests",
            optionsWithCors
        );
        diagramsResourceForGuests.addMethod(
            "GET",
            props.diagramsLambdaIntegration,
            {
                authorizationType: AuthorizationType.IAM,
            }
        );
        diagramsResourceForGuests.addMethod(
            "POST",
            props.diagramsLambdaIntegration,
            {
                authorizationType: AuthorizationType.IAM,
            }
        );
        diagramsResourceForGuests.addMethod(
            "PUT",
            props.diagramsLambdaIntegration,
            {
                authorizationType: AuthorizationType.IAM,
            }
        );
        diagramsResourceForGuests.addMethod(
            "DELETE",
            props.diagramsLambdaIntegration,
            {
                authorizationType: AuthorizationType.IAM,
            }
        );
    }

    addFeedbackResources(props: ApiStackProps, authorizer: CognitoUserPoolsAuthorizer) {
        const optionsWithAuth: MethodOptions = {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: {
                authorizerId: authorizer.authorizerId,
            },
        };

        const optionsWithCors: ResourceOptions = {
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowMethods: Cors.ALL_METHODS,
                allowHeaders: [
                    "Content-Type",
                    "Authorization",
                    "X-Amz-Content-Sha256",
                    "X-Amz-Date",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                    "Access-Control-Allow-Origin",
                ],
            },
        };
        const feedbackResource = this.feedbackApi.root.addResource(
            "feedback",
            optionsWithCors
        );
        feedbackResource.addMethod(
            "POST",
            props.diagramsFeedbackLambdaIntegration,
            optionsWithAuth
        );

        const feedbackResourceForGuests = this.feedbackApi.root.addResource(
            "feedbackForGuests",
            optionsWithCors
        );
        feedbackResourceForGuests.addMethod(
            "POST",
            props.diagramsFeedbackLambdaIntegration,
            {
                authorizationType: AuthorizationType.IAM,
            }
        );
    }
}
