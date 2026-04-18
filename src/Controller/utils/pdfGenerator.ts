import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'

interface PDFData {
  stats: {
    totalUsers: number
    totalEvents: number
    totalAnnouncements: number
    activeAttendees: number
    upcomingEvents: number
    pendingVerifications: number
    activeUsers: number
    totalAttendance: number
  }
  monthlyStats?: Array<{
    month: string
    events: number
    attendance: number
    announcements: number
  }> | null
  recentActivities?: Array<{
    title: string
    description: string
    timestamp: Date
    type: string
  }> | null
  upcomingEvents?: Array<{
    title: string
    date: Date
    location?: string
    attendees?: any[]
  }> | null
  pastEvents?: Array<{
    title: string
    date: Date
    location?: string
    attendees?: any[]
  }> | null
}

export const generateDashboardPDF = async (
  data: PDFData,
  options?: { isAssistantAdmin?: boolean }
): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      downloadHTMLReport(data, options)
      return 'web-download-started'
    }

    const htmlContent = generateFullHTMLReport(data, options)

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    })

    console.log('PDF generated at:', uri)
    return uri
  } catch (error) {
    let message = 'Failed to generate PDF.'
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }
    if (message.includes('print')) {
      message = 'Print service unavailable. Please try again.'
    }
    throw new Error(`PDF generation failed: ${message}`)
  }
}

export const sharePDF = async (fileUri: string) => {
  if (Platform.OS === 'web') return
  if (!fileUri || fileUri === 'web-download-started') return

  try {
    const isAvailable = await Sharing.isAvailableAsync()
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device.')
    }
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Dashboard Report',
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not share PDF.'
    throw new Error(`Sharing failed: ${message}`)
  }
}

const downloadHTMLReport = (
  data: PDFData,
  options?: { isAssistantAdmin?: boolean }
) => {
  try {
    const content = generateFullHTMLReport(data, options)
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Web download error:', error)
    throw new Error('Could not generate report on web. Please try again.')
  }
}

const safeValue = (value: any, defaultValue: number = 0): number => {
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

const safeArray = <T>(arr: T[] | null | undefined): T[] => {
  return Array.isArray(arr) ? arr : []
}

const formatDateSafe = (date: Date | null | undefined): string => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'Invalid date'
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Invalid date'
  }
}

