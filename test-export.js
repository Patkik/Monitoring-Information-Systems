#!/usr/bin/env node

/**
 * Test script for CSV export functionality
 * Run with: node test-export.js <token>
 */

const axios = require('axios');
const fs = require('fs');

const API_URL = 'http://localhost:4000/api';
const token = process.argv[2];

if (!token) {
  console.error('Usage: node test-export.js <token>');
  console.error('Example: node test-export.js "eyJhbGciOiJIUzI1NiIs..."');
  process.exit(1);
}

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

async function testExport() {
  try {
    console.log('Testing CSV export endpoint...');
    const response = await client.get('/sessions/export', {
      params: { format: 'csv' },
      responseType: 'blob',
    });

    console.log('✓ Request successful');
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers['content-type']);
    console.log('Content-Disposition:', response.headers['content-disposition']);

    const csv = response.data;
    const filename = `mentee_sessions_${new Date().toISOString().slice(0, 10)}.csv`;
    fs.writeFileSync(filename, csv);
    
    console.log(`✓ CSV file saved to: ${filename}`);
    console.log(`File size: ${csv.size || Buffer.byteLength(csv)} bytes`);
    
    // Parse and display the CSV content
    const content = csv instanceof Buffer ? csv.toString('utf-8') : csv;
    const lines = content.split('\n');
    console.log(`\nCSV Headers: ${lines[0]}`);
    console.log(`Total rows (including header): ${lines.length}`);
    
    if (lines.length > 1) {
      console.log(`First data row: ${lines[1]}`);
    }
    
    console.log('\n✓ Export test PASSED');
  } catch (error) {
    console.error('✗ Export test FAILED');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

testExport();
