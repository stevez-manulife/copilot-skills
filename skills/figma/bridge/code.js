figma.showUI(__html__, { width: 280, height: 150 });

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function toSerializable(value) {
  try {
    return JSON.parse(JSON.stringify(value === undefined ? null : value));
  } catch (e) {
    return String(value);
  }
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'saveToken') {
    await figma.clientStorage.setAsync('bridgeToken', msg.token);
    return;
  }
  if (msg.type === 'run') {
    try {
      const value = await new AsyncFunction('figma', msg.script)(figma);
      figma.ui.postMessage({ type: 'result', id: msg.id, ok: true, value: toSerializable(value) });
    } catch (e) {
      figma.ui.postMessage({
        type: 'result',
        id: msg.id,
        ok: false,
        error: String((e && e.stack) || e),
      });
    }
  }
};

figma.clientStorage.getAsync('bridgeToken').then((token) => {
  figma.ui.postMessage({ type: 'token', token: token || '' });
});
