import React from "react";

const RouterContext = React.createContext({
  location: "",
  params: {},
  pathname: "",
  slug: [],
  activeRoute: (path) => {
  },
  navigate: () => {
  
  }
});
export default RouterContext;
