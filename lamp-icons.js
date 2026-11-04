/* Luma icon picker: local metadata only. No Hue command, no audio/network.
 * All icon SVG paths are static, not read from the user or Bridge. */
(function(root){'use strict';
const STORAGE='luma_live_iconprefs_v1';
const icons=Object.freeze({
  bulb:{label:'Glühbirne',parts:'<path d="M40 12c-13 0-23 10-23 23 0 9 5 14 11 20v5h24v-5c6-6 11-11 11-20 0-13-10-23-23-23Z"/><path d="M30 66h20m-17 6h14M31 51h18"/>'},
  iris:{label:'Hue Iris',parts:'<path d="M15 55Q21 22 40 20q19 2 25 35Z"/><ellipse cx="40" cy="57" rx="27" ry="6"/><path d="M20 61v5q20 12 40 0v-5"/>'},
  twilight:{label:'Hue Twilight',parts:'<rect x="34" y="10" width="12" height="53" rx="4"/><path d="M26 67h28m-19-50h10"/>'},
  strip:{label:'LED-Strip',parts:'<path d="M10 58c12-37 23 7 34-15S59 20 69 26" stroke-width="7" stroke-linecap="round"/><path d="M12 69h56"/>'},
  ceiling:{label:'Deckenlampe',parts:'<path d="M15 26h50M40 26v8m-25 0h50l-7 20H22l-7-20Z"/><path d="M29 61h22"/>'},
  pendant:{label:'Hängelampe',parts:'<path d="M40 6v29M17 60l12-27h22l12 27Z"/><path d="M21 60h38M32 69h16"/>'},
  floor:{label:'Stehlampe',parts:'<path d="M28 21h24l12 23H16l12-23ZM40 44v24m-16 2h32"/>'},
  table:{label:'Tischlampe',parts:'<path d="M27 21h26l9 24H18l9-24ZM40 45v18m-16 4h32"/>'},
  spot:{label:'Spot',parts:'<path d="M20 21l24-9 15 27-24 9-15-27ZM46 48v13m-14 6h28"/><path d="m15 52-7 10m10-1-3 11"/>'},
  indirect:{label:'Indirektes Licht',parts:'<path d="M15 58V23h12v35m26 0V23h12v35M13 65h54"/><path d="m28 21 12-12 12 12m-21 0 9-8 9 8"/>'},
  kitchen:{label:'Küche',parts:'<path d="M18 41h44v15c0 6-6 10-22 10s-22-4-22-10V41Z"/><path d="M24 41v-4c0-8 7-13 16-13s16 5 16 13v4M30 22V13m10 7V9m10 13V13"/><path d="M18 52h44"/>'},
  tv:{label:'Fernseher',parts:'<rect x="9" y="16" width="62" height="40" rx="6"/><path d="M40 56v12M22 70h36"/><path d="m24 30 9-6"/>'},
  desk:{label:'Schreibtisch',parts:'<path d="M10 46h60v9H10zM19 55v17m42-17v17"/><path d="m43 36 10-18 12 8-11 17M43 36l-12 10"/><circle cx="54" cy="18" r="4"/>'},
  bathroom:{label:'Badezimmer',parts:'<path d="M13 39h54v8c0 13-10 20-27 20S13 60 13 47v-8ZM20 39V22c0-8 7-12 14-12h6v8h-6"/><path d="M19 67v5m42-5v5"/>'},
  bedroom:{label:'Schlafzimmer',parts:'<path d="M12 47h56v21H12zM12 47V22h56v25M12 68v4m56-4v4"/><path d="M19 31h19v16H19zm23 0h19v16H42z"/>'}
});
const valid=id=>typeof id==='string'&&Object.prototype.hasOwnProperty.call(icons,id);
function guess(device){
 const name=[device?.modelid,device?.productname,device?.type,device?.name].map(x=>String(x||'')).join(' ').toLowerCase();
 if(/twilight/.test(name))return 'twilight';
 if(/iris/.test(name))return 'iris';
 if(/strip|lightstrip/.test(name))return 'strip';
 if(/pendel|pendant/.test(name))return 'pendant';
 if(/floor|stehleuchte/.test(name))return 'floor';
 if(/ceiling|decken/.test(name))return 'ceiling';
 if(/spot/.test(name))return 'spot';
 if(/table|tisch/.test(name))return 'table';
 return 'bulb';
}
function svg(id,cls=''){
 const doc=root.document;
 const node=doc.createElementNS('http://www.w3.org/2000/svg','svg');
 node.setAttribute('viewBox','0 0 80 80');
 node.setAttribute('class',cls||'luma-icon');
 node.setAttribute('aria-hidden','true');node.setAttribute('focusable','false');
 node.innerHTML=icons[valid(id)?id:'bulb'].parts;
 return node;
}
class Store {
 constructor(storage){this.storage=storage;this.cache=this.load()}
 load(){
  try{const o=JSON.parse(this.storage.getItem(STORAGE)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{}}catch{return {}}
 }
 bridge(key){return typeof key==='string'&&key.length>0&&key.length<=150?key:null}
 get(bridge,id){const key=this.bridge(bridge);const value=key&&this.cache[key]?.[String(id)];return valid(value)?value:null}
 icon(bridge,id,device){return this.get(bridge,id)||guess(device)}
 set(bridge,id,icon){
  const key=this.bridge(bridge);
  if(!key||typeof id!=='string'||!id||id.length>140)throw Error('Kein gültiger Lampen-/Bridgebezug');
  if(icon!==null&&!valid(icon))throw Error('Unbekanntes Symbol');
  const next=Object.assign(Object.create(null),this.cache);
  const group=Object.assign(Object.create(null),next[key]||{});
  if(icon===null)delete group[id];else group[id]=icon;
  next[key]=group;
  // Do not mutate memory when browser storage cannot persist.
  this.storage.setItem(STORAGE,JSON.stringify(next));this.cache=next;
  return icon;
 }
}
const api={STORAGE,icons,valid,guess,svg,Store};
root.LumaLampIcons=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
