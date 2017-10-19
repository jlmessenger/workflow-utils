# Misc Workflow Utils

`index.js` shows a sample script that can login to JIRA and show a notification with the requested ticket status.

It uses ENV variables:

 * `JIRA_URL` - your JIRA instance url
 * `JIRA_USER` - your JIRA username (usually your email address)
 * `JIRA_PASS` - base64 encoded JIRA password

Once it has logged in, it will store the session cookie in `.cookie.json` and re-use that cookie in the future.
If the session has expired or the cookie file is missing, it will login with the above ENV variables.

**You likely want a better system for storing your password!**

## Config
Update `config.js` as needed.

## Tools
 * `fetch-rest.js` - A simple helper for calling JSON rest APIs.
 * `fs-json.js` - Promise based read/write JSON files
 * `jira-api.js` - Login and api methods for JIRA  
   Add new API calls to the `methods` object and url helpers in the `url` object.  
   Each API method should accept 'headers' as it's first argument, which will contain the auth cookie data.  
   Full API details can be found in [JIRA REST Docs](https://docs.atlassian.com/jira/REST/server/).
 * `notification.js` - Desktop notification for OSX using automator CLI

## Dev Notes
* Follow standard js style guilde.
* Keep compatible with node v6 LTS.
