// Test the improved import logic
console.log('🔍 Testing Improved Import Logic...')

// Simulate the improved getValue function
function getValue(headerName: string, headers: string[], row: string[]) {
  // More flexible column matching - try multiple variations
  const variations = [
    headerName,
    headerName.toLowerCase(),
    headerName.toUpperCase(),
    headerName.replace(/[^a-z0-9]/g, ''),
    headerName.replace(/[^a-z0-9]/g, '').toLowerCase(),
    headerName.replace(/[^a-z0-9]/g, '').toUpperCase()
  ]
  
  for (const variation of variations) {
    const index = headers.findIndex(h => {
      // Try exact match first
      if (h.toLowerCase() === variation.toLowerCase()) {
        return true
      }
      // Try with spaces removed
      const cleanHeader = h.replace(/[^a-z0-9]/g, '').toLowerCase()
      const cleanVariation = variation.replace(/[^a-z0-9]/g, '').toLowerCase()
      if (cleanHeader === cleanVariation) {
        return true
      }
      // Try with underscores/spaces normalized
      const normalizedHeader = h.replace(/[\s_]/g, ' ').toLowerCase().trim()
      const normalizedVariation = variation.replace(/[\s_]/g, ' ').toLowerCase().trim()
      if (normalizedHeader === normalizedVariation) {
        return true
      }
      return false
    })
    if (index >= 0) {
      return (row[index] || '').toString().trim()
    }
  }
  return ''
}

// Test with various header formats
const testCases = [
  {
    name: 'Standard Headers',
    headers: ['Invoice Number', 'Zip Code', 'Customer Name', 'Date'],
    row: ['INV-001', '12345', 'John Doe', '2024-01-01']
  },
  {
    name: 'Lowercase Headers',
    headers: ['invoice number', 'zip code', 'customer name', 'date'],
    row: ['INV-002', '54321', 'Jane Smith', '2024-01-02']
  },
  {
    name: 'Mixed Case Headers',
    headers: ['INVOICE_NUMBER', 'ZIP_CODE', 'CUSTOMER_NAME', 'DATE_RECORDED'],
    row: ['INV-003', '67890', 'Bob Johnson', '2024-01-03']
  },
  {
    name: 'Abbreviated Headers',
    headers: ['Inv #', 'Zip', 'Customer', 'Job Date'],
    row: ['INV-004', '11111', 'Alice Brown', '2024-01-04']
  }
]

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test Case ${index + 1}: ${testCase.name}`)
  console.log('Headers:', testCase.headers)
  console.log('Row:', testCase.row)
  
  const invoice = getValue('invoice', testCase.headers, testCase.row) || 
                 getValue('invoicenumber', testCase.headers, testCase.row) || 
                 getValue('invoice_number', testCase.headers, testCase.row) || 
                 getValue('invoicenmbr', testCase.headers, testCase.row) || 
                 getValue('inv', testCase.headers, testCase.row) || 
                 getValue('invnum', testCase.headers, testCase.row)
  
  const zip = getValue('zipcode', testCase.headers, testCase.row) || 
              getValue('zip_code', testCase.headers, testCase.row) || 
              getValue('zipcodeforjob', testCase.headers, testCase.row) || 
              getValue('zip', testCase.headers, testCase.row) || 
              getValue('postal', testCase.headers, testCase.row) || 
              getValue('postalcode', testCase.headers, testCase.row)
  
  const customer = getValue('customer', testCase.headers, testCase.row) || 
                   getValue('customername', testCase.headers, testCase.row) || 
                   getValue('customer_name', testCase.headers, testCase.row)
  
  const date = getValue('date', testCase.headers, testCase.row) || 
               getValue('daterecorded', testCase.headers, testCase.row) || 
               getValue('date_recorded', testCase.headers, testCase.row) || 
               getValue('jobdate', testCase.headers, testCase.row) || 
               getValue('servicedate', testCase.headers, testCase.row) || 
               getValue('completedate', testCase.headers, testCase.row)
  
  console.log('Results:')
  console.log(`  Invoice: "${invoice}"`)
  console.log(`  Zip: "${zip}"`)
  console.log(`  Customer: "${customer}"`)
  console.log(`  Date: "${date}"`)
})

console.log('\n✅ Import logic test completed!') 