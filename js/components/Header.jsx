var React = require('react');
var Router = require('react-router');

var FIREBASE_URL = process.env.FIREBASE_URL;

var Header = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  componentDidMount: function() {
    this.firebaseRef = new Firebase(FIREBASE_URL);
    this.firebaseRef.onAuth(function(authData) {
      this.setState({
        loggedIn: authData? true: false
      });
    }.bind(this));
  },
  componentWillUnmount: function() {
    this.firebaseRef.off();
  },
  getInitialState: function() {
    return {
      loggedIn: false
    };
  },
  render: function() {
    var homeButton = (
      <a className="header-button header-button-left" href={this.context.router.makeHref('home')}>
        <button>Home</button>
      </a>
    ),
        loginButton = (
          <a className="header-button header-button-right" href={this.context.router.makeHref('login')}>
            <button>Log In</button>
          </a>
        ),
        settingsButton = (
          <a className="header-button header-button-right" href={this.context.router.makeHref('settings')}>
            <button>Settings</button>
          </a>
        );

    var leftHeaderButton, rightHeaderButton;
    if (this.state.loggedIn) {
      if (this.context.router.isActive('settings')) {
        leftHeaderButton = homeButton;
        rightHeaderButton = null;
      }
      else {
        leftHeaderButton = null;
        rightHeaderButton = settingsButton;
      }
    }
    else {
      if (this.context.router.isActive('login')) {
        leftHeaderButton = homeButton;
        rightHeaderButton = null;
      }
      else {
        leftHeaderButton = null;
        rightHeaderButton = loginButton;
      }
    }

    return (
      <header>
        {leftHeaderButton}
        <h1>Readr</h1>
        {rightHeaderButton}
      </header>
    );
  }
});

module.exports = Header;
