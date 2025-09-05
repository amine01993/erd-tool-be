import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, ITableV2, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { getSuffixFromStack } from "../Utils";

export class DatabaseStack extends Stack {
    public readonly diagramsTable: ITableV2;
    public readonly diagramsFeedbackTable: ITableV2;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const suffix = getSuffixFromStack(this);

        this.diagramsTable = new TableV2(this, "DiagramsTable", {
            partitionKey: {
                name: "id",
                type: AttributeType.STRING,
            },
            sortKey: {
                name: "userId",
                type: AttributeType.STRING,
            },
            contributorInsights: false,
            tableName: `DiagramsTable-${suffix}`,
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true,
                recoveryPeriodInDays: 3,
            },
            timeToLiveAttribute: "ttl",
        });

        new CfnOutput(this, "DiagramsTableName", {
            value: this.diagramsTable.tableName,
        });

        this.diagramsFeedbackTable = new TableV2(this, "DiagramsFeedbackTable", {
            partitionKey: {
                name: "id",
                type: AttributeType.STRING,
            },
            sortKey: {
                name: "userId",
                type: AttributeType.STRING,
            },
            contributorInsights: false,
            tableName: `DiagramsFeedbackTable-${suffix}`,
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true,
                recoveryPeriodInDays: 3,
            },
        });

        new CfnOutput(this, "DiagramsFeedbackTableName", {
            value: this.diagramsFeedbackTable.tableName,
        });
    }
}
