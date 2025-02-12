import TransitionScale from "./TransitionScale";

const Card = ({ openModal, post, openDeleteModal }) => {
  return (
    <TransitionScale>
      <div
        key={post.id}
        // className="flex flex-col gap-2.5 mt-5 bg-white shadow-md min-h-[200px] lg:w-[500px] py-4 px-4 rounded-md border-[0.5px] border-gray-300"

        className="bg-white shadow-lg rounded-lg p-5 border border-gray-200 "
      >
        <p className="text-lg font-semibold italic">{post.title}</p>
        <p className="text-gray-600 mt-2">{post.body}</p>

        <div className="flex  gap-3 mt-4">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md"
            onClick={() => openModal(post)}
          >
            Edit
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
            onClick={() => openDeleteModal(post)}
          >
            Delete
          </button>
        </div>
      </div>
    </TransitionScale>
  );
};

export default Card;
