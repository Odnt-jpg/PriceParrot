import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsoleTerminalDisplay from '../../components/consoleterminaldisplay.jsx';
import Navbar from '../../components/navbar/navbar.jsx';
import Footer from '../../components/Footer';

const AdminPage = () => {
  const [sql, setSql] = useState('');
  const [sqlResult, setSqlResult] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15; // You can adjust this as needed
  const navigate = useNavigate();

  // Only allow admin users
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.isAdmin) {
      navigate('/');
    }
  }, [navigate]);

  // Fetch table list on mount
  useEffect(() => {
    fetch('/api/tables')
      .then(res => res.json())
      .then(setTables)
      .catch(() => setTables([]));
  }, []);

  // Fetch table data when selectedTable changes
  useEffect(() => {
    if (selectedTable) {
      fetch(`/api/table/${selectedTable}`)
        .then(res => res.json())
        .then(setTableData)
        .catch(() => setTableData([]));
    } else {
      setTableData([]);
    }
  }, [selectedTable]);

  // Reset to first page when tableData changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tableData]);

  // Handlers for SQL view/edit
  const handleSqlChange = (e) => setSql(e.target.value);
  const handleSqlSubmit = async () => {
    setSqlResult('');
    try {
      const response = await fetch('/api/table/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      });
      const data = await response.json();
      if (response.ok) {
        setSqlResult(typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data));
      } else {
        setSqlResult('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setSqlResult('Error: ' + err.message);
    }
  };

  // Handler for running webscraper
  const handleRunScraper = async () => {
    setScrapeStatus('Running...');
    try {
      const response = await fetch('/api/run-scraper', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setScrapeStatus('Scraper finished: ' + (data.message || 'Success'));
      } else {
        setScrapeStatus('Error: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      setScrapeStatus('Error: ' + err.message);
    }
  };

  // SSE: Live console log
  useEffect(() => {
    let eventSource;
    if (window.EventSource) {
      eventSource = new window.EventSource('/api/console-log-stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setConsoleOutput(prev => prev + data);
        } catch {
          setConsoleOutput(prev => prev + event.data);
        }
      };
      eventSource.onerror = (err) => {
        setConsoleOutput(prev => prev + '\n[SSE connection error]');
        eventSource.close();
      };
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Pagination logic
  const totalRows = tableData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginatedData = tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <>
      <Navbar />
      <div className="admin-page bg-gray-50 min-h-screen py-8 px-4 md:px-12">
        <h1 className="text-3xl font-bold text-center mb-8 text-green-700 tracking-tight">Admin Panel</h1>
        <section className="admin-section bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Webscraper Control</h2>
          <button
            onClick={handleRunScraper}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors duration-200"
          >
            Run Main Webscraper
          </button>
          <div className="scrape-status mt-3 text-sm text-gray-700 font-mono bg-gray-100 rounded px-3 py-2">{scrapeStatus}</div>
        </section>
        <section className="admin-section bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Console Output</h2>
          <div className=" rounded-lg  text-green-400 font-mono text-m w-auto h-95">
            <ConsoleTerminalDisplay lines={consoleOutput ? consoleOutput.split('\n') : []} />
          </div>
        </section>
        <section className="admin-section bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">MySQL Table Viewer</h2>
          <select
            value={selectedTable}
            onChange={e => setSelectedTable(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">Select Table</option>
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {tableData.length > 0 && (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(tableData[0]).map(col => (
                      <th key={col} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, i) => (
                    <tr key={i} className="even:bg-gray-50 hover:bg-green-50">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-4 py-2 border-b text-sm text-gray-800">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex justify-center items-center mt-4 space-x-2">
                <button
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
                  <button
                    key={page}
                    className={`px-3 py-1 rounded ${page === currentPage ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
        <Footer />
      </div>
    </>
  );
};

export default AdminPage;
