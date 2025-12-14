const DEFAULT_BASE = 'https://betchatapp.geminigroq.repl.co';

function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ bantah_base: DEFAULT_BASE, bantah_notify: true, bantah_interval_minutes: 5 }, (res) => {
      resolve(res);
    });
  });
}

function saveSettings(settings) {
  chrome.storage.sync.set(settings);
}

function openUrl(base, path = '/') {
  try {
    const url = new URL(path, base).toString();
    chrome.tabs.create({ url });
  } catch (e) {
    chrome.tabs.create({ url: base });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const baseInput = document.getElementById('baseUrl');
  const saveBtn = document.getElementById('save-url');
  const openRoot = document.getElementById('open-root');
  const openEvents = document.getElementById('open-events');
  const openCreate = document.getElementById('open-create');
  const quickLogin = document.getElementById('quick-login');
  const openTab = document.getElementById('open-tab');
  const notifyToggle = document.getElementById('notifyToggle');
  const intervalInput = document.getElementById('interval');

  const settings = await getSettings();
  baseInput.value = settings.bantah_base || DEFAULT_BASE;
  notifyToggle.checked = settings.bantah_notify !== false;
  intervalInput.value = settings.bantah_interval_minutes || 5;

  saveBtn.addEventListener('click', () => {
    const v = baseInput.value || DEFAULT_BASE;
    const minutes = parseInt(intervalInput.value, 10) || 5;
    const notify = notifyToggle.checked;
    saveSettings({ bantah_base: v, bantah_interval_minutes: minutes, bantah_notify: notify });
    // reconfigure background alarm
    chrome.alarms.create('bantah_poll_notifications', { periodInMinutes: Math.max(1, minutes) });
    window.close();
  });

  openRoot.addEventListener('click', () => openUrl(baseInput.value || DEFAULT_BASE, '/'));
  openEvents.addEventListener('click', () => openUrl(baseInput.value || DEFAULT_BASE, '/events'));
  openCreate.addEventListener('click', () => openUrl(baseInput.value || DEFAULT_BASE, '/events/create'));
  openTab.addEventListener('click', () => chrome.tabs.create({ url: baseInput.value || DEFAULT_BASE }));

  quickLogin.addEventListener('click', () => {
    // Quick login: open site homepage with query param to trigger login UI if your app supports it
    openUrl(baseInput.value || DEFAULT_BASE, '/?show_login=1');
  });

  notifyToggle.addEventListener('change', () => {
    const minutes = parseInt(intervalInput.value, 10) || 5;
    saveSettings({ bantah_base: baseInput.value || DEFAULT_BASE, bantah_interval_minutes: minutes, bantah_notify: notifyToggle.checked });
    if (notifyToggle.checked) {
      chrome.alarms.create('bantah_poll_notifications', { periodInMinutes: Math.max(1, minutes) });
    } else {
      chrome.alarms.clear('bantah_poll_notifications');
    }
  });

  // Trigger an immediate poll
  document.getElementById('open-root').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'trigger-poll' });
  });
});