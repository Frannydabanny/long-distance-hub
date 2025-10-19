// The full MVP app. Uses localStorage for persistence. Swap with Supabase later.
import React, { useEffect, useMemo, useState } from 'react'

export default function LongDistanceHub() {
  const [tab, setTab] = useState<'home'|'games'|'learn'|'watch'|'calendar'|'cook'|'community'|'settings'>('home')
  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <Header />
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center gap-2 py-3 text-sm">
            {([
              ['home','Home'],['games','Play'],['learn','Learn'],['watch','Watch'],
              ['calendar','Calendar'],['cook','Cook Together'],['community','Community'],['settings','Settings'],
            ] as const).map(([key,label]) => (
              <button key={key} onClick={() => setTab(key)} className={`rounded-full px-3 py-1 transition ${tab===key? 'bg-indigo-600 text-white shadow':'hover:bg-gray-100'}`}>{label}</button>
            ))}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab==='home' && <Home/>}
        {tab==='games' && <Games/>}
        {tab==='learn' && <Learn/>}
        {tab==='watch' && <WatchTogether/>}
        {tab==='calendar' && <SharedCalendar/>}
        {tab==='cook' && <CookTogether/>}
        {tab==='community' && <Community/>}
        {tab==='settings' && <Settings/>}
      </main>
      <Footer />
    </div>
  )
}

function Header(){
  return (
    <header className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Long-Distance Hub</h1>
        <p className="mt-2 max-w-2xl text-white/90">A space to share with your long distance partner.</p>
      </div>
    </header>
  )
}
function Footer(){
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <span>Version 1.0</span>
        <span>Dedicated to my baby; Laura.</span>
      </div>
    </footer>
  )
}

