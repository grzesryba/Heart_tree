// Kategorie randek — statyczna lista wspólna z backendem (seed_ideas.py)
// Pomysły na randki są teraz pobierane z backendu (MongoDB).
// Edycja, dodawanie i usuwanie odbywa się na stronie /admin.

export const CATEGORIES = {
  dom:       { label: 'Dom',         color: '#e85a7d', desc: 'Randki w domowym zaciszu' },
  poza:      { label: 'Poza domem',  color: '#d94a4a', desc: 'Będziecie musieli wyjść' },
  dzien:     { label: 'Dzień',       color: '#f4a261', desc: 'Randki w ciągu dnia' },
  wieczor:   { label: 'Wieczór',     color: '#8e44ad', desc: 'Idealne na romantyczne wieczory' },
  cieplo:    { label: 'Ciepło',      color: '#e76f51', desc: 'Wymagana ładna pogoda' },
  zima:      { label: 'Zima',        color: '#5a9bbf', desc: 'Wymagają zimowego krajobrazu' },
  czas:      { label: 'Czas',        color: '#9b7653', desc: 'Wymagają zaplanowania' },
  pieniadze: { label: 'Pieniądze',   color: '#2a9d8f', desc: 'Wymagają więcej niż 50 zł' },
};
