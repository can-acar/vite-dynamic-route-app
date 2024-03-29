import RouterContext from 'lib/router-context';
import {pathToRegexp} from "path-to-regexp";
import React, {Fragment, Suspense, useEffect, useMemo, useState} from 'react';


const getQueryParams = (filename, options) => {
    
    const dirOptions = options.dirs.find((dirOption) => filename.includes(dirOption.dir));
    
    return filename
        .replace(`../${dirOptions.dir}`, '')
        .replace(new RegExp(`\\.(${options.ext.join('|')})$`), '')
        .split('/')
        .filter((part) => part.startsWith('[') && part.endsWith(']'))
        .map((part) => part.slice(1, -1));
};

const generatePattern = (filename, dirOptions, options) => {
    let pattern = filename
        .replace(`../${dirOptions.dir}`, '')
        .replace(new RegExp(`\\.(${options.ext.join('|')})$`), '')
        .replace(/\[(\w+)]/g, `:$1`)
        .replace(/\[\[\.\.\.(\w+)]]/g, `:$1([^/]+/?)*`) //[[...slug]] optional params
        .replace(/\[\.\.\.(\w+)]/g, `:$1([^/]+/?)+`) // [...slug] required params
        .replace(/\/index$/, '');
    
    
    if (dirOptions.baseRouter === '/') {

        pattern = `${pattern}`;

    } else {
        pattern = `${dirOptions.baseRouter}${pattern}`;
    }
    
    console.log('pattern', pattern);
    
    return pattern;
};


const generateComponent = async (pathname, pages, options) => {
    
    let keys = [];
    let isMatch = false;
    let component = {
        componentPath: "", name: "", isReady: false
    }
    
    // order first is default true
    let ordersKey = Object.keys(pages).sort((a, b) => {
        const dirOptionA = pages[a];
        const dirOptionB = pages[b];
        if (dirOptionA.isDefault && !dirOptionB.isDefault) {
            return -1;
        } else if (!dirOptionA.isDefault && dirOptionB.isDefault) {
            return 1;
        } else {
            return 0;
        }
    })
    
    
    for (const filename of ordersKey) {
        
        
        const dirOptions = options.dirs.find((dirOption) => filename.includes(dirOption.dir));
        
        
        const pattern = generatePattern(filename, dirOptions, options);
        
        const re = pathToRegexp(pattern, keys);
        
        let path = ""
        
        if (dirOptions.baseRouter === '') {
            
            path = `${pathname}`;
            
        } else {
            
            path = `${dirOptions.baseRouter}${pathname}`;
        }
        
        
        const match = re.exec(path);
        
        
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
            componentPath: `../${options.dirs[0].dir}/NotFound.${options.ext[0]}`, name: "NotFound", isReady: true,
        }
    }
    
    return component;
    
}

const matchRoute = async (pathname, pages, options) => {
    
    
    let query = {};
    let slug = [];
    let isMatch = false;
    
    let route = {
        pathname: "", basePath: "", locale: "", query: {}, slug: [],
    }
    
    let ordersKey = Object.keys(pages).sort((a, b) => {
        const dirOptionA = pages[a];
        const dirOptionB = pages[b];
        if (dirOptionA.isDefault && !dirOptionB.isDefault) {
            return -1;
        } else if (!dirOptionA.isDefault && dirOptionB.isDefault) {
            return 1;
        } else {
            return 0;
        }
    })
    
    
    for (const filename of ordersKey) {
        let keys = [];
        
        slug = getQueryParams(filename, options);
        
        const dirOptions = options.dirs.find((dirOption) => filename.includes(dirOption.dir));
        
        const pattern = generatePattern(filename, dirOptions, options);
        
        if (pathname.endsWith('/')) {
            pathname = pathname.slice(0, -1);
        }
        
        let path = '';
        
        if (dirOptions.baseRouter === '') {
            
            path = `${pathname}`;
            
        } else {
            
            path = `${dirOptions.baseRouter}${pathname}`;
        }
        
        console.log('path', path);
        
        const re = pathToRegexp(pattern, keys);
        
        const match = re.exec(path);
        
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
                basePath: dirOptions.baseRouter,
                locale: dirOptions.locale,
            }
            
            break;
        }
    }
    
    if (!isMatch) {
        
        route = {
            pathname: pathname, query: {}, slug: {}, basePath: "",
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
        componentPath: "", isReady: false, name: "",
    });
    
    const [route, updateRoute] = useState({
        pathname: "", basePath: "", locale: "", slug: {}, query: {}
    });
    
    const [location, setLocation] = useState({
        pathname: window.location.pathname, //|| routerOptions.dirs[0].baseRouter,
        state: window.history.state,
    });
    
    
    const pagesContext = useMemo(() => {
        
        const contexts = {};
        
        const context = import.meta.glob(`../src/**/*.(jsx|js)`, {"eager": true});
        
        for (const filename of Object.keys(context)) {
            
            for (const dirOption of routerOptions.dirs) {
                
                if (filename.includes(dirOption.dir)) {
                    contexts[filename] = {
                        ...contexts[filename],
                        isDefault: dirOption.isDefault,
                    }
                }
            }
        }
        
        return contexts;
        
    }, []);
    
    
    useEffect(() => {
        const onPopState = () => {
            // replace last trailing slash
            
            
            setLocation({
                pathname: window.location.pathname, state: window.history.state
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
            let pathname = location.pathname;
            
            const route = await matchRoute(pathname, pagesContext, routerOptions);
            
            const component = await generateComponent(pathname, pagesContext, routerOptions);
            
            setComponent(component);
            
            updateRoute(route);
            
        };
        
        bootstrap().then(() => {
            
            console.log('bootstrap done');
        });
        
    }, []);
    
    const contextValue = {
        location, query: route.query, navigate: (path, state) => {
            window.history.pushState(state, null, path);
            setLocation({pathname: path, state});
        },
    };
    const Loader = () => <Fragment>{props.loader()}</Fragment> || <div>Loading...</div>
    
    if (!component.isReady) {
        return (<Loader/>);
    }
    
    
    const PageComponent = React.lazy(async () => await import(/* @vite-ignore */component.componentPath))
    
    
    return (<RouterContext.Provider value={contextValue}>
        <Suspense fallback={<Loader/>}>
            <PageComponent {...route}/>
        </Suspense>
    </RouterContext.Provider>);
}


export default Router;
