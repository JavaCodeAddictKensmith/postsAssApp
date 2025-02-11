// import { useState } from "react";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";

interface Posts {
  userId: number;
  id: number;
  title: string;
  body: string;
}

function Posts() {
  const getPosts = async (): Promise<Posts[]> => {
    const posts = await (
      await axios.get("https://jsonplaceholder.typicode.com/posts")
    )?.data;
    return posts;
  };
  const { data, isLoading, isError } = useQuery({
    queryKey: ["get-posts"],
    queryFn: getPosts,
  });

  if (isLoading) {
    return <div>Loading posts...</div>;
  }

  if (isError) {
    return <div>Oops!</div>;
  }

  return (
    <div className=" flex flex-col w-full items-center justify-center">
      {data?.map((post) => (
        <div className=" flex flex-col gap-2.5 mt-5 bg-white shadow-gray-400 shadow-md  min-h-[200px] w-[500px] py-4 rounded-md">
          <p key={post.id} className=" text-lg  font-bold italic">
            {post.title}
          </p>
          <p className="" key={post.id}>
            {post.body}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Posts;
