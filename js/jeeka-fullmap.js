/* JEEKA 0.5 · Mapa abierto en pantalla completa + sidebar plegable.
   Identidad basada en la imagen original aportada. Todos los sitios son SIMULADOS.
   El CSV/IndexedDB sigue siendo una única serie, nunca cuatro fuentes independientes. */
(function(){
"use strict";
const D=window.JEEKA_DEMO, $=id=>document.getElementById(id);
if(!D){window.addEventListener("DOMContentLoaded",()=>document.body.insertAdjacentHTML("afterbegin",'<p role="alert">Falta el catálogo JEEKA.</p>'));return;}
const params=new URLSearchParams(location.search);
const METRIC={
 co2:{name:"CO₂ · SCD40",unit:"ppm",digits:0},
 temp:{name:"Temperatura",unit:"°C",digits:1},
 hum:{name:"Humedad relativa",unit:"%",digits:1},
 gas:{name:"Señal MQ135",unit:"ppm reportados*",digits:3}
};
let metric=METRIC[params.get("metric")]?params.get("metric"):"co2";
let siteId=D.sites.some(s=>s.id===params.get("site"))?params.get("site"):D.sites[0].id;
let stationId=/^[A-Z0-9_-]{2,32}$/.test(params.get("station")||"")?params.get("station"):D.stationId;
let points=D.minuteRows.map(r=>({ts:D.timestamp+" "+r[0]+":00",co2:r[1],temp:r[2],hum:r[3],gas:r[4]}));
let lastReading=D.defaultStats.last;
let index=params.has("index")&&Number.isFinite(+params.get("index"))?
 Math.min(points.length-1,Math.max(0,Math.floor(+params.get("index")))):points.length-1;
let map,group,markers=[],channel;
const norm=(num,d=0)=>Number(num).toLocaleString("es-MX",{minimumFractionDigits:d,maximumFractionDigits:d});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const selected=()=>D.sites.find(s=>s.id===siteId)||D.sites[0];
const current=()=>index===points.length-1&&lastReading?{...points[index],...lastReading}:points[index];
function pin(site){
 const on=site.id===siteId;
 const label=on?'<div class="atlas-pin-label">'+esc(site.name)+'<small>SIMULADO</small></div>':'';
 return L.divIcon({className:"atlas-pin-shell",iconSize:[34,43],iconAnchor:[17,36],popupAnchor:[0,-35],
 html:'<div class="atlas-pin'+(on?" selected":"")+'"><img src="./assets/jeeka-original-emblem.webp" alt=""></div>'+label});
}
function popup(site){
 const r=current(),m=METRIC[metric];
 return '<div class="atlas-marker-popup"><strong>'+esc(site.name)+'</strong><br><span class="status">SIMULADO</span>'+
 '<div class="details"><b>'+esc(m.name)+': '+norm(r[metric],m.digits)+' '+esc(m.unit)+'</b>'+
 '<br>CO₂ '+norm(r.co2)+' ppm · '+norm(r.temp,1)+' °C<br>Humedad '+norm(r.hum,1)+' % · MQ135 '+norm(r.gas,3)+'</div>'+
 '<small>'+esc(site.location)+'<br><b>Advertencia:</b> copia del mismo histórico en los cuatro sitios. No hay sensor aquí.</small></div>';
}
function redrawMarkers(){
 markers.forEach(entry=>{
  entry.marker.setIcon(pin(entry.site));
  entry.marker.setZIndexOffset(entry.site.id===siteId?1000:0);
  if(entry.marker.getPopup())entry.marker.setPopupContent(popup(entry.site));
  else entry.marker.bindPopup(popup(entry.site),{minWidth:205,maxWidth:280});
 });
}
function refresh(){
 if(!points.length)return;
 index=Math.max(0,Math.min(index,points.length-1));
 const site=selected(),r=current(),m=METRIC[metric];
 $("fullMetric").value=metric;
 $("fullTitle").textContent=site.name;
 $("siteType").textContent=site.kind+" · DEMO";
 $("siteAddress").textContent=site.location+" · "+(site.locNote||"punto aproximado");
 $("fullValue").textContent=norm(r[metric],m.digits);
 $("fullUnit").textContent=m.unit;
 $("metricName").textContent=m.name;
 $("fullCo2").textContent=norm(r.co2)+" ppm";
 $("fullTemp").textContent=norm(r.temp,1)+" °C";
 $("fullHum").textContent=norm(r.hum,1)+" %";
 $("fullGas").textContent=norm(r.gas,3)+"*";
 $("fullTimestamp").textContent=r.ts;
 $("fullSlider").max=points.length-1;
 $("fullSlider").value=index;
 $("fullRangeStart").textContent=points[0].ts.slice(5,16);
 $("fullRangeEnd").textContent=points[points.length-1].ts.slice(5,16);
 $("fullCount").textContent=points.length+" puntos por minuto; serie compartida";
 document.querySelectorAll("[data-site]").forEach(b=>{
  const isActive=b.dataset.site===siteId;
  b.classList.toggle("active",isActive);
  b.setAttribute("aria-pressed",isActive?"true":"false");
 });
 redrawMarkers();
}
function choose(id,pan=true,openPopup=true){
 if(!D.sites.some(s=>s.id===id))return;
 siteId=id;refresh();
 const item=markers.find(x=>x.site.id===id);
 if(map&&item){
  if(pan)map.panTo(item.marker.getLatLng(),{animate:true});
  if(openPopup)item.marker.openPopup();
 }
}
function fitAll(){
 if(map&&group)map.fitBounds(group.getBounds().pad(.48),{maxZoom:13,animate:true});
}
function setSidebar(open){
 const shell=$("atlasShell");
 shell.classList.toggle("collapsed",!open);
 $("sideToggle").textContent=open?"‹":"›";
 $("sideToggle").setAttribute("aria-expanded",open?"true":"false");
 $("sideToggle").setAttribute("aria-label",open?"Plegar sidebar":"Desplegar sidebar");
 if(map){
  setTimeout(()=>map.invalidateSize({pan:false}),250);
  setTimeout(()=>map.invalidateSize({pan:false}),360);
 }
}
async function loadLocal(){
 if(!window.JeekaImport)return;
 try{
  const history=await window.JeekaImport.load(stationId);
  if(!history.readings.length){
   $("sourceType").textContent="Histórico incluido · archivo CSV 04/11/2026";
   $("sourceDetail").textContent="Se está usando el demo integrado; ningún sensor local está conectado.";
   return;
  }
  const summary=window.JeekaImport.summary(history.readings);
  points=summary.rows.map(x=>({ts:x.ts,co2:x.co2,temp:x.temp,hum:x.hum,gas:x.gas}));
  lastReading=summary.stats.last;
  index=params.has("index")&&Number.isFinite(+params.get("index"))?
   Math.min(points.length-1,Math.max(0,Math.floor(+params.get("index")))):points.length-1;
  $("sourceType").textContent="Histórico local de "+stationId+" · mismas lecturas en cuatro sitios";
  $("sourceDetail").textContent=norm(history.readings.length)+" registros almacenados solo en este navegador.";
  refresh();
 }catch(err){$("sourceDetail").textContent="No se pudo abrir IndexedDB: "+err.message;}
}
function boot(){
 $("fullMetric").addEventListener("change",e=>{metric=e.target.value;refresh();});
 $("fullSlider").addEventListener("input",e=>{index=+e.target.value;refresh();});
 $("fitAll").addEventListener("click",fitAll);
 $("sideToggle").addEventListener("click",()=>setSidebar($("atlasShell").classList.contains("collapsed")));
 $("sideRestore").addEventListener("click",()=>setSidebar(true));
 $("fullScreen").addEventListener("click",()=>{
  const frame=$("mapFrame");
  if(document.fullscreenElement)document.exitFullscreen?.();
  else frame.requestFullscreen?.();
 });
 $("reloadHistory").addEventListener("click",loadLocal);
 document.querySelectorAll("[data-site]").forEach(btn=>btn.addEventListener("click",()=>choose(btn.dataset.site)));
 if(typeof L==="undefined"){
  $("fullMap").innerHTML='<div class="map-unavailable">No se pudo cargar Leaflet. Verifica la conexión para mostrar los mapas OpenStreetMap.</div>';
 }else{
  map=L.map("fullMap",{zoomControl:false,preferCanvas:true,scrollWheelZoom:true}).setView([29.076,-110.975],12);
  L.control.zoom({position:"bottomright"}).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
   maxZoom:19,attribution:"© OpenStreetMap contributors"
  }).addTo(map);
  group=L.featureGroup().addTo(map);
  D.sites.forEach(site=>{
   const marker=L.marker([site.lat,site.lng],{icon:pin(site),title:site.name+" · DEMO",keyboard:true}).addTo(group);
   marker.bindPopup(popup(site),{minWidth:205,maxWidth:280});
   marker.bindTooltip(site.name+" · DEMO",{direction:"top",offset:[0,-28],opacity:.9});
   marker.on("click",()=>choose(site.id,false,false));
   markers.push({site,marker});
  });
  fitAll();
 }
 if(window.matchMedia("(max-width:840px)").matches)setSidebar(false);
 refresh();
 window.addEventListener("resize",()=>{if(map)setTimeout(()=>map.invalidateSize({pan:false}),100);});
 document.addEventListener("fullscreenchange",()=>{if(map)setTimeout(()=>map.invalidateSize({pan:false}),120);});
 loadLocal();
 if("BroadcastChannel" in window){
  channel=new BroadcastChannel("jeeka-map-sync-v1");
  channel.onmessage=e=>{
   const data=e.data;if(!data||data.type!=="dashboard-state")return;
   if(data.station&&data.station!==stationId){stationId=data.station;loadLocal();}
   if(METRIC[data.metric])metric=data.metric;
   if(D.sites.some(s=>s.id===data.site))siteId=data.site;
   if(Number.isInteger(data.index))index=Math.min(points.length-1,Math.max(0,data.index));
   refresh();
  };
 }
}
window.addEventListener("load",boot);
})();