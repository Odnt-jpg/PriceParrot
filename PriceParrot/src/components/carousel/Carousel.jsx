import React, { useState } from 'react';

const Carousel = ({ items, renderItem, itemsPerView = 2 }) => {
    const [startIdx, setStartIdx] = useState(0);

    const canGoBack = startIdx > 0;
    const canGoForward = startIdx + itemsPerView < items.length;

    const handlePrev = () => {
        if (canGoBack) setStartIdx(startIdx - itemsPerView);
    };

    const handleNext = () => {
        if (canGoForward) setStartIdx(startIdx + itemsPerView);
    };

    return (
        <div className="w-full flex items-center">
            <button
                onClick={handlePrev}
                disabled={!canGoBack}
                className="p-2 text-2xl bg-gray-200 rounded disabled:opacity-30 mr-2"
            >
                &#8592;
            </button>
            <div
                className="flex flex-row overflow-x-auto space-x-4 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}
            >
                {items.slice(startIdx, startIdx + itemsPerView).map((item, idx) => (
                    <div
                        key={idx}
                        className="snap-start w-60 flex-shrink-0"
                    >
                        {renderItem(item, idx)}
                    </div>
                ))}
            </div>
            <button
                onClick={handleNext}
                disabled={!canGoForward}
                className="p-2 text-2xl bg-gray-200 rounded disabled:opacity-30 ml-2"
            >
                &#8594;
            </button>
        </div>
    );
};

export default Carousel;