# Misc Workflow Utils

`index.js` shows a sample script that can login to Jenkins and JIRA. It will show a notification with the requested ticket status.

## Config
Create a file called `config/personal.json` and add your local values there.

Reference `config/index.js` for a list of values to set.

## Tools
 * `lib/api-jira.js` - Login and api methods for JIRA  
   Add new API calls to the `methods` object and url helpers in the `url` object.  
   Each API method should accept 'headers' as it's first argument, which will contain the auth cookie data.  
   Full API details can be found in [JIRA REST Docs](https://docs.atlassian.com/jira/REST/server/).
 * `lib/api-jenkin.js` - Login and api methods for Jenkins
 * `lib/api-github.js` - Token based api methods for GitHub
 * `lib/notification/index.js` - Desktop notification for OSX using automator CLI
 * `lib/get-credential.js` - Tool to prompt for missing credentials on the command line

## Dev Notes
* Follow standard js style guilde.
* Keep compatible with node v6 LTS.
