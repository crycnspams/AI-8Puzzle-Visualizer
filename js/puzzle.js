// Core 8-puzzle logic and search algorithms (written from scratch). State = 9-char string, '0' = blank.
const MOVES=[[-3,'Up'],[3,'Down'],[-1,'Left'],[1,'Right']];
function neighbors(s){const b=s.indexOf('0'),c=b%3,out=[];
  for(const [d,mv] of MOVES){if((d===-1&&c===0)||(d===1&&c===2))continue;const t=b+d;if(t<0||t>8)continue;
    const a=[...s];a[b]=a[t];a[t]='0';out.push({s:a.join(''),mv});}
  return out;}
const valid=s=>s.length===9&&[...s].sort().join('')==='012345678';
function inversions(s){const a=[...s].filter(c=>c!=='0');let n=0;for(let i=0;i<8;i++)for(let j=i+1;j<8;j++)if(a[i]>a[j])n++;return n;}
const solvable=(a,b)=>inversions(a)%2===inversions(b)%2;
const HEUR={
  misplaced:(s,g)=>{let n=0;for(let i=0;i<9;i++)if(s[i]!=='0'&&s[i]!==g[i])n++;return n;},
  manhattan:(s,g)=>{let n=0;for(let i=0;i<9;i++){if(s[i]==='0')continue;const j=g.indexOf(s[i]);n+=Math.abs((i/3|0)-(j/3|0))+Math.abs(i%3-j%3);}return n;}};
function randomPuzzle(goal){let s;do{s=[...goal].sort(()=>Math.random()-.5).join('');}while(s===goal||!solvable(s,goal));return s;}
class Heap{constructor(k){this.a=[];this.k=k;}get size(){return this.a.length;}
  push(x){const a=this.a,k=this.k;let i=a.push(x)-1;while(i){const p=(i-1)>>1;if(k(a[p])<=k(x))break;a[i]=a[p];i=p;}a[i]=x;}
  pop(){const a=this.a,k=this.k,r=a[0],x=a.pop();if(a.length){let i=0;for(;;){let c=2*i+1;if(c>=a.length)break;if(c+1<a.length&&k(a[c+1])<k(a[c]))c++;if(k(x)<=k(a[c]))break;a[i]=a[c];i=c;}a[i]=x;}return r;}}
const KEY={ucs:n=>n.g,gbfs:n=>n.h*1000+n.g,astar:n=>n.f*1000+n.h};

// One pass of a search. acc holds shared counters; limit is used by DLS/IDDLS.
function run(start,goal,algo,o,acc,limit){
  const H=HEUR[o.h]||HEUR.manhattan,heap=algo in KEY,limited=algo==='dls'||algo==='iddls';
  const mk=(s,p,mv)=>{const g=p?p.g+1:0,h=H(s,goal);return{s,p,g,h,f:g+h,mv};};
  const F=heap?new Heap(KEY[algo]):[];let head=0;const size=()=>(heap?F.size:F.length-head);
  const closed=new Set(),seen=new Set([start]);
  const rec=(n,kids)=>{if(!acc.rec||acc.steps.length>=2500)return;
    const fr=heap?F.a.slice(0,15).sort((x,y)=>KEY[algo](x)-KEY[algo](y)).slice(0,8).map(c=>({s:c.s,g:c.g,h:c.h,fv:c.f})):[];
    acc.steps.push({t:'s',s:n.s,g:n.g,h:n.h,fv:n.f,d:n.g,par:n.p&&n.p.s,gen:acc.gen,exp:acc.exp,kids:kids.map(c=>({s:c.s,g:c.g,h:c.h,fv:c.f})),front:fr,fs:size(),ex:acc.exp});};
  F.push(mk(start,null,''));acc.gen++;
  while(size()){
    if(acc.gen>acc.cap){acc.capped=true;return null;}
    const n=algo==='bfs'?F[head++]:F.pop();
    if(!limited){if(closed.has(n.s))continue;closed.add(n.s);}
    acc.exp++;acc.maxD=Math.max(acc.maxD,n.g);if(acc.rec)acc.order.push(n.s);
    if(n.s===goal){rec(n,[]);return n;}
    const kids=[];
    if(!limited||n.g<limit)for(const{s,mv}of neighbors(n.s)){
      if(limited){let a=n,bad=false;while(a&&!bad){bad=a.s===s;a=a.p;}if(bad)continue;}
      else if(closed.has(s))continue;
      if(algo==='bfs'){if(seen.has(s))continue;seen.add(s);}
      const c=mk(s,n,mv);acc.gen++;kids.push(c);F.push(c);}
    acc.peak=Math.max(acc.peak,size()+closed.size);rec(n,kids);
  }
  return null;}

// algo: bfs | dfs | dls | iddls | ucs | gbfs | astar. o: {h, limit, rec, cap}
function search(start,goal,algo,o={}){
  const t0=performance.now(),acc={gen:0,exp:0,maxD:0,peak:1,cap:o.cap||300000,rec:!!o.rec,steps:[],order:[],capped:false};
  let n=null;
  if(algo==='iddls'){for(let L=0;L<=31&&!n&&!acc.capped;L++)n=run(start,goal,algo,o,acc,L);}
  else n=run(start,goal,algo,o,acc,o.limit??10);
  const path=[];for(let x=n;x;x=x.p)path.unshift(x);
  return{found:!!n,path:n?path:[],moves:n?n.g:0,cost:n?n.g:0,gen:acc.gen,exp:acc.exp,maxD:acc.maxD,capped:acc.capped,
    ms:performance.now()-t0,kb:acc.peak*96/1024,steps:acc.steps,order:acc.order};}
