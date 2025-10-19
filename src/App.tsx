// The full MVP app. Uses localStorage for persistence. Swap with Supabase later.
import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'

type SessionUser = { id: string; email?: string | null; display_name?: string | null }

function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user
      if (u) {
        const prof = await supabase.from('profiles').select('display_name').eq('id', u.id).maybeSingle()
        setUser({ id: u.id, email: u.email ?? null, display_name: prof.data?.display_name ?? null })
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const u = session?.user
      if (u) {
        const prof = await supabase.from('profiles').select('display_name').eq('id', u.id).maybeSingle()
        setUser({ id: u.id, email: u.email ?? null, display_name: prof.data?.display_name ?? null })
      } else {
        setUser(null)
      }
    })
    return () => { sub.subscription.unsubscribe() }
  }, [])

  async function signIn(email: string) {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    if (error) alert(error.message); else alert('Magic link sent! Check your email.')
  }
  async function signOut() { await supabase.auth.signOut() }

  async function setDisplayName(name: string) {
    if (!user) return
    const { error } = await supabase.from('profiles').upsert({ id: user.id, display_name: name })
    if (error) alert(error.message)
  }

  return { user, signIn, signOut, setDisplayName }
}

function IdentityPanel({
  user, setDisplayName, roomId, setRoomId
}:{
  user: SessionUser | null,
  setDisplayName: (n:string)=>Promise<void>|void,
  roomId: string,
  setRoomId: (s:string)=>void
}) {
  const [email, setEmail] = useState('')
  const [name, setName]   = useState(user?.display_name ?? '')

  async function joinRoom(e: React.FormEvent) {
  e.preventDefault();
  if (!user) return alert('Sign in first');

  const id = roomId.trim();
  if (!id) return;

  // who am I?
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user?.id;
  if (!uid) return alert('No user ID');

  // ✅ create room if it doesn't exist
  // (upsert avoids duplicate key errors)
  const { error: roomErr } = await supabase
    .from('couples')
    .upsert({ room_id: id });

  if (roomErr) {
    alert('Could not create/join room: ' + roomErr.message);
    return;
  }

  // ✅ add (or keep) membership for this user
  const { error: memErr } = await supabase
    .from('couple_members')
    .upsert({ room_id: id, user_id: uid });

  if (memErr) {
    alert('Could not add member: ' + memErr.message);
    return;
  }

  alert(`Joined room: ${id}`);
}


  return (
    <Card title="Account & Room">
      {!user ? (
        <form onSubmit={(e)=>{e.preventDefault(); if(email) supabase.auth.signInWithOtp({ email, options:{ emailRedirectTo: window.location.origin } })}}>
          <div className="grid gap-2 md:grid-cols-[1fr,auto]">
            <input className="rounded border px-3 py-2"
                   placeholder="Your email"
                   value={email}
                   onChange={e=>setEmail(e.target.value)} />
            <button className="rounded bg-indigo-600 px-3 py-2 text-white">Send magic link</button>
          </div>
          <p className="mt-2 text-xs text-gray-500">We’ll email you a sign-in link. Do this for both of you.</p>
        </form>
      ) : (
        <div className="grid gap-2">
          <div className="text-sm">Signed in as <b>{user.email}</b></div>
          <div className="flex gap-2">
            <input className="rounded border px-3 py-2"
                   placeholder="Display name"
                   value={name}
                   onChange={e=>setName(e.target.value)} />
            <button className="rounded border px-3 py-2" onClick={()=>setDisplayName(name)}>Save</button>
            <button className="rounded border px-3 py-2" onClick={()=>supabase.auth.signOut()}>Sign out</button>
          </div>
          <form onSubmit={joinRoom} className="flex gap-2">
            <input className="rounded border px-3 py-2"
                   placeholder="Room code (e.g., our-room)"
                   value={roomId}
                   onChange={e=>setRoomId(e.target.value)} />
            <button className="rounded bg-green-600 px-3 py-2 text-white">Join / Create</button>
          </form>
          <p className="text-xs text-gray-500">Use the same room code for both of you. All tabs will sync in that room.</p>
        </div>
      )}
    </Card>
  )
}

