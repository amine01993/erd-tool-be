import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { Context, SNSEvent } from "aws-lambda";
import { render } from "ejs";

export async function handler(event: SNSEvent, context: Context) {
    const snsRecord = event.Records[0];
    const snsMessage = JSON.parse(snsRecord.Sns.Message);

    const subject = `CloudWatch Alert: ${snsMessage.AlarmName}`;
    const htmlBody = render(process.env.ERROR_TEMPLATE, {
        alarmName: snsMessage.AlarmName,
        region: snsMessage.Region,
        datetime: new Date(snsMessage.StateChangeTime).toLocaleString(),
        snsMessage: JSON.stringify(snsMessage, null, 4).replace(/\n/g, "<br>"),
    });

    const params = {
        Source: process.env.FROM_EMAIL,
        Destination: {
            ToAddresses: [process.env.TO_EMAIL],
        },
        Message: {
            Subject: { Data: subject },
            Body: {
                Html: { Data: htmlBody },
            },
        },
    };

    const sesClient = new SESClient({ region: process.env.AWS_REGION });

    await sesClient.send(new SendEmailCommand(params));
}
