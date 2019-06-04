# How do I integrate Slack with this Web Service?

1. Go to https://api.slack.com/apps and create a new app in your desired workspace.
2. Setup the slash command in the `Slash Commands` page under the `Features` heading in the sidenav bar.
    - Set the command, description, hint as desired.
    - Set the request URL to point to your instance's slash endpoint.
    - It should look like `https://my.web-service.com/slack/slash/ultilingo` out of the box.
3. Setup the interactive commands in the `Interactive Components` page under the `Features` heading in the sidenav bar.
    - Enable interactivity.
    - Set the request URL to point to your instance's interactive endpoint.
    - It should look like `https://my.web-service.com/slack/interactions` out of the box.
4. Add a bot user in the `Bot Users` page under the `Features` heading in the side navigation bar.
5. Setup permissions in the `OAuth & Permissions` page under the `Features` heading in the sidenav bar.
    - Add an `OAuth Access token` and `Bot User OAuth Access token`. Remember these tokens.
    - Add the following scopes:
        - channels:history
        - channels:read
        - chat:write:bot
        - groups:history
        - im:history
        - bot
        - commands
6. Add the following slack-specific environment variables to your deployed instance of the web service:
    - `SLACK_BOT_TOKEN`=`"<Slack Bot Token>"`
    - `SLACK_USER_TOKEN`=`"<Slack User Token>"`
    - `SLACK_SECRET`=`"<Slack Signing Secret>"`
7. Install the App to your workspace.