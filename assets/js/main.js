(() => {
  'use strict';

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const body = document.body;

  // Keep the copyright current while retaining a useful no-JavaScript fallback.
  document.querySelectorAll('[data-current-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  // User-controlled motion preference. Reduced-motion users start paused but can opt back in.
  const motionButtons = [...document.querySelectorAll('[data-motion-toggle]')];
  let motionPaused = reducedMotionQuery.matches;
  try {
    const saved = window.localStorage.getItem('portfolio-motion-paused');
    if (saved !== null) motionPaused = saved === 'true';
  } catch {
    // Local storage may be unavailable in privacy-restricted browsers.
  }

  const applyMotionState = (paused) => {
    motionPaused = paused;
    body.classList.toggle('motion-paused', paused);
    motionButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(paused));
      const label = button.querySelector('[data-motion-label]');
      if (label) label.textContent = paused ? 'Resume motion' : 'Pause motion';
    });
    try {
      window.localStorage.setItem('portfolio-motion-paused', String(paused));
    } catch {
      // The preference still applies for the current page.
    }
  };
  motionButtons.forEach((button) => {
    button.addEventListener('click', () => applyMotionState(!motionPaused));
  });
  applyMotionState(motionPaused);

  // Scroll progress.
  const progress = document.querySelector('[data-page-progress]');
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  // Progressive enhancement: content is always visible. Supporting browsers add a one-off entrance animation.
  if (!reducedMotionQuery.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.animate(
          [
            { opacity: 0, transform: 'translateY(18px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ],
          { duration: 620, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' },
        );
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }

  // Live UK clock.
  const clock = document.querySelector('[data-clock]');
  if (clock) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const tick = () => { clock.textContent = formatter.format(new Date()); };
    tick();
    window.setInterval(tick, 1000);
  }

  // Safe terminal output: visitor input is always inserted as text, never interpreted as HTML.
  const feed = document.querySelector('[data-console-feed]');
  const consoleInput = document.querySelector('[data-console-input]');
  const consoleForm = document.querySelector('[data-console-form]');

  const addConsoleLine = (key, options = {}) => {
    if (!feed) return;
    const row = document.createElement('div');
    const label = document.createElement('span');
    const value = document.createElement('strong');
    label.textContent = key;

    if (options.pulse) {
      const pulse = document.createElement('i');
      pulse.className = 'pulse';
      pulse.setAttribute('aria-hidden', 'true');
      value.append(pulse);
    }

    if (options.href) {
      const link = document.createElement('a');
      link.href = options.href;
      link.textContent = options.text || options.href;
      value.append(link);
    } else {
      value.append(document.createTextNode(options.text || ''));
    }

    row.append(label, value);
    feed.append(row);
    feed.scrollTop = feed.scrollHeight;
    while (feed.children.length > 7) feed.firstElementChild?.remove();
  };

  const executeCommand = (raw) => {
    const original = raw.trim();
    const command = original.toLowerCase();
    if (!command) return;

    if (command === 'help') {
      addConsoleLine('commands', { text: 'whoami / work / status / contact' });
    } else if (command === 'whoami') {
      addConsoleLine('profile', { text: 'Tom Couchman · aspiring SOC analyst' });
    } else if (command === 'work') {
      addConsoleLine('project', { text: 'HomeSOC Log Analyzer →', href: 'work.html' });
    } else if (command === 'status') {
      addConsoleLine('status', { text: 'Security+ study active', pulse: true });
    } else if (command === 'contact') {
      addConsoleLine('email', { text: 'thomas.couchman@proton.me', href: 'mailto:thomas.couchman@proton.me' });
    } else {
      addConsoleLine('error', { text: `Unknown command: ${original}` });
    }
  };

  consoleForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    executeCommand(consoleInput?.value || '');
    if (consoleInput) consoleInput.value = '';
  });
  document.querySelectorAll('[data-console-command]').forEach((button) => {
    button.addEventListener('click', () => executeCommand(button.dataset.consoleCommand || ''));
  });

  // Native dialog command palette with labels, focus return and keyboard shortcut.
  const dialog = document.querySelector('[data-command-dialog]');
  const commandSearch = dialog?.querySelector('[data-command-search]');
  const commandItems = [...(dialog?.querySelectorAll('[data-command-item]') || [])];
  let commandOpener = null;

  const openCommandPalette = () => {
    if (!dialog || dialog.open) return;
    commandOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    if (commandSearch) {
      commandSearch.value = '';
      commandItems.forEach((item) => { item.hidden = false; });
      window.setTimeout(() => commandSearch.focus(), 20);
    }
  };

  document.querySelectorAll('[data-open-command]').forEach((button) => {
    button.addEventListener('click', openCommandPalette);
  });
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target?.isContentEditable;
    if (event.key === '/' && !typing) {
      event.preventDefault();
      openCommandPalette();
    }
  });
  commandSearch?.addEventListener('input', () => {
    const query = commandSearch.value.trim().toLowerCase();
    commandItems.forEach((item) => {
      item.hidden = !item.textContent.toLowerCase().includes(query);
    });
  });
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog?.addEventListener('close', () => commandOpener?.focus());

  // HomeSOC interactive explanation and sample rule engine.
  const lab = document.querySelector('[data-soc-lab]');
  if (lab) {
    const threshold = lab.querySelector('[data-threshold]');
    const thresholdOutput = lab.querySelector('[data-threshold-output]');
    const rows = [...lab.querySelectorAll('[data-source-row]')];
    const triggeredCount = lab.querySelector('[data-triggered-count]');
    const summary = lab.querySelector('[data-lab-summary]');
    const runButton = lab.querySelector('[data-run-lab]');
    const pipeline = [...lab.querySelectorAll('[data-pipeline-step]')];
    const tabs = [...lab.querySelectorAll('[data-explainer-key]')];
    const explainerPanel = lab.querySelector('#project-explainer');
    const explainerTitle = lab.querySelector('[data-explainer-title]');
    const explainerText = lab.querySelector('[data-explainer-text]');
    const explainerList = lab.querySelector('[data-explainer-list]');

    const explainerData = {
      input: ['Input', 'HomeSOC reads SSH authentication-log entries and extracts each failed-login event before any judgement is applied.', ['Authentication log entries', 'Source IP address', 'Failed-login event']],
      process: ['Detection', 'The script groups failed-login events by source IP so repeated activity becomes visible instead of remaining scattered through the raw log.', ['Parse matching events', 'Group by source IP', 'Count attempts per source']],
      decision: ['Decision', 'A visible rule assigns HIGH, MEDIUM or CLEAR status. The adjustable medium threshold shows exactly how the classification changes.', ['HIGH at 10+ failures', 'MEDIUM at chosen threshold', 'CLEAR below threshold']],
      output: ['Report', 'The final output is a short incident summary that identifies the source, failure count, severity and the action an analyst should consider.', ['Prioritised sources', 'Severity label', 'Readable incident summary']],
    };

    const renderLab = () => {
      const mediumThreshold = Number(threshold?.value || 5);
      let triggered = 0;

      rows.forEach((row) => {
        const failures = Number(row.dataset.failures || 0);
        const badge = row.querySelector('[data-severity]');
        if (!badge) return;
        let label = 'CLEAR';
        let severityClass = 'clear';
        if (failures >= 10) {
          label = 'HIGH';
          severityClass = 'high';
          triggered += 1;
        } else if (failures >= mediumThreshold) {
          label = 'MEDIUM';
          severityClass = 'medium';
          triggered += 1;
        }
        badge.textContent = label;
        badge.className = `severity ${severityClass}`;
      });

      if (thresholdOutput) thresholdOutput.textContent = `${String(mediumThreshold).padStart(2, '0')} FAILURES`;
      if (triggeredCount) triggeredCount.textContent = String(triggered).padStart(2, '0');
      if (summary) {
        summary.textContent = triggered === 1
          ? '1 of 3 sources is flagged at the current rule setting.'
          : `${triggered} of 3 sources are flagged at the current rule setting.`;
      }
    };

    const buildExplainerList = (items) => {
      if (!explainerList) return;
      const fragment = document.createDocumentFragment();
      items.forEach((item, index) => {
        const row = document.createElement('div');
        const number = document.createElement('span');
        const text = document.createElement('p');
        number.textContent = String(index + 1);
        text.textContent = item;
        row.append(number, text);
        fragment.append(row);
      });
      explainerList.replaceChildren(fragment);
    };

    const activateProjectTab = (tab, focus = false) => {
      const key = tab.dataset.explainerKey;
      const details = explainerData[key];
      if (!details) return;
      tabs.forEach((candidate) => {
        const selected = candidate === tab;
        candidate.classList.toggle('is-active', selected);
        candidate.setAttribute('aria-selected', String(selected));
        candidate.tabIndex = selected ? 0 : -1;
      });
      if (explainerPanel) explainerPanel.setAttribute('aria-labelledby', tab.id);
      if (explainerTitle) explainerTitle.textContent = details[0];
      if (explainerText) explainerText.textContent = details[1];
      buildExplainerList(details[2]);
      if (focus) tab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateProjectTab(tab));
      tab.addEventListener('keydown', (event) => {
        let targetIndex = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') targetIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') targetIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') targetIndex = 0;
        if (event.key === 'End') targetIndex = tabs.length - 1;
        if (targetIndex === null) return;
        event.preventDefault();
        activateProjectTab(tabs[targetIndex], true);
      });
    });

    threshold?.addEventListener('input', renderLab);
    runButton?.addEventListener('click', () => {
      runButton.setAttribute('aria-busy', 'true');
      pipeline.forEach((step) => step.classList.remove('is-live'));
      const noMotion = reducedMotionQuery.matches || motionPaused;
      const delays = noMotion ? [0, 0, 0, 0] : [0, 420, 840, 1260];
      pipeline.forEach((step, index) => {
        window.setTimeout(() => step.classList.add('is-live'), delays[index]);
      });
      window.setTimeout(() => {
        renderLab();
        if (summary) summary.textContent = `Analysis complete. ${triggeredCount?.textContent || '0'} of 3 sources are flagged.`;
        runButton.removeAttribute('aria-busy');
      }, noMotion ? 0 : 1450);
    });

    renderLab();
    if (tabs[0]) activateProjectTab(tabs[0]);
  }

  // Profile working-method tabs.
  const method = document.querySelector('[data-method-switcher]');
  if (method) {
    const methodData = {
      observe: ['01', 'Notice what changed.', 'Start with the evidence, separate the unusual from the merely busy, and avoid deciding the answer before examining the detail.'],
      record: ['02', 'Leave useful notes.', 'Document what happened, what was checked, what remains uncertain, and what the next person needs to know.'],
      escalate: ['03', 'Pass on context, not panic.', 'Raise the issue at the right time with enough evidence for someone else to make a sound decision quickly.'],
    };
    const tabs = [...method.querySelectorAll('[data-method]')];
    const panel = method.querySelector('.method-output');
    const title = method.querySelector('[data-method-title]');
    const text = method.querySelector('[data-method-text]');

    const activateMethodTab = (tab, focus = false) => {
      const value = methodData[tab.dataset.method];
      if (!value) return;
      tabs.forEach((candidate) => {
        const selected = candidate === tab;
        candidate.classList.toggle('is-active', selected);
        candidate.setAttribute('aria-selected', String(selected));
        candidate.tabIndex = selected ? 0 : -1;
      });
      if (panel) {
        panel.dataset.number = value[0];
        panel.setAttribute('aria-labelledby', tab.id);
      }
      if (title) title.textContent = value[1];
      if (text) text.textContent = value[2];
      if (focus) tab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateMethodTab(tab));
      tab.addEventListener('keydown', (event) => {
        let targetIndex = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') targetIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') targetIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') targetIndex = 0;
        if (event.key === 'End') targetIndex = tabs.length - 1;
        if (targetIndex === null) return;
        event.preventDefault();
        activateMethodTab(tabs[targetIndex], true);
      });
    });
  }

  // Clipboard interaction with a fallback and a screen-reader status message.
  const copyEmail = document.querySelector('[data-copy-email]');
  const copyStatus = document.querySelector('[data-copy-status]');
  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    textarea.remove();
    return success;
  };

  copyEmail?.addEventListener('click', async () => {
    const email = copyEmail.dataset.email || '';
    const originalText = copyEmail.textContent;
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(email);
        copied = true;
      } else {
        copied = fallbackCopy(email);
      }
    } catch {
      copied = false;
    }

    copyEmail.textContent = copied ? 'Copied' : 'Select email above';
    if (copyStatus) copyStatus.textContent = copied ? 'Email address copied to clipboard.' : 'Copying was unavailable. Select the email address manually.';
    window.setTimeout(() => { copyEmail.textContent = originalText; }, 1600);
  });
})();
