import React, {Component} from 'react';

class LoadingIndicator extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    return (
        <div className='col-md-12'>
          <span className='pull-right'>
            {this.props.text}
          </span>
        </div>)
  }
}

export default LoadingIndicator;
