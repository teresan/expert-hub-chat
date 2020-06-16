const config     = require('./config');
const express    = require('express');
const bodyParser = require('body-parser');
const twilio     = require('twilio');

const AccessToken = twilio.jwt.AccessToken;
const ChatGrant = AccessToken.ChatGrant;
const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);

const app = new express();
app.use(bodyParser.json());

app.post('/token/:identity', (request, response) => {
  const identity = request.params.identity;

  console.log(config.twilio)

  const accessToken = new AccessToken(config.twilio.accountSid, config.twilio.apiKey, config.twilio.apiSecret);
  const chatGrant = new ChatGrant({
    serviceSid: config.twilio.chatServiceSid,
    endpointId: `${identity}:browser`
  });
  accessToken.addGrant(chatGrant);
  accessToken.identity = identity;
  response.set('Content-Type', 'application/json');
  response.send(JSON.stringify({
    token: accessToken.toJwt(),
    identity: identity
  }));
})

app.post('/channelWebhook', (request, response) => {

  const channelSid = request.params.channelSid;
  console.log(request.params);
  console.log(`channelWebhook:${channelSid}`);

  client.chat.services(config.twilio.chatServiceSid)
    .channels(channelSid)
    .webhooks
    .create({
      'configuration.flowSid': config.twilio.studioFlowSid,
      type: 'studio'
    })
  .then(webhook => console.log(`Webhook sid ${webhook.sid}`));

})

app.listen(config.port, () => {
  console.log(`Application started at localhost:${config.port}`);
});
