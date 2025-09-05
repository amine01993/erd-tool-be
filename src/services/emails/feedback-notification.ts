import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { render } from "ejs";

interface FeedbackNotificationProps {
    feedback: {
        id: string;
        name?: string;
        email: string;
        message: string;
        createdAt: string;
    };
    template: string;
}

export async function sendFeedbackNotification({ feedback, template }: FeedbackNotificationProps) {
    const sesClient = new SESClient({ region: process.env.AWS_REGION });

    const subject = `New Feedback Received from ${feedback.email}`;

    const htmlBody = await render(template, {
        feedbackId: feedback.id,
        name: feedback.name || "N/A",
        email: feedback.email,
        message: feedback.message.replace(/\n/g, "<br>"),
        createdAt: feedback.createdAt,
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

    await sesClient.send(new SendEmailCommand(params));
}
