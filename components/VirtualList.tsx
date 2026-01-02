/**
 * 📜 虚拟列表组件
 * 高性能长列表渲染组件
 */

import React from 'react';
import { useVirtualList, useVirtualGrid } from '../hooks/useVirtualList';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  height?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  isLoading?: boolean;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

/**
 * 虚拟列表组件
 * 
 * @example
 * ```tsx
 * <VirtualList
 *   items={projects}
 *   itemHeight={100}
 *   height={600}
 *   renderItem={(project, index) => (
 *     <ProjectCard project={project} />
 *   )}
 * />
 * ```
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  height = 600,
  overscan = 5,
  className = '',
  emptyMessage = '暂无数据',
  loadingMessage = '加载中...',
  isLoading = false,
  onEndReached,
  endReachedThreshold = 200,
}: VirtualListProps<T>) {
  const {
    virtualItems,
    totalHeight,
    containerRef,
    isScrolling,
  } = useVirtualList(items, {
    itemHeight,
    overscan,
    containerHeight: height,
  });

  // 监听滚动到底部
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || !onEndReached) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      
      if (distanceToBottom < endReachedThreshold) {
        onEndReached();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, onEndReached, endReachedThreshold]);

  // 空状态
  if (!isLoading && items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // 加载状态
  if (isLoading && items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-2"></div>
          <p className="text-gray-500">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {virtualItems.map(({ index, data, offsetTop, height: itemHt }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: offsetTop,
              width: '100%',
              height: itemHt,
            }}
            className={isScrolling ? 'pointer-events-none' : ''}
          >
            {renderItem(data, index)}
          </div>
        ))}
      </div>
      
      {/* 加载更多指示器 */}
      {isLoading && items.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}

interface VirtualGridProps<T> {
  items: T[];
  rowHeight: number;
  columnCount: number;
  columnWidth?: number | 'auto';
  gap?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  height?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
}

/**
 * 虚拟网格组件
 * 
 * @example
 * ```tsx
 * <VirtualGrid
 *   items={images}
 *   rowHeight={200}
 *   columnCount={3}
 *   gap={16}
 *   height={600}
 *   renderItem={(image) => (
 *     <img src={image.url} alt={image.alt} />
 *   )}
 * />
 * ```
 */
export function VirtualGrid<T>({
  items,
  rowHeight,
  columnCount,
  columnWidth = 'auto',
  gap = 16,
  renderItem,
  height = 600,
  overscan = 3,
  className = '',
  emptyMessage = '暂无数据',
}: VirtualGridProps<T>) {
  const {
    virtualItems,
    totalHeight,
    containerRef,
  } = useVirtualGrid(items, {
    rowHeight,
    columnCount,
    columnWidth,
    gap,
    overscan,
  });

  // 空状态
  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {virtualItems.map(({ index, data, top, left, width, height: itemHeight }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top,
              left,
              width,
              height: itemHeight,
            }}
          >
            {renderItem(data, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

interface InfiniteScrollListProps<T> extends VirtualListProps<T> {
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * 无限滚动列表组件
 * 结合虚拟滚动和无限加载
 * 
 * @example
 * ```tsx
 * <InfiniteScrollList
 *   items={projects}
 *   itemHeight={100}
 *   hasMore={hasMore}
 *   loadMore={loadNextPage}
 *   isLoading={isLoading}
 *   renderItem={(project) => <ProjectCard project={project} />}
 * />
 * ```
 */
export function InfiniteScrollList<T>({
  items,
  hasMore,
  loadMore,
  isLoading = false,
  ...props
}: InfiniteScrollListProps<T>) {
  const loadMoreRef = React.useRef(loadMore);
  loadMoreRef.current = loadMore;

  const handleEndReached = React.useCallback(() => {
    if (!isLoading && hasMore) {
      console.log('📜 [InfiniteScroll] Loading more items...');
      loadMoreRef.current();
    }
  }, [isLoading, hasMore]);

  return (
    <VirtualList
      {...props}
      items={items}
      isLoading={isLoading}
      onEndReached={handleEndReached}
    />
  );
}

export default VirtualList;
