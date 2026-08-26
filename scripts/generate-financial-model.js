const ExcelJS = require('exceljs');
const fs = require('fs');

async function createFinancialModel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'More Community AI';
  workbook.created = new Date();

  // ---------------------------------------------------------
  // 1. Executive Dashboard
  // ---------------------------------------------------------
  const dashboard = workbook.addWorksheet('Executive Dashboard');
  dashboard.columns = [
    { header: '', key: 'metric', width: 35 },
    { header: 'Year 1', key: 'y1', width: 15 },
    { header: 'Year 2', key: 'y2', width: 15 },
    { header: 'Year 3', key: 'y3', width: 15 },
    { header: 'Year 4', key: 'y4', width: 15 },
    { header: 'Year 5', key: 'y5', width: 15 },
  ];

  dashboard.addRow(['MORE COMMUNITY - 5-YEAR FINANCIAL MODEL']);
  dashboard.addRow([]);
  
  // Scale row
  dashboard.addRow(['Towns Live', 1, 10, 50, 200, 500]);
  
  dashboard.addRow([]);
  dashboard.addRow(['FINANCIAL SUMMARY (Most Likely Scenario)']);
  dashboard.addRow(['Total Revenue (£)', 6000, 85000, 285000, 1050000, 3200000]);
  dashboard.addRow(['Total Costs (£)', 150000, 250000, 500000, 1200000, 2500000]);
  dashboard.addRow(['EBITDA (£)', -144000, -165000, -215000, -150000, 700000]);
  
  dashboard.addRow([]);
  dashboard.addRow(['FUNDING & CASH RUNWAY']);
  dashboard.addRow(['Seed Funding Injected (£)', 200000, 0, 0, 0, 0]);
  dashboard.addRow(['Series A Required (£)', 0, 0, 1000000, 0, 0]);
  
  dashboard.addRow([]);
  dashboard.addRow(['SCENARIO TOGGLE (For Reference)']);
  dashboard.addRow(['Scenario', 'Most Likely']);
  dashboard.addRow(['Best Case Exit Valuation (5Y)', '£30M - £50M']);
  dashboard.addRow(['Most Likely Exit Valuation (5Y)', '£15M - £25M']);
  dashboard.addRow(['Worst Case (Lifestyle Business)', '£2M - £5M']);

  dashboard.getRow(1).font = { bold: true, size: 14 };
  dashboard.getRow(6).font = { bold: true };
  dashboard.getRow(11).font = { bold: true };
  dashboard.getRow(15).font = { bold: true };

  // ---------------------------------------------------------
  // 2. 5-Year P&L
  // ---------------------------------------------------------
  const pl = workbook.addWorksheet('5-Year P&L');
  pl.columns = [
    { header: 'Category', key: 'cat', width: 30 },
    { header: 'Year 1', key: 'y1', width: 15 },
    { header: 'Year 2', key: 'y2', width: 15 },
    { header: 'Year 3', key: 'y3', width: 15 },
    { header: 'Year 4', key: 'y4', width: 15 },
    { header: 'Year 5', key: 'y5', width: 15 },
  ];

  pl.addRow(['REVENUE', '', '', '', '', '']);
  pl.addRow(['Local Sponsorships', 1000, 10000, 50000, 200000, 500000]);
  pl.addRow(['NHS/Council Contracts', 0, 40000, 120000, 400000, 1000000]);
  pl.addRow(['Strategic Partnerships', 0, 20000, 65000, 150000, 300000]);
  pl.addRow(['Community Ventures', 5000, 15000, 50000, 300000, 1400000]);
  pl.addRow(['TOTAL REVENUE', 6000, 85000, 285000, 1050000, 3200000]).font = { bold: true };
  
  pl.addRow([]);
  pl.addRow(['COSTS', '', '', '', '', '']);
  pl.addRow(['Salaries & Team', 110000, 160000, 300000, 600000, 1200000]);
  pl.addRow(['Marketing & Brand', 15000, 40000, 100000, 300000, 600000]);
  pl.addRow(['Software & Infra', 5000, 15000, 40000, 150000, 400000]);
  pl.addRow(['Ops, Legal, Office', 20000, 35000, 60000, 150000, 300000]);
  pl.addRow(['TOTAL COSTS', 150000, 250000, 500000, 1200000, 2500000]).font = { bold: true };
  
  pl.addRow([]);
  pl.addRow(['NET PROFIT (EBITDA)', -144000, -165000, -215000, -150000, 700000]).font = { bold: true };
  
  pl.getRow(2).font = { bold: true };
  pl.getRow(9).font = { bold: true };
  pl.getRow(17).font = { bold: true };

  // ---------------------------------------------------------
  // 3. Revenue Assumptions
  // ---------------------------------------------------------
  const rev = workbook.addWorksheet('Revenue Assumptions');
  rev.columns = [
    { header: 'Assumption', key: 'ass', width: 35 },
    { header: 'Value', key: 'val', width: 20 },
    { header: 'Notes', key: 'not', width: 50 },
  ];
  
  rev.addRow(['Town Rollout Schedule']);
  rev.addRow(['Year 1 Towns', 1, 'Tunbridge Wells']);
  rev.addRow(['Year 2 Towns', 10, 'Kent regional cluster']);
  rev.addRow(['Year 3 Towns', 50, 'South East expansion']);
  rev.addRow(['Year 4 Towns', 200, 'UK major towns']);
  rev.addRow(['Year 5 Towns', 500, 'National scale']);
  rev.addRow([]);
  rev.addRow(['Local Sponsorship Value', '£1,000', 'Annual yield per town (average)']);
  rev.addRow(['NHS/Council Contract Value', '£40,000', 'Per regional health board / borough']);
  rev.addRow(['Community Ventures', '10%', 'Rev share on platform ticketing/donations']);

  rev.getRow(2).font = { bold: true };

  // ---------------------------------------------------------
  // 4. Cost Assumptions
  // ---------------------------------------------------------
  const cost = workbook.addWorksheet('Cost Assumptions');
  cost.columns = [
    { header: 'Assumption', key: 'ass', width: 35 },
    { header: 'Value', key: 'val', width: 20 },
    { header: 'Notes', key: 'not', width: 50 },
  ];
  
  cost.addRow(['Headcount (Year 1)']);
  cost.addRow(['Founder/CEO', '£40,000', 'Lean startup salary']);
  cost.addRow(['Community Manager', '£30,000', 'Ops and local leader support']);
  cost.addRow(['Tech / Dev', '£40,000', 'Lead developer or agency retainer']);
  cost.addRow([]);
  cost.addRow(['Marketing & Sales']);
  cost.addRow(['CAC (B2B Public Sector)', '£5,000', 'Cost to acquire NHS/Council contract']);
  cost.addRow(['CAC (Local Leader)', '£150', 'Cost to launch a new local community leader']);

  cost.getRow(2).font = { bold: true };
  cost.getRow(7).font = { bold: true };

  // ---------------------------------------------------------
  // 5. Business Models Comparison
  // ---------------------------------------------------------
  const models = workbook.addWorksheet('Business Models');
  models.columns = [
    { header: 'Platform', key: 'plat', width: 20 },
    { header: 'Primary Revenue Stream', key: 'rev', width: 40 },
    { header: 'More Community Equivalent', key: 'equiv', width: 40 },
  ];

  models.addRow(['Nextdoor', 'Hyper-local advertising & sponsored business pages', 'Local Sponsorships (£1k/town)']);
  models.addRow(['Meetup', 'SaaS subscriptions charged to event organizers', 'Premium Organisation Features (Councils/Charities)']);
  models.addRow(['Eventbrite', 'Transaction fees on tickets and paid events', 'Community Ventures (10% rev share)']);
  models.addRow(['GovTech', 'B2B enterprise contracts with local government', 'NHS Social Prescribing Contracts']);

  models.getRow(1).font = { bold: true };

  // Export
  await workbook.xlsx.writeFile('More-Community-5-Year-Plan.xlsx');
  console.log('✅ Financial model generated: More-Community-5-Year-Plan.xlsx');
}

createFinancialModel().catch(console.error);
