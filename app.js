/* The Suan Dusit Place — mobile frontend. Change visual styles in styles.css;
   edit menu.xlsx then run build_menu_data.py to update all real menu prices. */
(() => {
'use strict';
const MENU = window.SUAN_DUSIT_MENU || [];
const ZH = window.SUAN_DUSIT_MENU_ZH || {items:{},categories:{}};
const $ = id => document.getElementById(id);
const q = s => document.querySelector(s);
const qa = s => [...document.querySelectorAll(s)];
const esc = str => String(str ?? '').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const load = (key,otherwise) => { try { return JSON.parse(localStorage.getItem(key)) ?? otherwise; } catch { return otherwise; } };
const save = (key,obj) => { try { localStorage.setItem(key,JSON.stringify(obj)); } catch {} };
/* Responsive: expose the real visible viewport height (URL bars, keyboard, rotation) to CSS as --app-h. */
const setAppHeight=()=>document.documentElement.style.setProperty('--app-h',Math.round(window.visualViewport?.height||window.innerHeight)+'px');
setAppHeight();
['resize','orientationchange'].forEach(ev=>window.addEventListener(ev,setAppHeight));
window.visualViewport?.addEventListener('resize',setAppHeight);
const queryParams = new URLSearchParams(location.search);
const qrToken = queryParams.get('qr') || '';
const table = (queryParams.get('table') || queryParams.get('zone') || '03').replace(/[^a-zA-Z0-9ก-๙_-]/g,'').slice(0,10) || '03';
const storedSession=load('sdp_session_'+table,null);
const newSession=()=>{try{return Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');}catch{return Array.from({length:32},()=>Math.floor(Math.random()*16).toString(16)).join('');}};
const session=(typeof storedSession==='string' && /^[a-f0-9-]{16,64}$/.test(storedSession))?storedSession:newSession();
save('sdp_session_'+table,session);
const state = {tableClosed:false,lang:(['en','zh'].includes(queryParams.get('lang'))?queryParams.get('lang'):'th'),screen:'splashScreen',category:'recommended',search:'',cart:load('sdp_cart_'+table,[]),editKey:null,custom:null,order:load('sdp_last_order_'+table,null),history:load('sdp_order_history_'+table,[]),demo:false,busy:false};
const categories = [...new Set(MENU.map(m=>m.category))];
const RECOMMENDED=['AP-01','AP-02','SA-05','OD-01','NO-01','DF-01','SF-01','CU-01','HS-01','IN-01','DE-01','BE-01'];
/* Presentation only (no effect on orders/prices) — edit freely.
   Tags shown on dish cards; photos appear ONLY on the Recommended showcase:
   drop a file named <menu id>.jpg into assets/food/ (e.g. assets/food/AP-01.jpg).
   Until a photo exists the card shows an emerald plate with a gold monogram. */
const TAGS={signature:['AP-01','AP-02','HS-01','CU-01'],mustTry:['NO-01','OD-01','SA-05','DE-01']};
const PHOTO_DIR='assets/food/';
const PHOTO_EXT={};
const photoPath=id=>PHOTO_DIR+id+'.'+(PHOTO_EXT[id]||'jpg');
const dic={
 th:{orderFood:'สั่งอาหาร',menuSubtitle:'เลือกเมนูโปรดของคุณได้เลย',viewCart:'ดูตะกร้า',priceNote:'ราคาอาหารยังไม่รวมภาษีมูลค่าเพิ่ม 7%',cartTitle:'ตะกร้าอาหาร',yourOrder:'รายการอาหารของคุณ',checkOrder:'ตรวจสอบรายการก่อนยืนยันการสั่งอาหาร',placeOrder:'ยืนยันและส่งออเดอร์',moreFood:'สั่งอาหารเพิ่ม',recommended:'เมนูแนะนำ',search:'ค้นหาเมนูอาหาร / Search menu',menuCount:'เมนู',noResult:'ไม่พบเมนูอาหาร',noResultSub:'ลองค้นหาด้วยชื่ออื่นหรือเลือกหมวดหมู่',extraNote:'รายละเอียดเพิ่มเติม',notePlaceholder:'เช่น ไม่ใส่ผักชี ไม่ใส่หอมใหญ่',quantity:'จำนวน',addCart:'เพิ่มลงตะกร้า',saveEdit:'บันทึกการแก้ไข',cancel:'ยกเลิก',edit:'แก้ไข',remove:'ลบ',table:'โต๊ะ',noCart:'ยังไม่มีรายการอาหาร',noCartSub:'กลับไปเลือกเมนูที่ต้องการได้เลย',orderEmpty:'กรุณาเลือกอาหารก่อน',note:'หมายเหตุ',added:'เพิ่มอาหารลงตะกร้าแล้ว',sent:'ส่งออเดอร์แล้ว',loading:'กำลังส่ง...',orderHistory:'ประวัติการสั่งอาหาร',pastOrders:'รายการที่เคยสั่ง',historyHint:'รวมรายการอาหารทั้งหมดที่คุณสั่งจากอุปกรณ์นี้',historyPrivacy:'แสดงออเดอร์ที่สั่งจากอุปกรณ์นี้เท่านั้น เพื่อไม่เปิดเผยรายการของลูกค้าคนอื่นที่ใช้โต๊ะเดียวกัน',noHistory:'ยังไม่มีประวัติการสั่งอาหาร',noHistorySub:'เมื่อส่งคำสั่งซื้อ รายการจะปรากฏที่หน้านี้',timePlaced:'สั่งเมื่อ',orderNo:'คำสั่งซื้อ',receiptTitle:'ใบเสร็จรับเงิน',combinedReceipt:'ใบเสร็จรวมทุกออเดอร์',ordersUnit:'ออเดอร์',dateLabel:'วันที่',colItem:'รายการ',colAmount:'จำนวนเงิน',thanks:'ขอบคุณที่ใช้บริการ',orderPlaced:'ส่งออเดอร์เรียบร้อยแล้ว',grandTotal:'ยอดรวมสุทธิ',foodPrice:'ราคาอาหาร',vat7:'ภาษีมูลค่าเพิ่ม 7%',viewReceipt:'ดูใบเสร็จ',itemsUnit:'รายการ'},
 en:{orderFood:'Order Food',menuSubtitle:'Choose your favorites',viewCart:'View Cart',priceNote:'Menu prices exclude 7% VAT',cartTitle:'Your Cart',yourOrder:'Your order',checkOrder:'Please check items before confirming',placeOrder:'Confirm & Send Order',moreFood:'Order More',recommended:'Recommended',search:'Search dishes / ค้นหาเมนูอาหาร',menuCount:'items',noResult:'No dishes found',noResultSub:'Try another search or category',extraNote:'Additional Notes',notePlaceholder:'e.g. No cilantro, no onion',quantity:'Quantity',addCart:'Add to Cart',saveEdit:'Save Changes',cancel:'Cancel',edit:'Edit',remove:'Remove',table:'Table',noCart:'Your cart is empty',noCartSub:'Go back and choose some food',orderEmpty:'Please select food first',note:'Note',added:'Added to cart',sent:'Order sent',loading:'Sending...',orderHistory:'Order History',pastOrders:'Your Previous Orders',historyHint:'All dishes you have ordered from this device',historyPrivacy:'Orders from this device only. Other guests’ orders at the same table are not shown.',noHistory:'No orders yet',noHistorySub:'Orders you submit will appear here',timePlaced:'Placed',orderNo:'Order',receiptTitle:'Receipt',combinedReceipt:'Combined Receipt',ordersUnit:'orders',dateLabel:'Date',colItem:'ITEM',colAmount:'AMOUNT',thanks:'Thank you for dining with us',orderPlaced:'Order sent successfully',grandTotal:'Grand Total',foodPrice:'Subtotal',vat7:'VAT 7%',viewReceipt:'View Receipt',itemsUnit:'items'},
 zh:{orderFood:'点餐',menuSubtitle:'选择您喜爱的菜品',viewCart:'查看购物车',priceNote:'菜品价格不含 7% 增值税',cartTitle:'购物车',yourOrder:'您的订单',checkOrder:'确认下单前请核对菜品',placeOrder:'确认并提交订单',moreFood:'继续点餐',recommended:'推荐菜品',search:'搜索菜品 / Search menu',menuCount:'道菜',noResult:'未找到菜品',noResultSub:'请尝试其他关键词或分类',extraNote:'备注',notePlaceholder:'例如：不要香菜、不要洋葱',quantity:'数量',addCart:'加入购物车',saveEdit:'保存修改',cancel:'取消',edit:'修改',remove:'删除',table:'桌号',noCart:'购物车是空的',noCartSub:'请返回菜单选择菜品',orderEmpty:'请先选择菜品',note:'备注',added:'已加入购物车',sent:'订单已提交',loading:'提交中...',orderHistory:'点餐记录',pastOrders:'历史订单',historyHint:'您在本设备上点过的所有菜品',historyPrivacy:'仅显示本设备下的订单，不会显示同桌其他客人的订单。',noHistory:'暂无点餐记录',noHistorySub:'提交订单后，记录会显示在这里',timePlaced:'下单时间',orderNo:'订单',receiptTitle:'收据',combinedReceipt:'合并收据',ordersUnit:'笔订单',dateLabel:'日期',colItem:'菜品',colAmount:'金额',thanks:'感谢惠顾，欢迎再次光临',orderPlaced:'订单提交成功',grandTotal:'应付总额',foodPrice:'菜品小计',vat7:'增值税 7%',viewReceipt:'查看收据',itemsUnit:'项'}
};
const L=(th,en,zh)=>state.lang==='en'?en:state.lang==='zh'?zh:th;
const t = key => dic[state.lang][key] ?? key;
const name = item => (state.lang==='en'? item.en : state.lang==='zh'? (ZH.items[item.id]||item.en) : item.th);
const subName = item => (state.lang==='th'? item.en : item.th);
const catName = (cat,en) => (state.lang==='th'? cat : state.lang==='zh'? (ZH.categories[cat]||en||cat) : (en||cat));
const price = number => '฿'+Number(number || 0).toLocaleString('en-US',{maximumFractionDigits:2});
const money = number => '฿'+Number(number || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const round2 = n => Math.round((Number(n||0)+Number.EPSILON)*100)/100;
/* Menu prices are PRE-VAT (exclude 7% VAT): subtotal = sum of item prices, VAT is added on top. */
const VAT_RATE=0.07;
const vatSplit = sum => {const subtotal=round2(sum),vat=+(subtotal*VAT_RATE).toFixed(2),grandTotal=+(subtotal+vat).toFixed(2);return {subtotal,vat,grandTotal};};
const getItem = id => MENU.find(m=>m.id===id);
const variantsOf = item => Array.isArray(item?.variants) ? item.variants : [];
const selectedVariant = entry => {const item=getItem(entry?.itemId);const variants=variantsOf(item);return variants.find(v=>v.label===(entry?.variant||entry?.size))||variants[0]||{label:'',price:0};};
const unitPrice = entry => Number(selectedVariant(entry).price || 0);
const qtyTotal = () => state.cart.reduce((n,c)=>n+c.quantity,0);
const amountTotal = () => state.cart.reduce((n,c)=>n+unitPrice(c)*c.quantity,0);
const persistCart = () => save('sdp_cart_'+table,state.cart);
const I=p=>`<svg class="ico" viewBox="0 0 24 24">${p}</svg>`;
const ICON={edit:I('<path d="M4 20h4L19 9l-4-4L4 16z"/>')};
let closeTimer;
const show = id => {qa('.image-screen,.working-screen').forEach(el=>el.classList.toggle('active',el.id===id)); state.screen=id;
 /* cart = bottom-sheet drawer: keep the menu painted underneath it */
 $('menuScreen').classList.toggle('under',id==='cartScreen'); $('cartScrim').classList.toggle('show',id==='cartScreen');};
let toastTimer;
const toast = str => {let n=$('toast');n.textContent=str;n.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>n.classList.remove('show'),2800);};
const titleFallback = (item) => esc(name(item));
function refreshLang(){
 document.documentElement.lang=state.lang==='zh'?'zh-CN':state.lang;
 $('welcomeWord').textContent=L('ยินดีต้อนรับ','Welcome','欢迎光临');
 $('welcomeTo').textContent=L('สู่','to','');
 $('welcomeTo').hidden=state.lang==='zh';
 $('welcomePlace').textContent='The Suan Dusit Place';
 $('welcomeScanTitle').textContent=L('สแกน QR Code สำเร็จ','QR Code Scanned Successfully','扫码成功');
 $('tableNoLabel').textContent=L('หมายเลขโต๊ะ','TABLE NO.','桌号');
 $('welcomeReadyTitle').textContent=L('พร้อมสั่งอาหาร','Ready to Order','可以点餐了');
 $('welcomeReadySub').textContent=L('เลือกเมนูอาหารที่คุณชื่นชอบได้เลย','Choose your favorite menu.','请选择您喜爱的菜品。');
 $('welcomeLangLabel').textContent=L('ภาษา / Language','ภาษา / Language','语言 / Language');
 $('welcomeThai').textContent='ไทย'; $('welcomeEnglish').textContent='English'; $('welcomeChinese').textContent='中文';
 $('startOrder').textContent=L('เริ่มสั่งอาหาร','START ORDER','开始点餐');
 qa('[data-language]').forEach(el=>el.classList.toggle('active',el.dataset.language===state.lang));
 qa('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
 $('menuSearch').placeholder=t('search');
 $('menuLangTH').classList.toggle('active',state.lang==='th');
 $('menuLangEN').classList.toggle('active',state.lang==='en');
 $('menuLangZH').classList.toggle('active',state.lang==='zh');
 $('closedTitle').textContent=L('โต๊ะนี้ปิดให้บริการแล้ว','This table is closed','此桌已停止服务');
 $('closedBody').textContent=L('ไม่สามารถสั่งอาหารได้ กรุณาติดต่อพนักงานเพื่อเปิดโต๊ะใหม่','Ordering is no longer available. Please contact staff to reopen the table.','无法继续点餐，请联系工作人员重新开桌。');
 $('closedTable').textContent=L('โต๊ะ','Table','桌号')+' '+table;
 $('heroTableText').textContent=L('โต๊ะ','Table','桌号')+' '+table;
 $('cartTable').textContent=L('โต๊ะ','Table','桌号')+' '+table; $('receiptTable').textContent=table; $('historyTable').textContent=table;
 $('dynamicTable').hidden=true; $('dynamicTable').textContent=table; $('welcomeTable').textContent=table;
 renderCategories();renderMenu();renderCart();if(state.order||state.receiptCombined)renderReceipt();renderHistory();refreshCartCount();
}
function setLang(lang){state.lang=lang; refreshLang();}
function renderCategories(){
 const current=state.category;
 $('categoryList').innerHTML=[{key:'recommended',label:L('แนะนำ','Recommended','推荐')}, ...categories.map(cat=>({key:cat,label:catName(cat,MENU.find(x=>x.category===cat)?.categoryEn)}))].map(c=>`<button class="category-btn ${current===c.key?'active':''}" data-cat="${esc(c.key)}" type="button">${esc(c.label)}</button>`).join('');
}
const qtyOf=id=>state.cart.filter(c=>c.itemId===id).reduce((n,c)=>n+c.quantity,0);
const tagsOf=id=>(TAGS.signature.includes(id)?'<span class="tag tag-sig">✨ Signature</span>':'')+(TAGS.mustTry.includes(id)?'<span class="tag tag-hot">🔥 Must Try</span>':'');
function stepperInner(item){
 const n=qtyOf(item.id),nm=esc(name(item));
 return n?`<button type="button" class="step-btn" data-minus="${esc(item.id)}" aria-label="${esc(L('ลดจำนวน','Decrease','减少'))} ${nm}">−</button><span class="step-n" aria-live="polite">${n}</span><button type="button" class="step-btn plus" data-plus="${esc(item.id)}" aria-label="${esc(L('เพิ่มจำนวน','Increase','增加'))} ${nm}">+</button>`
  :`<button type="button" class="step-add" data-plus="${esc(item.id)}" aria-label="${esc(t('addCart'))} ${nm}">+</button>`;
}
const stepper=item=>`<div class="stepper${qtyOf(item.id)?' on':''}" data-stepper="${esc(item.id)}">${stepperInner(item)}</div>`;
function updateSteppers(){
 const a=document.activeElement,was=a&&a.closest&&a.closest('[data-stepper]')?(a.dataset.plus?['plus',a.dataset.plus]:a.dataset.minus?['minus',a.dataset.minus]:null):null;
 qa('[data-stepper]').forEach(el=>{const item=getItem(el.dataset.stepper);if(!item)return;const html=stepperInner(item);if(el._h!==html){el.innerHTML=html;el._h=html;}el.classList.toggle('on',qtyOf(item.id)>0);});
 if(was){const n=q(`[data-${was[0]}="${CSS.escape(was[1])}"]`)||q(`[data-plus="${CSS.escape(was[1])}"]`);n?.focus({preventScroll:true});}
}
function showcaseCard(item){
 const mono=esc((item.en||item.th||'·').trim().charAt(0).toUpperCase());
 return `<article class="show-card"><button type="button" class="show-open" data-open="${esc(item.id)}"><span class="show-photo" data-mono="${mono}"><img src="${esc(photoPath(item.id))}" alt="${esc(name(item))}" loading="lazy" decoding="async" onerror="this.remove()"><span class="show-cat">${esc(catName(item.category,item.categoryEn))}</span></span><span class="show-text"><span class="tags">${tagsOf(item.id)}</span><span class="show-name">${titleFallback(item)}</span><span class="show-sub">${esc(subName(item))}</span></span></button><div class="show-foot"><span class="price">${price(item.variants[0].price)}</span>${stepper(item)}</div></article>`;
}
function dishCard(item){
 const tags=tagsOf(item.id);
 return `<article class="dish"><button type="button" class="dish-open" data-open="${esc(item.id)}">${tags?`<span class="tags">${tags}</span>`:''}<span class="dish-name">${titleFallback(item)}</span><span class="dish-sub">${esc(subName(item))}</span></button><div class="dish-side"><span class="price">${price(item.variants[0].price)}</span>${stepper(item)}</div></article>`;
}
function renderMenu(){
 const needle=state.search.trim().toLocaleLowerCase();
 let visible=state.category==='recommended'?MENU.filter(m=>RECOMMENDED.includes(m.id)) : MENU.filter(m=>m.category===state.category);
 if(needle) visible=MENU.filter(m=>[m.th,m.en,ZH.items[m.id]||'',m.id,m.category,m.categoryEn,ZH.categories[m.category]||''].join(' ').toLocaleLowerCase().includes(needle));
 $('menuResultCount').textContent=visible.length+' '+t('menuCount');
 let heading=state.category==='recommended'?t('recommended'):catName(state.category,MENU.find(m=>m.category===state.category)?.categoryEn);
 $('currentCategory').textContent=needle?L('ผลการค้นหา','Search results','搜索结果'):heading;
 if(!visible.length){$('menuList').innerHTML=`<div class="empty-state"><b>${t('noResult')}</b>${t('noResultSub')}</div>`;return;}
 if(state.category==='recommended'&&!needle){
  const index=categories.map(cat=>{const en=MENU.find(x=>x.category===cat)?.categoryEn,count=MENU.filter(x=>x.category===cat).length;
   return `<button type="button" class="cat-tile" data-cat-go="${esc(cat)}"><b>${esc(catName(cat,en))}</b><small>${esc(state.lang==='th'?(en||''):cat)}</small><span>${count} ${esc(t('menuCount'))}</span></button>`;}).join('');
  $('menuList').innerHTML=`<div class="show-rail" role="list">${visible.map(showcaseCard).join('')}</div><section class="cat-index"><h2>${esc(L('หมวดหมู่อาหาร','Browse the menu','菜单分类'))}</h2><div class="cat-grid">${index}</div></section>`;
  return;
 }
 $('menuList').innerHTML=`<div class="dish-list">${visible.map(dishCard).join('')}</div>`;
}
/* one-tap add / remove from the menu (a no-note line); tapping the dish opens the note sheet as before */
function quickRemove(id){
 const lines=state.cart.filter(c=>c.itemId===id);if(!lines.length)return;
 modifyCart((lines.find(c=>!c.note)||lines[lines.length-1]).key,-1);
}
function selectCategory(key){state.category=key;state.search='';$('menuSearch').value='';$('clearSearch').hidden=true;renderCategories();renderMenu();const sc=$('menuScroll');sc.scrollTo({top:q('.menu-hero').offsetHeight,behavior:'smooth'});
 /* centre the active pill by scrolling only the pill row, so the vertical scroll above isn't interrupted */
 const row=$('categoryList'),pill=q('.category-btn.active');if(pill)row.scrollTo({left:pill.offsetLeft-(row.clientWidth-pill.offsetWidth)/2,behavior:'smooth'});}
let lastCount=qtyTotal();
function bump(el){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}
function refreshCartCount(){
 const count=qtyTotal();if(count>lastCount){bump($('cartCountTop'));bump($('floatingCart'));}lastCount=count;
 $('cartCountTop').textContent=count; $('cartCountTop').hidden=count===0;
 $('floatingCart').hidden=count===0;
 $('floatingCount').textContent=count+' '+t('itemsUnit');
 $('floatingPrice').textContent=price(amountTotal());
 updateSteppers();
}
function updateSheetPrice(){const c=state.custom,unit=unitPrice(c);if($('sheetPrice'))$('sheetPrice').textContent=price(unit);if($('sheetAddBtn'))$('sheetAddBtn').textContent=t(state.editKey?'saveEdit':'addCart')+' • '+price(unit*c.quantity);}
function updateSheetQty(){if($('sheetQty'))$('sheetQty').textContent=state.custom.quantity;updateSheetPrice();}
function selectSheetVariant(label){if(!state.custom)return;state.custom.variant=label;qa('[data-variant]').forEach(el=>el.classList.toggle('active',el.dataset.variant===label));updateSheetPrice();}
function sheet(html,actions){clearTimeout(closeTimer);$('sheetOverlay').classList.remove('closing');$('sheetBody').innerHTML=html;$('sheetActions').innerHTML=actions;$('sheetOverlay').hidden=false;}
function closeSheet(){const o=$('sheetOverlay');if(o.hidden)return;state.custom=null;state.editKey=null;o.classList.add('closing');clearTimeout(closeTimer);closeTimer=setTimeout(()=>{o.hidden=true;o.classList.remove('closing');},200);}
function openItemModal(itemId, key){
 if(state.tableClosed)return;
 const item=getItem(itemId);if(!item)return;
 const existing=key?state.cart.find(x=>x.key===key):null;
 state.editKey=key||null;
 const variants=variantsOf(item);
 state.custom=existing?structuredClone(existing):{key:null,itemId:item.id,variant:variants[0]?.label||'',note:'',quantity:1};
 if(!state.custom.variant)state.custom.variant=variants[0]?.label||'';
 const c=state.custom;
 const tags=tagsOf(item.id);
 let html=`<div class="sheet-title-row"><div>${tags?`<div class="sheet-badge">${tags}</div>`:''}<h2 id="sheetTitle">${titleFallback(item)}</h2><p>${esc(subName(item))}</p></div><strong id="sheetPrice" class="price">${price(unitPrice(c))}</strong></div><div class="sheet-divider"></div>`;
 if(variants.length>1)html+=`<section class="size-options" aria-label="${esc(L('เลือกขนาด','Select size','选择规格'))}"><div class="option-title">${esc(L('เลือกขนาด','Select size','选择规格'))}</div><div class="size-pills">${variants.map(v=>`<button type="button" class="size-pill${v.label===c.variant?' active':''}" data-variant="${esc(v.label)}">${esc(v.label)} <span>${price(v.price)}</span></button>`).join('')}</div><div class="sheet-divider"></div></section>`;
 html+=`<div class="option-block"><label for="customNote" class="option-title">${ICON.edit} ${t('extraNote')}</label><textarea class="custom-input" id="customNote" maxlength="300" placeholder="${esc(t('notePlaceholder'))}">${esc(c.note)}</textarea></div>`;
 const actions=`<div class="sheet-qty-row"><strong>${t('quantity')}</strong><div class="qty-controls"><button id="sheetMinus" type="button" aria-label="−">−</button><span id="sheetQty">${c.quantity}</span><button id="sheetPlus" type="button" aria-label="+">+</button></div></div><button type="button" class="primary-btn" id="sheetAddBtn">${t(key?'saveEdit':'addCart')} • ${price(unitPrice(c)*c.quantity)}</button>`;
 sheet(html,actions);
}
function saveCustom(){
 const c=state.custom;if(!c)return;
 c.note=$('customNote')?.value.trim()||'';
 if(state.editKey){state.cart=state.cart.map(e=>e.key===state.editKey?c:e);}
 else{
  const match=state.cart.find(e=>e.itemId===c.itemId&&(e.variant||selectedVariant(e).label)===c.variant&&(e.note||'')===c.note);
  if(match)match.quantity=Math.min(50,match.quantity+c.quantity);
  else{c.key=Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);state.cart.push(c);}
 }
 persistCart();refreshCartCount();renderCart();closeSheet();toast(t('added'));
}
function describe(c){let a=[];const item=getItem(c.itemId),v=selectedVariant(c);
 if(variantsOf(item).length>1&&v.label)a.push(v.label);
 if(c.note)a.push(t('note')+': '+c.note);
 return a.join(' · ');
}
function renderCart(){
 const cartSplit=vatSplit(amountTotal());
 $('cartTotal').textContent=money(cartSplit.subtotal);$('cartVat').textContent=money(cartSplit.vat);$('cartGrand').textContent=money(cartSplit.grandTotal);
 const n=$('cartItems');
 n.innerHTML=state.cart.length?state.cart.map(c=>{const item=getItem(c.itemId);if(!item)return '';
 const opts=describe(c);
 return `<article class="cart-line"><div class="cart-line-main"><div><h3>${titleFallback(item)}</h3><small>${esc(subName(item))}</small></div><b class="cart-line-price price">${price(unitPrice(c)*c.quantity)}</b></div>${opts?`<div class="cart-line-options">${esc(opts)}</div>`:''}<div class="cart-line-foot"><div class="cart-line-tools"><button class="text-link" data-edit="${esc(c.key)}" type="button">${t('edit')}</button><button class="text-link danger" data-remove="${esc(c.key)}" type="button">${t('remove')}</button></div><div class="qty-controls"><button data-decrement="${esc(c.key)}" type="button" aria-label="−">−</button><span>${c.quantity}</span><button data-increment="${esc(c.key)}" type="button" aria-label="+">+</button></div></div></article>`;}).join(''):`<div class="empty-state"><b>${t('noCart')}</b>${t('noCartSub')}</div>`;
 $('submitOrder').disabled=!state.cart.length||state.busy;
}
function modifyCart(key,diff){let entry=state.cart.find(c=>c.key===key);if(!entry)return;entry.quantity+=diff;if(entry.quantity<=0)state.cart=state.cart.filter(c=>c.key!==key);persistCart();refreshCartCount();renderCart();}
async function postJson(endpoint,body){const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),10000);try{let response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctl.signal});if(!response.ok)throw Error('HTTP '+response.status);return await response.json();}finally{clearTimeout(timer);}}
/* One client_request_id per distinct checkout attempt. If a submit fails (timeout / network) and the guest
   retries the exact same cart, the SAME id is re-sent so the server can recognise a duplicate. Any change to the
   cart (or table/QR) produces a new id. Persisted so a reload between the failure and the retry keeps the id. */
