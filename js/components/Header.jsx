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
    var makeHref = this.context.router.makeHref;
    var home = (
      <a className="header-button header-button-left" href={makeHref('home')}>
        <button>Home</button>
      </a>
    );
    var login = (
      <a className="header-button header-button-right" href={makeHref('login')}>
        <button>Log In</button>
      </a>
    );
    var logout = (
      <a className="header-button header-button-right" href={makeHref('logout')}>
        <button>Log Out</button>
      </a>
    );
    var settings = (
      <a className="header-button header-button-right" href={makeHref('settings')}>
        <button>Settings</button>
      </a>
    );

    var leftHeaderButton, rightHeaderButton;
    if (this.state.loggedIn) {
      if (this.context.router.isActive('settings')) {
        leftHeaderButton = home;
        rightHeaderButton = logout;
      }
      else {
        leftHeaderButton = null;
        rightHeaderButton = settings;
      }
    }
    else {
      if (this.context.router.isActive('login')) {
        leftHeaderButton = home;
        rightHeaderButton = null;
      }
      else {
        leftHeaderButton = null;
        rightHeaderButton = login;
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
