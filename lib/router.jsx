import RouterContext from 'lib/router-context';
import {pathToRegexp} from "path-to-regexp";
import React, {Suspense, useEffect, useMemo, useState} from 'react';


const getQueryParams = (filename, options) => {
  
  const dirOptions = options.dirs.find((dirOption) => filename.includes(dirOption.dir));
  
  return filename
      .replace(`../${dirOptions.dir}`, '')
      .replace(new RegExp(`\\.(${options.ext.join('|')})$`), '')
      .split('/')
      .filter((part) => part.startsWith('[') && part.endsWith(']'))
      .map((part) => part.slice(1, -1));
};

const generateComponent = async (pathname, pages, options) => {
  
  let keys = [];
  let isMatch = false;
  let component = {
    componentPath: "",
    name: "",
    isReady: false
  }
  
  for (const filename of pages && Object.keys(pages)) {
    
    
    const dirOptions = options.dirs.find((dirOption) => filename.includes(dirOption.dir));
    
    const pattern = filename
        .replace(`../${dirOptions.dir}`, '')
        .replace(new RegExp(`\\.(${options.ext.join('|')})$`), '')
        .replace(/\[(\w+)\]/g, `:$1`)
        .replace(/\[\[\.\.\.(\w+)\]\]/g, `:$1([^/]+/?)*`) //[[...slug]] optional params
        .replace(/\[\.\.\.(\w+)\]/g, `:$1([^/]+/?)+`) // [...slug] required params
        .replace(/\/index$/, '');
    
    const re = pathToRegexp(pattern, keys);
    
    const match = re.exec(pathname);
    
    if (match) {
      isMatch = true;
      component = {
        componentPath: filename,
        name: filename.split('/').pop().replace(/\.[^/.]+$/, ""),
        isReady: true,
      };
      break;
    }
  }
  
  if (!isMatch) {
    component = {
      componentPath: `../${options.dirs[0].dir}/NotFound.${options.ext[0]}`,
      name: "NotFound",
      isReady: true,
    }
  }
  
  return component;
  
}

const matchRoute = async (pathname, pages, options) => {
  
  
  let query = {};
  let slug = [];
  let isMatch = false;
  
  let route = {
    pathname: "",
    basePath: "",
    locale: "",
    query: {},
    slug: [],
  }
  
  for (const filename of pages && Object.keys(pages)) {
    let keys = [];
    slug = getQueryParams(filename, options);
    
    const dirOptions = options.dirs.find((dirOption) => filename.includes(dirOption.dir));
    
    let pattern = filename
        .replace(`../${dirOptions.dir}`, '')
        .replace(new RegExp(`\\.(${options.ext.join('|')})$`), '')
        .replace(/\[(\w+)\]/g, `:$1`)
        .replace(/\[\[\.\.\.(\w+)\]\]/g, `:$1([^/]+/?)*`)  //[[...slug]] optional params
        .replace(/\[\.\.\.(\w+)\]/g, `:$1([^/]+/?)+`) // [...slug] required params
        .replace(/\/index$/, '');
    
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    
    
    const re = pathToRegexp(pattern, keys);
    
    const match = re.exec(pathname);
    
    if (match) {
      
      isMatch = true;
      
      query = keys.reduce((acc, key, index) => {
        
        if (match[index + 1]?.includes('/')) {
          acc[key.name] = match[index + 1].split('/').filter(segment => segment !== '');
        } else {
          acc[key.name] = match[index + 1];
        }
        return acc;
      }, {});
      
      route = {
        pathname: pathname,
        query: query,
        slug: slug,
        basePath: "",
        locale: "",
      }
      
      break;
    }
  }
  
  if (!isMatch) {
    
    route = {
      pathname: pathname,
      query: {},
      slug: {},
      basePath: "",
    }
  }
  
  return route;
  
};


const Router = (props) => {
  
  const routerOptions = props.options || {
    ext: ['jsx', 'js'],
    dirs: [{
      dir: 'src/pages',
      baseRouter: '/index',
    }]
  }
  
  const [component, setComponent] = useState({
    componentPath: "",
    isReady: false,
    name: "",
  });
  
  const [route, updateRoute] = useState({
    pathname: "",
    basePath: "",
    locale: "",
    slug: {},
    query: {}
  });
  
  const [location, setLocation] = useState({
    pathname: window.location.pathname, //|| routerOptions.dirs[0].baseRouter,
    state: window.history.state,
  });
  
  const pagesContext = useMemo(() => {
    
    const contexts = {};
    
    for (const dirOptions of routerOptions.dirs) {
      debugger
      const context = import.meta.glob(`../src/pages/**/*.(jsx|js)`, {eager: true}) || {};
      
      Object.assign(contexts, context);
    }
    return contexts;
  }, [import.meta.glob, routerOptions]);
  
  
  useEffect(() => {
    const onPopState = () => {
      // replace last trailing slash
    
      
      setLocation({
        pathname: window.location.pathname,
        state: window.history.state
      });
    };
    
    
    window.history.replaceState(window.history.state, null, window.location.pathname);
    
    if (window.location.pathname.endsWith('/')) {
      window.history.replaceState(window.history.state, null, window.location.pathname.slice(0, -1));
    }
    
    window.addEventListener('popstate', onPopState);
    
    return () => window.removeEventListener('popstate', onPopState);
    
  }, []);
  
  
  useEffect(() => {
    const bootstrap = async () => {
      
      
      const route = await matchRoute(location.pathname, pagesContext, routerOptions);
      
      const component = await generateComponent(location.pathname, pagesContext, routerOptions);
      
      setComponent(component);
      
      updateRoute(route);
      
    };
    
    bootstrap().then(() => {
      
      console.log('bootstrap done');
    });
    
  }, []);
  
  const contextValue = {
    location,
    query: route.query,
    navigate: (path, state) => {
      window.history.pushState(state, null, path);
      setLocation({pathname: path, state});
    },
  };
  
  
  if (!component.isReady) {
    return (<div>Loading..</div>);
  }
  
  
  const PageComponent = React.lazy(async () => await import(/* @vite-ignore */component.componentPath))
  
  
  return (<RouterContext.Provider value={contextValue}>
    <Suspense fallback={<div>Loading....</div>}>
      <PageComponent {...route}/>
    </Suspense>
  </RouterContext.Provider>);
}


export default Router;
