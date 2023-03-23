import RouterContext from 'lib/router-context';
import {pathToRegexp} from "path-to-regexp";
import React, {lazy, Suspense, useEffect, useMemo, useState} from 'react';


const getSlugs = (filename, options) => {
  
  const dirOptions = options.dirs.find((dirOption) => filename.includes(dirOption.dir));
  
  return filename
      .replace(`../${dirOptions.dir}`, '')
      .replace(new RegExp(`\\.(${options.ext.join('|')})$`), '')
      .split('/')
      .filter((part) => part.startsWith('[') && part.endsWith(']'))
      .map((part) => part.slice(1, -1));
};

const matchRoute = async (pathname, pages, options) => {
  let keys = [];
  let slugs = [];

  for (const filename of pages && Object.keys(pages)) {
    
    slugs = getSlugs(filename, options);
    
    const dirOptions = options.dirs.find((dirOption) => filename.includes(dirOption.dir));
    
    const pattern = filename
        .replace(`../${dirOptions.dir}`, '')
        .replace(new RegExp(`\\.(${options.ext.join('|')})$`), '')
        .replace(/\[(\w+)\]/g, `:$1`)
        .replace(/\/index$/, '');
    
    const re = pathToRegexp(pattern, keys);
    
    const match = re.exec(pathname);
    
    if (match) {
      
      const slugs = keys.reduce((acc, key, index) => {
        acc[key.name] = match[index + 1];
        return acc;
      }, {});
      
      return {componentPath: filename, slugs};
    }
  }
  
  return {componentPath: `../${options.dirs[0].dir}/NotFound.${options.ext[0]}`, slugs};
};

const generateComponentPath = async (pathname, pages, options) => {
  return await matchRoute(pathname, pages, options);
}

const Router = (props) => {
  const routerOptions = props.options || {
    ext: ['jsx', 'js'],
    dirs: [{
      dir: 'src/pages',
      baseRouter: '/index',
    }]
  }
  const [dynamicComponent, setDynamicComponent] = useState({componentPath: null, slugs: null});
  const [location, setLocation] = useState({
    pathname: window.location.pathname, //|| routerOptions.dirs[0].baseRouter,
    state: window.history.state,
  });
  
  const pagesContext = useMemo(() => {
    const contexts = {};
    for (const dirOptions of routerOptions.dirs) {
      
      const context = import.meta.glob(`../src/pages/**/*.(jsx|js)`, {eager: true}) || {};
      
      Object.assign(contexts, context);
    }
    return contexts;
  }, [import.meta.glob, routerOptions]);
  
  
  useEffect(() => {
    const onPopState = () => {
      
      
      setLocation({
        pathname: window.location.pathname,
        state: window.history.state
      });
    };
    
    //window.history.replaceState(window.history.state, null, window.location.pathname);
    
    window.addEventListener('popstate', onPopState);
    
    return () => window.removeEventListener('popstate', onPopState);
    
  }, []);
  
  
  useEffect(() => {
    const loadComponentPath = async () => {
      
      const dynamicComponentPath = await generateComponentPath(location.pathname, pagesContext, routerOptions);
      
      setDynamicComponent(dynamicComponentPath);
    };
    
    loadComponentPath();
    
  }, []);
  
  const contextValue = {
    location,
    navigate: (path, state) => {
      window.history.pushState(state, null, path);
      setLocation({pathname: path, state});
    },
  };
  
  const PageComponent = dynamicComponent.componentPath ? lazy(() => import(dynamicComponent.componentPath)) : null;
  //{children}
  
  return (<RouterContext.Provider value={contextValue}>
    <Suspense fallback={<div>Loading...</div>}>
      <>{PageComponent && <PageComponent slugs={dynamicComponent.slugs}/>}</>
    </Suspense>
  </RouterContext.Provider>);
}


export default Router;
