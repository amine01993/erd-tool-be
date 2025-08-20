import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { ITableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface LambdaStackProps extends StackProps {
    diagramsTable: ITableV2;
}

export class LambdaStack extends Stack {
    public readonly diagramsLambdaIntegration: LambdaIntegration;

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        const diagramsLambda = new NodejsFunction(this, "DiagramsLambda", {
            runtime: Runtime.NODEJS_20_X,
            handler: "handler",
            entry: join(
                __dirname,
                "..",
                "services",
                "diagrams",
                "handler.ts"
            ),
            environment: {
                TABLE_NAME: props.diagramsTable.tableName,
            },
            memorySize: 256,
            tracing: Tracing.ACTIVE,
            timeout: Duration.minutes(1),
        });

        diagramsLambda.addToRolePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                resources: [props.diagramsTable.tableArn],
                actions: [
                    "dynamodb:UpdateItem",
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:Scan",
                ],
            })
        );

        this.diagramsLambdaIntegration = new LambdaIntegration(diagramsLambda);
    }
}
