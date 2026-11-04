/* JEEKA | mapa independiente v0.4.
   Vista demostrativa; JAMÁS atribuye las lecturas a sensores locales. */
(function(){
"use strict";
const D=window.JEEKA_DEMO;
if(!D){document.body.insertAdjacentHTML("afterbegin",'<p role="alert">No se encontraron los datos del demo.</p>');return;}
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const metrics={co2:{name:"CO₂",unit:"ppm",digits:0},temp:{name:"Temperatura",unit:"°C",digits:1},hum:{name:"Humedad",unit:"%",digits:1},gas:{name:"Señal MQ135",unit:"ppm reportados*",digits:3}};
let activeMetric=metrics[params.get("metric")]?params.get("metric"):"co2";
let siteId=D.sites.some(x=>x.id===params.get("site"))?params.get("site"):D.sites[0].id;
let stationId=/^[A-Z0-9_-]{2,32}$/.test(params.get("station")||"")?params.get("station"):D.stationId;
let points=D.minuteRows.map(x=>({ts:D.timestamp+" "+x[0]+":00",co2:x[1],temp:x[2],hum:x[3],gas:x[4]}));
let exactLast=D.defaultStats.last;
let moment=params.has("index")&&Number.isFinite(Number(params.get("index")))?Math.min(points.length-1,Math.max(0,Number(params.get("index")))):points.length-1;
let map=null,feature=null,markers=[],broadcast=null;
const fmt=(n,precision=0)=>Number(n).toLocaleString("es-MX",{minimumFractionDigits:precision,maximumFractionDigits:precision});
const isoSafe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const current=()=>moment===points.length-1&&exactLast?{...points[moment],...exactLast}:points[moment];
const selected=()=>D.sites.find(x=>x.id===siteId)||D.sites[0];
const icon=site=>L.divIcon({className:"jeeka-leaflet-icon",iconSize:[46,68],iconAnchor:[23,59],popupAnchor:[0,-56],html:'<div class="jeeka-map-pin'+(site.id===siteId?' selected':'')+'"><img src="./assets/jeeka-pin.svg" alt="" /></div><div class="map-bubble">'+isoSafe(site.name)+'<small>SIMULADO</small></div>'});
function popup(site){
 const r=current(),m=metrics[activeMetric];
 return '<div class="jeeka-popup"><div class="pop-top"><img src="./assets/jeeka-eagle-vector.svg" alt="" width="43" height="43"><div><b>'+isoSafe(site.name)+'</b><span>UBICACIÓN DEMOSTRATIVA</span></div></div>'+
 '<div class="pop-read"><strong>'+fmt(r[activeMetric],m.digits)+' '+m.unit+'</strong><span>'+m.name+'</span></div>'+
 '<div class="pop-cols">CO₂ '+fmt(r.co2)+' ppm · '+fmt(r.temp,1)+' °C<br>Humedad '+fmt(r.hum,1)+' % · MQ135 '+fmt(r.gas,3)+'*</div>'+
 '<div class="pop-warning">DATOS SIMULADOS: la misma serie de un monitor, replicada en cuatro sitios.</div>'+
 '<small>'+isoSafe(site.location)+'<br>'+isoSafe(site.locNote||"Punto aproximado")+'</small></div>';
}
function render(){
 const s=selected(),r=current(),m=metrics[activeMetric];
 $("fullMetric").value=activeMetric;
 $("fullTitle").textContent=s.name;
 $("siteType").textContent=s.kind+" · SIMULADO";
 $("siteAddress").textContent=s.location+" · "+(s.locNote||"referencia aproximada");
 $("fullValue").textContent=fmt(r[activeMetric],m.digits);
 $("fullUnit").textContent=m.unit;
 $("metricName").textContent=m.name;
 $("fullCo2").textContent=fmt(r.co2)+" ppm";
 $("fullTemp").textContent=fmt(r.temp,1)+" °C";
 $("fullHum").textContent=fmt(r.hum,1)+" %";
 $("fullGas").textContent=fmt(r.gas,3)+"*";
 $("fullTimestamp").textContent=r.ts;
 $("fullSlider").max=Math.max(0,points.length-1);$("fullSlider").value=moment;
 $("fullRangeStart").textContent=points[0].ts.slice(5,16);
 $("fullRangeEnd").textContent=points[points.length-1].ts.slice(5,16);
 $("fullCount").textContent=points.length+" minutos de la serie seleccionada";
 document.querySelectorAll("[data-site]").forEach(b=>{const on=b.dataset.site===siteId;b.classList.toggle("active",on);b.setAttribute("aria-pressed",on?"true":"false");});
 markers.forEach(({site,marker})=>{
   marker.setIcon(icon(site));
   if(marker.getPopup())marker.setPopupContent(popup(site));else marker.bindPopup(popup(site),{maxWidth:320,minWidth:230});
 });
}
function choose(id,pop=true,center=true){
 if(!D.sites.some(s=>s.id===id))return;
 siteId=id;render();
 const entry=markers.find(x=>x.site.id===id);
 if(entry&&map){if(center)map.panTo(entry.marker.getLatLng());if(pop)entry.marker.openPopup();}
}
function showAll(){if(map&&feature)map.fitBounds(feature.getBounds().pad(.29),{maxZoom:13,animate:true});}
async function useStoredReadings(){
 if(!window.JeekaImport)return;
 try{
  const saved=await window.JeekaImport.load(stationId);
  if(saved.readings.length){
   const result=window.JeekaImport.summary(saved.readings);
   points=result.rows.map(x=>({ts:x.ts,co2:x.co2,temp:x.temp,hum:x.hum,gas:x.gas}));
   exactLast=result.stats.last;
   moment=params.has("index")&&Number.isFinite(Number(params.get("index")))?Math.min(points.length-1,Math.max(0,Number(params.get("index")))):points.length-1;
   $("sourceType").textContent="Historial local de "+stationId+" · replicado en los 4 puntos";
   $("sourceDetail").textContent=fmt(saved.readings.length)+" registros almacenados · no hay transmisión en vivo";
   render();
  }
 }catch(e){$("sourceDetail").textContent="No fue posible consultar IndexedDB: "+e.message;}
}
function start(){
 $("fullMetric").addEventListener("change",e=>{activeMetric=e.target.value;render();});
 $("fullSlider").addEventListener("input",e=>{moment=Number(e.target.value);render();});
 $("fitAll").addEventListener("click",showAll);
 $("fullScreen").addEventListener("click",()=>{
  const node=$("mapFrame");
  if(document.fullscreenElement)document.exitFullscreen?.();
  else node.requestFullscreen?.();
 });
 document.querySelectorAll("[data-site]").forEach(btn=>btn.addEventListener("click",()=>choose(btn.dataset.site)));
 $("reloadHistory").addEventListener("click",()=>useStoredReadings());
 if(typeof L!=="undefined"){
  map=L.map("fullMap",{zoomControl:false,preferCanvas:true}).setView([29.076,-110.973],12);
  L.control.zoom({position:"bottomright"}).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap contributors"}).addTo(map);
  feature=L.featureGroup().addTo(map);
  D.sites.forEach(site=>{
   const marker=L.marker([site.lat,site.lng],{icon:icon(site),title:site.name+" | DEMO",keyboard:true}).addTo(feature);
   marker.bindPopup(popup(site),{maxWidth:320,minWidth:230});
   marker.on("click",()=>choose(site.id,false,false));
   markers.push({site,marker});
  });
  showAll();
 }else {$("fullMap").innerHTML='<div class="map-unavailable">No se pudo cargar Leaflet. La lectura y los botones de ubicación siguen disponibles.</div>';}
 render();
 window.addEventListener("resize",()=>{if(map)setTimeout(()=>map.invalidateSize(),90);});
 document.addEventListener("fullscreenchange",()=>{if(map)setTimeout(()=>map.invalidateSize(),140);});
 useStoredReadings();
 if("BroadcastChannel" in window){
  broadcast=new BroadcastChannel("jeeka-map-sync-v1");
  broadcast.onmessage=e=>{
   const data=e.data;
   if(!data||data.type!=="dashboard-state")return;
   if(data.station&&data.station!==stationId){stationId=data.station;useStoredReadings();}
   if(metrics[data.metric])activeMetric=data.metric;
   if(D.sites.some(x=>x.id===data.site))siteId=data.site;
   if(Number.isInteger(data.index))moment=Math.max(0,Math.min(points.length-1,data.index));
   render();
  };
 }
}
window.addEventListener("load",start);
})();