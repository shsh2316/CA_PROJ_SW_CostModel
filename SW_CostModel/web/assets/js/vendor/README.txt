Third-party libraries used to build the estimate PDF on the report page. They are served from this site (no internet needed).

jspdf.umd.min.js      jsPDF 2.5.1         MIT licence, see LICENSE-jspdf.txt         https://github.com/parallax/jsPDF
html2canvas.min.js    html2canvas 1.4.1   MIT licence, see LICENSE-html2canvas.txt   https://github.com/niklasvh/html2canvas

Both are the unmodified files from the npm packages (dist folder). To update, replace the two files and run the PDF check described in docs/DEPLOYMENT_IIS.md.

Note: jspdf.umd.min.js contains the text of a cdnjs address for its "pdfobjectnewwindow" output option. The site never uses that option (it only calls save()), and the Content-Security-Policy would block the address anyway.
