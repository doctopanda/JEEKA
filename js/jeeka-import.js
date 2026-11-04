/* JEEKA · Importador v0.2 | Ingesta idempotente, conserva datos en el navegador. */
(function (root) {
  "use strict";
  var DB_NAME = "jeeka-tukawiru-v2", DB_VERSION = 1;
  var FIELDS = ["co2","temp","hum","gas"];
  function openDB() {
    return new Promise(function(resolve,reject){
      if (!root.indexedDB) return reject(new Error("Este navegador no permite IndexedDB."));
      var req = root.indexedDB.open(DB_NAME,DB_VERSION);
      req.onupgradeneeded=function(){
        var db=req.result, readings=db.createObjectStore("readings",{keyPath:"id"});
        readings.createIndex("station","station",{unique:false});
        var batches=db.createObjectStore("batches",{keyPath:"id"});
        batches.createIndex("station","station",{unique:false});
        var incidents=db.createObjectStore("incidents",{keyPath:"id"});
        incidents.createIndex("station","station",{unique:false});
        db.createObjectStore("stations",{keyPath:"id"});
      };
      req.onsuccess=function(){resolve(req.result);};
      req.onerror=function(){reject(req.error||new Error("No se pudo abrir el almacén."));};
      req.onblocked=function(){reject(new Error("Cierra las otras pestañas de JEEKA para actualizar el almacenamiento."));};
    });
  }
  function request(req) {
    return new Promise(function(resolve,reject){req.onsuccess=function(){resolve(req.result);};req.onerror=function(){reject(req.error);};});
  }
  function parseTable(input) {
    var t=String(input).replace(/^\uFEFF/,""), sep=(t.split(/\r?\n/,1)[0].match(/;/g)||[]).length > (t.split(/\r?\n/,1)[0].match(/,/g)||[]).length?";":",";
    var table=[],row=[],cell="",quoted=false;
    for(var i=0;i<t.length;i++){
      var c=t[i];if(quoted){if(c==='"'&&t[i+1]==='"'){cell+='"';i++;}else if(c==='"'){quoted=false;}else{cell+=c;}}
      else if(c==='"'){quoted=true;}
      else if(c===sep){row.push(cell);cell="";}
      else if(c==="\n"||c==="\r"){if(c==="\r"&&t[i+1]==="\n")i++;row.push(cell);if(row.some(function(x){return x.trim()!=="";}))table.push(row);row=[];cell="";}
      else{cell+=c;}
    }
    if(quoted)throw new Error("CSV con comillas sin cerrar.");
    row.push(cell);if(row.some(function(x){return x.trim()!=="";}))table.push(row);
    return table;
  }
  function pad(v){return String(v).padStart(2,"0");}
  function validDate(d,t){
    var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d), h=/^(\d{2}):(\d{2}):(\d{2})$/.exec(t);
    if(!m||!h)return false;
    var y=+m[1],mon=+m[2],day=+m[3],hr=+h[1],mi=+h[2],sec=+h[3];
    if(y<2000||y>2100||hr>23||mi>59||sec>59)return false;
    var dt=new Date(Date.UTC(y,mon-1,day));
    return dt.getUTCFullYear()===y&&dt.getUTCMonth()===mon-1&&dt.getUTCDate()===day;
  }
  function parseTimestamp(date,time,offset){
    var original=String(date||"").trim()+" "+String(time||"").trim();
    var iso=String(date||"").trim();
    var raw;
    if(/^\d{4}-\d{2}-\d{2}T/.test(iso)&&!time){
      raw=iso;
      if(!/[Zz]|[+-]\d{2}:\d{2}$/.test(raw))raw+=offset;
      var n=Date.parse(raw);if(!Number.isFinite(n))return null;
      var datepart=raw.slice(0,10),timepart=raw.slice(11,19);
      if(!validDate(datepart,timepart))return null;
      var off=offset.match(/^([+-])(\d{2}):(\d{2})$/), delta=(off[1]==="-"?-1:1)*(Number(off[2])*60+Number(off[3]))*60000;
      var local=new Date(n+delta).toISOString().slice(0,19).replace("T"," ");
      return {utc:new Date(n).toISOString(),local:local,original:iso};
    }
    if(!validDate(String(date||"").trim(),String(time||"").trim()))return null;
    raw=original.replace(" ","T")+offset;
    var ms=Date.parse(raw);if(!Number.isFinite(ms))return null;
    return {utc:new Date(ms).toISOString(),local:original,original:original};
  }
  function number(v){
    if(v===null||v===undefined||String(v).trim()==="")return NaN;
    var s=String(v).trim().replace(",",".");
    return /^-?(?:\d+\.?\d*|\.\d+)$/.test(s)?Number(s):NaN;
  }
  function cleanStation(s){
    var id=String(s||"").trim().toUpperCase();
    if(!/^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(id))throw new Error("La estación necesita un código de 2–32 caracteres: letras, números, guion o guion bajo.");
    return id;
  }
  function makeRow(station,stamp,values,rowNumber){
    if(!stamp)return {issue:{row:rowNumber,type:"fecha",detail:"Fecha u hora inválida; no se asignó una hora ficticia."}};
    var v=values.map(number);
    if(v.some(function(x){return !Number.isFinite(x);}))return {issue:{row:rowNumber,type:"valor",detail:"Falta una medición o tiene formato no numérico."}};
    if(v[0]<=0||v[1]<-60||v[1]>100||v[2]<0||v[2]>100||v[3]<0)return {issue:{row:rowNumber,type:"rango_invalido",detail:"CO₂, temperatura, humedad o señal MQ135 fuera del rango físico básico."}};
    var flags=[];
    if(v[0]<350||v[0]>5000)flags.push("CO₂ inusual: comprobar sensor o calibración");
    if(v[1]<-20||v[1]>60)flags.push("Temperatura inusual: verificar contexto");
    if(v[3]>0)flags.push("MQ135 no cero: validar escala y calibración");
    return {data:{id:station+"|"+stamp.utc,station:station,utc:stamp.utc,ts:stamp.local,co2:v[0],temp:v[1],hum:v[2],gas:v[3],flags:flags}};
  }
  function parseCSV(text,station,offset) {
    var data=parseTable(text);
    if(data.length<2)throw new Error("El archivo está vacío o no contiene mediciones.");
    var cols=data[0].map(function(x){return x.trim().toLowerCase().replace(/\s/g,"");});
    var aliases=[["fecha"],["hora"],["co2_scd40(ppm)","co2(ppm)"],["temperatura(c)","temperatura(°c)"],["humedad(%)"],["gases_mq135(ppm)","mq135(ppm)"]];
    var idx=aliases.map(function(a){return cols.findIndex(function(c){return a.indexOf(c)>=0;});});
    if(idx.some(function(v){return v<0;}))throw new Error("Faltan columnas. Se esperan: Fecha, Hora, CO2_SCD40(ppm), Temperatura(C), Humedad(%), Gases_MQ135(ppm).");
    var out={station:station,offset:offset,format:"csv",entries:[],issues:[],total:0};
    for(var i=1;i<data.length;i++){
      var cells=data[i],date=String(cells[idx[0]]||"").trim(),time=String(cells[idx[1]]||"").trim();out.total++;
      if(/^sinred/i.test(date)){out.issues.push({row:i+1,type:"SinRed",detail:date+"; evento sin fecha confiable; no se incorpora a la serie temporal."});continue;}
      var stamp=parseTimestamp(date,time,offset),v=idx.slice(2).map(function(j){return cells[j];});
      var rec=makeRow(station,stamp,v,i+1);if(rec.issue)out.issues.push(rec.issue);else out.entries.push(rec.data);
    }return out;
  }
  function parseJSON(text,station,offset){
    var body;try{body=JSON.parse(text);}catch(e){throw new Error("JSON no válido: "+e.message);}
    var values=Array.isArray(body)?body:(body&&Array.isArray(body.readings)?body.readings:(body&&Array.isArray(body.measurements)?body.measurements:null));
    if(!values)throw new Error("Se espera un arreglo JSON o un objeto con 'readings' o 'measurements'.");
    var out={station:station,offset:offset,format:"json",entries:[],issues:[],total:0};
    values.forEach(function(x,i){
      out.total++;if(!x||typeof x!=="object"){out.issues.push({row:i+1,type:"valor",detail:"Registro sin estructura de lectura."});return;}
      if(x.station_id&&cleanStation(x.station_id)!==station){out.issues.push({row:i+1,type:"estacion",detail:"La lectura pertenece a otra estación; se omitió."});return;}
      var stamp=parseTimestamp(x.timestamp||x.ts||x.utc||x.fecha||x.date,x.hora||x.time||"",offset);
      var v=[x.co2_ppm??x.co2,x.temperature_c??x.temp,x.humidity_pct??x.hum,x.mq135_reported??x.gas??x.mq135];
      var rec=makeRow(station,stamp,v,i+1);
      if(rec.issue)out.issues.push(rec.issue);else out.entries.push(rec.data);
    });return out;
  }
  function same(a,b){return FIELDS.every(function(k){return a[k]===b[k];});}
  async function preview(text,filename,stationInput,offset){
    var station=cleanStation(stationInput);
    if(!/^[+-](?:0\d|1[0-4]):[0-5]\d$/.test(offset))throw new Error("Selecciona un huso horario válido.");
    var parsed=/\.json$/i.test(filename)?parseJSON(text,station,offset):parseCSV(text,station,offset);
    var db=await openDB();
    try{
      var old=await request(db.transaction("readings","readonly").objectStore("readings").index("station").getAll(station));
      var already=new Map(old.map(function(x){return [x.id,x];})),within=new Map(),news=[],duplicate=0,conflict=0,examples=[],warnings=0;
      parsed.entries.forEach(function(x){
        if(x.flags.length)warnings++;
        var existing=within.get(x.id)||already.get(x.id);
        if(existing){if(same(existing,x))duplicate++;else {conflict++;if(examples.length<7)examples.push(x.ts+" (valores distintos)");}}
        else{within.set(x.id,x);news.push(x);}
      });
      return {station:station,filename:filename,offset:offset,total:parsed.total,valid:parsed.entries.length,newRows:news,duplicate:duplicate,conflict:conflict,warnings:warnings,issues:parsed.issues,examples:examples,format:parsed.format};
    }finally{db.close();}
  }
  async function save(prepared){
    if(!prepared||!prepared.newRows||!prepared.newRows.length)throw new Error("No hay lecturas nuevas para guardar.");
    var db=await openDB();
    try{
      var tx=db.transaction(["readings","stations","incidents","batches"],"readwrite");
      var rid=Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,9);
      prepared.newRows.forEach(function(r){tx.objectStore("readings").add(r);});
      prepared.issues.forEach(function(r,i){tx.objectStore("incidents").put({id:rid+"|"+i,station:prepared.station,batch:rid,row:r.row,type:r.type,detail:r.detail});});
      tx.objectStore("stations").put({id:prepared.station,lastImported:new Date().toISOString(),timezone:prepared.offset,locationVerified:false});
      tx.objectStore("batches").put({id:rid,station:prepared.station,filename:prepared.filename,importedAt:new Date().toISOString(),total:prepared.total,accepted:prepared.newRows.length,duplicates:prepared.duplicate,conflicts:prepared.conflict,rejected:prepared.issues.length,warnings:prepared.warnings});
      await new Promise(function(resolve,reject){tx.oncomplete=resolve;tx.onerror=function(){reject(tx.error||new Error("Error al guardar."));};tx.onabort=function(){reject(tx.error||new Error("Importación cancelada. No se guardó un lote parcial."));};});
      return prepared.newRows.length;
    }finally{db.close();}
  }
  async function load(stationInput){
    var station=cleanStation(stationInput),db=await openDB();
    try{
      var tx=db.transaction(["readings","batches","stations","incidents"],"readonly");
      var [readings,batches,stationInfo,incidents]=await Promise.all([
        request(tx.objectStore("readings").index("station").getAll(station)),
        request(tx.objectStore("batches").index("station").getAll(station)),
        request(tx.objectStore("stations").get(station)),
        request(tx.objectStore("incidents").index("station").getAll(station))
      ]);
      readings.sort(function(a,b){return a.utc.localeCompare(b.utc);});
      batches.sort(function(a,b){return b.importedAt.localeCompare(a.importedAt);});
      return {station:station,readings:readings,batches:batches,stationInfo:stationInfo,incidents:incidents};
    }finally{db.close();}
  }
  async function stations(){
    var db=await openDB();try{return await request(db.transaction("stations","readonly").objectStore("stations").getAll());}finally{db.close();}
  }
  function summary(readings){
    if(!readings.length)return null;
    var sum=0,peak=-Infinity,agg=new Map();
    readings.forEach(function(r){
      sum+=r.co2;peak=Math.max(peak,r.co2);
      var stamp=r.ts.slice(0,16),x=agg.get(stamp);
      if(!x){x={ts:stamp+":00",co2:0,temp:0,hum:0,gas:0,n:0};agg.set(stamp,x);}
      FIELDS.forEach(function(k){x[k]+=r[k];});x.n++;
    });
    var rows=Array.from(agg.values()).sort(function(a,b){return a.ts.localeCompare(b.ts);}).map(function(r){
      FIELDS.forEach(function(k){r[k]=r[k]/r.n;});return r;
    });
    var last=readings[readings.length-1];
    return {rows:rows,stats:{valid:readings.length,avg:sum/readings.length,max:peak,rawMax:last.ts,last:{co2:last.co2,temp:last.temp,hum:last.hum,gas:last.gas}}};
  }
  root.JeekaImport={preview:preview,save:save,load:load,stations:stations,summary:summary,parseCSV:parseCSV,parseJSON:parseJSON,cleanStation:cleanStation};
})(window);