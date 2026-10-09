/**
 * Cloud Crew v2 — SpaceXAI demo mini-game (fan demo, local only)
 * You're Elon Musk with a phone full of company problems. Raise the phone,
 * pick the fix, hit Send. Reach 1000 points to unlock Mars.
 *
 * Mount: initCloudCrew(rootEl) -> { start, destroy, getState }
 * Standalone: index.html calls initCloudCrew(document.getElementById('game-root'))
 */
(function (global) {
  'use strict';

  // ---- Rules & tuning -----------------------------------------------------
  var WIN_SCORE = 1000;       // points to unlock Mars
  var PTS_RIGHT = 50;
  var PTS_WRONG = 30;         // subtracted, score never below 0
  var PTS_FAST = 10;          // bonus when sent within FAST_MS of opening
  var FAST_MS = 3000;
  var MAX_INBOX = 3;          // waiting notifications
  var MAX_RAIN = 3;           // rain clouds until game over
  var REFILL = 65;            // % energy on a correct send
  var WRONG_PENALTY = 20;     // % energy lost on a wrong send
  var DRAIN_BASE = 0.6;       // % per second per bot at start
  var DRAIN_PER_SEC = 0.004;  // extra %/s for every second survived
  var DRAIN_MAX = 3;
  var ARRIVE_FIRST = [500, 1500];  // first two notifications (ms)
  var ARRIVE_START = 7000;    // ms between notifications at start
  var ARRIVE_MIN = 5000;      // ... never faster than this
  var ARRIVE_RAMP = 10;       // ms faster per second survived
  var LOW_BIAS = 0.65;        // chance a notification comes from the lowest bot
  var DOC_MS = 650;           // green doc flight
  var NEXT_OK_MS = 420;       // feedback pause after a right send
  var NEXT_BAD_MS = 750;      // ... after a wrong send
  var LAUNCH_MS = 2800;       // rocket flight to Mars
  var BEZEL_HIDDEN = 16;      // px of phone bottom hidden below the edge

  // ---- Content (fan tone; made-up problems, not real company facts) -------
  // Each problem: [problem, correct fix, wrong 1, wrong 2]
  var BOTS = [
    { id: 'tesla', name: 'Tesla', color: '#ff6b6b', problems: [
      ['Model Y range drops in winter', 'Precondition the battery', 'Add a bigger cupholder', 'Drive only downhill'],
      ['Autopilot camera is blurry', 'Clean the camera lens', 'Give it sunglasses', 'Paint on a new camera'],
      ['Supercharger line is too long', 'Build more stalls', 'Charge with a hamster wheel', 'Honk until it goes faster'],
      ['Door handle frozen shut', 'Heat the door handle', 'Enter through the trunk', 'Ask the door nicely'],
      ['Phone key won\u2019t unlock the car', 'Turn on Bluetooth', 'Shake the phone harder', 'Shout \u201copen sesame\u201d'],
      ['Tire pressure warning is on', 'Inflate the tires', 'Put a sticker on the light', 'Drive faster to fix it'],
      ['Wipers squeak on the glass', 'Replace the wiper blades', 'Sing louder than them', 'Drive in reverse'],
      ['Car app shows the wrong spot', 'Re-sync the app', 'Move the car to match', 'Rename the parking lot']
    ] },
    { id: 'spacex', name: 'SpaceX', color: '#9fb4ff', problems: [
      ['Starship heat shield cracking', 'Upgrade the tiles', 'Paint it red', 'Launch it anyway'],
      ['Booster missed the landing pad', 'Tune the landing burn', 'Move the pad to the rocket', 'Use a giant trampoline'],
      ['Engine runs a bit too hot', 'Improve engine cooling', 'Blow on it gently', 'Add racing stripes'],
      ['Launch scrubbed: high winds', 'Wait for calmer weather', 'Launch it sideways', 'Tape the rocket down'],
      ['Fuel tank has a small leak', 'Replace the seal', 'Plug it with chewing gum', 'Fuel it faster'],
      ['Tower arms miss the booster', 'Recalibrate the arms', 'Use a butterfly net', 'Try a fork instead'],
      ['Rocket too heavy for orbit', 'Cut unneeded mass', 'Add a bigger sticker', 'Launch it twice as hard'],
      ['Capsule window fogged up', 'Run the defogger', 'Draw a smiley on it', 'Close your eyes']
    ] },
    { id: 'starlink', name: 'Starlink', color: '#7cf0ff', problems: [
      ['Dish loses signal under trees', 'Move dish to clear sky', 'Water the trees less', 'Point dish at the ground'],
      ['Snow piling up on the dish', 'Turn on snow melt mode', 'Knit the dish a sweater', 'Wait for summer'],
      ['Video calls keep lagging', 'Restart the router', 'Talk faster', 'Blame the moon'],
      ['Satellite drifting off orbit', 'Fire the thrusters', 'Lasso it back', 'Ignore it politely'],
      ['Laptop is out of Wi-Fi range', 'Add a mesh Wi-Fi node', 'Hold laptop over your head', 'Yell the password louder'],
      ['Too many users in one cell', 'Launch more satellites', 'Ask users to share', 'Rename the network'],
      ['Dish motors are stuck', 'Clear debris and restart', 'Push it with a broom', 'Sing to the motors'],
      ['Slow speeds at peak hours', 'Add network capacity', 'Only browse at 3 a.m.', 'Type faster']
    ] },
    { id: 'xai', name: 'SpaceXAI', color: '#e6e9f0', problems: [
      ['Grok replies too slowly', 'Add more GPUs', 'Ask it to hurry up', 'Type in all caps'],
      ['Model makes up facts', 'Ground it with sources', 'Ask it to pinky promise', 'Add more emojis'],
      ['Training run keeps crashing', 'Resume from checkpoint', 'Unplug it and hope', 'Train it on memes only'],
      ['GPU cluster overheating', 'Boost liquid cooling', 'Open a window', 'Put ice cubes in servers'],
      ['Chat answers are way too long', 'Tighten the prompt', 'Use a smaller font', 'Answer in Morse code'],
      ['Grok misses the joke', 'Tune on more humor data', 'Explain the joke twice', 'Laugh track on every reply'],
      ['Model forgets the chat', 'Increase context length', 'Remind it every line', 'Write it on a sticky note'],
      ['Grok answers in wrong language', 'Set the language option', 'Learn that language', 'Reply only in emojis']
    ] },
    { id: 'neuralink', name: 'Neuralink', color: '#c792ff', problems: [
      ['Cursor control feels laggy', 'Recalibrate the decoder', 'Think louder', 'Blink in Morse code'],
      ['Implant battery running low', 'Charge it overnight', 'Drink more coffee', 'Rub a balloon on it'],
      ['Bluetooth link keeps dropping', 'Re-pair the device', 'Wear a tinfoil hat', 'Move to another planet'],
      ['Robot arm moves too fast', 'Lower the arm speed', 'Ask it to relax', 'Tie it to a chair'],
      ['App shows old brain data', 'Resync the app', 'Think the same thing again', 'Turn the brain off and on'],
      ['Typing by thought has typos', 'Enable autocorrect', 'Think in shorter words', 'Only think in emojis'],
      ['Thought-click fires twice', 'Add a debounce filter', 'Think half as hard', 'Click with your nose'],
      ['Charger coil gets warm', 'Lower the charge power', 'Put it in the fridge', 'Charge it faster']
    ] },
    { id: 'boring', name: 'Boring', color: '#ffb347', problems: [
      ['Tunnel machine is stuck', 'Swap the cutter head', 'Dig with spoons', 'Reverse into the tunnel'],
      ['Water leaking into tunnel', 'Seal the tunnel lining', 'Add a rubber duck', 'Rename it Boring Pool'],
      ['Traffic jam at the station', 'Add more loading bays', 'Honk in harmony', 'Make the cars smaller'],
      ['Tunnel air getting stuffy', 'Turn up ventilation', 'Hold your breath', 'Open the car windows'],
      ['Digging far too slowly', 'Upgrade the boring machine', 'Play faster music', 'Dig only on Sundays'],
      ['Lights flicker in the tunnel', 'Replace the wiring', 'Bring glow sticks', 'Blink in sync with them'],
      ['Tunnel walls are cracking', 'Reinforce the lining', 'Paint over the cracks', 'Dig a second crack'],
      ['Car stuck at tunnel exit', 'Fix the exit ramp sensor', 'Push it with a shovel', 'Rename exit as entrance']
    ] },
    { id: 'x', name: 'X', color: '#ffffff', problems: [
      ['Timeline full of spam bots', 'Improve spam filters', 'Follow the bots back', 'Reply with memes'],
      ['Videos buffer forever', 'Scale up video servers', 'Watch in slow motion', 'Squint harder'],
      ['Notifications not showing', 'Check app permissions', 'Refresh 400 times', 'Post louder'],
      ['App crashes on launch', 'Ship a bug-fix update', 'Launch it twice', 'Rename the app Y'],
      ['Search can\u2019t find posts', 'Rebuild the search index', 'Search in all caps', 'Guess the post instead'],
      ['Trending tab shows old news', 'Refresh the trend cache', 'Make the news older', 'Trend yesterday again'],
      ['Login codes arrive late', 'Switch to an auth app', 'Guess the code', 'Log in louder'],
      ['Posts show in wrong order', 'Fix the timeline sort', 'Read it upside down', 'Post backwards']
    ] }
  ];

  var instanceCount = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function fmtTime(ms) {
    var s = Math.round(ms / 1000);
    return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }

  // Cloud silhouette: circles + rounded base sharing one user-space gradient
  function cloudSvg(gradId) {
    return (
      '<svg class="cloud-crew__shape" viewBox="0 0 120 80" aria-hidden="true">' +
      '<g fill="url(#' + gradId + ')">' +
      '<circle cx="36" cy="46" r="20"/>' +
      '<circle cx="61" cy="33" r="26"/>' +
      '<circle cx="87" cy="45" r="19"/>' +
      '<rect x="14" y="44" width="92" height="30" rx="15"/>' +
      '</g>' +
      '<ellipse class="cloud-crew__gloss" cx="52" cy="22" rx="12" ry="5" fill="rgba(255,255,255,0.75)" transform="rotate(-18 52 22)"/>' +
      '</svg>'
    );
  }

  var ROCKET_ICON =
    '<svg class="cloud-crew__icon" viewBox="0 0 16 16" aria-hidden="true">' +
    '<path d="M8 1c2.4 1.6 3.5 4.3 3.2 8l1.6 1.9-.3 2.6-2.1-1.2H5.6l-2.1 1.2-.3-2.6L4.8 9C4.5 5.3 5.6 2.6 8 1z" fill="#e8f4ff"/>' +
    '<circle cx="8" cy="6" r="1.4" fill="#00e5ff"/></svg>';
  var RAIN_ICON =
    '<svg class="cloud-crew__icon" viewBox="0 0 16 16" aria-hidden="true">' +
    '<path d="M4.5 10.5a3 3 0 0 1 .4-6 3.6 3.6 0 0 1 6.7 1A2.5 2.5 0 0 1 11.5 10.5z" fill="#8a93a6"/>' +
    '<path d="M5.5 12l-.6 2M8.5 12l-.6 2M11.5 12l-.6 2" stroke="#8cc4ff" stroke-width="1.2" stroke-linecap="round"/></svg>';

  function initCloudCrew(rootEl) {
    if (!rootEl) throw new Error('initCloudCrew: root element required');
    var uid = 'cc' + (++instanceCount);
    var gWhite = uid + '-white';
    var gGrey = uid + '-grey';

    // ---- Build DOM --------------------------------------------------------
    var cloudsHtml = '';
    for (var i = 0; i < BOTS.length; i++) {
      cloudsHtml +=
        '<div class="cloud-crew__bot" data-cc-bot="' + i + '" style="--cc-delay:' + (-i * 0.53).toFixed(2) + 's">' +
        '<div class="cloud-crew__float">' +
        cloudSvg(gWhite) +
        '<div class="cloud-crew__eyes"><i></i><i></i></div>' +
        '<div class="cloud-crew__rain" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<span class="cloud-crew__ping" aria-hidden="true">!</span>' +
        '</div>' +
        '<div class="cloud-crew__name">' + esc(BOTS[i].name) + '</div>' +
        '<div class="cloud-crew__bar"><b></b></div>' +
        '</div>';
    }

    rootEl.classList.add('cloud-crew');
    rootEl.innerHTML =
      '<svg class="cloud-crew__defs" width="0" height="0" aria-hidden="true"><defs>' +
      '<radialGradient id="' + gWhite + '" gradientUnits="userSpaceOnUse" cx="52" cy="20" r="80">' +
      '<stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="#eaf6ff"/><stop offset="1" stop-color="#b9d3ea"/>' +
      '</radialGradient>' +
      '<radialGradient id="' + gGrey + '" gradientUnits="userSpaceOnUse" cx="52" cy="20" r="80">' +
      '<stop offset="0" stop-color="#9aa3b3"/><stop offset="0.6" stop-color="#6d7688"/><stop offset="1" stop-color="#4a5163"/>' +
      '</radialGradient>' +
      '</defs></svg>' +
      '<div class="cloud-crew__hud">' +
      '<div class="cloud-crew__score" data-cc-scorebox>Score <span data-cc-score>0</span></div>' +
      '<div class="cloud-crew__mars" title="Mars progress">' + ROCKET_ICON +
      '<div class="cloud-crew__mars-bar"><b data-cc-marsfill></b></div>' +
      '<span class="cloud-crew__mars-text"><span data-cc-mars>0</span>/' + WIN_SCORE + '</span>' +
      '</div>' +
      '<div class="cloud-crew__rainbox" title="Rain clouds">' + RAIN_ICON +
      '<span class="cloud-crew__rain-label">Rain clouds</span><span><span data-cc-rain>0</span>/' + MAX_RAIN + '</span>' +
      '</div>' +
      '</div>' +
      '<div class="cloud-crew__horizon" aria-hidden="true"></div>' +
      '<div class="cloud-crew__sky" data-cc-sky>' + cloudsHtml + '</div>' +
      '<div class="cloud-crew__dock" data-cc-dock></div>' +
      '<div class="cloud-crew__phone is-lowered" data-cc-phone>' +
      '<div class="cloud-crew__device" data-cc-device>' +
      '<div class="cloud-crew__notch"></div>' +
      '<div class="cloud-crew__head" data-cc-head>' +
      '<span class="cloud-crew__badge is-zero" data-cc-badge>0</span>' +
      '<span class="cloud-crew__head-title" data-cc-title>Inbox</span>' +
      '<span class="cloud-crew__chips" data-cc-chips></span>' +
      '<span class="cloud-crew__head-hint"><span class="cloud-crew__touch-only">Swipe up or tap</span>' +
      '<span class="cloud-crew__mouse-only">Click or press P</span> \u25B4</span>' +
      '<span class="cloud-crew__head-lower">Lower \u25BE</span>' +
      '</div>' +
      '<div class="cloud-crew__screen" data-cc-screen></div>' +
      '</div>' +
      '</div>' +
      '<div class="cloud-crew__launch" data-cc-launch hidden>' +
      '<div class="cloud-crew__planet" data-cc-planet></div>' +
      '<div class="cloud-crew__trails" data-cc-trails></div>' +
      '<div class="cloud-crew__rocket" data-cc-rocket><i class="cloud-crew__flame"></i><b class="cloud-crew__fins"></b><b class="cloud-crew__hull"></b></div>' +
      '</div>' +
      '<div class="cloud-crew__fx" data-cc-fx></div>' +
      '<div class="cloud-crew__overlay" data-cc-overlay>' +
      '<h2 class="cloud-crew__title" data-cc-otitle></h2>' +
      '<p class="cloud-crew__hint" data-cc-hint></p>' +
      '<p class="cloud-crew__sub" data-cc-sub></p>' +
      '<p class="cloud-crew__scoreline" data-cc-final></p>' +
      '<button type="button" class="cloud-crew__btn" data-cc-play>Play</button>' +
      '</div>';

    function q(sel) { return rootEl.querySelector(sel); }
    var hudEl = q('.cloud-crew__hud');
    var sky = q('[data-cc-sky]');
    var dock = q('[data-cc-dock]');
    var phone = q('[data-cc-phone]');
    var device = q('[data-cc-device]');
    var head = q('[data-cc-head]');
    var badgeEl = q('[data-cc-badge]');
    var titleEl = q('[data-cc-title]');
    var chipsEl = q('[data-cc-chips]');
    var screen = q('[data-cc-screen]');
    var scoreBox = q('[data-cc-scorebox]');
    var scoreEl = q('[data-cc-score]');
    var marsEl = q('[data-cc-mars]');
    var marsFill = q('[data-cc-marsfill]');
    var rainEl = q('[data-cc-rain]');
    var launchEl = q('[data-cc-launch]');
    var planetEl = q('[data-cc-planet]');
    var trailsEl = q('[data-cc-trails]');
    var rocketEl = q('[data-cc-rocket]');
    var fx = q('[data-cc-fx]');
    var overlay = q('[data-cc-overlay]');
    var oTitle = q('[data-cc-otitle]');
    var hintEl = q('[data-cc-hint]');
    var subEl = q('[data-cc-sub]');
    var finalEl = q('[data-cc-final]');
    var playBtn = q('[data-cc-play]');

    var bots = BOTS.map(function (def, idx) {
      var el = rootEl.querySelector('[data-cc-bot="' + idx + '"]');
      return {
        def: def,
        el: el,
        floatEl: el.querySelector('.cloud-crew__float'),
        shapeG: el.querySelector('.cloud-crew__shape g'),
        barEl: el.querySelector('.cloud-crew__bar b'),
        energy: 100,
        rate: 1,
        dead: false,
        pending: 0,
        level: '',
        lastProblem: null
      };
    });

    // ---- State ------------------------------------------------------------
    var state = 'ready'; // ready | playing | launch | won | over
    var score = 0;
    var rain = 0;
    var elapsed = 0;     // ms of play
    var inbox = [];      // waiting notifications (max MAX_INBOX)
    var openNote = null; // the opened notification
    var noteSeq = 0;
    var arriveQueue = [];
    var arriveIn = 0;
    var raised = false;
    var locked = false;
    var travel = 300;    // px the phone slides down when lowered
    var drag = null;
    var launch = null;
    var lastTs = 0;
    var raf = 0;
    var destroyed = false;
    var timers = [];
    var anims = [];
    var ro = null;

    function later(fn, ms) {
      var id = setTimeout(function () {
        timers = timers.filter(function (t) { return t !== id; });
        if (!destroyed) fn();
      }, ms);
      timers.push(id);
      return id;
    }
    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }
    function clearFx() {
      anims.forEach(function (a) { try { a.cancel(); } catch (_) {} });
      anims = [];
      fx.innerHTML = '';
      trailsEl.innerHTML = '';
    }

    // ---- Layout -----------------------------------------------------------
    // The sky always sits above the RAISED phone, so the clouds never hide.
    function layout() {
      var r = rootEl.getBoundingClientRect();
      var W = r.width;
      var H = r.height;
      var narrow = W < 640;
      var rows = narrow ? 2 : 1;
      var cols = narrow ? 4 : 7;
      rootEl.classList.toggle('is-narrow', narrow);
      rootEl.classList.toggle('is-roomy', !narrow && W >= 1000 && H >= 700);

      // Try the tall phone first; switch to the compact phone if the sky gets too small.
      var hudH = hudEl.offsetHeight;
      var needSky = rows * (70 * 0.81 + 42 + 8);
      rootEl.classList.remove('is-compact');
      var phoneH = measurePhone();
      if (H - hudH - (phoneH - BEZEL_HIDDEN) < needSky) {
        rootEl.classList.add('is-compact');
        phoneH = measurePhone();
      }
      var peek = head.offsetTop + head.offsetHeight + 6;
      travel = Math.max(0, phoneH - BEZEL_HIDDEN - peek);
      rootEl.style.setProperty('--cc-travel', travel + 'px');
      dock.style.height = Math.max(0, phoneH - BEZEL_HIDDEN + 6) + 'px';

      var skyW = sky.clientWidth - 16;
      var skyH = sky.clientHeight - 8;
      var textH = narrow ? 36 : 40; // name + bar
      var byW = (skyW / cols) * 0.9;
      var byH = ((skyH / rows) - textH - 8) / 0.81; // float = 0.67w + rain gap
      var maxW = narrow ? 120 : 160;
      var cw = clamp(Math.min(byW, byH, maxW), 40, maxW);
      rootEl.style.setProperty('--cc-cloud-w', Math.floor(cw) + 'px');
    }

    // Fix the phone screen height to its fullest content (longest texts, 2 queued),
    // so the raised/lowered positions never jump when notifications change.
    function measurePhone() {
      var saveInbox = inbox, saveOpen = openNote, saveLocked = locked;
      var longest = { id: -1, bot: 4, problem: 'Bluetooth link keeps dropping', sel: -1, feedback: null,
        choices: [{ text: 'Hold laptop over your head' }, { text: 'Upgrade the boring machine' }, { text: 'Laugh track on every reply' }] };
      inbox = [longest, { id: -2, bot: 0, problem: longest.problem }, { id: -3, bot: 1, problem: longest.problem }];
      openNote = longest;
      locked = false;
      screen.style.height = '';
      renderPhone();
      var h = screen.offsetHeight;
      screen.style.height = h + 'px';
      var total = device.offsetHeight;
      inbox = saveInbox; openNote = saveOpen; locked = saveLocked;
      renderPhone();
      return total;
    }

    // ---- HUD / overlay ----------------------------------------------------
    function updateHud() {
      scoreEl.textContent = String(score);
      var m = Math.min(score, WIN_SCORE);
      marsEl.textContent = String(m);
      marsFill.style.transform = 'scaleX(' + (m / WIN_SCORE).toFixed(3) + ')';
      rootEl.style.setProperty('--cc-progress', (m / WIN_SCORE).toFixed(3)); // Mars horizon rises
      rainEl.textContent = String(rain);
    }

    function floatText(text, kind) {
      var root = rootEl.getBoundingClientRect();
      var r = scoreBox.getBoundingClientRect();
      var el = document.createElement('div');
      el.className = 'cloud-crew__pop is-' + kind;
      el.textContent = text;
      el.style.left = (r.left - root.left + 4) + 'px';
      el.style.top = (r.bottom - root.top + 2) + 'px';
      el.addEventListener('animationend', function () { el.remove(); });
      fx.appendChild(el);
    }

    function showOverlay(mode) {
      overlay.hidden = false;
      overlay.setAttribute('data-mode', mode);
      if (mode === 'ready') {
        oTitle.innerHTML = 'Cloud <em>Crew</em>';
        hintEl.textContent = 'You\u2019re Elon Musk. Your phone keeps buzzing.';
        subEl.textContent = 'Raise the phone, pick the fix, hit Send. Reach ' + WIN_SCORE +
          ' points to unlock Mars. 3 rain clouds and it\u2019s over.';
        finalEl.textContent = '';
        playBtn.textContent = 'Play';
      } else if (mode === 'won') {
        oTitle.innerHTML = 'Mars <em class="cloud-crew__red">unlocked</em>';
        hintEl.textContent = 'The crew made it. Next stop: the red planet.';
        subEl.textContent = 'Time ' + fmtTime(elapsed) + ' \u00B7 ' + (BOTS.length - rain) + '/7 bots still flying';
        finalEl.textContent = 'Score ' + score;
        playBtn.textContent = 'Play again';
      } else {
        oTitle.innerHTML = 'Game <em>over</em>';
        hintEl.textContent = 'Three rain clouds. The crew needs a break.';
        subEl.textContent = 'Time ' + fmtTime(elapsed) + ' \u00B7 ' + Math.min(score, WIN_SCORE) + '/' + WIN_SCORE + ' to Mars';
        finalEl.textContent = 'Score ' + score;
        playBtn.textContent = 'Play again';
      }
      try { playBtn.focus({ preventScroll: true }); } catch (_) {}
    }

    // ---- Bots -------------------------------------------------------------
    function paintBot(b) {
      var e = b.energy;
      b.barEl.style.transform = 'scaleX(' + (e / 100).toFixed(3) + ')';
      var level = e < 25 ? 'low' : e < 50 ? 'mid' : 'ok';
      if (b.level !== level) {
        b.level = level;
        b.el.setAttribute('data-level', level);
      }
    }

    function paintMarks() {
      bots.forEach(function (b, idx) {
        var has = inbox.some(function (n) { return n.bot === idx; });
        b.el.classList.toggle('has-ping', has && !b.dead);
        b.el.classList.toggle('is-active', !!(raised && openNote && openNote.bot === idx && state === 'playing'));
      });
    }

    function killBot(b) {
      var idx = bots.indexOf(b);
      b.dead = true;
      b.energy = 0;
      b.el.classList.add('is-dead');
      b.shapeG.setAttribute('fill', 'url(#' + gGrey + ')');
      rain += 1;
      updateHud();
      inbox = inbox.filter(function (n) { return n.bot !== idx; });
      if (openNote && openNote.bot === idx) openNote = null;
      if (rain >= MAX_RAIN) {
        gameOver();
        return;
      }
      if (!locked) openBest();
      renderPhone();
    }

    function resetBots() {
      bots.forEach(function (b) {
        b.energy = Math.round(rand(72, 100));
        b.rate = rand(0.85, 1.15);
        b.dead = false;
        b.pending = 0;
        b.level = '';
        b.lastProblem = null;
        b.el.classList.remove('is-dead', 'is-active', 'is-fed', 'has-ping');
        b.shapeG.setAttribute('fill', 'url(#' + gWhite + ')');
        paintBot(b);
      });
    }

    // ---- Notifications ----------------------------------------------------
    function makeNote(idx) {
      var b = bots[idx];
      var list = b.def.problems;
      var p;
      do { p = pick(list); } while (list.length > 1 && p === b.lastProblem);
      b.lastProblem = p;
      var choices = shuffle([
        { text: p[1], ok: true },
        { text: p[2], ok: false },
        { text: p[3], ok: false }
      ]);
      var correctIndex = 0;
      choices.forEach(function (c, i) { if (c.ok) correctIndex = i; });
      return { id: ++noteSeq, bot: idx, problem: p[0], choices: choices, correctIndex: correctIndex,
        sel: -1, openedAt: 0, feedback: null };
    }

    function arrivalDelay() {
      var base = Math.max(ARRIVE_MIN, ARRIVE_START - (elapsed / 1000) * ARRIVE_RAMP);
      return base * rand(0.6, 1.4);
    }

    function addNote() {
      var cands = [];
      bots.forEach(function (b, idx) {
        if (b.dead || b.pending) return;
        if (inbox.some(function (n) { return n.bot === idx; })) return;
        cands.push(idx);
      });
      if (!cands.length) return false;
      var idx = Math.random() < LOW_BIAS
        ? cands.reduce(function (lo, i) { return bots[i].energy < bots[lo].energy ? i : lo; }, cands[0])
        : pick(cands);
      inbox.push(makeNote(idx));
      if (!raised) buzz();
      if (!locked) openBest();
      renderPhone();
      return true;
    }

    function removeNote(note) {
      inbox = inbox.filter(function (n) { return n !== note; });
      if (openNote === note) openNote = null;
    }

    // Opens the most urgent waiting notification (lowest bot energy) when the phone is up.
    function openBest() {
      if (!raised) return;
      if (openNote && inbox.indexOf(openNote) >= 0) return;
      openNote = null;
      if (!inbox.length) return;
      var best = inbox.reduce(function (lo, n) { return bots[n.bot].energy < bots[lo.bot].energy ? n : lo; }, inbox[0]);
      openNoteNow(best);
    }

    function openNoteNow(note) {
      openNote = note;
      note.openedAt = elapsed;
    }

    function buzz() {
      device.classList.remove('is-buzz');
      void device.offsetWidth;
      device.classList.add('is-buzz');
    }

    function tagHtml(b) {
      return '<span class="cloud-crew__tag" style="--cc-tag:' + b.def.color + '">' + esc(b.def.name) + '</span>';
    }

    function renderPhone() {
      var n = inbox.length;
      badgeEl.textContent = String(n);
      badgeEl.classList.toggle('is-zero', n === 0);
      titleEl.textContent = raised ? 'Inbox' : (n ? (n === 1 ? '1 new problem' : n + ' new problems') : 'No new problems');

      var html = '';
      var note = openNote;
      if (note) {
        var b = bots[note.bot];
        html +=
          '<div class="cloud-crew__note" style="--cc-tag:' + b.def.color + '">' +
          '<div class="cloud-crew__note-top">' + tagHtml(b) + '<span class="cloud-crew__note-time">now</span></div>' +
          '<div class="cloud-crew__note-text"><b>' + esc(b.def.name) + ':</b> ' + esc(note.problem) + '</div>' +
          '<div class="cloud-crew__choices">';
        note.choices.forEach(function (c, i) {
          var cls = 'cloud-crew__choice';
          if (note.sel === i) cls += ' is-selected';
          if (note.feedback) {
            if (i === note.correctIndex) cls += ' is-right';
            else if (i === note.sel) cls += ' is-wrong';
          }
          html += '<button type="button" class="' + cls + '" data-cc-choice="' + i + '"' + (locked ? ' disabled' : '') +
            '><kbd>' + (i + 1) + '</kbd><span>' + esc(c.text) + '</span></button>';
        });
        var canSend = note.sel >= 0 && !locked;
        html += '</div>' +
          '<button type="button" class="cloud-crew__send" data-cc-send' + (canSend ? '' : ' disabled') + '>' +
          (note.feedback === 'right' ? 'Sent' : note.feedback === 'wrong' ? 'Wrong fix' : 'Send') +
          '<kbd>Enter</kbd></button>' +
          '</div>';
      } else {
        html +=
          '<div class="cloud-crew__note is-empty">' +
          '<div class="cloud-crew__empty-title">All clear</div>' +
          '<div class="cloud-crew__empty-sub">New problems will buzz in soon.</div>' +
          '</div>';
      }
      var others = inbox.filter(function (x) { return x !== note; });
      html += '<div class="cloud-crew__queue">' +
        '<div class="cloud-crew__queue-label">' + (others.length ? 'Up next' : '') + '</div>';
      others.forEach(function (x) {
        var ob = bots[x.bot];
        html += '<button type="button" class="cloud-crew__row" data-cc-open="' + x.id + '"' + (locked ? ' disabled' : '') + '>' +
          tagHtml(ob) + '<span>' + esc(x.problem) + '</span></button>';
      });
      html += '</div>';
      screen.innerHTML = html;

      // compact phone: waiting notifications as chips in the header
      chipsEl.innerHTML = others.map(function (x) {
        return '<button type="button" class="cloud-crew__chip" data-cc-open="' + x.id + '" style="--cc-tag:' +
          bots[x.bot].def.color + '"' + (locked ? ' disabled' : '') + '>' + esc(bots[x.bot].def.name) + '</button>';
      }).join('');
      paintMarks();
    }

    // ---- Phone up / down --------------------------------------------------
    function setRaised(v) {
      if (state !== 'playing') v = false;
      raised = !!v;
      phone.classList.toggle('is-lowered', !raised);
      phone.style.transform = '';
      if (raised) {
        if (openNote) openNote.openedAt = elapsed;
        if (!locked) openBest();
      }
      renderPhone();
    }

    // ---- Answering --------------------------------------------------------
    function select(i) {
      if (state !== 'playing' || locked || !raised || !openNote) return;
      openNote.sel = i;
      renderPhone();
    }

    function centerOf(el) {
      var root = rootEl.getBoundingClientRect();
      var r = el.getBoundingClientRect();
      return { x: r.left - root.left + r.width / 2, y: r.top - root.top + r.height / 2 };
    }

    function makeDoc(text, from, bad) {
      var doc = document.createElement('div');
      doc.className = 'cloud-crew__doc' + (bad ? ' is-bad' : '');
      doc.innerHTML = '<div class="cloud-crew__doc-lines"><i></i><i></i></div><div class="cloud-crew__doc-text"></div>';
      doc.querySelector('.cloud-crew__doc-text').textContent = text;
      doc.style.left = from.x + 'px';
      doc.style.top = from.y + 'px';
      fx.appendChild(doc);
      return doc;
    }

    function track(anim, onDone) {
      anims.push(anim);
      anim.onfinish = function () {
        anims = anims.filter(function (a) { return a !== anim; });
        if (!destroyed && onDone) onDone();
      };
    }

    function send() {
      if (state !== 'playing' || locked || !raised || !openNote || openNote.sel < 0) return;
      var note = openNote;
      var b = bots[note.bot];
      var choice = note.choices[note.sel];
      var btn = screen.querySelector('[data-cc-choice="' + note.sel + '"]');
      var from = btn ? centerOf(btn) : centerOf(device);
      locked = true;

      if (choice.ok) {
        var fast = elapsed - note.openedAt <= FAST_MS;
        var gain = PTS_RIGHT + (fast ? PTS_FAST : 0);
        score += gain;
        note.feedback = 'right';
        floatText('+' + gain + (fast ? ' fast' : ''), 'good');
        b.pending += 1;
        var doc = makeDoc(choice.text, from, false);
        var to = centerOf(b.floatEl);
        var dx = to.x - from.x;
        var dy = to.y - from.y;
        var anim = doc.animate([
          { transform: 'translate(-50%, -50%) translate(0px, 0px) scale(1)', opacity: 1 },
          { transform: 'translate(-50%, -50%) translate(' + (dx * 0.45) + 'px, ' + (dy * 0.55 - 30) + 'px) scale(0.85)', opacity: 1, offset: 0.55 },
          { transform: 'translate(-50%, -50%) translate(' + dx + 'px, ' + dy + 'px) scale(0.3)', opacity: 0.15 }
        ], { duration: DOC_MS, easing: 'cubic-bezier(.45,.05,.55,.95)', fill: 'forwards' });
        track(anim, function () {
          doc.remove();
          b.pending = Math.max(0, b.pending - 1);
          if (b.dead || (state !== 'playing' && state !== 'launch')) return;
          b.energy = Math.min(100, b.energy + REFILL);
          paintBot(b);
          b.el.classList.remove('is-fed');
          void b.el.offsetWidth; // restart pulse
          b.el.classList.add('is-fed');
          later(function () { b.el.classList.remove('is-fed'); }, 600);
        });
      } else {
        score = Math.max(0, score - PTS_WRONG);
        note.feedback = 'wrong';
        floatText('\u2212' + PTS_WRONG, 'bad');
        device.classList.remove('is-bad');
        void device.offsetWidth;
        device.classList.add('is-bad');
        var bad = makeDoc(choice.text, from, true);
        var fall = bad.animate([
          { transform: 'translate(-50%, -50%) translate(0, 0) rotate(0deg)', opacity: 1 },
          { transform: 'translate(-50%, -50%) translate(18px, 140px) rotate(24deg)', opacity: 0 }
        ], { duration: 650, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' });
        track(fall, function () { bad.remove(); });
        b.energy = Math.max(0, b.energy - WRONG_PENALTY);
        paintBot(b);
      }
      updateHud();
      renderPhone();

      if (choice.ok && score >= WIN_SCORE) {
        later(startLaunch, 500);
        return;
      }
      if (!choice.ok && b.energy <= 0) {
        killBot(b);
        if (state !== 'playing') return;
      }
      later(function () {
        if (state !== 'playing') return;
        device.classList.remove('is-bad');
        removeNote(note);
        locked = false;
        if (!inbox.length) setRaised(false); // inbox clear: pocket the phone
        else { openBest(); renderPhone(); }
      }, choice.ok ? NEXT_OK_MS : NEXT_BAD_MS);
    }

    // ---- Mars launch --------------------------------------------------------
    function startLaunch() {
      if (state !== 'playing') return;
      state = 'launch';
      locked = true;
      setRaised(false);
      phone.classList.add('is-away');
      rootEl.classList.add('is-launching'); // sky fades so Mars stands out
      paintMarks();
      launchEl.hidden = false;
      planetEl.classList.remove('is-hit');
      var root = rootEl.getBoundingClientRect();
      var pr = planetEl.getBoundingClientRect();
      launch = {
        t: 0,
        trailT: 0,
        from: { x: root.width * 0.5, y: root.height + 40 },
        to: { x: pr.left - root.left + pr.width / 2, y: pr.top - root.top + pr.height / 2 },
        done: false
      };
      rocketEl.style.opacity = '1';
      updateLaunch(0);
    }

    function launchPos(e) {
      var L = launch;
      var x = L.from.x + (L.to.x - L.from.x) * e - Math.sin(Math.PI * e) * 50;
      var y = L.from.y + (L.to.y - L.from.y) * e;
      return { x: x, y: y };
    }

    function updateLaunch(dt) {
      var L = launch;
      if (!L || L.done) return;
      L.t += dt;
      var p = Math.min(1, L.t / LAUNCH_MS);
      var e = Math.pow(p, 1.7);
      var pos = launchPos(e);
      var ahead = launchPos(Math.min(1, e + 0.02));
      var ang = Math.atan2(ahead.x - pos.x, -(ahead.y - pos.y)) * 180 / Math.PI;
      if (p === 1) ang = 20;
      var s = 1 - 0.7 * e;
      var shake = p < 0.12 ? (Math.random() - 0.5) * 3 : 0;
      rocketEl.style.transform = 'translate(' + (pos.x + shake) + 'px,' + pos.y + 'px) translate(-50%, -50%) rotate(' +
        ang.toFixed(1) + 'deg) scale(' + s.toFixed(3) + ')';
      L.trailT -= dt;
      if (L.trailT <= 0 && p < 1) {
        L.trailT = 28;
        var rad = ang * Math.PI / 180;
        var back = 34 * s;
        var dot = document.createElement('i');
        dot.className = 'cloud-crew__trail';
        var size = (8 + Math.random() * 8) * (0.5 + s * 0.6);
        dot.style.width = dot.style.height = size.toFixed(1) + 'px';
        dot.style.left = (pos.x - Math.sin(rad) * back + (Math.random() - 0.5) * 4) + 'px';
        dot.style.top = (pos.y + Math.cos(rad) * back) + 'px';
        dot.addEventListener('animationend', function () { dot.remove(); });
        trailsEl.appendChild(dot);
      }
      if (p >= 1) {
        L.done = true;
        rocketEl.style.opacity = '0';
        planetEl.classList.add('is-hit');
        later(function () {
          state = 'won';
          showOverlay('won');
        }, 700);
      }
    }

    // ---- Loop -------------------------------------------------------------
    function drainRate() {
      return Math.min(DRAIN_MAX, DRAIN_BASE + (elapsed / 1000) * DRAIN_PER_SEC);
    }

    function tick(dt) {
      if (state === 'launch') { updateLaunch(dt); return; }
      if (state !== 'playing') return;
      elapsed += dt;

      // notifications arrive over time
      arriveIn -= dt;
      if (arriveIn <= 0) {
        if (inbox.length < MAX_INBOX && addNote()) {
          arriveIn = arriveQueue.length ? arriveQueue.shift() : arrivalDelay();
        } else {
          arriveIn = 900; // inbox full: try again shortly
        }
      }

      var d = drainRate() * (dt / 1000);
      for (var i = 0; i < bots.length; i++) {
        var b = bots[i];
        if (b.dead || b.pending) continue;
        b.energy = Math.max(0, b.energy - d * b.rate);
        paintBot(b);
        if (b.energy <= 0) {
          killBot(b);
          if (state !== 'playing') return;
        }
      }
    }

    function loop(ts) {
      if (destroyed) return;
      if (!lastTs) lastTs = ts;
      var dt = Math.min(50, ts - lastTs);
      lastTs = ts;
      tick(dt);
      raf = requestAnimationFrame(loop);
    }

    function startGame() {
      if (destroyed) return;
      clearTimers();
      clearFx();
      score = 0;
      rain = 0;
      elapsed = 0;
      inbox = [];
      openNote = null;
      locked = false;
      launch = null;
      drag = null;
      launchEl.hidden = true;
      rootEl.classList.remove('is-launching');
      planetEl.classList.remove('is-hit');
      phone.classList.remove('is-away', 'is-dragging');
      device.classList.remove('is-bad', 'is-buzz');
      resetBots();
      state = 'playing';
      arriveIn = ARRIVE_FIRST[0];
      arriveQueue = [ARRIVE_FIRST[1] - ARRIVE_FIRST[0]];
      setRaised(false);
      updateHud();
      overlay.hidden = true;
      rootEl.classList.add('is-playing');
      lastTs = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    }

    function gameOver() {
      state = 'over';
      locked = true;
      setRaised(false);
      paintMarks();
      rootEl.classList.remove('is-playing');
      later(function () { showOverlay('over'); }, 600);
    }

    // ---- Input ------------------------------------------------------------
    function isTyping(t) {
      if (!t || !t.tagName) return false;
      var tag = t.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
    }

    function onKey(e) {
      if (isTyping(e.target)) return;
      var t = e.target;
      var outsideControl = t && t.nodeType === 1 && t !== document.body &&
        !rootEl.contains(t) && /^(A|BUTTON)$/.test(t.tagName);
      if (outsideControl) return;
      var code = e.code;
      if (state === 'playing') {
        if (code === 'Space' || code === 'KeyP') {
          e.preventDefault();
          if (!e.repeat) setRaised(!raised);
          return;
        }
        var n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[code];
        if (n !== undefined) {
          e.preventDefault();
          if (!raised) setRaised(true);
          else select(n);
          return;
        }
        if (code === 'Enter' || code === 'NumpadEnter') {
          e.preventDefault();
          send();
        }
        return;
      }
      if (code === 'Space' || code === 'Enter' || code === 'NumpadEnter') {
        if (state === 'launch') { e.preventDefault(); return; }
        if (overlay.hidden || e.target === playBtn) return; // the focused button clicks itself
        e.preventDefault();
        startGame();
      }
    }

    // Touch taps on buttons fire on pointerup (fast, and doesn't depend on the
    // browser synthesizing a click after a swipe); the follow-up click is ignored.
    var tapBtn = null;
    var lastTouchAct = -1e9;
    function onScreenClick(e) {
      if (performance.now() - lastTouchAct < 700) return;
      activate(e.target.closest ? e.target.closest('button') : null);
    }
    function btnKey(b) {
      return ['data-cc-choice', 'data-cc-send', 'data-cc-open'].map(function (a) {
        return b.getAttribute(a);
      }).join('|');
    }
    function activate(t) {
      if (!t || !rootEl.contains(t) || state !== 'playing') return;
      if (t.hasAttribute('data-cc-choice')) {
        select(Number(t.getAttribute('data-cc-choice')));
      } else if (t.hasAttribute('data-cc-send')) {
        send();
      } else if (t.hasAttribute('data-cc-open')) {
        if (locked || !raised) return;
        var id = Number(t.getAttribute('data-cc-open'));
        var note = inbox.filter(function (x) { return x.id === id; })[0];
        if (note) { openNoteNow(note); renderPhone(); }
      }
    }

    // Tap / drag on the phone: lowered = whole phone; raised = header strip only.
    function onPhoneDown(e) {
      if (state !== 'playing' || drag) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (raised && (screen.contains(e.target) || chipsEl.contains(e.target))) {
        var b = e.pointerType !== 'mouse' && e.target.closest ? e.target.closest('button') : null;
        tapBtn = b ? { btn: b, id: e.pointerId, x: e.clientX, y: e.clientY } : null;
        return;
      }
      drag = { id: e.pointerId, y0: e.clientY, base: raised ? 0 : travel, moved: false, wasRaised: raised };
      phone.classList.add('is-dragging');
      try { phone.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    }
    function onPhoneMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = e.clientY - drag.y0;
      if (Math.abs(dy) > 8) drag.moved = true;
      var off = clamp(drag.base + dy, 0, travel);
      phone.style.transform = 'translate(-50%, ' + off + 'px)';
      e.preventDefault();
    }
    function onPhoneUp(e) {
      if (tapBtn && e.pointerId === tapBtn.id) {
        var tb = tapBtn;
        tapBtn = null;
        var under = document.elementFromPoint(e.clientX, e.clientY);
        var ub = under && under.closest ? under.closest('button') : null;
        // compare by role, not node: the phone may re-render between down and up
        if (e.type === 'pointerup' && ub && btnKey(ub) === btnKey(tb.btn) &&
            Math.abs(e.clientX - tb.x) < 12 && Math.abs(e.clientY - tb.y) < 12) {
          lastTouchAct = performance.now();
          activate(ub);
        }
        return;
      }
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag;
      var dy = e.clientY - d.y0;
      drag = null;
      phone.classList.remove('is-dragging');
      phone.style.transform = '';
      if (e.type === 'pointercancel' || state !== 'playing') { setRaised(d.wasRaised); return; }
      if (!d.moved) setRaised(!d.wasRaised);
      else if (dy < -30) setRaised(true);
      else if (dy > 30) setRaised(false);
      else setRaised(d.wasRaised);
    }

    function onPlayClick(e) {
      e.stopPropagation();
      startGame();
    }

    phone.addEventListener('pointerdown', onPhoneDown);
    phone.addEventListener('pointermove', onPhoneMove);
    phone.addEventListener('pointerup', onPhoneUp);
    phone.addEventListener('pointercancel', onPhoneUp);
    phone.addEventListener('click', onScreenClick);
    playBtn.addEventListener('click', onPlayClick);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', layout);
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(layout);
      ro.observe(rootEl);
    }

    resetBots();
    updateHud();
    renderPhone();
    layout();
    showOverlay('ready');
    raf = requestAnimationFrame(loop);

    return {
      start: startGame,
      destroy: function () {
        destroyed = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        clearTimers();
        clearFx();
        phone.removeEventListener('pointerdown', onPhoneDown);
        phone.removeEventListener('pointermove', onPhoneMove);
        phone.removeEventListener('pointerup', onPhoneUp);
        phone.removeEventListener('pointercancel', onPhoneUp);
        phone.removeEventListener('click', onScreenClick);
        playBtn.removeEventListener('click', onPlayClick);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', layout);
        if (ro) ro.disconnect();
        rootEl.innerHTML = '';
        rootEl.classList.remove('cloud-crew', 'is-narrow', 'is-roomy', 'is-compact', 'is-playing', 'is-launching');
        rootEl.style.removeProperty('--cc-cloud-w');
        rootEl.style.removeProperty('--cc-travel');
        rootEl.style.removeProperty('--cc-progress');
      },
      getState: function () {
        return {
          state: state,
          score: score,
          rain: rain,
          seconds: Math.round(elapsed / 100) / 10,
          drain: Math.round(drainRate() * 100) / 100,
          raised: raised,
          compact: rootEl.classList.contains('is-compact'),
          locked: locked,
          inbox: inbox.map(function (n) { return { id: n.id, bot: bots[n.bot].def.name, problem: n.problem }; }),
          open: openNote && {
            id: openNote.id,
            bot: bots[openNote.bot].def.name,
            problem: openNote.problem,
            choices: openNote.choices.map(function (c) { return c.text; }),
            correctIndex: openNote.correctIndex,
            selected: openNote.sel
          },
          bots: bots.map(function (b) {
            return { name: b.def.name, energy: Math.round(b.energy * 10) / 10, dead: b.dead };
          })
        };
      }
    };
  }

  global.initCloudCrew = initCloudCrew;
})(typeof window !== 'undefined' ? window : this);
