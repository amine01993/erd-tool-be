import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Alarm, Metric, Unit } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Topic } from "aws-cdk-lib/aws-sns";
import { LambdaSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from "constructs";
import { readFileSync } from "fs";
import { join } from "path";

export class MonitorStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const alarmTopic = new Topic(this, "DiagramAlarmTopic", {
            displayName: "DiagramDAlarmTopic",
            topicName: "DiagramTAlarmTopic",
        });
        const topicAction = new SnsAction(alarmTopic);

        const diagramsApi4xxAlarm = new Alarm(this, "diagramsApi4xxAlarm", {
            metric: new Metric({
                metricName: "4XXError",
                namespace: "AWS/ApiGateway",
                period: Duration.minutes(1),
                statistic: "Sum",
                unit: Unit.COUNT,
                dimensionsMap: {
                    ApiName: "DiagramsApi",
                },
            }),
            evaluationPeriods: 1,
            threshold: 5,
            alarmName: "DiagramsApi4xxAlarm",
        });

        const diagramsApi5xxAlarm = new Alarm(this, "diagramsApi5xxAlarm", {
            metric: new Metric({
                metricName: "5XXError",
                namespace: "AWS/ApiGateway",
                period: Duration.minutes(1),
                statistic: "Sum",
                unit: Unit.COUNT,
                dimensionsMap: {
                    ApiName: "DiagramsApi",
                },
            }),
            evaluationPeriods: 1,
            threshold: 5,
            alarmName: "DiagramsApi5xxAlarm",
        });

        const diagramsFeedbackApi4xxAlarm = new Alarm(
            this,
            "diagramsFeedbackApi4xxAlarm",
            {
                metric: new Metric({
                    metricName: "4XXError",
                    namespace: "AWS/ApiGateway",
                    period: Duration.minutes(10),
                    statistic: "Sum",
                    unit: Unit.COUNT,
                    dimensionsMap: {
                        ApiName: "DiagramsFeedbackApi",
                    },
                }),
                evaluationPeriods: 1,
                threshold: 2,
                alarmName: "DiagramsFeedbackApi4xxAlarm",
            }
        );

        const diagramsFeedbackApi5xxAlarm = new Alarm(
            this,
            "diagramsFeedbackApi5xxAlarm",
            {
                metric: new Metric({
                    metricName: "5XXError",
                    namespace: "AWS/ApiGateway",
                    period: Duration.minutes(10),
                    statistic: "Sum",
                    unit: Unit.COUNT,
                    dimensionsMap: {
                        ApiName: "DiagramsFeedbackApi",
                    },
                }),
                evaluationPeriods: 1,
                threshold: 2,
                alarmName: "DiagramsFeedbackApi5xxAlarm",
            }
        );

        diagramsApi4xxAlarm.addAlarmAction(topicAction);
        diagramsApi5xxAlarm.addAlarmAction(topicAction);
        diagramsFeedbackApi4xxAlarm.addAlarmAction(topicAction);
        diagramsFeedbackApi5xxAlarm.addAlarmAction(topicAction);

        const errorTemplate = readFileSync(
            join(
                __dirname,
                "..",
                "services",
                "emails",
                "diagram-error-template.ejs"
            ),
            "utf-8"
        );

        const diagramsErrorAlertLambda = new NodejsFunction(
            this,
            "DiagramsErrorAlertLambda",
            {
                runtime: Runtime.NODEJS_20_X,
                handler: "handler",
                entry: join(
                    __dirname,
                    "..",
                    "services",
                    "emails",
                    "diagram-error-handler.ts"
                ),
                environment: {
                    FROM_EMAIL: "err.amine93@gmail.com",
                    TO_EMAIL: "err.amine93@gmail.com",
                    ERROR_TEMPLATE: errorTemplate,
                },
                memorySize: 256,
                timeout: Duration.seconds(20),
                tracing: Tracing.ACTIVE,
            }
        );

        diagramsErrorAlertLambda.addToRolePolicy(
            new PolicyStatement({
                resources: ["*"],
                actions: ["ses:SendEmail"],
                effect: Effect.ALLOW,
            })
        );

        alarmTopic.addSubscription(
            new LambdaSubscription(diagramsErrorAlertLambda)
        );
    }
}
