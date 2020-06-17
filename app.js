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

class Home extends Component {
  constructor(props) {
    super(props)
    this.go = this.go.bind(this)
    this.updateFetchParams = this.updateFetchParams.bind(this)
    this.getData = this.getData.bind(this)
    
    // Set store based on query parameters
    this.props.fetchParams.start = props.start != undefined ? props.start : "0"
    this.props.fetchParams.length = props.length != undefined ? props.length : "5"
  }
  go(event) {
    event.preventDefault()
    const start = this.props.fetchParams.start
    const length = this.props.fetchParams.length
    this.getData(start, length)
  }
  updateFetchParams(event) {
    let fetchParams = _.cloneDeep(store.getState().fetchParams)
    fetchParams[event.target.name] = event.target.value
    console.log(fetchParams)
    store.setState({fetchParams})
  }
  async getData(start, length) {
    const response = await fetch(this.props.main.baseUrl + "/data.php?start="+start+"&length="+length, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const body = await response.json()
    
    let fetchData = _.cloneDeep(store.getState().fetchData)
    fetchData.values = body
    
    store.setState({fetchData})
  }
  componentDidMount() {
    const start = this.props.fetchParams.start
    const length = this.props.fetchParams.length
    this.getData(start, length)
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
      // (storeState, newProps) => componentProps
      ({ main, fetchParams, fetchData }, { start, length }) => {
        // copy start and length from the URL into state (without re-rendering!):
        
        start = start || "0"
        length = length || "5"
        
        Object.assign(fetchParams, { start, length });

        // same as the old "main,fetchParams,fetchData":
        return { main, fetchParams, fetchData };
      },
      actions
    )(
      ({ main, fetchParams, fetchData }) => {
        // Router must be wrapped here extra, otherwise props.start and props.length
        // will not be set from the URL query parameters.
        return html`
          <${Router}>
            <${Home}
              main=${main}
              fetchParams=${fetchParams}
              fetchData=${fetchData}
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
