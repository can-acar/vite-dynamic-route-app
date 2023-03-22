import RouterContext from 'lib/router-context';
import {pathToRegexp} from "path-to-regexp";
import React, {lazy, Suspense, useCallback, useEffect, useMemo, useState} from 'react';


//require.context([`./pages`], true, /\.jsx$/);
const pagesContext = import.meta.glob(`./pages/**/*.jsx`);
debugger
const Router = ({children}) => {
  const [location, setLocation] = useState(window.location.pathname);
  const [dynamicComponent, setDynamicComponent] = useState({componentPath: null, slugs: null});
  const [routers, setRouters] = useState([]);
  
  // const pagesContext = useMemo(() => import.meta.glob(`./pages/**/*.jsx`), [import.meta.glob]);
  const getSlugs = (filename) => useMemo(() => {
    return filename.replace('./', '')
        .replace('.jsx', '')
        .split('/')
        .filter((part) => part.startsWith('[') && part.endsWith(']'))
        .map((part) => part.slice(1, -1));
    
  }, [filename]);
  
  const matchRoute = useCallback((pathname) => {
    const keys = [];
    debugger
    for (const filename of pagesContext.keys()) {
      const slugs = getSlugs(filename);
      const pattern = filename.replace('./', '/')
          .replace('.jsx', '')
          .replace(/\[(\w+)\]/g, ':$1');
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
    
    return {componentPath: './pages/NotFound.jsx', slugs: {}};
    
  }, [pagesContext, getSlugs, pathToRegexp]);
  
  
  useEffect(() => {
    const onPopState = () => {
      debugger
      setLocation({pathname: window.location.pathname, state: window.history.state});
    };
    
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
    
  }, []);
  
  const contextValue = {
    location,
    navigate: (path, state) => {
      window.history.pushState(state, null, path);
      setLocation({pathname: path, state});
    },
  };
  
  const generateComponentPath = (pathname) => {
    return matchRoute(pathname);
  }
  
  // const PageComponent = lazy(() => import(generateComponentPath(location.pathname)));
  
  
  useEffect(() => {
    const loadComponentPath = async () => {
      const dynamicComponentPath = await generateComponentPath(location.pathname);
      
      setDynamicComponent(dynamicComponentPath);
    };
    
    loadComponentPath();
    
  }, [location.pathname]);
  
  const PageComponent = dynamicComponent.componentPath
                        ? lazy(() => import(dynamicComponent.componentPath))
                        : null;
  
  return (
      <RouterContext.Provider value={contextValue}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        {PageComponent && <PageComponent slugs={dynamicComponent.slugs}/>}
      </RouterContext.Provider>
  );
}


export default Router;