const newRequestId=()=>{try{if(crypto.randomUUID)return crypto.randomUUID();}catch{}return newSession();};
const pendingKey='sdp_pending_'+table;
let pending=load(pendingKey,null);
function requestIdFor(sig){
 if(!(pending&&pending.sig===sig&&typeof pending.id==='string')){pending={sig,id:newRequestId()};save(pendingKey,pending);}
 return pending.id;
}
function clearPending(){pending=null;try{localStorage.removeItem(pendingKey);}catch{}}
/* ---- Offline demo: no backend reachable (index.html opened directly, or a static host without the API).
   The order is kept on this device only so the whole guest flow can still be demonstrated. ---- */
const NO_BACKEND=location.protocol==='file:'||window.SDP_STATIC_DEMO===true; /* SDP_STATIC_DEMO: set by build_github_demo.py for GitHub Pages */
const isNoBackend=err=>NO_BACKEND||err instanceof TypeError||/HTTP (404|405|501)/.test(String(err?.message||''));
function localDemoOrder(items){
 const stamp=new Date(),pad=n=>String(n).padStart(2,'0');
 const id='DEMO-'+pad(stamp.getFullYear()%100)+pad(stamp.getMonth()+1)+pad(stamp.getDate())+'-'+Math.random().toString(36).slice(2,8).toUpperCase();
 const lines=items.map((it,i)=>{const item=getItem(it.id),v=variantsOf(item).find(x=>x.label===it.variant)||variantsOf(item)[0]||{price:0};
  return {id:it.id,nameTh:item?.th||it.id,nameEn:item?.en||it.id,variant:it.variant,price:Number(v.price||0),quantity:it.quantity,note:it.note||'',lineId:i+1,status:'received'};});
 return {id,table,created_at:stamp.toISOString(),status:'received',payment_status:'unpaid',source:'qr',subtotal:round2(lines.reduce((n,l)=>n+l.price*l.quantity,0)),items:lines,_demo:true};
}
async function placeOrder(){
 if(state.tableClosed)return;
 if(!state.cart.length){toast(t('orderEmpty'));return;}
 if(state.busy)return; /* in-flight lock: ignore taps until the request settles */
 state.busy=true;const btn=$('submitOrder');btn.disabled=true;btn.textContent=t('loading');
 const items=state.cart.map(c=>({id:c.itemId,variant:selectedVariant(c).label,quantity:c.quantity,note:c.note}));
 const requestId=requestIdFor(JSON.stringify([table,qrToken,items]));
 let data=null,failure=null;
 if(NO_BACKEND)data=localDemoOrder(items);
 else{
  try{data=await postJson('/api/orders',{table,language:state.lang,session,source:'qr',qr_token:qrToken,client_request_id:requestId,items});}
  catch(e){if(isNoBackend(e))data=localDemoOrder(items);else failure=e;}
 }
 state.busy=false;btn.textContent=t('placeOrder');
 if(failure){
  const msg=String(failure.message||'');
  renderCart(); /* re-enable the button according to the cart */
  if(msg.includes('HTTP 403')){lockTable();return;} /* table closed or QR token no longer active */
  if(msg.includes('HTTP 409')){toast(L('โต๊ะนี้ยังไม่เปิดให้สั่งอาหาร กรุณาแจ้งพนักงาน','This table is not open for ordering. Please ask staff.','此桌尚未开放点餐，请联系工作人员。'));return;}
  if(failure.name==='AbortError'){toast(L('การเชื่อมต่อช้า ออเดอร์อาจถูกส่งแล้ว กรุณาตรวจสอบประวัติการสั่งอาหารก่อนลองใหม่','Slow connection — your order may already have been sent. Check Order History before retrying.','网络较慢，订单可能已提交。重试前请先查看点餐记录。'));return;}
  toast(L('ส่งออเดอร์ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่','Order failed. Check the connection and retry.','提交失败，请检查网络后重试。'));return;
 }
 clearPending();
 const offline=!!data._demo;
 state.order={...data,_demo:offline};state.demo=offline;
 rememberOrder(state.order);
 save('sdp_last_order_'+table,state.order);state.cart=[];persistCart();
 refreshCartCount();renderCart();state.receiptCombined=false;renderReceipt();show('receiptScreen');
 toast(offline?L('โหมดสาธิต: บันทึกออเดอร์ไว้บนเครื่องนี้ (ไม่ได้ส่งเข้าครัว)','Demo mode: order saved on this device only (not sent to kitchen)','演示模式：订单仅保存在本设备（未发送到厨房）'):t('sent'));
}
function lineName(it){const item=getItem(it.id);return esc(state.lang==='en'?(it.nameEn||item?.en||it.nameTh||it.id):state.lang==='zh'?(ZH.items[it.id]||it.nameEn||item?.en||it.nameTh||it.id):(it.nameTh||item?.th||it.nameEn||it.id));}
function lineExtras(it){
 const opts=[];
 if(it.note)opts.push(t('note')+': '+it.note);
 return esc(opts.join(' · '));
}
/* Unit price: stored on server orders; offline/demo orders fall back to the menu price. */
const linePrice=it=>Number(it.price ?? getItem(it.id)?.variants[0]?.price ?? 0);
const billableLines=order=>(order?.status==='cancelled'?[]:(order?.items||[]).filter(it=>it.status!=='cancelled'));
const orderTotal=order=>billableLines(order).reduce((n,it)=>n+linePrice(it)*(it.quantity||1),0);
function dateText(s){const d=new Date(s);return !Number.isNaN(d.getTime())?new Intl.DateTimeFormat(state.lang==='th'?'th-TH':state.lang==='zh'?'zh-CN':'en-GB',{timeZone:'Asia/Bangkok',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d):String(s||'');}
function rememberOrder(order){
 if(!order||!order.id)return;
 state.history=[order,...state.history.filter(o=>String(o.id)!==String(order.id))].slice(0,60);
 save('sdp_order_history_'+table,state.history);
}
const historyOrders=()=>[...state.history].filter(o=>o.status!=='cancelled').sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
/* Merge identical dishes from every order into single bill lines. */
function mergeLines(orders){
 const map=new Map();
 orders.forEach(o=>billableLines(o).forEach(it=>{
  const k=[it.id,it.variant||'',it.note||'',linePrice(it)].join('|');
  const prev=map.get(k);
  if(prev)prev.quantity+=(it.quantity||1);else map.set(k,{...it,quantity:it.quantity||1});
 }));
 return [...map.values()];
}
function renderReceipt(){
 const combined=!!state.receiptCombined;
 const orders=combined?historyOrders():(state.order?[state.order]:[]);
 if(!orders.length)return;
 const lines=combined?mergeLines(orders):billableLines(orders[0]);
 const split=vatSplit(lines.reduce((n,it)=>n+linePrice(it)*(it.quantity||1),0));
 $('receiptHeading').textContent=t(combined?'combinedReceipt':'orderPlaced');
 $('receiptMetaTable').textContent=table;
 $('receiptMetaOrder').textContent=combined?orders.length+' '+t('ordersUnit'):'#'+String(orders[0].id);
 $('receiptMetaDate').textContent=dateText(combined?new Date().toISOString():orders[0].created_at);
 $('receiptItems').innerHTML=lines.map(it=>{const qty=it.quantity||1,extra=lineExtras(it);return `<div class="receipt-line"><div class="receipt-line-main"><b>${esc(qty)} × ${lineName(it)}</b>${extra?`<small>${extra}</small>`:''}</div><span>${money(linePrice(it)*qty)}</span></div>`;}).join('');
 $('receiptFood').textContent=money(split.subtotal);
 $('receiptVat').textContent=money(split.vat);
 $('receiptGrand').textContent=money(split.grandTotal);
}
function renderHistory(){
 const list=$('historyOrders');if(!list)return;
 const hist=historyOrders();
 if(!hist.length){list.innerHTML=`<div class="empty-state"><b>${t('noHistory')}</b>${t('noHistorySub')}</div>`;$('historyTotalCard').hidden=true;return;}
 let totalSum=0;
 list.innerHTML=hist.map(o=>{
  const total=orderTotal(o);totalSum+=total;
  return `<article class="history-order-card"><div class="history-card-head"><div><div class="history-order-id">${t('orderNo')} #${esc(String(o.id))}</div><div class="history-time">${t('timePlaced')} ${esc(dateText(o.created_at))}</div></div><strong class="history-order-total">${money(total)}</strong></div>
 <div class="history-dish-list">${billableLines(o).map(it=>{const qty=it.quantity||1,extra=lineExtras(it);return `<div class="history-line"><span class="history-line-name">${esc(qty)} × ${lineName(it)}${extra?`<small>${extra}</small>`:''}</span><span class="history-line-price">${money(linePrice(it)*qty)}</span></div>`;}).join('')}</div></article>`;
 }).join('');
 const hs=vatSplit(totalSum);
 $('historyTotalSum').textContent=money(hs.subtotal);$('historyVat').textContent=money(hs.vat);$('historyGrand').textContent=money(hs.grandTotal);
 $('historyTotalCard').hidden=false;
}
async function refreshHistory(){
 if(NO_BACKEND){renderHistory();return;}
 try{
  const r=await fetch('/api/history?table='+encodeURIComponent(table)+'&session='+encodeURIComponent(session),{cache:'no-store'});
  if(!r.ok)throw Error('API '+r.status);
  const data=await r.json();
  for(const order of (data.orders||[]))rememberOrder(order);
 }catch(e){}
 renderHistory();
}
function openHistory(){renderHistory();show('historyScreen');refreshHistory();}
function openCombinedReceipt(){state.receiptCombined=true;renderReceipt();show('receiptScreen');}
/* ---- Closed-table lock: lightweight poll of table status ONLY (no dish-status polling) ---- */
const TABLE_POLL_MS=5000;
let tablePollTimer=null,tableChecking=false;
function lockTable(){
 if(state.tableClosed)return;
 state.tableClosed=true;
 clearInterval(tablePollTimer);tablePollTimer=null;
 state.cart=[];persistCart();clearPending();state.busy=false;
 closeSheet();refreshCartCount();renderCart();
 if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
 qa('.phone > :not(#closedLock)').forEach(el=>{el.inert=true;}); /* nothing behind the overlay is reachable by keyboard / screen reader */
 $('closedLock').hidden=false;
 $('closedLock').querySelector('.closed-card').focus({preventScroll:true});
}
async function checkTable(){
 if(state.tableClosed||tableChecking||document.hidden)return;
 tableChecking=true;
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),4000);
 try{
  const r=await fetch('/api/table-session?table='+encodeURIComponent(table),{cache:'no-store',signal:ctl.signal});
  if(r.status===403){lockTable();return;} /* server: table closed / no active qr_token */
  if(!r.ok)return; /* transient server error: never lock on uncertainty */
  const d=await r.json();
  if(d.demo){clearInterval(tablePollTimer);tablePollTimer=null;return;} /* demo server: tables never lock, stop polling */
  if(d.status!=='open'||(qrToken&&d.qr_token!==qrToken))lockTable(); /* closed, or reopened with a new QR token */
 }catch(e){/* offline / timeout: stay unlocked, try again next tick */}
 finally{clearTimeout(timer);tableChecking=false;}
}
function startTablePoll(){if(NO_BACKEND)return;checkTable();tablePollTimer=setInterval(checkTable,TABLE_POLL_MS);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkTable();});}
function wire(){
 $('skipSplash').addEventListener('click',()=>show('welcomeScreen'));
 setTimeout(()=>{if(state.screen==='splashScreen')show('welcomeScreen');},1150);
 qa('[data-language]').forEach(el=>el.addEventListener('click',()=>setLang(el.dataset.language)));
 $('startOrder').addEventListener('click',()=>{show('menuScreen');$('menuScroll').scrollTop=0;});
 $('openHistoryTop').addEventListener('click',openHistory);
 $('openHistoryMenu').addEventListener('click',openHistory);
 $('receiptHistory').addEventListener('click',openHistory);
 $('historyBack').addEventListener('click',()=>show('menuScreen'));
 $('historyMore').addEventListener('click',()=>show('menuScreen'));
 $('viewCombinedReceipt').addEventListener('click',openCombinedReceipt);
 $('backHome').addEventListener('click',()=>show('welcomeScreen'));
 $('openCart').addEventListener('click',()=>{renderCart();show('cartScreen');});
 $('openCartTop').addEventListener('click',()=>{renderCart();show('cartScreen');});
 $('cartBack').addEventListener('click',()=>show('menuScreen'));
 $('receiptBack').addEventListener('click',()=>show(state.receiptCombined?'historyScreen':'menuScreen'));
 $('orderMore').addEventListener('click',()=>show('menuScreen'));
 $('submitOrder').addEventListener('click',placeOrder);
 $('menuLangTH').addEventListener('click',()=>setLang('th'));
 $('menuLangEN').addEventListener('click',()=>setLang('en'));
 $('menuLangZH').addEventListener('click',()=>setLang('zh'));
 $('categoryList').addEventListener('click',e=>{const el=e.target.closest('[data-cat]');if(!el)return;selectCategory(el.dataset.cat);});
 $('menuSearch').addEventListener('input',e=>{state.search=e.target.value;$('clearSearch').hidden=!state.search;renderMenu();});
 $('clearSearch').addEventListener('click',()=>{state.search='';$('menuSearch').value='';$('clearSearch').hidden=true;renderMenu();});
 $('menuList').addEventListener('click',e=>{
  const b=e.target.closest('[data-plus],[data-minus],[data-open],[data-cat-go]');if(!b)return;
  /* '+' never adds silently: every item (single- or multi-variant) opens the customise sheet so a note can be entered first */
  if(b.dataset.plus)openItemModal(b.dataset.plus);
  else if(b.dataset.minus)quickRemove(b.dataset.minus);
  else if(b.dataset.open)openItemModal(b.dataset.open);
  else if(b.dataset.catGo)selectCategory(b.dataset.catGo);
 });
 $('cartScrim').addEventListener('click',()=>show('menuScreen'));
 $('cartItems').addEventListener('click',e=>{let el=e.target.closest('button');if(!el)return;if(el.dataset.edit){let entry=state.cart.find(c=>c.key===el.dataset.edit);if(entry)openItemModal(entry.itemId,entry.key);}else if(el.dataset.remove){state.cart=state.cart.filter(c=>c.key!==el.dataset.remove);persistCart();refreshCartCount();renderCart();}else if(el.dataset.increment){modifyCart(el.dataset.increment,1);}else if(el.dataset.decrement){modifyCart(el.dataset.decrement,-1);}});
 $('sheetBackdrop').addEventListener('click',closeSheet);$('sheetClose').addEventListener('click',closeSheet);
 $('sheetOverlay').addEventListener('click',e=>{
  let b=e.target.closest('button');if(!b)return;
  if(b.id==='sheetCancelBtn'){closeSheet();return;}
  if(b.id==='sheetAddBtn'){saveCustom();return;}
  if(b.id==='sheetMinus'||b.id==='sheetPlus'){if(!state.custom)return;state.custom.quantity=Math.max(1,Math.min(50,state.custom.quantity+(b.id==='sheetPlus'?1:-1)));updateSheetQty();return;}
  if(b.dataset.variant){selectSheetVariant(b.dataset.variant);return;}
 });
 document.addEventListener('keydown',e=>{if(e.key!=='Escape'||state.tableClosed)return;if(!$('sheetOverlay').hidden)closeSheet();else if(state.screen==='cartScreen')show('menuScreen');});
}
if(state.order && !state.history.some(o=>String(o.id)===String(state.order.id)))rememberOrder(state.order);
wire();refreshLang();startTablePoll();
if(state.order){state.demo=!!state.order._demo;}
})();
