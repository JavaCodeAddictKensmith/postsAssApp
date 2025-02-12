Search Filter Features

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";

const BASE_URL = "https://jsonplaceholder.typicode.com";

interface Post {
  id: number;
  title: string;
  body: string;
  isLocal?: boolean;
}

function Posts() {
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newPost, setNewPost] = useState<Omit<Post, "id">>({
    title: "",
    body: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"title" | "body">("title");

  // Fetch posts from API
  const fetchPosts = async (): Promise<Post[]> => {
    const response = await axios.get<Post[]>(`${BASE_URL}/posts`);
    return response.data;
  };

  const {
    data: posts = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["get-posts"],
    queryFn: fetchPosts,
    onSuccess: (data) => {
      const storedPosts = JSON.parse(localStorage.getItem("posts") || "[]");
      queryClient.setQueryData(["get-posts"], [...storedPosts, ...data]);
    },
  });

  // Persist posts in local storage
  useEffect(() => {
    localStorage.setItem("posts", JSON.stringify(posts));
  }, [posts]);

  // Add new post
  const addPostMutation = useMutation({
    mutationFn: async (newPost: Omit<Post, "id">) => {
      const response = await axios.post<Post>(`${BASE_URL}/posts`, newPost);
      return { ...response.data, id: Date.now(), isLocal: true };
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Post[]>(["get-posts"], (oldPosts = []) => [
        data,
        ...oldPosts,
      ]);
      closeModal();
    },
  });

  // Edit post
  const editPostMutation = useMutation({
    mutationFn: async (updatedPost: Post) => {
      if (updatedPost.isLocal) return updatedPost;
      const response = await axios.put<Post>(
        `${BASE_URL}/posts/${updatedPost.id}`,
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

  // Delete post
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await axios.delete(`${BASE_URL}/posts/${postId}`);
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.setQueryData<Post[]>(["get-posts"], (oldPosts = []) =>
        oldPosts.filter((post) => post.id !== postId)
      );
      closeDeleteModal();
    },
  });

  // Handlers
  const openModal = useCallback((post: Post | null = null) => {
    setSelectedPost(post);
    setNewPost(
      post ? { title: post.title, body: post.body } : { title: "", body: "" }
    );
    setIsEditing(!!post);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedPost(null);
    setNewPost({ title: "", body: "" });
  }, []);

  const openDeleteModal = useCallback((post: Post) => {
    setSelectedPost(post);
    setIsDeleteModalOpen(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setSelectedPost(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isEditing && selectedPost) {
      editPostMutation.mutate({
        id: selectedPost.id,
        ...newPost,
        isLocal: selectedPost.isLocal,
      });
    } else {
      addPostMutation.mutate(newPost);
    }
  }, [isEditing, selectedPost, newPost]);

  // Debounced search input
  const handleSearch = useMemo(
    () => debounce((query: string) => setSearchQuery(query), 300),
    []
  );

  // Sorted & filtered posts
  const filteredPosts = useMemo(() => {
    return posts
      .filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => a[sortKey].localeCompare(b[sortKey]));
  }, [posts, searchQuery, sortKey]);

  if (isLoading) return <div>Loading posts...</div>;
  if (isError) return <div>Error fetching posts.</div>;

  return (
    <div className="flex flex-col w-full items-center">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search posts..."
          className="border p-2"
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          className="border p-2"
          onChange={(e) => setSortKey(e.target.value as "title" | "body")}
        >
          <option value="title">Sort by Title</option>
          <option value="body">Sort by Body</option>
        </select>
      </div>

      <button
        className="bg-green-500 text-white p-2 rounded-md"
        onClick={() => openModal()}
      >
        Add New Post
      </button>

      {filteredPosts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          openModal={openModal}
          openDeleteModal={openDeleteModal}
        />
      ))}
    </div>
  );
}

// Memoized PostItem Component
const PostItem = React.memo(
  ({
    post,
    openModal,
    openDeleteModal,
  }: {
    post: Post;
    openModal: (post: Post) => void;
    openDeleteModal: (post: Post) => void;
  }) => (
    <div className="flex flex-col gap-2.5 mt-5 bg-white shadow-md min-h-[200px] w-[500px] py-4 px-4 rounded-md">
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
  )
);

export default Posts;

