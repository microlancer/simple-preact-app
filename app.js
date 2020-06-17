console.log('start')

const { h, render, Component } = window.preact;
const htm = window.htm;
const html = htm.bind(h);
const { createStore, Provider, connect } = window.unistore;
const { Router, Link, route } = window.preactRouter;

let Connected = {}
let connectionFunctions = {}

function addConnection(name, func) {
  connectionFunctions[name] = func
}

let initialStates = {}

function addInitialState(state) {
  for (var stateName in state) {
    initialStates[stateName] = state[stateName]
  }
}

let actionFunctions = {}

function addActionFunction(funcs) {
  for (var funcName in funcs) {
    actionFunctions[funcName] = funcs[funcName]
  }
}


addInitialState({
  main: {
    baseUrl: '/simple-preact-app',
    url: Router.getCurrentUrl()
  },
})

class Menu extends Component {
  render() {
    return html`
    <div>
      <div>
        Main Menu: <a href=${this.props.main.baseUrl + "/"}>Index</a> | <a href=${this.props.main.baseUrl + "/home"}>Home</a> | <a href=${this.props.main.baseUrl + "/about"}>About</a>  
      </div>
      <div>Shortcuts: <a href=${this.props.main.baseUrl + "/home/?start=3&length=1"}>start=3&length=1</a> | <a href=${this.props.main.baseUrl + "/home/?start=2&length=7"}>start=2&length=7</a>
      </div>
    </div>
`
  }
  static connect() {
    return connect(
      "main",
      actions
    )(
      ({ main }) => {
        return html`
          <${Menu}
            main=${main}
          />
        `
      }
    )
  }
}

addConnection('Menu', Menu.connect)

addInitialState({
  fetchParams: {
    start: "0",
    length: "5"
  },
  fetchData: {
    values: []
  }
})

addActionFunction({
  routeAction: async (state, a) => {
    
    // Ugly thing #1 -- is the _parentComponent hack the only way to get the
    // parameters that I want here?
    
    const props = a.router._parentComponent.props
    let fetchParams = _.cloneDeep(store.getState().fetchParams)
    fetchParams.start = props.start || "0"
    fetchParams.length = props.length || "5"
    await store.setState({fetchParams})
    
    // Ugly thing #2 -- is there a better way to call the getData function?
    
    await actionFunctions.getData({main: state.main, fetchParams})
  },
  async getData(state) {
    
    start = state.fetchParams.start
    length = state.fetchParams.length
    
    const response = await fetch(state.main.baseUrl + "/data.php?start="+start+"&length="+length, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const body = await response.json()
    
    let fetchData = _.cloneDeep(store.getState().fetchData)
    fetchData.values = body
    
    store.setState({fetchData})
  }
})

class Home extends Component {
  constructor(props) {
    super(props)
    this.go = this.go.bind(this)
    this.updateFetchParams = this.updateFetchParams.bind(this)
    
    // Set store based on query parameters
    this.props.fetchParams.start = props.start != undefined ? props.start : "0"
    this.props.fetchParams.length = props.length != undefined ? props.length : "5"
  }
  go(event) {
    event.preventDefault()
    const start = this.props.fetchParams.start
    const length = this.props.fetchParams.length
    // Unless route is called, the data being out-of-sync with the parameters
    // will cause an issue, where clicking a shortcut that matches the existing
    // parameters will NOT cause the page to load with the shortcut even if
    // the form data is different. This is because the router seems to ignore
    // requests to the same page. By calling "route" here, we force the URL
    // to match the form data. Thus, clicking a shortcut that doesn't match
    // will always load, rather than erroneously ignoring the route change.
    route(this.props.main.baseUrl + "/home?start=" + start + "&length=" + length)
  }
  updateFetchParams(event) {
    let fetchParams = _.cloneDeep(store.getState().fetchParams)
    fetchParams[event.target.name] = event.target.value
    console.log(fetchParams)
    store.setState({fetchParams})
  }
  componentWillUpdate() {
    console.log('home update')
  }
  componentDidMount() {
    console.log('home mounted')
    const start = this.props.fetchParams.start
    const length = this.props.fetchParams.length
    this.props.getData(this.props, start, length)
  }
  render() {
    
    const start = this.props.fetchParams.start
    const length = this.props.fetchParams.length
    
    const data = html`<div>${this.props.fetchData.values.join(' ')}</div>`
    
    return html`
        <div>
          <h2>Home</h2>
          Start <input type='text' name='start' value=${start} onkeyup=${this.updateFetchParams} />
          Length <input type='text' name='length' value=${length} onkeyup=${this.updateFetchParams} />
          <button onclick=${this.go}>Go</button>
          <hr />
          ${data}
        </div>
      `
  }
  static connect() {
    return connect(
      "main,fetchParams,fetchData",
      actions
    )(
      ({ main, fetchParams, fetchData, routeAction, getData }) => {
        // Router must be wrapped here extra, otherwise props.start and props.length
        // will not be set from the URL query parameters.
        // I was not able to move routeAction into the parent render() but 
        // perhaps there is a way to do that if I include the path.
        return html`
          <${Router} onChange=${routeAction}>
            <${Home}
              main=${main}
              fetchParams=${fetchParams}
              fetchData=${fetchData}
              getData=${getData}
              routeAction=${routeAction}
              path=${main.baseUrl + "/home"}
            />
          <//>
        `
      }
    )
  }
}

addConnection('Home', Home.connect)

class About extends Component {
  render() {
    return html`<h2>About</h2>`
  }
  static connect() {
    return connect(
      "main",
      actions
    )(
      ({ main }) => {
        return html`
          <${About}
            main=${main}
          />
        `
      }
    )
  }
}

addConnection('About', About.connect)


class Main extends Component {
  render() {
    console.log('render');
    return html`
      <div><h1>Simple Preact App</h1>
        <${Connected.Menu}/>
        <${Router}>
          <${Connected.About} path=${this.props.main.baseUrl + "/about"} />
          <${Connected.Home} path=${this.props.main.baseUrl + "/home"} />
        <//>
      </div>
    `
  }
  static connect() {
    return connect(
      "main",
      actions
    )(
      ({ main }) => {
        return html`
          <${Main}
            main=${main}
          />
        `
      }
    )
  }
}

addConnection('Main', Main.connect)

let actions = {}

console.log(initialStates)

const store = createStore(initialStates);

actions = store => actionFunctions;

// Once state and actions are initialized, we can set up connections.
for (var componentName in connectionFunctions) {
  Connected[componentName] = connectionFunctions[componentName].call()
}

render(h(Provider, { store }, h(Connected.Main)), document.body);

console.log('done')