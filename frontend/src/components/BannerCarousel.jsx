import { useEffect, useState } from "react";

export default function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch("http://localhost:4000/api/banners")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.banners || data?.data || [];
        setBanners(Array.isArray(list) ? list : []);
      })
      .catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 4000);
    return () => clearInterval(id);
  }, [banners]);

  // Securite : si pas de bannieres, on affiche celle par defaut que je t'ai generee
  if (!banners || banners.length === 0) {
    return (
      <div className="w-full h-[280px] md:h-[380px] rounded-[20px] overflow-hidden bg-[#0f1431] border border-white/10 flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-[#0f1431]" />
        <div className="relative z-10 text-center p-6">
          <h2 className="text-white text-2xl md:text-4xl font-bold">Bienvenue, merci pour votre presence ici</h2>
          <p className="text-white/60 mt-2 text-sm">Ajoute des images dans Gestion Bannieres</p>
        </div>
      </div>
    );
  }

  const banner = banners[current];
  const imageUrl = banner?.image_url || banner?.image || banner?.url || "";

  return (
    <div className="w-full h-[280px] md:h-[380px] rounded-[20px] overflow-hidden bg-black relative border border-white/10">
      {imageUrl ? (
        <img src={imageUrl.startsWith("http") ? imageUrl : `http://localhost:4000${imageUrl}`} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-[#0f1431]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      {banner?.title && (
        <div className="absolute bottom-6 left-6 right-6">
          <h2 className="text-white text-xl md:text-3xl font-bold drop-shadow-lg">{banner.title}</h2>
          {banner?.subtitle && <p className="text-white/80 text-sm mt-1">{banner.subtitle}</p>}
        </div>
      )}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition ${i === current ? "bg-white w-6" : "bg-white/40"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
