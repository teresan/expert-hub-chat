import React, { Component } from 'react';
import NameBox from './NameBox.js';
import {Container, Button, Input} from '@material-ui/core'
import SendIcon from '@material-ui/icons/Send';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';


const Chat = require('twilio-chat');


class ChatApp extends Component {
  constructor(props) {
    super(props);
    const name = localStorage.getItem('name') || '';
    const loggedIn = name !== '';
    this.state = {
      name,
      loggedIn,
      token: '',
      chatReady: false,
      messages: [],
      newMessage: ''
    };
    this.channelName = 'general';
  }

  componentDidMount = () => {
    if (this.state.loggedIn) {
      this.getToken();
    }
  };

  onNameChanged = event => {
    this.setState({ name: event.target.value });
  };

  logIn = event => {
    event.preventDefault();
    console.log("inside login");
    if (this.state.name !== '') {
      localStorage.setItem('name', this.state.name);
      this.setState({ loggedIn: true }, this.getToken);
    }
  };

  logOut = event => {
    event.preventDefault();
    this.setState({
      name: '',
      loggedIn: false,
      token: '',
      chatReady: false,
      messages: [],
      newMessage: ''
    });
    localStorage.removeItem('name');
    this.chatClient.shutdown();
    this.channel = null;
  };

  getToken = () => {
    console.log("inside get token");

    fetch(`/token/${this.state.name}`, {
      method: 'POST'
    })
      .then(response => response.json())
      .then(data => {
        console.log(data.token);
        this.setState({ token: data.token }, this.initChat);
      });
  };

  setUpStudioWebhook = (channel) => {

    let params = {
      channelSid: channel.sid
    };

    //setup studio webhook
    fetch(`/channelWebhook`, {
      method: 'POST',
      body: JSON.stringify(params)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        return this.channel;
    });

  }

  initChat = () => {
    console.log(this.state.token);
    Chat.Client.create(this.state.token).then(client => {
      this.chatClient = client;
      this.clientInitiated()//.then(channel => {
        console.log('here: '+this.channel);
      this.setUpStudioWebhook(this.channel).then(channel => {
        console.log('webhook');
      });
      //this.chatClient.initialize().then(this.clientInitiated.bind(this));
    })
    .catch(e => console.log(e));
  };

  clientInitiated = () => {
    this.setState({ chatReady: true }, () => {
      this.chatClient.getChannelByUniqueName(this.channelName)
        .then(channel => {
          if (channel) {
            console.log(`existing channel ${channel.name} ${channel.sid} `)
            // this.setUpStudioWebhook(channel);
            return (this.channel = channel);
          }
        })
        .catch(err => {
          if(err.body.code === 50300){
            console.log(`non existing channel`);
            let channel = this.chatClient.createChannel({
              uniqueName: this.channelName
            });
            console.log(`created channel ${channel.name} ${channel.sid} `)
            // this.setUpStudioWebhook(channel);
            return (this.channel = channel);
          }
        })
        .then(channel => {
          console.log(`this channel is ${channel.sid}`);
          console.log(this.channel.sid);
          // this.setUpStudioWebhook(channel);
          window.channel = this.channel;
          if(channel.state.status !== "joined") return channel.join()
          return this.channel;
        })
        .then(() => {
          this.channel.getMessages().then(this.messagesLoaded);
          this.channel.on('messageAdded', this.messageAdded);
        });
    });
  };

  messagesLoaded = messagePage => {
    this.setState({ messages: messagePage.items });
  };

  messageAdded = message => {
    this.setState((prevState, props) => ({
      messages: [...prevState.messages, message]
    }));
  };

  onMessageChanged = event => {
    console.log("change");
    this.setState({ newMessage: event.target.value });
  };

  sendMessage = event => {
    event.preventDefault();
    const message = this.state.newMessage;
    this.setState({ newMessage: '' });
    this.channel.sendMessage(message);
  };

  newMessageAdded = li => {
    if (li) {
      li.scrollIntoView();
    }
  };

  render() {
    var loginOrChat;
    const messages = this.state.messages.map(message => {
      return (
        <li key={message.sid} ref={this.newMessageAdded}>
          <b>{message.author}:</b> {message.body}
        </li>
      );
    });
    if (this.state.loggedIn) {
      loginOrChat = (
        <Container>
          
          <ul className="messages">
            {messages}
          </ul>
         
          <Container fluid  onSubmit={this.sendMessage}>
            <Input
              type="text"
              name="message"
              id="message"
              onChange={this.onMessageChanged}
              value={this.state.newMessage}
              placeholder="your message here"
            />
           
            <span className="button-container">
              <IconButton type="submit" color="secondary" disableElevation onClick={this.sendMessage} aria-label="send">
                  <SendIcon fontSize="small" color="primary" />
              </IconButton>
            </span>
         </Container>
          <br /><br />
          <div><i>Logged in as {this.state.name}</i></div>
          
          <Button  variant="contained" color="secondary" disableElevation onClick={this.logOut}>LOG OUT</Button>
          
        </Container>
      );
    } else {
      loginOrChat = (
        <div>
          <NameBox
            name={this.state.name}
            onNameChanged={this.onNameChanged}
            logIn={this.logIn}
          />
        </div>
      );
    }
    return (
      <div>
        {loginOrChat}
      </div>
    );
  }
}

export default ChatApp;
