/* JEEKA v0.4 | Controles del minimapa y enlace al mapa completo.
   Extiende el visor existente sin cambiar el importador ni guardar datos demo. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
let miniature=null, group=null, markers=[], visible=true, sync=null;
const safe=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function state(){
 const bridge=window.JEEKA_BRIDGE;
 return bridge?bridge.getState():null;
}
function updateLink(){
 const s=state(),link=$("openFullMap");if(!s||!link)return;
 const q=new URLSearchParams({site:s.site,station:s.station,metric:s.metric,index:String(s.index)});
 link.href="./mapa.html?"+q.toString();
 if(sync)try{sync.postMessage({type:"dashboard-state",site:s.site,station:s.station,metric:s.metric,index:s.index});}catch(_){}
 markers.forEach(({site,marker})=>{marker.setIcon(miniIcon(site.id===s.site));});
}
function miniIcon(active){
 return L.divIcon({className:"jeeka-mini-marker"+(active?" selected":""),iconSize:[25,30],iconAnchor:[12,27],
 html:'<img src="./assets/jeeka-pin.svg" alt="" width="18" height="25">'});
}
function showMini(show){
 const panel=$("miniMapPanel"),btn=$("miniMapToggle");
 if(!panel||!btn)return;
 visible=!!show;panel.hidden=!visible;
 btn.textContent=visible?"▣ Ocultar minimapa":"▣ Mostrar minimapa";
 btn.setAttribute("aria-expanded",String(visible));
 if(visible&&miniature){requestAnimationFrame(()=>{miniature.invalidateSize();miniature.fitBounds(group.getBounds().pad(.35),{maxZoom:12});});}
}
function setup(){
 const main=$("map"),metric=$("mapMetric"),header=main?.closest(".panel")?.querySelector(".panel-head"),
 wrap=main?.closest(".map-wrap");
 if(!main||!header||!wrap||!window.JEEKA_BRIDGE)return;
 header.classList.add("map-panel-head");
 const toolbar=document.createElement("div");
 toolbar.className="map-toolbar";
 const link=document.createElement("a");
 link.id="openFullMap";link.className="outline fullmap-link";link.target="_blank";link.rel="noopener";
 link.href="./mapa.html";link.textContent="⤢ Abrir mapa completo";
 link.setAttribute("aria-label","Abrir mapa JEEKA en otra pestaña");
 const toggle=document.createElement("button");
 toggle.id="miniMapToggle";toggle.type="button";toggle.className="outline";
 toggle.setAttribute("aria-controls","miniMapPanel");toggle.setAttribute("aria-expanded","true");
 toggle.textContent="▣ Ocultar minimapa";
 toolbar.append(metric,link,toggle);header.appendChild(toolbar);
 const panel=document.createElement("aside");panel.id="miniMapPanel";panel.className="mini-map-panel";
 panel.setAttribute("aria-label","Minimapa JEEKA con cuatro ubicaciones simuladas");
 panel.innerHTML='<div class="mini-map-head"><div><strong>Minimapa · Hermosillo</strong><span>Cuatro puntos demostrativos</span></div><button type="button" id="miniMapClose" class="mini-close" aria-label="Cerrar minimapa">×</button></div><div id="miniMap" class="mini-map-canvas" role="application" aria-label="Mapa compacto con marcadores de pequeño tamaño"></div><div class="mini-map-caption">Ubicaciones de referencia · ninguna estación real instalada</div>';
 wrap.appendChild(panel);
 toggle.addEventListener("click",()=>showMini(!visible));
 $("miniMapClose").addEventListener("click",()=>showMini(false));
 if(typeof L==="undefined"){
   $("miniMap").innerHTML='<div class="map-unavailable">Minimapa no disponible sin conexión.</div>';
 }else{
  miniature=L.map("miniMap",{zoomControl:false,attributionControl:true,dragging:false,
   scrollWheelZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,touchZoom:false});
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
   {maxZoom:18,attribution:"© OpenStreetMap"}).addTo(miniature);
  group=L.featureGroup().addTo(miniature);
  window.JEEKA_BRIDGE.getSites().forEach(site=>{
   const marker=L.marker([site.lat,site.lng],{title:site.name+" (simulado)",
       icon:miniIcon(site.id===state().site),keyboard:true}).addTo(group);
   marker.on("click",()=>window.JEEKA_BRIDGE.select(site.id));
   markers.push({site,marker});
  });
  miniature.fitBounds(group.getBounds().pad(.37),{maxZoom:12,animate:false});
 }
 metric.addEventListener("change",updateLink);
 const slider=$("timeSlider");if(slider)slider.addEventListener("input",updateLink);
 document.querySelectorAll("[data-demo-site]").forEach(btn=>btn.addEventListener("click",updateLink));
 const station=$("stationView");if(station)station.addEventListener("change",()=>setTimeout(updateLink,60));
 // Actualiza el enlace al variar la fecha/estación desde el importador y tras confirmar un lote.
 const source=$("sourceLabel");
 if(source&&window.MutationObserver)new MutationObserver(updateLink).observe(source,{childList:true,characterData:true,subtree:true});
 updateLink();
 if("BroadcastChannel" in window)try{sync=new BroadcastChannel("jeeka-map-sync-v1");updateLink();}catch(_){}
 window.addEventListener("resize",()=>{if(miniature&&visible)setTimeout(()=>miniature.invalidateSize(),100);});
}
window.addEventListener("load",()=>setTimeout(setup,0));
})();