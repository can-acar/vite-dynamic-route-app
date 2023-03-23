import React from "react";

const RouterContext = React.createContext({
  location: {
    pathname: "/",
    state: null,
  },
  query: {},
  navigate: (path, state) => {
    console.warn('You need to use the RouterContext.Provider to set the navigate function.');
  }
});
export default RouterContext;
