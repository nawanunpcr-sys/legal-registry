function safeValue(value) {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.join(', ')
  return String(value).replace(/\s+/g, ' ').trim()
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportToCsv(rows, columns, filename = 'export.csv') {
  const header = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',')
  const body = rows.map((row) =>
    columns
      .map((col) => `"${safeValue(col.value(row)).replace(/"/g, '""')}"`)
      .join(',')
  )
  const csv = `\uFEFF${[header, ...body].join('\n')}`
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;')
}

export function exportToExcel(rows, columns, filename = 'export.xls') {
  const tableRows = rows.map((row) => `
    <tr>
      ${columns.map((col) => `<td>${safeValue(col.value(row))}</td>`).join('')}
    </tr>
  `).join('')

  const table = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>${columns.map((col) => `<th>${col.label}</th>`).join('')}</tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </body>
    </html>
  `

  downloadBlob(table, filename, 'application/vnd.ms-excel;charset=utf-8;')
}
