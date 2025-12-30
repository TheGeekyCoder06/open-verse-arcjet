import { getBlogPostsAction } from "@/actions/blog";
import HomeComponent from "@/components/home";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getBlogPostsAction();
  return <HomeComponent posts={posts.posts} />;
}
