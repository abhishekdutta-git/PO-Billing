/* PANORAMA OPTICALS — Database Spreadsheet Viewer */

let currentDbTab = 'customers';

function setDbTab(tab) {
    currentDbTab = tab;
    ['customers', 'bills', 'medical', 'optical', 'orders'].forEach(t => {
        const btn = document.getElementById('db-tab-' + t);
        if (btn) btn.classList.toggle('active', t === tab);
    });
    renderDatabaseView();
}

function renderDatabaseView() {
    const container = document.getElementById('db-table-container');
    const statsEl = document.getElementById('db-stats');
    const searchVal = (document.getElementById('db-search')?.value || '').toLowerCase();

    let columns = [];
    let rows = [];
    let title = '';

    switch (currentDbTab) {
        case 'customers':
            title = 'Customers';
            columns = ['#', 'Name', 'Phone', 'Address', 'Total Orders', 'Total Due (₹)', 'Created'];
            rows = (typeof customers !== 'undefined' ? customers : []).map((c, i) => [
                i + 1,
                c.name || '—',
                c.phone || '—',
                c.address || '—',
                c.bills ? c.bills.length : 0,
                '₹ ' + (c.totalDue || 0).toFixed(2),
                c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'
            ]);
            break;

        case 'bills':
            title = 'Bills';
            columns = ['#', 'Bill No', 'Date', 'Customer', 'Phone', 'Category', 'GST', 'Items', 'Total (₹)', 'Balance (₹)', 'Created'];
            rows = (typeof billHistory !== 'undefined' ? billHistory : []).map((b, i) => [
                i + 1,
                b.id || '—',
                b.date ? new Date(b.date).toLocaleDateString('en-IN') : '—',
                b.customer?.name || '—',
                b.customer?.phone || '—',
                b.category || '—',
                b.gst ? 'Yes' : 'No',
                b.items ? b.items.length : 0,
                '₹ ' + (b.total || 0).toFixed(2),
                '₹ ' + (b.balance || 0).toFixed(2),
                b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN') : '—'
            ]);
            break;

        case 'medical':
            title = 'Medical Stock';
            columns = ['#', 'Item Name', 'HSN/SAC', 'Quantity', 'Rate (₹)', 'Batch No', 'Expiry', 'Value (₹)', 'Added'];
            const medItems = (typeof inventory !== 'undefined' && inventory.medical) ? inventory.medical : [];
            rows = medItems.map((it, i) => [
                i + 1,
                it.name || '—',
                it.hsn || '—',
                it.qty || 0,
                '₹ ' + (it.rate || 0).toFixed(2),
                it.batch || '—',
                it.expiry ? new Date(it.expiry).toLocaleDateString('en-IN') : '—',
                '₹ ' + ((it.qty || 0) * (it.rate || 0)).toFixed(2),
                it.addedAt ? new Date(it.addedAt).toLocaleDateString('en-IN') : '—'
            ]);
            break;

        case 'optical':
            title = 'Optical Stock';
            columns = ['#', 'Item Name', 'HSN/SAC', 'Quantity', 'Rate (₹)', 'Batch No', 'Expiry', 'Value (₹)', 'Added'];
            const optItems = (typeof inventory !== 'undefined' && inventory.optical) ? inventory.optical : [];
            rows = optItems.map((it, i) => [
                i + 1,
                it.name || '—',
                it.hsn || '—',
                it.qty || 0,
                '₹ ' + (it.rate || 0).toFixed(2),
                it.batch || '—',
                it.expiry ? new Date(it.expiry).toLocaleDateString('en-IN') : '—',
                '₹ ' + ((it.qty || 0) * (it.rate || 0)).toFixed(2),
                it.addedAt ? new Date(it.addedAt).toLocaleDateString('en-IN') : '—'
            ]);
            break;

        case 'orders':
            title = 'Orders';
            columns = ['#', 'Order ID', 'Bill ID', 'Customer', 'Phone', 'Status', 'Total (₹)', 'Advance (₹)', 'Balance (₹)', 'Order Date', 'Delivery Date'];
            rows = (typeof orders !== 'undefined' ? orders : []).map((o, i) => [
                i + 1,
                o.id || '—',
                o.billId || '—',
                o.customer?.name || '—',
                o.customer?.phone || '—',
                o.status || '—',
                '₹ ' + (o.total || 0).toFixed(2),
                '₹ ' + (o.advance || 0).toFixed(2),
                '₹ ' + (o.balance || 0).toFixed(2),
                o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN') : '—',
                o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('en-IN') : '—'
            ]);
            break;
    }

    // Filter rows
    let filteredRows = rows;
    if (searchVal) {
        filteredRows = rows.filter(row =>
            row.some(cell => String(cell).toLowerCase().includes(searchVal))
        );
    }

    // Stats
    statsEl.textContent = `${filteredRows.length} of ${rows.length} records · ${title}`;

    // Build table
    if (filteredRows.length === 0) {
        container.innerHTML = `
            <div class="db-empty">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                <p>No ${title.toLowerCase()} data found</p>
            </div>`;
        return;
    }

    let html = '<div class="db-table-scroll"><table class="db-table"><thead><tr>';
    columns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '</tr></thead><tbody>';

    filteredRows.forEach((row, ri) => {
        html += `<tr class="${ri % 2 === 0 ? 'db-row-even' : 'db-row-odd'}">`;
        row.forEach((cell, ci) => {
            let cls = '';
            const cellStr = String(cell);
            // Highlight special cells
            if (cellStr.startsWith('₹')) cls = 'db-cell-currency';
            if (ci === 0) cls = 'db-cell-index';
            if (currentDbTab === 'orders' && ci === 5) {
                const statusCls = cell === 'ordered' ? 'db-status-ordered' : cell === 'ready' ? 'db-status-ready' : cell === 'delivered' ? 'db-status-delivered' : '';
                cls += ' ' + statusCls;
            }
            if (currentDbTab === 'bills' && ci === 6) {
                cls += cell === 'Yes' ? ' db-gst-on' : ' db-gst-off';
            }
            html += `<td class="${cls}">${cell}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function filterDatabase() {
    renderDatabaseView();
}

function exportCSV() {
    let columns = [];
    let rows = [];
    let filename = currentDbTab;

    switch (currentDbTab) {
        case 'customers':
            columns = ['Name', 'Phone', 'Address', 'Total Orders', 'Total Due'];
            rows = (typeof customers !== 'undefined' ? customers : []).map(c => [
                c.name, c.phone || '', c.address || '', c.bills ? c.bills.length : 0, (c.totalDue || 0).toFixed(2)
            ]);
            break;
        case 'bills':
            columns = ['Bill No', 'Date', 'Customer', 'Phone', 'Category', 'GST', 'Items Count', 'Total', 'Balance'];
            rows = (typeof billHistory !== 'undefined' ? billHistory : []).map(b => [
                b.id, b.date || '', b.customer?.name || '', b.customer?.phone || '', b.category, b.gst ? 'Yes' : 'No', b.items ? b.items.length : 0, (b.total || 0).toFixed(2), (b.balance || 0).toFixed(2)
            ]);
            break;
        case 'medical':
        case 'optical':
            columns = ['Item Name', 'HSN', 'Quantity', 'Rate', 'Batch', 'Expiry', 'Value'];
            const items = (typeof inventory !== 'undefined' && inventory[currentDbTab]) ? inventory[currentDbTab] : [];
            rows = items.map(it => [
                it.name, it.hsn || '', it.qty, (it.rate || 0).toFixed(2), it.batch || '', it.expiry || '', ((it.qty || 0) * (it.rate || 0)).toFixed(2)
            ]);
            break;
        case 'orders':
            columns = ['Order ID', 'Bill ID', 'Customer', 'Phone', 'Status', 'Total', 'Advance', 'Balance', 'Order Date', 'Delivery Date'];
            rows = (typeof orders !== 'undefined' ? orders : []).map(o => [
                o.id, o.billId, o.customer?.name || '', o.customer?.phone || '', o.status, (o.total || 0).toFixed(2), (o.advance || 0).toFixed(2), (o.balance || 0).toFixed(2), o.orderDate || '', o.deliveryDate || ''
            ]);
            break;
    }

    // Build CSV
    const escapeCSV = (val) => {
        const s = String(val).replace(/"/g, '""');
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };

    let csv = columns.map(escapeCSV).join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(escapeCSV).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panorama_${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported: ' + filename, 'success');
}
