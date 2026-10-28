import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CallHistory.scss';

interface Call {
  sid: string;
  from: string;
  to: string;
  direction: string;
  duration: number;
  status: string;
  startTime: string;
  endTime: string;
  dateCreated: string;
}

interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalCalls: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPageUri?: string;
  previousPageUri?: string;
}

const CallHistory: React.FC = () => {
  const navigate = useNavigate();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('startTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    pageSize: 20,
    totalCalls: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    const clientId = localStorage.getItem('client_id');
    if (!clientId) {
      navigate('/login');
      return;
    }
    fetchCallHistory();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('client_id');
    navigate('/login');
  };

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const clientId = localStorage.getItem('client_id');
      if (!clientId) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:8080/api/users/call-history?clientId=${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('client_id');
          navigate('/login');
          return;
        }
        throw new Error(`Failed to fetch calls: ${response.statusText}`);
      }

      const data = await response.json();
      
      const transformedCalls: Call[] = data.calls.map((call: any) => ({
        sid: call.sid,
        from: call.from,
        to: call.to,
        direction: call.direction,
        duration: parseInt(call.duration) || 0,
        status: call.status,
        startTime: call.startTime,
        endTime: call.endTime,
        dateCreated: call.dateCreated,
      }));

      setCalls(transformedCalls);
      
      // Update total calls count
      setPagination(prev => ({
        ...prev,
        totalCalls: data.total || transformedCalls.length,
        hasNextPage: false,
        hasPreviousPage: false,
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching call history:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    try {
      // Prepare data for Excel export
      const excelData = sortedCalls.map((call, index) => ({
        'No.': index + 1, // Simplified numbering since we have all records
        'Caller': formatPhoneNumber(call.from),
        'Recipient': call.to.substring(4, 16),
        'Date': formatDate(call.startTime || call.dateCreated),
        'Time': formatTime(call.startTime || call.dateCreated),
        'Duration': formatDuration(call.duration),
        'Duration (Seconds)': call.duration,
        'Status': call.status,
        'Call ID': call.sid,
        'Start Time': call.startTime,
        'End Time': call.endTime,
        'Created': call.dateCreated
      }));

      // Rest of the downloadExcel function remains the same
      const headers = Object.keys(excelData[0] || {});
      const csvContent = [
        headers.join(','),
        ...excelData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            const stringValue = String(value || '');
            return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `call-history-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading Excel file:', err);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCalls = [...calls].sort((a, b) => {
    let aValue: any = a[sortField as keyof Call];
    let bValue: any = b[sortField as keyof Call];

    if (sortField === 'startTime' || sortField === 'dateCreated') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return 'Unknown';
    const cleaned = phoneNumber.replace(/^\+1/, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneNumber;
  };

  const getSortIcon = (field: string): string => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getCurrentRange = () => {
    if (pagination.totalCalls === 0) return '0';
    const start = ((pagination.currentPage - 1) * pagination.pageSize) + 1;
    const end = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCalls);
    return `${start}-${end}`;
  };

  const getTotalPages = () => {
    if (pagination.totalCalls === 0) return 1;
    return Math.ceil(pagination.totalCalls / pagination.pageSize);
  };

  if (loading) {
    return (
      <div className="call-history">
        <div className="call-history__header">
          <div className="header-content">
            <h1>Call History</h1>
            <p>Loading incoming call records...</p>
          </div>
        </div>
        <div className="call-history__loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="call-history">
        <div className="call-history__header">
          <div className="header-content">
            <h1>Call History</h1>
            <p>Unable to load call records</p>
          </div>
        </div>
        <div className="call-history__error">
          <div className="error-content">
            <div className="error-text">
              <h3>Connection Error</h3>
              <p>{error}</p>
            </div>
            <button className="btn btn--primary" onClick={() => fetchCallHistory()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="call-history">
      <div className="call-history__header">
        <div className="header-content">
          <h1>Call History</h1>
          <p>
            {pagination.totalCalls > 0 
              ? `${getCurrentRange()} of ${pagination.totalCalls} calls`
              : `${calls.length} incoming calls`
            }
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn--download"
            onClick={downloadExcel}
            disabled={loading || calls.length === 0}
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7,10 12,15 17,10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Excel
          </button>
          <button 
            className="btn btn--refresh"
            onClick={() => fetchCallHistory()}
            disabled={loading}
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4a9 9 0 0 1-14.85 4.36L13 14"/>
            </svg>
            Refresh
          </button>
          <button 
            className="btn btn--logout"
            onClick={handleLogout}
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      {calls.length === 0 ? (
        <div className="call-history__empty">
          <div className="empty-content">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <h3>No Call Records</h3>
            <p>No incoming calls have been recorded.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="call-history__table-container">
            <table className="call-table">
              <thead>
                <tr>
                  <th 
                    className="sortable" 
                    onClick={() => handleSort('from')}
                  >
                    Caller {getSortIcon('from') && <span className="sort-icon">{getSortIcon('from')}</span>}
                  </th>
                  <th 
                    className="sortable" 
                    onClick={() => handleSort('to')}
                  >
                    Recipient {getSortIcon('to') && <span className="sort-icon">{getSortIcon('to')}</span>}
                  </th>
                  <th 
                    className="sortable" 
                    onClick={() => handleSort('startTime')}
                  >
                    Date {getSortIcon('startTime') && <span className="sort-icon">{getSortIcon('startTime')}</span>}
                  </th>
                  <th 
                    className="sortable" 
                    onClick={() => handleSort('startTime')}
                  >
                    Time {getSortIcon('startTime') && <span className="sort-icon">{getSortIcon('startTime')}</span>}
                  </th>
                  <th 
                    className="sortable" 
                    onClick={() => handleSort('duration')}
                  >
                    Duration {getSortIcon('duration') && <span className="sort-icon">{getSortIcon('duration')}</span>}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCalls.map((call, index) => (
                  <tr key={call.sid} className="call-row">
                    <td className="caller-cell">
                      <div className="phone-info">
                        <span className="phone-number">{formatPhoneNumber(call.from)}</span>
                      </div>
                    </td>
                    <td className="recipient-cell">
                      <div className="phone-info">
                        <span className="phone-number">{call.to.substring(4, 16)}</span>
                      </div>
                    </td>
                    <td className="date-cell">
                      <span className="date-text">{formatDate(call.startTime || call.dateCreated)}</span>
                    </td>
                    <td className="time-cell">
                      <span className="time-text">{formatTime(call.startTime || call.dateCreated)}</span>
                    </td>
                    <td className="duration-cell">
                      <span className="duration-badge">{formatDuration(call.duration)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="call-history__pagination">
            <div className="pagination-info">
              <span>Total Records: {pagination.totalCalls}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CallHistory; 