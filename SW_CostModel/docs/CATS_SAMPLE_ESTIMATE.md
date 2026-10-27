# Sample estimate: CATS (Central Automation Ticketing System)

A worked example for the estimator. The figures below come from the estimator page itself
(the Review step), using the default masters in `estimator.js`. Change the masters and the
numbers change.

## The project

One senior developer who also leads the team builds and deploys CATS on one on-premise
server. Modules:

1. Inventory management
2. Ticketing with an approval matrix, and full incident management (SLA, escalation, closure)
3. Image and HDD backup management
4. Disaster recovery management and alerts
5. AMC management for the whole plant
6. Audit-ready dashboards and reports

## Inputs

| Page / field | Value | Why |
|---|---|---|
| Delivery model | Yearly (support after go-live) | The plant will keep using and changing it |
| Project type, status, record as | Web application, planned, new project, FY 2026-27 | |
| Duration | 240 working days | About 11 months for one person: roughly 30 days for each of the six module groups, the rest for login and roles, notifications, testing, UAT and deployment |
| Complexity | High (×1.25) | Approval workflow, alerting, several modules, audit trail |
| Named users | 500 | Plant-wide ticket raisers and approvers |
| Team | 1 person, level **Lead**, 100% allocation | ₹13,000 per person-day (CA) / ₹22,000 (benchmark) |
| Scope check | 45 screens, 18 reports/dashboards, 4 integrations | The page compares effort with scope: **98%, consistent** |
| Hosting | On-premise, production only, 1 server | 8 cores, 32 GB RAM, 2 TB SSD, RAID 5 |
| Database / OS | SQL Server Standard, Windows Server | |
| Other items | UI/report components, SSL certificate (yearly), VAPT security audit, user training | Audit-ready, so a security audit is included |
| Years of ownership | 3 | 3 months free warranty, 15% AMC, 5% yearly escalation |

## Result

| | Central Automation | Benchmark (software company) | Saving |
|---|---|---|---|
| One-time build cost | **₹58,22,500** | ₹1,17,84,550 | ₹59,62,050 (51%) |
| Yearly running cost (full rate) | **₹10,37,250** | ₹25,37,310 | ₹15,00,060 (59%) |
| 3-year total cost of ownership | **₹89,19,856** | ₹1,92,68,620 | ₹1,03,48,764 (54%) |

Where the one-time ₹58.2 L goes (Central Automation):

| Item | ₹ |
|---|---|
| Labour: 240 person-days × ₹13,000 × 1.25 | 39,00,000 |
| Contingency 10% + overheads 8% of labour | 7,02,000 |
| Server and storage | 2,49,500 |
| SQL Server Standard (8 cores) | 6,56,000 |
| Windows Server | 65,000 |
| UI components | 50,000 |
| VAPT audit + training | 2,00,000 |

Yearly running cost: AMC ₹6,90,300, licence support and renewals ₹1,72,000, change requests
₹95,000, yearly deployment ₹30,000, hardware support ₹24,950, backup/SSL/monitoring ₹25,000.

## Value creation (assumptions: replace with real figures)

| Benefit | Basis | Per year |
|---|---|---|
| Man-hours saved | 3,000 hours × ₹500 | ₹15,00,000 |
| Downtime avoided | 10 hours × ₹50,000 | ₹5,00,000 |
| Safety and compliance risk avoided | ₹5,00,000 | ₹5,00,000 |
| **Total** | | **₹25,00,000** |

With these figures the value over 3 years is ₹75 L against ₹89.2 L cost: **−₹14.2 L, payback
in about 4 years**. The project pays back within 3 years only if it creates about ₹29.7 L of
value a year. Check the benefit quantities with the plant before using this to justify the
project.

## Things to know

- **One person for 11 months** is a key-person risk: no backup developer, and the schedule
  moves with one person's leave. The estimate has no second person, as asked.
- **SQL Server is the largest single licence.** Open-source PostgreSQL / MySQL would remove
  ₹6,56,000 one-time and ₹1,64,000 a year.
- **No DR copy of CATS itself.** The estimate is production only. "Production + DR" would
  multiply the server cost by 2 and add an OS licence for the second environment.

## Loading it

`database/templates/example/cats.csv` is the same project as a project-sheet row (see
`PROJECT_SHEET.md`). The sheet cannot carry the scope check or the four extra items, and it
uses the default AMC and loadings. Loaded through the Excel upload page it gives ₹55,72,500
one-time (₹2,50,000 less) and ₹10,29,250 a year (₹8,000 less); an admin can add the four items
on the Approval page.
