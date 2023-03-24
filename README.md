# vite-dynamic-route-app

This is a custom Router component for a vite dyamic route app like a next.js without use the react-router-dom.
It dynamically imports and displays the appropriate page components based on the current URL path.

Here's a brief explanation of the code:

getQueryParams: A helper function that extracts the dynamic parts of a route path from the given filename.

generateComponent: A function that finds the appropriate component for a given path by iterating over the available pages and matching the path to a pattern generated from each filename.

matchRoute: A function that returns the matched route information for a given path, including the pathname, query parameters, and slug information.

Router: The main functional component of the custom Router. It has the following features:

Initializes state variables for the component, route, and location.
Uses useMemo to create a pagesContext object that contains the page components imported using the import.meta.glob function.
Sets up event listeners for the popstate event to handle browser navigation.
Updates the component and route state when the location changes by calling the matchRoute and generateComponent functions.
Provides a context value for child components to access the location and navigation functions.
Renders the matched page component using React.lazy and Suspense to handle asynchronous component loading.
export default Router: Exports the Router component as the default export.

This custom Router component is an alternative to popular routing libraries like React Router. It allows you to create a dynamic, client-side router that automatically handles URL changes and loads the appropriate page components based on the current path.
