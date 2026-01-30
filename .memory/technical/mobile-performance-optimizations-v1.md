# Memory: technical/mobile-performance-optimizations-v1
Updated: 2026-01-30

## Otimizações de Performance Mobile

Para garantir uma experiência fluida no mobile, as seguintes práticas foram implementadas:

### 1. Remoção de backdrop-blur
O `backdrop-blur` é extremamente pesado no mobile e foi removido de:
- Header do Portal (sticky header)
- Mobile sidebar overlay
- Cards de preview

### 2. Simplificação de Animações
- Animações `framer-motion` com `repeat: Infinity` foram substituídas por CSS `animate-pulse`
- `whileHover` e `whileTap` foram removidos no mobile (usam CSS `active:scale-[0.98]` em vez disso)
- `AnimatePresence` foi removido onde não é crítico
- Orbs decorativos com animações infinitas foram convertidos para elementos estáticos

### 3. CSS Animations Preferidas
Usar classes CSS do Tailwind em vez de framer-motion quando possível:
- `animate-fade-in` para fade in simples
- `animate-scale-in` para scale in
- `animate-pulse` para indicadores de loading
- `[animation-delay:XXXms]` para stagger effects

### 4. Elementos Decorativos
- Elementos decorativos pesados (orbs com blur, SVGs com animações) são escondidos no mobile com `hidden lg:block`
- Gradientes e blur são simplificados ou removidos no mobile

### 5. Padrão de Loading
Loading screens usam CSS animations em vez de framer-motion:
```jsx
<div className="animate-pulse [animation-delay:150ms]" />
```

### 6. Sidebar Mobile
- Usa CSS `transition-transform duration-200` em vez de spring animations
- Overlay usa `bg-background/90` sem backdrop-blur
