// client/src/config.ts

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

export { API_BASE_URL, WS_BASE_URL };
