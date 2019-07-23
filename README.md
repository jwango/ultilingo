# Why you need UltiLingo
Has "Steve from Product" ever dropped a term in a meeting, and you have no clue what it means? We've all been there. And frankly?? Steve only heard the term this morning.

Any group of developers, startup, or company has a constantly evolving vocabulary. Keeping up with it all can be almost impossible. Sure, the terms might all be documented...but it's not easily accessible.

That's where UltiLingo comes in. With integrations, you can lookup a term in your favorite communication tool. Anyone can add a definition to a term, and the most upvoted definitions rise to the top.

Even better: UltiLingo learns with you. It recognizes terms that your company seems to be using, and recommends them to be added to your company's crowd-sourced glossary.

# How does it work?

## API

### Slack
Setup your app using these [instructions](integrations/slack/README.md) in the slack integrations folder.

`/ultilingo contribute`

Searches the current conversation or channel and suggests terms to define.

`/ultilingo <term>`

Searches the glossary for the term. If no similar entry is found, prompts user to add a definition for the entry.

### General API
`[ GET]  /entries`

`[POST]  /entries`

`[ GET]  /entries/:entryId`

`[ GET]  /entries/:entryId/definitions`

`[POST]  /entries/:entryId/definitions`

`[ GET]  /entries/:entryId/definitions/:definitionId`

`[ GET]  /entries/:entryId/definitions/:definitionId/votes`

`[POST]  /entries/:entryId/definitions/:definitionId/votes`

`[ GET]  /entries/:entryId/definitions/:definitionId/flags`

`[POST]  /entries/:entryId/definitions/:definitionId/flags`

`[GET]   /slack/oauth/accessToken`

`[GET]   /slack/oauth/callback`


## Running

### Locally
0. This is a node project, so you will need to install [NodeJs](https://nodejs.org/en/).
1. Install dependencies with `npm install`.
2. Add a `.env` file in the root of the project for environment variables:
    - `SLACK_BOT_TOKEN`=`"<Slack Bot Token>"`
    - `SLACK_USER_TOKEN`=`"<Slack User Token>"`
    - `SLACK_CLIENT_ID`=`"<Slack Client ID>"`
    - `SLACK_CLIENT_SECRET`=`"<Slack Client Secret>"`
    - `SLACK_REDIRECT_URI`=`"<Slack OAuth Redirect URI>"`
    - `SLACK_SECRET`=`"<Slack Signing Secret>"`
    - `SLACK_ADMIN_WHITELIST`=`"<admin1_team_id>.<admin1_user_Id>,<admin2_team_id>.<admin2_user_id>"`
    - `LOG_LEVEL`=`"WARN"`
    - `FLAG_THRESHOLD`=`"1"`
    - `ENABLE_API`=`"true" // set this to true for debugging the general API`
3. Run the service with `npm start`. It should now deploy on `http://localhost:3000`.

### Deployed
Same deal as running locally, except on your favorite hosting solution. Whatever your provider, be sure to add the requisite environment variables.

# TODO

## TODO (MVP):
- [x] Persistent DB integration with MongoDB
- [ ] Review scalability via MongoDB
- [ ] Look at MongoDB transactions, atomic ops, and failure conditions
- [x] Flagging of definitions (all)
- [ ] Deleting of definitions (admins)
- [ ] Deleting of entries (admins)
- [x] General API security (secured via on / off flag + slack oauth flow)
- [x] Slack request verification (secure slack integration API from DDoS / malicious intent)
- [x] Test terms that have spaces in them
- [ ] Improve matching algorithm to provide suggestions
- [x] Improve naive search performance with binaryIndexOf
- [x] Slack limit number of definitions shown
- [x] Limit "contribute" to current channel-like conversation
- [ ] Slack clean up immediate responses
- [ ] Slack investigate warning icon next to "Show More" and "Good Definition"
- [ ] Slack add failure responses

## TODO (Backlog):
- [ ] "Spaces" to localize entries and definitions
- [ ] Google Hangouts Chat integration 
