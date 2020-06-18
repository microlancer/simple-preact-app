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

//addInitialState({
//  fetchParams: {
//    start: "",
//    length: ""
//  },
//  fetchData: {
//    values: []
//  }
//})

class Home extends Component {
  constructor(props) {
    console.log('constructor')
    super(props)
    this.go = this.go.bind(this)
    this.updateFetchParams = this.updateFetchParams.bind(this)
    this.getData = this.getData.bind(this)
    
    this.state.start = ''
    this.state.length = ''
    this.state.fetchForm = { start: '', length: '' }
    this.state.fetchData = { values: [] }
    
  }
  go(event) {
    console.log('go')
    event.preventDefault()
    const start = this.state.fetchForm.start
    const length = this.state.fetchForm.length
    route(this.props.main.baseUrl + "/home/?start="+start+"&length="+length)
  }
  updateFetchParams(event) {
    console.log('updateFetchParams')
    let fetchForm = _.cloneDeep(this.state.fetchForm)
    fetchForm[event.target.name] = event.target.value
    this.setState({fetchForm})
  }
  async getData(start, length) {
    console.log('getData')
    const response = await fetch(this.props.main.baseUrl + "/data.php?start="+start+"&length="+length, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const body = await response.json()
    
    let fetchData = Object.assign({}, this.state.fetchData)
    fetchData.values = body
    
    this.setState({fetchData})
  }
  static getDerivedStateFromProps(props) {
    console.log('getDerivedStateFromProps')
    return {
      start: props.start || '0',
      length: props.length || '5'
    };
  }
  componentDidUpdate(prevProps, prevState) {
    console.log('componentDidUpdate')
    const { start, length } = this.state; // new values
    
    // When route() is called, if the parameters have changed let's remount.
    const queryParamsChanged = !_.isEqual(
      {start: prevState.start, length: prevState.length}, 
      {start: this.state.start, length: this.state.length}
    )
    
    if (queryParamsChanged) {
      // Query params have changed, so treat it like we just mounted.
      this.componentDidMount()
    }
  }
  componentDidMount() {
    console.log('componentDidMount')
    const start = this.state.start
    const length = this.state.length
    let fetchForm = _.cloneDeep(this.state.fetchForm)
    fetchForm.start = start
    fetchForm.length = length
    this.setState({fetchForm})
    this.getData(start, length)
  }
  render(props, state) {
    console.log('render')
    const { start, length } = this.state.fetchForm
    const data = html`<div>${state.fetchData.values.join(' ')}</div>`
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
      console.log('connect')
      return connect(
        "main",
        actions
      )(
      ({ main }) => {
        // Router must be wrapped here extra, otherwise props.start and props.length
        // will not be set from the URL query parameters.
        console.log('connect.render')
        return html`
          <${Router}>
            <${Home}
              main=${main}
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
