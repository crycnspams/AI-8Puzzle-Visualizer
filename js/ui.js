const $=id=>document.getElementById(id),fmt=s=>s.replace('0','_').match(/.{3}/g).join(' / ');
const S={start:'283164705',goal:'123804765',res:null,frames:[],i:0,t:null,nS:0};
const mini=s=>`<div class="mini">${[...s].map(c=>`<i class="${c==='0'?'b':''}">${c==='0'?'':c}</i>`).join('')}</div>`;
const grid=(id,s)=>{$(id).innerHTML=[...s].map(c=>`<input maxlength="1" inputmode="numeric" aria-label="cell" value="${c==='0'?'_':c}">`).join('');};
const read=id=>[...$(id).children].map(e=>/^[_0\s]?$/.test(e.value)?'0':e.value).join('');
const msg=(t,bad)=>{$('msg').textContent=t;$('msg').className='small mt-2 '+(bad?'err':'ok');};
// navigation
function go(p){document.querySelectorAll('.page').forEach(e=>e.classList.toggle('d-none',e.id!==p));document.querySelectorAll('.nav-link[data-page]').forEach(e=>e.classList.toggle('active',e.dataset.page===p));}
document.querySelectorAll('[data-page]').forEach(e=>e.onclick=ev=>{ev.preventDefault();go(e.dataset.page);});
// board
const tiles={};for(let d=1;d<=8;d++){const e=document.createElement('div');e.className='tile';e.textContent=d;$('board').appendChild(e);tiles[d]=e;}
const setBoard=s=>{for(let d=1;d<=8;d++){const p=s.indexOf(d);tiles[d].style.transform=`translate(${p%3*104.79}%,${(p/3|0)*104.79}%)`;}};
function resetView(){stop();S.frames=[];S.res=null;setBoard(S.start);$('mi').innerHTML=mini(S.start);$('mg').innerHTML=mini(S.goal);
  $('cap').textContent='Press Run to start.';['succ','front','expl','sum','path','stats'].forEach(k=>$(k).textContent='');}
function setPuzzle(st,gl){
  if(!valid(st)||!valid(gl))return msg('Each state must use the digits 0 to 8 exactly once (0 or _ is the blank).',1);
  if(!solvable(st,gl))return msg('No solution exists: the two states have different inversion parity.',1);
  S.start=st;S.goal=gl;grid('gi',st);grid('gg',gl);resetView();msg('Puzzle ready.');}
$('apply').onclick=()=>setPuzzle(read('gi'),read('gg'));
$('rand').onclick=()=>{const gl=read('gg');if(!valid(gl))return msg('Fix the goal state first.',1);setPuzzle(randomPuzzle(gl),gl);};
// playback
const delay=()=>1050-$('speed').value*10;
function stop(){clearTimeout(S.t);S.t=null;}
function play(){stop();S.t=setTimeout(()=>{if(S.i>=S.frames.length-1){S.t=null;return;}show(S.i+1);play();},delay());}
const box=(l,v)=>`<div class="col-6 col-md-3"><div class="stat"><small>${l}</small>${v}</div></div>`;
function show(i){
  if(!S.frames.length)return;S.i=Math.max(0,Math.min(i,S.frames.length-1));const f=S.frames[S.i];setBoard(f.s);
  $('cap').textContent=f.t==='s'?`Search step ${S.i+1} of ${S.nS}: node being expanded`:`Solution step ${f.k} of ${S.res.moves}${f.mv?` (blank moves ${f.mv})`:' (initial state)'}`;
  $('stats').innerHTML=box('Current node',fmt(f.s))+box('Parent node',f.par?fmt(f.par):'none')+box('Search depth',f.d)+box('Path cost g(n)',f.g)+
    box('Heuristic h(n)',f.h)+box('f(n) = g + h',f.fv)+box('Nodes generated',f.gen)+box('Nodes expanded',f.exp);
  $('succ').innerHTML=f.kids?(f.kids.length?f.kids.map(k=>`<div class="text-center">${mini(k.s)}<br><small>g=${k.g} h=${k.h} f=${k.fv}</small></div>`).join(''):'<span class="text-muted">None (goal reached or all neighbours explored)</span>'):'<span class="text-muted">Showing the solution path.</span>';
  $('front').textContent=f.t==='s'?`size: ${f.fs}\n`+f.front.map(c=>`${fmt(c.s)}  g=${c.g} h=${c.h} f=${c.fv}`).join('\n'):'';
  $('expl').textContent=`size: ${f.ex}\n`+S.res.order.slice(Math.max(0,f.ex-10),f.ex).map(fmt).join('\n');}
