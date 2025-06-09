import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * ConsoleTerminalDisplay - A simple scrollable terminal/console output component.
 * @param {string[]} lines - Array of strings to display as console output.
 * @param {string} className - Optional extra class names.
 */
const ConsoleTerminalDisplay = ({ lines = [], className = '' }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines]);

  return (
    <div
      className={`bg-black text-green-400 font-mono rounded p-3 h-64 overflow-y-auto shadow-inner border border-gray-700 ${className}`}
      style={{ minWidth: 300 }}
    >
      {lines.length === 0 ? (
        <div className="text-gray-500">No output.</div>
      ) : (
        lines.map((line, idx) => (
          <div key={idx} className="whitespace-pre-wrap">{line}</div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};

ConsoleTerminalDisplay.propTypes = {
  lines: PropTypes.arrayOf(PropTypes.string),
  className: PropTypes.string,
};

export default ConsoleTerminalDisplay;
