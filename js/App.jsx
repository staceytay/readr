"use strict";
window.React = React; // export for http://fb.me/react-devtools
var React = require('react');
var Router = require('react-router'),
    DefaultRoute = Router.DefaultRoute,
    Route = Router.Route,
    RouteHandler = Router.RouteHandler;
var Header = require('./components/Header.jsx'),
    Login = require('./components/Login.jsx'),
    Settings = require('./components/Settings.jsx'),
    StreamWrapper = require('./components/StreamWrapper.jsx');

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
    <Route name="settings" handler={Settings} />
    <DefaultRoute handler={StreamWrapper} />
  </Route>
);

Router.run(routes, function (Handler, state) {
  React.render(<Handler params={state.params} />, document.getElementById('app'));
});
