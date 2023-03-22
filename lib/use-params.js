import RouterContext from "lib/router-context.js";
import {useContext, useMemo} from "react";

const useParams = () => {
  const {location} = useContext(RouterContext);
  
  if (location && location.state && location.state.params) {
    return useMemo(() => location.state.params, [location.state.params]);
  }
  
  return {};
}

export default useParams;
