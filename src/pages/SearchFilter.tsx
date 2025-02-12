import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Pagination from "../components/Pagination";
import { debounce } from "lodash";

const baseUrl = "https://jsonplaceholder.typicode.com";

interface Post {
  id: number;
  title: string;
  body: string;
  isLocal?: boolean;
}

function Posts() {
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newPost, setNewPost] = useState<Omit<Post, "id">>({
    title: "",
    body: "",
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"title" | "body">("title");
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const getPosts = async (): Promise<Post[]> => {
    const response = await axios.get<Post[]>(`${baseUrl}/posts`);
    return response.data;
  };

  const {
    data: posts = [],
    isLoading,
    isError,
  } = useQuery({ queryKey: ["get-posts"], queryFn: getPosts });

  const handleSearch = useMemo(
    () => debounce((query: string) => setSearchQuery(query), 300),
    []
  );

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return posts.slice(start, start + rowsPerPage);
  }, [page, posts, rowsPerPage]);

  const filteredPosts = useMemo(() => {
    return paginatedData
      .filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a[sortKey].localeCompare(b[sortKey]));
  }, [paginatedData, searchQuery, sortKey]);

  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div>Oops! Something went wrong.</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <header className="p-6 flex flex-col justify-center items-center bg-purple-600 text-white rounded-md shadow-lg">
        <h2 className="italic font-bold text-4xl">KENSCONSULTING BLOG</h2>
        <p className="italic font-light text-lg mt-2">View the latest posts</p>
      </header>

      <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <input
          type="text"
          placeholder="Search posts..."
          className="border px-4 py-2 w-full sm:w-80 border-gray-300 rounded-lg focus:outline-none"
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          className="border px-4 py-2 border-gray-300 rounded-lg focus:outline-none"
          onChange={(e) => setSortKey(e.target.value as "title" | "body")}
        >
          <option value="title">Sort by Title</option>
          <option value="body">Sort by Body</option>
        </select>
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          onClick={() => setIsModalOpen(true)}
        >
          Add New Post
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white shadow-lg rounded-lg p-5 border border-gray-200"
          >
            <h3 className="text-lg font-semibold">{post.title}</h3>
            <p className="text-gray-600 mt-2">{post.body}</p>
            <div className="flex justify-between mt-4">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
                onClick={() => setSelectedPost(post)}
              >
                Edit
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                onClick={() => setSelectedPost(post)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <Pagination
          page={page}
          setPage={setPage}
          totalPages={Math.ceil(posts.length / rowsPerPage)}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
        />
      </div>

      {isModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Edit Post" : "Add New Post"}
            </h2>
            <input
              type="text"
              placeholder="Title"
              className="w-full border p-2 mb-2"
              value={newPost.title}
              onChange={(e) =>
                setNewPost({ ...newPost, title: e.target.value })
              }
            />
            <textarea
              placeholder="Body"
              className="w-full border p-2 mb-2"
              value={newPost.body}
              onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-400 text-white px-3 py-1 rounded-md"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button className="bg-green-700 text-white px-3 py-1 rounded-md">
                {isEditing ? "Save Changes" : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Posts;
