/** Local monument photos from /assets/images/monuments — one is chosen at random when auth mounts. */
export const MONUMENT_AUTH_PHOTOS = [
  {
    src: "/assets/images/monuments/adi-lica-ZpN1lhola0s-unsplash.jpg",
    alt: "Monument photo 1",
  },
  {
    src: "/assets/images/monuments/ahmed-afifi-Jl7Mj4i65CE-unsplash.jpg",
    alt: "Monument photo 2",
  },
  {
    src: "/assets/images/monuments/andrea-leopardi-ekVEz9T6BZE-unsplash.jpg",
    alt: "Monument photo 3",
  },
  {
    src: "/assets/images/monuments/edgardo-ibarra-TeA0-Q2NIuw-unsplash.jpg",
    alt: "Monument photo 4",
  },
  {
    src: "/assets/images/monuments/julie-sd-uUfDQxmTcW0-unsplash.jpg",
    alt: "Monument photo 5",
  },
  {
    src: "/assets/images/monuments/mansi-telharkar-DvMqB61ASPM-unsplash.jpg",
    alt: "Monument photo 6",
  },
  {
    src: "/assets/images/monuments/premium_photo-1661962754715-d081d9ec53a3.avif",
    alt: "Monument photo 7",
  },
];

export function pickRandomMonumentPhoto() {
  const i = Math.floor(Math.random() * MONUMENT_AUTH_PHOTOS.length);
  return MONUMENT_AUTH_PHOTOS[i];
}

const STORAGE_KEY = "safar-auth-monument-photo";
let memoryPhoto = null;

/** Same image for the whole browser tab while using auth (login ↔ signup remounts). */
export function getStableAuthMonumentPhoto() {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.src === "string") {
          memoryPhoto = parsed;
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }
  }
  if (memoryPhoto) return memoryPhoto;
  const chosen = pickRandomMonumentPhoto();
  memoryPhoto = chosen;
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chosen));
    }
  } catch {
    /* ignore */
  }
  return chosen;
}
