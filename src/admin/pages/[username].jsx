import useRouter from "lib/use-router.js";

const UsePage = (props) => {
  
  const router = useRouter();
  
  
  return (
      <div>
        <h1>Admin User Page</h1>
        <p>props detail:{JSON.stringify(props)}</p>
  
        <p>router detail:{JSON.stringify(router)}</p>
      </div>
  );
}
export default UsePage
