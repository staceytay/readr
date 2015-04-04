var React = require('react');
var Router = require('react-router');

var FIREBASE_URL = process.env.FIREBASE_URL;

var Logout = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  componentDidMount: function() {
    this.firebaseRef = new Firebase(FIREBASE_URL);
    this.firebaseRef.unauth();
    this.context.router.transitionTo('home');
  },
  componentWillUnmount: function() {
    this.firebaseRef.off();
  },
  render: function() {
    return null;
  }
});

module.exports = Logout;
