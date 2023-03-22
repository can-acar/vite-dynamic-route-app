import RouterContext from "lib/router-context.js";
import {useContext} from "react";

const Link = ({href, children, ...props}) => {
  
  const {navigate} = useContext(RouterContext);
  
  const handleClick = (e) => {
    e.preventDefault();
    navigate(href);
  }
  
  return (<a href={href} onClick={handleClick} {...props}>{children}</a>)
  
}

export default Link;
