import React, { Component } from 'react';
import './App.css';
import ChatApp from './ChatApp.js';

class App extends Component {
  render() {
    return (
      <div className="App">
        <header>
          Expert Hub
        </header>
        <ChatApp />
      </div>
    );
  }
}

export default App;
