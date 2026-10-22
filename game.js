(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const $=id=>document.getElementById(id);
let arena='school',running=false,player={x:250,y:350,hp:100,face:1,action:'idle',actionTime:0,invuln:0,jump:0},enemy={x:650,y:350,hp:100,face:-1,action:'idle',actionTime:0,invuln:0};
let wins=0,combo=0,comboTimer=0,muted=false,volume=.55,last=0,toastTimer=0,gameOver=false;
const keys=new Set(),held=new Set();
function toast(s){$('toast').textContent=s;$('toast').style.opacity=1;toastTimer=1.7}
function sound(type){
 if(muted||volume<=0)return;
 try{
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  if(!sound.ac)sound.ac=new AC();const ac=sound.ac;if(ac.state==='suspended')ac.resume();
  const now=ac.currentTime, master=ac.createGain();master.gain.value=volume*.22;master.connect(ac.destination);
  const osc=(f1,f2,dur,wave='sine',amp=.6,delay=0)=>{let o=ac.createOscillator(),g=ac.createGain();o.type=wave;o.frequency.setValueAtTime(f1,now+delay);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),now+delay+dur);g.gain.setValueAtTime(.001,now+delay);g.gain.exponentialRampToValueAtTime(amp,now+delay+.012);g.gain.exponentialRampToValueAtTime(.001,now+delay+dur);o.connect(g);g.connect(master);o.start(now+delay);o.stop(now+delay+dur+.02)};
  const hiss=(dur,amp=.5)=>{let n=Math.floor(ac.sampleRate*dur),b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);let src=ac.createBufferSource(),g=ac.createGain();src.buffer=b;g.gain.value=amp;src.connect(g);g.connect(master);src.start(now)};
  if(type==='punch'){osc(170,55,.13,'triangle',.9);hiss(.08,.8)}
  else if(type==='kick'){osc(115,38,.2,'sawtooth',.7);hiss(.12,.65)}
  else if(type==='jump'){osc(280,620,.15,'square',.35)}
  else if(type==='land'){osc(90,42,.12,'triangle',.5);hiss(.05,.3)}
  else if(type==='hit'){osc(210,75,.18,'sawtooth',.6);hiss(.13,.75)}
  else if(type==='win'){osc(440,660,.18,'square',.45);osc(550,880,.25,'square',.4,.18);osc(660,990,.35,'square',.4,.38)}
  else if(type==='lose'){osc(320,80,.6,'triangle',.5)}
  else if(type==='meme'){osc(780,160,.32,'square',.5);osc(130,70,.24,'sawtooth',.4,.33)}
  else if(type==='button'){osc(520,390,.045,'square',.2)}
  else if(type==='ko'){osc(180,30,.45,'sawtooth',.7);hiss(.2,.7)}
 }catch(e){}
}
function start(){if(running)return;running=true;gameOver=false;player.hp=100;enemy.hp=100;player.x=250;enemy.x=650;player.y=350;enemy.y=350;player.action='idle';enemy.action='idle';$('startOverlay').classList.add('hidden');$('status').textContent='Lawan musuh! Dekati lalu pukul atau tendang.';toast('FIGHT!');sound('button');}
$('startBtn').addEventListener('click',start);
$('soundToggle').addEventListener('click',()=>{muted=!muted;$('soundToggle').textContent=muted?'🔇 Suara mati':'🔊 Suara';$('soundToggle').setAttribute('aria-label',muted?'Nyalakan suara':'Matikan suara');if(!muted)sound('button')});
$('volume').addEventListener('input',e=>{volume=Number(e.target.value)/100;$('volumeText').textContent=e.target.value+'%'});
document.querySelectorAll('.arena').forEach(b=>b.addEventListener('click',()=>{arena=b.dataset.arena;document.querySelectorAll('.arena').forEach(x=>x.classList.toggle('active',x===b));$('arenaName').textContent=arena==='school'?'DEPAN SEKOLAH':arena==='koperasi'?'KOPERASI DESA':'KANTOR MBG';sound('button');toast('Arena diganti');draw()}));
function action(a){if(!running||gameOver)return;
 if(a==='left'||a==='right'||a==='up'||a==='down'){keys.add(a);return}
 if(a==='jump'){player.jump=.45;player.action='jump';player.actionTime=.25;sound('jump');return}
 if(a==='punch'||a==='kick'){player.action=a;player.actionTime=.22;sound(a);player.face=enemy.x>=player.x?1:-1;
   if(Math.abs(enemy.x-player.x)<130&&Math.abs(enemy.y-player.y)<85&&enemy.invuln<=0){let dmg=a==='punch'?12:18;enemy.hp=Math.max(0,enemy.hp-dmg);enemy.invuln=.25;combo++;comboTimer=1.4;sound('hit');$('status').textContent=a==='punch'?'Pukulan kena!':'Tendangan kena!';if(enemy.hp<=0){wins++;gameOver=true;running=false;sound('win');toast('MENANG! 🎉');$('status').textContent='Kamu menang! Tekan MULAI GAME untuk ronde baru.';$('startBtn').textContent='MAIN LAGI';$('startOverlay').classList.remove('hidden');}}
 }
}
document.querySelectorAll('[data-action]').forEach(b=>{let a=b.dataset.action;b.addEventListener('pointerdown',e=>{e.preventDefault();held.add(a);action(a)});['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>{held.delete(a);keys.delete(a)}))});
window.addEventListener('keydown',e=>{let map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',j:'punch',k:'kick',' ':'jump'};let a=map[e.key];if(a){e.preventDefault();if(!keys.has(a)){keys.add(a);action(a)}}});
window.addEventListener('keyup',e=>{let map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',j:'punch',k:'kick',' ':'jump'};if(map[e.key])keys.delete(map[e.key])});
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function text(s,x,y,size,color='#eaf4ff',align='left'){ctx.fillStyle=color;ctx.font=`bold ${size}px monospace`;ctx.textAlign=align;ctx.fillText(s,x,y)}
function drawBuilding(x,y,w,h,wall,roof,label,style=0){
 rect(x,y,w,h,wall);rect(x-8,y-8,w+16,12,roof);rect(x+8,y+8,w-16,5,'#d7e2ed');for(let i=0;i<4;i++){rect(x+18+i*(w-42)/4,y+35,25,27,'#5aa1c7');rect(x+20+i*(w-42)/4,y+37,21,23,'#203c5a')}
 rect(x+12,y+h-43,w-24,43,'#28394c');rect(x+w*.42,y+h-60,w*.16,60,'#8a6848');rect(x+w*.39,y+h-64,w*.22,6,'#d7b16b');rect(x+w*.25,y+13,w*.5,19,roof);text(label,x+w/2,y+27,Math.max(8,Math.min(14,w/label.length*.8)),'#fff5d6','center');
}
function bg(){
 let sky=ctx.createLinearGradient(0,0,0,520);sky.addColorStop(0,arena==='mbg'?'#8bbad7':'#7ac7d9');sky.addColorStop(1,'#d5e9c7');ctx.fillStyle=sky;ctx.fillRect(0,0,960,520);
 // clouds
 rect(70,45,90,14,'#dff3f5');rect(95,32,48,16,'#dff3f5');rect(690,58,120,13,'#dff3f5');rect(725,45,42,16,'#dff3f5');
 // distant trees / buildings
 for(let i=0;i<10;i++){let x=i*105+12;rect(x,160,35,90,'#477e65');rect(x-12,143,58,40,'#4f956d');rect(x-4,130,42,28,'#62a675')}
 rect(0,245,960,95,'#c3b7a0');rect(0,330,960,190,'#66717b');rect(0,340,960,180,'#727e86');
 for(let i=0;i<960;i+=80)rect(i,400,42,4,'#aeb5b9');
 if(arena==='school')drawBuilding(235,125,490,205,'#e7d6ad','#41658b','SMA • GERBANG SEKOLAH');
 if(arena==='koperasi')drawBuilding(235,125,490,205,'#e7d0a4','#b7473e','KOPERASI DESA');
 if(arena==='mbg')drawBuilding(235,125,490,205,'#d8e0e6','#2b648a','KANTOR MBG');
 // foreground pavement
 rect(0,454,960,66,'#48535d');for(let i=0;i<960;i+=96)rect(i,476,45,3,'#7e8991');
}
function drawFighter(o,isPlayer){
 let x=o.x,y=o.y-(o.jump>0?42*Math.sin((.45-o.jump)/.45*Math.PI):0),flip=o.face<0;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);
 // shadow
 ctx.fillStyle='#18202c88';ctx.beginPath();ctx.ellipse(0,5,25,7,0,0,Math.PI*2);ctx.fill();
 const skin=isPlayer?'#f4c49c':'#c98d6d',shirt=isPlayer?'#f0eee3':'#27334a',pants=isPlayer?'#26344c':'#20283b',hair=isPlayer?'#e9bd65':(o.kind===1?'#b43e50':o.kind===2?'#25263c':'#333b49');
 // legs with action
 rect(-15,-38,12,30,pants);rect(4,-38,12,30,pants);rect(-19,-10,18,7,'#e8e9e5');rect(3,-10,18,7,'#e8e9e5');
 // body
 rect(-18,-72,36,36,shirt);rect(-18,-72,36,5,isPlayer?'#c5d6e4':'#d14c5d');rect(-5,-69,10,29,isPlayer?'#d9e2e9':'#111a2b');
 // arms
 let punch=o.action==='punch'||o.action==='kick';rect(14,-66,punch?28:12,10,skin);rect(-26,-66,12,18,skin);rect(punch?38:11,-68,10,13,'#e8e5df');
 // neck/head/hair
 rect(-7,-82,14,12,skin);rect(-14,-103,28,25,skin);rect(-16,-105,31,11,hair);rect(-17,-100,7,13,hair);rect(7,-103,9,7,hair);rect(-7,-93,4,3,'#26344a');rect(5,-93,4,3,'#26344a');
 if(!isPlayer){rect(-17,-72,34,4,o.kind===1?'#e34859':o.kind===2?'#d9d9e2':'#7b8ba2')}
 if(o.invuln>0){rect(-24,-107,48,105,'#fff7');}
 ctx.restore();
}
function draw(){
 bg();
 // arena signs/details
 if(arena==='school'){rect(385,170,190,22,'#f1e8c9');text('SELAMAT DATANG',480,185,10,'#314967','center')}
 if(arena==='koperasi'){rect(350,170,260,22,'#fff0d5');text('KOPERASI DESA MERAH PUTIH',480,185,10,'#a3312d','center')}
 if(arena==='mbg'){rect(390,170,180,22,'#e9f1f7');text('MBG',480,185,12,'#245d80','center')}
 // characters depth
 const arr=[{o:player,p:true},{o:enemy,p:false}].sort((a,b)=>a.o.y-b.o.y);arr.forEach(z=>drawFighter(z.o,z.p));
 if(!running&&!gameOver){rect(0,0,960,520,'#08101b22')}
 $('playerHp').style.width=player.hp+'%';$('enemyHp').style.width=enemy.hp+'%';$('enemyHpText').textContent=enemy.hp+'%';$('wins').textContent=wins;$('combo').textContent='x'+combo;
}
function update(dt){
 if(!running){draw();return}
 if(keys.has('left')){player.x-=220*dt;player.face=-1;player.action='walk'}
 if(keys.has('right')){player.x+=220*dt;player.face=1;player.action='walk'}
 if(keys.has('up'))player.y-=125*dt;if(keys.has('down'))player.y+=125*dt;
 player.x=Math.max(45,Math.min(915,player.x));player.y=Math.max(315,Math.min(440,player.y));
 if(player.jump>0){player.jump-=dt;if(player.jump<=0){player.jump=0;sound('land')}}
 if(player.actionTime>0){player.actionTime-=dt;if(player.actionTime<=0)player.action='idle'}
 if(enemy.invuln>0)enemy.invuln-=dt;if(player.invuln>0)player.invuln-=dt;
 if(comboTimer>0){comboTimer-=dt;if(comboTimer<=0)combo=0}
 // basic enemy AI: approaches, occasionally attacks
 let dx=player.x-enemy.x,dy=player.y-enemy.y;
 if(Math.abs(dx)>75) {enemy.x+=Math.sign(dx)*95*dt;enemy.face=dx>0?1:-1;enemy.action='walk'}
 else if(Math.abs(dy)>25) enemy.y+=Math.sign(dy)*70*dt;
 else if(Math.random()<dt*.8&&player.invuln<=0){enemy.action='punch';enemy.actionTime=.2;player.hp=Math.max(0,player.hp-7);player.invuln=.5;sound('hit');toast('Kena serang!')}
 enemy.x=Math.max(40,Math.min(920,enemy.x));enemy.y=Math.max(315,Math.min(440,enemy.y));
 if(player.hp<=0){running=false;gameOver=true;sound('lose');toast('KALAH! Coba lagi');$('status').textContent='Kamu kalah. Coba lagi dan atur jarak serangan.';$('startBtn').textContent='COBA LAGI';$('startOverlay').classList.remove('hidden')}
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').style.opacity=0}
 draw();
}
function loop(t){let dt=Math.min(.04,(t-last)/1000||0);last=t;update(dt);requestAnimationFrame(loop)}
draw();requestAnimationFrame(loop);
})();