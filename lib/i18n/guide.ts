// Copy for the "Cómo funciona" guide (app/(app)/guide) and the Home card
// that links to it. Kept apart from strings.ts because it is long-form text.

export type Grade = "again" | "hard" | "good" | "easy";

const es = {
  title: "Cómo funciona",
  subtitle: "Memoriza la Palabra, una tarjeta a la vez.",
  heroTitle: "Tus versos, en tarjetas que repasas a tiempo",
  heroBody:
    "VersoRefuerzo convierte cada versículo en una tarjeta de memoria. La app decide cuándo repasarla: justo antes de que la olvides. Unos minutos al día bastan.",
  stepsTitle: "En tres pasos",
  steps: [
    {
      title: "Agrega un verso",
      body: "Toca «Agregar verso», escribe la cita (por ejemplo Juan 3:16) y elige la versión. El texto aparece solo: no tienes que copiarlo.",
    },
    {
      title: "Hazlo tuyo",
      body: "Elige un color y un ícono: son pistas visuales que ayudan a recordar. Si quieres, agrega una pista que solo verás cuando la pidas.",
    },
    {
      title: "Practica cada día",
      body: "En Inicio verás cuántos versos te tocan hoy. Recita el verso en voz alta, revela el texto y califica qué tan bien lo recordaste.",
    },
  ],
  gradesTitle: "Cómo calificarte",
  gradesIntro:
    "Después de revelar el verso, elige la opción que mejor te describa. Tu respuesta decide cuándo volverás a verlo.",
  grades: {
    again: { label: "Otra vez", body: "No lo recordaste. Vuelve al final de esta misma sesión." },
    hard: { label: "Difícil", body: "Lo recordaste con mucho esfuerzo. Volverá pronto." },
    good: { label: "Bien", body: "Lo recordaste. El próximo repaso se espacia más." },
    easy: { label: "Fácil", body: "Lo sabías de memoria. El próximo repaso se espacia aún más." },
  } as Record<Grade, { label: string; body: string }>,
  gradesTip: "Sé honesto contigo: calificarte bien es lo que hace que memorices más rápido.",
  modesTitle: "Formas de practicar",
  modesIntro: "Desde Practicar eliges el modo y qué versos usar: todos, una colección, un libro o los que tú escojas.",
  modes: [
    { mode: "classic", title: "Clásico", body: "Ves la cita, recitas el verso y lo revelas. El modo principal; también puedes escribirlo de memoria con «Escribirlo»." },
    { mode: "firstLetter", title: "Primera letra", body: "Ves solo la primera letra de cada palabra como apoyo. Ideal para versos que estás empezando a aprender." },
    { mode: "scramble", title: "Palabras revueltas", body: "Ordena las palabras del verso tocándolas en el orden correcto." },
    { mode: "match", title: "Empareja versos", body: "Une cada cita con su pista o con el inicio del verso." },
    { mode: "gap", title: "Completa el verso", body: "Elige la palabra que falta. Cuanto más practicas un verso, más palabras se ocultan." },
  ],
  modesTip: "Clásico y Primera letra hacen avanzar tu progreso; los juegos refuerzan y dan variedad.",
  libraryTitle: "Organiza tu biblioteca",
  library: [
    { title: "Colecciones", body: "Agrupa versos por tema, por ejemplo «Promesas» o «Fe». Un verso puede estar en varias." },
    { title: "Por libro, automático", body: "Cada verso aparece solo en su libro, en su Testamento y, si aplica, en Evangelios. No tienes que organizar nada." },
    { title: "Busca y ordena", body: "Encuentra cualquier verso por cita o por texto, y míralos en orden bíblico." },
  ],
  tipsTitle: "Consejos",
  tips: [
    "Recita en voz alta: pronunciar el verso ayuda a fijarlo.",
    "Practica un poco cada día para mantener tu racha encendida.",
    "Usa la pista solo cuando de verdad la necesites.",
    "Toca tu foto para cambiar el idioma o los sonidos.",
  ],
  ctaAdd: "Agregar un verso",
  ctaPractice: "Ir a practicar",
  // Home card
  cardTitle: "Cómo funciona",
  cardSteps: ["Agrega un verso por su cita", "Personalízalo con color e ícono", "Practica unos minutos al día"],
  cardCta: "Ver la guía",
  cardDismiss: "Entendido",
};

const en: typeof es = {
  title: "How it works",
  subtitle: "Memorize the Word, one card at a time.",
  heroTitle: "Your verses, on cards you review just in time",
  heroBody:
    "VersoRefuerzo turns each verse into a memory card. The app decides when to review it: right before you would forget it. A few minutes a day is enough.",
  stepsTitle: "In three steps",
  steps: [
    {
      title: "Add a verse",
      body: "Tap “Add verse”, type the citation (for example John 3:16) and pick a version. The text appears on its own: you never copy it.",
    },
    {
      title: "Make it yours",
      body: "Pick a color and an icon: they are visual cues that help you remember. Optionally add a hint you only see when you ask for it.",
    },
    {
      title: "Practice every day",
      body: "Home shows how many verses are due today. Recite the verse aloud, reveal the text and rate how well you remembered it.",
    },
  ],
  gradesTitle: "How to rate yourself",
  gradesIntro: "After revealing the verse, pick the option that fits best. Your answer decides when you will see it again.",
  grades: {
    again: { label: "Again", body: "You didn't remember it. It comes back at the end of this session." },
    hard: { label: "Hard", body: "You remembered it with a lot of effort. It returns soon." },
    good: { label: "Good", body: "You remembered it. The next review is spaced further out." },
    easy: { label: "Easy", body: "You knew it by heart. The next review is spaced even further." },
  },
  gradesTip: "Be honest with yourself: rating accurately is what makes you memorize faster.",
  modesTitle: "Ways to practice",
  modesIntro: "In Practice you pick a mode and which verses to use: all of them, a collection, a book or the ones you choose.",
  modes: [
    { mode: "classic", title: "Classic", body: "See the citation, recite the verse and reveal it. The main mode; you can also type it from memory with “Write it”." },
    { mode: "firstLetter", title: "First letter", body: "See only the first letter of each word as support. Great for verses you are just starting to learn." },
    { mode: "scramble", title: "Word scramble", body: "Put the verse's words back in order by tapping them." },
    { mode: "match", title: "Verse match", body: "Match each citation with its hint or the start of the verse." },
    { mode: "gap", title: "Fill the gap", body: "Pick the missing word. The more you practice a verse, the more words are hidden." },
  ],
  modesTip: "Classic and First letter move your progress forward; the games reinforce and add variety.",
  libraryTitle: "Organize your library",
  library: [
    { title: "Collections", body: "Group verses by theme, for example “Promises” or “Faith”. A verse can be in several." },
    { title: "By book, automatically", body: "Every verse shows up in its book, its Testament and, when it applies, the Gospels. Nothing to organize." },
    { title: "Search and sort", body: "Find any verse by citation or text, and view them in Bible order." },
  ],
  tipsTitle: "Tips",
  tips: [
    "Recite aloud: saying the verse helps it stick.",
    "Practice a little every day to keep your streak alive.",
    "Use the hint only when you really need it.",
    "Tap your photo to change the language or sounds.",
  ],
  ctaAdd: "Add a verse",
  ctaPractice: "Go practice",
  cardTitle: "How it works",
  cardSteps: ["Add a verse by its citation", "Personalize it with a color and icon", "Practice a few minutes a day"],
  cardCta: "See the guide",
  cardDismiss: "Got it",
};

export const GUIDE = { es, en };
