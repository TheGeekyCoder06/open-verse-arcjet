import { unstable_noStore as noStore } from "next/cache";
import { getBlogPostsAction } from "@/actions/blog";
import HomeComponent from "@/components/home/index";

export const dynamic = "force-dynamic";

export default async function Home() {
  noStore();

  const data = await getBlogPostsAction();
  return <HomeComponent posts={data?.posts || []} />;
}
