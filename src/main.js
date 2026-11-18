import './style.css'
import { supabase, configReady } from './supabase.js'

const categories = ['Critical', 'Normal', 'Additional', 'Ignore', 'Repeated']
const app = document.querySelector('#app')
let faults = []
let activeCategory = 'All'
let searchTerm = ''
let editingCode = null

const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const notify = (msg, bad=false) => {
  const el = document.querySelector('#toast')
  if (!el) return
  el.textContent = msg
  el.className = `toast show ${bad ? 'error' : ''}`
  setTimeout(() => el.classList.remove('show'), 3200)
}
const categoryClass = c => c.toLowerCase()

function renderAuth() {
  app.innerHTML = `
    <main class="auth-wrap">
      <section class="auth-card">
        <div class="brand-mark">C</div>
        <p class="eyebrow">CONSOLIDATOR WORKSPACE</p>
        <h1>Fault Manager</h1>
        <p class="muted">Sign in to manage shared fault definitions and classifications.</p>
        <form id="auth-form">
          <label>Email<input name="email" type="email" required placeholder="you@company.com"></label>
          <label>Password<input name="password" type="password" required minlength="6" placeholder="Your password"></label>
          <button class="primary" type="submit" id="auth-submit">Sign in</button>
        </form>
        <button class="text-button" id="signup">Create an account</button>
        <p class="hint">Accounts may require email confirmation depending on your Supabase Auth settings.</p>
      </section>
    </main><div id="toast" class="toast"></div>`
  document.querySelector('#auth-form').addEventListener('submit', async e => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const { error } = await supabase.auth.signInWithPassword({email:fd.get('email'),password:fd.get('password')})
    if (error) notify(error.message, true)
    else boot()
  })
  document.querySelector('#signup').addEventListener('click', async () => {
    const form = document.querySelector('#auth-form')
    const fd = new FormData(form)
    if (!fd.get('email') || !fd.get('password')) return notify('Enter email and password first.', true)
    const { error } = await supabase.auth.signUp({email:fd.get('email'),password:fd.get('password')})
    if (error) notify(error.message, true)
    else notify('Account request submitted. Check your email if confirmation is enabled.')
  })
}

