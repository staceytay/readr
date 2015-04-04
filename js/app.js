"use strict";
window.React = React; // export for http://fb.me/react-devtools
var React = require('react');

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
  componentWillMount: function() {
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


var View = React.createClass({
  render: function() {
    return (
      <div className="view">
        <Header />
        <Stream urls={feedURLs}/>
      </div>
    );
  }
});

React.render(
  <View />,
  document.getElementById('app')
);
