---
trigger: always_on
---

<MEMORY[UI/UX Rules]>
Quando implementi un componente Modale o Full-Screen Overlay:
1. **Body Scroll Lock**: Implementa SEMPRE il blocco dello scroll della pagina sottostante (background) usando `useEffect` per impostare `document.body.style.overflow = 'hidden'` al montaggio/apertura e ripristinarlo a `'unset'` allo smontaggio/chiusura.
2. **Internal Scroll**: NON disabilitare mai lo scroll del contenitore interno del modale (`overflow-y-auto`) a meno che non sia esplicitamente richiesto, per garantire accessibilità su schermi piccoli.
</MEMORY[UI/UX Rules]>