function renderApp(user) {
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <div class="brand"><div class="brand-mark small">C</div><div><strong>Consolidator</strong><span>Fault management</span></div></div>
        <div class="user-area"><span>${esc(user.email)}</span><button id="logout" class="ghost">Sign out</button></div>
      </header>
      <main class="content">
        <div class="page-heading"><div><p class="eyebrow">CLASSIFICATION DATABASE</p><h1>Fault library</h1><p class="muted">Manage fault definitions centrally. Changes are shared with authenticated users.</p></div><button class="primary" id="add-fault">＋ Add fault</button></div>
        <section class="stats" id="stats"></section>
        <section class="toolbar">
          <input id="search" type="search" placeholder="Search code, message or recovery message…" value="${esc(searchTerm)}">
          <select id="category-filter"><option>All</option>${categories.map(c=>`<option ${activeCategory===c?'selected':''}>${c}</option>`).join('')}</select>
          <button class="ghost" id="refresh">Refresh</button>
        </section>
        <section class="table-card">
          <div class="table-head"><strong>Fault records</strong><span id="result-count" class="muted"></span></div>
          <div class="table-scroll"><table><thead><tr><th>Code</th><th>Fault message</th><th>Recovery code</th><th>Recovery message</th><th>Category</th><th></th></tr></thead><tbody id="rows"><tr><td colspan="6">Loading…</td></tr></tbody></table></div>
        </section>
        <p class="footer-note">Fault definitions are stored in your Supabase database. Classification changes take effect on the next data refresh.</p>
      </main>
    </div>
    <dialog id="fault-dialog">
      <form id="fault-form" method="dialog">
        <div class="dialog-title"><div><p class="eyebrow">FAULT DEFINITION</p><h2 id="dialog-heading">Add fault</h2></div><button type="button" class="icon-button" id="close-dialog">×</button></div>
        <label>Fault code<input name="code" type="number" required></label>
        <label>Fault message<input name="message" required maxlength="1000"></label>
        <div class="form-grid"><label>Recovery code<input name="recovery_code" type="number"></label><label>Category<select name="category" required>${categories.map(c=>`<option>${c}</option>`).join('')}</select></label></div>
        <label>Recovery message<input name="recovery_message" maxlength="1000"></label>
        <div class="dialog-actions"><button type="button" class="ghost" id="cancel-dialog">Cancel</button><button class="primary" id="save-fault" type="submit">Save fault</button></div>
      </form>
    </dialog>
    <div id="toast" class="toast"></div>`
  document.querySelector('#logout').onclick = async () => { await supabase.auth.signOut(); renderAuth() }
  document.querySelector('#add-fault').onclick = () => openDialog()
  document.querySelector('#close-dialog').onclick = closeDialog
  document.querySelector('#cancel-dialog').onclick = closeDialog
  document.querySelector('#refresh').onclick = loadFaults
  document.querySelector('#search').addEventListener('input', e => { searchTerm=e.target.value; renderRows() })
  document.querySelector('#category-filter').addEventListener('change', e => { activeCategory=e.target.value; renderRows() })
  document.querySelector('#fault-form').addEventListener('submit', saveFault)
  loadFaults()
}

async function loadFaults() {
  const { data, error } = await supabase.from('faults').select('code,sl_no,message,recovery_code,recovery_message,fault_classifications(category)').order('code').limit(5000)
  if (error) { notify(`Could not load faults: ${error.message}`, true); return }
  faults = (data || []).map(f => ({...f, category: f.fault_classifications?.[0]?.category || null}))
  renderStats(); renderRows()
}
function renderStats() {
  const counts = Object.fromEntries(categories.map(c=>[c,faults.filter(f=>f.category===c).length]))
  document.querySelector('#stats').innerHTML = `<article class="stat"><span>All faults</span><b>${faults.length}</b></article>` + categories.map(c=>`<article class="stat"><span>${c}</span><b>${counts[c]}</b></article>`).join('')
}
function renderRows() {
  const filtered = faults.filter(f => (activeCategory==='All'||f.category===activeCategory) && [f.code,f.message,f.recovery_code,f.recovery_message,f.category].join(' ').toLowerCase().includes(searchTerm.toLowerCase()))
  document.querySelector('#result-count').textContent = `${filtered.length} records`
  const tbody = document.querySelector('#rows')
  if (!filtered.length) { tbody.innerHTML='<tr><td colspan="6" class="empty">No matching faults found.</td></tr>'; return }
  tbody.innerHTML = filtered.map(f=>`<tr>
    <td class="code">${esc(f.code)}</td><td class="message">${esc(f.message)}</td><td>${esc(f.recovery_code ?? '—')}</td><td>${esc(f.recovery_message ?? '—')}</td>
    <td>${f.category?`<span class="pill ${categoryClass(f.category)}">${esc(f.category)}</span>`:'<span class="pill unassigned">Unassigned</span>'}</td>
    <td class="actions"><button class="row-action" data-edit="${f.code}">Edit</button><button class="row-action danger" data-delete="${f.code}">Delete</button></td>
  </tr>`).join('')
  tbody.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openDialog(Number(b.dataset.edit)))
  tbody.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteFault(Number(b.dataset.delete)))
}
function openDialog(code=null) {
  editingCode=code
  const form=document.querySelector('#fault-form')
  form.reset()
  const f=code===null?null:faults.find(x=>x.code===code)
  document.querySelector('#dialog-heading').textContent=f?'Edit fault':'Add fault'
  if(f) {
    form.elements.code.value=f.code; form.elements.code.disabled=true
    form.elements.message.value=f.message || ''
    form.elements.recovery_code.value=f.recovery_code ?? ''
    form.elements.recovery_message.value=f.recovery_message || ''
    form.elements.category.value=f.category || 'Normal'
  } else { form.elements.code.disabled=false }
  document.querySelector('#fault-dialog').showModal()
}
function closeDialog(){ document.querySelector('#fault-dialog').close(); document.querySelector('#fault-form').elements.code.disabled=false }
async function saveFault(e) {
  e.preventDefault()
  const form=e.currentTarget, fd=new FormData(form)
  const code=Number(fd.get('code'))
  const payload={code, message:String(fd.get('message')).trim(), recovery_code:fd.get('recovery_code')?Number(fd.get('recovery_code')):null, recovery_message:String(fd.get('recovery_message')||'').trim()||null, updated_at:new Date().toISOString()}
  if(!Number.isSafeInteger(code)||!payload.message) return notify('Enter a valid code and fault message.',true)
  let result
  if(editingCode===null) result=await supabase.from('faults').insert(payload)
  else result=await supabase.from('faults').update(payload).eq('code',editingCode)
  if(result.error) return notify(result.error.message,true)
  const cat=String(fd.get('category'))
  const cls=await supabase.from('fault_classifications').upsert({code,category:cat},{onConflict:'code,category'})
  if(cls.error) return notify(`Fault saved, but classification failed: ${cls.error.message}`,true)
  closeDialog(); notify('Fault saved successfully.'); await loadFaults()
}
async function deleteFault(code) {
  if(!confirm(`Delete fault ${code} and its classification? This cannot be undone.`)) return
  const {error}=await supabase.from('faults').delete().eq('code',code)
  if(error) return notify(error.message,true)
  notify('Fault deleted.'); await loadFaults()
}
async function boot() {
  const {data:{session}}=await supabase.auth.getSession()
  if(!session) return renderAuth()
  renderApp(session.user)
  supabase.auth.onAuthStateChange((_event,s)=>{ if(!s) renderAuth() })
}
if(!configReady) {
  app.innerHTML=`<main class="auth-wrap"><section class="auth-card"><div class="brand-mark">C</div><p class="eyebrow">SETUP REQUIRED</p><h1>Connect Supabase</h1><p class="muted">Copy <code>.env.example</code> to <code>.env</code> and enter your Supabase Project URL and Publishable Key. Then restart the development server.</p><p class="hint">Never use a service-role or secret key in this frontend project.</p></section></main>`
} else boot()
