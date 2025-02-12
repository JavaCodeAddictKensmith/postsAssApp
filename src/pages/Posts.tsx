import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Pagination from "../components/Pagination";

const baseUrl = "https://jsonplaceholder.typicode.com";
import { debounce } from "lodash";
import Card from "../components/Card";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"title" | "body">("title");

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
  // const addPostMutation = useMutation({
  //   mutationFn: async (newPost: Omit<Post, "id">) => {
  //     const response = await axios.post<Post>(`${baseUrl}/posts`, newPost);
  //     return { ...response.data, id: Date.now(), isLocal: true }; // Mark as locally created
  //   },
  //   onSuccess: (data) => {
  //     queryClient.setQueryData<Post[]>(["get-posts"], (oldPosts = []) => [
  //       ...oldPosts,
  //       data,
  //     ]);
  //     closeModal();
  //   },
  // });
  const addPostMutation = useMutation({
    mutationFn: async (newPost: Omit<Post, "id">) => {
      const response = await axios.post<Post>(`${baseUrl}/posts`, newPost);
      return { ...response.data, id: Date.now(), isLocal: true }; // Mark as locally created
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Post[]>(["get-posts"], (oldPosts = []) => [
        data, // Prepend the new post
        ...oldPosts,
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

  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return posts.slice(start, start + rowsPerPage);
  }, [page, posts, rowsPerPage]);

  // Debounced search input
  const handleSearch = useMemo(
    () => debounce((query: string) => setSearchQuery(query), 300),
    []
  );

  // Sorted & filtered posts
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

  /*
    padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background-color: purple;
  color: whitesmoke;
  position: sticky;
  top: 0;


  */

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <header className="p-[1rem] flex-col justify-between items-start bg-purple-500 text-white sticky rounded-md">
        <h2 className=" italic  font-bold  text-4xl">POSTS BLOG</h2>
        <p className=" italic   font-light  text-medium mt-3.5">
          View the latest posts
        </p>
      </header>

      {/* <div className="flex flex-col w-full  justify-center"> */}
      {/* <div className="flex gap-2 mb-4 mt-9 flex-wrap justify-between items-center ">
          <input
            type="text"
            placeholder="Search posts..."
            className="border px-2  py-4 lg:w-[600px] border-gray-300 rounded-lg  focus:outline-none"
            onChange={(e) => handleSearch(e.target.value)}
          />
          <select
            className="border px-2  py-4  border-gray-300 rounded-lg  focus:outline-none"
            onChange={(e) => setSortKey(e.target.value as "title" | "body")}
          >
            <option value="title">Sort by Title</option>
            <option value="body">Sort by Body</option>
          </select>

          <div className=" justify-center items-center flex ">
            {" "}
            <button
              className="bg-green-700  text-white px-2 py-3 rounded-md"
              onClick={() => openModal()}
            >
              Add New Post
            </button>
          </div>
        </div> */}

      <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        {" "}
        <input
          type="text"
          placeholder="Search posts..."
          className="border px-2  py-4 lg:w-[600px] border-gray-300 rounded-lg  focus:outline-none"
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          className="border px-2  py-4  border-gray-300 rounded-lg  focus:outline-none"
          onChange={(e) => setSortKey(e.target.value as "title" | "body")}
        >
          <option value="title">Sort by Title</option>
          <option value="body">Sort by Body</option>
        </select>
        <div className=" justify-center items-center flex ">
          {" "}
          <button
            className="bg-green-700  text-white px-2 py-3 rounded-md"
            onClick={() => openModal()}
          >
            Add New Post
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredPosts.map((post) => (
          <Card
            post={post}
            openDeleteModal={openDeleteModal}
            openModal={openModal}
          />

          // <div
          //   key={post.id}
          //   className="flex flex-col gap-2.5 mt-5 bg-white shadow-md min-h-[200px] lg:w-[500px] py-4 px-4 rounded-md border-[0.5px] border-gray-300"
          // >
          //   <p className="text-lg font-bold italic">{post.title}</p>
          //   <p>{post.body}</p>
          //   <div className="flex gap-2">
          //     <button
          //       className="bg-blue-500 text-white px-3 py-1 rounded-md"
          //       onClick={() => openModal(post)}
          //     >
          //       Edit
          //     </button>
          //     <button
          //       className="bg-red-500 text-white px-3 py-1 rounded-md"
          //       onClick={() => openDeleteModal(post)}
          //     >
          //       Delete
          //     </button>
          //   </div>
          // </div>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <Pagination
          page={page}
          setPage={setPage}
          totalPages={Math.ceil(posts?.length / rowsPerPage)}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
        />
      </div>

      {/* <div className="flex justify-center gap-x-[8px] mt-[40px]">
          <Pagination
            page={page}
            setPage={setPage}
            totalPages={Math.ceil(posts?.length / rowsPerPage)}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
          />
        </div> */}

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
                className="bg-green-700  text-white px-3 py-1 rounded-md"
                onClick={handleSubmit}
              >
                {isEditing ? "Save Changes" : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* </div> */}

      {/* stops here */}
    </div>
  );
}

export default Posts;