const generateFullHTMLReport = (
  data: PDFData,
  options?: { isAssistantAdmin?: boolean }
): string => {
  const isAssistant = options?.isAssistantAdmin ?? false

  const stats = data.stats || {
    totalUsers: 0,
    totalEvents: 0,
    totalAnnouncements: 0,
    activeAttendees: 0,
    upcomingEvents: 0,
    pendingVerifications: 0,
    activeUsers: 0,
    totalAttendance: 0,
  }

  const activeUserRate =
    stats.totalUsers > 0
      ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)
      : '0.0'
  const avgAttendees =
    stats.totalEvents > 0
      ? (stats.totalAttendance / stats.totalEvents).toFixed(1)
      : '0.0'

  const monthlyStats = safeArray(data.monthlyStats)
  const upcomingEvents = safeArray(data.upcomingEvents)
  const pastEvents = safeArray(data.pastEvents)
  const recentActivities = safeArray(data.recentActivities)

  let monthlyBarsHtml = ''
  if (monthlyStats.length > 0) {
    const maxEvents = Math.max(
      ...monthlyStats.map((s) => safeValue(s.events)),
      1
    )
    const maxAttendance = Math.max(
      ...monthlyStats.map((s) => safeValue(s.attendance)),
      1
    )
    for (const stat of monthlyStats) {
      let eventHeight =
        maxEvents > 0 ? (safeValue(stat.events) / maxEvents) * 100 : 0
      let attendanceHeight =
        maxAttendance > 0
          ? (safeValue(stat.attendance) / maxAttendance) * 100
          : 0
      eventHeight = Math.max(eventHeight, 5)
      attendanceHeight = Math.max(attendanceHeight, 5)
      monthlyBarsHtml += `
        <div class="bar-group">
          <div class="bars">
            <div class="event-bar" style="height: ${eventHeight}%;"></div>
            <div class="attendance-bar" style="height: ${attendanceHeight}%;"></div>
          </div>
          <div class="bar-label">${stat.month || ''}</div>
          <div class="bar-values">E:${safeValue(stat.events)} | A:${safeValue(stat.attendance)}</div>
        </div>
      `
    }
  } else {
    monthlyBarsHtml = '<div class="empty-state">No monthly data available</div>'
  }

  let upcomingRowsHtml = ''
  if (upcomingEvents.length > 0) {
    for (const event of upcomingEvents) {
      upcomingRowsHtml += `
        <tr>
          <td><strong>${event.title || 'Untitled Event'}</strong></td>
          <td>${formatDateSafe(event.date)}</td>
          <td>${event.location || 'TBA'}</td>
        </tr>
      `
    }
  } else {
    upcomingRowsHtml =
      '<tr><td colspan="3" class="empty-state">No upcoming events scheduled</td></tr>'
  }

  let pastEventsRowsHtml = ''
  if (pastEvents.length > 0) {
    const lastFive = pastEvents.slice(0, 5)
    for (const event of lastFive) {
      pastEventsRowsHtml += `
      <tr>
        <td><strong>${event.title || 'Untitled Event'}</strong></td>
        <td>${formatDateSafe(event.date)}</td>
        <td>${event.location || 'TBA'}</td>
        <td><span class="badge">${safeValue(event.attendees?.length)}</span></td>
      </tr>
    `
    }
  } else {
    pastEventsRowsHtml =
      '<tr><td colspan="4" class="empty-state">No past events found</td></tr>'
  }

  let activitiesRowsHtml = ''
  if (recentActivities.length > 0) {
    for (const activity of recentActivities.slice(0, 10)) {
      activitiesRowsHtml += `
        <tr>
          <td><strong>${activity.title || 'Activity'}</strong></td>
          <td>${activity.description || '—'}</td>
          <td>${formatDateSafe(activity.timestamp)}</td>
        </tr>
      `
    }
  } else {
    activitiesRowsHtml =
      '<tr><td colspan="3" class="empty-state">No recent activities</td></tr>'
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TMC Connect - Dashboard Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', 'Roboto', sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.6;
      font-size: 13px;
    }
    .container {
      max-width: 100%;
      margin: 0;
      padding: 50px;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      color: white;
      padding: 50px 40px;
      border-radius: 12px;
      margin-bottom: 60px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(14, 165, 233, 0.15);
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
      border-radius: 50%;
    }
    .header-content { position: relative; z-index: 1; }
    .header h1 { font-size: 42px; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.5px; }
    .header .subtitle { font-size: 16px; font-weight: 500; opacity: 0.9; margin-bottom: 20px; }
    .header .meta { display: flex; justify-content: center; gap: 30px; font-size: 12px; opacity: 0.85; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; }
    .header .meta-item { display: flex; align-items: center; gap: 8px; }
    .section { margin-bottom: 60px; page-break-inside: avoid; }
    .section-title {
      font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 24px;
      display: flex; align-items: center; gap: 12px;
      border-bottom: 3px solid #0ea5e9; padding-bottom: 12px;
    }
    .section-title::before {
      content: ''; width: 4px; height: 24px;
      background: linear-gradient(180deg, #0ea5e9 0%, #06b6d4 100%);
      border-radius: 2px;
    }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 30px; }
    .stat-card {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      padding: 22px; border-radius: 10px; border: 2px solid #e2e8f0;
      text-align: center; transition: all 0.3s ease; box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }
    .stat-card:hover { border-color: #0ea5e9; box-shadow: 0 8px 16px rgba(14,165,233,0.12); transform: translateY(-2px); }
    .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 8px; }
    .stat-value { font-size: 34px; font-weight: 800; color: #0ea5e9; line-height: 1; margin-bottom: 4px; }
    .stat-subtitle { font-size: 11px; color: #64748b; font-weight: 500; }
    .chart-container {
      background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
      padding: 28px; border-radius: 10px; border: 2px solid #e0f2fe; margin: 20px 0;
    }
    .legend { display: flex; gap: 28px; margin-bottom: 24px; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600; }
    .legend-color { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
    .bar-chart { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; height: 180px; margin-top: 20px; }
    .bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; }
    .bars { display: flex; gap: 5px; align-items: flex-end; height: 120px; justify-content: center; width: 50px;  }
    .event-bar { flex: 1; max-width: 22px; min-width: 18px; background: linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%); border-radius: 4px 4px 0 0; min-height: 2px; }
    .attendance-bar { flex: 1; max-width: 22px; min-width: 18px; background: linear-gradient(180deg, #10b981 0%, #059669 100%); border-radius: 4px 4px 0 0; min-height: 2px; }
    .bar-label { font-size: 11px; font-weight: 700; color: #475569; margin-top: 4px; }
    .bar-values { font-size: 9px; color: #64748b; text-align: center; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    th { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 14px 16px; text-align: left; font-size: 12px; font-weight: 700; }
    td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569; background: white; }
    tr:nth-child(even) td { background: #f8fafc; }
    tr:hover td { background: #f1f5f9; }
    td strong { color: #0f172a; font-weight: 700; }
    .badge { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-block; min-width: 40px; text-align: center; }
    .summary-stats {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
      background: linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 50%, #fef3c7 100%);
      padding: 30px; border-radius: 10px; margin-top: 20px; border: 2px solid #e0f2fe;
    }
    .summary-item { text-align: center; padding: 10px; }
    .summary-value { font-size: 32px; font-weight: 800; color: #0ea5e9; line-height: 1; margin-bottom: 6px; }
    .summary-label { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .empty-state { text-align: center; padding: 35px 20px; color: #94a3b8; font-style: italic; background: #f8fafc; border-radius: 8px; border: 2px dashed #cbd5e1; }
    .footer { margin-top: 60px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 2px solid #e2e8f0; padding-top: 25px; }
    .footer-content { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 10px; }
    .footer-item { display: flex; align-items: center; gap: 4px; }
    @media print {
      .container { padding: 20px; }
      .section, .chart-container, table { page-break-inside: avoid; }
    }
    @media (max-width: 768px) {
      .container { padding: 30px; }
      .header { padding: 35px 25px; }
      .header h1 { font-size: 32px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .summary-stats { grid-template-columns: 1fr; }
      .bar-chart { height: 150px; }
      .bars { height: 100px; }
    }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="header-content">
      <h1> TMC Connect </h1>
      <div class="subtitle">Administrative Dashboard Report</div>
      <div class="meta">
        <div class="meta-item"> ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div class="meta-item"> ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>
  </div>

 <div class="section">
    <h2 class="section-title">Key Statistics</h2>
    <div class="stats-grid">
      ${
        !isAssistant
          ? `
        <div class="stat-card">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">${safeValue(stats.totalUsers)}</div>
          <div class="stat-subtitle">${safeValue(stats.activeUsers)} active</div>
        </div>
      `
          : ''
      }
      <div class="stat-card">
        <div class="stat-label">Total Events</div>
        <div class="stat-value">${safeValue(stats.totalEvents)}</div>
        <div class="stat-subtitle">${safeValue(stats.upcomingEvents)} upcoming</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Announcements</div>
        <div class="stat-value">${safeValue(stats.totalAnnouncements)}</div>
        <div class="stat-subtitle">Active</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Attendance</div>
        <div class="stat-value">${safeValue(stats.totalAttendance)}</div>
        <div class="stat-subtitle">${safeValue(stats.pendingVerifications)} pending</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Monthly Analytics</h2>
    <div class="chart-container">
      <div class="legend">
        <div class="legend-item"><div class="legend-color" style="background:#0ea5e9"></div><span>Events</span></div>
        <div class="legend-item"><div class="legend-color" style="background:#10b981"></div><span>Attendance</span></div>
      </div>
      <div class="bar-chart">${monthlyBarsHtml}</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Upcoming Events</h2>
    <table><thead>
  <tr>
    <th style="width:35%">Event Name</th>
    <th style="width:25%">Date & Time</th>
    <th style="width:25%">Location</th>
  </tr>
</thead><tbody>${upcomingRowsHtml}</tbody></table>
  </div>

  <div class="section">
  <h2 class="section-title">Past Events (Last 5)</h2>
  <table>
    <thead>
      <tr>
        <th style="width:35%">Event Name</th>
        <th style="width:25%">Date & Time</th>
        <th style="width:25%">Location</th>
        <th style="width:15%">Attendees</th>
      </tr>
    </thead>
    <tbody>${pastEventsRowsHtml}</tbody>
  </table> 
</div>

  <div class="section">
    <h2 class="section-title">Recent Activities</h2>
    <table><thead><tr><th style="width:25%">Activity Type</th><th style="width:45%">Description</th><th style="width:30%">Date & Time</th></tr></thead><tbody>${activitiesRowsHtml}</tbody></table>
  </div>

  <div class="section">
    <h2 class="section-title">Summary & Performance</h2>
    <div class="summary-stats">
      ${
        !isAssistant
          ? `
        <div class="summary-item">
          <div class="summary-value">${activeUserRate}%</div>
          <div class="summary-label">Active User Rate</div>
        </div>
      `
          : ''
      }
      <div class="summary-item">
        <div class="summary-value">${avgAttendees}</div>
        <div class="summary-label">Avg Attendees/Event</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${safeValue(stats.pendingVerifications)}</div>
        <div class="summary-label">Pending Verifications</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-content"><div class="footer-item">© ${new Date().getFullYear()} TMC Connect</div><div class="footer-item">•</div><div class="footer-item">Confidential Report</div></div>
    <div>Generated by TMC Campus Hub Administrative System</div>
  </div>
</div>
</body>
</html>`
}
