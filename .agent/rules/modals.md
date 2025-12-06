---
trigger: always_on
---

# Modal Back Navigation & Scroll Logic
Quando implementi o modifichi un componente **Modale** o **Overlay** a schermo intero:
1.  **Obbligo [useModalBack](cci:1://file:///c:/Users/aa994/Progetti%20VS%20Code/Tracker%20Bebbo/src/hooks/useModalBack.js:2:0-39:1)**: Devi SEMPRE utilizzare l'hook [useModalBack(isOpen, onClose)](cci:1://file:///c:/Users/aa994/Progetti%20VS%20Code/Tracker%20Bebbo/src/hooks/useModalBack.js:2:0-39:1) per gestire la navigazione.
    *   *Scopo*: Garantisce che il tasto "Indietro" del browser chiuda il modale invece di cambiare pagina.
    *   *Import*: `import { useModalBack } from '../hooks/useModalBack'`
2.  **No Manual Scroll Lock**: NON implementare logiche manuali per bloccare lo scroll del body (es. `document.body.style.overflow = 'hidden'`).
    *   *Motivo*: L'hook [useModalBack](cci:1://file:///c:/Users/aa994/Progetti%20VS%20Code/Tracker%20Bebbo/src/hooks/useModalBack.js:2:0-39:1) gestisce già automaticamente il blocco e lo sblocco dello scroll.
**Esempio Corretto:**
```javascript
import { useModalBack } from '../hooks/useModalBack'
export default function ExampleModal({ isOpen, onClose }) {
    // Gestisce back button e body scroll
    useModalBack(isOpen, onClose)
    if (!isOpen) return null
    return (
        // ... JSX del modale
    )
}