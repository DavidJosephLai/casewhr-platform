import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  language: 'en' | 'zh';
  sectionId?: string; // 可選的 section ID，用於滾動定位
}

export function Pagination({ currentPage, totalPages, onPageChange, language, sectionId }: PaginationProps) {
  // Google 風格分頁：顯示當前頁面前後各 2 頁
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 7; // 最多顯示 7 個頁碼按鈕
    
    if (totalPages <= maxVisiblePages) {
      // 如果總頁數少於等於最大可見數，顯示全部
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 否則智能顯示
      if (currentPage <= 4) {
        // 當前頁在前面：顯示 1 2 3 4 5 ... 最後頁
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // 當前頁在後面：顯示 1 ... 倒數5頁
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 當前頁在中間：顯示 1 ... 前2 當前 後2 ... 最後頁
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  // 滾動到專案列表頂部
  const handlePageChange = (page: number) => {
    onPageChange(page);
    // 平滑滾動但不改變 URL hash
    setTimeout(() => {
      const projectsSection = document.getElementById(sectionId || 'projects');
      if (projectsSection) {
        const yOffset = -100; // 留一些頂部空間
        const y = projectsSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-8 mb-4">
      {/* Previous Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="mr-2"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        {language === 'en' ? 'Previous' : '上一頁'}
      </Button>

      {/* Page Numbers */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <Button
            key={pageNum}
            type="button"
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={(e) => handlePageChange(pageNum)}
            className={`min-w-[40px] ${
              isActive
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'hover:bg-gray-100'
            }`}
          >
            {pageNum}
          </Button>
        );
      })}

      {/* Next Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="ml-2"
      >
        {language === 'en' ? 'Next' : '下一頁'}
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}