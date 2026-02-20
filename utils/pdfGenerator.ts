// utils/pdfGenerator.ts
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Use type assertion to handle TypeScript errors
const fs: any = FileSystem;

interface PDFData {
  stats: {
    totalUsers: number;
    totalEvents: number;
    totalAnnouncements: number;
    activeAttendees: number;
    upcomingEvents: number;
    pendingVerifications: number;
    activeUsers: number;
    totalAttendance: number;
  };
  monthlyStats: Array<{
    month: string;
    events: number;
    attendance: number;
    announcements: number;
  }>;
  recentActivities: Array<{
    title: string;
    description: string;
    timestamp: Date;
    type: string;
  }>;
  upcomingEvents: Array<{
    title: string;
    date: Date;
    location?: string;
    attendees?: any[];
  }>;
}

export const generateDashboardPDF = async (data: PDFData): Promise<string> => {
  try {
    // For web platform, use browser download
    if (Platform.OS === 'web') {
      return generateAndDownloadHTML(data);
    }

    // For native platforms
    const documentDir = fs.documentDirectory;
    if (!documentDir) {
      const cacheDir = fs.cacheDirectory;
      if (!cacheDir) {
        throw new Error('No accessible directory found');
      }
      
      const fileName = `dashboard-report-${new Date().toISOString().split('T')[0]}.html`;
      const fileUri = cacheDir + fileName;
      
      const content = generateHTMLContent(data);
      await fs.writeAsStringAsync(fileUri, content, {
        encoding: 'utf8',
      });
      
      return fileUri;
    }

    const fileName = `dashboard-report-${new Date().toISOString().split('T')[0]}.html`;
    const fileUri = documentDir + fileName;

    // Create HTML content
    const content = generateHTMLContent(data);

    // Write the HTML content to a file - use string 'utf8' instead of EncodingType
    await fs.writeAsStringAsync(fileUri, content, {
      encoding: 'utf8',
    });

    return fileUri;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

// Separate function for web download
const generateAndDownloadHTML = (data: PDFData): string => {
  const content = generateHTMLContent(data);
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return url;
};

const generateHTMLContent = (data: PDFData): string => {
  const activeUserRate = data.stats.totalUsers > 0 
    ? ((data.stats.activeUsers / data.stats.totalUsers) * 100).toFixed(1) 
    : '0.0';
  
  const avgAttendees = data.stats.totalEvents > 0 
    ? Math.round(data.stats.totalAttendance / data.stats.totalEvents) 
    : 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard Report - TMC Campus Hub</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 30px;
          color: #1e293b;
          background: #f8fafc;
          line-height: 1.5;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px solid #0ea5e9;
        }
        .header h1 {
          color: #0f172a;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .header .subtitle {
          color: #64748b;
          font-size: 16px;
        }
        .header .date {
          color: #0ea5e9;
          font-weight: 600;
          font-size: 18px;
          margin-top: 10px;
        }
        .section {
          margin-bottom: 40px;
        }
        .section-title {
          color: #0f172a;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 20px;
          padding-left: 15px;
          border-left: 5px solid #0ea5e9;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .stat-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          padding: 25px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .stat-label {
          font-size: 14px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 5px;
        }
        .stat-subtitle {
          font-size: 13px;
          color: #0ea5e9;
          font-weight: 500;
        }
        .chart-container {
          background: #ffffff;
          padding: 25px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          margin: 20px 0;
        }
        .legend {
          display: flex;
          gap: 30px;
          margin-bottom: 25px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }
        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          gap: 15px;
          height: 250px;
          margin-top: 20px;
        }
        .bar-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .bars {
          display: flex;
          gap: 8px;
          align-items: flex-end;
          height: 180px;
        }
        .event-bar {
          width: 40px;
          background: linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%);
          border-radius: 8px 8px 0 0;
          min-height: 4px;
        }
        .attendance-bar {
          width: 40px;
          background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          border-radius: 8px 8px 0 0;
          min-height: 4px;
        }
        .bar-label {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }
        .bar-values {
          font-size: 11px;
          color: #64748b;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        th {
          background: #0ea5e9;
          color: white;
          padding: 15px;
          text-align: left;
          font-size: 14px;
          font-weight: 600;
        }
        td {
          padding: 12px 15px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
          color: #475569;
          background: white;
        }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: #f8fafc; }
        .badge {
          background: #0ea5e9;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          display: inline-block;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
          border-top: 1px solid #e2e8f0;
          padding-top: 25px;
        }
        .summary-stats {
          display: flex;
          gap: 20px;
          justify-content: space-around;
          background: #f8fafc;
          padding: 25px;
          border-radius: 16px;
          margin-top: 20px;
        }
        .summary-item { text-align: center; }
        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: #0ea5e9;
        }
        .summary-label {
          font-size: 12px;
          color: #64748b;
          margin-top: 5px;
        }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TMC Campus Hub</h1>
          <div class="subtitle">Admin Dashboard Report</div>
          <div class="date">Generated on ${new Date().toLocaleString()}</div>
        </div>

        <div class="section">
          <h2 class="section-title">📊 Key Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Users</div>
              <div class="stat-value">${data.stats.totalUsers}</div>
              <div class="stat-subtitle">${data.stats.activeUsers} active</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Events</div>
              <div class="stat-value">${data.stats.totalEvents}</div>
              <div class="stat-subtitle">${data.stats.upcomingEvents} upcoming</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Announcements</div>
              <div class="stat-value">${data.stats.totalAnnouncements}</div>
              <div class="stat-subtitle">Last 30 days</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Attendance</div>
              <div class="stat-value">${data.stats.totalAttendance}</div>
              <div class="stat-subtitle">${data.stats.pendingVerifications} pending</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">📈 Monthly Analytics</h2>
          <div class="chart-container">
            <div class="legend">
              <div class="legend-item"><div class="legend-color" style="background: #0ea5e9;"></div><span>Events</span></div>
              <div class="legend-item"><div class="legend-color" style="background: #10b981;"></div><span>Attendance</span></div>
            </div>
            <div class="bar-chart">
              ${data.monthlyStats.map(stat => `
                <div class="bar-group">
                  <div class="bars">
                    <div class="event-bar" style="height: ${Math.max(stat.events * 12, 8)}px"></div>
                    <div class="attendance-bar" style="height: ${Math.max(stat.attendance * 1.5, 8)}px"></div>
                  </div>
                  <div class="bar-label">${stat.month}</div>
                  <div class="bar-values">E:${stat.events} | A:${stat.attendance}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">📅 Upcoming Events</h2>
          <table>
            <thead><tr><th>Event</th><th>Date</th><th>Location</th><th>Attendees</th></tr></thead>
            <tbody>
              ${data.upcomingEvents.length > 0 ? 
                data.upcomingEvents.map(event => `
                  <tr>
                    <td><strong>${event.title}</strong></td>
                    <td>${event.date.toLocaleString()}</td>
                    <td>${event.location || 'TBA'}</td>
                    <td><span class="badge">${event.attendees?.length || 0}</span></td>
                  </tr>
                `).join('') 
                : '<tr><td colspan="4" style="text-align: center; padding: 30px;">No upcoming events</td></tr>'
              }
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2 class="section-title">🔄 Recent Activities</h2>
          <table>
            <thead><tr><th>Activity</th><th>Description</th><th>Time</th></tr></thead>
            <tbody>
              ${data.recentActivities.slice(0, 5).map(activity => `
                <tr>
                  <td><strong>${activity.title}</strong></td>
                  <td>${activity.description}</td>
                  <td>${activity.timestamp.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2 class="section-title">📋 Summary</h2>
          <div class="summary-stats">
            <div class="summary-item">
              <div class="summary-value">${activeUserRate}%</div>
              <div class="summary-label">Active Rate</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${avgAttendees}</div>
              <div class="summary-label">Avg/Event</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${data.stats.pendingVerifications}</div>
              <div class="summary-label">Pending</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} TMC Campus Hub</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sharePDF = async (fileUri: string) => {
  try {
    if (Platform.OS === 'web') return;
    
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/html',
        dialogTitle: 'Share Dashboard Report',
      });
    }
  } catch (error) {
    console.error('Error sharing report:', error);
  }
};