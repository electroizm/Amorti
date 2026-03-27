/**
 * AMØRT! — Vite Entry Point
 */
import './style.css';
import App from './js/app.js';
import { ikonlariGuncelle } from './js/ikonlar.js';

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  ikonlariGuncelle();
});
