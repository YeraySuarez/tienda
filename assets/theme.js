/* ==========================================================================
   Tema tienda — JavaScript (sin dependencias)
   ========================================================================== */

(function () {
  'use strict';

  var routes = window.theme && window.theme.routes ? window.theme.routes : {
    root: '/',
    cart: '/cart',
    cartAdd: '/cart/add',
    cartChange: '/cart/change',
    predictiveSearch: '/search/suggest'
  };
  var strings = (window.theme && window.theme.strings) || {};

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function toast(message) {
    var el = qs('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('is-visible'); }, 2600);
  }

  /* ------------------------------------------------------------------------
     Drawers (menú móvil, carrito)
     ------------------------------------------------------------------------ */

  var openDrawerEl = null;
  var lastFocus = null;

  function openDrawer(drawer) {
    if (!drawer) return;
    if (openDrawerEl && openDrawerEl !== drawer) closeDrawer(openDrawerEl);
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    openDrawerEl = drawer;
    var focusable = qs('button, a, input', drawer);
    if (focusable) setTimeout(function () { focusable.focus(); }, 50);
  }

  function closeDrawer(drawer) {
    drawer = drawer || openDrawerEl;
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    openDrawerEl = null;
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-drawer-open]');
    if (opener) {
      var target = document.getElementById(opener.getAttribute('data-drawer-open'));
      if (target) {
        e.preventDefault();
        openDrawer(target);
      }
      return;
    }
    if (e.target.closest('[data-drawer-close]')) {
      e.preventDefault();
      closeDrawer(e.target.closest('.drawer'));
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (openDrawerEl) closeDrawer();
      qsa('.search-popdown.is-open').forEach(function (p) { closeSearch(p); });
    }
  });

  /* ------------------------------------------------------------------------
     Cabecera: sticky / transparente / hover
     ------------------------------------------------------------------------ */

  function initHeader() {
    var wrapper = qs('[data-header-wrapper]');
    if (!wrapper) return;

    function setHeights() {
      var header = qs('.site-header', wrapper);
      if (header) {
        document.documentElement.style.setProperty('--header-real-height', header.offsetHeight + 'px');
      }
    }
    setHeights();
    window.addEventListener('resize', debounce(setHeights, 150));

    function onScroll() {
      wrapper.classList.toggle('is-scrolled', window.scrollY > 10);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    wrapper.addEventListener('mouseenter', function () { wrapper.classList.add('is-hovered'); });
    wrapper.addEventListener('mouseleave', function () { wrapper.classList.remove('is-hovered'); });

    qsa('[data-search-toggle]', wrapper).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var popdown = qs('.search-popdown', wrapper);
        if (!popdown) return;
        if (popdown.classList.contains('is-open')) {
          closeSearch(popdown);
        } else {
          popdown.classList.add('is-open');
          wrapper.classList.add('has-open-dropdown');
          var input = qs('input[type="search"]', popdown);
          if (input) setTimeout(function () { input.focus(); }, 50);
        }
      });
    });

    qsa('[data-search-close]', wrapper).forEach(function (btn) {
      btn.addEventListener('click', function () { closeSearch(qs('.search-popdown', wrapper)); });
    });

    document.addEventListener('click', function (e) {
      var popdown = qs('.search-popdown.is-open', wrapper);
      if (popdown && !e.target.closest('.search-popdown') && !e.target.closest('[data-search-toggle]')) {
        closeSearch(popdown);
      }
    });

    qsa('.header__localization select').forEach(function (select) {
      select.addEventListener('change', function () { select.form.submit(); });
    });
  }

  function closeSearch(popdown) {
    if (!popdown) return;
    popdown.classList.remove('is-open');
    var wrapper = popdown.closest('[data-header-wrapper]');
    if (wrapper) wrapper.classList.remove('has-open-dropdown');
  }

  /* ------------------------------------------------------------------------
     Búsqueda predictiva
     ------------------------------------------------------------------------ */

  function initPredictiveSearch() {
    qsa('[data-predictive-search]').forEach(function (form) {
      var input = qs('input[type="search"]', form);
      var results = qs('[data-predictive-results]', form.parentNode);
      var popular = qs('[data-popular-searches]', form.parentNode);
      if (!input || !results) return;

      var run = debounce(function () {
        var term = input.value.trim();
        if (term.length < 2) {
          results.innerHTML = '';
          if (popular) popular.hidden = false;
          return;
        }
        var url = routes.predictiveSearch + '?q=' + encodeURIComponent(term) +
          '&resources[type]=product&resources[limit]=4&section_id=predictive-search';
        fetch(url)
          .then(function (r) { return r.text(); })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var content = qs('#shopify-section-predictive-search', doc);
            results.innerHTML = content ? content.innerHTML : '';
            if (popular) popular.hidden = true;
          })
          .catch(function () {});
      }, 300);

      input.addEventListener('input', run);
    });
  }

  /* ------------------------------------------------------------------------
     Barra de anuncios (modo slider)
     ------------------------------------------------------------------------ */

  function initAnnouncement() {
    qsa('[data-announcement-slider]').forEach(function (bar) {
      var slides = qsa('.announcement__slide', bar);
      if (slides.length < 2) return;
      var index = 0;
      var speed = parseInt(bar.getAttribute('data-speed'), 10) || 5000;
      setInterval(function () {
        slides[index].classList.remove('is-active');
        index = (index + 1) % slides.length;
        slides[index].classList.add('is-active');
      }, speed);
    });
  }

  /* ------------------------------------------------------------------------
     Slideshow
     ------------------------------------------------------------------------ */

  function initSlideshow(root) {
    qsa('[data-slideshow]', root).forEach(function (el) {
      if (el._init) return;
      el._init = true;
      var slides = qsa('.slideshow__slide', el);
      var dots = qsa('.slideshow__dot', el);
      if (!slides.length) return;
      var current = 0;
      var autoplay = el.getAttribute('data-autoplay') === 'true';
      var speed = parseInt(el.getAttribute('data-speed'), 10) || 6000;
      var timer;

      function go(n) {
        var next = (n + slides.length) % slides.length;
        if (next === current) return;
        slides.forEach(function (s) { s.classList.remove('is-prev'); });
        slides[current].classList.remove('is-active');
        slides[current].classList.add('is-prev');
        slides[current].setAttribute('aria-hidden', 'true');
        current = next;
        slides[current].classList.add('is-active');
        slides[current].setAttribute('aria-hidden', 'false');
        dots.forEach(function (d, i) {
          d.classList.toggle('is-active', i === current);
          d.setAttribute('aria-current', i === current ? 'true' : 'false');
        });
      }

      function start() {
        if (!autoplay || slides.length < 2) return;
        stop();
        timer = setInterval(function () { go(current + 1); }, speed);
      }
      function stop() { clearInterval(timer); }

      var prev = qs('.slideshow__arrow--prev', el);
      var next = qs('.slideshow__arrow--next', el);
      if (prev) prev.addEventListener('click', function () { go(current - 1); start(); });
      if (next) next.addEventListener('click', function () { go(current + 1); start(); });
      dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); start(); }); });

      // Swipe táctil
      var startX = null;
      el.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
      el.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) { go(dx < 0 ? current + 1 : current - 1); start(); }
        startX = null;
      });

      el.addEventListener('mouseenter', stop);
      el.addEventListener('mouseleave', start);

      // Editor de temas: ir al bloque seleccionado
      el.addEventListener('shopify:block:select', function (e) {
        var idx = slides.indexOf(e.target);
        if (idx > -1) { stop(); go(idx); }
      });

      start();
    });
  }

  /* ------------------------------------------------------------------------
     Sliders de productos (scroll-snap + flechas)
     ------------------------------------------------------------------------ */

  function initProductSliders(root) {
    qsa('[data-product-slider]', root).forEach(function (slider) {
      if (slider._init) return;
      slider._init = true;
      var track = qs('.product-slider__track', slider);
      var prev = qs('.product-slider__arrow--prev', slider);
      var next = qs('.product-slider__arrow--next', slider);
      if (!track) return;

      function step() {
        var item = track.firstElementChild;
        if (!item) return track.clientWidth;
        var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return item.getBoundingClientRect().width + gap;
      }

      function update() {
        if (!prev || !next) return;
        prev.disabled = track.scrollLeft <= 5;
        next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
        var media = qs('.product-card__media', track);
        if (media) slider.style.setProperty('--arrow-top', (media.offsetHeight / 2) + 'px');
      }

      if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
      if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
      track.addEventListener('scroll', debounce(update, 60), { passive: true });
      window.addEventListener('resize', debounce(update, 150));
      update();
    });
  }

  /* ------------------------------------------------------------------------
     Pestañas de colecciones
     ------------------------------------------------------------------------ */

  function initTabs(root) {
    qsa('[data-tabs]', root).forEach(function (tabs) {
      if (tabs._init) return;
      tabs._init = true;
      var buttons = qsa('.tabs-collections__tab', tabs);
      var panels = qsa('.tabs-collections__panel', tabs);

      function select(i) {
        buttons.forEach(function (b, j) {
          b.classList.toggle('is-active', i === j);
          b.setAttribute('aria-selected', i === j ? 'true' : 'false');
        });
        panels.forEach(function (p, j) { p.classList.toggle('is-active', i === j); });
        initProductSliders(panels[i]);
      }

      buttons.forEach(function (b, i) { b.addEventListener('click', function () { select(i); }); });
      tabs.addEventListener('shopify:block:select', function (e) {
        var idx = panels.indexOf(e.target);
        if (idx > -1) select(idx);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Logos de prensa con citas rotativas
     ------------------------------------------------------------------------ */

  function initLogos(root) {
    qsa('[data-logos]', root).forEach(function (el) {
      if (el._init) return;
      el._init = true;
      var logos = qsa('.logos__item', el);
      var quotes = qsa('.logos__quote', el);
      if (!logos.length) return;
      var current = 0;
      var speed = parseInt(el.getAttribute('data-speed'), 10) || 4000;
      var timer;

      function go(i) {
        current = (i + logos.length) % logos.length;
        logos.forEach(function (l, j) { l.classList.toggle('is-active', j === current); });
        quotes.forEach(function (q, j) { q.classList.toggle('is-active', j === current); });
      }
      function start() {
        clearInterval(timer);
        if (logos.length > 1) timer = setInterval(function () { go(current + 1); }, speed);
      }

      logos.forEach(function (l, i) {
        l.addEventListener('click', function () { go(i); start(); });
      });
      el.addEventListener('shopify:block:select', function (e) {
        var idx = logos.indexOf(e.target);
        if (idx > -1) { clearInterval(timer); go(idx); }
      });
      go(0);
      start();
    });
  }

  /* ------------------------------------------------------------------------
     Carrusel de colecciones
     ------------------------------------------------------------------------ */

  function initCollectionCarousel(root) {
    qsa('[data-collection-carousel]', root).forEach(function (el) {
      if (el._init) return;
      el._init = true;
      var wrapper = qs('.carousel-wrapper', el);
      var slides = qsa('.carousel-slide', el);
      var prev = qs('.carousel-nav-prev', el);
      var next = qs('.carousel-nav-next', el);
      var pagination = qs('.carousel-pagination', el);
      var loop = el.getAttribute('data-loop') === 'true';
      var autoplay = parseInt(el.getAttribute('data-autoplay'), 10) || 0;
      var index = 0;
      var timer;

      function perView() {
        var v = getComputedStyle(el).getPropertyValue(window.innerWidth >= 750 ? '--per-view' : '--per-view-mobile');
        return Math.max(1, parseInt(v, 10) || 1);
      }
      function maxIndex() { return Math.max(0, slides.length - perView()); }

      function renderDots() {
        if (!pagination) return;
        pagination.innerHTML = '';
        for (var i = 0; i <= maxIndex(); i++) {
          var b = document.createElement('button');
          b.className = 'carousel-dot' + (i === index ? ' is-active' : '');
          b.setAttribute('aria-label', (strings.slide || 'Diapositiva') + ' ' + (i + 1));
          (function (n) { b.addEventListener('click', function () { go(n); restart(); }); })(i);
          pagination.appendChild(b);
        }
      }

      function go(i) {
        var max = maxIndex();
        if (loop) {
          if (i > max) i = 0;
          if (i < 0) i = max;
        } else {
          i = Math.min(Math.max(i, 0), max);
        }
        index = i;
        var slideW = slides[0] ? slides[0].getBoundingClientRect().width : 0;
        var gap = parseFloat(getComputedStyle(el).getPropertyValue('--slide-gap')) || 0;
        wrapper.style.transform = 'translateX(' + (-(slideW + gap) * index) + 'px)';
        if (prev) prev.disabled = !loop && index === 0;
        if (next) next.disabled = !loop && index >= max;
        qsa('.carousel-dot', el).forEach(function (d, j) { d.classList.toggle('is-active', j === index); });
      }

      function restart() {
        clearInterval(timer);
        if (autoplay > 0) timer = setInterval(function () { go(index + 1 > maxIndex() ? 0 : index + 1); }, autoplay * 1000);
      }

      if (prev) prev.addEventListener('click', function () { go(index - 1); restart(); });
      if (next) next.addEventListener('click', function () { go(index + 1); restart(); });

      var startX = null;
      wrapper.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
      wrapper.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 40) { go(dx < 0 ? index + 1 : index - 1); restart(); }
        startX = null;
      });

      window.addEventListener('resize', debounce(function () { renderDots(); go(index); }, 150));
      renderDots();
      go(0);
      restart();
    });
  }

  /* ------------------------------------------------------------------------
     Carrito (API AJAX + Section Rendering)
     ------------------------------------------------------------------------ */

  var cartDrawerId = 'cart-drawer';

  function updateCartCount(count) {
    qsa('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.setAttribute('data-count', count);
    });
  }

  function renderCartSections(sections) {
    if (!sections) return;
    if (sections[cartDrawerId]) {
      var doc = new DOMParser().parseFromString(sections[cartDrawerId], 'text/html');
      var fresh = qs('[data-cart-drawer-content]', doc);
      var current = qs('[data-cart-drawer-content]');
      if (fresh && current) current.innerHTML = fresh.innerHTML;
    }
    if (sections['main-cart'] && qs('[data-main-cart]')) {
      var doc2 = new DOMParser().parseFromString(sections['main-cart'], 'text/html');
      var fresh2 = qs('[data-main-cart]', doc2);
      if (fresh2) qs('[data-main-cart]').innerHTML = fresh2.innerHTML;
    }
  }

  function sectionsToRender() {
    var list = [cartDrawerId];
    if (qs('[data-main-cart]')) list.push('main-cart');
    return list;
  }

  function refreshCart() {
    var ids = sectionsToRender();
    return fetch(routes.root + '?sections=' + ids.join(','))
      .then(function (r) { return r.json(); })
      .then(function (sections) {
        renderCartSections(sections);
        return fetch(routes.cart + '.js');
      })
      .then(function (r) { return r.json(); })
      .then(function (cart) { updateCartCount(cart.item_count); return cart; });
  }

  function addToCart(formData, button) {
    if (button) button.classList.add('is-loading');
    formData.append('sections', sectionsToRender().join(','));
    formData.append('sections_url', window.location.pathname);

    return fetch(routes.cartAdd + '.js', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
      body: formData
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.status && res.status !== 200) {
          throw new Error(res.description || res.message || strings.cartError);
        }
        renderCartSections(res.sections);
        return fetch(routes.cart + '.js').then(function (r) { return r.json(); });
      })
      .then(function (cart) {
        updateCartCount(cart.item_count);
        var drawer = document.getElementById(cartDrawerId);
        if (drawer && window.theme.settings.cartType === 'drawer') {
          openDrawer(drawer);
        } else if (window.theme.settings.cartType === 'page') {
          window.location.href = routes.cart;
        } else {
          toast(strings.addedToCart || 'Añadido al carrito');
        }
      })
      .catch(function (err) {
        toast(err.message || strings.cartError || 'Error');
        throw err;
      })
      .finally(function () {
        if (button) button.classList.remove('is-loading');
      });
  }

  function changeLine(line, quantity) {
    var drawer = document.getElementById(cartDrawerId);
    if (drawer) drawer.classList.add('is-loading');
    return fetch(routes.cartChange + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: line, quantity: quantity, sections: sectionsToRender(), sections_url: window.location.pathname })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.status && res.status !== 200) throw new Error(res.description || res.message);
        renderCartSections(res.sections);
        updateCartCount(res.item_count);
      })
      .catch(function (err) { toast(err.message || strings.cartError); })
      .finally(function () { if (drawer) drawer.classList.remove('is-loading'); });
  }

  // Formularios de producto (página de producto y quick add)
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-product-form]');
    if (!form) return;
    if (window.theme.settings.cartType === 'page' && !form.hasAttribute('data-quick-add')) return;
    e.preventDefault();
    var button = qs('[type="submit"]', form);
    var errorBox = qs('[data-product-error]', form.closest('[data-product]') || form);
    if (errorBox) errorBox.textContent = '';
    var idField = qs('input[name="id"]', form);
    if (idField && !idField.value) {
      var emptySelect = qs('[data-option-select]', form.closest('[data-product]') || document);
      if (errorBox) errorBox.textContent = strings.selectSize || '';
      if (emptySelect) emptySelect.focus();
      return;
    }
    addToCart(new FormData(form), button).catch(function (err) {
      if (errorBox) errorBox.textContent = err.message;
    });
  });

  // Quick add de talla en las tarjetas
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-quick-add-open]');
    if (opener) {
      e.preventDefault();
      var box = opener.closest('[data-quick-add]');
      var sizes = qs('.quick-add__sizes', box);
      opener.hidden = true;
      sizes.hidden = false;
      box.classList.add('is-open');
      return;
    }

    var size = e.target.closest('[data-quick-add-variant]');
    if (size) {
      e.preventDefault();
      var fd = new FormData();
      fd.append('id', size.getAttribute('data-quick-add-variant'));
      fd.append('quantity', '1');
      addToCart(fd, size).catch(function () {});
      return;
    }

    var qtyBtn = e.target.closest('[data-qty-change]');
    if (qtyBtn) {
      e.preventDefault();
      var wrap = qtyBtn.closest('[data-line]');
      var input = qs('input', wrap);
      var value = Math.max(0, parseInt(input.value, 10) + parseInt(qtyBtn.getAttribute('data-qty-change'), 10));
      input.value = value;
      changeLine(parseInt(wrap.getAttribute('data-line'), 10), value);
      return;
    }

    var remove = e.target.closest('[data-line-remove]');
    if (remove) {
      e.preventDefault();
      changeLine(parseInt(remove.getAttribute('data-line-remove'), 10), 0);
    }
  });

  document.addEventListener('change', function (e) {
    var input = e.target.closest('[data-line] input');
    if (!input) return;
    var wrap = input.closest('[data-line]');
    changeLine(parseInt(wrap.getAttribute('data-line'), 10), Math.max(0, parseInt(input.value, 10) || 0));
  });

  // Abrir el carrito lateral desde el icono
  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-cart-toggle]');
    if (!link || window.theme.settings.cartType !== 'drawer') return;
    var drawer = document.getElementById(cartDrawerId);
    if (!drawer) return;
    e.preventDefault();
    openDrawer(drawer);
  });

  // Cerrar el selector de tallas al salir de la tarjeta
  document.addEventListener('mouseout', function (e) {
    var card = e.target.closest && e.target.closest('.product-card');
    if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
    var box = qs('[data-quick-add].is-open', card);
    if (!box) return;
    box.classList.remove('is-open');
    var opener = qs('[data-quick-add-open]', box);
    if (opener) opener.hidden = false;
    var sizes = qs('.quick-add__sizes', box);
    if (sizes) sizes.hidden = true;
  });

  /* ------------------------------------------------------------------------
     Página de producto: selector de variantes
     ------------------------------------------------------------------------ */

  function formatMoney(cents) {
    var format = (window.theme && window.theme.moneyFormat) || '€{{amount_with_comma_separator}}';
    var value = (cents / 100).toFixed(2);
    var parts = value.split('.');
    var withDots = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    var withCommas = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, key) {
      switch (key) {
        case 'amount': return withCommas + '.' + parts[1];
        case 'amount_no_decimals': return withCommas;
        case 'amount_with_comma_separator': return withDots + ',' + parts[1];
        case 'amount_no_decimals_with_comma_separator': return withDots;
        case 'amount_with_apostrophe_separator': return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'") + '.' + parts[1];
        default: return withDots + ',' + parts[1];
      }
    });
  }

  function initProduct(root) {
    qsa('[data-product]', root).forEach(function (product) {
      if (product._init) return;
      product._init = true;
      var json = qs('[data-product-json]', product);
      if (!json) return;
      var data = JSON.parse(json.textContent);
      var form = qs('form[data-product-form]', product);
      var idInput = form ? qs('input[name="id"]', form) : null;
      var picker = qs('[data-variant-picker]', product);
      var priceEl = qs('[data-product-price]', product);
      var button = form ? qs('[type="submit"]', form) : null;
      var buttonText = button ? qs('span', button) : null;
      var inventoryEl = qs('[data-inventory]', product);
      var mediaList = qs('.product__media-list', product);

      function selectedOptions() {
        return qsa('[data-option-index]', picker).map(function (el) {
          var select = qs('select', el);
          if (select) return select.value || null;
          var checked = qs('input:checked', el);
          return checked ? checked.value : null;
        });
      }

      function findVariant(options) {
        return data.variants.find(function (v) {
          return v.options.every(function (o, i) { return o === options[i]; });
        });
      }

      function updateAvailability(options) {
        qsa('[data-option-index]', picker).forEach(function (fs, index) {
          qsa('input', fs).forEach(function (input) {
            var test = options.slice();
            test[index] = input.value;
            var match = data.variants.find(function (v) {
              return v.options.every(function (o, i) { return o === test[i]; });
            });
            input.classList.toggle('is-unavailable', !match || !match.available);
          });
        });
      }

      function update() {
        var options = selectedOptions();
        var variant = findVariant(options);
        updateAvailability(options);

        qsa('[data-option-value]', picker).forEach(function (el) {
          var i = parseInt(el.getAttribute('data-option-value'), 10);
          el.textContent = options[i] || '';
        });

        var incomplete = options.some(function (o) { return o === null; });
        if (!variant) {
          if (idInput) idInput.value = '';
          if (button) button.disabled = !incomplete;
          if (buttonText && !incomplete) buttonText.textContent = strings.unavailable;
          return;
        }

        if (idInput) idInput.value = variant.id;
        var errorBox = qs('[data-product-error]', product);
        if (errorBox) errorBox.textContent = '';

        if (priceEl) {
          var html = '';
          if (variant.compare_at_price && variant.compare_at_price > variant.price) {
            html = '<span class="price__sale">' + formatMoney(variant.price) + '</span>' +
              '<s class="price__compare">' + formatMoney(variant.compare_at_price) + '</s>';
          } else {
            html = '<span>' + formatMoney(variant.price) + '</span>';
          }
          priceEl.innerHTML = '<span class="price">' + html + '</span>';
        }

        if (button) {
          var preorder = product.getAttribute('data-preorder') === 'true';
          button.disabled = !variant.available;
          if (buttonText) {
            var label = !variant.available ? strings.soldOut : (preorder ? strings.preorder : strings.addToCart);
            if (button.getAttribute('data-price-in-button') === 'true') label += ' • ' + formatMoney(variant.price);
            buttonText.textContent = label;
          }
        }

        if (inventoryEl) {
          var v = (window.productInventory && window.productInventory[variant.id]) || null;
          inventoryEl.hidden = !v;
          if (v) {
            inventoryEl.className = 'product__inventory product__inventory--' + v.state;
            inventoryEl.textContent = v.text;
          }
        }

        if (variant.featured_media && mediaList) {
          var target = qs('[data-media-id="' + variant.featured_media.id + '"]', mediaList);
          if (target) {
            if (window.innerWidth < 990) {
              mediaList.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
            } else if (target !== mediaList.firstElementChild) {
              mediaList.insertBefore(target, mediaList.firstElementChild);
            }
          }
        }

        if (product.hasAttribute('data-update-url')) {
          var url = new URL(window.location.href);
          url.searchParams.set('variant', variant.id);
          window.history.replaceState({}, '', url.toString());
        }
      }

      if (picker) picker.addEventListener('change', update);

      // Puntos del carrusel móvil
      var dots = qsa('.product__media-dots span', product);
      if (mediaList && dots.length) {
        mediaList.addEventListener('scroll', debounce(function () {
          var i = Math.round(mediaList.scrollLeft / mediaList.clientWidth);
          dots.forEach(function (d, j) { d.classList.toggle('is-active', i === j); });
        }, 50), { passive: true });
      }

      // Selector de cantidad
      qsa('[data-qty-step]', product).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var input = qs('input[name="quantity"]', product);
          if (!input) return;
          input.value = Math.max(1, (parseInt(input.value, 10) || 1) + parseInt(btn.getAttribute('data-qty-step'), 10));
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     Lista de deseos (localStorage)
     ------------------------------------------------------------------------ */

  var WISHLIST_KEY = 'theme:wishlist';

  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; } catch (e) { return []; }
  }
  function setWishlist(list) {
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function syncWishlist() {
    var list = getWishlist();
    qsa('[data-wishlist-toggle]').forEach(function (btn) {
      var active = list.indexOf(btn.getAttribute('data-wishlist-toggle')) > -1;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    qsa('[data-wishlist-count]').forEach(function (el) {
      el.textContent = list.length;
      el.setAttribute('data-count', list.length);
    });
    var page = qs('[data-wishlist-page]');
    if (page) renderWishlistPage(page, list);
  }

  function renderWishlistPage(page, list) {
    var grid = qs('[data-wishlist-grid]', page);
    var empty = qs('[data-wishlist-empty]', page);
    if (!list.length) {
      grid.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    Promise.all(list.map(function (handle) {
      return fetch(routes.root + 'products/' + handle + '?view=card')
        .then(function (r) { return r.ok ? r.text() : ''; })
        .catch(function () { return ''; });
    })).then(function (cards) {
      grid.innerHTML = cards.join('');
      syncWishlistButtonsOnly();
    });
  }

  function syncWishlistButtonsOnly() {
    var list = getWishlist();
    qsa('[data-wishlist-toggle]').forEach(function (btn) {
      btn.classList.toggle('is-active', list.indexOf(btn.getAttribute('data-wishlist-toggle')) > -1);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-wishlist-toggle]');
    if (!btn) return;
    e.preventDefault();
    var handle = btn.getAttribute('data-wishlist-toggle');
    var list = getWishlist();
    var i = list.indexOf(handle);
    if (i > -1) {
      list.splice(i, 1);
      toast(strings.wishlistRemoved || 'Eliminado de la lista de deseos');
    } else {
      list.push(handle);
      toast(strings.wishlistAdded || 'Guardado en la lista de deseos');
    }
    setWishlist(list);
    syncWishlist();
  });

  /* ------------------------------------------------------------------------
     Productos relacionados + vistos recientemente
     ------------------------------------------------------------------------ */

  var RECENT_KEY = 'theme:recently-viewed';

  function fetchCards(handles) {
    return Promise.all(handles.map(function (handle) {
      return fetch(routes.root + 'products/' + handle + '?view=card')
        .then(function (r) { return r.ok ? r.text() : ''; })
        .catch(function () { return ''; });
    })).then(function (cards) { return cards.join(''); });
  }

  function initRelated(root) {
    qsa('[data-related]', root).forEach(function (el) {
      if (el._related) return;
      el._related = true;
      var track = qs('[data-recommendations]', el);
      if (track && !track.children.length) {
        fetch(el.getAttribute('data-recommendations-url'))
          .then(function (r) { return r.text(); })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var fresh = qs('[data-recommendations]', doc);
            if (fresh && fresh.innerHTML.trim()) {
              track.innerHTML = fresh.innerHTML;
              syncWishlistButtonsOnly();
              initAnimations(el);
            }
          })
          .catch(function () {});
      }

      var handle = el.getAttribute('data-product-handle');
      var limit = parseInt(el.getAttribute('data-limit'), 10) || 8;
      var list = [];
      try { list = JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) {}
      var others = list.filter(function (h) { return h !== handle; }).slice(0, limit);
      if (handle) {
        try { localStorage.setItem(RECENT_KEY, JSON.stringify([handle].concat(others).slice(0, 12))); } catch (e) {}
      }

      var recentTrack = qs('[data-recently-viewed]', el);
      var recentTab = qs('[data-recent-tab]', el);
      if (recentTrack && others.length) {
        fetchCards(others).then(function (html) {
          if (!html.trim()) return;
          recentTrack.innerHTML = html;
          if (recentTab) recentTab.hidden = false;
          syncWishlistButtonsOnly();
          qsa('.animate-on-scroll', recentTrack).forEach(function (c) { c.classList.add('is-visible'); });
        });
      }
    });
  }

  /* ------------------------------------------------------------------------
     Animaciones al hacer scroll
     ------------------------------------------------------------------------ */

  function initAnimations(root) {
    var els = qsa('.animate-on-scroll:not(.is-visible)', root);
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------------ */

  function initAll(root) {
    initSlideshow(root);
    initProductSliders(root);
    initTabs(root);
    initLogos(root);
    initCollectionCarousel(root);
    initProduct(root);
    initRelated(root);
    initAnimations(root);
  }

  function initFooter() {
    if (window.innerWidth >= 750) return;
    qsa('details.footer__block[open]').forEach(function (d) { d.removeAttribute('open'); });
  }

  function ready() {
    document.body.classList.add('is-loaded');
    initHeader();
    initPredictiveSearch();
    initAnnouncement();
    initFooter();
    initAll(document);
    syncWishlist();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready);
  } else {
    ready();
  }

  // Seguridad: ocultar la pantalla de carga aunque falle algo
  window.addEventListener('load', function () { document.body.classList.add('is-loaded'); });
  setTimeout(function () { document.body.classList.add('is-loaded'); }, 3000);

  // Editor de temas de Shopify
  document.addEventListener('shopify:section:load', function (e) {
    initAll(e.target);
    if (qs('[data-header-wrapper]', e.target)) initHeader();
    if (qs('[data-announcement-slider]', e.target)) initAnnouncement();
    syncWishlist();
  });

  window.themeCart = { refresh: refreshCart, open: function () { openDrawer(document.getElementById(cartDrawerId)); } };
})();
