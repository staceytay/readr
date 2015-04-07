var React = require('react');
var Router = require('react-router');
var Footer = require('./Footer.jsx');

var FIREBASE_URL = process.env.FIREBASE_URL;

var Settings = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },
  componentDidMount: function() {
    this.firebaseRef = new Firebase(FIREBASE_URL);
    this.firebaseAuth = this.firebaseRef.getAuth();
    // Redirect if user is not logged in
    if (!this.firebaseAuth) {
      this.context.router.transitionTo('login');
    }
    this.firebaseRef.child('feeds/' + this.firebaseAuth.uid).on(
      'value',
      function(snapshot) {
        var feedURLs = [];
        for (var key in snapshot.val()) {
          feedURLs.push(snapshot.val()[key]);
        }
        this.setState({feedURLs: feedURLs});
      }.bind(this)
    );
  },
  componentWillUnmount: function() {
    this.firebaseRef.off();
  },
  getInitialState: function() {
    return {
      alert: null,
      success: null,
      feedURLs: []
    };
  },
  handleSubmit: function(e) {
    e.preventDefault();
    this.setState({alert: null, success: null});

    var feedURL = React.findDOMNode(this.refs.feedURL).value;
    var regex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");

    if (!regex.test(feedURL)) {
      this.setState({alert: feedURL + ' is not a valid url!'});
      return;
    }

    if (this.state.feedURLs.indexOf(feedURL) > -1) {
      this.setState({alert: feedURL + ' already exists!'});
      return;
    }

    // Save to firebase and show success
    this.firebaseRef.child('feeds/' + this.firebaseAuth.uid).push(
      feedURL,
      function(error) {
        if (error) {
          this.setState({alert: error.message});
        }
        else {
          this.setState({success: <span>Successfully added <ins>{feedURL}</ins>!</span>});
          React.findDOMNode(this.refs.feedURL).value = '';
        }
      }.bind(this)
    );
  },
  deleteFeed: function(url) {
    this.setState({alert: null, success: null});
    var authID = this.firebaseAuth.uid;
    this.firebaseRef.child('feeds/' + authID).once('value', function(snapshot) {
      for (var key in snapshot.val()) {
        if (snapshot.val()[key] === url) {
          this.firebaseRef
            .child('feeds/' + authID + '/' + key)
            .remove(function(error) {
              if (error) {
                this.setState({alert:error.message});
              }
              else {
                this.setState({success: <span>Removed <ins>{url}</ins>!</span>});
              }
            }.bind(this));
        }
      }
    }.bind(this));
  },
  render: function() {
    var message;
    if (this.state.alert) {
      message = <div className="alert">{this.state.alert}</div>;
    }
    else if (this.state.success) {
      message = <div className="info">{this.state.success}</div>;
    }

    var feeds = this.state.feedURLs;
    feeds.sort();
    var feedListItems = feeds.map(function(url, i) {
      return (
        <li key={i}>
          <p className="feed-url">{url}</p>
          <button onClick={this.deleteFeed.bind(this, url)}>Remove</button>
        </li>
      );
    }.bind(this));
    var numFeeds = feeds.length + ' subscribed feed' + ((feeds.length > 1)? 's': '');

    return (
      <div className="settings-page">
        {message}
        <div className="add-feed">
          <form onSubmit={this.handleSubmit}>
            <input placeholder="Add a feed" ref="feedURL" type="url" />
            <input type="submit" value="Add" />
          </form>
        </div>
        <div className="subscribed-feeds">
          <h2>{numFeeds}</h2>
          <ul className="feed-list">
            {feedListItems}
          </ul>
        </div>
        <Footer />
      </div>
    );
  }
});

module.exports = Settings;
