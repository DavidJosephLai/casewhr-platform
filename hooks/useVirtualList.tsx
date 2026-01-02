/**
 * 📜 虚拟滚动 Hook
 * 优化长列表渲染性能，只渲染可见区域的元素
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface UseVirtualListOptions {
  itemHeight: number | ((index: number) => number);
  overscan?: number;
  containerHeight?: number;
  scrollingDelay?: number;
}

interface VirtualListReturn<T> {
  virtualItems: Array<{
    index: number;
    data: T;
    offsetTop: number;
    height: number;
  }>;
  totalHeight: number;
  containerRef: React.RefObject<HTMLElement>;
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  isScrolling: boolean;
}

/**
 * 虚拟列表 Hook
 * 
 * @example
 * ```tsx
 * const { virtualItems, totalHeight, containerRef } = useVirtualList({
 *   items: largeArray,
 *   itemHeight: 50,
 *   overscan: 5,
 * });
 * 
 * return (
 *   <div ref={containerRef} style={{ height: '600px', overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       {virtualItems.map(({ index, data, offsetTop }) => (
 *         <div
 *           key={index}
 *           style={{
 *             position: 'absolute',
 *             top: offsetTop,
 *             width: '100%',
 *           }}
 *         >
 *           {data.name}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useVirtualList<T>(
  items: T[],
  options: UseVirtualListOptions
): VirtualListReturn<T> {
  const {
    itemHeight,
    overscan = 3,
    containerHeight: customHeight,
    scrollingDelay = 150,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(customHeight || 600);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollingTimeoutRef = useRef<NodeJS.Timeout>();

  // 计算单个项目高度
  const getItemHeight = useCallback((index: number): number => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
  }, [itemHeight]);

  // 计算总高度
  const totalHeight = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight;
    }
    
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i);
    }
    return height;
  }, [items.length, itemHeight, getItemHeight]);

  // 计算可见范围
  const { startIndex, endIndex, offsetMap } = useMemo(() => {
    let currentOffset = 0;
    const offsets: number[] = [];
    
    // 构建偏移量映射
    for (let i = 0; i < items.length; i++) {
      offsets.push(currentOffset);
      currentOffset += getItemHeight(i);
    }

    // 查找起始索引
    let start = 0;
    let end = items.length - 1;
    
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const offset = offsets[mid];
      
      if (offset < scrollTop) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }

    const startIdx = Math.max(0, start - overscan);
    
    // 查找结束索引
    const viewportEnd = scrollTop + containerHeight;
    let endIdx = startIdx;
    
    while (endIdx < items.length && offsets[endIdx] < viewportEnd) {
      endIdx++;
    }
    
    endIdx = Math.min(items.length - 1, endIdx + overscan);

    return {
      startIndex: startIdx,
      endIndex: endIdx,
      offsetMap: offsets,
    };
  }, [scrollTop, containerHeight, items.length, overscan, getItemHeight]);

  // 计算虚拟项目
  const virtualItems = useMemo(() => {
    const result = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      result.push({
        index: i,
        data: items[i],
        offsetTop: offsetMap[i],
        height: getItemHeight(i),
      });
    }
    
    return result;
  }, [startIndex, endIndex, items, offsetMap, getItemHeight]);

  // 滚动事件处理
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    setScrollTop(target.scrollTop);
    
    // 设置滚动状态
    setIsScrolling(true);
    
    // 清除之前的定时器
    if (scrollingTimeoutRef.current) {
      clearTimeout(scrollingTimeoutRef.current);
    }
    
    // 延迟后重置滚动状态
    scrollingTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, scrollingDelay);
  }, [scrollingDelay]);

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 设置初始高度
    if (!customHeight) {
      setContainerHeight(container.clientHeight);
    }

    // 监听尺寸变化
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (!customHeight) {
          setContainerHeight(entry.contentRect.height);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [customHeight]);

  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollingTimeoutRef.current) {
        clearTimeout(scrollingTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // 滚动到指定索引
  const scrollToIndex = useCallback((
    index: number,
    align: 'start' | 'center' | 'end' = 'start'
  ) => {
    const container = containerRef.current;
    if (!container || index < 0 || index >= items.length) return;

    const offset = offsetMap[index];
    const itemHt = getItemHeight(index);
    
    let scrollTo = offset;
    
    if (align === 'center') {
      scrollTo = offset - (containerHeight - itemHt) / 2;
    } else if (align === 'end') {
      scrollTo = offset - containerHeight + itemHt;
    }
    
    container.scrollTo({
      top: Math.max(0, scrollTo),
      behavior: 'smooth',
    });
  }, [items.length, offsetMap, getItemHeight, containerHeight]);

  return {
    virtualItems,
    totalHeight,
    containerRef,
    scrollToIndex,
    isScrolling,
  };
}

/**
 * 虚拟网格 Hook
 * 支持二维虚拟滚动
 */
interface UseVirtualGridOptions {
  rowHeight: number;
  columnCount: number;
  columnWidth: number | 'auto';
  overscan?: number;
  gap?: number;
}

export function useVirtualGrid<T>(
  items: T[],
  options: UseVirtualGridOptions
) {
  const {
    rowHeight,
    columnCount,
    columnWidth,
    overscan = 3,
    gap = 0,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [containerWidth, setContainerWidth] = useState(0);

  // 计算行数
  const rowCount = Math.ceil(items.length / columnCount);

  // 计算总高度
  const totalHeight = rowCount * rowHeight + (rowCount - 1) * gap;

  // 计算列宽
  const actualColumnWidth = useMemo(() => {
    if (columnWidth === 'auto') {
      return (containerWidth - (columnCount - 1) * gap) / columnCount;
    }
    return columnWidth;
  }, [columnWidth, containerWidth, columnCount, gap]);

  // 计算可见行范围
  const { startRow, endRow } = useMemo(() => {
    const start = Math.floor(scrollTop / (rowHeight + gap));
    const end = Math.ceil((scrollTop + containerHeight) / (rowHeight + gap));
    
    return {
      startRow: Math.max(0, start - overscan),
      endRow: Math.min(rowCount - 1, end + overscan),
    };
  }, [scrollTop, containerHeight, rowHeight, gap, rowCount, overscan]);

  // 计算虚拟项目
  const virtualItems = useMemo(() => {
    const result = [];
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < columnCount; col++) {
        const index = row * columnCount + col;
        
        if (index >= items.length) break;
        
        result.push({
          index,
          data: items[index],
          row,
          col,
          top: row * (rowHeight + gap),
          left: col * (actualColumnWidth + gap),
          width: actualColumnWidth,
          height: rowHeight,
        });
      }
    }
    
    return result;
  }, [startRow, endRow, columnCount, items, rowHeight, gap, actualColumnWidth]);

  // 滚动事件处理
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    setScrollTop(target.scrollTop);
  }, []);

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setContainerHeight(container.clientHeight);
    setContainerWidth(container.clientWidth);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 监听滚动事件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    virtualItems,
    totalHeight,
    containerRef,
    rowCount,
    columnCount,
  };
}

export default useVirtualList;
