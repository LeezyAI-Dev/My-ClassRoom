import { useEffect, useState } from 'react';
export default function BannerManager(){
  const [banners, setBanners] = useState([]);
  useEffect(()=>{
    fetch('http://localhost:4000/api/banners').then(r=>r.json()).then(data=>{
      const list = Array.isArray(data)?data:(data?.banners||data?.data||[]);
      setBanners(Array.isArray(list)?list:[]);
    }).catch(()=>setBanners([]));
  },[]);
  if(!banners) return null;
  return (
    <div className='p-4 bg-[#0f1431] rounded-[16px] border border-white/10'>
      <h3 className='text-white font-bold mb-2'>Banniere accueil</h3>
      {banners.length===0? <p className='text-white/50 text-sm'>Aucune image pour instant</p> : <div className='space-y-2'>{(banners||[]).map((b,i)=><div key={b?.id||i} className='text-white/70 text-xs truncate'>{ (b?.image_url||b?.image||b?.url||'').substring(0,60) || `Banniere ${i+1}` }</div>)}</div>}
    </div>
  );
}
