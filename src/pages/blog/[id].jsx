import useRouter from "lib/use-router.js";

const BlogPostPage = (props) => {
 
  const router = useRouter();
  
  
  return (
      <div>
        <h1>Blog Post</h1>
        <p>Post detail:{JSON.stringify(props)}</p>
      </div>
  );
}
export default BlogPostPage
