// import PAIconPaginationRight from "../assets/images/svg/carat-right.svg";
// import PAIconPaginationLeft from "../assets/images/svg/carat-left.svg";

import React from "react";
import Button from "./Button";

interface PaginationProps {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  rowsPerPage: number;
  setRowsPerPage: (rows: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  setPage,
  totalPages,
  rowsPerPage,
  setRowsPerPage,
}) => {
  const handleNext = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  const handlePrev = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(0); // Reset to the first page when rows per page changes
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Button
          neutral
          disabled={page === 0}
          onClick={handlePrev}
          className="   bg-green-700 p-2 rounded-lg text-white w-20"
        >
          {"Previous"}
          {/* <PAIconPaginationLeft /> */}
        </Button>
        <span className="px-2">{`Page ${page + 1} of ${totalPages}`}</span>
        <Button
          neutral
          disabled={page >= totalPages - 1}
          onClick={handleNext}
          className="   bg-green-700 p-2 rounded-lg text-white  w-20"
        >
          {/* <PAIconPaginationRight /> */}

          {"Next"}
        </Button>
      </div>
      <div>
        <label htmlFor="rowsPerPage" className="mx-2 text-sm">
          Rows per page:
        </label>
        <select
          id="rowsPerPage"
          value={rowsPerPage}
          onChange={handleRowsPerPageChange}
          className="border rounded px-2 py-1 text-sm"
        >
          {[10, 20, 25].map((rows) => (
            <option key={rows} value={rows}>
              {rows}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;
