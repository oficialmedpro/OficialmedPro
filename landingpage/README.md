# Landing Page VOY - Réplica Visual

Este é um projeto de landing page que replica visualmente o layout do site https://www.voysaude.com.br/

## 📁 Estrutura

```
landingpage/
├── index.html      # Estrutura HTML principal
├── styles.css      # Estilos CSS
├── script.js       # JavaScript para interatividade
└── README.md       # Este arquivo
```

## 🚀 Como usar

1. Abra o arquivo `index.html` diretamente no navegador
2. Ou use um servidor local (recomendado):
   ```bash
   # Com Python
   python -m http.server 8000
   
   # Com Node.js (http-server)
   npx http-server
   
   # Com PHP
   php -S localhost:8000
   ```

3. Acesse: `http://localhost:8000`

## 🎨 Customização

As cores principais estão definidas no arquivo `styles.css` através de variáveis CSS:

```css
:root {
    --color-primary: #4A148C;    /* Roxo escuro */
    --color-secondary: #FF6B35;  /* Laranja */
    --color-accent: #F8F5F0;     /* Bege claro */
    /* ... */
}
```

Você pode alterar essas variáveis para customizar as cores conforme necessário.

## ✨ Funcionalidades

- ✅ Layout responsivo
- ✅ Menu de navegação
- ✅ Accordion (FAQ e Informações)
- ✅ Calculadora de resultados
- ✅ Carrossel de depoimentos
- ✅ Animações ao scroll
- ✅ Widget de chat
- ✅ Scroll suave

## 📝 Notas

Esta é uma réplica visual para fins de estudo e customização. As cores e textos podem ser facilmente alterados para se adequar ao seu projeto.




