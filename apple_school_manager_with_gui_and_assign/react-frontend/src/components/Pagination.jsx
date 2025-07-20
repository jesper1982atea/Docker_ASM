import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;
  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages) onPageChange(page);
  };
  const pageNumbers = [];
  const maxPagesToShow = 5;
  let startPage = 1, endPage = totalPages;
  if (totalPages > maxPagesToShow) {
    const half = Math.floor(maxPagesToShow / 2);
    if (currentPage <= half) {
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + half >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - half;
      endPage = currentPage + half;
    }
  }
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
  return (
    <div className="pagination">
      <button onClick={() => handlePageClick(1)} disabled={currentPage === 1}>&laquo;</button>
      <button onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1}>&lsaquo;</button>
      {startPage > 1 && <span className="page-ellipsis">...</span>}
      {pageNumbers.map(number => (
        <button key={number} onClick={() => handlePageClick(number)} className={currentPage === number ? 'active' : ''}>{number}</button>
      ))}
      {endPage < totalPages && <span className="page-ellipsis">...</span>}
      <button onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage === totalPages}>&rsaquo;</button>
      <button onClick={() => handlePageClick(totalPages)} disabled={currentPage === totalPages}>&raquo;</button>
    </div>
  );
};

export default Pagination;
