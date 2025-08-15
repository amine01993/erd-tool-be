import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Alarm, Metric, Unit } from "aws-cdk-lib/aws-cloudwatch";
import { SnsAction } from "aws-cdk-lib/aws-cloudwatch-actions";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";

export class MonitorStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const alarmTopic = new Topic(this, "DiagramAlarmTopic", {
            displayName: "DiagramDAlarmTopic",
            topicName: "DiagramTAlarmTopic",
        });

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

        const topicAction = new SnsAction(alarmTopic);
        diagramsApi4xxAlarm.addAlarmAction(topicAction);
        diagramsApi4xxAlarm.addOkAction(topicAction);
    }
}
