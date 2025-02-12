import React from "react";

const Card = ({ openModal, post, openDeleteModal }) => {
  return (
    <div
      key={post.id}
      className="flex flex-col gap-2.5 mt-5 bg-white shadow-md min-h-[200px] lg:w-[500px] py-4 px-4 rounded-md border-[0.5px] border-gray-300"
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
  );
};

export default Card;
