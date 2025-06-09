import React, { useState } from 'react';

const Carousel = ({ items, renderItem, itemsPerView = 2 }) => {
    const uniqueItems = React.useMemo(() => {
        const seen = new Set();
        return items.filter(item => {
            const key = item.id || item._id || item.name;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [items]);

    const [startIdx, setStartIdx] = useState(0);

    const canGoBack = startIdx > 0;
    const canGoForward = startIdx + itemsPerView < uniqueItems.length;

    const handlePrev = () => {
        if (canGoBack) setStartIdx(Math.max(0, startIdx - itemsPerView));
    };

    const handleNext = () => {
        if (canGoForward) setStartIdx(startIdx + itemsPerView);
    };

    return (
        <div className="w-full flex items-center justify-center">
            <button
                onClick={handlePrev}
                disabled={!canGoBack}
                className="p-2 text-2xl bg-rose-500 rounded disabled:opacity-30 mr-2 hover:bg-rose-600 transition-colors"
            >
                &#8592;
            </button>
            
            <div className="flex-1 overflow-hidden">
                <div className="flex justify-center gap-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {uniqueItems.slice(startIdx, startIdx + itemsPerView).map((item, idx) => (
                        <div
                            key={item.id || item._id || idx}
                            className="flex-shrink-0"
                            style={{ width: `calc(${100/itemsPerView}% - 1rem)` }}
                        >
                            {renderItem(item, idx)}
                        </div>
                    ))}
                </div>
            </div>
            
            <button
                onClick={handleNext}
                disabled={!canGoForward}
                className="p-2 text-2xl bg-rose-500 rounded disabled:opacity-30 ml-2 hover:bg-rose-600 transition-colors"
            >
                &#8594;
            </button>
        </div>
    );
};

export default Carousel;