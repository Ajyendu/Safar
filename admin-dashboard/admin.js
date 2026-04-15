(function () {
  var TOKEN_KEY = "safar_admin_token";

  function $(sel) {
    return document.querySelector(sel);
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function setToken(t) {
    if (t) sessionStorage.setItem(TOKEN_KEY, t);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  function api(path, options) {
    options = options || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    var token = getToken();
    if (token) headers.Authorization = "Bearer " + token;
    return fetch(path, Object.assign({}, options, { headers: headers })).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var msg = data.error || data.message || res.statusText;
          throw new Error(msg);
        }
        return data;
      });
    });
  }

  function showLogin() {
    $("#view-login").classList.remove("hidden");
    $("#view-app").classList.add("hidden");
  }

  function showApp() {
    $("#view-login").classList.add("hidden");
    $("#view-app").classList.remove("hidden");
  }

  function setGlobalError(msg) {
    var el = $("#global-error");
    if (!msg) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  var monuments = [];

  function slugify(name) {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function renderStats(stats) {
    var grid = $("#stats-grid");
    grid.innerHTML = "";
    function card(label, value, hint) {
      var d = document.createElement("div");
      d.className = "stat";
      d.innerHTML =
        '<div class="label">' +
        label +
        '</div><div class="value">' +
        value +
        "</div>" +
        (hint ? '<div class="hint">' + hint + "</div>" : "");
      grid.appendChild(d);
    }
    card("Monuments", stats.monuments != null ? stats.monuments : "—");
    card(
      "Published",
      stats.publishedMonuments != null ? stats.publishedMonuments : "—",
      (stats.draftMonuments != null ? stats.draftMonuments : 0) + " draft"
    );
    card("QR checkpoints", stats.totalQrPoints != null ? stats.totalQrPoints : "—");
    card("Users", stats.users != null ? stats.users : "—");
    card("Recorded QR scans", stats.totalRecordedScans != null ? stats.totalRecordedScans : "—");
    card("Monument visits (sum)", stats.sumUserMonumentVisits != null ? stats.sumUserMonumentVisits : "—");
  }

  function renderTable(filter) {
    var q = (filter || "").trim().toLowerCase();
    var rows = monuments.filter(function (m) {
      if (!q) return true;
      return (
        String(m.name || "")
          .toLowerCase()
          .includes(q) || String(m.slug || "").toLowerCase().includes(q)
      );
    });
    var tbody = $("#mon-tbody");
    tbody.innerHTML = "";
    rows.forEach(function (m) {
      var tr = document.createElement("tr");
      var nQr = (m.qrPoints && m.qrPoints.length) || 0;
      var pub = !!m.isPublished;
      tr.innerHTML =
        "<td>" +
        escapeHtml(m.name) +
        '</td><td class="mono">' +
        escapeHtml(m.slug) +
        "</td><td>" +
        nQr +
        '</td><td><button type="button" class="pill ' +
        (pub ? "pub" : "draft") +
        '" data-slug="' +
        escapeAttr(m.slug) +
        '" data-action="toggle">' +
        (pub ? "Published" : "Draft") +
        '</button></td><td><button type="button" class="link-danger" data-slug="' +
        escapeAttr(m.slug) +
        '" data-action="delete">Delete</button></td>';
      tbody.appendChild(tr);
    });
    $("#mon-empty").classList.toggle("hidden", rows.length > 0);
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;");
  }

  function refreshAll() {
    setGlobalError("");
    return Promise.all([api("/api/admin/stats"), api("/api/admin/monuments")])
      .then(function (results) {
        renderStats(results[0].stats || {});
        monuments = results[1].monuments || [];
        renderTable($("#mon-filter").value);
      })
      .catch(function (e) {
        if (/401|Invalid|expired|required/i.test(e.message)) {
          setToken(null);
          showLogin();
        }
        setGlobalError(e.message);
      });
  }

  function bindTable() {
    $("#mon-tbody").addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-action]");
      if (!btn) return;
      var slug = btn.getAttribute("data-slug");
      var action = btn.getAttribute("data-action");
      if (action === "toggle") {
        var m = monuments.find(function (x) {
          return x.slug === slug;
        });
        if (!m) return;
        api("/api/admin/monuments/" + encodeURIComponent(slug), {
          method: "PATCH",
          body: JSON.stringify({ isPublished: !m.isPublished }),
        })
          .then(function () {
            return refreshAll();
          })
          .catch(function (e) {
            setGlobalError(e.message);
          });
      }
      if (action === "delete") {
        if (!confirm('Delete monument "' + slug + '"?')) return;
        api("/api/admin/monuments/" + encodeURIComponent(slug), { method: "DELETE" })
          .then(function () {
            return refreshAll();
          })
          .catch(function (e) {
            setGlobalError(e.message);
          });
      }
    });
  }

  function bindTabs() {
    document.querySelectorAll(".nav-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var tab = b.getAttribute("data-tab");
        document.querySelectorAll(".nav-btn").forEach(function (x) {
          x.classList.toggle("active", x === b);
        });
        $("#tab-overview").classList.toggle("hidden", tab !== "overview");
        $("#tab-monuments").classList.toggle("hidden", tab !== "monuments");
      });
    });
  }

  $("#login-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var err = $("#login-error");
    err.classList.add("hidden");
    var adminId = $("#admin-id").value.trim();
    var adminPassword = $("#admin-password").value;
    $("#login-submit").disabled = true;
    api("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ adminId: adminId, adminPassword: adminPassword }),
    })
      .then(function (data) {
        setToken(data.token);
        showApp();
        return refreshAll();
      })
      .catch(function (e) {
        err.textContent = e.message;
        err.classList.remove("hidden");
      })
      .finally(function () {
        $("#login-submit").disabled = false;
      });
  });

  $("#logout-btn").addEventListener("click", function () {
    setToken(null);
    showLogin();
  });

  $("#mon-filter").addEventListener("input", function () {
    renderTable($("#mon-filter").value);
  });

  var createForm = $("#create-form");
  var nameInput = createForm.querySelector('[name="name"]');
  var slugInput = createForm.querySelector('[name="slug"]');

  nameInput.addEventListener("blur", function () {
    if (!slugInput.value.trim()) slugInput.value = slugify(nameInput.value);
  });

  $("#open-create").addEventListener("click", function () {
    createForm.reset();
    slugInput.value = "";
    $("#create-error").classList.add("hidden");
    $("#modal-create").classList.remove("hidden");
  });

  $("#create-cancel").addEventListener("click", function () {
    $("#modal-create").classList.add("hidden");
  });

  createForm.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var ce = $("#create-error");
    ce.classList.add("hidden");
    var fd = new FormData(createForm);
    var name = String(fd.get("name") || "").trim();
    var slug = String(fd.get("slug") || "").trim() || slugify(name);
    var lat = Number(fd.get("lat"));
    var lng = Number(fd.get("lng"));
    var radiusMeters = Number(fd.get("radiusMeters"));
    if (!name || !slug) {
      ce.textContent = "Name and slug required.";
      ce.classList.remove("hidden");
      return;
    }
    if (!isFinite(lat) || !isFinite(lng) || !isFinite(radiusMeters)) {
      ce.textContent = "Invalid geofence numbers.";
      ce.classList.remove("hidden");
      return;
    }
    api("/api/admin/monuments", {
      method: "POST",
      body: JSON.stringify({
        name: name,
        slug: slug,
        description: String(fd.get("description") || "").trim(),
        geofence: { lat: lat, lng: lng, radiusMeters: radiusMeters },
        isPublished: fd.get("isPublished") === "on",
      }),
    })
      .then(function () {
        $("#modal-create").classList.add("hidden");
        document.querySelector('[data-tab="monuments"]').click();
        return refreshAll();
      })
      .catch(function (e) {
        ce.textContent = e.message;
        ce.classList.remove("hidden");
      });
  });

  bindTable();
  bindTabs();

  if (getToken()) {
    showApp();
    refreshAll();
  } else {
    showLogin();
  }
})();
