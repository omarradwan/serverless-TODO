// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = '...'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  domain: 'dev-7mvxnk67.eu.auth0.com',
  clientId: 'e1F5PFh4kmiPr4U7GGc4Uil5Cr0Rlg2J',
  callbackUrl: 'http://localhost:3000/callback'
}
