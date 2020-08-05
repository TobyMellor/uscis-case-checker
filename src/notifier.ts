import { SNS, SES } from 'aws-sdk';
import language from '@google-cloud/language';

const NEGATIVE_SENTIMENT_THRESHOLD = -0.25 as const;
const NO_REPLY_TEXT = "This was an automated message, please don't reply." as const;

type Contact = {
  phoneNumber: string | null;
  email: string | null;
};

async function sendText(phoneNumber: string, heading: string, body: string): Promise<void> {
  const sns = new SNS({ apiVersion: 'latest' });
  const message = `${heading}\n\n${body}\n\n${NO_REPLY_TEXT}`;
  const senderName = process.env.MESSAGE_PREFIX.replace(/ /g, '');
  const params: SNS.Types.PublishInput = {
    Message: message,
    PhoneNumber: phoneNumber,
    MessageAttributes: {
      'AWS.SNS.SMS.SenderID': {
        DataType: 'String',
        StringValue: senderName,
      },
    },
  };

  await sns.publish(params).promise();
}

async function sendEmails(emails: string[], heading: string, body: string): Promise<void> {
  if (!emails.length) {
    return;
  }

  const ses = new SES({ apiVersion: 'latest' });
  const sourceEmail: string = process.env.SENDER_EMAIL;
  const subject = `${process.env.MESSAGE_PREFIX} – ${heading}`;
  const contents = `${body}\n\n${NO_REPLY_TEXT}`;

  try {
    await ses
      .sendEmail({
        Source: sourceEmail,
        Destination: {
          ToAddresses: emails,
        },
        Message: {
          Body: {
            Text: {
              Charset: 'UTF-8',
              Data: contents,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject,
          },
        },
      })
      .promise();
  } catch (e) {
    console.error('Email could not be sent…', e.message);
  }
}

export async function sendNotifications(heading: string, body: string): Promise<void> {
  const recipientContacts: Contact[] = [JSON.parse(process.env.PRIMARY_CONTACT)];
  const isNeutralOrPositive = await hasNeutralOrPositiveSentiment(heading);

  if (isNeutralOrPositive) {
    const secondaryContacts: Contact[] = JSON.parse(process.env.SECONDARY_CONTACTS);
    recipientContacts.push(...secondaryContacts);
  }

  const {
    emails,
    phoneNumbers,
  }: { emails: string[]; phoneNumbers: string[] } = recipientContacts.reduce(
    (acc, { email, phoneNumber }) => {
      if (email) {
        acc.emails.push(email);
      }

      if (phoneNumber) {
        acc.phoneNumbers.push(phoneNumber);
      }

      return acc;
    },
    { emails: [], phoneNumbers: [] },
  );

  console.log('Notifying Contacts!', { isNeutralOrPositive, emails, phoneNumbers });

  await Promise.all([
    sendEmails(emails, heading, body),
    ...phoneNumbers.map((phoneNumber) => sendText(phoneNumber, heading, body)),
  ]);
}

export async function hasNeutralOrPositiveSentiment(text: string): Promise<boolean> {
  const client = new language.LanguageServiceClient();
  const [result] = await client.analyzeSentiment({
    document: {
      content: text,
      type: 'PLAIN_TEXT',
    },
  });
  const score = result.documentSentiment?.score ?? 0;

  return score > NEGATIVE_SENTIMENT_THRESHOLD;
}
