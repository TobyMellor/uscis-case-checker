# USCIS Case Checker

### What's this one do then?

Crawls USCIS every hour during the day and can notify contacts over email or text when your case has been updated.

You can set up a primary contact (yourself) and secondary contacts. If the application determines the update may be good or neutral, primary and secondary contacts are notified. Otherwise, only the primary contact is notified.

### Tech Stack

I wanted to explore some of the AWS services I haven't used before.

- TypeScript
- AWS Lambda
- Serverless
- AWS Simple Notification Service for SMS
- AWS Simple Email Service
- Google Natural Language API for determining whether it's good news or not
- Cheerio/Axios for crawling the web page
