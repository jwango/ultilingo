# Why you need UltiLingo
Has "Steve from Product" ever dropped a term in a meeting, and you have no clue what it means? We've all been there. And frankly?? Steve only heard the term this morning.

Any group of developers, startup, or company has a constantly evolving vocabulary. Keeping up with it all can be almost impossible. Sure, the terms might all be documented...but it's not easily accessible.

That's where UltiLingo comes in. With integrations, you can lookup a term in your favorite communication tool. Anyone can add a definition to a term, and the most upvoted definitions rise to the top.

Even better: UltiLingo learns with you. It recognizes terms that your company seems to be using, and recommends them to be added to your company's crowd-sourced glossary.

# How does it work?

## Slack
`/ultilingo contribute`

Searches the current conversation or channel and suggests terms to define.

`/ultilingo <term>`

Searches the glossary for the term. If no similar entry is found, prompts user to add a definition for the entry.

## General API
`[ GET]  /entries`

`[POST]  /entries`

`[ GET]  /entries/:entryId`

`[ GET]  /entries/:entryId/definitions`

`[POST]  /entries/:entryId/definitions`

`[ GET]  /definitions`

`[POST]  /definitions`

`[ GET]  /definitions/:definitionId`

`[POST]  /definitions/:definitionId/votes`

# TODO

## TODO (MVP):
- [ ] Persistent DB integration with MongoDB (make sure to follow all security protocols!)
- [x] Flagging of definitions (all)
- [ ] Deleting of definitions (admins)
- [ ] Deleting of entries (admins)
- [ ] General API security
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
