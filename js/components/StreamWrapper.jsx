var React = require('react');
var Router = require('react-router');

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
            <strong className="feed-title" dangerouslySetInnerHTML={{__html: entry.feedTitle}} />
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
    this.loadFeeds(this.props.feedURLs);
    this.intervalID = setInterval(function() {
      this.loadFeeds(this.props.feedURLs);
    }.bind(this), this.props.pollInterval);
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
      feedDataRef = new Firebase(FIREBASE_URL + '/sampleFeeds');
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
      message = (
        <div className="welcome">
          Hi! Readr is a simple RSS feed aggregator similar to Safari's shared links.
          Readr's code is open-sourced on <a className="link-text"
          href="https://github.com/staceytay/readr">GitHub</a>. Below are entries taken
          from the <a className="link-text"
          href="http://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml">NYTimes
          feed</a>.
        </div>
      );
    }
    else if (this.state.feedURLs.length === 0) {
      // If logged in and no feeds, show instructions on how to add them
      message = (
        <div className="welcome">
          Looks like you're not subscribed to any feeds yet. Get started by
          adding a blog or site in settings.
        </div>
      );
    }
    return (
      <div className="stream-wrapper">
        {message}
        <Stream feedURLs={this.state.feedURLs} />
      </div>
    );
  }
});

module.exports = StreamWrapper;
