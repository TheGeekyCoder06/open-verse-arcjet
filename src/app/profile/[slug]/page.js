import connectDb from "@/db/dbConfig";
import User from "@/models/User";
import BlogPost from "@/models/BlogPost";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic"; // ensure fresh data

async function getUserProfile(slug) {
  await connectDb();

  const user = await User.findOne({ username: slug }).lean();
  if (!user) return null;

  const posts = await BlogPost.find({ author: user._id })
    .select("title coverImage createdAt category")
    .sort({ createdAt: -1 })
    .lean();

  return { user, posts };
}

export default async function ProfilePage({ params }) {
  const { slug } = params;
  const data = await getUserProfile(slug);

  if (!data) return notFound();
  const { user, posts } = data;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Profile Header */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold">
          {user.username?.[0]?.toUpperCase()}
        </div>

        <div>
          <h1 className="text-3xl font-bold">@{user.username}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* Posts Section */}
      <h2 className="text-2xl font-semibold mb-4">
        Blogs by {user.username}
      </h2>

      {posts.length === 0 ? (
        <p className="text-gray-500">This user hasn't posted any blogs yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {posts.map((post) => (
            <a
              key={post._id}
              href={`/blog/${post._id}`}
              className="border rounded-xl p-4 hover:shadow transition"
            >
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  className="w-full h-40 object-cover rounded mb-3"
                />
              )}

              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(post.createdAt).toLocaleDateString()} — {post.category}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
