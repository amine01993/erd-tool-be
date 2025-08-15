import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import {
    AccountRecovery,
    CfnIdentityPool,
    CfnIdentityPoolRoleAttachment,
    FeaturePlan,
    UserPool,
    UserPoolClient,
    VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { FederatedPrincipal, Role } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class AuthStack extends Stack {
    public userPool: UserPool;
    private userPoolClient: UserPoolClient;
    private identityPool: CfnIdentityPool;
    private authenticatedRole: Role;
    private unAuthenticatedRole: Role;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.createUserPool();
        this.createUserPoolClient();
        this.createIdentityPool();
        this.createRoles();
        this.attachRoles();
    }

    private createUserPool() {
        // Create a user pool
        this.userPool = new UserPool(this, "DiagramsUserPool", {
            selfSignUpEnabled: true,
            autoVerify: { email: true },
            signInCaseSensitive: false,
            signInAliases: {
                username: false,
                email: true,
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
            },
            userVerification: {
                emailSubject: "Email verification, Thanks for signing up!",
                emailBody: `Thanks for signing up to our awesome app! 
                    To verify your email please enter this code: {####}`,
                emailStyle: VerificationEmailStyle.CODE,
            },
            signInPolicy: {
                allowedFirstAuthFactors: { password: true },
            },
            featurePlan: FeaturePlan.LITE,
            standardAttributes: {
                fullname: {
                    required: false,
                    mutable: true,
                },
            },
            accountRecovery: AccountRecovery.EMAIL_ONLY,
        });

        new CfnOutput(this, "DiagramsUserPoolId", {
            value: this.userPool.userPoolId,
        });
    }

    private createUserPoolClient() {
        this.userPoolClient = this.userPool.addClient(
            "DiagramsUserPoolClient",
            {
                authFlows: {
                    custom: true,
                    userPassword: true,
                    userSrp: true,
                    adminUserPassword: true,
                },
                accessTokenValidity: Duration.hours(1),
                idTokenValidity: Duration.hours(1),
                refreshTokenValidity: Duration.days(30),
            }
        );
        new CfnOutput(this, "DiagramsUserPoolClientId", {
            value: this.userPoolClient.userPoolClientId,
        });
    }

    private createIdentityPool() {
        this.identityPool = new CfnIdentityPool(this, "DiagramsIdentityPool", {
            allowUnauthenticatedIdentities: true,
            cognitoIdentityProviders: [
                {
                    clientId: this.userPoolClient.userPoolClientId,
                    providerName: this.userPool.userPoolProviderName,
                },
            ],
        });
        new CfnOutput(this, "DiagramsIdentityPoolId", {
            value: this.identityPool.ref,
        });
    }

    private createRoles() {
        this.authenticatedRole = new Role(
            this,
            "CognitoDefaultAuthenticatedRole",
            {
                assumedBy: new FederatedPrincipal(
                    "cognito-identity.amazonaws.com",
                    {
                        StringEquals: {
                            "cognito-identity.amazonaws.com:aud":
                                this.identityPool.ref,
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
        this.unAuthenticatedRole = new Role(
            this,
            "CognitoDefaultUnauthenticatedRole",
            {
                assumedBy: new FederatedPrincipal(
                    "cognito-identity.amazonaws.com",
                    {
                        StringEquals: {
                            "cognito-identity.amazonaws.com:aud":
                                this.identityPool.ref,
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
    }

    private attachRoles() {
        new CfnIdentityPoolRoleAttachment(this, "DiagramsRolesAttachment", {
            identityPoolId: this.identityPool.ref,
            roles: {
                authenticated: this.authenticatedRole.roleArn,
                unauthenticated: this.unAuthenticatedRole.roleArn,
            },
        });
    }
}
