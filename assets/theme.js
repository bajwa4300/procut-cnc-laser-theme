(function () {
  'use strict';

  function formatMoney(cents) {
    if (window.Shopify && typeof Shopify.formatMoney === 'function') {
      return Shopify.formatMoney(cents);
    }
    return (cents / 100).toFixed(2);
  }

  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = `(${count})`;
    });
  }

  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.site-nav ul');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function initMarquee() {
    document.querySelectorAll('[data-marquee-track]').forEach((track) => {
      if (track.dataset.duplicated) return;
      const content = track.innerHTML;
      track.innerHTML = content + content;
      track.dataset.duplicated = 'true';
    });
  }

  function initContactPills() {
    document.querySelectorAll('[data-service-pills]').forEach((row) => {
      const hidden = document.getElementById('ContactForm-service');
      row.querySelectorAll('.radio-pill').forEach((pill) => {
        pill.addEventListener('click', () => {
          row.querySelectorAll('.radio-pill').forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
          if (hidden) hidden.value = pill.dataset.value || pill.textContent.trim();
        });
      });
    });
  }

  function initContactMap() {
    const box = document.querySelector('.map-box');
    const iframe = box?.querySelector('.map-embed');
    if (!iframe) return;

    const logMap = (message, data, hypothesisId) => {
      // #region agent log
      fetch('http://127.0.0.1:7842/ingest/2f27f6d2-a438-4a01-804f-ed7e66eb38b8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7a0570' },
        body: JSON.stringify({
          sessionId: '7a0570',
          runId: 'pre-fix',
          hypothesisId,
          location: 'theme.js:initContactMap',
          message,
          data,
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      if (box) {
        box.dataset.debugMap = JSON.stringify({ message, ...data });
      }
    };

    const dims = () => ({
      src: iframe.getAttribute('src') || '',
      boxW: box?.offsetWidth || 0,
      boxH: box?.offsetHeight || 0,
      iframeW: iframe.offsetWidth,
      iframeH: iframe.offsetHeight,
      inViewport: !!box?.getBoundingClientRect().top && box.getBoundingClientRect().top < window.innerHeight,
    });

    logMap('map init', dims(), 'H2');

    iframe.addEventListener('load', () => {
      logMap('map iframe load', dims(), 'H1');
    });

    iframe.addEventListener('error', () => {
      logMap('map iframe error', dims(), 'H1');
    });

    if ('loading' in iframe && iframe.loading === 'lazy') {
      logMap('map lazy loading enabled', dims(), 'H5');
    }

    requestAnimationFrame(() => {
      logMap('map layout after paint', dims(), 'H2');
    });
  }

  function initProductGallery() {
    document.querySelectorAll('product-info').forEach((productInfo) => {
      const main = productInfo.querySelector('#ProductMainImg, [data-product-main-image]');
      if (!main) return;

      productInfo.querySelectorAll('.pdp-thumb').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const url = thumb.getAttribute('data-src') || thumb.dataset.src || '';
          const thumbImg = thumb.querySelector('img');
          productInfo.querySelectorAll('.pdp-thumb').forEach((t) => t.classList.remove('active'));
          thumb.classList.add('active');

          // #region agent log
          fetch('http://127.0.0.1:7842/ingest/2f27f6d2-a438-4a01-804f-ed7e66eb38b8', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7a0570' },
            body: JSON.stringify({
              sessionId: '7a0570',
              runId: 'gallery-click',
              hypothesisId: 'H1',
              location: 'theme.js:initProductGallery',
              message: 'PDP thumb click',
              data: {
                hasMain: !!main,
                url: url.slice(0, 120),
                hadSrcset: !!main.getAttribute('srcset'),
                mainTag: main.tagName,
                beforeSrc: (main.currentSrc || main.src || '').slice(0, 120),
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion

          if (!url) return;

          // Shopify image_tag sets srcset; browsers ignore src changes while srcset remains.
          main.removeAttribute('srcset');
          main.removeAttribute('sizes');
          main.src = url;
          if (thumbImg?.alt) main.alt = thumbImg.alt;

          // #region agent log
          fetch('http://127.0.0.1:7842/ingest/2f27f6d2-a438-4a01-804f-ed7e66eb38b8', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7a0570' },
            body: JSON.stringify({
              sessionId: '7a0570',
              runId: 'gallery-click',
              hypothesisId: 'H1',
              location: 'theme.js:initProductGallery:after',
              message: 'PDP main image updated',
              data: {
                afterSrc: (main.src || '').slice(0, 120),
                afterSrcset: main.getAttribute('srcset'),
                matchesUrl: main.src.includes(url.split('?')[0].split('/').pop() || '___'),
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
        });
      });
    });
  }

  function initProductPage() {
    const productInfo = document.querySelector('product-info');
    if (!productInfo) return;

    const jsonEl = productInfo.querySelector('[id^="ProductJSON-"]');
    if (!jsonEl) return;

    const product = JSON.parse(jsonEl.textContent);
    const form = productInfo.querySelector('form.product-form');
    const variantInput = form?.querySelector('[data-variant-input]');
    const priceEl = productInfo.querySelector('[id^="ProductPrice-"] .price');
    const stockEl = productInfo.querySelector('[data-stock-text]');
    const addBtn = productInfo.querySelector('[id^="AddToCart-"]');

    function getSelectedOptions() {
      const options = [];
      productInfo.querySelectorAll('[data-option-select]').forEach((select) => {
        options.push(select.value);
      });
      return options;
    }

    function findVariant() {
      const selected = getSelectedOptions();
      return product.variants.find((variant) => {
        return variant.options.every((opt, i) => opt === selected[i]);
      });
    }

    function setMainImage(url, alt) {
      const main = productInfo.querySelector('#ProductMainImg, [data-product-main-image]');
      if (!main || !url) return;
      main.removeAttribute('srcset');
      main.removeAttribute('sizes');
      main.src = url;
      if (alt) main.alt = alt;
    }

    function updateVariantUI(variant) {
      if (!variant) return;
      if (variantInput) variantInput.value = variant.id;
      if (priceEl) priceEl.innerHTML = formatMoney(variant.price);
      if (stockEl) {
        stockEl.textContent = variant.available
          ? (window.variantStrings?.inStock || 'IN STOCK — SHIPS IN 3–5 DAYS')
          : (window.variantStrings?.soldOut || 'SOLD OUT');
      }
      if (addBtn) addBtn.disabled = !variant.available;

      if (variant.featured_image) {
        const img = variant.featured_image;
        const url = img.src || img;
        setMainImage(url, product.title);
        const mediaId = String(img.id || '');
        productInfo.querySelectorAll('.pdp-thumb').forEach((thumb) => {
          const match = mediaId && thumb.dataset.mediaId === mediaId;
          thumb.classList.toggle('active', match);
        });
      }

      // #region agent log
      fetch('http://127.0.0.1:7842/ingest/2f27f6d2-a438-4a01-804f-ed7e66eb38b8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7a0570' },
        body: JSON.stringify({
          sessionId: '7a0570',
          runId: 'variant-select',
          hypothesisId: 'H2',
          location: 'theme.js:updateVariantUI',
          message: 'Variant selected',
          data: {
            id: variant.id,
            title: variant.title,
            price: variant.price,
            hasImage: !!(variant.featured_image && (variant.featured_image.src || variant.featured_image)),
            imageId: variant.featured_image?.id || null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }

    productInfo.querySelectorAll('.opt-variant, .opt-pill, .opt-swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.opt-row');
        const index = row?.dataset.optionIndex;
        const select = productInfo.querySelector(`[data-option-select="${index}"]`);
        row?.querySelectorAll('.opt-variant, .opt-pill, .opt-swatch').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (select) {
          select.value = btn.dataset.optionValue;
        }
        updateVariantUI(findVariant());
      });
    });

    const qtyInput = form?.querySelector('.qty-input');
    const qtyDisplay = form?.querySelector('[data-qty-display]');

    function setQty(next) {
      const value = Math.max(1, parseInt(next, 10) || 1);
      if (qtyInput) qtyInput.value = String(value);
      if (qtyDisplay) qtyDisplay.textContent = String(value);
    }

    form?.querySelector('[data-qty-minus]')?.addEventListener('click', () => {
      setQty((parseInt(qtyInput?.value, 10) || 1) - 1);
    });
    form?.querySelector('[data-qty-plus]')?.addEventListener('click', () => {
      setQty((parseInt(qtyInput?.value, 10) || 1) + 1);
    });

    // #region agent log
    (function logPdpFonts() {
      const desc = productInfo.querySelector('.pdp-desc');
      const descChild = desc?.querySelector('p,span') || desc;
      const specV = productInfo.querySelector('.spec-row .v');
      const data = {
        descTag: desc?.tagName || null,
        descNestedOutside: !!(desc && desc.innerHTML === '' && desc.nextElementSibling?.tagName === 'P'),
        descFont: descChild ? getComputedStyle(descChild).fontFamily : null,
        descSize: descChild ? getComputedStyle(descChild).fontSize : null,
        specFont: specV ? getComputedStyle(specV).fontFamily : null,
        hasJetBrainsCss: [...document.styleSheets].some((s) => {
          try {
            return [...(s.cssRules || [])].some((r) => (r.cssText || '').includes('JetBrains Mono'));
          } catch (e) {
            return false;
          }
        }),
      };
      fetch('http://127.0.0.1:7842/ingest/2f27f6d2-a438-4a01-804f-ed7e66eb38b8', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7a0570' },
        body: JSON.stringify({
          sessionId: '7a0570',
          runId: 'font-verify',
          hypothesisId: 'H1',
          location: 'theme.js:logPdpFonts',
          message: 'PDP computed fonts',
          data,
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      if (desc) desc.dataset.debugFont = data.descFont || '';
    })();
    // #endregion

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      try {
        const res = await fetch(window.routes.cart_add_url + '.js', {
          method: 'POST',
          body: fd,
        });
        const data = await res.json();
        if (data.status) {
          alert(data.description || 'Could not add to cart');
          return;
        }
        updateCartCount(data.item_count);
        window.location.href = window.routes.cart_url;
      } catch (err) {
        alert('Could not add to cart');
      }
    });
  }

  function initProductCards() {
    document.querySelectorAll('[data-card-variant]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = btn.closest('[data-product-card]');
        if (!card) return;

        card.querySelectorAll('[data-card-variant]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const addBtn = card.querySelector('.product-card-add');
        const priceEl = card.querySelector('[data-card-price]');
        const primary = card.querySelector('.product-card-image--primary, [data-card-image]');
        const secondary = card.querySelector('.product-card-image--secondary');

        if (addBtn) {
          addBtn.dataset.variantId = btn.dataset.variantId;
          addBtn.disabled = btn.dataset.available === 'false';
        }
        if (priceEl && btn.dataset.price) {
          const unit = priceEl.querySelector('small');
          const unitHtml = unit ? unit.outerHTML : '';
          priceEl.innerHTML = formatMoney(parseInt(btn.dataset.price, 10)) + unitHtml;
        }
        if (primary && btn.dataset.image) {
          primary.removeAttribute('srcset');
          primary.removeAttribute('sizes');
          primary.src = btn.dataset.image;
          if (secondary) secondary.style.opacity = '0';
          card.classList.add('has-variant-image');
        }

        // #region agent log
        fetch('http://127.0.0.1:7842/ingest/2f27f6d2-a438-4a01-804f-ed7e66eb38b8', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '7a0570' },
          body: JSON.stringify({
            sessionId: '7a0570',
            runId: 'card-variant',
            hypothesisId: 'H3',
            location: 'theme.js:initProductCards',
            message: 'Card variant selected',
            data: {
              variantId: btn.dataset.variantId,
              price: btn.dataset.price,
              hasImage: !!btn.dataset.image,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      });
    });

    document.querySelectorAll('.product-card-add').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const fd = new FormData();
        fd.append('id', btn.dataset.variantId);
        fd.append('quantity', '1');
        try {
          const res = await fetch(window.routes.cart_add_url + '.js', { method: 'POST', body: fd });
          const data = await res.json();
          if (data.status) {
            alert(data.description || 'Could not add to cart');
            return;
          }
          updateCartCount(data.item_count);
          window.location.href = window.routes.cart_url;
        } catch (err) {
          alert('Could not add to cart');
        }
      });
    });
  }

  function getFilterTags(selector) {
    const els = Array.from(document.querySelectorAll(selector));
    if (!els.length) return [];
    const active = els.filter((el) => el.checked || el.classList.contains('active'));
    if (active.length === els.length) return [];
    return active.map((el) => el.dataset.filterTag?.toLowerCase()).filter(Boolean);
  }

  function applyCatalogFilters() {
    const cards = document.querySelectorAll('[data-product-card]');
    if (!cards.length) return;

    const categories = getFilterTags('.filter-category');
    const materials = getFilterTags('.fswatch');
    const orderTypes = getFilterTags('.filter-order-type');

    let visible = 0;
    cards.forEach((card) => {
      const tags = (card.dataset.tags || '').toLowerCase().split(',').map((t) => t.trim());
      const matchCategory = !categories.length || categories.some((t) => tags.includes(t));
      const matchMaterial = !materials.length || materials.some((t) => tags.includes(t));
      const matchOrder = !orderTypes.length || orderTypes.some((t) => tags.includes(t));
      const show = matchCategory && matchMaterial && matchOrder;
      card.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });

    const toolbarCount = document.querySelector('.toolbar span');
    if (toolbarCount) {
      const total = cards.length;
      toolbarCount.textContent = `SHOWING ${visible} OF ${total}`;
    }
  }

  function initCollectionFilters() {
    document.querySelectorAll('.filter-category, .filter-order-type').forEach((input) => {
      input.addEventListener('change', applyCatalogFilters);
    });

    document.querySelectorAll('.fswatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        swatch.classList.toggle('active');
        applyCatalogFilters();
      });
    });

    const sortForm = document.querySelector('.toolbar-sort');
    const sortSelect = document.getElementById('SortBy');
    if (sortForm && sortSelect) {
      sortSelect.addEventListener('change', () => sortForm.submit());
    }

    applyCatalogFilters();
  }

  async function changeCartLine(key, quantity) {
    const res = await fetch(window.routes.cart_change_url + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity }),
    });
    return res.json();
  }

  function initCart() {
    const cart = document.querySelector('cart-items');
    if (!cart) return;

    cart.addEventListener('click', async (e) => {
      const minus = e.target.closest('[data-quantity-minus]');
      const plus = e.target.closest('[data-quantity-plus]');
      const remove = e.target.closest('[data-remove-item]');
      const key = (minus || plus || remove)?.dataset.key;
      if (!key) return;

      const input = cart.querySelector(`[data-key="${key}"][data-quantity-input]`);
      let quantity = parseInt(input?.value || '1', 10);

      if (minus) quantity = Math.max(0, quantity - 1);
      if (plus) quantity += 1;
      if (remove) quantity = 0;

      try {
        const data = await changeCartLine(key, quantity);
        updateCartCount(data.item_count);
        window.location.reload();
      } catch (err) {
        alert(window.cartStrings?.error || 'Cart update failed');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMobileNav();
    initMarquee();
    initContactPills();
    initContactMap();
    initProductGallery();
    initProductPage();
    initProductCards();
    initCart();
    initCollectionFilters();
  });
})();
