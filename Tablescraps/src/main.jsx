import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createClient} from '@supabase/supabase-js';
import {Search, Plus, CalendarDays, X, ChefHat, Clock3, Users, Trash2, LogIn, LogOut, UploadCloud, Pencil} from 'lucide-react';
import './styles.css';

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL;
const supabaseKey=import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=(supabaseUrl&&supabaseKey)?createClient(supabaseUrl,supabaseKey):null;
const demo=[
 {id:'1',title:'Creamy Garlic Pasta',description:'A cozy weeknight pasta with parmesan and lots of garlic.',image_url:'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80',ingredients:['spaghetti','garlic','butter','parmesan','cream','parsley'],steps:['Boil pasta until al dente.','Sauté garlic in butter.','Add cream and parmesan.','Toss with pasta and parsley.'],tags:['quick','dinner'],minutes:25,servings:2},
 {id:'2',title:'Honey Soy Chicken',description:'Sticky, savory chicken that works beautifully with rice.',image_url:'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=80',ingredients:['chicken thighs','soy sauce','honey','garlic','ginger','sesame'],steps:['Mix soy, honey, garlic and ginger.','Marinate chicken for 20 minutes.','Pan-sear until browned and cooked through.','Glaze and finish with sesame.'],tags:['high-protein','meal prep'],minutes:35,servings:4},
 {id:'3',title:'Avocado Toast',description:'Simple, bright and ready in under ten minutes.',image_url:'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=900&q=80',ingredients:['sourdough','avocado','lemon','chili flakes','olive oil'],steps:['Toast sourdough.','Mash avocado with lemon.','Spread over toast and season.'],tags:['breakfast','quick'],minutes:8,servings:1}
];

function emptyForm(){
  return {title:'', description:'', imageFile:null, imagePreview:'', ingredients:[], stepsList:[], ingredientDraft:'', stepDraft:''};
}

