"use strict";
window.React = React; // export for http://fb.me/react-devtools
var React = require('react');
var Router = require('react-router'),
    DefaultRoute = Router.DefaultRoute,
    Route = Router.Route,
    RouteHandler = Router.RouteHandler;

var FIREBASE_URL = process.env.FIREBASE_URL;

var Story = React.createClass({
  propTypes: {
    entry: React.PropTypes.shape({
      feedTitle: React.PropTypes.string,
      title: React.PropTypes.string,
      author: React.PropTypes.string,
      link: React.PropTypes.string,
      date: React.PropTypes.instanceOf(Date),
      snippet: React.PropTypes.string
    })
  },
  render: function() {
    var entry = this.props.entry;
    return (
      <li>
        <a className="detail-disclosure" href={entry.link}>
          <div className="story">
            <strong className="feed-title">{entry.feedTitle}</strong>
            <p className="title">{entry.title}</p>
            <span className="metadata">
              <span className="date">{entry.date? entry.date.toDateString(): null}</span>
            </span>
            <p className="snippet" dangerouslySetInnerHTML={{__html: entry.snippet}} />
          </div>
        </a>
      </li>
    );
  }
});

var Stream = React.createClass({
  getDefaultProps: function() {
    return {
      incrementEntriesBy: 20,
      pollInterval: 15 * 60 * 1000
    };
  },
  getInitialState: function() {
    return {
      displayCount: 20,
      entries: []
    };
  },
  componentWillReceiveProps: function(nextProps) {
    this.loadFeeds(nextProps.feedURLs);
  },
  componentDidMount: function() {
    var componentSetup = function() {
      this.loadFeeds(this.props.feedURLs);
      this.intervalID = setInterval(function() {
        console.log('setInterval', this);
        this.loadFeeds(this.props.feedURLs);
      }.bind(this), this.props.pollInterval);
    }.bind(this);

    if (google.feeds) {
      componentSetup();
    }
    else {
      google.load("feeds", "1");
      google.setOnLoadCallback(componentSetup);
    }
  },
  componentWillUnmount: function() {
    clearInterval(this.intervalID);
  },
  loadFeeds: function(feedURLs) {
    this.setState({entries:[]});
    feedURLs.map(function(feedURL) {
      var feed = new google.feeds.Feed(feedURL);
      feed.setNumEntries(8);
      feed.load(function(result) {
        console.log('Stream: loadFeeds', feedURL, result);
        if (result.error) {
          console.log('loadFeeds: Error:', feedURL, result.error);
        }
        else {
          var entries = result.feed.entries.map(function(entry) {
            return ({
              feedTitle: result.feed.title,
              title: entry.title,
              author: entry.author,
              link: entry.link,
              date: entry.publishedDate? new Date(entry.publishedDate): null,
              snippet: entry.contentSnippet
            });
          });
          this.setState({
            entries: this.state.entries.concat(entries)
          });
        }
      }.bind(this));
    }, this);
  },
  render: function() {
    var displayCount = this.state.displayCount,
        entries = this.state.entries;
    entries.sort(function(a, b) {
      return b.date - a.date;
    });

    var listItems = entries.slice(0, displayCount).map(function(entry, i) {
      return <Story key={i} entry={entry} />;
    });

    if (entries.length > displayCount) {
      var showMore = function() {
        this.setState({
          displayCount: displayCount + this.props.incrementEntriesBy
        });
      }.bind(this);
      listItems.push(
          <li key={listItems.length}><a className="more-link" onClick={showMore}>More</a></li>
      );
    }
    return (
      <div className="stream">
        <section>
          <ul className="stream-list">{listItems}</ul>
        </section>
      </div>
    );
  }
});

var StreamWrapper = React.createClass({
  componentDidMount: function() {
    this.firebaseRef = new Firebase(FIREBASE_URL);
    this.loadFeedURLs();
  },
  componentWillReceiveProps: function(nextProps) {
    this.loadFeedURLs();
  },
  componentWillUnmount: function() {
    this.firebaseRef.off();
  },
  getInitialState: function() {
    return {
      feedURLs: [],
      loggedIn: false
    };
  },
  loadFeedURLs: function() {
    var authData = this.firebaseRef.getAuth(),
        feedDataRef;
    if (authData) {
      feedDataRef = new Firebase(FIREBASE_URL + '/feeds/' + authData.uid);
      this.setState({loggedIn:true});
    }
    else {
      // Display sample feeds
      feedDataRef = new Firebase(FIREBASE_URL + '/feeds/sample');
    }
    feedDataRef.on('value', function(snapshot) {
      var feedURLs = [];
      for (var key in snapshot.val()) {
        feedURLs.push(snapshot.val()[key]);
      }
      this.setState({feedURLs:feedURLs});
    }.bind(this));
  },
  render: function() {
    var message;
    if (!this.state.loggedIn) {
      // Display welcome message
      message = <p className="welcome">Welcome message here</p>;
    }
    else if (this.state.feedURLs.length === 0) {
      // If logged in and no feeds, show instructions on how to add them
      message = <p>Add feeds!</p>;
    }
    return (
      <div className="stream-wrapper">
        {message}
        <Stream feedURLs={this.state.feedURLs} />
      </div>
    );
  }
});

var About = React.createClass({
  render: function() {
    return null;
  }
});

var Header = React.createClass({
  render: function() {
    return (
      <header>
        <h1>Readr</h1>
        <a className="header-button" href="/about">
          <button>About</button>
        </a>
      </header>
    );
  }
});

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
  handleSubmit: function(e) {
    e.preventDefault();
    var email = React.findDOMNode(this.refs.email).value,
        password = React.findDOMNode(this.refs.password).value;
    if (!email || !password) {
      return;
    }
    this.firebaseRef.authWithPassword({
      email: email,
      password: password
    }, function (error, authData) {
      if (error) {
        this.setState({error: error});
      } else {
        this.context.router.transitionTo('home');
      }
    }.bind(this));
  },
  render: function() {
    var alert;
    if (this.state.error) {
      console.log(this.state.error);
      alert = <p className="error-text">{this.state.error.message}</p>;
    }
    return (
      <div>
        {alert}
        <form className="login-form" onSubmit={this.handleSubmit}>
          <input type="email" placeholder="Email" ref="email" />
          <input type="password" placeholder="Password" ref="password" />
          <input type="submit" value="Log In" />
        </form>
      </div>
    );
  }
});


var View = React.createClass({
  render: function() {
    return (
      <div className="view">
        <Header />
        <RouteHandler {...this.props} />
      </div>
    );
  }
});

var routes = (
  <Route name="home" handler={View} path="/">
    <Route name="login" path="login" handler={Login} />
    <DefaultRoute handler={StreamWrapper} />
  </Route>
);
Router.run(routes, function (Handler, state) {
  React.render(<Handler params={state.params} />, document.getElementById('app'));
});
