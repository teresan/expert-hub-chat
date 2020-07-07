import React, { Component } from 'react';
import {FormControl, Button, Input} from '@material-ui/core'

class NameBox extends Component {
  render() {
    const name = this.props.name;
    const onNameChanged = this.props.onNameChanged;
    const logIn = this.props.logIn;
    return (
      <div>
        <FormControl>
          
          <Input
            type="text"
            name="name"
            id="name"
            onChange={onNameChanged}
            value={name}
            placeholder="Name"
            autoFocus={true}

          />
         <br></br>
          <Button  variant="contained" color="primary" disableElevation onClick={logIn}>LOG IN</Button>
        </FormControl>
      </div>
    );
  }
}

export default NameBox;
