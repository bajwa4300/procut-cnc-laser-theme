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

    function updateVariantUI(variant) {
      if (!variant) return;
      if (variantInput) variantInput.value = variant.id;
      if (priceEl) priceEl.innerHTML = formatMoney(variant.price);
      if (stockEl) {
        stockEl.textContent = variant.available ? 'IN STOCK' : 'SOLD OUT';
      }
      if (addBtn) addBtn.disabled = !variant.available;
    }

    productInfo.querySelectorAll('.opt-pill, .opt-swatch').forEach((btn) => {
      btn.addEventListener('click', () => {
        const row = btn.closest('.opt-row');
        const index = row?.dataset.optionIndex;
        const select = productInfo.querySelector(`[data-option-select="${index}"]`);
        row?.querySelectorAll('.opt-pill, .opt-swatch').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (select) {
          select.value = btn.dataset.optionValue;
          const label = productInfo.querySelector(`[data-option-label="${(btn.dataset.optionName || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}"]`);
          if (label) label.textContent = `— ${btn.dataset.optionValue}`;
        }
        updateVariantUI(findVariant());
      });
    });

    productInfo.querySelectorAll('.pdp-thumb').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        productInfo.querySelectorAll('.pdp-thumb').forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
        const main = document.getElementById('ProductMainImg');
        if (main && thumb.dataset.src) main.src = thumb.dataset.src;
      });
    });

    const qtyInput = form?.querySelector('.qty-input');
    form?.querySelector('[data-qty-minus]')?.addEventListener('click', () => {
      if (qtyInput && parseInt(qtyInput.value, 10) > 1) qtyInput.value = parseInt(qtyInput.value, 10) - 1;
    });
    form?.querySelector('[data-qty-plus]')?.addEventListener('click', () => {
      if (qtyInput) qtyInput.value = parseInt(qtyInput.value, 10) + 1;
    });

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
    initProductPage();
    initProductCards();
    initCart();
    initCollectionFilters();
  });
})();
