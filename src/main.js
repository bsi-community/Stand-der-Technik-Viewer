import './styles/index.css';
import { startViewer } from './app/bootstrap.js';
// The production HTML checks for a newer release before any document can be loaded.
// Development has no release manifest and starts immediately.
Promise.resolve(window.__viewerReady).then((ready) => {
  if (ready !== false) startViewer();
});
