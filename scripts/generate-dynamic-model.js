const ExcelJS = require('exceljs');

async function createDynamicModel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'More Community AI';
  workbook.created = new Date();

  // ---------------------------------------------------------
  // 1. ASSUMPTIONS SHEET
  // ---------------------------------------------------------
  const asm = workbook.addWorksheet('Assumptions');
  asm.columns = [
    { header: 'Metric', key: 'metric', width: 35 },
    { header: 'Year 1', key: 'y1', width: 15 },
    { header: 'Year 2', key: 'y2', width: 15 },
    { header: 'Year 3', key: 'y3', width: 15 },
    { header: 'Year 4', key: 'y4', width: 15 },
    { header: 'Year 5', key: 'y5', width: 15 },
  ];

  asm.getRow(1).font = { bold: true };
  
  // Growth Metrics
  asm.addRow(['--- GROWTH ---']);
  asm.addRow(['Towns Live', 3, 15, 80, 200, 500]); // Row 3
  asm.addRow(['NHS/Council Contracts Active', 0, 1, 4, 12, 30]); // Row 4
  asm.addRow(['Strategic Partnerships Active', 0, 1, 3, 8, 15]); // Row 5
  
  // Revenue Drivers
  asm.addRow([]); // Row 6
  asm.addRow(['--- REVENUE DRIVERS ---']);
  asm.addRow(['Sponsorship Value per Town (£)', 13000]); // Row 8
  asm.addRow(['NHS Contract Value (£)', 50000]); // Row 9
  asm.addRow(['Strategic Partner Value (£)', 60000]); // Row 10
  asm.addRow(['Premium SaaS Revenue per Town (£)', 800]); // Row 11 (~25% of leaders × £50/mo)
  asm.addRow(['Ticketing & Events Revenue per Town (£)', 2000]); // Row 12
  asm.addRow(['Data Insights Revenue per Town (£)', 0, 0, 5000, 5000, 5000]); // Row 13 (Yr3+)
  
  // Headcount Assumptions (Count)
  asm.addRow([]); // Row 14
  asm.addRow(['--- HEADCOUNT ---']);
  asm.addRow(['Founders / Execs', 1, 1, 2, 3, 5]); // Row 16
  asm.addRow(['Community Managers', 0.5, 2, 5, 12, 30]); // Row 17
  asm.addRow(['Sales / Enterprise', 0, 1, 2, 5, 12]); // Row 18
  asm.addRow(['Developers / Tech', 1, 2, 4, 8, 15]); // Row 19

  // Salary Assumptions (Avg per role)
  asm.addRow([]); // Row 20
  asm.addRow(['--- SALARY ASSUMPTIONS ---']);
  asm.addRow(['Avg Exec Salary (£)', 60000]); // Row 22
  asm.addRow(['Avg Community Mgr Salary (£)', 32000]); // Row 23
  asm.addRow(['Avg Sales Salary (£)', 45000]); // Row 24
  asm.addRow(['Avg Developer Salary (£)', 60000]); // Row 25

  // Marketing & Infra Multipliers
  asm.addRow([]); // Row 26
  asm.addRow(['--- OPERATIONAL MULTIPLIERS ---']);
  asm.addRow(['Marketing Spend per Town (£)', 1500, 1000, 800, 600, 500]); // Row 28 — decreases at scale
  asm.addRow(['Infra Spend per Town (£)', 200]); // Row 29
  asm.addRow(['Legal/Ops Fixed Cost (£)', 15000, 25000, 40000, 80000, 150000]); // Row 30

  asm.getRow(2).font = { bold: true, color: { argb: 'FF0000FF' } };
  asm.getRow(7).font = { bold: true, color: { argb: 'FF0000FF' } };
  asm.getRow(15).font = { bold: true, color: { argb: 'FF0000FF' } };
  asm.getRow(21).font = { bold: true, color: { argb: 'FF0000FF' } };
  asm.getRow(27).font = { bold: true, color: { argb: 'FF0000FF' } };

  // ---------------------------------------------------------
  // 2. 5-YEAR P&L (FORMULA DRIVEN)
  // ---------------------------------------------------------
  const pl = workbook.addWorksheet('P&L');
  pl.columns = [
    { header: 'Category', key: 'cat', width: 35 },
    { header: 'Year 1', key: 'y1', width: 18 },
    { header: 'Year 2', key: 'y2', width: 18 },
    { header: 'Year 3', key: 'y3', width: 18 },
    { header: 'Year 4', key: 'y4', width: 18 },
    { header: 'Year 5', key: 'y5', width: 18 },
  ];
  
  pl.getRow(1).font = { bold: true };

  pl.addRow(['REVENUE', '', '', '', '', '']).font = { bold: true };
  
  // Local Sponsorships: Towns * Sponsorship Value
  const cols = ['B', 'C', 'D', 'E', 'F'];
  pl.addRow([
    'Local Sponsorships',
    ...cols.map(c => ({ formula: `Assumptions!${c}3 * Assumptions!$B$8` }))
  ]);
  
  // NHS Contracts: Contracts * Contract Value
  pl.addRow([
    'NHS/Council Contracts',
    ...cols.map(c => ({ formula: `Assumptions!${c}4 * Assumptions!$B$9` }))
  ]);

  // Strategic Partnerships
  pl.addRow([
    'Strategic Partnerships',
    ...cols.map(c => ({ formula: `Assumptions!${c}5 * Assumptions!$B$10` }))
  ]);

  // Premium SaaS: Towns * SaaS Revenue
  pl.addRow([
    'Premium Leader Tools (SaaS)',
    ...cols.map(c => ({ formula: `Assumptions!${c}3 * Assumptions!$B$11` }))
  ]);

  // Ticketing & Events: Towns * Ticketing Revenue
  pl.addRow([
    'Ticketing & Events',
    ...cols.map(c => ({ formula: `Assumptions!${c}3 * Assumptions!$B$12` }))
  ]);

  // Data Insights: Towns * Data Revenue (Yr3+)
  pl.addRow([
    'Data Insights & API',
    ...cols.map(c => ({ formula: `Assumptions!${c}3 * Assumptions!${c}13` }))
  ]);

  // Total Revenue (Sum of Rows 3-8)
  pl.addRow([
    'TOTAL REVENUE',
    ...cols.map(c => ({ formula: `SUM(${c}3:${c}8)` }))
  ]).font = { bold: true };

  pl.addRow([]); // Row 10
  pl.addRow(['COSTS', '', '', '', '', '']).font = { bold: true }; // Row 11
  
  // Headcount Cost
  pl.addRow([
    'Total Payroll',
    ...cols.map(c => ({ formula: `(Assumptions!${c}16*Assumptions!$B$22)+(Assumptions!${c}17*Assumptions!$B$23)+(Assumptions!${c}18*Assumptions!$B$24)+(Assumptions!${c}19*Assumptions!$B$25)` }))
  ]); // Row 12

  // Marketing: Towns * Marketing Spend per Town (variable by year)
  pl.addRow([
    'Marketing & Local Activation',
    ...cols.map(c => ({ formula: `Assumptions!${c}3 * Assumptions!${c}28` }))
  ]); // Row 13
  
  // Infra: Towns * Infra Spend
  pl.addRow([
    'Infrastructure & Hosting',
    ...cols.map(c => ({ formula: `Assumptions!${c}3 * Assumptions!$B$29` }))
  ]); // Row 14

  // Legal/Ops
  pl.addRow([
    'Legal, Ops & Office',
    ...cols.map(c => ({ formula: `Assumptions!${c}30` }))
  ]); // Row 15

  // Total Costs (Sum of Rows 12-15)
  pl.addRow([
    'TOTAL COSTS',
    ...cols.map(c => ({ formula: `SUM(${c}12:${c}15)` }))
  ]).font = { bold: true }; // Row 16

  pl.addRow([]); // Row 17
  pl.addRow([
    'EBITDA (NET PROFIT)',
    ...cols.map(c => ({ formula: `${c}9 - ${c}16` }))
  ]).font = { bold: true, size: 12 }; // Row 18

  // EBITDA Margin
  pl.addRow([
    'EBITDA Margin (%)',
    ...cols.map(c => ({ formula: `IF(${c}9=0,0,${c}18/${c}9)` }))
  ]); // Row 19

  // Formatting Numbers as Currency
  pl.eachRow((row, rowNumber) => {
    if(rowNumber >= 3) {
      row.eachCell((cell, colNumber) => {
        if(colNumber > 1) {
          // Margin row gets percentage format
          if (rowNumber === 19) {
            cell.numFmt = '0%';
          } else {
            cell.numFmt = '"£"#,##0;[Red]"£"-#,##0';
          }
        }
      });
    }
  });

  // Export
  await workbook.xlsx.writeFile('More-Community-Dynamic-5-Year-Plan.xlsx');
  console.log('✅ Dynamic Financial model generated: More-Community-Dynamic-5-Year-Plan.xlsx');

  // ---------------------------------------------------------
  // 3. COMPUTE VALUES FOR HTML UPDATES
  // ---------------------------------------------------------
  const towns = [3, 15, 80, 200, 500];
  const nhsContracts = [0, 1, 4, 12, 30];
  const stratPartners = [0, 1, 3, 8, 15];
  const dataRevPerTown = [0, 0, 5000, 5000, 5000];
  const mktgPerTown = [1500, 1000, 800, 600, 500];
  const opsFixed = [15000, 25000, 40000, 80000, 150000];
  
  const rev = towns.map((t, i) => {
    const sponsorship = t * 13000;
    const nhs = nhsContracts[i] * 50000;
    const strat = stratPartners[i] * 60000;
    const saas = t * 800;
    const ticketing = t * 2000;
    const data = t * dataRevPerTown[i];
    return sponsorship + nhs + strat + saas + ticketing + data;
  });
  
  const headcount = [
    { execs: 1, cm: 0.5, sales: 0, dev: 1 },
    { execs: 1, cm: 2, sales: 1, dev: 2 },
    { execs: 2, cm: 5, sales: 2, dev: 4 },
    { execs: 3, cm: 12, sales: 5, dev: 8 },
    { execs: 5, cm: 30, sales: 12, dev: 15 },
  ];
  
  const payroll = headcount.map(h => 
    (h.execs * 60000) + (h.cm * 32000) + (h.sales * 45000) + (h.dev * 60000)
  );
  
  const costs = towns.map((t, i) => {
    const marketing = t * mktgPerTown[i];
    const infra = t * 200;
    return payroll[i] + marketing + infra + opsFixed[i];
  });
  
  const ebitda = rev.map((r, i) => r - costs[i]);
  const margin = rev.map((r, i) => r > 0 ? Math.round((ebitda[i] / r) * 100) : 0);
  
  console.log('\n📊 REVISED 5-YEAR PROJECTIONS:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Towns:   ', towns.join(' | '));
  console.log('Revenue: ', rev.map(r => `£${(r/1000).toFixed(0)}k`).join(' | '));
  console.log('Costs:   ', costs.map(c => `£${(c/1000).toFixed(0)}k`).join(' | '));
  console.log('EBITDA:  ', ebitda.map(e => `£${(e/1000).toFixed(0)}k`).join(' | '));
  console.log('Margin:  ', margin.map(m => `${m}%`).join(' | '));
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n✅ Year 2 EBITDA: £${ebitda[1].toLocaleString()} — ${ebitda[1] > 0 ? 'PROFITABLE ✓' : 'LOSS ✗'}`);
  
  // Return for use by other scripts
  return { towns, rev, costs, ebitda, margin, payroll };
}

createDynamicModel().catch(console.error);
