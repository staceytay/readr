var React = require('react');
var Router = require('react-router');

var FIREBASE_URL = process.env.FIREBASE_URL;

var Login = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  componentDidMount: function() {
    this.firebaseRef = new Firebase(FIREBASE_URL);
    // Redirect if user is logged in
    if (this.firebaseRef.getAuth()) {
      this.context.router.transitionTo('home');
    }
  },
  componentWillUnmount: function() {
    this.firebaseRef.off();
  },
  getInitialState: function() {
    return {
      error: null
    };
  },
  fbLogin: function() {
    this.firebaseRef.authWithOAuthPopup("facebook", function(error, authData) {
      if (error) {
        this.setState({error: error.message});
      }
      else {
        this.firebaseRef.child('users').child(authData.uid).set({
          provider: authData.provider,
          name: authData.facebook.displayName,
          firstName: authData.facebook.cachedUserProfile.first_name,
          email: authData.facebook.email,
          picture: authData.facebook.cachedUserProfile.picture.data.url
        });
        this.context.router.transitionTo('home');
      }
    }.bind(this), {
      remember: 'sessionOnly',
      scope: 'email,public_profile'
    });
  },
  render: function() {
    var alert;
    if (this.state.error) {
      alert = <p className="error-text">{this.state.error}</p>;
    }
    return (
      <div>
        {alert}
        <button className="fb-login" onClick={this.fbLogin}>Login with Facebook</button>
      </div>
    );
  }
});

module.exports = Login;