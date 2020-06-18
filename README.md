# simple-preact-app

This particular example app handles the situation where you have a route with query parameters, and you want to be able to navigate to links that have different query parameters and having that trigger reloading of data (e.g. XHR request). 

It seems like a very trivial app, but actually there are many gotchas. If done incorrectly, you'll have weird situations where the page doesn't reload the data when you navigate to the same base URL with different query parameters. Or the form won't let you type in new values because they get erased by the query parameters that already exist. To solve all these problems, a very particular set of checks and logic becomes required.

The secret sauce here is to use componentDidUpdate() and compare prevProps with current state. If it's different, we know that the query parameters have changed.

Also, in this case we have a form that the user can enter in new values and click "Go". Because of this, we separate the query parameters state from the form state. This is because we don't want to reload the XHR every time we enter a new letter/character into the form. Since the form state changes but the query parameters remain the same, getData() won't get called every letter. Instead, it will only get called when the route actually changes when clicking the "Go" button.

It also demonstrates how to pull the props into the state, while setting up some default values. Since the /home doesn't have any query parameters, we can choose to assume the values are start=0 and length=5 as default.

I hope this helps someone, because it has taken me days to figure this out!
