# Tema Shopify «Tienda»

Tema Online Store 2.0 hecho desde cero que reproduce el diseño y la estructura de la tienda original (portada con slideshow, NEW IN, pestañas de colecciones, logos de prensa, carrusel de colecciones y footer). Todo es editable desde **Tienda online → Temas → Personalizar**.

## Instalarlo en tu tienda

**Opción A: conectar GitHub (recomendada, así cada cambio se sincroniza)**
1. En Shopify: *Tienda online → Temas → Añadir tema → Conectar desde GitHub*.
2. Elige este repositorio y la rama que quieras usar.

**Opción B: subir un ZIP**
1. Descarga el repositorio como ZIP (o comprime las carpetas `assets`, `config`, `layout`, `locales`, `sections`, `snippets` y `templates`).
2. *Tienda online → Temas → Añadir tema → Subir archivo zip*.

**Opción C: Shopify CLI**
```bash
shopify theme dev --store tu-tienda.myshopify.com   # vista previa en local
shopify theme push                                   # subir a la tienda
```

## Configuración después de instalar

| Qué | Dónde |
|-----|-------|
| Logo (normal y blanco para la cabecera transparente) | Personalizar → Cabecera |
| Menú principal (`main-menu`), con «SHOP» y sus subcategorías como hijos | Contenido → Menús |
| Menús del footer: `footer` (INFO) y `politicas` (POLÍTICAS) | Contenido → Menús |
| Colecciones de la portada (`new-in`, `invitada-otono`, `vestidos`, `chaquetas`…) | Ya creadas en Nume Studio; puedes cambiarlas en el personalizador |
| Imágenes del slideshow, logos de prensa y del carrusel de colecciones | Personalizar → cada sección |
| Página de lista de deseos | Crea una página con handle `wishlist` y la plantilla `page.wishlist` |
| Página de contacto | Asigna la plantilla `page.contact` |
| Colores, tipografía, redondeo de botones, umbral de envío gratis | Personalizar → Configuración del tema |

### Cómo entra cada producto en su colección (ya configurado en Nume Studio)
Las colecciones son automáticas, no hay que añadir los productos a mano:
- **New in**: productos con el tag `new-in`.
- **Invitada otoño**: productos con el tag `invitada`.
- **Los más vendidos**: todos los productos, ordenados por ventas.
- **Categorías**: según el **tipo de producto**: `Vestidos`, `Conjuntos`, `Pantalones`, `Blazers`, `Tops`, `Blusas`, `Faldas`, `Chaquetas`, `Accesorios`, `Jerséis`, `Cárdigans` o `Chalecos`.

### Etiquetas de los productos
- **Pre-order**: añade el tag `pre-order` al producto (o el metacampo booleano `custom.preorder`). Muestra la etiqueta y cambia el botón a «Pre-order».
- **Etiqueta personalizada** («Más vendidos», etc.): añade un tag `badge:Más vendidos`.
- **Agotado / Oferta**: automáticas según el stock y el precio de comparación.

### Otros colores del mismo producto
Si cada color es un producto distinto (p. ej. «Amour Jacket in Brown» y «Amour Jacket in Red»), crea un metacampo de producto `custom.siblings` del tipo *lista de productos* y enlaza los colores. Se mostrarán como miniaturas redondas bajo el precio. Si usas una opción «Color» en las variantes, también se muestra.

### Compra rápida
Si el producto solo tiene la opción de talla (`Talla`, `Size`, `Tamanho`…), al pasar el ratón por la tarjeta aparecen las tallas y se añade al carrito con un clic.

## Lo que hacían apps externas en la web original
La tienda original usaba apps que no forman parte del tema y que habría que reinstalar si las quieres:
- **Selector de país/geolocalización** (Orbe): el tema incluye un selector de país propio, que funciona con *Shopify Markets*.
- **Lista de deseos** (sb-wishlist): el tema incluye una propia, guardada en el navegador.
- **Banner de cookies**: lo pone Shopify (*Configuración → Privacidad del cliente*).
- Bundles, avisos «Avísame cuando se lance» y traducción: apps de la Shopify App Store.

## Estructura

```
layout/      theme.liquid, password.liquid
sections/    una sección por bloque de página + grupos de cabecera/footer
snippets/    tarjeta de producto, precio, iconos, variables CSS…
templates/   plantillas JSON (portada, producto, colección, cuenta…)
assets/      theme.css y theme.js (sin dependencias externas)
locales/     es.default.json (español) y en.json (inglés)
```
