/* Luma Groups: fast, shared hierarchical target picker for light / scene / music.
   Rendering only — no network or storage. */
(function(root){'use strict';
const make=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!=null)n.textContent=txt;return n};
class Tree{
 constructor(engine,container,{onSelect=()=>{},getSelected=()=>engine.currentTarget(),getLampIcon=()=>null,onPower=async()=>{},onPowerError=()=>{},onBrightness=async()=>{},onGroupBrightness=async()=>{}}={}){
  this.engine=engine;this.container=container;this.onSelect=onSelect;this.getSelected=getSelected;
  this.getLampIcon=getLampIcon;this.onPower=onPower;this.onPowerError=onPowerError;this.onBrightness=onBrightness;this.onGroupBrightness=onGroupBrightness;
  this.expanded=new Set(['all']);this.primed=false;this.selectables=[];this.expandables=[];this.groupDimmers=[];this.currentLabel=null;this.pending=new Set();this.groupPending=new Set()
 }
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
  this.selectables=[];this.expandables=[];this.groupDimmers=[];
  const selected=this.getSelected(),model=this.items();
  if(!this.primed){const room=this.engine.livingRoom();if(room)this.expanded.add(room.id);this.primed=true}
  const head=make('div','g-tree-head');head.append(make('span','g-tree-kicker','LICHTBEREICH · SCHNELLAUSWAHL'));
  this.currentLabel=make('span','g-tree-current','');this.currentLabel.title='Aktuell ausgewählter Lichtbereich';
  head.append(this.currentLabel);rootNode.append(head);
  const wrap=make('div','g-tree-inner');wrap.setAttribute('role','tree');wrap.setAttribute('aria-label','Lichtbereiche und einzelne Lampen');
  const createNode=(entry,level=0)=>{
   const hasChildren=entry.children.length>0,expanded=this.expanded.has(entry.id);
   const row=make('div','g-tree-node'+(entry.kind==='lamp'?' g-tree-lamp-node':''));
   row.setAttribute('role','treeitem');row.setAttribute('aria-level',String(level+1));
   if(hasChildren)row.setAttribute('aria-expanded',String(expanded));
   const line=make('div','g-tree-line'+(entry.kind==='lamp'?' g-tree-lamp-line':''));line.style.setProperty('--tree-depth',String(Math.min(level,8)));
   const toggle=make('button','g-tree-toggle',hasChildren?(expanded?'⌄':'›'):'');
   toggle.type='button';toggle.disabled=!hasChildren;
   toggle.setAttribute('aria-label',(expanded?'Einklappen: ':'Ausklappen: ')+entry.label);
   toggle.setAttribute('aria-expanded',String(expanded));toggle.tabIndex=hasChildren?0:-1;
   const pick=make('button','g-tree-select'+(entry.kind==='lamp'?' g-tree-lamp-card':''));
   pick.type='button';pick.setAttribute('data-target-id',entry.id);
   const symbol=make('span','g-tree-symbol',entry.kind==='system'?'◈':entry.kind==='hue-room'?'⌂':entry.kind==='hue-zone'?'◇':entry.kind==='lamp'?'':'✦');
   if(entry.kind==='lamp'&&root.LumaLampIcons){const type=this.getLampIcon(entry.id.slice(5),this.engine.lights[entry.id.slice(5)])||root.LumaLampIcons.guess(this.engine.lights[entry.id.slice(5)]);symbol.append(root.LumaLampIcons.svg(type,'g-tree-lamp-svg'));symbol.dataset.iconKind=type}
   const label=make('span','g-tree-label',entry.label);
   const count=this.engine.resolve(entry.id,{reachableOnly:false}).length;
   const meta=make('span','g-tree-count',entry.kind==='lamp'?'':String(count));
   if(entry.kind!=='lamp')meta.setAttribute('aria-label',count+' Lampen');
   let power=null,lightStatus=null,dimButton=null,dimPanel=null,dimRange=null,dimValue=null;
   if(entry.kind==='lamp'){
    const lightId=entry.id.slice(5),device=this.engine.lights[lightId];
    // A glanceable luminous tile; the select surface never triggers a Hue command.
    const visual=make('span','g-lamp-art');visual.append(symbol);
    const text=make('span','g-lamp-info');text.append(label);
    lightStatus=make('span','g-lamp-status');
    text.append(lightStatus);
    pick.append(visual,text);
    power=make('button','g-lamp-power','⏻');
    power.type='button';power.setAttribute('aria-label','Licht schalten: '+entry.label);
    power.setAttribute('title','Nur diese Lampe ein- oder ausschalten');
    power.onclick=async()=>{
     if(this.pending.has(lightId)||device?.state?.reachable===false)return;
     const wanted=!Boolean(this.engine.lights[lightId]?.state?.on);
     this.pending.add(lightId);this.updateLampStates();
     try{await this.onPower(lightId,wanted);this.updateLampStates()}
     catch(error){this.onPowerError(error,lightId);this.updateLampStates()}
     finally{this.pending.delete(lightId);this.updateLampStates()}
    };
   }else pick.append(symbol,label,meta);
   // Three separate actions: expand, select, and lamp power.
   pick.onclick=()=>{this.onSelect(entry.id);this.updateSelection()};
   if(entry.kind==='lamp')line.append(toggle,pick);
   else{
    // Native range lives beside its select button within a purple group
    // shell. Nothing interactive is nested inside another button.
    const shell=make('div','v45-group-shell');
    shell.append(pick);
    const dim=make('div','v45-group-dim');
    dim.hidden=true;
    const slider=make('input','v45-group-range');
    slider.type='range';slider.min='1';slider.max='100';slider.step='1';
    slider.value='72';slider.setAttribute('aria-label','Helligkeit: '+entry.label);
    const output=make('output','v45-group-value','–');
    const metaHelp=make('small','v45-group-feedback','Beim Loslassen anwenden');
    dim.append(slider,output,metaHelp);shell.append(dim);
    line.append(toggle,shell);
    slider.addEventListener('input',()=>{
     output.textContent=slider.value+' %';
     slider.style.setProperty('--v45-level',slider.value+'%');
     metaHelp.textContent='Loslassen zum Übernehmen';
    });
    slider.addEventListener('change',async()=>{
     if(this.groupPending.has(entry.id)||this.getSelected()!==entry.id)return;
     const percent=Number(slider.value);
     if(!Number.isFinite(percent)||percent<1||percent>100)return;
     this.groupPending.add(entry.id);slider.disabled=true;
     metaHelp.textContent='Helligkeit wird eingestellt …';
     try{
      await this.onGroupBrightness(entry.id,percent);
      metaHelp.textContent='✓ '+percent+' %';
      this.updateLampStates();
     }catch(error){
      metaHelp.textContent='Nicht übernommen';
      this.onPowerError(error,entry.id);
     }finally{
      this.groupPending.delete(entry.id);
      slider.disabled=false;this.updateGroupBrightness();
     }
    });
    this.groupDimmers.push({id:entry.id,shell,dim,slider,output,metaHelp});
   }
   if(entry.kind==='lamp'){
    const lightId=entry.id.slice(5);
    dimButton=make('button','v41-dim-toggle','☀');
    dimButton.type='button';
    dimButton.title='Helligkeit nur dieser Lampe';
    dimButton.setAttribute('aria-label','Helligkeit einstellen: '+entry.label);
    dimButton.setAttribute('aria-expanded','false');
    dimPanel=make('div','v41-dimmer');
    dimPanel.id='v41-dim-'+lightId.replace(/[^a-z0-9_-]/gi,'-');
    dimPanel.hidden=true;
    dimButton.setAttribute('aria-controls',dimPanel.id);
    const top=make('div','v41-dimmer-top');
    top.append(make('span','','☀ Helligkeit'));
    dimValue=make('output','v41-dimmer-value','–');
    top.append(dimValue);
    dimRange=make('input','v41-dim-range');
    dimRange.type='range';dimRange.min='1';dimRange.max='100';dimRange.step='1';
    const state=this.engine.lights[lightId]?.state||{};
    const initial=Math.max(1,Math.round((state.bri??180)/254*100));
    dimRange.value=String(initial);
    dimRange.setAttribute('aria-label','Helligkeit für '+entry.label);
    dimValue.textContent=(state.on===false?'Aus · ':'')+initial+' %';
    const helper=make('small','v41-dim-hint','Beim Loslassen anwenden');
    dimPanel.append(top,dimRange,helper);
    dimButton.onclick=()=>{
     dimPanel.hidden=!dimPanel.hidden;
     const open=!dimPanel.hidden;
     dimButton.setAttribute('aria-expanded',String(open));
     row.classList.toggle('v41-dimmer-open',open);
     if(open){
      const current=this.engine.lights[lightId]?.state||{};
      const value=Math.max(1,Math.round((current.bri??180)/254*100));
      dimRange.value=String(value);
      dimValue.textContent=(current.on===false?'Aus · ':'')+value+' %';
     }
    };
    dimRange.oninput=()=>{dimValue.textContent=dimRange.value+' %';helper.textContent='Loslassen zum Übernehmen';};
    dimRange.onchange=async()=>{
     if(this.pending.has(lightId)||this.engine.lights[lightId]?.state?.reachable===false)return;
     const percent=Number(dimRange.value);
     dimRange.disabled=true;dimButton.disabled=true;
     helper.textContent='Ändere Helligkeit …';
     try{
      // Only the chosen light, no group, no transmission per touch frame.
      await this.onBrightness(lightId,percent);
      helper.textContent='✓ '+percent+' %';
      this.updateLampStates();
     }catch(error){
      helper.textContent='Änderung fehlgeschlagen';
      this.onPowerError(error,lightId);
     }finally{
      dimRange.disabled=false;dimButton.disabled=false;
     }
    };
    line.append(dimButton);
   }
   if(power)line.append(power);
   row.append(line);
   if(dimPanel)row.append(dimPanel);
   this.selectables.push({id:entry.id,pick,row,symbol,power,lightStatus,dimButton,dimRange,dimValue});
   if(hasChildren){
    const children=make('div','g-tree-kids'+(entry.children.every(c=>c.kind==='lamp')?' g-tree-lamp-grid':''));children.setAttribute('role','group');
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
  this.updateLampStates();
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
 updateLampStates(){
  for(const {id,row,pick,power,lightStatus,dimButton,dimRange,dimValue}of this.selectables){
   if(!power)continue;
   const light=this.engine.lights[id.slice(5)],state=light?.state||{},reachable=state.reachable!==false;
   const active=Boolean(state.on),pending=this.pending.has(id.slice(5));
   // Browser elements have dataset/style; lightweight test DOMs may only expose attributes.
   if(row.dataset){row.dataset.on=String(active);row.dataset.reachable=String(reachable);row.dataset.pending=String(pending)}
   else{row.setAttribute('data-on',String(active));row.setAttribute('data-reachable',String(reachable));row.setAttribute('data-pending',String(pending))}
   const brightness=Number(state.bri);
   const value=Number.isFinite(brightness)?Math.max(.17,Math.min(1,brightness/254)):.74;
   row.style?.setProperty?.('--g-light-level',String(active?value:0));
   const hue=Number(state.hue),sat=Number(state.sat);
   row.style?.setProperty?.('--g-light-color',active&&Number.isFinite(hue)&&Number.isFinite(sat)&&sat>30?
    'hsl('+Math.round(hue/65535*360)+'deg '+Math.round(Math.max(30,sat/254*90))+'% 65%)':'#efd19a');
   power.disabled=!reachable||pending;
   power.setAttribute('aria-pressed',String(active));
   power.setAttribute('aria-label',(active?'Ausschalten: ':'Einschalten: ')+(light?.name||id.slice(5)));
   if(lightStatus)lightStatus.textContent=!reachable?'Nicht erreichbar':pending?'Schaltet …':active?'● An':'○ Aus';
   pick.disabled=!reachable;
   if(dimButton)dimButton.disabled=!reachable;
   if(dimRange&&!dimRange.disabled&&dimRange!==document.activeElement){dimRange.value=String(Math.max(1,Math.round((Number.isFinite(brightness)?brightness:180)/254*100)));}
   if(dimValue&&dimRange&&!dimRange.disabled&&dimRange!==document.activeElement)dimValue.textContent=(active?'':'Aus · ')+dimRange.value+' %';
  }
  this.updateGroupBrightness();
 }
 updateGroupBrightness(){
  const selected=this.getSelected();
  for(const {id,shell,dim,slider,output,metaHelp}of this.groupDimmers){
   const active=id===selected;
   dim.hidden=!active;
   shell.classList.toggle('v45-selected',active);
   if(!active)continue;
   const ids=this.engine.resolve(id,{reachableOnly:false})||[];
   const devices=ids.map(lightId=>this.engine.lights[lightId]).filter(x=>x&&x.state?.reachable!==false);
   const on=devices.filter(x=>x.state?.on===true);
   const mean=on.length?Math.round(on.reduce((sum,x)=>sum+(Number(x.state.bri)||180)/254*100,0)/on.length):0;
   if(slider!==document.activeElement&&!this.groupPending.has(id)){
    slider.value=String(Math.max(1,Math.min(100,mean)));
    output.textContent=mean+' %';
    slider.style.setProperty('--v45-level',mean+'%');
   }
   slider.disabled=!devices.length||this.groupPending.has(id);
   if(!devices.length)metaHelp.textContent='Keine erreichbaren Lampen';
   else if(!this.groupPending.has(id)&&metaHelp.textContent==='Nicht übernommen')
    metaHelp.textContent='Beim Loslassen anwenden';
  }
 }
 updateLampIcons(){
  if(!root.LumaLampIcons)return;
  for(const {id,symbol}of this.selectables){
   if(!id.startsWith('lamp:'))continue;
   const lightId=id.slice(5),device=this.engine.lights[lightId];
   const type=this.getLampIcon(lightId,device)||root.LumaLampIcons.guess(device);
   if(symbol.dataset.iconKind===type)continue;
   symbol.replaceChildren(root.LumaLampIcons.svg(type,'g-tree-lamp-svg'));symbol.dataset.iconKind=type;
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
  this.updateGroupBrightness();
 }

}
root.LumaGroupsTree={Tree};
})(typeof globalThis!=='undefined'?globalThis:this);