function Card({ title, children }: { title:string, children:React.ReactNode }){
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// HOME
function Home(){
  const [ideas, setIdeas] = useLocalStorage<string[]>('ldh.ideas', [
    'Sunset photo scavenger hunt',
    '30‑minute Duet Cook: pasta + salad',
    'Watch one short film in Spanish w/ subtitles',
  ])
  const [newIdea, setNewIdea] = useState('')
  return (
    <section className="grid gap-6 md:grid-cols-3">
      <Card title="This Week">
        <ul className="space-y-2 text-sm">
          <li>• Call mom on Sunday</li>
          <li>• Plan November weekend trip</li>
          <li>• 10 new vocab words each</li>
        </ul>
      </Card>
      <Card title="Date Ideas">
        <form onSubmit={(e)=>{e.preventDefault(); if(!newIdea.trim())return; setIdeas([newIdea.trim(), ...ideas]); setNewIdea('')}} className="flex gap-2">
          <input className="flex-1 rounded border px-3 py-2" placeholder="Add an idea…" value={newIdea} onChange={(e)=>setNewIdea(e.target.value)} />
          <button className="rounded bg-indigo-600 px-3 py-2 text-white">Add</button>
        </form>
        <ul className="mt-3 space-y-1 text-sm">
          {ideas.map((it,i)=> (
            <li key={i} className="flex items-start gap-2"><span className="mt-1">•</span><span className="flex-1">{it}</span>
              <button onClick={()=>setIdeas(ideas.filter((_,idx)=>idx!==i))} className="text-gray-400 hover:text-red-600" aria-label="Remove">×</button>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Mini Checklist"><Checklist storageKey="ldh.checklist"/></Card>
    </section>
  )
}

// GAMES
function Games(){
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card title="Tic‑Tac‑Toe"><TicTacToe/></Card>
      <Card title="Prompt Ping‑Pong"><PromptPingPong/></Card>
    </section>
  )
}
function TicTacToe() {
  const [board, setBoard] = useLocalStorage<string[]>('ldh.ttt.board', Array(9).fill(''));
  const [xIsNext, setXIsNext] = useLocalStorage<boolean>('ldh.ttt.turn', true);

  const result = useMemo<WinResult | null>(() => calcWinner(board), [board]);
  const winner = result?.mark ?? null;
  const winSet = useMemo(() => new Set(result?.line ?? []), [result]);

  function click(i: number) {
    if (board[i] || winner) return;
    const next = board.slice();
    next[i] = xIsNext ? 'X' : 'O';
    setBoard(next);
    setXIsNext(!xIsNext);
  }

  function reset() {
    setBoard(Array(9).fill(''));
    setXIsNext(true);
  }

  return (
    <div>
      <div className="mb-2 text-sm text-gray-600">
        {winner ? (
          <>Winner: <b>{winner}</b></>
        ) : (
          <>Turn: <b>{xIsNext ? 'X' : 'O'}</b></>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 w-48">
        {board.map((v, i) => {
          const isWinningSquare = winSet.has(i);
          return (
            <button
              key={i}
              onClick={() => click(i)}
              className={
                `aspect-square rounded border text-2xl font-bold flex items-center justify-center
                 hover:bg-gray-50 ` + (isWinningSquare ? 'bg-green-300' : 'bg-white')
              }
            >
              {v}
            </button>
          );
        })}
      </div>

      <button onClick={reset} className="mt-3 rounded bg-gray-800 px-3 py-2 text-white">
        Reset
      </button>
      <p className="mt-2 text-xs text-gray-500">(Winning three highlight in green.)</p>
    </div>
  );
}
type WinResult = { mark: string; line: number[] };

function calcWinner(b: string[]): WinResult | null {
  const lines: number[][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, c, d] of lines) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return { mark: b[a], line: [a, c, d] };
    }
  }
  return null;
}
function PromptPingPong(){
  const [prompts, setPrompts] = useLocalStorage<string[]>('ldh.prompts', [
    'Share a favorite childhood memory.',
    'Describe your perfect weekend together.',
    'What’s a dish you’d love to cook as a team?',
  ])
  const [ptr, setPtr] = useLocalStorage<number>('ldh.prompts.ptr', 0)
  const [custom, setCustom] = useState('')
  return (
    <div>
      <div className="rounded border p-3"><div className="text-sm text-gray-600">Prompt</div><div className="mt-1 text-lg">{prompts[ptr % prompts.length]}</div></div>
      <div className="mt-3 flex gap-2">
        <button className="rounded bg-indigo-600 px-3 py-2 text-white" onClick={()=>setPtr(ptr+1)}>Next</button>
        <form onSubmit={(e)=>{e.preventDefault(); if(!custom.trim())return; setPrompts([custom.trim(), ...prompts]); setCustom('')}} className="flex gap-2 flex-1">
          <input className="flex-1 rounded border px-3 py-2" placeholder="Add your own prompt…" value={custom} onChange={(e)=>setCustom(e.target.value)} />
          <button className="rounded border px-3 py-2">Add</button>
        </form>
      </div>
    </div>
  )
}

// LEARN
function Learn(){
  const seed=[{front:'hola',back:'hello'},{front:'te extraño',back:'I miss you'},{front:'¿cuándo nos vemos?',back:'when do we see each other?'},{front:'beso',back:'kiss'}]
  const [cards, setCards] = useLocalStorage<{front:string;back:string}[]>('ldh.cards', seed)
  const [front,setFront]=useState(''); const [back,setBack]=useState('')
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card title="Flashcards"><Flashcards cards={cards}/></Card>
      <Card title="Add New Card">
        <form onSubmit={(e)=>{e.preventDefault(); if(!front.trim()||!back.trim())return; setCards([{front:front.trim(), back:back.trim()}, ...cards]); setFront(''); setBack('')}} className="grid gap-2">
          <input className="rounded border px-3 py-2" placeholder="Front (e.g., hola)" value={front} onChange={(e)=>setFront(e.target.value)} />
          <input className="rounded border px-3 py-2" placeholder="Back (e.g., hello)" value={back} onChange={(e)=>setBack(e.target.value)} />
          <button className="rounded bg-indigo-600 px-3 py-2 text-white">Add Card</button>
        </form>
        <p className="mt-2 text-xs text-gray-500">(Later: spaced repetition + shared deck sync.)</p>
      </Card>
    </section>
  )
}
function Flashcards({cards}:{cards:{front:string;back:string}[]}){
  const [i,setI]=useState(0); const [showBack,setShowBack]=useState(false)
  useEffect(()=>setShowBack(false),[i])
  if(cards.length===0) return <div className="text-sm text-gray-500">No cards yet.</div>
  const c=cards[i%cards.length]
  return (
    <div>
      <div className="aspect-video rounded-2xl border grid place-items-center text-2xl font-bold bg-white">{showBack? c.back : c.front}</div>
      <div className="mt-3 flex gap-2">
        <button className="rounded border px-3 py-2" onClick={()=>setShowBack(!showBack)}>Flip</button>
        <button className="rounded border px-3 py-2" onClick={()=>setI((i+1)%cards.length)}>Next</button>
      </div>
    </div>
  )
}

// WATCH TOGETHER
function WatchTogether(){
  const [url, setUrl] = useLocalStorage<string>('ldh.watch.url','https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  const [t, setT] = useLocalStorage<number>('ldh.watch.t',0)
  const shareLink = useMemo(()=>{ try{ const u=new URL(url); if(t>0) u.searchParams.set('t', String(t)); return u.toString()} catch{ return url } },[url,t])
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card title="Video URL">
        <div className="flex gap-2">
          <input className="flex-1 rounded border px-3 py-2" value={url} onChange={(e)=>setUrl(e.target.value)} />
          <input className="w-28 rounded border px-3 py-2" type="number" min={0} value={t} onChange={(e)=>setT(Number(e.target.value))} placeholder="t (sec)" />
        </div>
        <p className="mt-2 text-sm text-gray-600">Share this link with your partner to start at the same time:</p>
        <div className="mt-1 text-xs break-all rounded border bg-gray-50 p-2">{shareLink}</div>
        <p className="mt-2 text-xs text-gray-500">(Later: real-time sync via WebRTC + a room code.)</p>
      </Card>
      <Card title="Inline Player (YouTube embed)">
        <div className="aspect-video overflow-hidden rounded-2xl border bg-black">
          <iframe className="h-full w-full" src={toEmbed(url,t)} title="YouTube video player" allow="autoplay; encrypted-media" allowFullScreen />
        </div>
      </Card>
    </section>
  )
}
function toEmbed(u:string,t:number){
  try{ const url=new URL(u); const id=url.searchParams.get('v'); const start=t>0? `&start=${t}`:''; return `https://www.youtube.com/embed/${id}?rel=0${start}` } catch { return '' }
}

// CALENDAR
function SharedCalendar(){
  const [items,setItems]=useLocalStorage<{when:string;what:string}[]>('ldh.cal', [
    { when: nextIsoDays(1), what: 'Movie night' },
    { when: nextIsoDays(3), what: 'Cook-along: tacos' },
  ])
  const [when,setWhen]=useState(''); const [what,setWhat]=useState('')
  return (
    <div>
      <form onSubmit={(e)=>{e.preventDefault(); if(!when||!what.trim())return; setItems([...items,{when,what:what.trim()}]); setWhen(''); setWhat('')}} className="grid gap-2 md:grid-cols-[200px,1fr,auto]">
        <input type="datetime-local" className="rounded border px-3 py-2" value={when} onChange={(e)=>setWhen(e.target.value)} />
        <input className="rounded border px-3 py-2" placeholder="What" value={what} onChange={(e)=>setWhat(e.target.value)} />
        <button className="rounded bg-indigo-600 px-3 py-2 text-white">Add</button>
      </form>
      <div className="mt-4 divide-y rounded-2xl border bg-white">
        {items.slice().sort((a,b)=>a.when.localeCompare(b.when)).map((it,i)=> (
          <div key={i} className="flex items-center justify-between gap-3 p-3">
            <div>
              <div className="text-sm font-medium">{new Date(it.when).toLocaleString()}</div>
              <div className="text-sm text-gray-600">{it.what}</div>
            </div>
            <button onClick={()=>setItems(items.filter((_,idx)=>idx!==i))} className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Remove</button>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">(Later: Google Calendar OAuth + shared rooms.)</p>
    </div>
  )
}
function nextIsoDays(d:number){ const x=new Date(); x.setDate(x.getDate()+d); x.setMinutes(x.getMinutes()-x.getTimezoneOffset()); return x.toISOString().slice(0,16) }

// COOK TOGETHER
function CookTogether(){
  const [recipes,setRecipes]=useLocalStorage<{name:string;steps:string[]}[]>('ldh.recipes', [
    { name:'Creamy Mushroom Pasta (2p)', steps:['Boil salted water; start pasta.','Sauté mushrooms 6–8 min; add garlic.','Add cream + parmesan; simmer.','Toss pasta; season; serve.'] },
    { name:'Taco Night', steps:['Prep toppings (tomato, onion, cilantro).','Season + cook protein.','Warm tortillas.','Assemble & share pics!'] },
  ])
  const [name,setName]=useState(''); const [step,setStep]=useState(''); const [sel,setSel]=useState(0)
  function addStep(){ if(!step.trim())return; const r=recipes.slice(); r[sel].steps.push(step.trim()); setRecipes(r); setStep('') }
  function addRecipe(){ if(!name.trim())return; setRecipes([{name:name.trim(),steps:[]}, ...recipes]); setName(''); setSel(0) }
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card title="Recipes">
        <select className="w-full rounded border px-3 py-2" value={sel} onChange={(e)=>setSel(Number(e.target.value))}>
          {recipes.map((r,i)=>(<option key={i} value={i}>{r.name}</option>))}
        </select>
        <ol className="mt-3 list-decimal space-y-2 pl-4">{recipes[sel]?.steps.map((s,i)=>(<li key={i} className="text-sm">{s}</li>))}</ol>
        <div className="mt-3 flex gap-2">
          <input className="flex-1 rounded border px-3 py-2" placeholder="Add step…" value={step} onChange={(e)=>setStep(e.target.value)} />
          <button className="rounded border px-3 py-2" onClick={addStep}>Add Step</button>
        </div>
      </Card>
      <Card title="New Recipe">
        <div className="flex gap-2">
          <input className="flex-1 rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
          <button className="rounded bg-indigo-600 px-3 py-2 text-white" onClick={addRecipe}>Create</button>
        </div>
        <p className="mt-2 text-xs text-gray-500">(Later: timers + grocery list + photos.)</p>
      </Card>
    </section>
  )
}

// COMMUNITY (local stub)
function Community(){
  const [posts,setPosts]=useLocalStorage<{who:string;text:string}[]>('ldh.community',[{who:'You', text:'Drop your best long-distance tips here!'}])
  const [who,setWho]=useState('Anon'); const [text,setText]=useState('')
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card title="Ideas Feed (Local Demo)">
        <form onSubmit={(e)=>{e.preventDefault(); if(!text.trim())return; setPosts([{who: (who.trim()||'Anon'), text:text.trim()}, ...posts]); setText('')}} className="flex gap-2">
          <input className="w-36 rounded border px-3 py-2" placeholder="Name" value={who} onChange={(e)=>setWho(e.target.value)} />
          <input className="flex-1 rounded border px-3 py-2" placeholder="Share an idea…" value={text} onChange={(e)=>setText(e.target.value)} />
          <button className="rounded bg-indigo-600 px-3 py-2 text-white">Post</button>
        </form>
        <ul className="mt-3 space-y-3">{posts.map((p,i)=>(<li key={i} className="rounded-xl border p-3"><div className="text-xs text-gray-500">{p.who}</div><div className="text-sm">{p.text}</div></li>))}</ul>
        <p className="mt-2 text-xs text-gray-500">(Later: real auth + moderated community.)</p>
      </Card>
      <Card title="Find Other Couples (Roadmap)">
        <ul className="list-disc pl-5 text-sm space-y-2">
          <li>Public rooms with game lobbies.</li>
          <li>Topic tags (games, cooking, languages).</li>
          <li>Report/block + invite-only spaces.</li>
        </ul>
      </Card>
    </section>
  )
}

// SETTINGS
function Settings(){
  const [theme,setTheme]=useLocalStorage('ldh.theme','light')
  const [payload,setPayload]=useState('')
  const keys=['ldh.ideas','ldh.checklist','ldh.ttt.board','ldh.ttt.turn','ldh.prompts','ldh.prompts.ptr','ldh.cards','ldh.watch.url','ldh.watch.t','ldh.cal','ldh.recipes','ldh.community','ldh.theme']
  function exportAll(){ const out:Record<string,any>={}; keys.forEach(k=> out[k]=JSON.parse(localStorage.getItem(k)||'null')); setPayload(JSON.stringify(out,null,2)) }
  function importAll(){ try{ const data=JSON.parse(payload); Object.entries(data).forEach(([k,v])=> localStorage.setItem(k, JSON.stringify(v))); alert('Imported! Reload to see everything.') } catch { alert('Invalid JSON') } }
  useEffect(()=>{ document.documentElement.classList.toggle('dark', theme==='dark') },[theme])
  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card title="Theme">
        <div className="flex gap-3">
          {([['light','Light'],['dark','Dark']] as const).map(([k,label])=> (
            <label key={k} className={`flex items-center gap-2 rounded border px-3 py-2 ${theme===k? 'bg-gray-100':''}`}>
              <input type="radio" name="theme" checked={theme===k} onChange={()=>setTheme(k)} /> {label}
            </label>
          ))}
        </div>
      </Card>
      <Card title="Export / Import (Local Demo)">
        <div className="flex gap-2">
          <button className="rounded border px-3 py-2" onClick={exportAll}>Export JSON</button>
          <button className="rounded border px-3 py-2" onClick={importAll}>Import JSON</button>
        </div>
        <textarea className="mt-3 h-48 w-full rounded border p-2 font-mono text-xs" value={payload} onChange={(e)=>setPayload(e.target.value)} />
      </Card>
    </section>
  )
}

// Shared bits
function Checklist({storageKey}:{storageKey:string}){
  const [items,setItems]=useLocalStorage<{text:string;done:boolean}[]>(storageKey,[{text:'Good morning text',done:false},{text:'10 mins of language practice',done:false}])
  const [t,setT]=useState('')
  function add(){ if(!t.trim())return; setItems([{text:t.trim(),done:false}, ...items]); setT('') }
  return (
    <div>
      <div className="flex gap-2">
        <input className="flex-1 rounded border px-3 py-2" value={t} onChange={(e)=>setT(e.target.value)} placeholder="Add item…" />
        <button className="rounded border px-3 py-2" onClick={add}>Add</button>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((it,i)=>(
          <li key={i} className="flex items-center gap-2">
            <input type="checkbox" checked={it.done} onChange={()=>{ const next=items.slice(); next[i].done=!next[i].done; setItems(next) }} />
            <span className={it.done? 'text-gray-400 line-through':''}>{it.text}</span>
            <button onClick={()=>setItems(items.filter((_,idx)=>idx!==i))} className="ml-auto text-gray-400 hover:text-red-600" aria-label="Remove">×</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
function useLocalStorage<T>(key:string, initial:T){
  const [state,setState]=useState<T>(()=>{ try{ const raw=localStorage.getItem(key); return raw? JSON.parse(raw) as T : initial } catch { return initial } })
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(state)) } catch {} },[key,state])
  return [state,setState] as const
}
