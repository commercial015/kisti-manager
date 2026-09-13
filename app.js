let db={customers:[],loans:[],payments:[],dps:[],dpsPayments:[],expenses:[],incomes:[],settings:{business:"Smart Kisti Manager",phone:"",address:"",footer:"ধন্যবাদ"},
  audit:[]};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const money=n=>"৳"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:0});
const today=()=>new Date().toISOString().slice(0,10);
const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const uid=()=>Date.now()+Math.floor(Math.random()*10000);
const addDays=(date,days)=>{let d=new Date(date+"T00:00:00");d.setDate(d.getDate()+Number(days||0));return d.toISOString().slice(0,10)};
const dueDate=(l,no)=>addDays(l.start,(Number(no)-1)*Number(l.frequencyDays||30));
const monthKey=d=>String(d||today()).slice(0,7);
const currentMonth=monthKey();
function normalize(){db.customers??=[];db.loans??=[];db.payments??=[];db.dps??=[];db.dpsPayments??=[];db.expenses??=[];db.incomes??=[];db.settings??={};db.settings={business:"Smart Kisti Manager",phone:"",address:"",footer:"ধন্যবাদ",dailyTarget:0,theme:"dark",...db.settings}}
async function init(){db=await window.desktopAPI.load();normalize();render();loadSettings()}
async function save(msg="সংরক্ষণ হয়েছে"){normalize();if(msg&&msg!=="সংরক্ষণ হয়েছে"){db.audit.push({id:Date.now()+Math.random(),date:new Date().toISOString(),action:String(msg),user:"Local User"});if(db.audit.length>500)db.audit=db.audit.slice(-500)}await window.desktopAPI.save(db);render();toast(msg)}
function toast(t){let x=$("#toast");x.textContent=t;x.style.display="block";clearTimeout(window._toast);window._toast=setTimeout(()=>x.style.display="none",1800)}
function modal(title,body){$("#modalBody").innerHTML="<h2>"+title+"</h2>"+body;$("#modal").classList.add("show")}
function close(){$("#modal").classList.remove("show")}
function customerOptions(selected=""){return '<option value="">সাধারণ</option>'+db.customers.map(c=>`<option value="${c.id}" ${String(c.id)===String(selected)?"selected":""}>${esc(c.name)} — ${esc(c.phone||"")}</option>`).join("")}
function info(l){let p=db.payments.filter(x=>x.loanId===l.id),paid=p.length,due=Math.max(0,Number(l.count)-paid),expected=paid+1,ed=due?dueDate(l,expected):null,overdue=!!(ed&&ed<today());return{paid,due,amount:p.reduce((a,x)=>a+Number(x.amount||0),0),next:expected,nextDate:ed,overdue,late:overdue?Math.max(0,Math.floor((new Date(today())-new Date(ed))/86400000)):0,lateFee:overdue?Number(l.lateFee||0):0}}
function dInfo(d){let p=db.dpsPayments.filter(x=>x.dpsId===d.id);return{paid:p.length,due:Math.max(0,Number(d.months)-p.length),amount:p.reduce((a,x)=>a+Number(x.amount||0),0)}}
function sums(){let collection=db.payments.reduce((a,p)=>a+Number(p.amount||0),0),dps=db.dpsPayments.reduce((a,p)=>a+Number(p.amount||0),0),expenses=db.expenses.reduce((a,p)=>a+Number(p.amount||0),0),income=db.incomes.reduce((a,p)=>a+Number(p.amount||0),0);let outstanding=db.loans.reduce((a,l)=>a+info(l).due*Number(l.per||0)+info(l).lateFee,0);return{collection,dps,expenses,income,outstanding,net:collection+dps+income-expenses}}
function render(){
 const s=sums(), active=db.loans.filter(l=>info(l).due>0).length,done=db.loans.length-active,dueCount=db.loans.reduce((a,l)=>a+info(l).due,0),overdue=db.loans.filter(l=>info(l).overdue),overdueAmount=overdue.reduce((a,l)=>a+info(l).due*Number(l.per||0),0),todayCol=db.payments.filter(p=>p.date===today()).reduce((a,p)=>a+Number(p.amount||0),0),monthCol=db.payments.filter(p=>p.date.startsWith(currentMonth)).reduce((a,p)=>a+Number(p.amount||0),0);
 const set=(id,v)=>{if($(id))$(id).textContent=v};set("xCustomers",db.customers.length);set("xCollection",money(s.collection));set("xOutstanding",money(s.outstanding));set("xDps",money(s.dps));set("xExpenses",money(s.expenses));set("xIncome",money(s.income));set("xNet",money(s.net));set("xActive",active);set("xDone",done);set("xDpsPlans",db.dps.filter(d=>dInfo(d).due>0).length);set("xDueCount",dueCount);set("xOverdue",overdue.length);set("xOverdueAmount",money(overdueAmount));set("xToday",money(todayCol));set("xMonth",money(monthCol));set("xTarget",money(db.settings.dailyTarget||0));set("xTargetPct",(db.settings.dailyTarget?Math.min(100,Math.round(todayCol/Number(db.settings.dailyTarget)*100)):0)+"%");
 const vals=[["কিস্তি আদায়",s.collection],["অন্যান্য আয়",s.income],["DPS জমা",s.dps],["খরচ",s.expenses],["বকেয়া",s.outstanding]],max=Math.max(...vals.map(x=>x[1]),1);$("#bars").innerHTML=vals.map(v=>`<div class=barrow><span>${v[0]}</span><div class=bar><i style=\"width:${Math.min(100,v[1]/max*100)}%\"></i></div><b>${money(v[1])}</b></div>`).join("");
 let monthly=Array.from({length:6},(_,i)=>{let d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(5-i));let key=d.toISOString().slice(0,7);return{label:d.toLocaleDateString("bn-BD",{month:"short"}),value:db.payments.filter(p=>p.date.startsWith(key)).reduce((a,p)=>a+Number(p.amount||0),0)+db.incomes.filter(p=>p.date.startsWith(key)).reduce((a,p)=>a+Number(p.amount||0),0)}}),mm=Math.max(...monthly.map(x=>x.value),1);$("#monthlyChart").innerHTML=monthly.map(x=>`<div class=chartcol><div class=chartvalue>${money(x.value)}</div><div class=chartbar><i style=\"height:${Math.max(4,x.value/mm*100)}%\"></i></div><small>${x.label}</small></div>`).join("");
 const od=overdue.slice(0,7);$("#overduePreview").innerHTML=od.length?od.map(l=>{let x=info(l);return `<div class=queue><div><b>${esc(l.customerName)}</b><small>${esc(l.name)} · ${x.late} দিন overdue · ${money(x.due*l.per)} বাকি</small></div><button class="btn alt collect" data-id="${l.id}">Collect</button></div>`}).join(""):"<div class=empty>কোনো Overdue Account নেই</div>";
 renderCustomers();renderLoans();renderDps();renderPayments();renderDue();renderSchedule();renderReports();renderExpenses();renderIncomes();loadSettings();
}
function renderCustomers(){let q=( $("#customerSearch")?.value||"").toLowerCase(),a=db.customers.filter(c=>(c.name+" "+c.phone+" "+c.address).toLowerCase().includes(q));$("#customerTable").innerHTML=a.length?`<table><tr><th>নাম</th><th>মোবাইল</th><th>ঠিকানা</th><th>কিস্তি</th><th>DPS</th><th></th></tr>${a.map(c=>`<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.phone)}</td><td>${esc(c.address)}</td><td>${db.loans.filter(l=>l.customerId===c.id).length}</td><td>${db.dps.filter(d=>d.customerId===c.id).length}</td><td><button class="btn alt viewCustomer" data-id="${c.id}">Profile</button></td></tr>`).join("")}</table>`:"<div class=empty>কোনো Customer নেই</div>"}
function renderLoans(){let q=( $("#loanSearch")?.value||"").toLowerCase(),f=$("#loanFilter")?.value||"all",a=db.loans.filter(l=>(l.name+" "+l.customerName+" "+(l.purpose||"")).toLowerCase().includes(q)).filter(l=>f==="all"||(f==="active"&&info(l).due)||(f==="done"&&!info(l).due)||(f==="overdue"&&info(l).overdue));$("#loanTable").innerHTML=a.length?`<table><tr><th>Account</th><th>Customer</th><th>Per</th><th>Progress</th><th>Next Due</th><th>Status</th><th></th></tr>${a.map(l=>{let x=info(l),pc=x.paid/Number(l.count)*100,status=!x.due?`<span class="badge paid">সম্পূর্ণ</span>`:x.overdue?`<span class="badge over">Overdue ${x.late}d</span>`:`<span class="badge due">চলমান</span>`;return `<tr><td><b>${esc(l.name)}</b><small class=sub>${esc(l.purpose||"")}</small></td><td>${esc(l.customerName)}</td><td>${money(l.per)}</td><td>${x.paid}/${l.count}<div class=progress><i style=\"width:${Math.min(100,pc)}%\"></i></div></td><td>${x.due?x.nextDate:"—"}</td><td>${status}</td><td><button class="btn alt collect" data-id="${l.id}">Collect</button> <button class="btn icon loanView" data-id="${l.id}">View</button></td></tr>`}).join("")}</table>`:"<div class=empty>কোনো Kisti Account নেই</div>"}
function renderDps(){let total=db.dps.reduce((a,d)=>a+Number(d.monthly)*Number(d.months),0),paid=db.dpsPayments.reduce((a,p)=>a+Number(p.amount||0),0),mat=db.dps.reduce((a,d)=>a+Number(d.monthly)*Number(d.months)*(1+Number(d.rate||0)/100),0);$("#dTotal").textContent=money(total);$("#dPaid").textContent=money(paid);$("#dDue").textContent=money(Math.max(0,total-paid));$("#dMat").textContent=money(mat);$("#dpsTable").innerHTML=db.dps.length?`<table><tr><th>Plan</th><th>Customer</th><th>Monthly</th><th>Progress</th><th>Maturity</th><th>Status</th><th></th></tr>${db.dps.map(d=>{let x=dInfo(d),pc=x.paid/d.months*100;return `<tr><td><b>${esc(d.name)}</b></td><td>${esc(d.customerName)}</td><td>${money(d.monthly)}</td><td>${x.paid}/${d.months}<div class=progress><i style=\"width:${Math.min(100,pc)}%\"></i></div></td><td>${money(d.monthly*d.months*(1+Number(d.rate||0)/100))}</td><td><span class="badge ${x.due?'due':'paid'}">${x.due?'চলমান':'সম্পূর্ণ'}</span></td><td><button class="btn alt dcollect" data-id="${d.id}">Deposit</button> <button class="btn icon dpsView" data-id="${d.id}">View</button></td></tr>`}).join("")}</table>`:"<div class=empty>কোনো DPS নেই</div>"}
function renderPayments(){let q=( $("#paymentSearch")?.value||"").toLowerCase(),a=db.payments.filter(p=>(p.loanName+" "+p.date+" "+(p.method||"")).toLowerCase().includes(q));$("#paymentTable").innerHTML=a.length?`<table><tr><th>Date</th><th>Account</th><th>No</th><th>Amount</th><th>Method</th><th></th></tr>${a.slice().reverse().map(p=>`<tr><td>${p.date}</td><td>${esc(p.loanName)}</td><td>${p.no}</td><td>${money(p.amount)}</td><td>${esc(p.method||"Cash")}</td><td><button class="btn icon receipt" data-id="${p.id}">Receipt</button> <button class="btn icon editPayment" data-id="${p.id}">✏ Edit</button> <button class="btn danger deletePayment" data-id="${p.id}">Delete</button></td></tr>`).join("")}</table>`:"<div class=empty>কোনো Payment নেই</div>"}
function renderDue(){let q=( $("#dueSearch")?.value||"").toLowerCase(),a=[];db.loans.forEach(l=>{let x=info(l);if(x.due)a.push({id:l.id,name:l.name,customer:l.customerName,no:x.next,amount:l.per,date:x.nextDate,overdue:x.overdue,late:x.late})});a=a.filter(r=>(r.name+" "+r.customer).toLowerCase().includes(q)).sort((a,b)=>String(a.date).localeCompare(String(b.date)));$("#dueTable").innerHTML=a.length?`<table><tr><th>Account</th><th>Customer</th><th>No</th><th>Amount</th><th>Due Date</th><th>Status</th><th></th></tr>${a.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.customer)}</td><td>${r.no}</td><td>${money(r.amount)}</td><td>${r.date}</td><td>${r.overdue?`<span class="badge over">${r.late} দিন Overdue</span>`:`<span class="badge due">Upcoming</span>`}</td><td><button class="btn alt collect" data-id="${r.id}">Collect</button></td></tr>`).join("")}</table>`:"<div class=empty>কোনো Due নেই</div>"}
function renderExpenses(){let q=( $("#expenseSearch")?.value||"").toLowerCase(),a=db.expenses.filter(e=>(e.title+" "+e.category+" "+e.date).toLowerCase().includes(q));$("#expenseTable").innerHTML=a.length?`<table><tr><th>Date</th><th>খাত</th><th>বিবরণ</th><th>Amount</th><th></th></tr>${a.slice().reverse().map(e=>`<tr><td>${e.date}</td><td>${esc(e.category)}</td><td>${esc(e.title)}</td><td>${money(e.amount)}</td><td><button class="btn danger deleteExpense" data-id="${e.id}">Delete</button></td></tr>`).join("")}</table>`:"<div class=empty>কোনো খরচ নেই</div>"}
function renderIncomes(){let q=( $("#incomeSearch")?.value||"").toLowerCase(),a=db.incomes.filter(e=>(e.title+" "+e.category+" "+e.date).toLowerCase().includes(q));$("#incomeTable").innerHTML=a.length?`<table><tr><th>Date</th><th>খাত</th><th>বিবরণ</th><th>Amount</th><th></th></tr>${a.slice().reverse().map(e=>`<tr><td>${e.date}</td><td>${esc(e.category)}</td><td>${esc(e.title)}</td><td>${money(e.amount)}</td><td><button class="btn danger deleteIncome" data-id="${e.id}">Delete</button></td></tr>`).join("")}</table>`:"<div class=empty>কোনো অন্যান্য আয় নেই</div>"}
function renderReports(){let s=sums(),over=db.loans.filter(l=>info(l).overdue).length,tx=db.payments.length+db.dpsPayments.length+db.expenses.length+db.incomes.length;let m={};[...db.payments.map(p=>({d:p.date,a:p.amount,t:"কিস্তি"})),...db.incomes.map(p=>({d:p.date,a:p.amount,t:"অন্যান্য আয়"})),...db.expenses.map(p=>({d:p.date,a:p.amount,t:"খরচ"}))].forEach(x=>{let k=x.d.slice(0,7);m[k]??={i:0,e:0};if(x.t==="খরচ")m[k].e+=Number(x.a);else m[k].i+=Number(x.a)});let months=Object.keys(m).sort().slice(-6);$("#report").innerHTML=`<div class=grid4><div class=kpi><small>Kisti Collection</small><b>${money(s.collection)}</b></div><div class=kpi><small>Other Income</small><b>${money(s.income)}</b></div><div class=kpi><small>DPS Deposited</small><b>${money(s.dps)}</b></div><div class=kpi><small>Outstanding</small><b>${money(s.outstanding)}</b></div></div><br><div class=grid4><div class=kpi><small>Business Expense</small><b>${money(s.expenses)}</b></div><div class=kpi><small>Net Cash</small><b>${money(s.net)}</b></div><div class=kpi><small>Overdue Accounts</small><b>${over}</b></div><div class=kpi><small>Total Transactions</small><b>${tx}</b></div></div><br><h3>মাসভিত্তিক আয়-খরচ</h3><table><tr><th>মাস</th><th>আয়</th><th>খরচ</th><th>নিট</th></tr>${months.map(k=>`<tr><td>${k}</td><td>${money(m[k].i)}</td><td>${money(m[k].e)}</td><td>${money(m[k].i-m[k].e)}</td></tr>`).join("")||`<tr><td colspan=4 class=empty>ডাটা নেই</td></tr>`}</table>`}
function loadSettings(){let f=$("#settingsForm");if(f){let s=db.settings;f.business.value=s.business||"";f.phone.value=s.phone||"";f.address.value=s.address||"";f.footer.value=s.footer||"";f.dailyTarget.value=s.dailyTarget||0}}
function addCustomer(c=null){modal(c?"Customer Edit":"নতুন Customer",`<form id=form class=form><input type=hidden name=id value="${c?.id||""}"><label>নাম<input name=name value="${esc(c?.name||"")}" required></label><label>মোবাইল<input name=phone value="${esc(c?.phone||"")}"></label><label>ঠিকানা<input name=address value="${esc(c?.address||"")}"></label><label>নোট<input name=note value="${esc(c?.note||"")}"></label><button class=btn>Save</button></form>`)}
function addLoan(l=null){modal(l?"Kisti Edit":"নতুন Kisti Account",`<form id=form class=form><input type=hidden name=id value="${l?.id||""}"><label>Customer<select name=customer>${customerOptions(l?.customerId)}</select></label><label>Account Name<input name=name value="${esc(l?.name||"")}" required></label><label>Purpose / উদ্দেশ্য<input name=purpose value="${esc(l?.purpose||"")}"></label><div class=grid3><label>মোট কিস্তি<input name=count type=number min=1 value="${l?.count||""}" required></label><label>প্রতি কিস্তি<input name=per type=number min=1 value="${l?.per||""}" required></label><label>মোট টার্গেট<input name=total type=number min=0 value="${l?.total||""}"></label></div><div class=grid2><label>Start Date<input name=start type=date value="${l?.start||today()}"></label><label>কিস্তির ব্যবধান (দিন)<input name=frequencyDays type=number min=1 value="${l?.frequencyDays||30}"></label><label>Overdue Late Fee (৳)<input name=lateFee type=number min=0 value="${l?.lateFee||0}"></label></div><button class=btn>${l?"Update":"Create Account"}</button></form>`)}
function addDps(d=null){modal(d?"DPS Edit":"নতুন DPS",`<form id=form class=form><input type=hidden name=id value="${d?.id||""}"><label>Customer<select name=customer>${customerOptions(d?.customerId)}</select></label><label>DPS Name<input name=name value="${esc(d?.name||"")}" required></label><div class=grid2><label>মাসিক জমা<input name=monthly type=number min=1 value="${d?.monthly||""}" required></label><label>মেয়াদ (মাস)<input name=months type=number min=1 value="${d?.months||""}" required></label></div><div class=grid2><label>মুনাফা %<input name=rate type=number step=.01 value="${d?.rate||0}"></label><label>Start<input name=start type=date value="${d?.start||today()}"></label></div><button class=btn>${d?"Update":"Create DPS"}</button></form>`)}
function addExpense(e=null){modal(e?"Expense Edit":"নতুন খরচ",`<form id=form class=form><input type=hidden name=id value="${e?.id||""}"><div class=grid2><label>তারিখ<input name=date type=date value="${e?.date||today()}"></label><label>খাত<input name=category value="${esc(e?.category||"")}" placeholder="অফিস / যাতায়াত" required></label></div><label>বিবরণ<input name=title value="${esc(e?.title||"")}" required></label><label>পরিমাণ<input name=amount type=number min=1 value="${e?.amount||""}" required></label><button class=btn>Save Expense</button></form>`)}
function addIncome(i=null){modal(i?"Income Edit":"নতুন অন্যান্য আয়",`<form id=form class=form><input type=hidden name=id value="${i?.id||""}"><div class=grid2><label>তারিখ<input name=date type=date value="${i?.date||today()}"></label><label>খাত<input name=category value="${esc(i?.category||"")}" placeholder="কমিশন / বিক্রয় / অন্যান্য" required></label></div><label>বিবরণ<input name=title value="${esc(i?.title||"")}" required></label><label>পরিমাণ<input name=amount type=number min=1 value="${i?.amount||""}" required></label><button class=btn>Save Income</button></form>`)}
function collectLoan(id){let l=db.loans.find(x=>x.id===id);if(!l)return;let n=info(l).paid+1;modal("কিস্তি জমা",`<form id=form class=form><input type=hidden name=loan value="${id}"><div class=grid3><label>কিস্তি নং<input name=no type=number min=1 value="${n}"></label><label>তারিখ<input name=date type=date value="${today()}"></label><label>পরিমাণ<input name=amount type=number min=1 value="${l.per}"></label></div><label>Payment Method<select name=method><option>Cash</option><option>bKash</option><option>Nagad</option><option>Bank</option><option>Other</option></select></label><label>নোট<input name=note></label><button class=btn>Save Payment</button></form>`)}
function collectDps(id){let d=db.dps.find(x=>x.id===id);if(!d)return;let n=dInfo(d).paid+1;modal("DPS Deposit",`<form id=form class=form><input type=hidden name=dps value="${id}"><div class=grid3><label>কিস্তি নং<input name=no type=number value="${n}"></label><label>তারিখ<input name=date type=date value="${today()}"></label><label>জমার পরিমাণ<input name=amount type=number value="${d.monthly}"></label></div><label>Payment Method<select name=method><option>Cash</option><option>bKash</option><option>Nagad</option><option>Bank</option><option>Other</option></select></label><label>নোট<input name=note></label><button class=btn>Save Deposit</button></form>`)}
function viewLoan(id){let l=db.loans.find(x=>x.id===id);if(!l)return;let x=info(l),p=db.payments.filter(y=>y.loanId===id).slice().reverse();modal("Account Details",`<div class=grid4><div class=kpi><small>Paid</small><b>${x.paid}/${l.count}</b></div><div class=kpi><small>Collected</small><b>${money(x.amount)}</b></div><div class=kpi><small>Outstanding</small><b>${money(x.due*l.per)}</b></div><div class=kpi><small>Next Due</small><b>${x.nextDate||"—"}</b></div></div><br><div class=notice><b>${esc(l.customerName)}</b> · ${esc(l.name)}<br>Purpose: ${esc(l.purpose||"—")} · Per: ${money(l.per)}</div><br><div class=actions><button class="btn" data-edit-loan="${l.id}">✏ Edit Account</button><button class="btn alt" data-statement="${l.id}">🧾 Statement</button><button class="btn alt" data-schedule-loan="${l.id}">📅 Schedule</button><button class="btn danger" data-delete-loan="${l.id}">Delete</button></div><br><table><tr><th>No</th><th>Date</th><th>Amount</th><th>Method</th></tr>${p.map(v=>`<tr><td>${v.no}</td><td>${v.date}</td><td>${money(v.amount)}</td><td>${esc(v.method||"Cash")}</td></tr>`).join("")||`<tr><td colspan=4 class=empty>Payment নেই</td></tr>`}</table>`)}
function viewDps(id){let d=db.dps.find(x=>x.id===id);if(!d)return;let p=db.dpsPayments.filter(x=>x.dpsId===id).slice().reverse(),x=dInfo(d);modal("DPS Details",`<div class=grid4><div class=kpi><small>Paid</small><b>${x.paid}/${d.months}</b></div><div class=kpi><small>Deposited</small><b>${money(x.amount)}</b></div><div class=kpi><small>Remaining</small><b>${money(x.due*d.monthly)}</b></div><div class=kpi><small>Maturity</small><b>${money(d.monthly*d.months*(1+d.rate/100))}</b></div></div><br><div class=actions><button class="btn" data-edit-dps="${d.id}">✏ Edit DPS</button><button class="btn danger" data-delete-dps="${d.id}">Delete</button></div><br><table><tr><th>No</th><th>Date</th><th>Amount</th><th>Method</th></tr>${p.map(v=>`<tr><td>${v.no}</td><td>${v.date}</td><td>${money(v.amount)}</td><td>${esc(v.method||"Cash")}</td></tr>`).join("")||`<tr><td colspan=4 class=empty>Deposit নেই</td></tr>`}</table>`)}
function viewCustomer(id){let c=db.customers.find(x=>x.id===id);if(!c)return;let loans=db.loans.filter(l=>l.customerId===id),dps=db.dps.filter(d=>d.customerId===id),col=loans.reduce((a,l)=>a+info(l).amount,0),dp=dps.reduce((a,d)=>a+dInfo(d).amount,0);modal("Customer Profile",`<div class=grid4><div class=kpi><small>Customer</small><b>${esc(c.name)}</b></div><div class=kpi><small>Kisti Collection</small><b>${money(col)}</b></div><div class=kpi><small>DPS Deposit</small><b>${money(dp)}</b></div><div class=kpi><small>Accounts</small><b>${loans.length}</b></div></div><br><div class=notice>📞 ${esc(c.phone||"—")} · ${esc(c.address||"—")}<br>${esc(c.note||"")}</div><br><div class=actions>${c.phone?`<a class="btn" href="tel:${encodeURIComponent(c.phone)}">📞 Call</a><a class="btn alt" target="_blank" href="https://wa.me/${String(c.phone).replace(/\D/g,"")}">💬 WhatsApp</a>`:""}<button class="btn" data-edit-customer="${c.id}">✏ Edit</button><button class="btn danger" data-delete-customer="${c.id}">Delete</button></div><br><h3>Kisti Accounts</h3>${loans.map(l=>`<div class=queue><div><b>${esc(l.name)}</b><small>${info(l).paid}/${l.count} · ${money(info(l).due*l.per)} বাকি</small></div><button class="btn alt collect" data-id="${l.id}">Collect</button></div>`).join("")||`<div class=empty>কোনো Kisti নেই</div>`}`)}
function scheduleLoan(id){let l=db.loans.find(x=>x.id===id);if(!l)return;let paid=new Set(db.payments.filter(p=>p.loanId===id).map(p=>Number(p.no))),rows=Array.from({length:Number(l.count)},(_,i)=>{let no=i+1,d=dueDate(l,no),ok=paid.has(no),late=!ok&&d<today();return{no,date:d,amount:Number(l.per||0),ok,late}});let w=window.open("","_blank","width=820,height=900");if(!w)return;w.document.write(`<html><head><title>Installment Schedule</title><style>body{font-family:Arial;padding:24px}h1{text-align:center}.meta{padding:12px;background:#f3f5f7;border-radius:8px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #ccc;padding:8px;text-align:left}.paid{color:#087f5b;font-weight:bold}.late{color:#c92a2a;font-weight:bold}@media print{button{display:none}}</style></head><body><h1>${esc(db.settings.business)}</h1><div class=meta><b>Customer:</b> ${esc(l.customerName)}<br><b>Account:</b> ${esc(l.name)}<br><b>Total:</b> ${l.count} × ${money(l.per)}</div><table><tr><th>No</th><th>Due Date</th><th>Amount</th><th>Status</th></tr>${rows.map(r=>`<tr><td>${r.no}</td><td>${r.date}</td><td>${money(r.amount)}</td><td class="${r.ok?'paid':r.late?'late':''}">${r.ok?'Paid':r.late?'Overdue':'Upcoming'}</td></tr>`).join('')}</table><p>${esc(db.settings.footer||'')}</p><script>window.print()<\/script></body></html>`);w.document.close()}
function monthlySummary(){let m={};[...db.payments.map(p=>({d:p.date,a:p.amount,t:'কিস্তি'})),...db.incomes.map(p=>({d:p.date,a:p.amount,t:'আয়'})),...db.expenses.map(p=>({d:p.date,a:p.amount,t:'খরচ'}))].forEach(x=>{let k=x.d.slice(0,7);m[k]??={i:0,e:0,c:0};if(x.t==='খরচ')m[k].e+=Number(x.a);else if(x.t==='কিস্তি')m[k].c+=Number(x.a);else m[k].i+=Number(x.a)});return m}
function renderSchedule(){let q=($('#scheduleSearch')?.value||'').toLowerCase(),rows=[];db.loans.forEach(l=>{if(q&&!(`${l.name} ${l.customerName}`.toLowerCase().includes(q)))return;let paid=new Set(db.payments.filter(p=>p.loanId===l.id).map(p=>Number(p.no)));for(let i=1;i<=Number(l.count);i++){let d=dueDate(l,i);rows.push({loan:l,name:l.name,customer:l.customerName,no:i,date:d,amount:l.per,ok:paid.has(i),late:!paid.has(i)&&d<today()})}});rows.sort((a,b)=>a.date.localeCompare(b.date));$('#scheduleTable').innerHTML=rows.length?`<table><tr><th>Account</th><th>Customer</th><th>No</th><th>Date</th><th>Amount</th><th>Status</th></tr>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${esc(r.customer)}</td><td>${r.no}</td><td>${r.date}</td><td>${money(r.amount)}</td><td>${r.ok?'<span class="badge paid">Paid</span>':r.late?'<span class="badge over">Overdue</span>':'<span class="badge due">Upcoming</span>'}</td></tr>`).join('')}</table>`:'<div class=empty>কোনো Schedule নেই</div>'}
function statement(id){let l=db.loans.find(x=>x.id===id);if(!l)return;let p=db.payments.filter(x=>x.loanId===id),x=info(l),s=db.settings,w=window.open("","_blank","width=720,height=850");if(!w)return;w.document.write(`<html><head><title>Statement</title><style>body{font-family:Arial;padding:28px}h1{text-align:center}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.box{border:1px solid #bbb;padding:12px}.row{display:flex;justify-content:space-between;margin:8px 0}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ccc;padding:8px;text-align:left}@media print{button{display:none}}</style></head><body><h1>${esc(s.business)}</h1><p style="text-align:center">Kisti Account Statement</p><p><b>Customer:</b> ${esc(l.customerName)} &nbsp; <b>Account:</b> ${esc(l.name)}</p><div class=grid><div class=box>Paid<br><b>${x.paid}/${l.count}</b></div><div class=box>Collected<br><b>${money(x.amount)}</b></div><div class=box>Outstanding<br><b>${money(x.due*l.per)}</b></div></div><table><tr><th>No</th><th>Date</th><th>Amount</th><th>Method</th><th>Note</th></tr>${p.map(v=>`<tr><td>${v.no}</td><td>${v.date}</td><td>${money(v.amount)}</td><td>${esc(v.method||"Cash")}</td><td>${esc(v.note||"")}</td></tr>`).join("")}</table><p>${esc(s.footer||"")}</p><script>window.print()<\/script></body></html>`);w.document.close()}
function receipt(id){let p=db.payments.find(x=>x.id===id);if(!p)return;let l=db.loans.find(x=>x.id===p.loanId),s=db.settings,w=window.open("","_blank","width=520,height=700");if(!w)return;w.document.write(`<html><head><title>Receipt</title><style>body{font-family:Arial;padding:30px}h1{text-align:center}.line{border-top:1px dashed #777;margin:18px 0}.row{display:flex;justify-content:space-between;margin:10px 0}</style></head><body><h1>${esc(s.business)}</h1><p style="text-align:center">Payment Receipt</p><div class=line></div><div class=row><b>Customer</b><span>${esc(l?.customerName||"")}</span></div><div class=row><b>Account</b><span>${esc(p.loanName)}</span></div><div class=row><b>Installment</b><span>${p.no}</span></div><div class=row><b>Date</b><span>${p.date}</span></div><div class=row><b>Method</b><span>${esc(p.method||"Cash")}</span></div><div class=row><b>Amount</b><span>${money(p.amount)}</span></div><div class=line></div><p>${esc(p.note||"")}</p><p>${esc(s.footer||"")}</p><script>window.print()<\/script></body></html>`);w.document.close()}
function editPayment(id){let p=db.payments.find(x=>x.id===id);if(!p)return;modal("Edit Payment",`<form id=form class=form><input type=hidden name=id value="${p.id}"><label>Account<select name=loan>${db.loans.map(l=>`<option value="${l.id}" ${l.id===p.loanId?'selected':''}>${esc(l.customerName)} — ${esc(l.name)}</option>`).join('')}</select></label><div class=grid3><label>কিস্তি নং<input name=no type=number min=1 value="${p.no}"></label><label>তারিখ<input name=date type=date value="${p.date}"></label><label>পরিমাণ<input name=amount type=number min=1 value="${p.amount}"></label></div><label>Payment Method<select name=method>${['Cash','bKash','Nagad','Bank','Other'].map(m=>`<option ${m===(p.method||'Cash')?'selected':''}>${m}</option>`).join('')}</select></label><label>নোট<input name=note value="${esc(p.note||'')}"></label><button class=btn>Update Payment</button></form>`)}
function renderLedger(){const sel=$('#ledgerCustomer'),search=($('#ledgerSearch')?.value||'').toLowerCase();if(!sel)return;if(!sel.dataset.ready){sel.innerHTML='<option value="">গ্রাহক নির্বাচন করুন</option>'+db.customers.map(c=>`<option value="${c.id}">${esc(c.name)} — ${esc(c.phone||'')}</option>`).join('');sel.dataset.ready='1'}else{const current=sel.value;sel.innerHTML='<option value="">গ্রাহক নির্বাচন করুন</option>'+db.customers.map(c=>`<option value="${c.id}" ${String(c.id)===String(current)?'selected':''}>${esc(c.name)} — ${esc(c.phone||'')}</option>`).join('')}if(search&&!sel.value){const c=db.customers.find(c=>(c.name+' '+c.phone).toLowerCase().includes(search));if(c)sel.value=String(c.id)}const id=Number(sel.value||0);if(!id){$('#ledgerSummary').innerHTML='';$('#ledgerTable').innerHTML='<div class=empty>একজন Customer নির্বাচন করুন</div>';return}const c=db.customers.find(x=>x.id===id),loans=db.loans.filter(l=>l.customerId===id),dps=db.dps.filter(d=>d.customerId===id),lp=db.payments.filter(p=>loans.some(l=>l.id===p.loanId)),dp=db.dpsPayments.filter(p=>dps.some(d=>d.id===p.dpsId)),col=lp.reduce((a,p)=>a+Number(p.amount||0),0),dpc=dp.reduce((a,p)=>a+Number(p.amount||0),0),out=loans.reduce((a,l)=>a+info(l).due*Number(l.per||0),0),over=loans.reduce((a,l)=>a+(info(l).overdue?info(l).due*Number(l.per||0):0),0);$('#ledgerSummary').innerHTML=`<div class=kpi><small>Kisti Collection</small><b>${money(col)}</b></div><div class=kpi><small>DPS Deposit</small><b>${money(dpc)}</b></div><div class=kpi><small>Outstanding</small><b>${money(out)}</b></div><div class=kpi><small>Overdue</small><b>${money(over)}</b></div>`;const rows=[...lp.map(p=>({date:p.date,type:'Kisti',name:p.loanName,no:p.no,amount:p.amount,method:p.method||'Cash',note:p.note||''})),...dp.map(p=>({date:p.date,type:'DPS',name:p.dpsName,no:p.no,amount:p.amount,method:p.method||'Cash',note:p.note||''}))].sort((a,b)=>b.date.localeCompare(a.date));$('#ledgerTable').innerHTML=`<div class=notice><b>${esc(c.name)}</b> · ${esc(c.phone||'—')} · ${esc(c.address||'—')}</div><br>${rows.length?`<table><tr><th>Date</th><th>Type</th><th>Account</th><th>No</th><th>Amount</th><th>Method</th><th>Note</th></tr>${rows.map(r=>`<tr><td>${r.date}</td><td>${r.type}</td><td>${esc(r.name)}</td><td>${r.no}</td><td>${money(r.amount)}</td><td>${esc(r.method)}</td><td>${esc(r.note)}</td></tr>`).join('')}</table>`:'<div class=empty>কোনো লেনদেন নেই</div>'}`}
function printLedger(){const id=Number($('#ledgerCustomer')?.value||0);if(!id)return toast('আগে Customer নির্বাচন করুন');const c=db.customers.find(x=>x.id===id),rows=[...db.payments.filter(p=>db.loans.some(l=>l.id===p.loanId&&l.customerId===id)).map(p=>({date:p.date,type:'Kisti',name:p.loanName,no:p.no,amount:p.amount,method:p.method||'Cash'})),...db.dpsPayments.filter(p=>db.dps.some(d=>d.id===p.dpsId&&d.customerId===id)).map(p=>({date:p.date,type:'DPS',name:p.dpsName,no:p.no,amount:p.amount,method:p.method||'Cash'}))].sort((a,b)=>b.date.localeCompare(a.date)),w=window.open('','_blank','width=760,height=850');if(!w)return;w.document.write(`<html><head><title>Customer Ledger</title><style>body{font-family:Arial;padding:28px}h1{text-align:center}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #bbb;padding:8px}th{background:#eee}.meta{padding:12px;border:1px solid #ccc}</style></head><body><h1>${esc(db.settings.business)}</h1><p style="text-align:center">Customer Ledger</p><div class=meta><b>Customer:</b> ${esc(c.name)}<br><b>Phone:</b> ${esc(c.phone||'—')}<br><b>Address:</b> ${esc(c.address||'—')}</div><table><tr><th>Date</th><th>Type</th><th>Account</th><th>No</th><th>Amount</th><th>Method</th></tr>${rows.map(r=>`<tr><td>${r.date}</td><td>${r.type}</td><td>${esc(r.name)}</td><td>${r.no}</td><td>${money(r.amount)}</td><td>${esc(r.method)}</td></tr>`).join('')}</table><p>${esc(db.settings.footer||'')}</p><script>window.print()<\/script></body></html>`);w.document.close()}
function exportCSV(){let rows=[["Type","Customer","Name","Date","Amount","No","Method","Category","Note"],...db.payments.map(p=>["Kisti",db.loans.find(l=>l.id===p.loanId)?.customerName||"",p.loanName,p.date,p.amount,p.no,p.method||"Cash","",p.note||""]),...db.dpsPayments.map(p=>["DPS",db.dps.find(d=>d.id===p.dpsId)?.customerName||"",p.dpsName,p.date,p.amount,p.no,p.method||"Cash","",p.note||""]),...db.incomes.map(e=>["Income","",e.title,e.date,e.amount,"","",e.category,""]),...db.expenses.map(e=>["Expense","",e.title,e.date,e.amount,"","",e.category,""])];let csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n"),a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="smart-kisti-full-report.csv";a.click()}

$("#printSchedule")?.addEventListener("click",()=>window.print());$("#scheduleSearch")?.addEventListener("input",renderSchedule);$("#addCustomer").onclick=()=>addCustomer();$("#addLoan").onclick=()=>addLoan();$("#addDps").onclick=()=>addDps();$("#addExpense").onclick=()=>addExpense();$("#addIncome").onclick=()=>addIncome();$("#payBtn").onclick=()=>db.loans.length?collectLoan(db.loans[0].id):toast("আগে Kisti Account তৈরি করুন");$("#dpsDeposit").onclick=()=>db.dps.length?collectDps(db.dps[0].id):toast("আগে DPS তৈরি করুন");
document.addEventListener("click",e=>{let a=e.target.closest(".collect");if(a)collectLoan(Number(a.dataset.id));let d=e.target.closest(".dcollect");if(d)collectDps(Number(d.dataset.id));let v=e.target.closest(".loanView");if(v)viewLoan(Number(v.dataset.id));let dv=e.target.closest(".dpsView");if(dv)viewDps(Number(dv.dataset.id));let c=e.target.closest(".viewCustomer");if(c)viewCustomer(Number(c.dataset.id));let r=e.target.closest(".receipt");if(r)receipt(Number(r.dataset.id));let ep=e.target.closest(".editPayment");if(ep)editPayment(Number(ep.dataset.id));let de=e.target.closest(".deleteExpense");if(de&&confirm("এই খরচটি মুছে ফেলবেন?")){db.expenses=db.expenses.filter(x=>x.id!==Number(de.dataset.id));save("খরচ মুছে দেওয়া হয়েছে")};let di=e.target.closest(".deleteIncome");if(di&&confirm("এই আয়টি মুছে ফেলবেন?")){db.incomes=db.incomes.filter(x=>x.id!==Number(di.dataset.id));save("আয় মুছে দেওয়া হয়েছে")};let dp=e.target.closest(".deletePayment");if(dp&&confirm("এই payment মুছে ফেলবেন?")){db.payments=db.payments.filter(x=>x.id!==Number(dp.dataset.id));save("Payment মুছে দেওয়া হয়েছে")};let ec=e.target.closest("[data-edit-customer]");if(ec){close();addCustomer(db.customers.find(x=>x.id===Number(ec.dataset.editCustomer)))}let dc=e.target.closest("[data-delete-customer]");if(dc&&confirm("Customer ও তার হিসাব মুছে ফেলবেন?")){let id=Number(dc.dataset.deleteCustomer);db.customers=db.customers.filter(x=>x.id!==id);db.loans=db.loans.filter(x=>x.customerId!==id);db.dps=db.dps.filter(x=>x.customerId!==id);save("Customer মুছে দেওয়া হয়েছে")};let el=e.target.closest("[data-edit-loan]");if(el){close();addLoan(db.loans.find(x=>x.id===Number(el.dataset.editLoan)))}let dl=e.target.closest("[data-delete-loan]");if(dl&&confirm("Account ও এর payment history মুছে ফেলবেন?")){let id=Number(dl.dataset.deleteLoan);db.loans=db.loans.filter(x=>x.id!==id);db.payments=db.payments.filter(x=>x.loanId!==id);close();save("Account মুছে দেওয়া হয়েছে")};let st=e.target.closest("[data-statement]");if(st)statement(Number(st.dataset.statement));let sl=e.target.closest("[data-schedule-loan]");if(sl)scheduleLoan(Number(sl.dataset.scheduleLoan));let ed=e.target.closest("[data-edit-dps]");if(ed){close();addDps(db.dps.find(x=>x.id===Number(ed.dataset.editDps)))}let dd=e.target.closest("[data-delete-dps]");if(dd&&confirm("DPS ও এর deposit history মুছে ফেলবেন?")){let id=Number(dd.dataset.deleteDps);db.dps=db.dps.filter(x=>x.id!==id);db.dpsPayments=db.dpsPayments.filter(x=>x.dpsId!==id);close();save("DPS মুছে দেওয়া হয়েছে")}});
document.addEventListener("submit",async e=>{if(e.target.id==="settingsForm"){e.preventDefault();let f=new FormData(e.target);db.settings={...db.settings,business:f.get("business"),phone:f.get("phone"),address:f.get("address"),footer:f.get("footer"),dailyTarget:+f.get("dailyTarget")||0};await save("Settings saved");return}if(e.target.id!=="form")return;e.preventDefault();let f=new FormData(e.target),title=$("#modalBody h2").textContent,id=Number(f.get("id")||0);
 if(title==="নতুন Customer"||title==="Customer Edit"){let obj={id:id||uid(),name:f.get("name"),phone:f.get("phone"),address:f.get("address"),note:f.get("note")};if(id){let old=db.customers.find(x=>x.id===id);Object.assign(old,obj);db.loans.filter(l=>l.customerId===id).forEach(l=>l.customerName=obj.name);db.dps.filter(d=>d.customerId===id).forEach(d=>d.customerName=obj.name)}else db.customers.push(obj)}
 else if(title==="নতুন Kisti Account"||title==="Kisti Edit"){let c=db.customers.find(x=>String(x.id)===f.get("customer")),obj={id:id||uid(),customerId:c?.id||null,customerName:c?.name||"সাধারণ",name:f.get("name"),purpose:f.get("purpose"),count:+f.get("count"),per:+f.get("per"),total:+f.get("total")||(+f.get("count")*+f.get("per")),start:f.get("start"),frequencyDays:+f.get("frequencyDays")||30,lateFee:+f.get("lateFee")||0};if(id)Object.assign(db.loans.find(x=>x.id===id),obj);else db.loans.push(obj)}
 else if(title==="নতুন DPS"||title==="DPS Edit"){let c=db.customers.find(x=>String(x.id)===f.get("customer")),obj={id:id||uid(),customerId:c?.id||null,customerName:c?.name||"সাধারণ",name:f.get("name"),monthly:+f.get("monthly"),months:+f.get("months"),rate:+f.get("rate"),start:f.get("start")};if(id)Object.assign(db.dps.find(x=>x.id===id),obj);else db.dps.push(obj)}
 else if(title==="নতুন খরচ"||title==="Expense Edit"){let obj={id:id||uid(),date:f.get("date"),category:f.get("category"),title:f.get("title"),amount:+f.get("amount")};if(id)Object.assign(db.expenses.find(x=>x.id===id),obj);else db.expenses.push(obj)}
 else if(title==="নতুন অন্যান্য আয়"||title==="Income Edit"){let obj={id:id||uid(),date:f.get("date"),category:f.get("category"),title:f.get("title"),amount:+f.get("amount")};if(id)Object.assign(db.incomes.find(x=>x.id===id),obj);else db.incomes.push(obj)}
 else if(title==="Edit Payment"){let p=db.payments.find(x=>x.id===id);if(p){let loanId=+f.get("loan"),no=+f.get("no");if(db.payments.some(x=>x.id!==id&&x.loanId===loanId&&x.no===no))return toast("এই কিস্তি নম্বর ইতোমধ্যে আছে");let l=db.loans.find(x=>x.id===loanId);Object.assign(p,{loanId,loanName:l?.name||p.loanName,no,date:f.get("date"),amount:+f.get("amount"),method:f.get("method"),note:f.get("note")})}}
 else if(title==="কিস্তি জমা"){let l=db.loans.find(x=>x.id==f.get("loan")),no=+f.get("no");if(!l)return;if(db.payments.some(p=>p.loanId===l.id&&p.no===no))return toast("এই কিস্তি ইতোমধ্যে জমা হয়েছে");db.payments.push({id:uid(),loanId:l.id,loanName:l.name,no,date:f.get("date"),amount:+f.get("amount"),method:f.get("method"),note:f.get("note")})}
 else if(title==="DPS Deposit"){let d=db.dps.find(x=>x.id==f.get("dps")),no=+f.get("no");if(!d)return;if(db.dpsPayments.some(p=>p.dpsId===d.id&&p.no===no))return toast("এই DPS কিস্তি ইতোমধ্যে জমা হয়েছে");db.dpsPayments.push({id:uid(),dpsId:d.id,dpsName:d.name,no,date:f.get("date"),amount:+f.get("amount"),method:f.get("method"),note:f.get("note")})}
 close();await save("তথ্য সংরক্ষণ হয়েছে")});
$$('.nav').forEach(n=>n.onclick=()=>{$$('.nav').forEach(x=>x.classList.remove('active'));n.classList.add('active');$$('.page').forEach(p=>p.classList.remove('active'));$('#'+n.dataset.page).classList.add('active');$('#title').textContent=n.innerText.trim()});
["customerSearch","loanSearch","paymentSearch","dueSearch","expenseSearch","incomeSearch"].forEach(id=>$("#"+id)?.addEventListener("input",()=>({customerSearch:renderCustomers,loanSearch:renderLoans,paymentSearch:renderPayments,dueSearch:renderDue,expenseSearch:renderExpenses,incomeSearch:renderIncomes}[id])()));$("#loanFilter")?.addEventListener("change",renderLoans);
$("#backupBtn").onclick=async()=>{let p=await window.desktopAPI.backup();if(p)toast("Backup saved")};$("#restoreBtn").onclick=async()=>{if(confirm("Backup restore করলে বর্তমান data replace হবে। Continue?")){if(await window.desktopAPI.restore()){db=await window.desktopAPI.load();normalize();render();toast("Restore complete")}}};$("#openFolder").onclick=()=>window.desktopAPI.folder();$("#copyDue").onclick=()=>{navigator.clipboard?.writeText($("#dueTable").innerText);toast("Due list copied")};$("#printPayments").onclick=()=>window.print();$("#printReport").onclick=()=>window.print();$("#csvBtn").onclick=exportCSV;
$("#globalSearch")?.addEventListener("input",e=>{let q=e.target.value.trim().toLowerCase();if(!q)return;let c=db.customers.find(x=>(x.name+" "+x.phone).toLowerCase().includes(q));if(c){viewCustomer(c.id);return}let l=db.loans.find(x=>(x.name+" "+x.customerName).toLowerCase().includes(q));if(l){$$('.nav').find(n=>n.dataset.page==='kisti')?.click();$("#loanSearch").value=q;renderLoans()}});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="b"){e.preventDefault();$("#backupBtn").click()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="p"){e.preventDefault();window.print()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#globalSearch")?.focus()}});

function getCustomerRisk(c){
  const loans=db.loans.filter(l=>l.customerId===c.id);
  const overdue=loans.filter(l=>info(l).overdue).length;
  const dueAmount=loans.reduce((a,l)=>a+info(l).due*Number(l.per||0),0);
  return {score:overdue*35+Math.min(65,Math.round(dueAmount/1000)),overdue,dueAmount};
}
function renderSmart(){
  const totalTarget=db.loans.reduce((a,l)=>a+Number(l.count||0)*Number(l.per||0),0);
  const collected=db.payments.reduce((a,p)=>a+Number(p.amount||0),0);
  const rate=totalTarget?Math.min(100,Math.round(collected/totalTarget*100)):0;
  const risks=db.customers.filter(c=>getCustomerRisk(c).score>=50).length;
  const next=db.loans.map(l=>({l,x:info(l)})).filter(x=>x.x.due).sort((a,b)=>String(a.x.nextDate).localeCompare(String(b.x.nextDate)))[0];
  const all=[...db.payments.map(x=>x.date),...db.dpsPayments.map(x=>x.date),...db.incomes.map(x=>x.date),...db.expenses.map(x=>x.date)].filter(Boolean).sort();
  const set=(id,v)=>{if($(id))$(id).textContent=v};
  set("xCollectionRate",rate+"%");set("xRisk",risks);set("xNextCollection",next?next.x.nextDate:"—");set("xLastActivity",all.length?all[all.length-1]:"—");
  renderCollectionCenter();renderInsights();
}
function renderCollectionCenter(){
  const todayD=today(), q=($('#collectionSearch')?.value||'').toLowerCase();
  let rows=[];
  db.loans.forEach(l=>{const x=info(l);if(!x.due)return;const c=db.customers.find(c=>c.id===l.customerId);const match=`${l.name} ${l.customerName} ${c?.phone||''}`.toLowerCase().includes(q);if(!match)return;const status=x.overdue?'Overdue':x.nextDate===todayD?'Today':'Upcoming';rows.push({l,x,c,status})});
  rows.sort((a,b)=>a.x.overdue===b.x.overdue?String(a.x.nextDate).localeCompare(String(b.x.nextDate)):a.x.overdue?-1:1);
  const todayDue=rows.filter(r=>r.x.nextDate===todayD).reduce((a,r)=>a+Number(r.l.per||0),0);
  const over=rows.filter(r=>r.x.overdue).reduce((a,r)=>a+r.x.due*Number(r.l.per||0),0);
  const collected=db.payments.filter(p=>p.date===todayD).reduce((a,p)=>a+Number(p.amount||0),0);
  const rate=todayDue?Math.min(100,Math.round(collected/todayDue*100)):0;
  const set=(id,v)=>{if($(id))$(id).textContent=v};set('cTodayDue',money(todayDue));set('cOverdue',money(over));set('cCollected',money(collected));set('cRate',rate+'%');
  $('#collectionTable').innerHTML=rows.length?`<table><tr><th>Account</th><th>Customer</th><th>Due</th><th>Date</th><th>Status</th><th>Action</th></tr>${rows.map(r=>`<tr><td><b>${esc(r.l.name)}</b></td><td>${esc(r.l.customerName)}<small class=sub>${esc(r.c?.phone||'')}</small></td><td>${money(r.l.per)}</td><td>${r.x.nextDate}</td><td><span class="badge ${r.status==='Overdue'?'over':r.status==='Today'?'due':'paid'}">${r.status==='Overdue'?r.x.late+' দিন Overdue':r.status}</span></td><td><button class="btn collect" data-id="${r.l.id}">Collect</button>${r.c?.phone?` <a class="btn alt" target="_blank" href="https://wa.me/${String(r.c.phone).replace(/\D/g,'')}?text=${encodeURIComponent('আসসালামু আলাইকুম, '+r.c.name+'। আপনার '+r.l.name+' এর '+r.x.next+' নম্বর কিস্তি '+money(r.l.per)+' জমা দেওয়ার সময় হয়েছে। ধন্যবাদ।')}">WhatsApp</a>`:''}</td></tr>`).join('')}</table>`:'<div class=empty>আজ/আগামী কোনো Due নেই</div>';
}
function renderInsights(){
  const s=sums(), totalTarget=db.loans.reduce((a,l)=>a+Number(l.count||0)*Number(l.per||0),0),colRate=totalTarget?Math.round(s.collection/totalTarget*100):0;
  const avg=db.customers.length?Math.round(s.collection/db.customers.length):0;
  const overdue=db.loans.filter(l=>info(l).overdue), top=db.customers.map(c=>({c,...getCustomerRisk(c),col:db.loans.filter(l=>l.customerId===c.id).reduce((a,l)=>a+info(l).amount,0)})).sort((a,b)=>b.col-a.col).slice(0,6);
  const methods={};db.payments.forEach(p=>methods[p.method||'Cash']=(methods[p.method||'Cash']||0)+Number(p.amount||0));
  $('#insightCards').innerHTML=[['Collection Rate',colRate+'%','মোট কিস্তি টার্গেটের তুলনায়'],['Avg Collection/Customer',money(avg),'গ্রাহকপ্রতি গড় আদায়'],['Overdue Exposure',money(overdue.reduce((a,l)=>a+info(l).due*l.per,0)),'বর্তমান বকেয়া কিস্তি'],['Net Cash',money(s.net),'সব আয় − খরচ'],['Transactions',db.payments.length+db.dpsPayments.length+db.incomes.length+db.expenses.length,'মোট লেনদেন'],['Active Accounts',db.loans.filter(l=>info(l).due).length,'চলমান কিস্তি']].map(x=>`<div class=kpi><small>${x[0]}</small><b>${x[1]}</b><small>${x[2]}</small></div>`).join('');
  $('#topCustomers').innerHTML=top.length?top.map((x,i)=>`<div class=queue><div><b>${i+1}. ${esc(x.c.name)}</b><small>${money(x.col)} collected · ${x.overdue} overdue</small></div><span class="pill ${x.score>=50?'risk-high':'risk-low'}">Risk ${x.score}</span></div>`).join(''):'<div class=empty>Customer data নেই</div>';
  const max=Math.max(...Object.values(methods),1);$('#methodBreakdown').innerHTML=Object.keys(methods).length?Object.entries(methods).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class=barrow><span>${esc(k)}</span><div class=bar><i style="width:${Math.min(100,v/max*100)}%"></i></div><b>${money(v)}</b></div>`).join(''):'<div class=empty>Payment data নেই</div>';
  const broken=db.loans.filter(l=>!l.start||!l.count||!l.per).length+db.customers.filter(c=>!c.name).length;
  $('#dataHealth').innerHTML=`<div class=grid3><div class=kpi><small>Customers</small><b>${db.customers.length}</b></div><div class=kpi><small>Kisti Accounts</small><b>${db.loans.length}</b></div><div class=kpi><small>Data Issues</small><b class="${broken?'risk-high':'risk-low'}">${broken}</b></div></div><p class=page-note>${broken?'কিছু রেকর্ডে প্রয়োজনীয় তথ্য অসম্পূর্ণ—Edit করে ঠিক করুন।':'সব প্রধান রেকর্ডে প্রয়োজনীয় তথ্য পাওয়া গেছে।'}</p>`;
}
function exportSummaryCSV(){const rows=[['Customer','Phone','Kisti Collected','Overdue Accounts','Outstanding'],...db.customers.map(c=>{const ls=db.loans.filter(l=>l.customerId===c.id);return [c.name,c.phone||'',ls.reduce((a,l)=>a+info(l).amount,0),ls.filter(l=>info(l).overdue).length,ls.reduce((a,l)=>a+info(l).due*l.per,0)]})];const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='smart-kisti-customer-summary.csv';a.click();}
function exportJSON(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'}));a.download='smart-kisti-data-export.json';a.click();toast('JSON Export complete')}
function applyTheme(){document.body.classList.toggle('light',db.settings.theme==='light');const b=$('#themeToggle');if(b)b.textContent=db.settings.theme==='light'?'🌙 Dark Theme':'☀️ Light Theme'}
const _render=render;render=function(){_render();applyTheme();renderSmart();renderCashbook();calculateKisti();renderLedger();renderAnalytics();renderReminders();renderProfitLoss();renderPortfolio();renderForecast();scanDataHealth();renderExecutive();renderAudit()};
$('#collectionSearch')?.addEventListener('input',renderCollectionCenter);$('#printCollection')?.addEventListener('click',()=>window.print());$('#exportSummary')?.addEventListener('click',exportSummaryCSV);$('#exportJson')?.addEventListener('click',exportJSON);$('#themeToggle')?.addEventListener('click',async()=>{db.settings.theme=db.settings.theme==='light'?'dark':'light';await save('Theme changed')});$('#clearSearch')?.addEventListener('click',()=>{['globalSearch','customerSearch','loanSearch','paymentSearch','dueSearch','scheduleSearch','incomeSearch','expenseSearch','collectionSearch'].forEach(id=>{if($('#'+id))$('#'+id).value=''});render();toast('Search cleared')});
init();


/* v16 enhancements: Cashbook + Kisti Calculator + date filtering */
function transactionRows(from,to){
  const rows=[];
  db.payments.forEach(p=>rows.push({date:p.date,type:'Kisti Collection',title:p.loanName||'Kisti',method:p.method||'Cash',in:Number(p.amount||0),out:0,note:p.note||''}));
  db.dpsPayments.forEach(p=>rows.push({date:p.date,type:'DPS Deposit',title:p.dpsName||'DPS',method:p.method||'Cash',in:Number(p.amount||0),out:0,note:p.note||''}));
  db.incomes.forEach(p=>rows.push({date:p.date,type:'Other Income',title:p.title||p.category||'Income',method:'Income',in:Number(p.amount||0),out:0,note:p.category||''}));
  db.expenses.forEach(p=>rows.push({date:p.date,type:'Expense',title:p.title||p.category||'Expense',method:'Expense',in:0,out:Number(p.amount||0),note:p.category||''}));
  return rows.filter(r=>(!from||r.date>=from)&&(!to||r.date<=to)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
function renderCashbook(){
  const from=$('#cbFrom')?.value||today(), to=$('#cbTo')?.value||today();
  if($('#cbFrom')&&!$('#cbFrom').value) $('#cbFrom').value=from;
  if($('#cbTo')&&!$('#cbTo').value) $('#cbTo').value=to;
  const rows=transactionRows(from,to), tin=rows.reduce((a,r)=>a+r.in,0), tout=rows.reduce((a,r)=>a+r.out,0);
  const set=(id,v)=>{if($('#'+id))$('#'+id).textContent=v}; set('cbIn',money(tin));set('cbOut',money(tout));set('cbNet',money(tin-tout));set('cbCount',rows.length);
  if(!$('#cashbookTable')) return;
  $('#cashbookTable').innerHTML=rows.length?`<table><tr><th>Date</th><th>Type</th><th>Description</th><th>Method</th><th>Cash In</th><th>Cash Out</th><th>Note</th></tr>${rows.map(r=>`<tr><td>${r.date}</td><td>${esc(r.type)}</td><td>${esc(r.title)}</td><td>${esc(r.method)}</td><td>${r.in?money(r.in):'—'}</td><td>${r.out?money(r.out):'—'}</td><td>${esc(r.note)}</td></tr>`).join('')}</table>`:'<div class=empty>এই তারিখের কোনো লেনদেন নেই</div>';
}
function calculateKisti(){
  const principal=Number($('#calcPrincipal')?.value||0), rate=Number($('#calcRate')?.value||0), count=Math.max(1,Number($('#calcCount')?.value||1));
  const charge=principal*rate/100, total=principal+charge, per=total/count;
  const set=(id,v)=>{if($('#'+id))$('#'+id).textContent=v}; set('calcCharge',money(charge));set('calcTotal',money(total));set('calcPer',money(per));set('calcEffective',(principal?rate:0).toFixed(2)+'%');
}
$('#ledgerCustomer')?.addEventListener('change',renderLedger);$('#ledgerSearch')?.addEventListener('input',renderLedger);$('#printLedger')?.addEventListener('click',printLedger);$('#cbFrom')?.addEventListener('change',renderCashbook);$('#cbTo')?.addEventListener('change',renderCashbook);
['calcPrincipal','calcRate','calcCount'].forEach(id=>$('#'+id)?.addEventListener('input',calculateKisti));
$('#printCashbook')?.addEventListener('click',()=>window.print());

/* v18 enhancements: Business Analytics + Due Aging + daily performance */
function analyticsRows(from,to){
  const rows=[];
  db.payments.forEach(x=>rows.push({date:x.date,type:'Kisti Collection',amount:Number(x.amount||0),out:0}));
  db.dpsPayments.forEach(x=>rows.push({date:x.date,type:'DPS Deposit',amount:Number(x.amount||0),out:0}));
  db.incomes.forEach(x=>rows.push({date:x.date,type:'Other Income',amount:Number(x.amount||0),out:0}));
  db.expenses.forEach(x=>rows.push({date:x.date,type:'Expense',amount:0,out:Number(x.amount||0)}));
  return rows.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to));
}
function renderAnalytics(){
  if(!$('#analyticsTable')) return;
  const from=$('#anFrom')?.value||today(), to=$('#anTo')?.value||today();
  if($('#anFrom')&&!$('#anFrom').value) $('#anFrom').value=from;
  if($('#anTo')&&!$('#anTo').value) $('#anTo').value=to;
  const rows=analyticsRows(from,to), tin=rows.reduce((a,x)=>a+x.amount,0), tout=rows.reduce((a,x)=>a+x.out,0);
  const kc=rows.filter(x=>x.type==='Kisti Collection').reduce((a,x)=>a+x.amount,0);
  const dp=rows.filter(x=>x.type==='DPS Deposit').reduce((a,x)=>a+x.amount,0);
  const oi=rows.filter(x=>x.type==='Other Income').reduce((a,x)=>a+x.amount,0);
  const set=(id,v)=>{if($('#'+id)) $('#'+id).textContent=v};
  set('anIn',money(tin));set('anOut',money(tout));set('anNet',money(tin-tout));set('anTx',rows.length);set('anKisti',money(kc));set('anDps',money(dp));set('anIncome',money(oi));
  const overdue=db.loans.map(l=>({l,x:info(l)})).filter(a=>a.x.overdue);
  const buckets={"1–7 দিন":0,"8–30 দিন":0,"31–60 দিন":0,"61+ দিন":0};
  overdue.forEach(a=>{const d=a.x.late||0, v=a.x.due*Number(a.l.per||0);if(d<=7)buckets['1–7 দিন']+=v;else if(d<=30)buckets['8–30 দিন']+=v;else if(d<=60)buckets['31–60 দিন']+=v;else buckets['61+ দিন']+=v});
  const max=Math.max(...Object.values(buckets),1);
  $('#agingBars').innerHTML=Object.entries(buckets).map(([k,v])=>`<div class=barrow><span>${k}</span><div class=bar><i style="width:${Math.min(100,v/max*100)}%"></i></div><b>${money(v)}</b></div>`).join('');
  const days={}; rows.forEach(x=>{days[x.date]??={in:0,out:0};days[x.date].in+=x.amount;days[x.date].out+=x.out});
  const dayKeys=Object.keys(days).sort().reverse().slice(0,31);
  $('#analyticsTable').innerHTML=dayKeys.length?`<table><tr><th>Date</th><th>Cash In</th><th>Cash Out</th><th>Net</th></tr>${dayKeys.map(d=>`<tr><td>${d}</td><td>${money(days[d].in)}</td><td>${money(days[d].out)}</td><td>${money(days[d].in-days[d].out)}</td></tr>`).join('')}</table>`:'<div class=empty>এই সময়ের কোনো লেনদেন নেই</div>';
}
function exportAnalyticsCSV(){
  const from=$('#anFrom')?.value||'',to=$('#anTo')?.value||'',rows=analyticsRows(from,to),daily={};
  rows.forEach(x=>{daily[x.date]??={in:0,out:0};daily[x.date].in+=x.amount;daily[x.date].out+=x.out});
  const data=[['Date','Cash In','Cash Out','Net'],...Object.keys(daily).sort().map(d=>[d,daily[d].in,daily[d].out,daily[d].in-daily[d].out])];
  const csv=data.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='smart-kisti-analytics.csv';a.click();toast('Analytics CSV exported');
}
$('#anFrom')?.addEventListener('change',renderAnalytics);$('#anTo')?.addEventListener('change',renderAnalytics);$('#exportAnalytics')?.addEventListener('click',exportAnalyticsCSV);$('#printAnalytics')?.addEventListener('click',()=>window.print());
calculateKisti();


/* v20 Professional Portfolio Monitor */
function portfolioData(){
  const rows=db.loans.map(l=>{const x=info(l), collected=x.amount, target=Number(l.total||l.count*l.per||0), outstanding=Math.max(0,target-collected), overdue=x.overdue?x.due*Number(l.per||0)+Number(x.lateFee||0):0, rate=target?Math.min(100,collected/target*100):0; return {l,x,collected,target,outstanding,overdue,rate};});
  return rows;
}
function renderPortfolio(){
  if(!$('#portfolioRanking'))return;
  const rows=portfolioData(), portfolio=rows.reduce((a,r)=>a+r.target,0), collected=rows.reduce((a,r)=>a+r.collected,0), outstanding=rows.reduce((a,r)=>a+r.outstanding,0), overdue=rows.reduce((a,r)=>a+r.overdue,0);
  const active=rows.filter(r=>r.x.due>0).length, completed=rows.filter(r=>!r.x.due).length, avg=rows.length?rows.reduce((a,r)=>a+Number(r.l.per||0),0)/rows.length:0, eff=portfolio?Math.round(collected/portfolio*100):0;
  const set=(id,v)=>{if($('#'+id))$('#'+id).textContent=v}; set('pfPortfolio',money(portfolio));set('pfCollected',money(collected));set('pfOutstanding',money(outstanding));set('pfEfficiency',eff+'%');set('pfActive',active);set('pfCompleted',completed);set('pfOverdue',money(overdue));set('pfAvg',money(avg));
  const top=rows.slice().sort((a,b)=>b.collected-a.collected).slice(0,8);
  $('#portfolioRanking').innerHTML=top.length?top.map((r,i)=>`<div class=queue><div><b>#${i+1} ${esc(r.l.customerName)}</b><small>${esc(r.l.name)} · ${r.x.paid}/${r.l.count} paid · ${r.rate.toFixed(0)}%</small></div><strong>${money(r.collected)}</strong></div>`).join(''):'<div class=empty>কোনো Kisti Account নেই</div>';
  const risk=rows.filter(r=>r.x.overdue).sort((a,b)=>b.overdue-a.overdue).slice(0,8);
  $('#portfolioRisk').innerHTML=risk.length?risk.map(r=>`<div class=queue><div><b>${esc(r.l.customerName)}</b><small>${esc(r.l.name)} · ${r.x.late} দিন overdue</small></div><strong>${money(r.overdue)}</strong></div>`).join(''):'<div class=empty>বর্তমানে কোনো Risk Account নেই 🎉</div>';
}
function exportPortfolioCSV(){const rows=portfolioData(), data=[['Customer','Account','Target','Collected','Outstanding','Overdue Exposure','Paid Count','Total Count','Efficiency %'],...rows.map(r=>[r.l.customerName,r.l.name,r.target,r.collected,r.outstanding,r.overdue,r.x.paid,r.l.count,r.rate.toFixed(2)])];const csv=data.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='smart-kisti-portfolio-monitor.csv';a.click();toast('Portfolio CSV exported');}
$('#printPortfolio')?.addEventListener('click',()=>window.print());$('#exportPortfolio')?.addEventListener('click',exportPortfolioCSV);

/* v19 enhancements: Smart Reminders + Profit & Loss */
function dateDiff(a,b){return Math.round((new Date(a+"T00:00:00")-new Date(b+"T00:00:00"))/86400000)}
function loanCustomer(l){return db.customers.find(c=>String(c.id)===String(l.customerId))||{}}
function reminderRows(){
  return db.loans.map(l=>{
    const x=info(l), c=loanCustomer(l), d=x.nextDate;
    return {l,x,c,date:d,days:d?dateDiff(d,today()):999};
  }).filter(r=>r.x.due>0 && r.date && r.days<=7).sort((a,b)=>a.days-b.days);
}
function waLink(phone,text){
  const p=String(phone||"").replace(/\D/g,"");
  if(!p) return "";
  let n=p;
  if(n.startsWith("01")) n="88"+n;
  return "https://wa.me/"+n+"?text="+encodeURIComponent(text);
}
function renderReminders(){
  if(!$("#reminderTable")) return;
  const all=db.loans.map(l=>{const x=info(l),c=loanCustomer(l);return{l,x,c,date:x.nextDate,days:x.nextDate?dateDiff(x.nextDate,today()):999}})
    .filter(r=>r.x.due>0&&r.date);
  const todayN=all.filter(r=>r.days===0).length, upcoming=all.filter(r=>r.days>0&&r.days<=7).length, over=all.filter(r=>r.days<0);
  const amount=over.reduce((s,r)=>s+r.x.due*Number(r.l.per||0)+r.x.lateFee,0);
  const set=(id,v)=>{if($("#"+id))$("#"+id).textContent=v};
  set("rToday",todayN);set("rUpcoming",upcoming);set("rOverdue",over.length);set("rAmount",money(amount));
  const q=String($("#reminderSearch")?.value||"").toLowerCase().trim();
  const rows=reminderRows().filter(r=>(!q||[r.c.name,r.c.phone,r.l.account,r.l.purpose].join(" ").toLowerCase().includes(q)));
  $("#reminderTable").innerHTML=rows.length?`<table><tr><th>Customer</th><th>Account</th><th>Due Date</th><th>Status</th><th>Due</th><th>Action</th></tr>${rows.map(r=>{
    const status=r.days<0?`<span class="badge over">Overdue ${Math.abs(r.days)} দিন</span>`:r.days===0?`<span class="badge due">আজ</span>`:`<span class="badge paid">আর ${r.days} দিন</span>`;
    const due=r.x.due*Number(r.l.per||0)+r.x.lateFee;
    const msg=`আসসালামু আলাইকুম ${r.c.name||"ভাই/আপু"}, আপনার ${r.l.account||"কিস্তি"}-এর ${r.x.next} নম্বর কিস্তির তারিখ ${r.date}। বকেয়া পরিমাণ ${due.toFixed(0)} টাকা। অনুগ্রহ করে সময়মতো পরিশোধ করুন।`;
    const wa=waLink(r.c.phone,msg);
    return `<tr><td><b>${esc(r.c.name||"সাধারণ")}</b><small>${esc(r.c.phone||"")}</small></td><td>${esc(r.l.account||"")}</td><td>${r.date}</td><td>${status}</td><td>${money(due)}</td><td><div class=reminder-actions>${wa?`<a class="btn icon" target="_blank" href="${wa}">💬 WhatsApp</a>`:""}<button class="btn icon" onclick="collectLoan(${r.l.id})">＋ Collect</button></div></td></tr>`;
  }).join("")}</table>`:'<div class=empty>কোনো Due/Overdue reminder নেই</div>';
}
function profitRows(from,to){
  const rows=[];
  db.payments.forEach(x=>rows.push({date:x.date,type:"Kisti Collection",amount:Number(x.amount||0),out:0,note:x.note||""}));
  db.dpsPayments.forEach(x=>rows.push({date:x.date,type:"DPS Deposit",amount:Number(x.amount||0),out:0,note:x.note||""}));
  db.incomes.forEach(x=>rows.push({date:x.date,type:"Other Income",amount:Number(x.amount||0),out:0,note:x.note||""}));
  db.expenses.forEach(x=>rows.push({date:x.date,type:"Expense",amount:0,out:Number(x.amount||0),note:x.note||""}));
  return rows.filter(x=>(!from||x.date>=from)&&(!to||x.date<=to)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
function renderProfitLoss(){
  if(!$("#plTable")) return;
  const from=$("#plFrom")?.value||monthKey(today())+"-01",to=$("#plTo")?.value||today();
  if($("#plFrom")&&!$("#plFrom").value)$("#plFrom").value=from;
  if($("#plTo")&&!$("#plTo").value)$("#plTo").value=to;
  const rows=profitRows(from,to), ki=rows.filter(r=>r.type==="Kisti Collection").reduce((s,r)=>s+r.amount,0),dp=rows.filter(r=>r.type==="DPS Deposit").reduce((s,r)=>s+r.amount,0),inc=rows.filter(r=>r.type==="Other Income").reduce((s,r)=>s+r.amount,0),ex=rows.reduce((s,r)=>s+r.out,0),tin=ki+dp+inc;
  const set=(id,v)=>{if($("#"+id))$("#"+id).textContent=v};
  set("plKisti",money(ki));set("plDps",money(dp));set("plIncome",money(inc));set("plExpense",money(ex));set("plIn",money(tin));set("plNet",money(tin-ex));set("plTx",rows.length);set("plRatio",ex?(Math.round(tin/ex*100)+"%"):"∞");
  const daily={};rows.forEach(r=>{daily[r.date]??={in:0,out:0};daily[r.date].in+=r.amount;daily[r.date].out+=r.out});
  const days=Object.keys(daily).sort().reverse();
  $("#plTable").innerHTML=days.length?`<table><tr><th>Date</th><th>Total In</th><th>Expense</th><th>Net</th></tr>${days.map(d=>`<tr><td>${d}</td><td>${money(daily[d].in)}</td><td>${money(daily[d].out)}</td><td><b>${money(daily[d].in-daily[d].out)}</b></td></tr>`).join("")}</table>`:'<div class=empty>এই সময়ের কোনো হিসাব নেই</div>';
}
$("#reminderSearch")?.addEventListener("input",renderReminders);
$("#printReminders")?.addEventListener("click",()=>window.print());
$("#plFrom")?.addEventListener("change",renderProfitLoss);$("#plTo")?.addEventListener("change",renderProfitLoss);
$("#printProfit")?.addEventListener("click",()=>window.print());

/* v21 Professional: Collection Forecast + Data Health Center */
function forecastRows(){
  const t=today(), end7=addDays(t,7), end30=addDays(t,30), rows=[];
  db.loans.forEach(l=>{const x=info(l); if(!x.due||!x.nextDate)return; const c=loanCustomer(l); const amount=Number(l.per||0)*Math.max(1,x.due)+(x.overdue?Number(x.lateFee||0):0); rows.push({l,x,c,amount,days:dateDiff(x.nextDate,t)});});
  return rows.filter(r=>r.days<=30).sort((a,b)=>a.days-b.days);
}
function renderForecast(){
  if(!$('#forecastTable'))return;
  const rows=forecastRows(), f7=rows.filter(r=>r.days>=0&&r.days<=7).reduce((s,r)=>s+r.amount,0), f30=rows.filter(r=>r.days>=0&&r.days<=30).reduce((s,r)=>s+r.amount,0), overdue=db.loans.map(l=>({l,x:info(l)})).filter(r=>r.x.overdue).reduce((s,r)=>s+r.x.due*Number(r.l.per||0)+Number(r.x.lateFee||0),0);
  const set=(id,v)=>{if($('#'+id))$('#'+id).textContent=v}; set('fc7',money(f7));set('fc30',money(f30));set('fcOverdue',money(overdue));set('fcActive',db.loans.filter(l=>info(l).due>0).length);
  $('#forecastTable').innerHTML=rows.length?`<table><tr><th>Date</th><th>Customer</th><th>Account</th><th>Installment</th><th>Status</th></tr>${rows.map(r=>{const st=r.days<0?`<span class="badge over">${Math.abs(r.days)} দিন overdue</span>`:r.days===0?`<span class="badge due">আজ</span>`:`<span class="badge paid">${r.days} দিন পরে</span>`;return `<tr><td>${r.x.nextDate}</td><td><b>${esc(r.c.name||r.l.customerName||'সাধারণ')}</b><small>${esc(r.c.phone||'')}</small></td><td>${esc(r.l.name||'')}</td><td>${money(Number(r.l.per||0)+ (r.days<0?Number(r.x.lateFee||0):0))}</td><td>${st}</td></tr>`}).join('')}</table>`:'<div class=empty>আগামী ৩০ দিনের কোনো পরিকল্পিত Due নেই</div>';
}
function scanDataHealth(){
  if(!$('#healthIssues'))return;
  const phoneMap={}; db.customers.forEach(c=>{const p=String(c.phone||'').replace(/\D/g,'');if(p)phoneMap[p]??=[];if(p)phoneMap[p].push(c)});
  const duplicates=Object.values(phoneMap).filter(a=>a.length>1);
  const issues=[];
  db.customers.forEach(c=>{if(!c.name)issues.push(`Customer #${c.id}: নাম নেই`);if(!c.phone)issues.push(`${c.name||'Customer #'+c.id}: মোবাইল নম্বর নেই`)});
  db.loans.forEach(l=>{if(!l.customerName)issues.push(`${l.name||'Kisti Account'}: Customer নাম নেই`);if(!l.start)issues.push(`${l.name||'Kisti Account'}: শুরু তারিখ নেই`);if(!Number(l.count)||!Number(l.per))issues.push(`${l.name||'Kisti Account'}: কিস্তি সংখ্যা/পরিমাণ অসম্পূর্ণ`)});
  db.payments.forEach(p=>{if(!db.loans.some(l=>l.id===p.loanId))issues.push(`Payment #${p.id}: Kisti Account খুঁজে পাওয়া যায়নি`)});
  db.dpsPayments.forEach(p=>{if(!db.dps.some(d=>d.id===p.dpsId))issues.push(`DPS Payment #${p.id}: DPS Plan খুঁজে পাওয়া যায়নি`)});
  const set=(id,v)=>{if($('#'+id))$('#'+id).textContent=v};set('dhCustomers',db.customers.length);set('dhLoans',db.loans.length);set('dhDup',duplicates.length);set('dhIssues',issues.length+duplicates.length);
  $('#healthIssues').innerHTML=issues.length?issues.slice(0,40).map(x=>`<div class="queue"><div><b>⚠️ ${esc(x)}</b></div></div>`).join(''):'<div class="empty">কোনো বড় Data Issue পাওয়া যায়নি 🎉</div>';
  $('#duplicateCustomers').innerHTML=duplicates.length?duplicates.map(a=>`<div class="queue"><div><b>📱 ${esc(a[0].phone)}</b><small>${a.map(c=>esc(c.name)).join(' · ')}</small></div><span class="pill risk-high">${a.length} records</span></div>`).join(''):'<div class="empty">Duplicate phone পাওয়া যায়নি 🎉</div>';
}
function exportForecastCSV(){const rows=forecastRows(),data=[['Date','Customer','Account','Installment','Days'],...rows.map(r=>[r.x.nextDate,r.c.name||r.l.customerName,r.l.name,r.amount,r.days])];const csv=data.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='smart-kisti-collection-forecast.csv';a.click();toast('Forecast CSV exported')}
$('#scanData')?.addEventListener('click',scanDataHealth);$('#printForecast')?.addEventListener('click',()=>window.print());$('#exportForecast')?.addEventListener('click',exportForecastCSV);

/* v22 Professional: Executive Center */
function executiveRows(){
  const rows=[];
  db.payments.forEach(p=>{const l=db.loans.find(x=>x.id===p.loanId); rows.push({date:p.date||today(),amount:Number(p.amount||0),method:p.method||'Other',account:l?.name||'Unknown Account',type:'Kisti'});});
  db.dpsPayments.forEach(p=>{const d=db.dps.find(x=>x.id===p.dpsId); rows.push({date:p.date||today(),amount:Number(p.amount||0),method:p.method||'Other',account:d?.name||'Unknown DPS',type:'DPS'});});
  db.incomes.forEach(p=>rows.push({date:p.date||today(),amount:Number(p.amount||0),method:p.method||'Other',account:p.title||p.category||'Other Income',type:'Income'}));
  return rows;
}
function executiveMonthStats(key){
  const r=executiveRows().filter(x=>monthKey(x.date)===key);
  const out=db.expenses.filter(x=>monthKey(x.date)===key).reduce((s,x)=>s+Number(x.amount||0),0);
  return {in:r.reduce((s,x)=>s+x.amount,0),out,tx:r.length,rows:r};
}
function renderExecutive(){
  if(!$('#exMonthIn'))return;
  const cur=monthKey(today()), prev=monthKey(addDays(today(),-new Date().getDate()));
  const cm=executiveMonthStats(cur), pm=executiveMonthStats(prev), growth=pm.in?((cm.in-pm.in)/pm.in*100): (cm.in?100:0);
  const todayRows=executiveRows().filter(x=>x.date===today()), todayIn=todayRows.reduce((s,x)=>s+x.amount,0), todayOut=db.expenses.filter(x=>x.date===today()).reduce((s,x)=>s+Number(x.amount||0),0);
  const set=(id,v)=>{const e=$('#'+id);if(e)e.textContent=v};
  set('exMonthIn',money(cm.in));set('exPrevIn',money(pm.in));set('exGrowth',(growth>=0?'+':'')+growth.toFixed(1)+'%');set('exNet',money(cm.in-cm.out));set('exTodayTx',todayRows.length+db.expenses.filter(x=>x.date===today()).length);set('exTodayIn',money(todayIn));set('exTodayOut',money(todayOut));set('exOverdue',db.loans.filter(l=>info(l).overdue).length);
  const months=[];
  for(let i=5;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const key=d.toISOString().slice(0,7);months.push({key,label:key.slice(5),value:executiveMonthStats(key).in});}
  const max=Math.max(1,...months.map(x=>x.value));
  $('#exTrend').innerHTML=months.map(x=>`<div class="executive-bar"><small style="width:45px">${x.label}</small><div class="bar"><i style="width:${Math.round(x.value/max*100)}%"></i></div><b>${money(x.value)}</b></div>`).join('');
  const methods={};executiveRows().filter(x=>monthKey(x.date)===cur).forEach(x=>methods[x.method]=(methods[x.method]||0)+x.amount);
  const methodArr=Object.entries(methods).sort((a,b)=>b[1]-a[1]), mt=Math.max(1,cm.in);
  $('#exMethods').innerHTML=methodArr.length?methodArr.map(([m,v])=>`<div class="executive-mini"><div style="display:flex;justify-content:space-between"><b>${esc(m)}</b><span>${money(v)}</span></div><div class="bar"><i style="width:${Math.round(v/mt*100)}%"></i></div></div>`).join(''):'<div class="empty">এই মাসে Payment নেই</div>';
  const cats={};db.expenses.filter(x=>monthKey(x.date)===cur).forEach(x=>{const c=x.category||'অন্যান্য';cats[c]=(cats[c]||0)+Number(x.amount||0)});
  const catArr=Object.entries(cats).sort((a,b)=>b[1]-a[1]), ct=Math.max(1,cm.out);
  $('#exExpenses').innerHTML=catArr.length?catArr.map(([c,v])=>`<div class="executive-mini"><div style="display:flex;justify-content:space-between"><b>${esc(c)}</b><span>${money(v)}</span></div><div class="bar"><i style="width:${Math.round(v/ct*100)}%"></i></div></div>`).join(''):'<div class="empty">এই মাসে Expense নেই</div>';
  const accounts={};cm.rows.filter(x=>x.type==='Kisti').forEach(x=>accounts[x.account]=(accounts[x.account]||0)+x.amount);
  const top=Object.entries(accounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
  $('#exTopAccounts').innerHTML=top.length?top.map(([n,v],i)=>`<div class="executive-rank"><div><b>#${i+1} ${esc(n)}</b><small>এই মাসের আদায়</small></div><strong>${money(v)}</strong></div>`).join(''):'<div class="empty">এই মাসে Kisti Collection নেই</div>';
}
function exportExecutiveCSV(){
 const cur=monthKey(today()), cm=executiveMonthStats(cur), pm=executiveMonthStats(monthKey(addDays(today(),-new Date().getDate())));
 const data=[['Metric','Value'],['Current Month Collection',cm.in],['Previous Month Collection',pm.in],['Current Month Expense',cm.out],['Current Month Net',cm.in-cm.out],['Transactions',cm.tx],['Overdue Accounts',db.loans.filter(l=>info(l).overdue).length]];
 const csv=data.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='smart-kisti-executive-report.csv';a.click();toast('Executive CSV exported');
}
$('#printExecutive')?.addEventListener('click',()=>window.print());
$('#exportExecutive')?.addEventListener('click',exportExecutiveCSV);


/* v23 Final Professional: Audit Trail + Business Snapshot */
function renderAudit(){
  if(!$('#auditTable'))return;
  const q=($('#auditSearch')?.value||'').toLowerCase();
  const rows=(db.audit||[]).filter(x=>(String(x.action)+' '+String(x.date)).toLowerCase().includes(q)).slice().reverse();
  $('#auditCount').textContent=(db.audit||[]).length;
  $('#auditTable').innerHTML=rows.length?`<table><tr><th>সময়</th><th>Action</th><th>User</th></tr>${rows.map(x=>`<tr><td>${esc(new Date(x.date).toLocaleString('bn-BD'))}</td><td><b>${esc(x.action)}</b></td><td>${esc(x.user||'Local User')}</td></tr>`).join('')}</table>`:'<div class=empty>কোনো Activity Log নেই</div>';
}
function clearAudit(){
  if(!confirm('Activity Log মুছে ফেলবেন?'))return;
  db.audit=[]; save('Activity Log cleared');
}
function exportAuditCSV(){
  const rows=[['Date','Action','User'],...(db.audit||[]).map(x=>[x.date,x.action,x.user||'Local User'])];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='smart-kisti-audit-log.csv';a.click();toast('Audit CSV exported');
}
function renderSnapshot(){
  if(!$('#snapshotTable'))return;
  const s=sums(), todayD=today();
  const todayIn=transactionRows(todayD,todayD).reduce((a,r)=>a+r.in,0), todayOut=transactionRows(todayD,todayD).reduce((a,r)=>a+r.out,0);
  const active=db.loans.filter(l=>info(l).due).length, overdue=db.loans.filter(l=>info(l).overdue).length;
  const totalTarget=db.loans.reduce((a,l)=>a+Number(l.count||0)*Number(l.per||0),0);
  const collected=s.collection, rate=totalTarget?Math.min(100,Math.round(collected/totalTarget*100)):0;
  const data=[['Business',db.settings.business||'Smart Kisti Manager'],['Date',todayD],['Customers',db.customers.length],['Active Kisti',active],['Overdue Accounts',overdue],['Kisti Collection',s.collection],['DPS Deposited',s.dps],['Other Income',s.income],['Expenses',s.expenses],['Net Cash',s.net],['Outstanding',s.outstanding],['Today Cash In',todayIn],['Today Cash Out',todayOut],['Collection Efficiency',rate+'%']];
  $('#snapshotTable').innerHTML=`<table><tr><th>Metric</th><th>Value</th></tr>${data.map(r=>`<tr><td>${esc(r[0])}</td><td><b>${typeof r[1]==='number'&&['Customers','Active Kisti','Overdue Accounts'].includes(r[0])?r[1]:typeof r[1]==='number'?money(r[1]):esc(r[1])}</b></td></tr>`).join('')}</table>`;
}
function exportSnapshot(){
  const s=sums(), rows=[['Metric','Value'],['Business',db.settings.business||'Smart Kisti Manager'],['Date',today()],['Customers',db.customers.length],['Active Kisti',db.loans.filter(l=>info(l).due).length],['Overdue Accounts',db.loans.filter(l=>info(l).overdue).length],['Kisti Collection',s.collection],['DPS Deposited',s.dps],['Other Income',s.income],['Expenses',s.expenses],['Net Cash',s.net],['Outstanding',s.outstanding]];
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n'); const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='smart-kisti-business-snapshot.csv';a.click();toast('Business Snapshot exported');
}
$('#auditSearch')?.addEventListener('input',renderAudit);
$('#clearAudit')?.addEventListener('click',clearAudit);
$('#exportAudit')?.addEventListener('click',exportAuditCSV);
$('#printAudit')?.addEventListener('click',()=>window.print());
$('#printSnapshot')?.addEventListener('click',()=>window.print());
$('#exportSnapshot')?.addEventListener('click',exportSnapshot);
renderSnapshot();


/* v24 Ultimate Professional: Target Planner + Daily Closing */
function renderTargetClosing(){
  if(!$('#targetMonth')) return;
  const month=$('#targetMonth').value||monthKey(today());
  if(!$('#targetMonth').value) $('#targetMonth').value=month;
  const target=Number(db.settings.monthlyTarget||0);
  const achieved=executiveRows().filter(x=>monthKey(x.date)===month).reduce((a,x)=>a+x.amount,0);
  const remaining=Math.max(0,target-achieved), rate=target?Math.min(100,Math.round(achieved/target*100)):0;
  const set=(id,v)=>{const e=$('#'+id);if(e)e.textContent=v};
  if($('#monthlyTargetInput'))$('#monthlyTargetInput').value=target;set('mtTarget',money(target));set('mtAchieved',money(achieved));set('mtRemaining',money(remaining));set('mtRate',rate+'%');
  if($('#monthlyTargetBar'))$('#monthlyTargetBar').style.width=rate+'%';
  const date=$('#closingDate').value||today(); if(!$('#closingDate').value)$('#closingDate').value=date;
  const rows=transactionRows(date,date), tin=rows.reduce((a,r)=>a+r.in,0), tout=rows.reduce((a,r)=>a+r.out,0);
  set('clIn',money(tin));set('clOut',money(tout));set('clNet',money(tin-tout));set('clTx',rows.length);
  const methods={}; rows.filter(r=>r.in>0).forEach(r=>methods[r.method||'Other']=(methods[r.method||'Other']||0)+r.in);
  const total=Math.max(1,tin);
  $('#clMethods').innerHTML=Object.entries(methods).sort((a,b)=>b[1]-a[1]).map(([m,v])=>`<div class="barrow"><span>${esc(m)}</span><div class="bar"><i style="width:${Math.round(v/total*100)}%"></i></div><b>${money(v)}</b></div>`).join('')||'<div class=empty>এই দিনে Cash In নেই</div>';
  $('#closingTable').innerHTML=rows.length?`<table><tr><th>সময়/তারিখ</th><th>Type</th><th>Description</th><th>Method</th><th>In</th><th>Out</th></tr>${rows.map(r=>`<tr><td>${r.date}</td><td>${esc(r.type)}</td><td>${esc(r.title)}</td><td>${esc(r.method)}</td><td>${r.in?money(r.in):'—'}</td><td>${r.out?money(r.out):'—'}</td></tr>`).join('')}</table>`:'<div class=empty>এই দিনে কোনো লেনদেন নেই</div>';
}
function exportTargetClosing(){
  const month=$('#targetMonth')?.value||monthKey(today()),date=$('#closingDate')?.value||today();
  const rows=transactionRows(date,date); const data=[['Target & Daily Closing Report'],['Month',month],['Monthly Target',db.settings.monthlyTarget||0],['Monthly Achieved',executiveRows().filter(x=>monthKey(x.date)===month).reduce((a,x)=>a+x.amount,0)],[],['Date','Type','Description','Method','Cash In','Cash Out'],...rows.map(r=>[r.date,r.type,r.title,r.method,r.in,r.out])];
  const csv=data.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'); const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));a.download='smart-kisti-target-closing.csv';a.click();toast('Target & Closing CSV exported');
}
$('#targetMonth')?.addEventListener('change',renderTargetClosing);$('#closingDate')?.addEventListener('change',renderTargetClosing);
$('#saveMonthlyTarget')?.addEventListener('click',async()=>{db.settings.monthlyTarget=Number($('#monthlyTargetInput')?.value||0);await save('Monthly collection target updated')});
$('#monthlyTargetInput')?.addEventListener('input',()=>{db.settings.monthlyTarget=Number($('#monthlyTargetInput').value||0);renderTargetClosing()});
$('#printTargetClosing')?.addEventListener('click',()=>window.print());$('#exportTargetClosing')?.addEventListener('click',exportTargetClosing);
const _renderV24=render; render=function(){_renderV24();renderTargetClosing()};

/* v25 Final Professional: PDF Report Center */
async function saveCurrentPDF(name){
  if(!window.desktopAPI?.savePDF){toast('PDF feature unavailable');return}
  const title=name||($('#title')?.textContent||'Smart-Kisti-Report');
  const path=await window.desktopAPI.savePDF(title);
  if(path) toast('PDF রিপোর্ট সংরক্ষণ হয়েছে');
}
$('#saveCurrentPdf')?.addEventListener('click',()=>saveCurrentPDF());
$('#saveReportPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Reports'));
$('#saveExecutivePdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Executive-Report'));
$('#saveSnapshotPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Business-Snapshot'));
$('#saveAuditPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Activity-Log'));
$('#saveTargetClosingPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Target-Closing'));
$('#saveCashbookPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Cashbook'));
$('#saveAnalyticsPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Analytics'));
$('#saveProfitLossPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Profit-Loss'));
$('#savePortfolioPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Portfolio'));
$('#saveForecastPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Collection-Forecast'));
$('#saveLedgerPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Customer-Ledger'));
$('#saveSchedulePdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Schedule'));
$('#savePaymentsPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Payment-History'));
$('#saveCollectionPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Collection-Center'));
$('#saveRemindersPdf')?.addEventListener('click',()=>saveCurrentPDF('Smart-Kisti-Reminders'));