function solve(){
  stop();const h=$('heur').value;$('cap').textContent='Searching...';
  setTimeout(()=>{const r=search(S.start,S.goal,'astar',{h,rec:true});S.res=r;S.frames=r.steps.slice();S.nS=S.frames.length;
    r.path.forEach((n,k)=>S.frames.push({t:'p',k,mv:n.mv,s:n.s,g:n.g,h:n.h,fv:n.f,d:n.g,par:n.p&&n.p.s,gen:r.gen,exp:r.exp,kids:null,front:[],fs:0,ex:r.exp}));
    const row=(a,b)=>`<tr><th>${a}</th><td>${b}</td></tr>`;
    $('sum').innerHTML=`<h2 class="h5">Solution summary</h2><table class="table table-sm bg-white">`+row('Solution',r.found?'Found':'Not found')+row('Total moves',r.moves)+row('Nodes generated',r.gen)+
      row('Nodes expanded',r.exp)+row('Maximum search depth',r.maxD)+row('Execution time',r.ms.toFixed(2)+' ms')+row('Path cost',r.cost)+row('Memory (approx.)',r.kb.toFixed(1)+' KB')+
      `</table>`+(r.steps.length>=2500?'<p class="small text-muted">Playback shows the first 2500 search steps; statistics cover the full search.</p>':'');
    $('path').innerHTML=r.path.map((n,k)=>`<div data-k="${k}">Step ${k}${n.mv?' ('+n.mv+')':''}<br>${mini(n.s)}</div>`).join('');
    $('path').querySelectorAll('[data-k]').forEach(e=>e.onclick=()=>{stop();show(S.nS+ +e.dataset.k);});
    show(0);play();},20);}
$('run').onclick=solve;$('pause').onclick=stop;$('resume').onclick=()=>{if(S.frames.length)play();};
$('next').onclick=()=>{stop();show(S.i+1);};$('prev').onclick=()=>{stop();show(S.i-1);};
$('skip').onclick=()=>{stop();if(S.res&&S.res.found)show(S.nS);};$('reset').onclick=resetView;
// comparison
$('cmp').onclick=()=>{$('cmpmsg').textContent='Running...';setTimeout(()=>{
  const h=$('heur').value,L=+$('lim').value||8,N={bfs:'BFS',dfs:'DFS',dls:`DLS (limit ${L})`,iddls:'IDDLS',gbfs:`GBFS (${h})`,astar:`A* (${h})`};
  $('cmpbody').innerHTML=Object.keys(N).map(a=>{const r=search(S.start,S.goal,a,{h,limit:L,cap:300000});
    const m=r.kb<500?'Low':r.kb<3000?'Medium':'High';
    return`<tr><td>${N[a]}</td><td>${r.found?'Yes':r.capped?'No (node cap reached)':'No'}</td><td>${r.gen}</td><td>${r.exp}</td><td>${r.found?r.moves:'-'}</td><td>${r.ms.toFixed(1)} ms</td><td>${r.kb.toFixed(0)} KB (${m})</td></tr>`;}).join('');
  $('cmpmsg').textContent='';},20);};
grid('gi',S.start);grid('gg',S.goal);resetView();
