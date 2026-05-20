import React from 'react';

const SkeletonCard = ({ className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden ${className}`}>
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
);

const DashboardSkeleton = () => {
  return (
    <div className="w-full animate-fade-in">
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-40 animate-pulse">
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
           <SkeletonCard className="h-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonCard className="h-80" />
        </div>
        <div className="lg:col-span-1">
          <SkeletonCard className="h-80" />
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
