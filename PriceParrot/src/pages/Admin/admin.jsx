import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin.css';
import ConsoleTerminalDisplay from '../../components/consoleterminaldisplay.jsx';
import Navbar from '../../components/navbar/navbar.jsx';

const AdminPage = () => {
  const [sql, setSql] = useState('');
  const [sqlResult, setSqlResult] = useState('');
  const [consoleOutput, setConsoleOutput] = useState('');
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableData, setTableData] = useState([]);
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

  return (
    <>
    <Navbar/>
    <div className="admin-page">
      
      <h1>Admin Panel</h1>
      <section className="admin-section">
        <h2>Webscraper Control</h2>
        <button onClick={handleRunScraper}>Run Main Webscraper</button>
        <div className="scrape-status">{scrapeStatus}</div>
      </section>
      <section className="admin-section">
        <h2>Console Output</h2>
        <ConsoleTerminalDisplay lines={consoleOutput ? consoleOutput.split('\n') : []} />
      </section>
      <section className="admin-section">
        <h2>MySQL Table Viewer</h2>
        <select value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
          <option value="">Select Table</option>
          {tables.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {tableData.length > 0 && (
          <table border="1" cellPadding="8" style={{ marginTop: '20px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {Object.keys(tableData[0]).map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
    </>
  );
};

export default AdminPage;
