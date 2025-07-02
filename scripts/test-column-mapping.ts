// Test script to debug column mapping issues
console.log('🔍 Testing Column Mapping Logic...')

// Simulate the column mapping logic from the import page
function testColumnMapping() {
  // Sample headers that might exist in the spreadsheet
  const sampleHeaders = [
    'Invoice Number',
    'Invoice #',
    'Invoice',
    'INVOICE NUMBER',
    'invoice_number',
    'invoicenumber',
    'invoicenmbr',
    'Zip Code',
    'ZIP CODE',
    'zip_code',
    'zipcode',
    'zipcodeforjob',
    'Customer Name',
    'customer_name',
    'customername',
    'Date',
    'date_recorded',
    'daterecorded'
  ]

  // Test the getValue function logic
  const getValue = (headerName: string, headers: string[]) => {
    const index = headers.findIndex(h => 
      h.replace(/[^a-z0-9]/g, '').toLowerCase() === headerName.replace(/[^a-z0-9]/g, '').toLowerCase()
    )
    return index >= 0 ? `Found at index ${index}` : 'NOT FOUND'
  }

  console.log('\n📋 Testing Invoice Number Mapping:')
  console.log('invoice:', getValue('invoice', sampleHeaders))
  console.log('invoicenumber:', getValue('invoicenumber', sampleHeaders))
  console.log('invoice_number:', getValue('invoice_number', sampleHeaders))
  console.log('invoicenmbr:', getValue('invoicenmbr', sampleHeaders))

  console.log('\n📋 Testing Zip Code Mapping:')
  console.log('zipcode:', getValue('zipcode', sampleHeaders))
  console.log('zip_code:', getValue('zip_code', sampleHeaders))
  console.log('zipcodeforjob:', getValue('zipcodeforjob', sampleHeaders))

  console.log('\n📋 Testing Customer Name Mapping:')
  console.log('customer:', getValue('customer', sampleHeaders))
  console.log('customername:', getValue('customername', sampleHeaders))
  console.log('customer_name:', getValue('customer_name', sampleHeaders))

  console.log('\n📋 Testing Date Mapping:')
  console.log('date:', getValue('date', sampleHeaders))
  console.log('daterecorded:', getValue('daterecorded', sampleHeaders))
  console.log('date_recorded:', getValue('date_recorded', sampleHeaders))
}

testColumnMapping()

// Test the actual mapping logic from the import page
function testImportLogic() {
  console.log('\n🔍 Testing Import Logic:')
  
  // Simulate the exact logic from the import page
  const headers = ['Invoice Number', 'Zip Code', 'Customer Name', 'Date']
  const row = ['INV-001', '12345', 'John Doe', '2024-01-01']
  
  const getValue = (headerName: string) => {
    const index = headers.findIndex(h => 
      h.replace(/[^a-z0-9]/g, '').toLowerCase() === headerName.replace(/[^a-z0-9]/g, '').toLowerCase()
    )
    return index >= 0 ? (row[index] || '').toString().trim() : ''
  }

  console.log('Headers:', headers)
  console.log('Row data:', row)
  console.log('Invoice mapping result:', getValue('invoice') || getValue('invoicenumber') || getValue('invoice_number') || getValue('invoicenmbr'))
  console.log('Zip mapping result:', getValue('zipcode') || getValue('zip_code') || getValue('zipcodeforjob'))
  console.log('Customer mapping result:', getValue('customer') || getValue('customername') || getValue('customer_name'))
  console.log('Date mapping result:', getValue('date') || getValue('daterecorded') || getValue('date_recorded'))
}

testImportLogic() 