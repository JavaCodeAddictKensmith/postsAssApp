import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const baseUrl = "https://jsonplaceholder.typicode.com";

interface Post {
  id: number;
  title: string;
  body: string;
  isLocal?: boolean; // Flag to differentiate between local and API posts
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

  // Fetch posts
  const getPosts = async (): Promise<Post[]> => {
    const response = await axios.get<Post[]>(`${baseUrl}/posts`);
    return response.data;
  };

  const {
    data: posts = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["get-posts"],
    queryFn: getPosts,
  });

  // Add post mutation
  const addPostMutation = useMutation({
    mutationFn: async (newPost: Omit<Post, "id">) => {
      const response = await axios.post<Post>(`${baseUrl}/posts`, newPost);
      return { ...response.data, id: Date.now(), isLocal: true }; // Mark as locally created
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Post[]>(["get-posts"], (oldPosts = []) => [
        ...oldPosts,
        data,
      ]);
      closeModal();
    },
  });

  // Edit post mutation
  const editPostMutation = useMutation({
    mutationFn: async (updatedPost: Post) => {
      if (!updatedPost.id) throw new Error("Post ID is required");
      if (updatedPost.isLocal) {
        return updatedPost; // Return locally edited post without API call
      }
      const response = await axios.put<Post>(
        `${baseUrl}/posts/${updatedPost.id}`,
        updatedPost
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Post[]>(["get-posts"], (oldPosts = []) =>
        oldPosts.map((post) => (post.id === data.id ? data : post))
      );
      closeModal();
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await axios.delete(`${baseUrl}/posts/${postId}`);
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.setQueryData<Post[]>(["get-posts"], (oldPosts = []) =>
        oldPosts.filter((post) => post.id !== postId)
      );
      closeDeleteModal();
    },
  });

  // Open modal for creating or editing posts
  const openModal = (post: Post | null = null) => {
    setSelectedPost(post);
    setNewPost(
      post ? { title: post.title, body: post.body } : { title: "", body: "" }
    );
    setIsEditing(!!post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    setNewPost({ title: "", body: "" });
  };

  const openDeleteModal = (post: Post) => {
    setSelectedPost(post);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedPost(null);
  };

  const handleSubmit = () => {
    if (isEditing && selectedPost) {
      editPostMutation.mutate({
        id: selectedPost.id,
        ...newPost,
        isLocal: selectedPost.isLocal,
      });
    } else {
      addPostMutation.mutate(newPost);
    }
  };

  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div>Oops! Something went wrong.</div>;

  return (
    <div className="flex flex-col w-full items-center justify-center">
      <button
        className="bg-green-500 text-white p-2 rounded-md"
        onClick={() => openModal()}
      >
        Add New Post
      </button>
      {posts.map((post) => (
        <div
          key={post.id}
          className="flex flex-col gap-2.5 mt-5 bg-white shadow-md min-h-[200px] w-[500px] py-4 px-4 rounded-md"
        >
          <p className="text-lg font-bold italic">{post.title}</p>
          <p>{post.body}</p>
          <div className="flex gap-2">
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded-md"
              onClick={() => openModal(post)}
            >
              Edit
            </button>
            <button
              className="bg-red-500 text-white px-3 py-1 rounded-md"
              onClick={() => openDeleteModal(post)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {isDeleteModalOpen && selectedPost && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-5 rounded-md w-[400px]">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to delete this post?</p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-400 text-white px-3 py-1 rounded-md"
                onClick={closeDeleteModal}
              >
                No
              </button>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded-md"
                onClick={() => deletePostMutation.mutate(selectedPost.id)}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-5 rounded-md w-[400px]">
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
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 text-white px-3 py-1 rounded-md"
                onClick={handleSubmit}
              >
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
