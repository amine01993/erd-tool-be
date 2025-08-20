import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, ITableV2, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { getSuffixFromStack } from "../Utils";

export class DatabaseStack extends Stack {
    public readonly diagramsTable: ITableV2;

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
            contributorInsights: true,
            tableName: `DiagramsTable-${suffix}`,
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: true,
                recoveryPeriodInDays: 3,
            },
        });

        new CfnOutput(this, "DiagramsTableName", {
            value: this.diagramsTable.tableName,
        });
    }
}