function App(){
 const [session,setSession]=useState(null); const [recipes,setRecipes]=useState(demo); const [q,setQ]=useState(''); const [tag,setTag]=useState('All'); const [view,setView]=useState('library'); const [selected,setSelected]=useState(null); const [modal,setModal]=useState(false); const [busy,setBusy]=useState(false); const [auth,setAuth]=useState(false); const [email,setEmail]=useState('');
 const [form,setForm]=useState(emptyForm());
 const [editingId,setEditingId]=useState(null);

 useEffect(()=>{if(!supabase)return; supabase.auth.getSession().then(({data})=>setSession(data.session)); const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s)); return()=>data.subscription.unsubscribe()},[]);
 useEffect(()=>{if(!supabase||!session?.user)return; supabase.from('recipes').select('*').order('created_at',{ascending:false}).then(({data,error})=>{if(!error&&data?.length)setRecipes(data)});},[session]);

 const tags=useMemo(()=>['All',...new Set(recipes.flatMap(r=>r.tags||[]))],[recipes]);
 const filtered=recipes.filter(r=>{const hay=[r.title,r.description,...(r.ingredients||[]),...(r.tags||[])].join(' ').toLowerCase();return hay.includes(q.toLowerCase())&&(tag==='All'||(r.tags||[]).includes(tag))});

 async function signIn(){if(!supabase){alert('Add Supabase credentials to .env.local first.');return} const {error}=await supabase.auth.signInWithOtp({email}); if(error)alert(error.message);else alert('Check your email for the magic link.')}
 async function signOut(){await supabase?.auth.signOut();setSession(null)}

 function openAddModal(){setForm(emptyForm());setEditingId(null);setModal(true)}
 function openEditModal(recipe){
   setForm({
     title:recipe.title||'',
     description:recipe.description||'',
     imageFile:null,
     imagePreview:recipe.image_url||'',
     ingredients:recipe.ingredients||[],
     stepsList:recipe.steps||[],
     ingredientDraft:'',
     stepDraft:''
   });
   setEditingId(recipe.id);
   setSelected(null);
   setModal(true);
 }
 function closeAddModal(){if(form.imageFile&&form.imagePreview)URL.revokeObjectURL(form.imagePreview);setModal(false);setEditingId(null)}

 function handleImageChange(e){
   const file=e.target.files?.[0];
   if(!file)return;
   if(form.imageFile&&form.imagePreview)URL.revokeObjectURL(form.imagePreview);
   setForm(f=>({...f,imageFile:file,imagePreview:URL.createObjectURL(file)}));
 }
 function addIngredient(){
   const val=form.ingredientDraft.trim();
   if(!val)return;
   setForm(f=>({...f,ingredients:[...f.ingredients,val],ingredientDraft:''}));
 }
 function removeIngredient(i){setForm(f=>({...f,ingredients:f.ingredients.filter((_,idx)=>idx!==i)}))}
 function addStep(){
   const val=form.stepDraft.trim();
   if(!val)return;
   setForm(f=>({...f,stepsList:[...f.stepsList,val],stepDraft:''}));
 }
 function removeStep(i){setForm(f=>({...f,stepsList:f.stepsList.filter((_,idx)=>idx!==i)}))}

 async function saveRecipe(){
   setBusy(true);
   const fields={
     title:form.title.trim()||'Untitled recipe',
     description:form.description.trim(),
     image_url:form.imagePreview||'',
     ingredients:form.ingredients,
     steps:form.stepsList
   };
   if(editingId){
     if(supabase&&session?.user){
       const {data,error}=await supabase.from('recipes').update(fields).eq('id',editingId).select().single();
       if(error)alert(error.message);else setRecipes(recipes.map(r=>r.id===editingId?data:r));
     }else{
       setRecipes(recipes.map(r=>r.id===editingId?{...r,...fields}:r));
     }
   }else{
     const recipe={...fields,tags:[],minutes:30,servings:2};
     if(supabase&&session?.user){
       const {data,error}=await supabase.from('recipes').insert({...recipe,user_id:session.user.id}).select().single();
       if(error)alert(error.message);else setRecipes([data,...recipes]);
     }else{
       setRecipes([{...recipe,id:crypto.randomUUID()},...recipes]);
     }
   }
   setBusy(false);
   setModal(false);
   setEditingId(null);
   setForm(emptyForm());
 }

 async function removeRecipe(id){if(!confirm('Delete this recipe?'))return;if(supabase&&session?.user)await supabase.from('recipes').delete().eq('id',id);setRecipes(recipes.filter(r=>r.id!==id));setSelected(null)}

 const canSave=form.title.trim()&&!busy;

 return <div className="app">
  <aside><div className="brand"><div className="logo"><ChefHat size={20}/></div><span>tablescraps</span></div><nav><button className={view==='library'?'active':''} onClick={()=>setView('library')}><ChefHat size={18}/>Library</button><button className={view==='planner'?'active':''} onClick={()=>setView('planner')}><CalendarDays size={18}/>Meal plan</button></nav><div className="side-note"><b>Your kitchen, organized.</b><span>Save recipes before they disappear into your camera roll.</span></div><div className="account">{session?<><span className="avatar">{session.user.email?.[0]?.toUpperCase()}</span><div><b>{session.user.email}</b><button onClick={signOut}><LogOut size={14}/> Sign out</button></div></>:<button className="login" onClick={()=>setAuth(true)}><LogIn size={16}/>Sign in</button>}</div></aside>
  <main><header><div><p className="eyebrow">YOUR RECIPE BOX</p><h1>{view==='library'?'A better place for recipes.':'Plan the week.'}</h1><p className="sub">{view==='library'?'Screenshots, links, and forgotten recipes — all searchable in one place.':'Pick a few favorites and make dinner decisions easier.'}</p></div><button className="primary" onClick={openAddModal}><Plus size={18}/> Add recipe</button></header>
  {view==='library'?<><div className="toolbar"><div className="search"><Search size={18}/><input placeholder="Search by recipe or ingredient…" value={q} onChange={e=>setQ(e.target.value)}/></div><div className="chips">{tags.map(t=><button key={t} className={tag===t?'chip on':'chip'} onClick={()=>setTag(t)}>{t}</button>)}</div></div><div className="grid">{filtered.map(r=><article className="card" key={r.id} onClick={()=>setSelected(r)}><div className="cover">{r.image_url?<img src={r.image_url} alt=""/>:<div className="placeholder"><ChefHat size={30}/></div>}<div className="time"><Clock3 size={14}/>{r.minutes||30} min</div></div><div className="cardbody"><div className="tagrow">{(r.tags||[]).slice(0,2).map(t=><span key={t}>{t}</span>)}</div><h2>{r.title}</h2><p>{r.description}</p><div className="meta"><span><Users size={14}/>{r.servings||2} servings</span><span>{(r.ingredients||[]).length} ingredients</span></div></div></article>)}</div>{!filtered.length&&<div className="empty"><ChefHat size={36}/><h3>No scraps found</h3><p>Try another ingredient or add a recipe.</p></div>}</>:<div className="planner"><div className="week"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d,i)=><div className="day" key={d}><b>{d}</b>{recipes[i%recipes.length]&&<button onClick={()=>setSelected(recipes[i%recipes.length])}>{recipes[i%recipes.length].title}</button>}</div>)}</div>}
  </main>

  {selected&&<div className="overlay" onMouseDown={()=>setSelected(null)}><section className="detail" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}><X/></button>{selected.image_url&&<img className="detailimg" src={selected.image_url} alt=""/>}<div className="detailcontent"><h2>{selected.title}</h2><p>{selected.description}</p><div className="twocol"><div><h3>Ingredients</h3><ul>{selected.ingredients?.map((x,i)=><li key={i}>{x}</li>)}</ul></div><div><h3>Steps</h3><ol>{selected.steps?.map((x,i)=><li key={i}>{x}</li>)}</ol></div></div><div className="actionsrow"><button className="secondary" onClick={()=>openEditModal(selected)}><Pencil size={16}/>Edit recipe</button><button className="danger" onClick={()=>removeRecipe(selected.id)}><Trash2 size={16}/>Delete recipe</button></div></div></section></div>}

  {modal&&<div className="overlay" onMouseDown={closeAddModal}>
    <section className="detail addform" onMouseDown={e=>e.stopPropagation()}>
      <button className="close" onClick={closeAddModal}><X/></button>

      <label className="addform-image" style={form.imagePreview?{backgroundImage:`url(${form.imagePreview})`}:undefined}>
        {!form.imagePreview&&<><UploadCloud size={26}/><span>Add a photo</span></>}
        <input type="file" accept="image/*" onChange={handleImageChange}/>
      </label>

      <div className="detailcontent">
        <input className="title-input" placeholder="Recipe name" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
        <textarea className="desc-input" placeholder="A short description of this dish…" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>

        <div className="twocol">
          <div>
            <h3>Ingredients</h3>
            <ul className="edit-list">
              {form.ingredients.map((ing,i)=>(
                <li key={i}><span>{ing}</span><button type="button" onClick={()=>removeIngredient(i)}><X size={12}/></button></li>
              ))}
            </ul>
            <div className="add-row">
              <input placeholder="Add ingredient" value={form.ingredientDraft} onChange={e=>setForm(f=>({...f,ingredientDraft:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addIngredient()}}}/>
              <button type="button" onClick={addIngredient}><Plus size={16}/></button>
            </div>
          </div>
          <div>
            <h3>Steps</h3>
            <ol className="edit-list">
              {form.stepsList.map((s,i)=>(
                <li key={i}><span>{s}</span><button type="button" onClick={()=>removeStep(i)}><X size={12}/></button></li>
              ))}
            </ol>
            <div className="add-row">
              <input placeholder="Add step" value={form.stepDraft} onChange={e=>setForm(f=>({...f,stepDraft:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addStep()}}}/>
              <button type="button" onClick={addStep}><Plus size={16}/></button>
            </div>
          </div>
        </div>

        <button className="primary full" disabled={!canSave} onClick={saveRecipe}>{busy?'Saving…':(editingId?'Save changes':'Save recipe')}</button>
      </div>
    </section>
  </div>}

  {auth&&<div className="overlay"><section className="modal auth"><button className="close" onClick={()=>setAuth(false)}><X/></button><p className="eyebrow">ACCOUNT</p><h2>Sign in to sync your scraps.</h2><p className="muted">We’ll send a passwordless magic link.</p><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" type="email"/><button className="primary full" onClick={signIn}>Send magic link</button></section></div>}
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
