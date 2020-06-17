
const { h, render, Component } = window.preact;
const htm = window.htm;
const html = htm.bind(h);
const { createStore, Provider, connect } = window.unistore;
const { Router, Link, route } = window.preactRouter;

let Connected = {}

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

let actions = {}

const store = createStore(initialStates);

addInitialState({
  main: {
    url: Router.getCurrentUrl()
  },
})


actions = store => actionFunctions;

class Main extends Component {
  render() {
    return html`
      <div>xxx
        <${Router}>
          <${Connected.Menu} default />
          <${Connected.About} default />
          <${Connected.Home} path="/home" />
        <//>
      </div>
    `
  }
}

Connected.Main = connect(
  "main",
  actions
)(
  ({
    // stores
    main,
  }) =>
    html`
      <${Main}
        main=${main}
      />
    `
);

render(h(Provider, { store }, h(Connected.Main)), document.body);

console.log('starting app')