(function () {
  function init() {
    document.querySelectorAll('.waves').forEach(function (w, n) {
      if (!w) return;
      var p = '';
      for (var k = 0; k < 30; k++) {
        var a = k * 3, b = n % 2 ? 40 : 0;
        p += '<path d="M-20 ' + (300 + k * 1.6 + b) + ' C 250 ' + (60 + a) + ', 520 ' + (470 - a) + ', 800 ' + (190 + k * 2) + ' S 1120 ' + (80 + k * 2) + ', 1220 ' + (150 + k) + '" stroke="#fff" stroke-opacity="' + (0.7 - k * 0.012).toFixed(2) + '" stroke-width=".9" fill="none"/>';
      }
      w.innerHTML = '<svg viewBox="0 0 1200 420" preserveAspectRatio="none" aria-hidden="true">' + p + '</svg>';
    });

    var cards = [].slice.call(document.querySelectorAll('.card'));
    var dots = document.getElementById('dots');
    var prev = document.getElementById('prev');
    var next = document.getElementById('next');
    var n = cards.length, cur = 1;

    function show(i) {
      if (!n) return;
      cur = (i + n) % n;
      cards.forEach(function (c, j) {
        var r = (j - cur + n) % n;
        c.classList.toggle('active', r === 0);
        c.style.order = r === 0 ? 2 : r === 1 ? 3 : 1;
      });
      if (dots) [].forEach.call(dots.children, function (d, j) { d.classList.toggle('on', j === cur); });
    }

    cards.forEach(function (c, i) {
      if (dots) {
        var d = document.createElement('button');
        d.type = 'button';
        d.setAttribute('aria-label', 'Show ' + c.textContent.trim());
        d.onclick = function () { show(i); };
        dots.appendChild(d);
      }
      c.onclick = function () { show(i); };
    });
    if (prev) prev.onclick = function () { show(cur - 1); };
    if (next) next.onclick = function () { show(cur + 1); };
    show(1);

    var navLinks = [].slice.call(document.querySelectorAll('.links a'));
    if ('IntersectionObserver' in window) {
      document.querySelectorAll('.sec').forEach(function (s) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) navLinks.forEach(function (a) {
              a.classList.toggle('act', a.getAttribute('href') === '#' + s.id);
            });
          });
        }, { rootMargin: '-45% 0px -50% 0px' }).observe(s);
      });
    }

    var q = document.getElementById('q');
    var drop = document.getElementById('drop');
    var clr = document.getElementById('clr');
    var goBtn = document.getElementById('go');

    if (q && drop && clr) {
      var index = [];
      document.querySelectorAll('[data-search]').forEach(function (el) {
        var sec = el.closest('.sec');
        if (!sec) return;
        var text = '';
        if (el.classList.contains('sec')) {
          text = [].map.call(el.querySelectorAll('h1,h2,p'), function (x) { return x.textContent; }).join(' ');
        } else if (el.tagName === 'IMG') {
          text = el.alt || '';
        } else if (el.querySelector('figcaption')) {
          text = el.querySelector('figcaption').textContent;
        }
        index.push({
          el: el,
          title: el.dataset.title || '',
          kw: el.dataset.kw || '',
          text: text.replace(/\s+/g, ' ').trim(),
          section: sec.id,
          label: sec.dataset.title || '',
          card: cards.indexOf(el)
        });
      });

      var results = [], sel = -1;

      var esc = function (s) {
        return s.replace(/[&<>"]/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
      };

      var hl = function (s, t) {
        var o = esc(s);
        t.forEach(function (w) {
          if (w) o = o.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>');
        });
        return o;
      };

      var find = function (v) {
        var t = v.toLowerCase().split(/\s+/).filter(Boolean);
        if (!t.length) return index.filter(function (i) { return i.el.classList.contains('sec'); });
        return index.map(function (i) {
          var ti = i.title.toLowerCase(), k = i.kw.toLowerCase(), x = i.text.toLowerCase(), sc = 0, ok = true;
          t.forEach(function (w) {
            var s = 0;
            if (ti.indexOf(w) === 0) s = 10;
            else if (ti.indexOf(w) > -1) s = 7;
            else if (k.indexOf(w) > -1) s = 5;
            else if (x.indexOf(w) > -1) s = 2;
            if (!s) ok = false;
            sc += s;
          });
          if (!ok) return null;
          if (i.el.classList.contains('sec')) sc += 1;
          return { i: i, s: sc };
        }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).slice(0, 7).map(function (r) { return r.i; });
      };

      var snippet = function (i, t) {
        var x = i.text || i.kw;
        if (!x) return '';
        var p = -1;
        t.some(function (w) { p = x.toLowerCase().indexOf(w); return p > -1; });
        var s = Math.max(0, p - 30);
        return (s > 0 ? '…' : '') + x.substr(s, 90) + (x.length > s + 90 ? '…' : '');
      };

      var setOpen = function (b) {
        drop.classList.toggle('on', b);
        q.setAttribute('aria-expanded', b);
      };

      var render = function () {
        var v = q.value.trim();
        var t = v.toLowerCase().split(/\s+/).filter(Boolean);
        results = find(v);
        sel = -1;
        clr.classList.toggle('on', !!q.value);
        if (!results.length) {
          drop.innerHTML = '<div class="none">No results found for “' + esc(v) + '”. Try Home, About Me, Achievements, Certificates or Contact.</div>';
        } else {
          drop.innerHTML = results.map(function (i, k) {
            return '<button class="opt" role="option" data-n="' + k + '" type="button"><span class="tag">' + esc(i.label) + '</span><b>' + hl(i.title, t) + '</b><small>' + hl(snippet(i, t), t) + '</small></button>';
          }).join('');
        }
        setOpen(true);
      };

      var mark = function (k) {
        var o = drop.querySelectorAll('.opt');
        o.forEach(function (e, j) { e.classList.toggle('sel', j === k); });
        sel = k;
        if (o[k]) o[k].scrollIntoView({ block: 'nearest' });
      };

      var goTo = function (i) {
        if (i.card > -1) show(i.card);
        var target = i.el.classList.contains('sec') ? i.el : document.getElementById(i.section);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + i.section);
        if (!i.el.classList.contains('sec')) {
          setTimeout(function () {
            i.el.classList.add('flash');
            setTimeout(function () { i.el.classList.remove('flash'); }, 1500);
          }, 500);
        }
        setOpen(false);
        q.blur();
      };

      q.addEventListener('input', render);
      q.addEventListener('focus', render);
      q.addEventListener('keydown', function (e) {
        var c = results.length;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (!drop.classList.contains('on')) render();
          else if (c) mark((sel + 1) % c);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (c) mark((sel - 1 + c) % c);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (!q.value.trim()) return;
          if (!drop.classList.contains('on')) render();
          var r = results[sel > -1 ? sel : 0];
          if (r) goTo(r);
        } else if (e.key === 'Escape') {
          setOpen(false);
        }
      });
      drop.addEventListener('mousedown', function (e) {
        var b = e.target.closest('.opt');
        if (b) { e.preventDefault(); goTo(results[+b.dataset.n]); }
      });
      clr.onclick = function () { q.value = ''; q.focus(); render(); };
      if (goBtn) goBtn.onclick = function () {
        if (!q.value.trim()) { q.focus(); return; }
        render();
        if (results[0]) goTo(results[0]);
      };
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.search')) setOpen(false);
      });
    }

    var form = document.getElementById('form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var em = document.getElementById('em');
        var m = document.getElementById('msg');
        var s = document.getElementById('status');
        if (!/^\S+@\S+\.\S+$/.test(em.value)) { s.textContent = 'Please enter a valid email address.'; em.focus(); return; }
        if (!m.value.trim()) { s.textContent = 'Please write a message.'; m.focus(); return; }
        s.textContent = 'Thank you! Your message is ready to send.';
        form.reset();
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
