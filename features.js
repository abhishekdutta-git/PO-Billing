/* PANORAMA OPTICALS — Features: Orders, Customers, WhatsApp */

// ══════════ WHATSAPP ══════════
const WA_ICON='<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.015a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374A9.86 9.86 0 012.16 12.04C2.16 6.57 6.58 2.15 12.06 2.15c2.66 0 5.16 1.036 7.04 2.919a9.88 9.88 0 012.91 7.038c-.003 5.473-4.423 9.893-9.9 9.893l-.06-.015zM20.52 3.449C18.24 1.245 15.24 0 12.05 0 5.495 0 .16 5.335.157 11.892a11.86 11.86 0 001.588 5.945L0 24l6.304-1.654a11.88 11.88 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.452z"/></svg>';

function sendWhatsApp(phone,msg){if(!phone)return showToast('No phone number','error');const num=phone.replace(/\D/g,'');const fullNum=num.length===10?'91'+num:num;const url='https://wa.me/'+fullNum+'?text='+encodeURIComponent(msg);window.open(url,'_blank');}

function sendPaymentReminder(custPhone,custName,billId,amount){
    const msg=`Dear ${custName}, your balance of ₹${amount.toFixed(2)} is pending at PANORAMA OPTICALS for bill ${billId}. Kindly clear the dues at your earliest convenience. Thank you!\n\n— PANORAMA OPTICALS\nBhaljoria Road, Nirsha, Dhanbad`;
    sendWhatsApp(custPhone,msg);
}

function sendOrderReady(custPhone,custName,orderId,balance){
    const msg=`Dear ${custName}, your spectacles (Order: ${orderId}) are ready for pickup at PANORAMA OPTICALS, Bhaljoria Road, Nirsha - 828205, Dhanbad.\n\n${balance>0?'Balance due: ₹'+balance.toFixed(2)+'\n':''}Please visit at your convenience. Thank you! 👓`;
    sendWhatsApp(custPhone,msg);
}

// ══════════ CUSTOMERS ══════════
function upsertCustomer(data,total,balance){
    const phone=data.customer.phone;
    let cust=customers.find(c=>c.phone&&c.phone===phone);
    if(!cust){cust={id:'C'+Date.now().toString(36),name:data.customer.name,phone:phone,address:data.customer.address,bills:[],totalDue:0,createdAt:new Date().toISOString()};customers.push(cust);}
    cust.name=data.customer.name;if(data.customer.address)cust.address=data.customer.address;
    cust.bills.push({billId:data.id,total,balance,date:data.date});
    cust.totalDue=cust.bills.reduce((s,b)=>s+Math.max(0,b.balance||0),0);
    saveData();
}

function renderCustomers(){
    const tb=document.getElementById('cust-body'),em=document.getElementById('cust-empty'),tbl=document.getElementById('cust-table');tb.innerHTML='';
    if(customers.length===0){tbl.classList.add('hidden');em.classList.remove('hidden');document.getElementById('cust-total-count').textContent='0 customers';document.getElementById('cust-total-due').textContent='₹ 0';return;}
    tbl.classList.remove('hidden');em.classList.add('hidden');
    let totalDue=0;
    customers.forEach((c,i)=>{
        totalDue+=c.totalDue||0;
        const tr=document.createElement('tr');
        const dueClass=c.totalDue>0?'due-highlight':'due-clear';
        const waBtn=c.totalDue>0&&c.phone?`<a class="btn-wa" onclick="sendPaymentReminder('${c.phone}','${c.name.replace(/'/g,"\\'")}','DUES',${c.totalDue})" title="WhatsApp Reminder">${WA_ICON} Remind</a>`:'';
        tr.innerHTML=`<td style="text-align:center;color:var(--text-muted)">${i+1}</td><td style="font-weight:500">${c.name}</td><td>${c.phone||'—'}</td><td>${c.bills?c.bills.length:0}</td><td class="${dueClass}">₹ ${(c.totalDue||0).toFixed(2)}</td><td><div class="history-actions">${waBtn}<button class="hist-btn delete" onclick="deleteCustomer('${c.id}')" title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button></div></td>`;
        tb.appendChild(tr);
    });
    document.getElementById('cust-total-count').textContent=customers.length+' customers';
    document.getElementById('cust-total-due').textContent='₹ '+totalDue.toFixed(2);
}

function filterCustomers(){const q=document.getElementById('cust-search').value.toLowerCase();for(const r of document.getElementById('cust-body').rows)r.style.display=r.textContent.toLowerCase().includes(q)?'':'none';}
function deleteCustomer(id){if(!confirm('Delete this customer?'))return;customers=customers.filter(c=>c.id!==id);saveData();renderCustomers();showToast('Customer deleted','error');}

// ══════════ ORDERS ══════════
let currentOrdTab='all';

function createOrder(data,total,balance){
    const ordId='PO-ORD-'+Date.now().toString(36).toUpperCase().slice(-6);
    orders.unshift({
        id:ordId,billId:data.id,customer:{name:data.customer.name,phone:data.customer.phone,address:data.customer.address},
        rx:data.rx,items:data.items,total,advance:data.advance||0,balance,
        orderDate:data.date,deliveryDate:data.deliveryDate,
        status:'ordered',createdAt:new Date().toISOString()
    });
    saveData();
}

