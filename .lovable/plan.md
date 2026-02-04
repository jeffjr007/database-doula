
# Plano: Otimização de Performance de Animações no Mobile

## Problema Identificado

A plataforma está com "jank" (baixo FPS) no mobile devido ao uso extensivo de **framer-motion** com animações baseadas em JavaScript. Encontrei **36 arquivos** usando framer-motion, incluindo componentes críticos como formulários e modais.

### Causas Principais do Jank:

1. **Spring animations pesadas** - WelcomeMentorModal e Stage3WelcomeModal usam `type: "spring"` com cálculos físicos complexos
2. **AnimatePresence em transições de step** - CVForm, ATSCVForm, CoverLetterForm usam AnimatePresence com motion.div para transições
3. **backdrop-blur remanescente** - LogoutModal ainda usa `backdrop-blur-xl` (muito pesado no mobile)
4. **Múltiplos AnimatePresence aninhados** - Modais de conversação têm 3-4 AnimatePresence aninhados
5. **Animações em elementos de lista** - Stage cards e formulários animam cada item individualmente

## Solução: CSS-First para Mobile

A estratégia é **manter framer-motion no desktop** (onde a performance é boa) e **usar CSS puro no mobile** (que é acelerado por hardware).

---

## Tarefas de Implementação

### 1. Criar Hook de Detecção Mobile Otimizado
Criar um hook `usePrefersReducedMotion` que detecta:
- Se é mobile (via `useIsMobile`)
- Se o usuário prefere movimento reduzido
- Exportar flag `shouldReduceMotion` para uso nos componentes

### 2. Otimizar LogoutModal (backdrop-blur)
**Arquivo:** `src/components/LogoutModal.tsx`

Remover `backdrop-blur-xl` no mobile e substituir por opacidade sólida:
```tsx
// De:
className="bg-background/80 backdrop-blur-xl"
// Para:
className="bg-background/95 lg:bg-background/80 lg:backdrop-blur-xl"
```

### 3. Criar Componente MobileMotion
Criar um wrapper que renderiza framer-motion no desktop e CSS no mobile:
```tsx
// Uso:
<MobileMotion
  animation="slide-up"
  delay={100}
  className="..."
>
  {children}
</MobileMotion>
```

No mobile, renderiza um `div` com classes CSS. No desktop, renderiza `motion.div`.

### 4. Otimizar Formulários (CVForm, ATSCVForm, CoverLetterForm)
**Arquivos:**
- `src/components/CVForm.tsx`
- `src/components/ATSCVForm.tsx`
- `src/components/CoverLetterForm.tsx`

Substituir AnimatePresence por CSS transitions no mobile:
```tsx
// De:
<AnimatePresence mode="wait">
  {mobileStep === 1 && (
    <motion.div initial={{...}} animate={{...}} exit={{...}}>
// Para:
<div className={`transition-all duration-200 ${mobileStep === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'}`}>
```

### 5. Otimizar Modais de Conversação
**Arquivos:**
- `src/components/WelcomeMentorModal.tsx`
- `src/components/Stage3WelcomeModal.tsx`

Remover spring physics e usar CSS easing:
```tsx
// De:
transition={{ type: "spring", damping: 25, stiffness: 300 }}
// Para (mobile):
className="animate-slide-up"
// Ou manter framer-motion com easing simples:
transition={{ duration: 0.2, ease: "easeOut" }}
```

### 6. Adicionar will-change para Elementos Animados
Criar classe utilitária para promover elementos à GPU:
```css
.gpu-accelerated {
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### 7. Otimizar InterviewScriptBuilder e Stage4Guide
**Arquivos:**
- `src/components/InterviewScriptBuilder.tsx`
- `src/components/Stage4Guide.tsx`

Simplificar animações de mensagens de conversa no mobile.

### 8. Otimizar CollapsibleSection no ATSCVForm
**Arquivo:** `src/components/ATSCVForm.tsx`

O CollapsibleSection usa AnimatePresence com motion.div para altura animada. Substituir por CSS `max-height` transition no mobile.

### 9. Criar CSS Animations Otimizadas
Adicionar ao `index.css` animações específicas para mobile:
```css
@media (max-width: 768px) {
  .animate-slide-left-in {
    animation: slideLeftIn 0.2s ease-out forwards;
  }
  .animate-slide-right-in {
    animation: slideRightIn 0.2s ease-out forwards;
  }
}

@keyframes slideLeftIn {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}
```

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/usePrefersReducedMotion.ts` | Criar novo hook |
| `src/components/ui/MobileMotion.tsx` | Criar wrapper component |
| `src/components/LogoutModal.tsx` | Remover backdrop-blur mobile |
| `src/components/WelcomeMentorModal.tsx` | CSS animations mobile |
| `src/components/Stage3WelcomeModal.tsx` | CSS animations mobile |
| `src/components/CVForm.tsx` | CSS step transitions |
| `src/components/ATSCVForm.tsx` | CSS step/collapsible transitions |
| `src/components/CoverLetterForm.tsx` | CSS step transitions |
| `src/components/InterviewScriptBuilder.tsx` | CSS conversation animations |
| `src/components/Stage4Guide.tsx` | CSS animations |
| `src/components/SettingsPage.tsx` | CSS section transitions |
| `src/index.css` | Novas CSS animations mobile |

---

## Benefícios Esperados

1. **60 FPS estável no mobile** - CSS animations são aceleradas por hardware
2. **Menor uso de memória** - Sem cálculos JavaScript de physics
3. **Mesma experiência visual** - Animações fluidas mantidas
4. **Desktop não afetado** - Framer-motion permanece onde funciona bem
5. **Código mais simples** - CSS é mais fácil de manter

## Notas Técnicas

- CSS `transform` e `opacity` são as únicas propriedades que não causam reflow
- `will-change` deve ser usado com moderação (apenas em elementos que realmente animam)
- `transition-duration: 0.2s` é o sweet spot para mobile (rápido mas perceptível)
- Evitar animações em scroll containers no mobile
