/* Luma Groups: fast, shared hierarchical target picker for light / scene / music.
   Rendering only — no network or storage. */
(function(root){'use strict';
const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n};
class Tree{
 constructor(engine,container,{onSelect=()=>{},getSelected=()=>engine.currentTarget()}={}){this.engine=engine;this.container=container;this.onSelect=onSelect;this.getSelected=getSelected;this.expanded=new Set(['all']);this.primed=false}
 items(){
  const engine=this.engine,room=engine.livingRoom(),allIds=engine.globalOrder();
  const locals=engine.localGroups(),children=new Set(locals.flatMap(g=>g.groups||[]));
  const rooms=engine.bridgeRooms(),roomId=room?.id;
  const roomIds=room?engine.resolve(room.id,{reachableOnly:false}):[];
  const inRoom=locals.filter(g=>g.id!==roomId&&!children.has(g.id)&&room&&engine.resolve(g.id,{reachableOnly:false}).length>0&&engine.resolve(g.id,{reachableOnly:false}).every(x=>roomIds.includes(x)));
  const rest=locals.filter(g=>g.id!==roomId&&!children.has(g.id)&&!inRoom.includes(g));
  const lamp=(id)=>({id:'lamp:'+id,label:engine.lights[id]?.name||id,kind:'lamp',children:[]});
  function subgroup(g,stack=new Set()){
   if(!g||stack.has(g.id))return null;
   const next=new Set(stack);next.add(g.id);
   const nested=(g.groups||[]).map(id=>engine.group(id)).filter(Boolean).map(child=>subgroup(child,next)).filter(Boolean);
   return {id:g.id,label:g.name,kind:g.type||'luma-local',children:[...nested,...(g.lights||[]).filter(id=>engine.lights[id]).map(lamp)]}
  }
  const roomChildren=room?[
   ...(room.type==='luma-local'?(room.groups||[]).map(id=>subgroup(engine.group(id))).filter(Boolean):inRoom.map(g=>subgroup(g)).filter(Boolean)),
   ...roomIds.filter(id=>engine.lights[id]).map(lamp)
  ]:[];
  const roomNode=room?{id:room.id,label:room.name,kind:room.type,children:roomChildren}:null;
  const outside=allIds.filter(id=>!roomIds.includes(id)).map(lamp);
  const otherRooms=rooms.filter(g=>g.id!==roomId).map(g=>({id:g.id,label:g.name,kind:g.type,children:engine.resolve(g.id,{reachableOnly:false}).map(lamp)}));
  const localRoot=rest.map(g=>subgroup(g)).filter(Boolean);
  const outsideNodes=outside.filter(l=>!localRoot.some(g=>engine.resolve(g.id,{reachableOnly:false}).includes(l.id.slice(5))));
  return {id:'all',label:'All',kind:'system',children:[...(roomNode?[roomNode]:[]),...localRoot,...outsideNodes,...otherRooms]};
 }
 render(){
  const rootNode=this.container;rootNode.replaceChildren();rootNode.classList.add('g-fast-tree');
  const selected=this.getSelected(),model=this.items();
  if(!this.primed){const room=this.engine.livingRoom();if(room)this.expanded.add(room.id);this.primed=true}
  const head=make('div','g-tree-head');head.append(make('span','g-tree-kicker','LICHTBEREICH · SCHNELLAUSWAHL'));
  const active=this.engine.group(selected);const current=make('span','g-tree-current',active?.name||'All');current.title='Aktuell ausgewählter Lichtbereich';head.append(current);rootNode.append(head);
  const wrap=make('div','g-tree-inner');wrap.setAttribute('role','tree');wrap.setAttribute('aria-label','Lichtbereiche und einzelne Lampen');
  const createNode=(entry,level=0)=>{
   const hasChildren=entry.children.length>0;
   const expanded=this.expanded.has(entry.id);
   const row=make('div','g-tree-node');
   row.setAttribute('role','treeitem');row.setAttribute('aria-level',String(level+1));
   if(hasChildren)row.setAttribute('aria-expanded',String(expanded));
   row.setAttribute('aria-selected',String(entry.id===selected));
   const line=make('div','g-tree-line');line.style.setProperty('--tree-depth',String(Math.min(level,8)));
   const toggle=make('button','g-tree-toggle',hasChildren?(expanded?'⌄':'›'):'');
   toggle.type='button';toggle.disabled=!hasChildren;toggle.setAttribute('aria-label',(expanded?'Einklappen: ':'Ausklappen: ')+entry.label);
   toggle.setAttribute('aria-expanded',String(expanded));toggle.tabIndex=hasChildren?0:-1;
   toggle.onclick=()=>{if(this.expanded.has(entry.id))this.expanded.delete(entry.id);else this.expanded.add(entry.id);this.render()};
   const pick=make('button','g-tree-select');
   pick.type='button';pick.setAttribute('aria-pressed',String(entry.id===selected));
   const symbol=make('span','g-tree-symbol',entry.kind==='system'?'◈':entry.kind==='hue-room'?'⌂':entry.kind==='hue-zone'?'◇':entry.kind==='lamp'?'●':'✦');
   const label=make('span','g-tree-label',entry.label);
   const count=this.engine.resolve(entry.id,{reachableOnly:false}).length;
   const meta=make('span','g-tree-count',entry.kind==='lamp'?'':String(count));if(entry.kind!=='lamp')meta.setAttribute('aria-label',count+' Lampen');
   pick.append(symbol,label,meta);pick.onclick=()=>{this.onSelect(entry.id);this.render()};
   line.append(toggle,pick);row.append(line);
   if(hasChildren&&expanded){const children=make('div','g-tree-kids');children.setAttribute('role','group');for(const child of entry.children)children.append(createNode(child,level+1));row.append(children)}
   return row
  };
  wrap.append(createNode(model));rootNode.append(wrap);
 }
}
root.LumaGroupsTree={Tree};
})(typeof globalThis!=='undefined'?globalThis:this);
