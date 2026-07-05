export const getPondokInitials = (name: string) => {
  if (!name) return 'WHI';
  const commonWords = ['pondok', 'pesantren', 'pp', 'pp.', 'yayasan'];
  const words = name.split(' ').filter(word => !commonWords.includes(word.toLowerCase()));
  if (words.length === 0) return 'WHI';
  return words.map(word => word[0]).join('').substring(0, 3).toUpperCase();
};

export const calculateBillingSummary = (
  nomorPendaftaran: string,
  tagihanMap: Record<string, { id: string; jenisBiaya: string; nominal: number; terbayar: number }[]>
) => {
  const items = tagihanMap[nomorPendaftaran] || [];
  const total = items.reduce((acc, curr) => acc + curr.nominal, 0);
  const paid = items.reduce((acc, curr) => acc + curr.terbayar, 0);
  return {
    items,
    total,
    paid,
    sisa: total - paid
  };
};

export const printElementInNewTab = (elementHtml: string, title: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Mohon izinkan pop-up / tab baru pada browser Anda untuk mencetak dokumen.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  emerald: {
                    850: '#064e3b',
                    950: '#022c22',
                  }
                },
                fontFamily: {
                  sans: ['Inter', 'sans-serif'],
                  mono: ['JetBrains Mono', 'monospace'],
                }
              }
            }
          }
        </script>
        <style>
          @page {
            size: auto;
            margin: 10mm;
          }
          body {
            font-family: 'Inter', sans-serif;
            background-color: white;
            color: #1e293b;
            padding: 15px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .printable {
            border: 4px double #064e3b !important;
            border-radius: 1rem !important;
            padding: 1.5rem !important;
          }
          /* Custom styles that need explicit print coloring */
          .bg-slate-50 { background-color: #f8fafc !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
          .bg-emerald-50 { background-color: #ecfdf5 !important; }
          .bg-emerald-100 { background-color: #d1fae5 !important; }
          .bg-emerald-900 { background-color: #064e3b !important; }
          .bg-slate-900 { background-color: #0f172a !important; }
          .text-white { color: #ffffff !important; }
          .text-emerald-900 { color: #064e3b !important; }
          .text-emerald-800 { color: #065f46 !important; }
          .text-emerald-200 { color: #a7f3d0 !important; }
          .text-slate-500 { color: #64748b !important; }
          .text-slate-700 { color: #334155 !important; }
          .text-slate-800 { color: #1e293b !important; }
          .border-emerald-850 { border-color: #064e3b !important; }
          .border-emerald-950 { border-color: #022c22 !important; }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="max-w-2xl mx-auto">
          ${elementHtml}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 800);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
