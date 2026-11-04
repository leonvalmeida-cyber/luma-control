/* Luma Groups: fast, shared hierarchical target picker for light / scene / music.
   Rendering only — no network or storage. */
(function(root){'use strict';
const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n};
class Tree{
 constructor(engine,container,{onSelect=()=>{},getSelected=()=>engine.currentTarget()}={}){this.engine=engine;this.container=container;this.onSelect=onSelect;this.getSelected=getSelected;this.expanded=new Set(['all']);this.primed=false;this.selectables=[];this.expandables=[];this.currentLabel=null}
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
   const covered=new Set(nested.flatMap(child=>engine.resolve(child.id,{reachableOnly:false})));
   const direct=[...new Set(g.lights||[])].filter(id=>engine.lights[id]&&!covered.has(id));
   return {id:g.id,label:g.name,kind:g.type||'luma-local',children:[...nested,...direct.map(lamp)]}
  }
  const nestedRoom=room?(room.type==='luma-local'?(room.groups||[]).map(id=>subgroup(engine.group(id))).filter(Boolean):inRoom.map(g=>subgroup(g)).filter(Boolean)):[];
  const roomCovered=new Set(nestedRoom.flatMap(g=>engine.resolve(g.id,{reachableOnly:false})));
  const roomChildren=room?[...nestedRoom,...roomIds.filter(id=>engine.lights[id]&&!roomCovered.has(id)).map(lamp)]:[];
  const roomNode=room?{id:room.id,label:room.name,kind:room.type,children:roomChildren}:null;
  const localRoot=rest.map(g=>subgroup(g)).filter(Boolean);
  const covered=new Set([...roomIds,...localRoot.flatMap(g=>engine.resolve(g.id,{reachableOnly:false}))]);
  const otherRooms=[];
  for(const g of rooms.filter(g=>g.id!==roomId)){
   const direct=engine.resolve(g.id,{reachableOnly:false}).filter(id=>!covered.has(id));
   if(!direct.length)continue;
   otherRooms.push({id:g.id,label:g.name,kind:g.type,children:direct.map(lamp)});
   for(const id of direct)covered.add(id)
  }
  const outsideNodes=allIds.filter(id=>!covered.has(id)).map(lamp);
  return {id:'all',label:'All',kind:'system',children:[...(roomNode?[roomNode]:[]),...localRoot,...outsideNodes,...otherRooms]};
 }
 render(){
  const rootNode=this.container;
  // Rebuilding only after group data changes, not on tap or expand/collapse:
  // removing a focused disclosure button caused Safari to shift the viewport.
  rootNode.replaceChildren();rootNode.classList.add('g-fast-tree');
  this.selectables=[];this.expandables=[];
  const selected=this.getSelected(),model=this.items();
  if(!this.primed){const room=this.engine.livingRoom();if(room)this.expanded.add(room.id);this.primed=true}
  const head=make('div','g-tree-head');head.append(make('span','g-tree-kicker','LICHTBEREICH · SCHNELLAUSWAHL'));
  this.currentLabel=make('span','g-tree-current','');this.currentLabel.title='Aktuell ausgewählter Lichtbereich';
  head.append(this.currentLabel);rootNode.append(head);
  const wrap=make('div','g-tree-inner');wrap.setAttribute('role','tree');wrap.setAttribute('aria-label','Lichtbereiche und einzelne Lampen');
  const createNode=(entry,level=0)=>{
   const hasChildren=entry.children.length>0,expanded=this.expanded.has(entry.id);
   const row=make('div','g-tree-node');
   row.setAttribute('role','treeitem');row.setAttribute('aria-level',String(level+1));
   if(hasChildren)row.setAttribute('aria-expanded',String(expanded));
   const line=make('div','g-tree-line');line.style.setProperty('--tree-depth',String(Math.min(level,8)));
   const toggle=make('button','g-tree-toggle',hasChildren?(expanded?'⌄':'›'):'');
   toggle.type='button';toggle.disabled=!hasChildren;
   toggle.setAttribute('aria-label',(expanded?'Einklappen: ':'Ausklappen: ')+entry.label);
   toggle.setAttribute('aria-expanded',String(expanded));toggle.tabIndex=hasChildren?0:-1;
   const pick=make('button','g-tree-select');
   pick.type='button';pick.setAttribute('data-target-id',entry.id);
   const symbol=make('span','g-tree-symbol',entry.kind==='system'?'◈':entry.kind==='hue-room'?'⌂':entry.kind==='hue-zone'?'◇':entry.kind==='lamp'?'●':'✦');
   const label=make('span','g-tree-label',entry.label);
   const count=this.engine.resolve(entry.id,{reachableOnly:false}).length;
   const meta=make('span','g-tree-count',entry.kind==='lamp'?'':String(count));
   if(entry.kind!=='lamp')meta.setAttribute('aria-label',count+' Lampen');
   pick.append(symbol,label,meta);
   // Do not destroy/recreate the DOM on selection: maintain scroll and focus.
   pick.onclick=()=>{this.onSelect(entry.id);this.updateSelection()};
   line.append(toggle,pick);row.append(line);
   this.selectables.push({id:entry.id,pick,row});
   if(hasChildren){
    const children=make('div','g-tree-kids');children.setAttribute('role','group');
    for(const child of entry.children)children.append(createNode(child,level+1));
    children.hidden=!expanded;
    row.append(children);
    this.expandables.push({id:entry.id,label:entry.label,row,toggle,children});
    toggle.onclick=()=>{
     if(this.expanded.has(entry.id))this.expanded.delete(entry.id);
     else this.expanded.add(entry.id);
     this.updateExpansion();
     // Keep disclosure focus and inner panel position stable on iOS.
    };
   }
   return row;
  };
  wrap.append(createNode(model));rootNode.append(wrap);
  this.updateSelection();
  this.updateExpansion();
 }
 updateExpansion(){
  for(const {id,label,row,toggle,children} of this.expandables){
   const opened=this.expanded.has(id);
   children.hidden=!opened;
   row.setAttribute('aria-expanded',String(opened));
   toggle.setAttribute('aria-expanded',String(opened));
   toggle.setAttribute('aria-label',(opened?'Einklappen: ':'Ausklappen: ')+label);
   toggle.textContent=opened?'⌄':'›';
  }
 }
 updateSelection(){
  const selected=this.getSelected(),current=this.engine.group(selected);
  if(this.currentLabel)this.currentLabel.textContent=current?.name||'All';
  for(const {id,pick,row} of this.selectables){
   const active=id===selected;
   pick.setAttribute('aria-pressed',String(active));
   row.setAttribute('aria-selected',String(active));
  }
 }

}
root.LumaGroupsTree={Tree};
})(typeof globalThis!=='undefined'?globalThis:this);
