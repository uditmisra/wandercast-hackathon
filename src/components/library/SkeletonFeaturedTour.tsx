import React from 'react';

export function SkeletonFeaturedTour() {
  return (
    <div className="flex-shrink-0 w-64 rounded-2xl overflow-hidden border border-black/10">
      {/* Gradient area */}
      <div className="h-20 skeleton" />
      <div className="p-4">
        <div className="skeleton h-4 w-full rounded-md mb-2" />
        <div className="skeleton h-4 w-2/3 rounded-md mb-3" />
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <div className="skeleton h-4 w-16 rounded-md" />
            <div className="skeleton h-4 w-14 rounded-md" />
          </div>
          <div className="skeleton w-8 h-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}
