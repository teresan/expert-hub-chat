import React, { Component } from 'react';
import NameBox from './NameBox.js';
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

  componentWillMount = () => {
    if (this.state.loggedIn) {
      this.getToken();
    }
  };

  onNameChanged = event => {
    this.setState({ name: event.target.value });
  };

  logIn = event => {
    event.preventDefault();
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
    Chat.Client.create(this.state.token).then(client => {
      this.chatClient = client;
      this.clientInitiated()//.then(channel => {
        console.log('here'+this.channel);
      this.setUpStudioWebhook(this.channel).then(channel => {
        console.log('webhook');
      });
      //this.chatClient.initialize().then(this.clientInitiated.bind(this));
    });
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
        <div>
          <p><i>Logged in as {this.state.name}</i></p>
          <ul className="messages">
            {messages}
          </ul>
          <form onSubmit={this.sendMessage}>
            <label htmlFor="message">Message: </label>
            <input
              type="text"
              name="message"
              id="message"
              onChange={this.onMessageChanged}
              value={this.state.newMessage}
            />
            <button>Send</button>
          </form>
          <br /><br />
          <form onSubmit={this.logOut}>
            <button>Log out</button>
          </form>
        </div>
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
