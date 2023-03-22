import RouterContext from "lib/router-context.js";
import {useContext} from "react";

const useRouter = () => useContext(RouterContext);

export default useRouter;
