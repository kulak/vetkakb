
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {LandingPage} from './pages/landing'
import {SingleEntryPage} from './pages/singleEntry'
import { Router, Route, IndexRoute, Link, browserHistory, Redirect } from 'react-router'
import {Recent} from './controls/recent'
import {Search} from './controls/search'
import {EntryCreateBox} from './controls/entryCreate'
import {UserBox} from './controls/userBox'
import {WSFullEntry} from './model/wsentry'
import {EntryLoaderBox} from './controls/entryLoader'
import {SlugLoaderBox} from './controls/slugLoader'
import {Dashboard} from './controls/dashboard'
import {DataService} from './common/dataService'

declare var ThemeName: string
declare var ThemeURL: string
declare var ZonePath: string

console.log("ZonePath:", ZonePath)

let mainLayout = React.createClass({
	render: function() {
		return (<div className='uk-width-small-*'>
      <h1>{document.title}</h1>
			<UserBox />
      <nav className='uk-navbar'>
				<ul className="uk-navbar-nav">
					<li><Link to={ZonePath + '/app/recent'} className=''>Recent</Link></li>
					<li><Link to={ZonePath + '/app/search'} className=''>Search</Link></li>
					<li><Link to={ZonePath + '/app/new'} className=''>New Entry</Link></li>
				</ul>
      </nav>
      {this.props.children}
    </div>)
	}
})

let newEntry = React.createClass({

	onNewClose: function(fe: WSFullEntry) {
		if (fe.EntryID != 0) {
			browserHistory.push(ZonePath + '/app/e/' + fe.EntryID)
		} else {
			browserHistory.push(ZonePath + "/")
		}
	},

	render: function() {
		return (<EntryCreateBox editorCloseReq={fe => this.onNewClose(fe) }/>)
	}
})

//
ReactDOM.render((
	<Router history={browserHistory}>
		{/* Redirect from / to /app/ */}
		{/* <Redirect from={ZonePath + "/"} to={ZonePath + "/app"} /> */}
		<Route path={ZonePath + "/"} component={mainLayout} >
			<IndexRoute component={Dashboard} />
			<Route path={"s/:slug"} component={SlugLoaderBox} />
		</Route>
		<Route path={ZonePath + "/app"} component={mainLayout}>
			<IndexRoute component={Dashboard} />
			<Route path="recent" component={Recent} />
			<Route path="search" component={Search} />
			<Route path='new' component={newEntry} />
			<Route path="e/:entryID" component={EntryLoaderBox} />
			<Route path="e/:entryID/*" component={EntryLoaderBox} />
		</Route>
	</Router>
), document.getElementById('app'))
