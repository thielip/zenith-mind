"use client";

import { GripVertical } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export function reorderArray<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return items;
  const next = [...items];
  const [removed] = next.splice(fromIndex, 1);
  if (removed === undefined) return items;
  next.splice(toIndex, 0, removed);
  return next;
}

interface SortableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  getItemId: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  itemClassName?: string;
}

export default function SortableList<T>({
  items,
  onReorder,
  getItemId,
  renderItem,
  className,
  itemClassName,
}: SortableListProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function finishDrag() {
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDrop(toIndex: number) {
    if (dragIndex === null || dragIndex === toIndex) {
      finishDrag();
      return;
    }
    onReorder(reorderArray(items, dragIndex, toIndex));
    finishDrag();
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <div
          key={getItemId(item, index)}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragIndex !== null) setOverIndex(index);
          }}
          onDragLeave={() => {
            if (overIndex === index) setOverIndex(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(index);
          }}
          className={cn(
            itemClassName,
            dragIndex === index && "opacity-60",
            overIndex === index &&
              dragIndex !== null &&
              dragIndex !== index &&
              "ring-2 ring-blue-300 ring-offset-1"
          )}
        >
          <div className="flex gap-2">
            <button
              type="button"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragEnd={finishDrag}
              className="mt-1 flex h-9 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 active:cursor-grabbing"
              aria-label="拖曳以調整順序"
              title="拖曳排序"
            >
              <GripVertical size={16} aria-hidden />
            </button>
            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
