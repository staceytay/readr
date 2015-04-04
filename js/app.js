"use strict";
window.React = React; // export for http://fb.me/react-devtools
var React = require('react');

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

var feedURLs = [
  'http://open.blogs.nytimes.com/feed/',
  'http://lifehacker.com/tag/how-i-work/rss',
  'http://fivethirtyeight.com/features/feed/',
  'http://www.awsarchitectureblog.com/atom.xml',
  'http://instagram-engineering.tumblr.com/rss',
  'https://www.mattcutts.com/blog/feed/',
  'http://musicmachinery.com/feed/',
  'http://obsessionwithregression.blogspot.com/feeds/posts/default',
  'http://opinionator.blogs.nytimes.com/category/the-stone/feed/',
  'http://www.aaronsw.com/2002/feeds/pgessays.rss',
  'http://facebook.github.io/react/feed.xml',
  'http://www.newyorker.com/feed/books/joshua-rothman',
  'http://xkcd.com/atom.xml',
  'http://feeds.feedburner.com/holman'
];

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