type WinResult = { mark: string; line: number[] };

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
  // ✅ Hooks must be inside a component:
  const { user, signIn, signOut, setDisplayName } = useAuth()
  const [roomId, setRoomId] = useLocalStorage<string>('ldh.room', '')

  const [ideas, setIdeas] = useLocalStorage<string[]>('ldh.ideas', [
    'Sunset photo scavenger hunt',
    '30-minute Duet Cook: pasta + salad',
    'Watch one short film in Spanish w/ subtitles',
  ])
  const [newIdea, setNewIdea] = useState('')

  return (
    <>
      {/* Login + Room join panel */}
      <IdentityPanel
        user={user}
        setDisplayName={setDisplayName}
        roomId={roomId}
        setRoomId={setRoomId}
      />

      {/* Your existing Home content */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card title="This Week">
          <ul className="space-y-2 text-sm">
            <li>Call mom on Sunday</li>
            <li>Plan November weekend trip</li>
            <li>📝 10 new vocab words each</li>
          </ul>
        </Card>

        <Card title="Date Ideas">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!newIdea.trim()) return
              setIdeas([...ideas, newIdea.trim()])
              setNewIdea('')
            }}
            className="flex gap-2"
          >
            <input
              className="flex-1 rounded border px-3 py-2"
              placeholder="Add an idea…"
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
            />
            <button className="rounded bg-indigo-600 px-3 py-2 text-white">
              Add
            </button>
          </form>

          <ul className="mt-3 space-y-1 text-sm">
            {ideas.map((it, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1">•</span>
                <span className="flex-1">{it}</span>
                <button
                  onClick={() => setIdeas(ideas.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-red-600"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Mini Checklist">
          <Checklist storageKey="ldh.checklist" />
        </Card>
      </section>
    </>
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

function TicTacToe() {
  const [board, setBoard] = useLocalStorage<string[]>(
    'ldh.ttt.board',
    Array<string>(9).fill('')
  );
  const [xIsNext, setXIsNext] = useLocalStorage<boolean>('ldh.ttt.turn', true);

  // fully typed result
  const result = useMemo<WinResult | null>(() => calcWinner(board), [board]);
  const winner = result?.mark ?? null;

  // use a Set to check membership; always a Set<number>
  const winSet = useMemo<Set<number>>(
    () => new Set<number>(result?.line ?? []),
    [result]
  );

  function click(i: number) {
    if (board[i] || winner) return;
    const next = board.slice();
    next[i] = xIsNext ? 'X' : 'O';
    setBoard(next);
    setXIsNext(!xIsNext);
  }

  function reset() {
    setBoard(Array<string>(9).fill(''));
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
              className={`aspect-square rounded border text-2xl font-bold flex items-center justify-center
                hover:bg-gray-50 ${isWinningSquare ? 'bg-green-300' : 'bg-white'}`}
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

// WATCH TOGETHER
function WatchTogether(){
  const [url, setUrl] = useLocalStorage<string>('ldh.watch.url','https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [t, setT] = useLocalStorage<number>('ldh.watch.t', 0);

  // User-facing share link (adds ?t=seconds if provided)
  const shareLink = useMemo(() => {
    try {
      const u = new URL(url);
      if (t > 0) u.searchParams.set('t', String(t));
      return u.toString();
    } catch {
      return url;
    }
  }, [url, t]);

  // Robust YouTube embed src (handles youtube.com/watch?v=... and youtu.be/...)
  const embedSrc = useMemo(() => {
    try {
      const u = new URL(url.trim());
      let id: string | null = null;

      if (u.hostname.includes('youtu.be')) {
        // https://youtu.be/<id>
        id = u.pathname.replace('/', '') || null;
      } else if (u.hostname.includes('youtube.com')) {
        // https://www.youtube.com/watch?v=<id> or /shorts/<id>
        id = u.searchParams.get('v');
        if (!id && u.pathname.startsWith('/shorts/')) {
          id = u.pathname.split('/')[2] || null;
        }
      }

      if (!id) return '';
      const start = t > 0 ? `&start=${t}` : '';
      return `https://www.youtube.com/embed/${id}?rel=0${start}`;
    } catch {
      return '';
    }
  }, [url, t]);

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card title="Video URL">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border px-3 py-2"
            value={url}
            onChange={(e)=>setUrl(e.target.value)}
          />
          <input
            className="w-28 rounded border px-3 py-2"
            type="number"
            min={0}
            value={t}
            onChange={(e)=>setT(Number(e.target.value))}
            placeholder="t (sec)"
          />
        </div>

        <p className="mt-2 text-sm text-gray-600">
          Share this link with your partner to start at the same time:
        </p>
        <p className="mt-1 text-xs break-all rounded border bg-gray-50 p-2">
          {shareLink}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          (Later: real-time sync via WebRTC + a room code.)
        </p>
      </Card>

      <Card title="Inline Player (YouTube embed)">
        <div className="aspect-video overflow-hidden rounded-2xl border bg-black">
          <iframe
            className="h-full w-full"
            src={embedSrc}
            title="YouTube video player"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        </div>
      </Card>

      {/* Full-width watchlist card */}
      <div className="md:col-span-2">
        <Card title="Our Watchlist">
          <WatchList />
        </Card>
      </div>
    </section>
  )
}

type WatchItem = {
  id: string
  title: string
  url?: string
  notes?: string
  addedAt: string
  watched: boolean
  platform?: string   // e.g., Netflix, Prime, YouTube
}

function WatchList(){
  const { user } = useAuth()
  const [roomId] = useLocalStorage<string>('ldh.room','')
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(()=> {
    if (!roomId) return
    supabase.from('watchlist')
      .select('id,title,url,platform,notes,watched,created_by,created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending:false })
      .then(async ({ data, error }) => {
        if (!error && data) {
          const ids = [...new Set(data.map(d=>d.created_by))]
          const { data: profs } = await supabase.from('profiles').select('id,display_name').in('id', ids)
          const nameById = new Map((profs??[]).map(p=>[p.id, p.display_name ?? '']))
          setItems(data.map(d=> ({...d, name: nameById.get(d.created_by) || ''})))
        }
      })
    const ch = supabase.channel(`watchlist:${roomId}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'watchlist', filter:`room_id=eq.${roomId}`},
        async (_payload)=> {
          const { data } = await supabase.from('watchlist')
            .select('id,title,url,platform,notes,watched,created_by,created_at')
            .eq('room_id', roomId)
            .order('created_at', { ascending:false })
          if (data) {
            const ids = [...new Set(data.map(d=>d.created_by))]
            const { data: profs } = await supabase.from('profiles').select('id,display_name').in('id', ids)
            const nameById = new Map((profs??[]).map(p=>[p.id, p.display_name ?? '']))
            setItems(data.map(d=> ({...d, name: nameById.get(d.created_by) || ''})))
          }
        }
      ).subscribe()
    return ()=> { supabase.removeChannel(ch) }
  }, [roomId])

  async function addItem(e?: React.FormEvent){
    if (e) e.preventDefault()
    if (!user) return alert('Sign in first'); if(!roomId) return alert('Join a room first')
    const t = title.trim(); if (!t) return
    const { error } = await supabase.from('watchlist').insert({
      room_id: roomId, title: t, url: url.trim() || null, platform: platform.trim() || null,
      notes: notes.trim() || null, created_by: user.id
    })
    if (error) alert(error.message)
    setTitle(''); setUrl(''); setPlatform(''); setNotes('')
  }
  async function toggleWatched(id:string, watched:boolean){
    await supabase.from('watchlist').update({ watched }).eq('id', id)
  }
  async function removeItem(id:string){
    await supabase.from('watchlist').delete().eq('id', id)
  }

  const sorted = items.slice().sort((a,b)=> (a.watched===b.watched) ? b.created_at.localeCompare(a.created_at) : (a.watched?1:-1))

  return (
    <div>
      <form onSubmit={addItem} className="grid gap-2 md:grid-cols-4">
        <input className="rounded border px-3 py-2 md:col-span-2" placeholder="Title" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <input className="rounded border px-3 py-2" placeholder="Platform" value={platform} onChange={(e)=>setPlatform(e.target.value)} />
        <input className="rounded border px-3 py-2" placeholder="Link" value={url} onChange={(e)=>setUrl(e.target.value)} />
        <textarea className="rounded border px-3 py-2 md:col-span-3" placeholder="Notes" value={notes} onChange={(e)=>setNotes(e.target.value)} />
        <div className="flex items-center">
          <button className="rounded bg-indigo-600 px-3 py-2 text-white w-full" disabled={!user || !roomId}>Add to Watchlist</button>
        </div>
      </form>

      <ul className="mt-4 divide-y rounded-2xl border bg-white">
        {sorted.length===0 && <li className="p-4 text-sm text-gray-500">No items yet.</li>}
        {sorted.map((it)=>(
          <li key={it.id} className="p-3 flex gap-3 items-start">
            <input type="checkbox" checked={it.watched} onChange={(e)=>toggleWatched(it.id, e.target.checked)} className="mt-1" title="Mark as watched" />
            <div className="flex-1 min-w-0">
              <div className="font-medium break-words">
                {it.title}
                {it.platform && <span className="ml-2 text-xs rounded-full border px-2 py-0.5 text-gray-600">{it.platform}</span>}
              </div>
              <div className="text-xs text-gray-500">Added by {it.name || 'Anon'} • {new Date(it.created_at).toLocaleString()}</div>
              {it.url && <a className="text-sm text-indigo-600 underline break-all" href={it.url} target="_blank" rel="noreferrer">{it.url}</a>}
              {it.notes && <div className="text-sm text-gray-600 mt-1 break-words">{it.notes}</div>}
            </div>
            <button onClick={()=>removeItem(it.id)} className="text-sm text-red-600 hover:underline">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  )
}



// tiny id helper (reuse if you already have one)
function cryptoId(){ return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) }


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

function Community(){
  const { user } = useAuth()   // already created above
  const [roomId] = useLocalStorage<string>('ldh.room','')
  const [posts, setPosts] = useState<Array<{id:string;text:string;created_by:string;created_at:string;name?:string}>>([])
  const [text,setText]=useState('')

  // load + realtime
  useEffect(()=> {
    if (!roomId) return
    supabase.from('posts').select('id,text,created_by,created_at').eq('room_id', roomId).order('created_at', { ascending:false })
      .then(async ({ data, error })=>{
        if (!error && data) {
          // join names
          const ids = [...new Set(data.map(d=>d.created_by))]
          const { data: profs } = await supabase.from('profiles').select('id,display_name').in('id', ids)
          const nameById = new Map((profs??[]).map(p=>[p.id, p.display_name ?? '']))
          setPosts(data.map(d=> ({...d, name: nameById.get(d.created_by) || ''})))
        }
      })
    const ch = supabase.channel(`posts:${roomId}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'posts', filter:`room_id=eq.${roomId}`},
        async (payload)=> {
          const p = payload.new as any
          const { data: prof } = await supabase.from('profiles').select('display_name').eq('id', p.created_by).maybeSingle()
          setPosts(prev => [{...p, name: prof?.display_name || ''}, ...prev])
        }
      ).subscribe()
    return ()=> { supabase.removeChannel(ch) }
  }, [roomId])

  async function addPost(e:React.FormEvent){
    e.preventDefault()
    if (!user) return alert('Sign in first'); if(!roomId) return alert('Join a room first')
    const t = text.trim(); if(!t) return
    setText('')
    const { error } = await supabase.from('posts').insert({ room_id: roomId, text: t, created_by: user.id })
    if (error) alert(error.message)
  }

  return (
    <section className="grid gap-6 md:grid-cols-2">
      <Card title="Ideas Feed (Shared)">
        <form onSubmit={addPost} className="flex gap-2">
          <input className="w-36 rounded border px-3 py-2" disabled={!user} placeholder={user? (user.display_name || 'You') : 'Sign in first'} />
          <input className="flex-1 rounded border px-3 py-2" placeholder="Share an idea…" value={text} onChange={(e)=>setText(e.target.value)} />
          <button className="rounded bg-indigo-600 px-3 py-2 text-white" disabled={!user || !roomId}>Post</button>
        </form>
        <ul className="mt-3 space-y-3">
          {posts.map((p)=>(
            <li key={p.id} className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">{p.name || 'Anon'} • {new Date(p.created_at).toLocaleString()}</div>
              <div className="text-sm">{p.text}</div>
            </li>
          ))}
          {posts.length===0 && <li className="text-sm text-gray-500">No posts yet.</li>}
        </ul>
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
