import { App } from "aws-cdk-lib";
import { DatabaseStack } from "./stacks/DatabaseStack";
import { LambdaStack } from "./stacks/LambdaStack";
import { ApiStack } from "./stacks/ApiStack";
import { AuthStack } from "./stacks/AuthStack";
import { MonitorStack } from "./stacks/MonitorStack";

const app = new App();

const authStack = new AuthStack(app, 'DiagramsAuthStack');

const dataStack = new DatabaseStack(app, "DiagramsDataStack");

const lambdaStack = new LambdaStack(app, "DiagramsLambdaStack", {
    diagramsTable: dataStack.diagramsTable,
});

new ApiStack(app, "DiagramsApiStack", {
    diagramsLambdaIntegration: lambdaStack.diagramsLambdaIntegration,
    userPool: authStack.userPool,
});

new MonitorStack(app, 'DiagramsMonitorStack')