function setOrdTab(t){
    currentOrdTab=t;
    ['all','ordered','ready','delivered'].forEach(x=>{
        const btn=document.getElementById('ord-tab-'+x);
        if(btn)btn.classList.toggle('active',x===t);
    });
    renderOrders();
}

function markOrderReady(id){
    const ord=orders.find(o=>o.id===id);if(!ord)return;
    ord.status='ready';saveData();renderOrders();
    if(ord.customer.phone)sendOrderReady(ord.customer.phone,ord.customer.name,ord.id,ord.balance);
    else showToast('Order marked ready (no phone for WhatsApp)','success');
}

function markOrderDelivered(id){
    const ord=orders.find(o=>o.id===id);if(!ord)return;
    ord.status='delivered';ord.balance=0;ord.deliveredAt=new Date().toISOString();
    // Update customer due
    const cust=customers.find(c=>c.phone&&c.phone===ord.customer.phone);
    if(cust){const bill=cust.bills.find(b=>b.billId===ord.billId);if(bill)bill.balance=0;cust.totalDue=cust.bills.reduce((s,b)=>s+Math.max(0,b.balance||0),0);}
    // Update bill history
    const hBill=billHistory.find(b=>b.id===ord.billId);if(hBill)hBill.balance=0;
    saveData();renderOrders();showToast('Order delivered & payment cleared','success');
}

function renderOrders(){
    const list=document.getElementById('orders-list'),em=document.getElementById('orders-empty');
    let filtered=currentOrdTab==='all'?orders:orders.filter(o=>o.status===currentOrdTab);
    list.innerHTML='';
    if(filtered.length===0){list.innerHTML='';em.classList.remove('hidden');return;}
    em.classList.add('hidden');

    filtered.forEach(ord=>{
        const card=document.createElement('div');card.className='order-card';
        const statusClass='status-'+ord.status;
        const statusLabel=ord.status==='ordered'?'⏳ Ordered':ord.status==='ready'?'✅ Ready':'📦 Delivered';
        const oDate=ord.orderDate?new Date(ord.orderDate).toLocaleDateString('en-IN'):'';
        const dDate=ord.deliveryDate?new Date(ord.deliveryDate).toLocaleDateString('en-IN'):'—';

        let rxHtml='';
        if(ord.rx){rxHtml=`<div class="order-rx"><strong>Rx:</strong> R: SPH ${ord.rx.r.sph||'-'} CYL ${ord.rx.r.cyl||'-'} AXIS ${ord.rx.r.axis||'-'} ADD ${ord.rx.r.add||'-'} &nbsp;|&nbsp; L: SPH ${ord.rx.l.sph||'-'} CYL ${ord.rx.l.cyl||'-'} AXIS ${ord.rx.l.axis||'-'} ADD ${ord.rx.l.add||'-'}</div>`;}

        let actions='';
        if(ord.status==='ordered'){actions=`<button class="btn-sm btn-mark" onclick="markOrderReady('${ord.id}')">✅ Mark Ready</button>`;}
        if(ord.status==='ready'){actions=`<button class="btn-sm btn-mark-deliver" onclick="markOrderDelivered('${ord.id}')">📦 Mark Delivered</button>`;}
        const waBtn=ord.customer.phone&&ord.balance>0?`<a class="btn-wa" onclick="sendPaymentReminder('${ord.customer.phone}','${ord.customer.name.replace(/'/g,"\\'")}','${ord.id}',${ord.balance})">${WA_ICON} Remind</a>`:'';
        const waReadyBtn=ord.customer.phone&&ord.status==='ready'?`<a class="btn-wa" onclick="sendOrderReady('${ord.customer.phone}','${ord.customer.name.replace(/'/g,"\\'")}','${ord.id}',${ord.balance})">${WA_ICON} Notify</a>`:'';

        card.innerHTML=`
        <div class="order-header">
            <div><span class="order-id">${ord.id}</span> <span class="order-date">· ${oDate}</span></div>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
        <div class="order-body">
            <div><div class="order-field-label">Customer</div><div class="order-field-value">${ord.customer.name}</div></div>
            <div><div class="order-field-label">Phone</div><div class="order-field-value">${ord.customer.phone||'—'}</div></div>
            <div><div class="order-field-label">Delivery Date</div><div class="order-field-value">${dDate}</div></div>
            <div><div class="order-field-label">Total</div><div class="order-field-value">₹ ${ord.total.toFixed(2)}</div></div>
            <div><div class="order-field-label">Advance</div><div class="order-field-value">₹ ${(ord.advance||0).toFixed(2)}</div></div>
            <div><div class="order-field-label">Balance Due</div><div class="order-field-value ${ord.balance>0?'due-highlight':'due-clear'}">₹ ${(ord.balance||0).toFixed(2)}</div></div>
        </div>
        ${rxHtml}
        <div class="order-footer">
            <div class="order-actions">${actions} ${waReadyBtn} ${waBtn}</div>
            <span class="order-date">Bill: ${ord.billId||'—'}</span>
        </div>`;
        list.appendChild(card);
    });
}
